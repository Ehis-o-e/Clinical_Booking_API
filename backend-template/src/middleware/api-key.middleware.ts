import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { throwAppError } from '@app-core/errors';

export const createApiKeyMiddleware = (expectedApiKey: string) => {
    const expectedApiKeyBuffer = Buffer.from(expectedApiKey);

    return (req: Request, _res: Response, next: NextFunction) => {
        const providedApiKey = req.get('X-API-Key');
        const providedApiKeyBuffer = providedApiKey ? Buffer.from(providedApiKey) : undefined;

        if (
            !providedApiKeyBuffer ||
            providedApiKeyBuffer.length !== expectedApiKeyBuffer.length ||
            !timingSafeEqual(providedApiKeyBuffer, expectedApiKeyBuffer)
        ) {
            throwAppError('Unauthorized', 'UNAUTHORIZED');
        }

        next();
    };
};
