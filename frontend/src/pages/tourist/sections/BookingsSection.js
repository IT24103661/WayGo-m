import { useMemo, useState } from 'react';
import {
  MdCheckCircle,
  MdHourglassEmpty,
  MdCancel,
  MdDirectionsCar,
  MdTour,
  MdCalendarToday,
  MdEdit,
  MdDelete,
  MdPhone,
  MdSupportAgent,
  MdClose,
  MdLocationOn,
  MdGroup,
  MdReceiptLong
} from 'react-icons/md';
import { useTouristBookings } from '../../../hooks/useTouristAPI';

const STATUS_BADGE = {
  'Upcoming': 'bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-sm',
  'Completed': 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm',
  'Pending': 'bg-amber-50 text-amber-600 border border-amber-200 shadow-sm',
  'Accepted': 'bg-sky-50 text-sky-700 border border-sky-200 shadow-sm',
  'En Route': 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm',
  'Cancelled': 'bg-rose-50 text-rose-600 border border-rose-200 shadow-sm',
};

const STAY_BADGE = {
  'Awaiting Stay Allocation': 'bg-amber-50 text-amber-700 border border-amber-200',
  'Partially Allocated': 'bg-sky-50 text-sky-700 border border-sky-200',
  'Stay Confirmed': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Check-in Ready': 'bg-cyan-50 text-cyan-700 border border-cyan-200',
  'Checked-in': 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  'Checked-out': 'bg-slate-100 text-slate-700 border border-slate-200'
};

const STATUS_ICON = {
  'Upcoming': MdHourglassEmpty,
  'Completed': MdCheckCircle,
  'Pending': MdHourglassEmpty,
  'Accepted': MdCalendarToday,
  'En Route': MdDirectionsCar,
  'Cancelled': MdCancel,
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'tour', label: 'Tours' },
  { key: 'taxi', label: 'Taxi' }
];

