import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { appRouter } from './route';

dotenv.config()
const { PORT } = process.env;

// initial app server
const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((_req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, AUTHORIZATION'
    );
    next();
});

// ping route
app.get('/ping', (_req: Request, res: Response) => {
    res.send('pong');
});

// set all routes
app.use(appRouter);

// start server
const port = Number(PORT) || 3333;
app.listen(port);
console.info('App is listening on port:', port);


export { app };