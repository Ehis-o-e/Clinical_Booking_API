import prisma from '../config/database';
import type { ResetInput } from '../validator/booking.validator';

export const resetSlots = async ({ slots }: ResetInput): Promise<void> => {
    await prisma.$transaction(async (transaction) => {
        await transaction.bookingRateAttempt.deleteMany();
        await transaction.bookingRateLimit.deleteMany();
        await transaction.idempotencyRecord.deleteMany();
        await transaction.booking.deleteMany();
        await transaction.slot.deleteMany();
        await transaction.slot.createMany({ data: slots });
    });
};

export const listSlots = async (provider?: string) => {
    const slots = await prisma.slot.findMany({
        where: provider === undefined ? undefined : { provider },
        orderBy: { start: 'asc' },
        include: {
            bookings: {
                where: { status: 'confirmed' },
                select: { id: true }
            }
        }
    });

    return slots.map((slot) => ({
        id: slot.id,
        provider: slot.provider,
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        available: slot.bookings.length === 0
    }));
};
