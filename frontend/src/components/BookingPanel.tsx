import { CalendarCheck2, Clock3, LoaderCircle, ShieldCheck } from 'lucide-react';
import type { AppointmentSlot, BookingPayload } from '../types/api';
import { formatSlot } from '../utils/formatters';

type BookingPanelProps = {
    slot: AppointmentSlot | undefined;
    draft: Pick<BookingPayload, 'name' | 'email'>;
    error: string | undefined;
    isSubmitting: boolean;
    retryAfter: number | undefined;
    onDraftChange: (field: 'name' | 'email', value: string) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function BookingPanel({
    slot,
    draft,
    error,
    isSubmitting,
    retryAfter,
    onDraftChange,
    onSubmit
}: BookingPanelProps) {
    const appointment = slot ? formatSlot(slot) : undefined;
    const disabled = !slot || isSubmitting || retryAfter !== undefined;

    return (
        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 lg:sticky lg:top-6">
            <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-teal-700 text-white"><CalendarCheck2 size={22} aria-hidden="true" /></span>
                <div>
                    <h2 className="text-lg font-bold text-slate-950">Book an appointment</h2>
                    <p className="text-sm text-slate-500">Select a time, then enter patient details.</p>
                </div>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                {slot && appointment ? (
                    <>
                        <p className="font-semibold text-slate-950">{slot.provider}</p>
                        <p className="mt-1 text-sm text-slate-600">{appointment.date}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600"><Clock3 size={15} aria-hidden="true" />{appointment.time}</p>
                    </>
                ) : (
                    <p className="text-sm text-slate-600">Choose an available time to begin your booking.</p>
                )}
            </div>

            <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
                <div>
                    <label className="text-sm font-semibold text-slate-800" htmlFor="patient-name">Full name</label>
                    <input id="patient-name" className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-3 focus:ring-teal-100" type="text" autoComplete="name" placeholder="Ada Obi" value={draft.name} onChange={(event) => onDraftChange('name', event.target.value)} />
                </div>
                <div>
                    <label className="text-sm font-semibold text-slate-800" htmlFor="patient-email">Email address</label>
                    <input id="patient-email" className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-3 focus:ring-teal-100" type="email" autoComplete="email" placeholder="ada@example.com" value={draft.email} onChange={(event) => onDraftChange('email', event.target.value)} />
                </div>

                {error && <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-800" role="alert">{error}</p>}
                {retryAfter !== undefined && <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-800" role="status">Please wait {retryAfter} second{retryAfter === 1 ? '' : 's'} before trying again.</p>}

                <button type="submit" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={disabled}>
                    {isSubmitting && <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />}
                    {isSubmitting ? 'Confirming appointment…' : 'Confirm appointment'}
                </button>
            </form>
            <p className="mt-4 flex gap-2 text-xs leading-5 text-slate-500"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-teal-700" aria-hidden="true" />Your booking is confirmed by the clinic before we show a confirmation.</p>
        </aside>
    );
}
