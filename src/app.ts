import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import shareRouter from './api/share';
import { afterLogin, basicAuthOptions } from './utilities/auth';
import { User } from '@prisma/client';
import basicAuth from 'express-basic-auth';
import userRouter from './api/user';
import orderRouter from './api/order';

dotenv.config()
const { PORT } = process.env;

declare global {
    namespace Express {
        interface Request {
            user?: User
        }
    }
}

// initial app server

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(basicAuth(basicAuthOptions), async (req, res, next) => {
    await afterLogin(req);
    next()
});


app.use((_req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, AUTHORIZATION'
    );
    next();
});

/**
 * @api {get} /ping
 */
app.get('/ping', (_req: Request, res: Response) => {
    res.send('pong');
});

// set all routes
app.use(shareRouter);
app.use(userRouter);
app.use(orderRouter);

// start server
const port = Number(PORT) || 3333;
app.listen(port);
console.info('App is listening on port:', port);


export { app };