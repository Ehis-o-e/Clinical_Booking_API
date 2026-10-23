import type { Prisma } from '@prisma/client';
import prisma from '../config/database';

const MAX_BOOKING_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000;

type BookingAttemptResult =
    | { allowed: true }
    | { allowed: false; retryAfterSeconds: number };

const databaseNow = async (transaction: Prisma.TransactionClient) => {
    const rows = await transaction.$queryRaw<Array<{ now: Date }>>`SELECT CURRENT_TIMESTAMP AS "now"`;
    const now = rows[0]?.now;

    if (!now) {
        throw new Error('Database time is unavailable');
    }

    return now;
};

export const consumeBookingAttempt = async (email: string): Promise<BookingAttemptResult> => {
    return prisma.$transaction(async (transaction) => {
        await transaction.bookingRateLimit.upsert({
            where: { email },
            create: { email },
            update: { email }
        });

        const now = await databaseNow(transaction);
        const cutoff = new Date(now.getTime() - WINDOW_MS);

        await transaction.bookingRateAttempt.deleteMany({
            where: {
                email,
                createdAt: { lte: cutoff }
            }
        });

        const attempts = await transaction.bookingRateAttempt.findMany({
            where: {
                email,
                createdAt: { gt: cutoff }
            },
            orderBy: { createdAt: 'asc' },
            select: { createdAt: true },
            take: MAX_BOOKING_ATTEMPTS
        });

        const oldestAttempt = attempts[0];
        if (attempts.length === MAX_BOOKING_ATTEMPTS && oldestAttempt) {
            return {
                allowed: false,
                retryAfterSeconds: Math.max(
                    1,
                    Math.ceil((oldestAttempt.createdAt.getTime() + WINDOW_MS - now.getTime()) / 1000)
                )
            };
        }

        await transaction.bookingRateAttempt.create({ data: { email } });
        return { allowed: true };
    });
};
