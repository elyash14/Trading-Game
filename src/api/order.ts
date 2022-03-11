import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client'
import { sellOrderValidation } from '../validations/orderValidation';

const prisma = new PrismaClient();

const orderRouter = express.Router();
orderRouter.use(express.json());


orderRouter.post('/order/sell', async (req: Request, res: Response) => {
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
            type: 'SELL',
        }
    });

    res.json({ message: 'Order created successfully' });
});

export default orderRouter;