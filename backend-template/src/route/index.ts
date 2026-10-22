import { Router, type Router as ExpressRouter } from 'express';
import { sendSuccess } from '../utils/response.utils';

const router: ExpressRouter = Router();

router.get('/status', (_req, res) => {
    return sendSuccess(res, { timestamp: new Date().toISOString() }, 'API route is ready');
});

export default router;
