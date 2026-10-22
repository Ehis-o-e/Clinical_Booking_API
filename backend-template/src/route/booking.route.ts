import { Router, type Router as ExpressRouter } from 'express';
import {
    cancelBookingById,
    getBookingById,
    getBookings,
    getSlots,
    postBooking,
    reset
} from '../controller/booking.controller';

const router: ExpressRouter = Router();

router.post('/reset', reset);
router.get('/slots', getSlots);
router.post('/bookings', postBooking);
router.get('/bookings', getBookings);
router.get('/bookings/:id', getBookingById);
router.delete('/bookings/:id', cancelBookingById);

export default router;
