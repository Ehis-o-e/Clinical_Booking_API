import { NextFunction, Request, Response } from 'express';
import { throwAppError } from '@app-core/errors';
import { z } from 'zod';

type RequestPart = 'body' | 'params' | 'query';
type ValidatedRequestField = 'validatedBody' | 'validatedParams' | 'validatedQuery';
type RequestSchema = z.ZodType<unknown>;

const validationErrorDetails = (error: z.ZodError) =>
    error.issues.map((issue) => issue.message);

const validateRequestPart =
    <TSchema extends RequestSchema>(
        part: RequestPart,
        target: ValidatedRequestField,
        schema: TSchema,
        invalidMessage: string
    ) =>
    (req: Request, _res: Response, next: NextFunction) => {
        const validation = schema.safeParse(req[part]);
        if (!validation.success) {
            throwAppError(invalidMessage, 'VALIDATION_ERROR', {
                details: validationErrorDetails(validation.error)
            });
        }

        req[target] = validation.data;
        next();
    };

export const validateBody =
    <TSchema extends RequestSchema>(schema: TSchema, invalidMessage: string) =>
        validateRequestPart('body', 'validatedBody', schema, invalidMessage);

export const validateParams =
    <TSchema extends RequestSchema>(schema: TSchema, invalidMessage = 'Invalid request parameter') =>
        validateRequestPart('params', 'validatedParams', schema, invalidMessage);

export const validateQuery =
    <TSchema extends RequestSchema>(schema: TSchema, invalidMessage: string) =>
        validateRequestPart('query', 'validatedQuery', schema, invalidMessage);
