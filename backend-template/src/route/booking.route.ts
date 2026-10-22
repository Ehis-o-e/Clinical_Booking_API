import { Router } from 'express';
import { getBookingById, getSlots, postBooking, reset } from '../controller/booking.controller';

const router = Router();

router.post('/reset', reset);
router.get('/slots', getSlots);
router.post('/bookings', postBooking);
router.get('/bookings/:id', getBookingById);

export default router;
