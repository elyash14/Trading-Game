import { PrismaClient } from '@prisma/client'
import { BasicAuthMiddlewareOptions } from 'express-basic-auth';
import { comparePasswords } from './hashing';

const prisma = new PrismaClient();

const authorizer = async (username: string, password: string, callback: any) => {
    const user = await prisma.user.findUnique({
        where: { username: username }
    });

    if (!user) {
        return callback(null, false);
    }

    if (!comparePasswords(password, user.password)) {
        return callback(null, false);
    }

    return callback(null, true);
}

const unauthorizedResponse = (req: any) => {
    return req.auth
        ? ('Credentials ' + req.auth.user + ':' + req.auth.password + ' rejected')
        : 'No credentials provided'
}

export const afterLogin = async (req: any) => {
    // add user to request object
    const user = await prisma.user.findUnique({
        where: { username: req.auth.user }
    });
    req = req.user = user;
}

export const basicAuthOptions: BasicAuthMiddlewareOptions = {
    authorizer: authorizer,
    unauthorizedResponse: unauthorizedResponse,
    authorizeAsync: true,

}
