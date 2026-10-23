import { BookOpenCheck, CalendarDays, ClipboardList, DatabaseZap, Search, XCircle } from 'lucide-react';

export type ApiScreen = 'reset' | 'slots' | 'create-booking' | 'bookings' | 'lookup' | 'cancel';

type SidebarProps = {
    active: ApiScreen;
    onChange: (screen: ApiScreen) => void;
};

const links: Array<{ screen: ApiScreen; label: string; icon: typeof CalendarDays }> = [
    { screen: 'reset', label: 'Reset slots', icon: DatabaseZap },
    { screen: 'slots', label: 'Slots', icon: CalendarDays },
    { screen: 'create-booking', label: 'Create booking', icon: BookOpenCheck },
    { screen: 'bookings', label: 'Bookings', icon: ClipboardList },
    { screen: 'lookup', label: 'Find booking', icon: Search },
    { screen: 'cancel', label: 'Cancel booking', icon: XCircle }
];

export function Sidebar({ active, onChange }: SidebarProps) {
    return (
        <nav className="border-b border-slate-200 bg-slate-950 p-4 text-white lg:min-h-screen lg:border-b-0 lg:border-r lg:p-5" aria-label="API screens">
            <p className="text-lg font-bold">Clinical Booking API</p>
            <p className="mt-1 text-sm text-slate-400">Local endpoint tester</p>
            <div className="mt-5 flex gap-2 overflow-x-auto lg:flex-col">
                {links.map(({ screen, label, icon: Icon }) => <button key={screen} type="button" className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${active === screen ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`} onClick={() => onChange(screen)}><Icon size={17} aria-hidden="true" />{label}</button>)}
            </div>
        </nav>
    );
}
