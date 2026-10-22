import { throwAppError } from '@app-core/errors';
import prisma from '../config/database';
import type { BookingInput, ResetInput } from '../validator/booking.validator';

type BookingStatus = 'confirmed' | 'cancelled';

const toBookingResponse = (booking: {
    id: string;
    slotId: string;
    name: string;
    email: string;
    status: BookingStatus;
    createdAt: Date;
}) => ({
    id: booking.id,
    slot_id: booking.slotId,
    name: booking.name,
    email: booking.email,
    status: booking.status,
    created_at: booking.createdAt.toISOString()
});

export const resetSlots = async ({ slots }: ResetInput): Promise<void> => {
    await prisma.$transaction(async (transaction) => {
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

export const createBooking = async (input: BookingInput) => {
    const slot = await prisma.slot.findUnique({ where: { id: input.slot_id } });

    if (!slot) {
        throwAppError('slot not found', 'NOT_FOUND');
    }

    if (slot.start <= new Date()) {
        throwAppError('slot already started', 'VALIDATION_ERROR');
    }

    const booking = await prisma.booking.create({
        data: {
            slotId: input.slot_id,
            name: input.name,
            email: input.email,
            status: 'confirmed'
        }
    });

    return toBookingResponse(booking);
};

export const getBooking = async (id: string) => {
    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
        throwAppError('booking not found', 'NOT_FOUND');
    }

    return toBookingResponse(booking);
};
