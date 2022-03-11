import express, { Request, Response } from 'express';
import { OrderStatus, OrderType, PrismaClient } from '@prisma/client'
import { sellOrderValidation } from '../validations/orderValidation';

const prisma = new PrismaClient();

const orderRouter = express.Router();
orderRouter.use(express.json());

/**
 * @api {get} /order/sell Sell a share
 * @body {symbol: string, count: number}
 */
orderRouter.post('/orders/sell', async (req: Request, res: Response) => {
    const user = req.user;

    // validate request
    const { error } = sellOrderValidation.validate(req.body);
    if (error) {
        return res.status(400).send({ message: error.details[0].message });
    }

    const { symbol, count } = req.body;

    // find share in database
    const share = await prisma.share.findFirst({
        where: { symbol: symbol }
    });

    if (!share) {
        return res.status(400).send({ message: 'Share not found' });
    }

    // get user portfolio
    const portfolio = await prisma.portfolio.findFirst({
        where: { userId: user?.id }
    })

    if (!portfolio) {
        return res.status(400).send({ message: "You don't have a portfolio" });
    }

    // get current count of this share
    const currentCount = await prisma.trade.aggregate({
        where: {
            shareId: share.id,
            portfolioId: portfolio.id
        },
        _sum: {
            count: true
        }
    });

    // check user has enough count of this share in their portfolio
    if (currentCount._sum.count === null) {
        return res.status(400).send({ message: 'You do not have any counts of this share in your portfolio' });
    }
    if (currentCount._sum.count < Number(count)) {
        return res.status(400).send({ message: 'You do not have enough counts of this share in your portfolio' });
    }

    // create new trading Order
    await prisma.order.create({
        data: {
            portfolioId: portfolio.id,
            shareId: share.id,
            count: Number(count),
            type: OrderType.SELL,
        }
    });

    res.json({ message: 'Order created successfully' });
});

/**
 * @api {get} /order/buy Buy a share
 * @body {symbol: string, count: number}
 */
orderRouter.post('/orders/buy', async (req: Request, res: Response) => {
    const user = req.user;

    // validate request
    const { error } = sellOrderValidation.validate(req.body);
    if (error) {
        return res.status(400).send({ message: error.details[0].message });
    }

    const { symbol, count } = req.body;

    // find share in database
    const share = await prisma.share.findFirst({
        where: { symbol: symbol }
    });

    if (!share) {
        return res.status(400).send({ message: 'Share not found' });
    }

    // check if the share has enough count to buy
    if (share.count < Number(count)) {
        return res.status(400).send({ message: 'The share has not enough count to buy' });
    }

    // get user portfolio
    const portfolio = await prisma.portfolio.findFirst({
        where: { userId: user?.id }
    })

    if (!portfolio) {
        return res.status(400).send({ message: "You don't have a portfolio" });
    }

    // create new trading Order
    await prisma.order.create({
        data: {
            portfolioId: portfolio.id,
            shareId: share.id,
            count: Number(count),
            type: OrderType.BUY,
        }
    });

    res.json({ message: 'Order created successfully' });
});


/**
 * @api {get} /orders/cancel/:id Cancel an order
 */
orderRouter.delete('/orders/cancel/:id', async (req: Request, res: Response) => {
    const user = req.user;

    // validate request
    const order = await prisma.order.findFirst({
        where: {
            id: Number(req.params.id),
            status: OrderStatus.PENDING
        },
        include: { portfolio: true }
    });

    // check order exists
    if (!order) {
        return res.status(400).send({ message: 'Order not found' });
    }

    // check if the order belongs to the user
    if (order.portfolio.userId !== user?.id) {
        return res.status(403).send({ message: 'You are not the owner of this order' });
    }

    // cancel order
    await prisma.order.update({
        where: { id: order.id },
        data: {
            status: OrderStatus.CANCELED
        }
    });

    res.json({ message: 'Order canceled successfully' });
});

export default orderRouter;