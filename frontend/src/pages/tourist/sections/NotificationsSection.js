import { useState } from 'react';
import { MdNotifications, MdCheckCircle, MdInfo, MdWarning, MdClose } from 'react-icons/md';
import { useTouristNotifications } from '../../../hooks/useTouristAPI';

const TYPE_BADGE = {
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  info: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  error: 'bg-rose-50 text-rose-700 border border-rose-200',
};

const TYPE_ICON_COLOR = {
  success: 'text-emerald-700',
  info: 'text-cyan-700',
  warning: 'text-amber-700',
  error: 'text-rose-700',
};

export default function NotificationsSection() {
  const { notifications, loading, error, markAsRead, markAllAsRead, deleteNotification } = useTouristNotifications();
  const [activeNotification, setActiveNotification] = useState(null);

  const mappedNotifications = (notifications || []).map((item) => {
    let type = 'info';
    let icon = MdInfo;

    if (item.type === 'BOOKING_ASSIGNED' || item.type === 'BOOKING_STATUS') {
      type = 'success';
      icon = MdCheckCircle;
    } else if (item.type === 'BOOKING_DELETED') {
      type = 'warning';
      icon = MdWarning;
    }

    return {
      id: item._id,
      type,
      title: item.type === 'BOOKING_ASSIGNED'
        ? 'Booking Assigned'
        : item.type === 'BOOKING_STATUS'
          ? 'Booking Status Updated'
          : item.type === 'BOOKING_DELETED'
            ? 'Booking Removed'
            : 'Booking Update',
      message: item.message,
      time: item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now',
      icon,
      isRead: Boolean(item.isRead),
      driverName: item.booking?.assignedDriver?.name || '',
      driverPhone: item.booking?.assignedDriver?.phone || '',
      vehicleLabel: item.booking?.assignedVehicle
        ? `${item.booking.assignedVehicle.plateNumber || ''} ${item.booking.assignedVehicle.make || ''} ${item.booking.assignedVehicle.model || ''}`.trim()
        : ''
    };
  });

  const unreadCount = mappedNotifications.filter((item) => !item.isRead).length;

  const openNotificationPopup = async (notif) => {
    setActiveNotification(notif);
    if (!notif.isRead) {
      try {
        await markAsRead(notif.id);
      } catch {
        // Keep popup open even if mark-as-read fails.
      }
    }
  };

  const handleDeleteNotification = async (notificationId, closePopup = false) => {
    try {
      await deleteNotification(notificationId);
      if (closePopup) {
        setActiveNotification(null);
      }
    } catch {
      // Hook already stores API error state.
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up font-sans">

      {/* Header & Mark All as Read */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-100 bg-white p-5 shadow-[0_20px_45px_-30px_rgba(8,145,178,0.55)]">
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-sky-200/35 blur-3xl" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-100 border border-cyan-200 text-cyan-700 shadow-sm">
            <MdNotifications className="text-xl" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-cyan-950 tracking-tight">Notifications</h2>
            <p className="text-sm text-cyan-800/80 font-semibold">{unreadCount} unread messages</p>
          </div>
        </div>
        <button
          type="button"
          onClick={markAllAsRead}
          className="text-sm bg-cyan-700 hover:bg-cyan-800 text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-12px_rgba(8,145,178,0.85)]"
        >
          Mark all as read
        </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading && (
          <div className="rounded-2xl border border-cyan-100 bg-white p-5 text-cyan-800/80 shadow-sm">
            Loading notifications...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
            {error}
          </div>
        )}

        {!loading && !error && mappedNotifications.length === 0 && (
          <div className="rounded-2xl border border-cyan-100 bg-white p-5 text-cyan-800/80 shadow-sm">
            No notifications yet.
          </div>
        )}

        {!loading && !error && mappedNotifications.map((notif) => {
          const Icon = notif.icon;
          return (
            <div 
              key={notif.id} 
              onClick={() => openNotificationPopup(notif)}
              className={`group rounded-2xl border p-5 transition-all duration-200 relative overflow-hidden ${
                notif.isRead
                  ? 'bg-white border-cyan-100 shadow-sm'
                  : 'bg-cyan-50/70 border-cyan-300 shadow-[0_14px_28px_-18px_rgba(8,145,178,0.65)]'
              }`}
            >
              <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-cyan-400 to-sky-500 opacity-80" />

              <div className="flex items-start gap-4 relative z-10">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${TYPE_BADGE[notif.type]}`}>
                  <Icon className={`text-xl ${TYPE_ICON_COLOR[notif.type]}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {!notif.isRead && (
                        <span className="rounded-full bg-cyan-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">New</span>
                      )}
                      <h3 className="font-bold text-cyan-950 tracking-tight">{notif.title}</h3>
                    </div>
                    <span className="text-xs font-semibold text-cyan-900/60 whitespace-nowrap">
                      {notif.time}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">
                    {notif.message}
                  </p>
                  {notif.driverName && (
                    <p className="text-xs text-cyan-800 mt-2 font-semibold">
                      Driver: {notif.driverName} {notif.driverPhone ? `| Contact: ${notif.driverPhone}` : ''}
                    </p>
                  )}
                  {notif.vehicleLabel && (
                    <p className="text-xs text-slate-600 mt-1 font-medium">
                      Vehicle: {notif.vehicleLabel}
                    </p>
                  )}
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNotification(notif.id);
                  }}
                  className="px-3 py-2 text-xs font-semibold rounded-xl flex-shrink-0 transition-all duration-200 border border-cyan-200 bg-white text-cyan-700 hover:bg-cyan-700 hover:text-white"
                >
                  <MdClose className="text-base" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {activeNotification && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center bg-zinc-950/45 px-4 pt-16 sm:pt-20 overflow-y-auto"
          onClick={() => setActiveNotification(null)}
        >
          <div
            className="w-full max-w-xl rounded-3xl border border-cyan-100 bg-white p-6 shadow-[0_30px_60px_-30px_rgba(8,145,178,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-xl font-bold text-cyan-950">{activeNotification.title}</h4>
                <p className="mt-1 text-sm font-semibold text-cyan-800/70">{activeNotification.time}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteNotification(activeNotification.id, true)}
                className="rounded-xl border border-cyan-200 bg-white p-2 text-cyan-700 hover:bg-cyan-700 hover:text-white"
              >
                <MdClose className="text-lg" />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
              <p className="text-sm leading-relaxed text-slate-700">{activeNotification.message}</p>
              {activeNotification.driverName && (
                <p className="mt-3 text-sm font-semibold text-cyan-800">
                  Driver: {activeNotification.driverName}
                  {activeNotification.driverPhone ? ` | Contact: ${activeNotification.driverPhone}` : ''}
                </p>
              )}
              {activeNotification.vehicleLabel && (
                <p className="mt-1 text-sm font-medium text-slate-700">Vehicle: {activeNotification.vehicleLabel}</p>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveNotification(null)}
                className="rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}