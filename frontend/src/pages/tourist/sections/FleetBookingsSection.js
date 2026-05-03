import { useEffect, useState } from 'react';
import { MdLocalTaxi, MdDelete, MdEdit, MdCancel } from 'react-icons/md';
import { useTouristFleetBookings } from '../../../hooks/useTouristAPI';

const INITIAL_FORM = {
  pickupLocation: '',
  dropoffLocation: '',
  pickupTime: '',
  totalPrice: ''
};

const CITY_COORDS = {
  colombo: [6.9271, 79.8612],
  negombo: [7.2083, 79.8358],
  kandy: [7.2906, 80.6337],
  galle: [6.0535, 80.221],
  matara: [5.9549, 80.554],
  jaffna: [9.6615, 80.0255],
  anuradhapura: [8.3114, 80.4037],
  trincomalee: [8.5874, 81.2152],
  batticaloa: [7.7102, 81.6924],
  kurunegala: [7.4863, 80.3623],
  ella: [6.8667, 81.0466]
};

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const findKnownCity = (locationText) => {
  const text = normalizeText(locationText);
  return Object.keys(CITY_COORDS).find((city) => text.includes(city)) || null;
};

const estimatePrice = (pickupLocation, dropoffLocation) => {
  const pickup = normalizeText(pickupLocation);
  const dropoff = normalizeText(dropoffLocation);

  if (!pickup || !dropoff) return '';

  if (pickup === dropoff) {
    return '800';
  }

  const pickupCity = findKnownCity(pickup);
  const dropoffCity = findKnownCity(dropoff);

  if (pickupCity && dropoffCity) {
    const [lat1, lon1] = CITY_COORDS[pickupCity];
    const [lat2, lon2] = CITY_COORDS[dropoffCity];
    const approxKm = Math.sqrt((lat1 - lat2) ** 2 + (lon1 - lon2) ** 2) * 111;
    const fare = Math.max(800, 350 + (approxKm * 120));
    return String(Math.round(fare / 50) * 50);
  }

  // Fallback estimate when locations do not match known city names.
  const fare = 1400 + (Math.max(pickup.length, dropoff.length) * 25);
  return String(Math.round(fare / 50) * 50);
};

const validateFleetPayload = (payload) => {
  if (!payload.pickupLocation || payload.pickupLocation.length < 3 || payload.pickupLocation.length > 180) {
    return 'Pickup location must be between 3 and 180 characters.';
  }
  if (!payload.dropoffLocation || payload.dropoffLocation.length < 3 || payload.dropoffLocation.length > 180) {
    return 'Dropoff location must be between 3 and 180 characters.';
  }
  if (payload.pickupLocation.toLowerCase() === payload.dropoffLocation.toLowerCase()) {
    return 'Pickup and dropoff locations cannot be the same.';
  }

  const pickupAt = new Date(payload.pickupTime).getTime();
  if (!pickupAt || Number.isNaN(pickupAt)) {
    return 'Pickup time must be a valid date and time.';
  }
  if (pickupAt < Date.now() + 5 * 60 * 1000) {
    return 'Pickup time must be at least 5 minutes in the future.';
  }

  if (Number.isNaN(payload.totalPrice) || payload.totalPrice <= 0 || payload.totalPrice > 5000000) {
    return 'Total price must be greater than 0 and less than or equal to 5,000,000.';
  }

  return null;
};

