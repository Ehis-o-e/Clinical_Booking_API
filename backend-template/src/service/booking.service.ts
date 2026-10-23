import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { isAppError, throwAppError } from '@app-core/errors';
import prisma from '../config/database';
import {
    bookingCursorSchema,
    bookingResponseSchema
} from '../validator/booking.validator';
import type {
    BookingInput,
    BookingsQuery,
    BookingResponse,
    ResetInput
} from '../validator/booking.validator';

type BookingStatus = 'confirmed' | 'cancelled';
type BookingResult = {
    status: number;
    body: BookingResponse;
};
type BookingCursor = {
    email: string;
    id: string;
    createdAt: Date;
};

const transactionOptions = {
    maxWait: 5000,
    timeout: 5000
};

const toBookingResponse = (booking: {
    id: string;
    slotId: string;
    name: string;
    email: string;
    status: BookingStatus;
    createdAt: Date;
}): BookingResponse => ({
    id: booking.id,
    slot_id: booking.slotId,
    name: booking.name,
    email: booking.email,
    status: booking.status,
    created_at: booking.createdAt.toISOString()
});

const isUniqueConstraintError = (error: unknown) => {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
};

const isTransactionTimeout = (error: unknown) => {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2028';
};

const createRequestHash = (input: BookingInput) =>
    createHash('sha256')
        .update(JSON.stringify({ slot_id: input.slot_id, name: input.name, email: input.email }))
        .digest('hex');

const decodeCursor = (value: string): BookingCursor => {
    if (!/^[A-Za-z0-9_-]+$/.test(value)) {
        throwAppError('invalid cursor', 'VALIDATION_ERROR');
    }

    try {
        const decoded: unknown = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
        const parsed = bookingCursorSchema.safeParse(decoded);

        if (!parsed.success) {
            throwAppError('invalid cursor', 'VALIDATION_ERROR');
        }

        const createdAt = new Date(parsed.data.created_at);
        if (Number.isNaN(createdAt.getTime())) {
            throwAppError('invalid cursor', 'VALIDATION_ERROR');
        }

        return { email: parsed.data.email, id: parsed.data.id, createdAt };
    } catch (error) {
        if (isAppError(error)) {
            throw error;
        }

        throwAppError('invalid cursor', 'VALIDATION_ERROR');
    }
};

const encodeCursor = (booking: { id: string; email: string; createdAt: Date }) =>
    Buffer.from(
        JSON.stringify({
            email: booking.email.toLowerCase(),
            created_at: booking.createdAt.toISOString(),
            id: booking.id
        })
    ).toString('base64url');

const createBookingInTransaction = async (
    transaction: Prisma.TransactionClient,
    input: BookingInput
): Promise<BookingResponse> => {
    const slot = await transaction.slot.findUnique({ where: { id: input.slot_id } });

    if (!slot) {
        throwAppError('slot not found', 'NOT_FOUND');
    }

    if (slot.start <= new Date()) {
        throwAppError('slot already started', 'VALIDATION_ERROR');
    }

    const booking = await transaction.booking.create({
        data: {
            slotId: input.slot_id,
            name: input.name,
            email: input.email,
            status: 'confirmed'
        }
    });

    return toBookingResponse(booking);
};

const replayIdempotencyResponse = async (
    key: string,
    requestHash: string
): Promise<BookingResult | undefined> => {
    const record = await prisma.idempotencyRecord.findUnique({ where: { key } });

    if (!record) {
        return undefined;
    }

    if (record.requestHash !== requestHash) {
        throwAppError('idempotency key was already used with a different request', 'UNPROCESSABLE_ENTITY');
    }

    if (record.responseStatus === null || record.responseBody === null) {
        throwAppError('idempotency request is in progress', 'CONFLICT');
    }

    return {
        status: record.responseStatus,
        body: bookingResponseSchema.parse(record.responseBody)
    };
};

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

export const createBooking = async (input: BookingInput, idempotencyKey?: string): Promise<BookingResult> => {
    if (!idempotencyKey) {
        try {
            return {
                status: 201,
                body: await prisma.$transaction(
                    (transaction) => createBookingInTransaction(transaction, input),
                    transactionOptions
                )
            };
        } catch (error) {
            if (isUniqueConstraintError(error)) {
                throwAppError('slot already booked', 'CONFLICT');
            }

            throw error;
        }
    }

    const requestHash = createRequestHash(input);

    try {
        return await prisma.$transaction(async (transaction) => {
            await transaction.idempotencyRecord.create({
                data: {
                    key: idempotencyKey,
                    requestHash
                }
            });

            const body = await createBookingInTransaction(transaction, input);
            await transaction.idempotencyRecord.update({
                where: { key: idempotencyKey },
                data: {
                    responseStatus: 201,
                    responseBody: body
                }
            });

            return { status: 201, body };
        }, transactionOptions);
    } catch (error) {
        if (isUniqueConstraintError(error)) {
            const replay = await replayIdempotencyResponse(idempotencyKey, requestHash);

            if (replay) {
                return replay;
            }

            throwAppError('slot already booked', 'CONFLICT');
        }

        if (isTransactionTimeout(error)) {
            const replay = await replayIdempotencyResponse(idempotencyKey, requestHash);

            if (replay) {
                return replay;
            }

            throwAppError('idempotency request is in progress', 'CONFLICT');
        }

        throw error;
    }
};

export const listBookings = async ({ email, limit, cursor }: BookingsQuery) => {
    const position = cursor === undefined ? undefined : decodeCursor(cursor);

    if (position && position.email !== email) {
        throwAppError('invalid cursor', 'VALIDATION_ERROR');
    }

    const bookings = await prisma.booking.findMany({
        where: {
            email: { equals: email, mode: 'insensitive' },
            ...(position === undefined
                ? {}
                : {
                      OR: [
                          { createdAt: { gt: position.createdAt } },
                          {
                              createdAt: position.createdAt,
                              id: { gt: position.id }
                          }
                      ]
                  })
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: limit + 1
    });

    const page = bookings.slice(0, limit);
    const lastBooking = page[page.length - 1];

    return {
        bookings: page.map(toBookingResponse),
        next_cursor:
            bookings.length > limit && lastBooking !== undefined
                ? encodeCursor(lastBooking)
                : null
    };
};

export const getBooking = async (id: string) => {
    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
        throwAppError('booking not found', 'NOT_FOUND');
    }

    return toBookingResponse(booking);
};

export const cancelBooking = async (id: string) => {
    return prisma.$transaction(async (transaction) => {
        const result = await transaction.booking.updateMany({
            where: { id, status: 'confirmed' },
            data: { status: 'cancelled' }
        });

        const booking = await transaction.booking.findUnique({ where: { id } });

        if (!booking) {
            throwAppError('booking not found', 'NOT_FOUND');
        }

        if (result.count === 0) {
            throwAppError('booking already cancelled', 'CONFLICT');
        }

        return toBookingResponse(booking);
    });
};
