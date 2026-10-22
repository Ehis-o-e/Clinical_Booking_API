import dotenv from 'dotenv';
import { appLogger } from '@app-core/logger';
import app from './app';
import prisma from './config/database';

dotenv.config();

const PORT = process.env.PORT || 5000;
const skipDb = process.env.SKIP_DB === 'true';

const startServer = async () => {
    try {
        if (!skipDb) {
            await prisma.$connect();
            appLogger.info({ message: 'Database connected successfully' }, 'STARTUP');
        } else {
            appLogger.info({ message: 'Database connection skipped' }, 'STARTUP');
        }

        app.listen(PORT, () => {
            appLogger.info(
                {
                    message: 'Server running',
                    port: PORT,
                    environment: process.env.NODE_ENV || 'development'
                },
                'STARTUP'
            );
        });
    } catch (error) {
        appLogger.errorX(error instanceof Error ? error : new Error('Startup failed'), 'STARTUP');
        process.exit(1);
    }
};

const shutdown = async (signal: 'SIGINT' | 'SIGTERM') => {
    appLogger.info({ message: `${signal} received. Shutting down...` }, 'SHUTDOWN');

    try {
        await prisma.$disconnect();
        process.exit(0);
    } catch (error) {
        appLogger.errorX(error instanceof Error ? error : new Error('Shutdown failed'), 'SHUTDOWN');
        process.exit(1);
    }
};

process.on('SIGINT', async () => shutdown('SIGINT'));
process.on('SIGTERM', async () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
    appLogger.error({ message: 'Unhandled promise rejection', reason }, 'PROCESS');
});

process.on('uncaughtException', async (error) => {
    appLogger.errorX(error, 'PROCESS');
    await prisma.$disconnect();
    process.exit(1);
});

startServer();
