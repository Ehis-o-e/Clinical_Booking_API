import express, { Application, NextFunction, Request, Response } from 'express';
import './types/express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { createAppError } from '@app-core/errors';
import { appLogger } from '@app-core/logger';
import { MESSAGES } from '@app-core/messages';
import prisma from './config/database';
import { getApiKey } from './config/api-key';
import { createApiKeyMiddleware } from './middleware/api-key.middleware';
import bookingRoutes from './route/booking.route';
import apiRoutes from './route';
import { sendSuccess } from './utils/response.utils';
import { sendNormalizedError } from './utils/service-error.utils';

dotenv.config();

const app: Application = express();
const apiKeyMiddleware = createApiKeyMiddleware(getApiKey());

app.use(helmet());
app.use(
    cors({
        origin: process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
            : ['http://localhost:5173', 'http://localhost:3000'],
        allowedHeaders: ['Content-Type', 'Idempotency-Key', 'X-API-Key'],
        credentials: true
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    const startedAt = Date.now();

    res.on('finish', () => {
        appLogger.info(
            {
                method: req.method,
                path: req.originalUrl,
                statusCode: res.statusCode,
                durationMs: Date.now() - startedAt
            },
            'HTTP'
        );
    });

    next();
});

app.get('/health', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        if (process.env.SKIP_DB === 'true') {
            return sendSuccess(
                res,
                { database: 'skipped', timestamp: new Date().toISOString() },
                'Server is healthy'
            );
        }

        await prisma.$queryRaw`SELECT 1`;
        return sendSuccess(
            res,
            { database: 'connected', timestamp: new Date().toISOString() },
            'Server is healthy'
        );
    } catch (_error) {
        return next(
            createAppError('Server is unhealthy', 'SERVICE_UNAVAILABLE', {
                details: {
                    database: 'disconnected',
                    timestamp: new Date().toISOString()
                }
            })
        );
    }
});

app.get('/', (_req: Request, res: Response) => {
    return sendSuccess(res, { timestamp: new Date().toISOString() }, 'API is running');
});

app.use(apiKeyMiddleware, bookingRoutes);
app.use('/api/v1', apiRoutes);

app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(createAppError(MESSAGES.COMMON.ROUTE_NOT_FOUND, 'NOT_FOUND'));
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    appLogger.errorX(err, 'APP-ERROR');
    return sendNormalizedError(res, err);
});

export default app;
