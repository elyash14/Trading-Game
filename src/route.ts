
  
import express, { Request, Response } from 'express';

const appRouter = express.Router();

appRouter.get('/test', async (req: Request, res: Response) => {
    res.json("OK");
});

export { appRouter };