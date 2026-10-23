import { CirclePlus, Trash2 } from 'lucide-react';

export type SlotDraft = {
    key: string;
    id: string;
    provider: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
};

type ResetSlotsFormProps = {
    slots: SlotDraft[];
    error: string | undefined;
    success: string | undefined;
    isSubmitting: boolean;
    onChange: (key: string, field: keyof Omit<SlotDraft, 'key'>, value: string) => void;
    onAdd: () => void;
    onRemove: (key: string) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function ResetSlotsForm({ slots, error, success, isSubmitting, onChange, onAdd, onRemove, onSubmit }: ResetSlotsFormProps) {
    return (
        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5" aria-labelledby="test-slots-title">
            <h3 id="test-slots-title" className="font-bold text-amber-950">Test appointment slots</h3>
            <p className="mt-1 text-sm text-amber-900">Submitting replaces all current slots and bookings. Add every slot you want to keep before resetting.</p>
            <form className="mt-5 space-y-4" onSubmit={onSubmit}>
                {slots.map((slot, index) => (
                    <fieldset key={slot.key} className="grid gap-3 rounded-xl border border-amber-200 bg-white p-4 md:grid-cols-2">
                        <legend className="px-1 text-sm font-bold text-slate-800">Slot {index + 1}</legend>
                        <div>
                            <label className="text-sm font-semibold text-slate-700" htmlFor={`slot-id-${slot.key}`}>Slot ID</label>
                            <input id={`slot-id-${slot.key}`} className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-teal-700 focus:ring-3 focus:ring-teal-100" value={slot.id} onChange={(event) => onChange(slot.key, 'id', event.target.value)} required />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-700" htmlFor={`slot-provider-${slot.key}`}>Provider</label>
                            <input id={`slot-provider-${slot.key}`} className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-teal-700 focus:ring-3 focus:ring-teal-100" value={slot.provider} onChange={(event) => onChange(slot.key, 'provider', event.target.value)} required />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-700" htmlFor={`slot-start-date-${slot.key}`}>Start date</label>
                            <input id={`slot-start-date-${slot.key}`} className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-teal-700 focus:ring-3 focus:ring-teal-100" type="date" value={slot.startDate} onChange={(event) => onChange(slot.key, 'startDate', event.target.value)} required />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-700" htmlFor={`slot-start-time-${slot.key}`}>Start time</label>
                            <input id={`slot-start-time-${slot.key}`} className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-teal-700 focus:ring-3 focus:ring-teal-100" type="time" value={slot.startTime} onChange={(event) => onChange(slot.key, 'startTime', event.target.value)} required />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-700" htmlFor={`slot-end-date-${slot.key}`}>End date</label>
                            <input id={`slot-end-date-${slot.key}`} className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-teal-700 focus:ring-3 focus:ring-teal-100" type="date" value={slot.endDate} onChange={(event) => onChange(slot.key, 'endDate', event.target.value)} required />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-700" htmlFor={`slot-end-time-${slot.key}`}>End time</label>
                            <input id={`slot-end-time-${slot.key}`} className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-teal-700 focus:ring-3 focus:ring-teal-100" type="time" value={slot.endTime} onChange={(event) => onChange(slot.key, 'endTime', event.target.value)} required />
                        </div>
                        {slots.length > 1 && <button type="button" className="justify-self-start text-sm font-bold text-rose-700 underline" onClick={() => onRemove(slot.key)}><Trash2 size={15} className="mr-1 inline" aria-hidden="true" />Remove slot {index + 1}</button>}
                    </fieldset>
                ))}
                {error && <p className="rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-800" role="alert">{error}</p>}
                {success && <p className="rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800" role="status">{success}</p>}
                <div className="flex flex-wrap gap-3">
                    <button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-amber-400 bg-white px-3 py-2 text-sm font-bold text-amber-950" onClick={onAdd}><CirclePlus size={17} aria-hidden="true" />Add another slot</button>
                    <button type="submit" className="min-h-10 rounded-lg bg-amber-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60" disabled={isSubmitting}>{isSubmitting ? 'Resetting...' : 'Reset slots'}</button>
                </div>
            </form>
        </section>
    );
}
