export type AppointmentSlot = {
    id: string;
    provider: string;
    start: string;
    end: string;
    available: boolean;
};

export type BookingPayload = {
    slot_id: string;
    name: string;
    email: string;
};

export type Booking = BookingPayload & {
    id: string;
    status: 'confirmed' | 'cancelled';
    created_at: string;
};

export type BookingConfirmation = {
    booking: Booking;
    slot: AppointmentSlot;
};

export type BookingHistory = {
    bookings: Booking[];
    next_cursor: string | null;
};

export type ResetSlot = Omit<AppointmentSlot, 'available'>;
