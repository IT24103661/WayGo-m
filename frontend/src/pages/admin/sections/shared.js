// Shared UI atoms used across admin sections
import { MdCheck, MdCancel, MdHourglassEmpty, MdTrendingUp } from 'react-icons/md';

/* ── Status badge ── */
export function Badge({ status }) {
  const styles = {
    Completed:  'bg-emerald-100 text-emerald-700',
    Pending:    'bg-yellow-100  text-yellow-700',
    Cancelled:  'bg-red-100     text-red-600',
    'En Route': 'bg-blue-100    text-blue-700',
    Accepted:   'bg-indigo-100  text-indigo-700',
  };
  const icons = { Completed: MdCheck, Pending: MdHourglassEmpty, Cancelled: MdCancel, 'En Route': MdTrendingUp, Accepted: MdCheck };
  const Icon = icons[status] || MdCheck;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-slate-700'}`}>
      <Icon className="text-xs" />{status}
    </span>
  );
}

/* ── Role colour pill ── */
export const ROLE_COLOR = {
  Tourist:     'bg-blue-100   text-blue-700',
  Driver:      'bg-green-100  text-green-700',
  TourManager: 'bg-purple-100 text-purple-700',
  FleetManager:'bg-orange-100 text-orange-700',
  SystemAdmin: 'bg-red-100    text-red-700',
};

/* ── Section add-button ── */
export function AddBtn({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl font-medium transition-colors"
    >
      + {label}
    </button>
  );
}
