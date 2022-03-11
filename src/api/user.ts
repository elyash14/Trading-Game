import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient();

const userRouter = express.Router();
userRouter.use(express.json());

/**
 * @api {get} /shares Get all shares
 */
userRouter.get('/users', async (_req: Request, res: Response) => {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            username: true,
            name: true,
            role: true,
            portfolio: {
                select: {
                    name: true,
                    tradeHistories: {
                        select: {
                            count: true,
                            createdAt: true,
                            share: {
                                select: {
                                    symbol: true,
                                    rate: true,
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    res.json(users);
});

export default userRouter;