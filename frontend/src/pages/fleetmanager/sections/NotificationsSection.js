import { useState } from 'react';
import { useFleetNotifications } from '../../../hooks/useFleetManagerAPI';
import { MdNotifications } from 'react-icons/md';

export default function NotificationsSection() {
  const {
    notifications,
    loading,
    error,
    markRead,
    markAllAsRead
  } = useFleetNotifications();
  const [message, setMessage] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-cyan-900 text-white flex items-center justify-center shadow-md shadow-cyan-300/70">
            <MdNotifications className="text-lg" />
          </span>
          <h2 className="text-xl font-bold text-cyan-950">Fleet Notifications</h2>
        </div>
        <p className="text-sm text-cyan-700/80">Read-only feed for booking and salary updates. Use Fleet Bookings section for actions.</p>
        {!loading && notifications.some((item) => !item.isRead) && (
          <button
            type="button"
            onClick={async () => {
              try {
                await markAllAsRead();
              } catch (err) {
                setMessage(err.message || 'Failed to mark all notifications as read.');
              }
            }}
            className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white transition-all duration-200"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="relative bg-white rounded-3xl shadow-[0_20px_40px_-28px_rgba(12,27,42,0.25)] border border-cyan-100 p-5 space-y-3 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-200 via-cyan-500/70 to-sky-200" />
        {message && <p className="text-sm text-cyan-700 font-semibold">{message}</p>}
        {loading && <p className="text-slate-500">Loading notifications...</p>}
        {!loading && error && <p className="text-rose-600">{error}</p>}
        {!loading && !error && notifications.length === 0 && (
          <p className="text-slate-500">No notifications yet.</p>
        )}

        {!loading && notifications.map((item) => (
          <div
            key={item._id}
            className={`rounded-2xl border px-4 py-3 ${item.isRead ? 'border-slate-200 bg-slate-50' : 'border-cyan-300 bg-white'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  {!item.isRead && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-900 text-white uppercase tracking-wide transition-all duration-200 hover:shadow-[0_8px_18px_-12px_rgba(8,145,178,0.8)]">New</span>}
                  <p className="text-sm font-semibold text-slate-900">{item.message}</p>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
              {!item.isRead && (
                <button
                  onClick={async () => {
                    try {
                      await markRead(item._id);
                    } catch (err) {
                      setMessage(err.message || 'Failed to mark notification as read.');
                    }
                  }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_22px_-12px_rgba(8,145,178,0.9)]"
                >
                  Mark Read
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
