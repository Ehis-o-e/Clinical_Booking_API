import type { NextFunction, Request, Response } from 'express';
import { createAppError } from '@app-core/errors';
import { listSlots, resetSlots } from '../service/slot.service';
import { resetSchema, slotsQuerySchema } from '../validator/booking.validator';

const invalidRequest = (next: NextFunction) =>
    next(createAppError('Invalid request', 'VALIDATION_ERROR'));

export const reset = async (req: Request, res: Response, next: NextFunction) => {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) {
        return invalidRequest(next);
    }

    try {
        await resetSlots(parsed.data);
        return res.status(200).json({});
    } catch (error) {
        return next(error);
    }
};

export const getSlots = async (req: Request, res: Response, next: NextFunction) => {
    const parsed = slotsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return invalidRequest(next);
    }

    try {
        return res.json({ slots: await listSlots(parsed.data.provider) });
    } catch (error) {
        return next(error);
    }
};
