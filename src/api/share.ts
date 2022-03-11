import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client'
import { updateShareValidation } from '../validations/shareValidation';
import moment from 'moment';

const prisma = new PrismaClient();

const shareRouter = express.Router();
shareRouter.use(express.json());

/**
 * @api {get} /shares Get all shares
 */
shareRouter.get('/shares', async (req: Request, res: Response) => {
    const shares = await prisma.share.findMany();
    res.json(shares);
});

/**
 * @api {get} /shares/update update share by symbol
 * @body {symbol: string, rate: number}
 */
shareRouter.put('/shares/update', async (req: Request, res: Response) => {
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

export default shareRouter;