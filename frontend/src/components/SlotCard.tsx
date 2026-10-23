import { CalendarDays, Clock3, Stethoscope } from 'lucide-react';
import type { AppointmentSlot } from '../types/api';
import { formatSlot } from '../utils/formatters';

type SlotCardProps = {
    slot: AppointmentSlot;
    selected: boolean;
    onSelect: (slot: AppointmentSlot) => void;
};

export function SlotCard({ slot, selected, onSelect }: SlotCardProps) {
    const appointment = formatSlot(slot);

    return (
        <article className={`group rounded-2xl border p-5 transition ${selected ? 'border-teal-600 bg-teal-50 shadow-md shadow-teal-900/5' : 'border-slate-200 bg-white shadow-sm'} ${slot.available ? 'hover:-translate-y-0.5 hover:shadow-md' : 'opacity-70'}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-800"><Stethoscope size={20} aria-hidden="true" /></span>
                    <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-950">{slot.provider}</p>
                        <p className="mt-0.5 text-sm text-slate-500">General consultation</p>
                    </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${slot.available ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {slot.available ? 'Available' : 'Booked'}
                </span>
            </div>
            <div className="mt-5 space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2"><CalendarDays size={16} className="text-teal-700" aria-hidden="true" />{appointment.date}</p>
                <p className="flex items-center gap-2"><Clock3 size={16} className="text-teal-700" aria-hidden="true" />{appointment.time}</p>
            </div>
            <button
                type="button"
                className="mt-5 min-h-11 w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                disabled={!slot.available}
                aria-pressed={selected}
                onClick={() => onSelect(slot)}
            >
                {slot.available ? (selected ? 'Selected' : 'Choose appointment') : 'Unavailable'}
            </button>
        </article>
    );
}
