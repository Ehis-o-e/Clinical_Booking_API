import type { AppointmentSlot } from '../types/api';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit'
});

export const formatAppointmentDate = (date: string) => dateFormatter.format(new Date(date));

export const formatAppointmentTime = (start: string, end: string) =>
    `${timeFormatter.format(new Date(start))} – ${timeFormatter.format(new Date(end))}`;

export const formatSlot = (slot: AppointmentSlot) => ({
    date: formatAppointmentDate(slot.start),
    time: formatAppointmentTime(slot.start, slot.end)
});
