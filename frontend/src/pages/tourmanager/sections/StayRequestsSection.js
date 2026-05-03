import { useEffect, useMemo, useState } from 'react';
import { MdDelete, MdHotel, MdPlaylistAddCheck } from 'react-icons/md';
import { useTourManagerStayInventory, useTourManagerStayRequests } from '../../../hooks/useTourManagerAPI';

const STAY_STATUS_OPTIONS = [
  'Partially Allocated',
  'Stay Confirmed',
  'Check-in Ready',
  'Checked-in',
  'Checked-out'
];

const STAY_STATUS_DROPDOWN_OPTIONS = [
  'Awaiting Stay Allocation',
  ...STAY_STATUS_OPTIONS
];

const CHECKED_OUT_HIDE_AFTER_MS = 2 * 60 * 1000;

const getTodayDateInput = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

export default function StayRequestsSection() {
  const [statusFilter, setStatusFilter] = useState('');
  const { requests, loading, error, allocateStay, deleteStayAllocation } = useTourManagerStayRequests(statusFilter);
  const { inventory } = useTourManagerStayInventory();
  const [message, setMessage] = useState('');
  const [formState, setFormState] = useState({});
  const [now, setNow] = useState(Date.now());
  const todayDate = getTodayDateInput();

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const availableInventory = useMemo(() => {
    return (inventory || []).filter((item) => item.isActive);
  }, [inventory]);

  const visibleRequests = useMemo(() => {
    if (statusFilter !== '') {
      return requests;
    }

    return requests || [];
  }, [requests, statusFilter]);

  const getFormForBooking = (bookingId, booking) => {
    const existing = formState[bookingId];
    if (existing) return existing;
    return {
      inventoryId: '',
      stayStatus: booking?.stayStatus || 'Awaiting Stay Allocation',
      roomsAllocated: booking?.packageOptions?.roomCount || 1,
      checkInDate: booking?.packageOptions?.checkInDate ? new Date(booking.packageOptions.checkInDate).toISOString().slice(0, 10) : '',
      checkOutDate: booking?.packageOptions?.checkOutDate ? new Date(booking.packageOptions.checkOutDate).toISOString().slice(0, 10) : '',
      notes: '',
      stayManagerNotes: booking?.stayManagerNotes || ''
    };
  };

  const updateBookingForm = (bookingId, patch, booking) => {
    const current = getFormForBooking(bookingId, booking);
    setFormState((prev) => ({
      ...prev,
      [bookingId]: {
        ...current,
        ...patch
      }
    }));
  };

  const handleAllocate = async (booking) => {
    const state = getFormForBooking(booking._id, booking);
    setMessage('');

    if (!state.inventoryId || !state.checkInDate || !state.checkOutDate || !Number(state.roomsAllocated)) {
      setMessage('Select inventory, dates, and rooms before allocating.');
      return;
    }

    if (new Date(state.checkInDate) >= new Date(state.checkOutDate)) {
      setMessage('Check-out date must be later than check-in date.');
      return;
    }

    if (state.checkInDate < todayDate || state.checkOutDate < todayDate) {
      setMessage('Stay dates must be today or future dates.');
      return;
    }

    try {
      await allocateStay(booking._id, {
        stayStatus: state.stayStatus || booking?.stayStatus || 'Awaiting Stay Allocation',
        stayManagerNotes: state.stayManagerNotes,
        allocations: [
          {
            inventoryId: state.inventoryId,
            roomsAllocated: Number(state.roomsAllocated),
            checkInDate: state.checkInDate,
            checkOutDate: state.checkOutDate,
            notes: state.notes
          }
        ]
      });
      setMessage(`Stay allocated for booking ${String(booking._id).slice(-6).toUpperCase()}.`);
    } catch (err) {
      setMessage(err.message || 'Failed to allocate stay.');
    }
  };

  const handleStatusUpdate = async (booking, nextStatus) => {
    updateBookingForm(booking._id, { stayStatus: nextStatus }, booking);
  };

  const handleDeleteAllocation = async (booking, allocation) => {
    if (!allocation?._id) {
      setMessage('Unable to delete this allocation item. Missing allocation id.');
      return;
    }

    if (!window.confirm('Delete this stay allocation?')) {
      return;
    }

    setMessage('');
    try {
      await deleteStayAllocation(booking._id, allocation._id);
      setMessage('Stay allocation deleted successfully.');
    } catch (err) {
      setMessage(err.message || 'Failed to delete stay allocation.');
    }
  };

  const getCheckedOutCountdown = (booking) => {
    if (!booking || booking.stayStatus !== 'Checked-out' || !booking.stayCheckedOutAt) {
      return null;
    }

    const checkedOutAt = new Date(booking.stayCheckedOutAt).getTime();
    if (Number.isNaN(checkedOutAt)) return null;

    const remainingMs = Math.max(0, checkedOutAt + CHECKED_OUT_HIDE_AFTER_MS - now);
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.3em] text-cyan-700 uppercase">Stay Operations</p>
        <h2 className="text-2xl font-bold text-cyan-950">Stay Requests</h2>
        <p className="text-cyan-800/80">Allocate rooms and track stay readiness for tour bookings.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {['', ...STAY_STATUS_OPTIONS].map((status) => (
          <button
            key={status || 'All'}
            onClick={() => setStatusFilter(status)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${statusFilter === status ? 'bg-cyan-700 text-white border-cyan-700' : 'bg-white text-cyan-700 border-cyan-200 hover:bg-cyan-50'}`}
          >
            {status || 'All'}
          </button>
        ))}
      </div>

      {message && (
        <p className="text-sm font-semibold text-cyan-800 bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-2">
          {message}
        </p>
      )}

      <div className="space-y-4">
        {loading && requests.length === 0 && <p className="text-cyan-700">Loading stay requests...</p>}
        {error && <p className="text-rose-600">{error}</p>}
        {!error && visibleRequests.length === 0 && !loading && (
          <p className="text-cyan-800/80">No stay requests found for this status.</p>
        )}

        {!error && visibleRequests.map((booking) => {
          const currentForm = getFormForBooking(booking._id, booking);
          const requestedRoomType = booking?.packageOptions?.roomType;
          const requestedRoomCount = Number(booking?.packageOptions?.roomCount || 1);
          const matchedInventory = availableInventory.filter((item) => !requestedRoomType || item.roomType === requestedRoomType);
          const filteredInventory = matchedInventory.length > 0 ? matchedInventory : availableInventory;
          return (
            <div key={booking._id} className="bg-white rounded-3xl border border-cyan-100 p-5 shadow-[0_16px_36px_-28px_rgba(8,145,178,0.55)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-cyan-950">{booking.tourPackage?.title || booking.packageOptions?.tourTitle || 'Tour Booking'}</p>
                  <p className="text-sm text-cyan-800/80">{booking.tourist?.name || 'Tourist'} • {booking.tourist?.phone || 'No phone'}</p>
                  <p className="text-xs text-cyan-800 mt-1">Current stay status: {booking.stayStatus || 'Awaiting Stay Allocation'}</p>
                  {booking.stayStatus === 'Checked-out' && getCheckedOutCountdown(booking) && (
                    <p className="text-xs text-amber-700 mt-1">
                      Will disappear in {getCheckedOutCountdown(booking)}
                    </p>
                  )}
                  <p className="text-xs text-cyan-700 mt-1">
                    Requested: {requestedRoomType || 'Any'} • {requestedRoomCount} room(s)
                    {booking?.packageOptions?.checkInDate && booking?.packageOptions?.checkOutDate
                      ? ` • ${new Date(booking.packageOptions.checkInDate).toLocaleDateString()} to ${new Date(booking.packageOptions.checkOutDate).toLocaleDateString()}`
                      : ''}
                  </p>
                </div>
                <select
                  value={currentForm.stayStatus || booking.stayStatus || 'Awaiting Stay Allocation'}
                  onChange={(event) => handleStatusUpdate(booking, event.target.value)}
                  disabled={loading}
                  className="px-3 py-2 rounded-xl border border-cyan-200 text-sm"
                >
                  {STAY_STATUS_DROPDOWN_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
                <select
                  value={currentForm.inventoryId}
                  onChange={(event) => updateBookingForm(booking._id, { inventoryId: event.target.value }, booking)}
                  className="px-3 py-2.5 rounded-xl border border-cyan-200 text-sm"
                >
                  <option value="">Select Property / Room Type</option>
                  {filteredInventory.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.propertyName} • {item.roomType} • {item.location}
                    </option>
                  ))}
                </select>
                {requestedRoomType && matchedInventory.length === 0 && (
                  <p className="text-xs text-amber-700 md:col-span-2 lg:col-span-5">
                    No exact {requestedRoomType} room type inventory found. Showing all active inventory.
                  </p>
                )}
                <input
                  type="number"
                  min="1"
                  value={currentForm.roomsAllocated}
                  onChange={(event) => updateBookingForm(booking._id, { roomsAllocated: Number(event.target.value || 1) }, booking)}
                  className="px-3 py-2.5 rounded-xl border border-cyan-200 text-sm"
                  placeholder="Rooms"
                />
                <input
                  type="date"
                  value={currentForm.checkInDate}
                  onChange={(event) => updateBookingForm(booking._id, { checkInDate: event.target.value }, booking)}
                  min={todayDate}
                  className="px-3 py-2.5 rounded-xl border border-cyan-200 text-sm"
                />
                <input
                  type="date"
                  value={currentForm.checkOutDate}
                  onChange={(event) => updateBookingForm(booking._id, { checkOutDate: event.target.value }, booking)}
                  min={currentForm.checkInDate || todayDate}
                  className="px-3 py-2.5 rounded-xl border border-cyan-200 text-sm"
                />
                <button
                  onClick={() => handleAllocate(booking)}
                  disabled={loading}
                  className="px-3 py-2.5 rounded-xl bg-cyan-700 text-white text-sm font-semibold hover:bg-cyan-800 inline-flex items-center justify-center gap-2"
                >
                  <MdPlaylistAddCheck /> Allocate
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <input
                  value={currentForm.notes}
                  onChange={(event) => updateBookingForm(booking._id, { notes: event.target.value }, booking)}
                  placeholder="Allocation notes"
                  className="px-3 py-2.5 rounded-xl border border-cyan-200 text-sm"
                />
                <input
                  value={currentForm.stayManagerNotes}
                  onChange={(event) => updateBookingForm(booking._id, { stayManagerNotes: event.target.value }, booking)}
                  placeholder="Manager notes"
                  className="px-3 py-2.5 rounded-xl border border-cyan-200 text-sm"
                />
              </div>

              {Array.isArray(booking.stayAllocations) && booking.stayAllocations.length > 0 && (
                <div className="mt-4 border-t border-cyan-100 pt-3">
                  <p className="text-xs uppercase tracking-wide font-bold text-cyan-700 mb-2">Current Allocation</p>
                  <div className="space-y-2">
                    {booking.stayAllocations.map((allocation, index) => (
                      <div key={`${booking._id}-${index}`} className="text-sm text-cyan-900 bg-cyan-50/60 border border-cyan-100 rounded-xl px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <MdHotel className="text-cyan-700" />
                          <span className="font-semibold">{allocation.propertyName}</span>
                          <span>• {allocation.roomType}</span>
                          <span>• {allocation.roomsAllocated} rooms</span>
                        </div>
                        <button
                          onClick={() => handleDeleteAllocation(booking, allocation)}
                          disabled={loading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                        >
                          <MdDelete />
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
