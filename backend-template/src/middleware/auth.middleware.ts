import { getAuth } from '@clerk/express';
import { NextFunction, Request, Response } from 'express';
import { throwAppError } from '@app-core/errors';
import { MESSAGES } from '@app-core/messages';
import { verifyJwt } from '@app-core/jwt';

export const requireClerkAuth = (req: Request, _res: Response, next: NextFunction) => {
    const auth = getAuth(req);

    if (!auth.isAuthenticated || !auth.userId) {
        throwAppError(MESSAGES.COMMON.UNAUTHORIZED, 'UNAUTHORIZED');
    }

    req.user = {
        id: auth.userId,
        role: 'user'
    };
    next();
};

export const requireJwtAuth = (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        throwAppError(MESSAGES.AUTH.AUTHORIZATION_HEADER_MISSING, 'UNAUTHORIZED');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
        throwAppError(MESSAGES.AUTH.INVALID_AUTHORIZATION_FORMAT, 'INVALID_AUTH_TOKEN');
    }

    try {
        const payload = verifyJwt(token);
        req.user = {
            id: payload.id,
            email: payload.email,
            role: 'user'
        };
        next();
    } catch (_error) {
        throwAppError(MESSAGES.AUTH.INVALID_OR_EXPIRED_TOKEN, 'INVALID_AUTH_TOKEN');
    }
};