export default function FleetBookingsSection() {
  const {
    fleetBookings,
    loading,
    error,
    createFleetBooking,
    updateFleetBooking,
    cancelFleetBooking,
    deleteFleetBooking
  } = useTouristFleetBookings();

  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState('');
  const [editForm, setEditForm] = useState(INITIAL_FORM);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const nextPrice = estimatePrice(form.pickupLocation, form.dropoffLocation);
    if (nextPrice !== form.totalPrice) {
      setForm((prev) => ({ ...prev, totalPrice: nextPrice }));
    }
  }, [form.pickupLocation, form.dropoffLocation, form.totalPrice]);

  useEffect(() => {
    const nextPrice = estimatePrice(editForm.pickupLocation, editForm.dropoffLocation);
    if (nextPrice !== editForm.totalPrice) {
      setEditForm((prev) => ({ ...prev, totalPrice: nextPrice }));
    }
  }, [editForm.pickupLocation, editForm.dropoffLocation, editForm.totalPrice]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const payload = {
      pickupLocation: form.pickupLocation.trim(),
      dropoffLocation: form.dropoffLocation.trim(),
      pickupTime: form.pickupTime,
      totalPrice: Number(form.totalPrice)
    };

    const validationError = validateFleetPayload(payload);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    try {
      setSaving(true);
      await createFleetBooking(payload);
      setMessage('Fleet booking created and sent to fleet managers.');
      setForm(INITIAL_FORM);
    } catch (err) {
      setMessage(err.message || 'Failed to save fleet booking.');
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (booking) => {
    setEditingId(booking._id);
    setEditForm({
      pickupLocation: booking.pickupLocation || '',
      dropoffLocation: booking.dropoffLocation || '',
      pickupTime: booking.pickupTime ? new Date(booking.pickupTime).toISOString().slice(0, 16) : '',
      totalPrice: String(booking.totalPrice ?? '')
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingId('');
    setEditForm(INITIAL_FORM);
  };

  const onSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingId) return;

    const payload = {
      pickupLocation: editForm.pickupLocation.trim(),
      dropoffLocation: editForm.dropoffLocation.trim(),
      pickupTime: editForm.pickupTime,
      totalPrice: Number(editForm.totalPrice)
    };

    const validationError = validateFleetPayload(payload);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    try {
      setSaving(true);
      await updateFleetBooking(editingId, payload);
      setMessage('Fleet booking updated successfully.');
      closeEditModal();
    } catch (err) {
      setMessage(err.message || 'Failed to update fleet booking.');
    } finally {
      setSaving(false);
    }
  };

  const onCancelBooking = async (bookingId) => {
    try {
      await cancelFleetBooking(bookingId);
      setMessage('Fleet booking cancelled successfully.');
    } catch (err) {
      setMessage(err.message || 'Failed to cancel booking.');
    }
  };

  const onDeleteBooking = async (bookingId) => {
    if (!window.confirm('Delete this fleet booking permanently?')) return;

    try {
      await deleteFleetBooking(bookingId);
      setMessage('Fleet booking deleted successfully.');
    } catch (err) {
      setMessage(err.message || 'Failed to delete booking.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-cyan-700 text-white flex items-center justify-center shadow-md shadow-cyan-300/70">
          <MdLocalTaxi className="text-lg" />
        </span>
        <h2 className="text-xl font-bold text-zinc-900">Fleet Bookings</h2>
      </div>

      <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-cyan-100 p-5 space-y-3 shadow-[0_20px_40px_-35px_rgba(8,145,178,0.6)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={form.pickupLocation}
            onChange={(e) => setForm((prev) => ({ ...prev, pickupLocation: e.target.value }))}
            placeholder="Pickup location"
            className="px-3 py-2.5 border border-cyan-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300"
            required
          />
          <input
            value={form.dropoffLocation}
            onChange={(e) => setForm((prev) => ({ ...prev, dropoffLocation: e.target.value }))}
            placeholder="Dropoff location"
            className="px-3 py-2.5 border border-cyan-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300"
            required
          />
          <input
            type="datetime-local"
            value={form.pickupTime}
            onChange={(e) => setForm((prev) => ({ ...prev, pickupTime: e.target.value }))}
            className="px-3 py-2.5 border border-cyan-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300"
            required
          />
          <input
            type="number"
            min="0"
            value={form.totalPrice}
            placeholder="Total price (auto-calculated)"
            className="px-3 py-2.5 border border-cyan-200 rounded-xl bg-cyan-50/50 text-cyan-900"
            readOnly
            required
          />
        </div>

        <p className="text-xs text-cyan-700/80">
          Total price is automatically estimated after entering pickup and dropoff locations.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Create Fleet Booking'}
          </button>
          {message && <p className="text-sm text-cyan-700 font-semibold">{message}</p>}
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-cyan-100 overflow-hidden shadow-[0_20px_40px_-35px_rgba(8,145,178,0.5)]">
        <table className="min-w-full text-sm">
          <thead className="bg-cyan-50 text-cyan-800 uppercase text-xs">
            <tr>
              <th className="text-left px-4 py-3">Pickup</th>
              <th className="text-left px-4 py-3">Dropoff</th>
              <th className="text-left px-4 py-3">Time</th>
              <th className="text-left px-4 py-3">Driver</th>
              <th className="text-left px-4 py-3">Contact</th>
              <th className="text-left px-4 py-3">Vehicle</th>
              <th className="text-left px-4 py-3">Price</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyan-50">
            {loading && (
              <tr><td colSpan={9} className="px-4 py-4 text-cyan-700/80">Loading fleet bookings...</td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={9} className="px-4 py-4 text-rose-600">{error}</td></tr>
            )}
            {!loading && !error && fleetBookings.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-4 text-cyan-700/80">No fleet bookings yet.</td></tr>
            )}
            {!loading && fleetBookings.map((booking) => (
              <tr key={booking._id}>
                <td className="px-4 py-3">{booking.pickupLocation}</td>
                <td className="px-4 py-3">{booking.dropoffLocation}</td>
                <td className="px-4 py-3">{new Date(booking.pickupTime).toLocaleString()}</td>
                <td className="px-4 py-3">{booking.assignedDriver?.name || '-'}</td>
                <td className="px-4 py-3">{booking.assignedDriver?.phone || '-'}</td>
                <td className="px-4 py-3">
                  {booking.assignedVehicle
                    ? `${booking.assignedVehicle.plateNumber || '-'}${booking.assignedVehicle.make || booking.assignedVehicle.model ? ` - ${booking.assignedVehicle.make || ''} ${booking.assignedVehicle.model || ''}` : ''}`
                    : '-'}
                </td>
                <td className="px-4 py-3">LKR {Number(booking.totalPrice || 0).toLocaleString()}</td>
                <td className="px-4 py-3">{booking.status}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => onEdit(booking)} className="p-1.5 rounded border border-blue-200 text-blue-700 bg-blue-50">
                      <MdEdit />
                    </button>
                    <button onClick={() => onCancelBooking(booking._id)} className="p-1.5 rounded border border-amber-200 text-amber-700 bg-amber-50">
                      <MdCancel />
                    </button>
                    <button onClick={() => onDeleteBooking(booking._id)} className="p-1.5 rounded border border-rose-200 text-rose-700 bg-rose-50">
                      <MdDelete />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-zinc-950/45 px-4"
          onClick={closeEditModal}
        >
          <div
            className="w-full max-w-xl rounded-3xl border border-cyan-100 bg-white p-6 shadow-[0_30px_60px_-30px_rgba(8,145,178,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-xl font-bold text-cyan-950">Edit Fleet Booking</h4>
            <p className="mt-1 text-sm text-cyan-700/80">Update ride details and save your changes.</p>

            <form onSubmit={onSaveEdit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={editForm.pickupLocation}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, pickupLocation: e.target.value }))}
                  placeholder="Pickup location"
                  className="px-3 py-2.5 border border-cyan-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  required
                />
                <input
                  value={editForm.dropoffLocation}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, dropoffLocation: e.target.value }))}
                  placeholder="Dropoff location"
                  className="px-3 py-2.5 border border-cyan-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  required
                />
                <input
                  type="datetime-local"
                  value={editForm.pickupTime}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, pickupTime: e.target.value }))}
                  className="px-3 py-2.5 border border-cyan-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  required
                />
                <input
                  type="number"
                  min="0"
                  value={editForm.totalPrice}
                  placeholder="Total price (auto-calculated)"
                  className="px-3 py-2.5 border border-cyan-200 rounded-xl bg-cyan-50/50 text-cyan-900"
                  readOnly
                  required
                />
              </div>

              <p className="text-xs text-cyan-700/80">
                Price is auto-estimated from pickup and dropoff locations.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 hover:bg-cyan-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
