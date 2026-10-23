import { useRef, useState, type FormEvent } from 'react';
import { cancelBooking, ClinicApiError, createBooking, getBooking, getBookings, getSlots, resetSlots } from './api/client';
import { ApiResult } from './components/ApiResult';
import { ResetSlotsForm, type SlotDraft } from './components/ResetSlotsForm';
import { Sidebar, type ApiScreen } from './components/Sidebar';
import type { AppointmentSlot, Booking, BookingHistory, BookingPayload, ResetSlot } from './types/api';

type Result = { status: number; body: unknown; retryAfter?: number };

const toLocalDateTime = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

const createSlotDraft = (index: number): SlotDraft => {
    const start = new Date();
    start.setDate(start.getDate() + 7);
    start.setHours(9, index * 30, 0, 0);
    const end = new Date(start.getTime() + 30 * 60_000);
    return {
        key: crypto.randomUUID(),
        id: `slot-${index + 1}`,
        provider: 'Dr Ade',
        startDate: toLocalDateTime(start).slice(0, 10),
        startTime: toLocalDateTime(start).slice(11, 16),
        endDate: toLocalDateTime(end).slice(0, 10),
        endTime: toLocalDateTime(end).slice(11, 16)
    };
};

export default function App() {
    const [screen, setScreen] = useState<ApiScreen>('reset');
    const [result, setResult] = useState<Result>();
    const [slotDrafts, setSlotDrafts] = useState<SlotDraft[]>(() => [createSlotDraft(0)]);
    const [resetError, setResetError] = useState<string>();
    const [resetSuccess, setResetSuccess] = useState<string>();
    const [isResetting, setIsResetting] = useState(false);
    const [provider, setProvider] = useState('');
    const [slots, setSlots] = useState<AppointmentSlot[]>([]);
    const [slotsLoaded, setSlotsLoaded] = useState(false);
    const [booking, setBooking] = useState<BookingPayload>({ slot_id: '', name: '', email: '' });
    const bookingAttempt = useRef<{ body: string; key: string } | undefined>(undefined);
    const bookingRequestPending = useRef(false);
    const [isBooking, setIsBooking] = useState(false);
    const [bookingEmail, setBookingEmail] = useState('');
    const [bookingLimit, setBookingLimit] = useState('10');
    const [history, setHistory] = useState<BookingHistory>();
    const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
    const [lookupId, setLookupId] = useState('');
    const [cancelId, setCancelId] = useState('');

    const showError = (error: unknown) => {
        if (error instanceof ClinicApiError) {
            setResult({ status: error.status, body: { error: error.message }, retryAfter: error.retryAfter });
            return;
        }
        setResult({ status: 500, body: { error: 'Could not reach the backend.' } });
    };

    const updateSlotDraft = (key: string, field: keyof Omit<SlotDraft, 'key'>, value: string) => {
        setSlotDrafts((current) => current.map((slot) => slot.key === key ? { ...slot, [field]: value } : slot));
        setResetError(undefined);
        setResetSuccess(undefined);
    };

    const submitReset = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const request: ResetSlot[] = slotDrafts.map((slot) => ({
            id: slot.id.trim(),
            provider: slot.provider.trim(),
            start: new Date(`${slot.startDate}T${slot.startTime}`).toISOString(),
            end: new Date(`${slot.endDate}T${slot.endTime}`).toISOString()
        }));
        if (!window.confirm('This replaces every slot and booking. Continue?')) {
            return;
        }
        setIsResetting(true);
        setResetError(undefined);
        try {
            await resetSlots(request);
            setResetSuccess(`Reset complete: ${request.length} slot${request.length === 1 ? '' : 's'} sent.`);
        } catch (error) {
            setResetError(error instanceof ClinicApiError ? error.message : 'Could not reach the backend.');
            showError(error);
        } finally {
            setIsResetting(false);
        }
    };

    const submitSlots = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSlots([]);
        setSlotsLoaded(false);
        try {
            const response = await getSlots(provider || undefined);
            setSlots(response.slots);
            setSlotsLoaded(true);
            setResult({ status: 200, body: response });
        } catch (error) {
            showError(error);
        }
    };

    const submitBooking = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (bookingRequestPending.current) {
            return;
        }

        bookingRequestPending.current = true;
        setIsBooking(true);
        const body = JSON.stringify(booking);
        if (!bookingAttempt.current || bookingAttempt.current.body !== body) {
            bookingAttempt.current = { body, key: crypto.randomUUID() };
        }
        try {
            const response = await createBooking(booking, bookingAttempt.current.key);
            setResult({ status: 201, body: response });
        } catch (error) {
            showError(error);
        } finally {
            bookingRequestPending.current = false;
            setIsBooking(false);
        }
    };

    const loadBookings = async (cursor?: string) => {
        setHistory(undefined);
        setSelectedBookingIds([]);
        try {
            const response = await getBookings(bookingEmail, Number(bookingLimit), cursor);
            setHistory(response);
            setResult({ status: 200, body: response });
        } catch (error) {
            showError(error);
        }
    };

    const submitBookings = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void loadBookings();
    };

    const submitLookup = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const response = await getBooking(lookupId);
            setResult({ status: 200, body: response });
        } catch (error) {
            showError(error);
        }
    };

    const submitCancel = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const response = await cancelBooking(cancelId);
            setResult({ status: 200, body: response });
        } catch (error) {
            showError(error);
        }
    };

    const toggleBooking = (id: string) => {
        setSelectedBookingIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
    };

    const changeScreen = (nextScreen: ApiScreen) => {
        setScreen(nextScreen);
        setResult(undefined);
    };

    const cancelSelected = async () => {
        if (selectedBookingIds.length === 0 || !window.confirm(`Cancel ${selectedBookingIds.length} selected booking(s)?`)) {
            return;
        }
        try {
            const cancelled: Booking[] = [];
            for (const id of selectedBookingIds) {
                cancelled.push(await cancelBooking(id));
            }
            setHistory((current) => current && {
                ...current,
                bookings: current.bookings.map((item) => cancelled.find((value) => value.id === item.id) ?? item)
            });
            setSelectedBookingIds([]);
            setResult({ status: 200, body: cancelled });
        } catch (error) {
            showError(error);
        }
    };

    const content = (() => {
        switch (screen) {
            case 'reset':
                return <>
                    <PageTitle method="POST" path="/reset" description="Replace all slots and delete all existing bookings. Use this to prepare local test data." />
                    <ResetSlotsForm slots={slotDrafts} error={resetError} success={resetSuccess} isSubmitting={isResetting} onChange={updateSlotDraft} onAdd={() => setSlotDrafts((current) => [...current, createSlotDraft(current.length)])} onRemove={(key) => setSlotDrafts((current) => current.filter((slot) => slot.key !== key))} onSubmit={(event) => void submitReset(event)} />
                </>;
            case 'slots':
                return <>
                    <PageTitle method="GET" path="/slots" description="List slots, optionally for one exact provider. For example, use Dr Ade, not Ade." />
                    <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={(event) => void submitSlots(event)}>
                        <label className="flex-1 text-sm font-semibold text-slate-700">Provider (optional)<input className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-3 font-normal" value={provider} onChange={(event) => setProvider(event.target.value)} placeholder="Dr Ade" /></label>
                        <button className="mt-auto min-h-10 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white" type="submit">Send GET /slots</button>
                    </form>
                    {slotsLoaded && (slots.length > 0 ? <SlotTable slots={slots} /> : <p className="mt-6 rounded-lg bg-slate-100 p-4 text-sm text-slate-600">No slots found for that provider.</p>)}
                </>;
            case 'create-booking':
                return <>
                    <PageTitle method="POST" path="/bookings" description="Send the booking request exactly as the API receives it. Idempotency is automatic; unchanged retries reuse one key." />
                    <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={(event) => void submitBooking(event)} aria-busy={isBooking}>
                        <Input label="slot_id" value={booking.slot_id} onChange={(value) => setBooking((current) => ({ ...current, slot_id: value }))} />
                        <Input label="name" value={booking.name} onChange={(value) => setBooking((current) => ({ ...current, name: value }))} />
                        <Input label="email" value={booking.email} onChange={(value) => setBooking((current) => ({ ...current, email: value }))} />
                        <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:bg-teal-600 sm:col-span-2" type="submit" disabled={isBooking}>{isBooking && <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />}{isBooking ? 'Sending booking...' : 'Send POST /bookings'}</button>
                    </form>
                </>;
            case 'bookings':
                return <>
                    <PageTitle method="GET" path="/bookings" description="List one email's bookings. Each Send button starts again from the first page." />
                    <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={submitBookings}>
                        <Input label="email" value={bookingEmail} onChange={setBookingEmail} />
                        <Input label="limit (1–50)" value={bookingLimit} onChange={setBookingLimit} />
                        <button className="min-h-10 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white sm:col-span-2" type="submit">Send GET /bookings</button>
                    </form>
                    {history && <>
                        <div className="mt-6 flex flex-wrap items-center gap-3"><button className="min-h-10 rounded-lg border border-rose-300 px-4 text-sm font-bold text-rose-700 disabled:opacity-50" type="button" onClick={() => void cancelSelected()} disabled={selectedBookingIds.length === 0}>Cancel selected ({selectedBookingIds.length})</button>{history.next_cursor && <button className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-bold" type="button" onClick={() => void loadBookings(history.next_cursor ?? undefined)}>Use next_cursor</button>}</div>
                        <BookingTable bookings={history.bookings} selectedIds={selectedBookingIds} onToggle={toggleBooking} />
                    </>}
                </>;
            case 'lookup':
                return <>
                    <PageTitle method="GET" path="/bookings/:id" description="Retrieve one booking by its ID." />
                    <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={(event) => void submitLookup(event)}>
                        <label className="flex-1 text-sm font-semibold text-slate-700">Booking ID<input className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-3 font-normal" value={lookupId} onChange={(event) => setLookupId(event.target.value)} /></label>
                        <button className="mt-auto min-h-10 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white" type="submit">Send GET /bookings/:id</button>
                    </form>
                </>;
            case 'cancel':
                return <>
                    <PageTitle method="DELETE" path="/bookings/:id" description="Cancel one confirmed booking by its ID. A cancelled booking frees its slot." />
                    <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={(event) => void submitCancel(event)}>
                        <label className="flex-1 text-sm font-semibold text-slate-700">Booking ID<input className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-3 font-normal" value={cancelId} onChange={(event) => setCancelId(event.target.value)} /></label>
                        <button className="mt-auto min-h-10 rounded-lg bg-rose-700 px-4 text-sm font-bold text-white" type="submit">Send DELETE /bookings/:id</button>
                    </form>
                </>;
        }
    })();

    return <main className="min-h-screen bg-slate-100 text-slate-900 lg:grid lg:grid-cols-[15rem_1fr]"><Sidebar active={screen} onChange={changeScreen} /><section className="p-4 sm:p-8"><div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">{content}{screen !== 'reset' && <ApiResult status={result?.status} body={result?.body} retryAfter={result?.retryAfter} />}</div></section></main>;
}

