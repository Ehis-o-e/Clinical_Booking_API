import type { AppointmentSlot, Booking, BookingHistory, BookingPayload, ResetSlot } from '../types/api';

export class ClinicApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly retryAfter?: number
    ) {
        super(message);
        this.name = 'ClinicApiError';
    }
}

const apiRequest = async <T>(path: string, options?: RequestInit): Promise<T> => {
    const response = await fetch(path, options);

    if (!response.ok) {
        const errorBody: unknown = await response.json().catch(() => undefined);
        const message = typeof errorBody === 'object' && errorBody !== null && 'error' in errorBody && typeof errorBody.error === 'string'
            ? errorBody.error
            : 'We could not complete that request. Please try again.';
        const retryAfterHeader = response.headers.get('Retry-After');
        const retryAfter = retryAfterHeader && /^\d+$/.test(retryAfterHeader)
            ? Number(retryAfterHeader)
            : undefined;

        throw new ClinicApiError(message, response.status, retryAfter);
    }

    return response.json() as Promise<T>;
};

export const getSlots = (provider?: string) => {
    const search = provider ? `?${new URLSearchParams({ provider })}` : '';
    return apiRequest<{ slots: AppointmentSlot[] }>(`/api/slots${search}`);
};

export const createBooking = (booking: BookingPayload, idempotencyKey?: string) =>
    apiRequest<Booking>('/api/bookings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {})
        },
        body: JSON.stringify(booking)
    });

export const getBookings = (email: string, limit = 10, cursor?: string) => {
    const search = new URLSearchParams({ email });
    search.set('limit', String(limit));
    if (cursor) {
        search.set('cursor', cursor);
    }
    return apiRequest<BookingHistory>(`/api/bookings?${search}`);
};

export const getBooking = (id: string) => apiRequest<Booking>(`/api/bookings/${encodeURIComponent(id)}`);

export const cancelBooking = (id: string) =>
    apiRequest<Booking>(`/api/bookings/${encodeURIComponent(id)}`, { method: 'DELETE' });

export const resetSlots = (slots: ResetSlot[]) =>
    apiRequest<Record<string, never>>('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots })
    });
