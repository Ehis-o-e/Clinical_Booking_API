import { Router, type Router as ExpressRouter } from 'express';
import { getSlots, reset } from '../controller/slot.controller';

const router: ExpressRouter = Router();

router.post('/reset', reset);
router.get('/slots', getSlots);

export default router;
