import { z } from 'zod';

const slotSchema = z.object({
    id: z.string(),
    provider: z.string(),
    start: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
    end: z.iso.datetime({ offset: true }).transform((value) => new Date(value))
});

export const resetSchema = z.object({
    slots: z.array(slotSchema)
});

export const bookingSchema = z.object({
    slot_id: z.string().trim().min(1),
    name: z.string().trim().min(1),
    email: z.string().trim().toLowerCase().min(1).email()
});

export const idempotencyKeySchema = z.string().trim().min(1);

export const bookingIdSchema = z.object({
    id: z.string()
});

export const slotsQuerySchema = z.object({
    provider: z.string().optional()
});

const bookingHistoryLimitSchema = z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(50));

export const bookingsQuerySchema = z.object({
    email: z.string().trim().toLowerCase().min(1).email(),
    limit: bookingHistoryLimitSchema.optional().default(10),
    cursor: z.string().min(1).optional()
});

export const bookingResponseSchema = z.object({
    id: z.string(),
    slot_id: z.string(),
    name: z.string(),
    email: z.string(),
    status: z.enum(['confirmed', 'cancelled']),
    created_at: z.string()
});

export const bookingCursorSchema = z.object({
    email: z.string().trim().toLowerCase().min(1).email(),
    created_at: z.iso.datetime({ offset: true }),
    id: z.string().min(1)
});

export type ResetInput = z.infer<typeof resetSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type BookingsQuery = z.infer<typeof bookingsQuerySchema>;
export type BookingResponse = z.infer<typeof bookingResponseSchema>;
