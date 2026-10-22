import { Response } from 'express';
import { MESSAGES } from '@app-core/messages';
import { ApiResponse } from '../types';

export const sendSuccess = <T>(
    res: Response,
    data: T,
    message: string = MESSAGES.COMMON.SUCCESS,
    statusCode: number = 200
): Response => {
    const response: ApiResponse<T> = {
        success: true,
        data,
        message
    };
    return res.status(statusCode).json(response);
};

export const sendError = (
    res: Response,
    message: string,
    _code: string = 'ERROR',
    statusCode: number = 500,
    _details?: unknown
): Response => {
    return res.status(statusCode).json({ error: message });
};
