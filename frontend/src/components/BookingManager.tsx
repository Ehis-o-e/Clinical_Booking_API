import { Search, XCircle } from 'lucide-react';
import { useState } from 'react';
import { cancelBooking, ClinicApiError, getBooking, getBookings } from '../api/client';
import type { Booking } from '../types/api';

type BookingManagerProps = {
    onBookingChanged: () => void;
};

const createdFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const errorMessage = (error: unknown) => {
    if (!(error instanceof ClinicApiError)) {
        return 'We could not reach the booking service. Please try again.';
    }
    if (error.status === 404) {
        return 'No booking was found with those details.';
    }
    if (error.status === 409) {
        return 'This booking has already been cancelled.';
    }
    return error.message;
};

export function BookingManager({ onBookingChanged }: BookingManagerProps) {
    const [email, setEmail] = useState('');
    const [history, setHistory] = useState<Booking[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [historyError, setHistoryError] = useState<string>();
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [bookingId, setBookingId] = useState('');
    const [lookedUpBooking, setLookedUpBooking] = useState<Booking>();
    const [lookupError, setLookupError] = useState<string>();
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [cancellingId, setCancellingId] = useState<string>();

    const loadHistory = async (nextCursor?: string) => {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
            setHistoryError('Enter the email address used for the booking.');
            return;
        }
        setIsLoadingHistory(true);
        setHistoryError(undefined);
        try {
            const response = await getBookings(normalizedEmail, 10, nextCursor);
            setHistory((current) => nextCursor ? [...current, ...response.bookings] : response.bookings);
            setCursor(response.next_cursor);
        } catch (error) {
            setHistoryError(errorMessage(error));
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const lookupBooking = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const id = bookingId.trim();
        if (!id) {
            setLookupError('Enter a booking reference.');
            return;
        }
        setIsLookingUp(true);
        setLookupError(undefined);
        try {
            setLookedUpBooking(await getBooking(id));
        } catch (error) {
            setLookedUpBooking(undefined);
            setLookupError(errorMessage(error));
        } finally {
            setIsLookingUp(false);
        }
    };

    const cancel = async (booking: Booking) => {
        if (!window.confirm(`Cancel booking ${booking.id}?`)) {
            return;
        }
        setCancellingId(booking.id);
        setHistoryError(undefined);
        setLookupError(undefined);
        try {
            const cancelled = await cancelBooking(booking.id);
            setHistory((current) => current.map((item) => item.id === cancelled.id ? cancelled : item));
            setLookedUpBooking((current) => current?.id === cancelled.id ? cancelled : current);
            onBookingChanged();
        } catch (error) {
            const message = errorMessage(error);
            setHistoryError(message);
            setLookupError(message);
        } finally {
            setCancellingId(undefined);
        }
    };

    const bookingCard = (booking: Booking) => (
        <li key={booking.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="font-semibold text-slate-950">{booking.name}</p>
                    <p className="mt-1 break-all text-sm text-slate-600">Reference: {booking.id}</p>
                    <p className="mt-1 text-sm text-slate-600">Slot: {booking.slot_id}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{booking.status}</span>
            </div>
            <p className="mt-3 text-xs text-slate-500">Created {createdFormatter.format(new Date(booking.created_at))}</p>
            {booking.status === 'confirmed' && <button type="button" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-60" onClick={() => void cancel(booking)} disabled={cancellingId === booking.id}><XCircle size={16} aria-hidden="true" />{cancellingId === booking.id ? 'Cancelling...' : 'Cancel booking'}</button>}
        </li>
    );

    return (
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8" aria-labelledby="manage-bookings-title">
            <div className="rounded-3xl border border-slate-200 bg-sky-50/50 p-6 sm:p-8">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">Existing appointments</p>
                <h2 id="manage-bookings-title" className="mt-2 text-2xl font-bold text-slate-950">Find or cancel a booking</h2>
                <div className="mt-6 grid gap-8 lg:grid-cols-2">
                    <div>
                        <h3 className="font-bold text-slate-900">Booking history by email</h3>
                        <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); void loadHistory(); }}>
                            <label className="sr-only" htmlFor="history-email">Booking email</label>
                            <input id="history-email" className="min-h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-teal-700 focus:ring-3 focus:ring-teal-100" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ada@example.com" />
                            <button type="submit" className="min-h-11 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white disabled:opacity-60" disabled={isLoadingHistory}>{isLoadingHistory ? 'Loading...' : 'Show bookings'}</button>
                        </form>
                        {historyError && <p className="mt-3 text-sm font-medium text-rose-700" role="alert">{historyError}</p>}
                        {history.length > 0 && <ul className="mt-4 space-y-3">{history.map(bookingCard)}</ul>}
                        {cursor && <button type="button" className="mt-4 min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800" onClick={() => void loadHistory(cursor)} disabled={isLoadingHistory}>Load more</button>}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Look up a booking reference</h3>
                        <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={lookupBooking}>
                            <label className="sr-only" htmlFor="booking-reference">Booking reference</label>
                            <input id="booking-reference" className="min-h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-teal-700 focus:ring-3 focus:ring-teal-100" value={bookingId} onChange={(event) => setBookingId(event.target.value)} placeholder="Booking ID" />
                            <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white disabled:opacity-60" disabled={isLookingUp}><Search size={16} aria-hidden="true" />{isLookingUp ? 'Looking up...' : 'Find booking'}</button>
                        </form>
                        {lookupError && <p className="mt-3 text-sm font-medium text-rose-700" role="alert">{lookupError}</p>}
                        {lookedUpBooking && <ul className="mt-4">{bookingCard(lookedUpBooking)}</ul>}
                    </div>
                </div>
            </div>
        </section>
    );
}
