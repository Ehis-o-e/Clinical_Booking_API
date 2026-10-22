declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email?: string;
                role?: 'admin' | 'user';
            };
            validatedBody?: unknown;
            validatedParams?: unknown;
            validatedQuery?: unknown;
        }
    }
}

export {};
