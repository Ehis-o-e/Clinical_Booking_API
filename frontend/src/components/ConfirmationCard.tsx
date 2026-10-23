import { CalendarDays, CheckCircle2, Clock3, Mail, UserRound } from 'lucide-react';
import type { BookingConfirmation } from '../types/api';
import { formatSlot } from '../utils/formatters';

type ConfirmationCardProps = {
    confirmation: BookingConfirmation;
    onBookAnother: () => void;
};

export function ConfirmationCard({ confirmation, onBookAnother }: ConfirmationCardProps) {
    const { booking, slot } = confirmation;
    const appointment = formatSlot(slot);

    return (
        <section className="mx-auto max-w-2xl rounded-3xl border border-emerald-100 bg-white p-6 shadow-xl shadow-teal-900/5 sm:p-10" aria-labelledby="confirmation-title">
            <span className="grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 size={30} aria-hidden="true" /></span>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.16em] text-teal-700">Appointment confirmed</p>
            <h1 id="confirmation-title" className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">You’re all set, {booking.name.split(' ')[0]}.</h1>
            <p className="mt-3 text-slate-600">A confirmed appointment has been reserved for you. Please keep this reference for your records.</p>
            <div className="mt-8 grid gap-3 rounded-2xl bg-slate-50 p-5 text-sm sm:grid-cols-2">
                <p className="sm:col-span-2 border-b border-slate-200 pb-3 text-slate-600">Booking reference <span className="ml-1 break-all font-semibold text-slate-950">{booking.id}</span></p>
                <p className="flex items-center gap-2 text-slate-700"><UserRound size={17} className="text-teal-700" aria-hidden="true" />{slot.provider}</p>
                <p className="flex items-center gap-2 text-slate-700"><CalendarDays size={17} className="text-teal-700" aria-hidden="true" />{appointment.date}</p>
                <p className="flex items-center gap-2 text-slate-700"><Clock3 size={17} className="text-teal-700" aria-hidden="true" />{appointment.time}</p>
                <p className="flex items-center gap-2 text-slate-700"><Mail size={17} className="text-teal-700" aria-hidden="true" />{booking.email}</p>
            </div>
            <p className="mt-4 text-sm font-medium capitalize text-emerald-700">Status: {booking.status}</p>
            <button type="button" className="mt-8 min-h-11 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700" onClick={onBookAnother}>View appointments</button>
        </section>
    );
}
