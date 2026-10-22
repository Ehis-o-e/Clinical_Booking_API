import { Router } from 'express';
import { sendSuccess } from '../utils/response.utils';

const router = Router();

router.get('/status', (_req, res) => {
    return sendSuccess(res, { timestamp: new Date().toISOString() }, 'API route is ready');
});

export default router;