function PageTitle({ method, path, description }: { method: string; path: string; description: string }) {
    return <header><p className="text-sm font-bold uppercase tracking-wider text-teal-700">{method}</p><h1 className="mt-1 text-3xl font-bold text-slate-950">{path}</h1><p className="mt-2 text-slate-600">{description}</p></header>;
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return <label className="text-sm font-semibold text-slate-700">{label}<input className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-3 font-normal" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SlotTable({ slots }: { slots: AppointmentSlot[] }) {
    return <div className="mt-6 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b bg-slate-50 text-slate-600"><tr><th className="p-3">ID</th><th className="p-3">Provider</th><th className="p-3">Start</th><th className="p-3">End</th><th className="p-3">Available</th></tr></thead><tbody>{slots.map((slot) => <tr className="border-b" key={slot.id}><td className="p-3">{slot.id}</td><td className="p-3">{slot.provider}</td><td className="p-3">{slot.start}</td><td className="p-3">{slot.end}</td><td className="p-3">{String(slot.available)}</td></tr>)}</tbody></table></div>;
}

function BookingTable({ bookings, selectedIds, onToggle }: { bookings: Booking[]; selectedIds: string[]; onToggle: (id: string) => void }) {
    return <div className="mt-4 overflow-x-auto"><table className="min-w-full whitespace-nowrap text-left text-sm"><thead className="border-b bg-slate-50 text-slate-600"><tr><th className="p-3">Select</th><th className="p-3">ID</th><th className="p-3">Slot</th><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Status</th><th className="p-3">Created at</th></tr></thead><tbody>{bookings.map((booking) => <tr className="border-b" key={booking.id}><td className="p-3"><input aria-label={`Select ${booking.id}`} checked={selectedIds.includes(booking.id)} onChange={() => onToggle(booking.id)} type="checkbox" /></td><td className="p-3">{booking.id}</td><td className="p-3">{booking.slot_id}</td><td className="p-3">{booking.name}</td><td className="p-3">{booking.email}</td><td className="p-3">{booking.status}</td><td className="p-3">{booking.created_at}</td></tr>)}</tbody></table></div>;
}
