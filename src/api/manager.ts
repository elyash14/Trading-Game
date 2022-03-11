import express, { Request, Response } from 'express';
import { OrderStatus, OrderType, Prisma, PrismaClient } from '@prisma/client'
import { updateShareValidation } from '../validations/shareValidation';
import moment from 'moment';
import { orderResolver } from '../utilities/order';

const prisma = new PrismaClient();

const managerRouter = express.Router();
managerRouter.use(express.json());

/**
 * @api {get} /shares Get all shares
 */
managerRouter.get('/shares', async (req: Request, res: Response) => {
    const shares = await prisma.share.findMany();
    res.json(shares);
});

/**
 * @api {get} /shares/update update share by symbol
 * @body {symbol: string, rate: number}
 */
managerRouter.put('/shares/update', async (req: Request, res: Response) => {
    // check user has MANAGER role
    const user = req.user;
    if (user?.role !== 'MANAGER') {
        return res.status(401).send({ message: 'Unauthorized' });
    }

    // validate request
    const { error } = updateShareValidation.validate(req.body);

    if (error) {
        return res.status(400).send({ message: error.details[0].message });
    }

    const { symbol, rate } = req.body;

    // find share in database
    const share = await prisma.share.findFirst({
        where: { symbol: symbol }
    });

    if (!share) {
        return res.status(400).send({ message: 'Share not found' });
    }

    // check if share is already updated the last hour

    const lastUpdate = moment(share.updatedAt);
    if (lastUpdate.add(1, 'hour') > moment()) {
        return res.status(400).send({ message: 'The rate of this share is already updated at' + lastUpdate.format('HH:mm') });
    }

    // update share
    const updatedShare = await prisma.share.update({
        where: {
            id: share.id
        },
        data: {
            rate: Number(rate),
            updatedAt: new Date()
        },
    })

    res.json(updatedShare);
});

/**
 * @api {get} /orders/resolve resolve all possible pending orders
 */
managerRouter.get('/orders/resolve', async (req: Request, res: Response) => {
    // check user has MANAGER role
    const user = req.user;
    if (user?.role !== 'MANAGER') {
        return res.status(401).send({ message: 'Unauthorized' });
    }

    // get all pending orders of type buy
    const buyOrders = await prisma.order.findMany({
        where: {
            status: OrderStatus.PENDING,
            type: OrderType.BUY
        }
    });

    const message: string[] = [];

    for (const order of buyOrders) {
        // check enough count for sell for this share
        const availableCount = await prisma.order.aggregate({
            where: {
                status: OrderStatus.PENDING,
                type: OrderType.SELL,
                shareId: order.shareId,
            },
            _sum: { 'count': true }
        });

        if (availableCount._sum.count === null || availableCount._sum.count < order.count) {
            message.push(`The buying order number ${order.id} was not resolved in this round.`);
            continue;
        }

        const sellOrders = await prisma.order.findMany({
            where: {
                status: OrderStatus.PENDING,
                type: OrderType.SELL,
                shareId: order.shareId,
            }
        });

        if (!sellOrders) {
            message.push(`The buying order number ${order.id} was not resolved in this round.`);
            continue;
        }

        // find candidate selling orders to resolve this order
        const candidateForResolveOrders = orderResolver(order, sellOrders);

        if (candidateForResolveOrders.length === 0) {
            message.push(`The buying order number ${order.id} was not resolved in this round.`);
        }

        const updateIds = candidateForResolveOrders.map(c => c.id);
        updateIds.push(order.id);

        const tradesData = candidateForResolveOrders.map(candidate => {
            return {
                portfolioId: candidate.portfolioId,
                shareId: candidate.shareId,
                count: - candidate.count,
            }
        });

        tradesData.push({
            portfolioId: order.portfolioId,
            shareId: order.shareId,
            count: order.count,
        });

        // use transaction to save all data
        await prisma.$transaction([
            // change status of the order and candidate orders
            prisma.order.updateMany({
                where: {
                    id: {
                        in: updateIds
                    }
                },
                data: {
                    status: OrderStatus.SUCCESS,
                }
            }),

            // create new trade for buyer and candidate sellers
            prisma.trade.createMany({
                data: tradesData
            }),
        ]);

        message.push(`The buying order number ${order.id} was resolved.`);
    }

    res.json({ message });
});

export default managerRouter;