const STATUS_TABS = [
  { key: 'all', label: 'All Reservations' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' }
];

const normalizeStatus = (statusValue) => {
  const value = String(statusValue || '').trim();
  if (!value) return 'Pending';
  if (value.toLowerCase() === 'accepted') return 'Upcoming';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatBookingDate = (dateValue) => {
  if (!dateValue) return '-';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const formatCurrency = (value) => `LKR ${Number(value || 0).toLocaleString()}`;

const deriveStatusBucket = (status) => {
  if (status === 'Completed') return 'completed';
  if (status === 'Cancelled') return 'cancelled';
  if (status === 'En Route') return 'ongoing';
  if (status === 'Pending' || status === 'Upcoming' || status === 'Accepted') return 'upcoming';
  return 'upcoming';
};

const BOOKING_TIMELINE = ['Requested', 'Confirmed', 'Assigned', 'Completed'];

const ROOM_RATES = {
  Standard: 6500,
  Deluxe: 9800,
  Family: 14200,
  Suite: 19800
};

const MEAL_RATES = {
  'No Meals': 0,
  Breakfast: 1200,
  'Half Board': 2800,
  'Full Board': 4200
};

const EXTRAS_RATES = {
  airportPickup: 4500,
  privateGuide: 9000,
  safariPass: 6500
};

const getTimelineStep = (status) => {
  if (status === 'Pending') return 0;
  if (status === 'Upcoming' || status === 'Accepted') return 1;
  if (status === 'En Route') return 2;
  if (status === 'Completed') return 3;
  return 0;
};

const getTodayDateInput = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const validateManageForm = (form, isTour) => {
  const pickup = String(form.pickupLocation || '').trim();
  const dropoff = String(form.dropoffLocation || '').trim();

  if (!pickup || pickup.length < 3 || pickup.length > 180) {
    return 'Pickup location must be between 3 and 180 characters.';
  }
  if (!isTour) {
    if (dropoff && (dropoff.length < 3 || dropoff.length > 180)) {
      return 'Dropoff location must be between 3 and 180 characters.';
    }
    if (pickup && dropoff && pickup.toLowerCase() === dropoff.toLowerCase()) {
      return 'Pickup and dropoff locations cannot be the same.';
    }
  }

  const pickupAt = new Date(form.pickupTime).getTime();
  if (!pickupAt || Number.isNaN(pickupAt)) {
    return 'Pickup time must be a valid date and time.';
  }
  if (pickupAt < Date.now() + 5 * 60 * 1000) {
    return 'Pickup time must be at least 5 minutes in the future.';
  }

  if (isTour) {
    const todayDate = getTodayDateInput();
    const adults = Number(form.adults || 0);
    const children = Number(form.children || 0);
    const roomCount = Number(form.roomCount || 0);
    if (!Number.isInteger(adults) || adults < 1 || adults > 20) {
      return 'Adults must be between 1 and 20.';
    }
    if (!Number.isInteger(children) || children < 0 || children > 20) {
      return 'Children must be between 0 and 20.';
    }
    if (!Number.isInteger(roomCount) || roomCount < 1 || roomCount > 20) {
      return 'Room count must be between 1 and 20.';
    }
    if (form.checkInDate && form.checkInDate < todayDate) {
      return 'Check-in date cannot be in the past.';
    }
    if (form.checkOutDate && form.checkOutDate < todayDate) {
      return 'Check-out date cannot be in the past.';
    }
    if (form.checkInDate && form.checkOutDate && new Date(form.checkOutDate).getTime() <= new Date(form.checkInDate).getTime()) {
      return 'Check-out date must be after check-in date.';
    }
  }

  return '';
};

export default function BookingsSection() {
  const { bookings, loading, error, cancelBooking, updateBooking, deleteBooking } = useTouristBookings();
  const [activeStatusTab, setActiveStatusTab] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const todayDate = getTodayDateInput();
  const [manageForm, setManageForm] = useState({
    pickupLocation: '',
    dropoffLocation: '',
    pickupTime: '',
    checkInDate: '',
    checkOutDate: '',
    adults: 2,
    children: 0,
    roomType: 'Standard',
    roomCount: 1,
    mealPlan: 'No Meals',
    dietPreference: '',
    airportPickup: false,
    privateGuide: false,
    safariPass: false
  });

  const mappedBookings = useMemo(() => {
    return (Array.isArray(bookings) ? bookings : []).map((booking) => {
      const isTour = booking.bookingType === 'Tour' || Boolean(booking.tourPackage);
      const status = normalizeStatus(booking.status);
      return {
        ...booking,
        isTour,
        status,
        statusBucket: deriveStatusBucket(status),
        displayId: `#BK-${String(booking._id || '').slice(-4).toUpperCase()}`,
        typeLabel: isTour ? 'Tour' : 'Taxi',
        destination: isTour
          ? booking.packageOptions?.tourTitle || booking.tourPackage?.title || booking.dropoffLocation || booking.pickupLocation || 'Tour Booking'
          : `${booking.pickupLocation || '-'} -> ${booking.dropoffLocation || '-'}`,
        driverName: booking.assignedDriver?.name || 'Unassigned',
        driverPhone: booking.assignedDriver?.phone || '',
        packageOptions: booking.packageOptions || {},
        stayStatus: booking.stayStatus || 'Awaiting Stay Allocation',
        stayAllocations: Array.isArray(booking.stayAllocations) ? booking.stayAllocations : [],
        paymentStatus: booking.paymentStatus || 'Pending',
        dateLabel: formatBookingDate(booking.pickupTime),
        amountLabel: formatCurrency(booking.totalPrice)
      };
    });
  }, [bookings]);

  const displayBookings = useMemo(() => {
    const byStatus = activeStatusTab === 'all'
      ? mappedBookings
      : mappedBookings.filter((b) => b.statusBucket === activeStatusTab);

    if (activeFilter === 'all') return byStatus;
    if (activeFilter === 'tour') return byStatus.filter((b) => b.isTour);
    return byStatus.filter((b) => !b.isTour);
  }, [activeFilter, activeStatusTab, mappedBookings]);

  const stats = useMemo(() => {
    const initial = { upcoming: 0, completed: 0, pending: 0, cancelled: 0 };
    mappedBookings.forEach((booking) => {
      if (booking.status === 'Completed') initial.completed += 1;
      else if (booking.status === 'Cancelled') initial.cancelled += 1;
      else if (booking.status === 'Pending') initial.pending += 1;
      else initial.upcoming += 1;
    });
    return initial;
  }, [mappedBookings]);

  const handleCancel = async (bookingId) => {
    setMessage('');
    setActionLoadingId(bookingId);
    try {
      await cancelBooking(bookingId);
      setMessage('Booking cancelled successfully.');
    } catch (err) {
      setMessage(err.message || 'Failed to cancel booking.');
    } finally {
      setActionLoadingId('');
    }
  };

  const handleDelete = async (bookingId) => {
    if (!window.confirm('Delete this booking permanently?')) return;
    setMessage('');
    setActionLoadingId(bookingId);
    try {
      await deleteBooking(bookingId);
      setMessage('Booking deleted successfully.');
      if (selectedBooking && selectedBooking._id === bookingId) {
        setSelectedBooking(null);
      }
    } catch (err) {
      setMessage(err.message || 'Failed to delete booking.');
    } finally {
      setActionLoadingId('');
    }
  };

  const handleQuickEdit = async (booking) => {
    const options = booking.packageOptions || {};
    setSelectedBooking(booking);
    setManageForm({
      pickupLocation: booking.pickupLocation || '',
      dropoffLocation: booking.dropoffLocation || '',
      pickupTime: booking.pickupTime ? new Date(booking.pickupTime).toISOString().slice(0, 16) : '',
      checkInDate: options.checkInDate ? new Date(options.checkInDate).toISOString().slice(0, 10) : '',
      checkOutDate: options.checkOutDate ? new Date(options.checkOutDate).toISOString().slice(0, 10) : '',
      adults: Number(options.adults || 2),
      children: Number(options.children || 0),
      roomType: options.roomType || 'Standard',
      roomCount: Number(options.roomCount || 1),
      mealPlan: options.mealPlan || 'No Meals',
      dietPreference: options.dietPreference || '',
      airportPickup: Boolean(options.extras?.airportPickup),
      privateGuide: Boolean(options.extras?.privateGuide),
      safariPass: Array.isArray(options.extras?.activityAddons) && options.extras.activityAddons.includes('Safari Pass')
    });
  };

  const isCutoffReached = (booking) => {
    const pickupAt = booking?.pickupTime ? new Date(booking.pickupTime).getTime() : 0;
    if (!pickupAt) return false;
    return (pickupAt - Date.now()) <= (24 * 60 * 60 * 1000);
  };

  const getNights = (start, end) => {
    if (!start || !end) return 1;
    const startAt = new Date(start).getTime();
    const endAt = new Date(end).getTime();
    const diff = Math.ceil((endAt - startAt) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  const getManagePricing = () => {
    if (!selectedBooking?.isTour) return { final: selectedBooking?.totalPrice || 0 };
    const nights = getNights(manageForm.checkInDate, manageForm.checkOutDate);
    const guests = Number(manageForm.adults || 0) + Number(manageForm.children || 0);
    const roomCost = (ROOM_RATES[manageForm.roomType] || ROOM_RATES.Standard) * nights * Number(manageForm.roomCount || 1);
    const mealCost = (MEAL_RATES[manageForm.mealPlan] || 0) * nights * Math.max(1, guests);
    const extrasCost =
      (manageForm.airportPickup ? EXTRAS_RATES.airportPickup : 0) +
      (manageForm.privateGuide ? EXTRAS_RATES.privateGuide : 0) +
      (manageForm.safariPass ? EXTRAS_RATES.safariPass : 0);
    const tourBase = Number(selectedBooking.packageOptions?.pricing?.tourBase || selectedBooking.totalPrice || 0);
    return {
      nights,
      guests,
      tourBase,
      roomCost,
      mealCost,
      extrasCost,
      final: tourBase + roomCost + mealCost + extrasCost
    };
  };

  const handleSaveManage = async (e) => {
    e.preventDefault();
    if (!selectedBooking?._id) return;
    const locked = isCutoffReached(selectedBooking);
    if (locked) {
      setMessage('Editing is locked within 24 hours of pickup. Please contact support.');
      return;
    }

    const validationError = validateManageForm(manageForm, Boolean(selectedBooking.isTour));
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setMessage('');
    setActionLoadingId(selectedBooking._id);
    const pricing = getManagePricing();
    try {
      await updateBooking(selectedBooking._id, {
        pickupLocation: manageForm.pickupLocation.trim(),
        dropoffLocation: selectedBooking.isTour ? '' : manageForm.dropoffLocation.trim(),
        pickupTime: manageForm.pickupTime,
        totalPrice: pricing.final,
        packageOptions: selectedBooking.isTour
          ? {
            tourTitle: selectedBooking.destination,
            checkInDate: manageForm.checkInDate,
            checkOutDate: manageForm.checkOutDate,
            adults: Number(manageForm.adults || 1),
            children: Number(manageForm.children || 0),
            nights: pricing.nights || 1,
            roomType: manageForm.roomType,
            roomCount: Number(manageForm.roomCount || 1),
            mealPlan: manageForm.mealPlan,
            dietPreference: manageForm.dietPreference,
            extras: {
              airportPickup: manageForm.airportPickup,
              privateGuide: manageForm.privateGuide,
              activityAddons: manageForm.safariPass ? ['Safari Pass'] : []
            },
            pricing: {
              tourBase: pricing.tourBase || 0,
              roomCost: pricing.roomCost || 0,
              mealCost: pricing.mealCost || 0,
              extrasCost: pricing.extrasCost || 0,
              finalTotal: pricing.final || 0
            }
          }
          : undefined
      });
      setMessage('Booking updated successfully.');
      setSelectedBooking(null);
    } catch (err) {
      setMessage(err.message || 'Failed to update booking.');
    } finally {
      setActionLoadingId('');
    }
  };

  const canMutate = (status) => status !== 'Cancelled' && status !== 'Completed';

  return (
    <div className="space-y-6 font-sans animate-fade-in-up pb-10">

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Upcoming', value: String(stats.upcoming), icon: MdCalendarToday, iconClass: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
          { label: 'Completed', value: String(stats.completed), icon: MdCheckCircle, iconClass: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
          { label: 'Pending', value: String(stats.pending), icon: MdHourglassEmpty, iconClass: 'bg-amber-50 text-amber-600 border-amber-200' },
          { label: 'Cancelled', value: String(stats.cancelled), icon: MdCancel, iconClass: 'bg-rose-50 text-rose-600 border-rose-200' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="relative bg-white rounded-[1.5rem] border border-cyan-100 p-6 flex flex-col justify-between overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${stat.iconClass}`}>
                  <Icon className="text-xl" />
                </div>
                <p className={`text-3xl font-black text-zinc-900`}>{stat.value}</p>
              </div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest relative z-10">{stat.label}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-[2rem] border border-cyan-100 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-cyan-100 bg-cyan-50/40 space-y-4">
          <h3 className="font-bold text-xl text-zinc-900 tracking-tight">My Reservations</h3>

          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveStatusTab(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors border ${
                  activeStatusTab === tab.key
                    ? 'bg-cyan-700 text-white border-cyan-700'
                    : 'bg-white text-cyan-700 border-cyan-200 hover:bg-cyan-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex bg-cyan-100/60 rounded-xl p-1 border border-cyan-200 w-fit">
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeFilter === filter.key
                    ? 'bg-white text-cyan-900 shadow-sm border border-cyan-200'
                    : 'text-cyan-700 hover:text-cyan-900'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div className="px-6 py-3 text-sm font-semibold text-cyan-700 bg-cyan-50 border-b border-cyan-100">
            {message}
          </div>
        )}

        <div className="p-5 space-y-4">
          {loading && <p className="text-center py-4 text-cyan-800/80">Loading bookings...</p>}
          {error && <p className="text-center py-4 text-red-500">{error}</p>}
          {!loading && !error && displayBookings.length === 0 && (
            <p className="text-center py-6 text-cyan-800/80">No bookings found.</p>
          )}

          {!loading && !error && displayBookings.map((booking) => {
            const StatusIcon = STATUS_ICON[booking.status] || STATUS_ICON.Pending;
            const timelineStep = getTimelineStep(booking.status);

            return (
              <div key={booking._id} className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-cyan-800 bg-cyan-100 px-2.5 py-1 rounded-md">{booking.displayId}</span>
                      <span className={`text-xs px-3 py-1.5 rounded-lg font-bold tracking-wide flex items-center gap-1.5 w-fit ${STATUS_BADGE[booking.status] || STATUS_BADGE.Pending}`}>
                        <StatusIcon className="text-sm" />
                        {booking.status}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold">Payment: {booking.paymentStatus}</span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center ${booking.isTour ? 'bg-teal-50 text-teal-600 border border-teal-200' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'}`}>
                        {booking.isTour ? <MdTour className="text-lg" /> : <MdDirectionsCar className="text-lg" />}
                      </div>
                      <div>
                        <p className="font-bold text-stone-800">{booking.destination}</p>
                        <p className="text-xs font-medium text-stone-500">{booking.typeLabel} reservation</p>
                        <p className="text-xs text-stone-600 mt-1"><MdCalendarToday className="inline mr-1" />{booking.dateLabel}</p>
                        <p className="text-xs text-stone-600 mt-1"><MdLocationOn className="inline mr-1" />Pickup: {booking.pickupLocation || '-'}</p>
                        <p className="text-xs text-stone-600 mt-1"><MdGroup className="inline mr-1" />Guests: {(booking.packageOptions.adults || 1) + (booking.packageOptions.children || 0)}</p>
                        {booking.isTour && (
                          <>
                            <p className="text-xs text-stone-600 mt-1">Room: {booking.packageOptions.roomType || 'Standard'} x {booking.packageOptions.roomCount || 1}</p>
                            <p className="text-xs text-stone-600 mt-1">Meal Plan: {booking.packageOptions.mealPlan || 'No Meals'}</p>
                            <p className={`inline-flex mt-2 text-xs px-2.5 py-1 rounded-md font-semibold ${STAY_BADGE[booking.stayStatus] || STAY_BADGE['Awaiting Stay Allocation']}`}>
                              Stay: {booking.stayStatus}
                            </p>
                            {booking.stayAllocations.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {booking.stayAllocations.map((allocation, index) => (
                                  <p key={`${booking._id}-stay-${index}`} className="text-xs text-stone-600">
                                    Stay: {allocation.propertyName} ({allocation.roomType}) • {allocation.roomsAllocated} room(s)
                                  </p>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start lg:items-end gap-2">
                    <p className="text-xl font-black text-zinc-900">{booking.amountLabel}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuickEdit(booking)}
                        disabled={actionLoadingId === booking._id}
                        className="px-3 py-2 rounded-lg border border-cyan-200 text-cyan-700 bg-cyan-50 hover:bg-cyan-100 disabled:opacity-60 text-xs font-bold"
                      >
                        Manage Booking
                      </button>
                      <button
                        onClick={() => { window.location.href = '/dashboard/tourist/support'; }}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 text-xs font-bold flex items-center gap-1"
                      >
                        <MdSupportAgent className="text-base" /> Support
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">Free cancellation before 24h of pickup{isCutoffReached(booking) ? ' (locked now)' : ''}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-cyan-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    {BOOKING_TIMELINE.map((label, idx) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center ${idx <= timelineStep ? 'bg-cyan-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {idx + 1}
                        </span>
                        <span className={`text-xs font-semibold ${idx <= timelineStep ? 'text-cyan-800' : 'text-slate-500'}`}>{label}</span>
                        {idx < BOOKING_TIMELINE.length - 1 && <span className="w-5 h-px bg-slate-200" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-zinc-950/45 px-4 pt-16 sm:pt-20 overflow-y-auto" onClick={() => setSelectedBooking(null)}>
          <div className="w-full max-w-2xl rounded-3xl border border-cyan-100 bg-white p-6 shadow-[0_30px_60px_-30px_rgba(8,145,178,0.55)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xl font-bold text-cyan-950">Manage Booking {selectedBooking.displayId}</h4>
                <p className="text-sm text-cyan-700/80 mt-1">Edit booking details, cancel, or remove this reservation.</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="p-2 rounded-xl border border-cyan-200 text-cyan-700 hover:bg-cyan-50">
                <MdClose className="text-lg" />
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleSaveManage}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={manageForm.pickupLocation}
                  onChange={(e) => setManageForm((prev) => ({ ...prev, pickupLocation: e.target.value }))}
                  placeholder="Pickup location"
                  className="px-3 py-2.5 border border-cyan-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  disabled={isCutoffReached(selectedBooking)}
                  required
                />
                {!selectedBooking.isTour && (
                  <input
                    value={manageForm.dropoffLocation}
                    onChange={(e) => setManageForm((prev) => ({ ...prev, dropoffLocation: e.target.value }))}
                    placeholder="Dropoff location"
                    className="px-3 py-2.5 border border-cyan-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300"
                    disabled={isCutoffReached(selectedBooking)}
                  />
                )}
                <input
                  type="datetime-local"
                  value={manageForm.pickupTime}
                  onChange={(e) => setManageForm((prev) => ({ ...prev, pickupTime: e.target.value }))}
                  className="px-3 py-2.5 border border-cyan-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  disabled={isCutoffReached(selectedBooking)}
                  required
                />
                <div className="px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 text-sm flex items-center gap-2">
                  <MdReceiptLong className="text-base" />
                  Voucher/Invoice download: coming soon
                </div>
              </div>

              {selectedBooking.isTour && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="date" value={manageForm.checkInDate} min={todayDate} onChange={(e) => setManageForm((prev) => ({ ...prev, checkInDate: e.target.value }))} className="px-3 py-2.5 border border-cyan-200 rounded-xl" disabled={isCutoffReached(selectedBooking)} />
                  <input type="date" value={manageForm.checkOutDate} min={manageForm.checkInDate || todayDate} onChange={(e) => setManageForm((prev) => ({ ...prev, checkOutDate: e.target.value }))} className="px-3 py-2.5 border border-cyan-200 rounded-xl" disabled={isCutoffReached(selectedBooking)} />
                  <input type="number" min="1" value={manageForm.adults} onChange={(e) => setManageForm((prev) => ({ ...prev, adults: Number(e.target.value || 1) }))} className="px-3 py-2.5 border border-cyan-200 rounded-xl" disabled={isCutoffReached(selectedBooking)} />
                  <input type="number" min="0" value={manageForm.children} onChange={(e) => setManageForm((prev) => ({ ...prev, children: Number(e.target.value || 0) }))} className="px-3 py-2.5 border border-cyan-200 rounded-xl" disabled={isCutoffReached(selectedBooking)} />
                  <select value={manageForm.roomType} onChange={(e) => setManageForm((prev) => ({ ...prev, roomType: e.target.value }))} className="px-3 py-2.5 border border-cyan-200 rounded-xl" disabled={isCutoffReached(selectedBooking)}>
                    {Object.keys(ROOM_RATES).map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <input type="number" min="1" value={manageForm.roomCount} onChange={(e) => setManageForm((prev) => ({ ...prev, roomCount: Number(e.target.value || 1) }))} className="px-3 py-2.5 border border-cyan-200 rounded-xl" disabled={isCutoffReached(selectedBooking)} />
                  <select value={manageForm.mealPlan} onChange={(e) => setManageForm((prev) => ({ ...prev, mealPlan: e.target.value }))} className="px-3 py-2.5 border border-cyan-200 rounded-xl" disabled={isCutoffReached(selectedBooking)}>
                    {Object.keys(MEAL_RATES).map((plan) => <option key={plan} value={plan}>{plan}</option>)}
                  </select>
                  <input value={manageForm.dietPreference} onChange={(e) => setManageForm((prev) => ({ ...prev, dietPreference: e.target.value }))} placeholder="Diet preference" className="px-3 py-2.5 border border-cyan-200 rounded-xl" disabled={isCutoffReached(selectedBooking)} />
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-2"><input type="checkbox" checked={manageForm.airportPickup} onChange={(e) => setManageForm((prev) => ({ ...prev, airportPickup: e.target.checked }))} disabled={isCutoffReached(selectedBooking)} />Airport Pickup</label>
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-2"><input type="checkbox" checked={manageForm.privateGuide} onChange={(e) => setManageForm((prev) => ({ ...prev, privateGuide: e.target.checked }))} disabled={isCutoffReached(selectedBooking)} />Private Guide</label>
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-2"><input type="checkbox" checked={manageForm.safariPass} onChange={(e) => setManageForm((prev) => ({ ...prev, safariPass: e.target.checked }))} disabled={isCutoffReached(selectedBooking)} />Safari Add-on</label>
                  <div className="md:col-span-2 text-sm font-bold text-cyan-800">Updated total: {formatCurrency(getManagePricing().final)}</div>
                </div>
              )}

              <div className="rounded-xl border border-cyan-100 bg-cyan-50/50 p-3 text-sm text-slate-700">
                Cancellation policy: free cancellation until 24 hours before pickup. Refunds are processed within 3-5 business days.
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {canMutate(selectedBooking.status) && (
                    <button type="button" onClick={() => handleCancel(selectedBooking._id)} className="px-3 py-2 rounded-lg border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 text-xs font-bold flex items-center gap-1">
                      <MdCancel className="text-base" /> Cancel Reservation
                    </button>
                  )}
                  <button type="button" onClick={() => handleDelete(selectedBooking._id)} className="px-3 py-2 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-bold flex items-center gap-1">
                    <MdDelete className="text-base" /> Delete
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {selectedBooking.driverPhone && (
                    <a href={`tel:${selectedBooking.driverPhone}`} className="px-3 py-2 rounded-lg border border-cyan-200 text-cyan-700 bg-cyan-50 hover:bg-cyan-100 text-xs font-bold flex items-center gap-1">
                      <MdPhone className="text-base" /> Contact Driver
                    </a>
                  )}
                  <button type="submit" disabled={actionLoadingId === selectedBooking._id || isCutoffReached(selectedBooking)} className="px-4 py-2 rounded-lg bg-cyan-700 text-white hover:bg-cyan-800 disabled:opacity-60 text-xs font-bold flex items-center gap-1">
                    <MdEdit className="text-base" /> {actionLoadingId === selectedBooking._id ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
              {isCutoffReached(selectedBooking) && (
                <p className="text-xs font-semibold text-amber-700">Editing is disabled within 24 hours of pickup. Please contact support for urgent changes.</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}