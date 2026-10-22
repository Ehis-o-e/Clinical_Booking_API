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
    slot_id: z.string(),
    name: z.string(),
    email: z.string()
});

export const bookingIdSchema = z.object({
    id: z.string()
});

export const slotsQuerySchema = z.object({
    provider: z.string().optional()
});

export type ResetInput = z.infer<typeof resetSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
