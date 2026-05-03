import { useState } from 'react';
import { MdAssignment } from 'react-icons/md';
import { useFleetBookings } from '../../../hooks/useFleetManagerAPI';

export default function FleetBookingsSection() {
  const {
    bookings,
    drivers,
    vehicles,
    loading,
    error,
    updateFleetBooking,
    deleteFleetBooking,
    assignBooking
  } = useFleetBookings();

  const [message, setMessage] = useState('');
  const [selectionMap, setSelectionMap] = useState({});
  const [editingId, setEditingId] = useState('');
  const [draftMap, setDraftMap] = useState({});

  const setSelection = (bookingId, key, value) => {
    setSelectionMap((prev) => ({
      ...prev,
      [bookingId]: {
        ...(prev[bookingId] || {}),
        [key]: value
      }
    }));
  };

  const onAssign = async (bookingId) => {
    setMessage('');
    const selected = selectionMap[bookingId] || {};
    if (!selected.driverId || !selected.vehicleId) {
      setMessage('Select both driver and vehicle to assign.');
      return;
    }

    try {
      await assignBooking(bookingId, {
        driverId: selected.driverId,
        vehicleId: selected.vehicleId
      });
      setMessage('Booking assigned successfully.');
    } catch (err) {
      setMessage(err.message || 'Failed to assign booking.');
    }
  };

  const onStatusChange = async (bookingId, status) => {
    try {
      await updateFleetBooking(bookingId, { status });
      setMessage('Booking status updated.');
    } catch (err) {
      setMessage(err.message || 'Failed to update status.');
    }
  };

  const onDelete = async (bookingId) => {
    if (!window.confirm('Delete this fleet booking?')) return;
    try {
      await deleteFleetBooking(bookingId);
      setMessage('Fleet booking deleted.');
    } catch (err) {
      setMessage(err.message || 'Failed to delete booking.');
    }
  };

  const startEdit = (booking) => {
    setEditingId(booking._id);
    setDraftMap((prev) => ({
      ...prev,
      [booking._id]: {
        pickupLocation: booking.pickupLocation || '',
        dropoffLocation: booking.dropoffLocation || '',
        pickupTime: booking.pickupTime ? new Date(booking.pickupTime).toISOString().slice(0, 16) : '',
        totalPrice: String(booking.totalPrice ?? 0)
      }
    }));
  };

  const setDraftField = (bookingId, key, value) => {
    setDraftMap((prev) => ({
      ...prev,
      [bookingId]: {
        ...(prev[bookingId] || {}),
        [key]: value
      }
    }));
  };

  const onSaveDetails = async (bookingId) => {
    const draft = draftMap[bookingId] || {};
    const payload = {
      pickupLocation: String(draft.pickupLocation || '').trim(),
      dropoffLocation: String(draft.dropoffLocation || '').trim(),
      pickupTime: draft.pickupTime,
      totalPrice: Number(draft.totalPrice)
    };

    if (!payload.pickupLocation || !payload.dropoffLocation || !payload.pickupTime || Number.isNaN(payload.totalPrice) || payload.totalPrice < 0) {
      setMessage('Provide valid pickup, dropoff, pickup time and total price before saving.');
      return;
    }

    try {
      await updateFleetBooking(bookingId, payload);
      setEditingId('');
      setMessage('Booking details updated.');
    } catch (err) {
      setMessage(err.message || 'Failed to update booking details.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-cyan-900 text-white flex items-center justify-center shadow-md shadow-cyan-300/70">
          <MdAssignment className="text-lg" />
        </span>
        <h2 className="text-xl font-bold text-cyan-950">Fleet Bookings</h2>
      </div>

      {message && <p className="text-sm text-cyan-700 font-semibold">{message}</p>}

      <div className="relative bg-white rounded-3xl border border-cyan-100 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-cyan-950 text-cyan-50 uppercase text-xs">
            <tr>
              <th className="text-left px-4 py-3">Tourist</th>
              <th className="text-left px-4 py-3">Route</th>
              <th className="text-left px-4 py-3">Pickup</th>
              <th className="text-left px-4 py-3">Price</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Assigned Driver</th>
              <th className="text-left px-4 py-3">Assigned Vehicle</th>
              <th className="text-left px-4 py-3">Assign</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={9} className="px-4 py-4 text-slate-500">Loading fleet bookings...</td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={9} className="px-4 py-4 text-rose-600">{error}</td></tr>
            )}
            {!loading && !error && bookings.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-4 text-slate-500">No fleet bookings found.</td></tr>
            )}
            {!loading && bookings.map((booking) => (
              <tr key={booking._id}>
                <td className="px-4 py-3">{booking.tourist?.name || 'Unknown'}</td>
                <td className="px-4 py-3">
                  {editingId === booking._id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        value={draftMap[booking._id]?.pickupLocation || ''}
                        onChange={(e) => setDraftField(booking._id, 'pickupLocation', e.target.value)}
                        className="px-2 py-1 border border-cyan-200 rounded-lg"
                        placeholder="Pickup"
                      />
                      <input
                        value={draftMap[booking._id]?.dropoffLocation || ''}
                        onChange={(e) => setDraftField(booking._id, 'dropoffLocation', e.target.value)}
                        className="px-2 py-1 border border-cyan-200 rounded-lg"
                        placeholder="Dropoff"
                      />
                    </div>
                  ) : (
                    <>{booking.pickupLocation} {'->'} {booking.dropoffLocation}</>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === booking._id ? (
                    <input
                      type="datetime-local"
                      value={draftMap[booking._id]?.pickupTime || ''}
                      onChange={(e) => setDraftField(booking._id, 'pickupTime', e.target.value)}
                      className="px-2 py-1 border border-cyan-200 rounded-lg"
                    />
                  ) : (
                    new Date(booking.pickupTime).toLocaleString()
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === booking._id ? (
                    <input
                      type="number"
                      min="0"
                      value={draftMap[booking._id]?.totalPrice || ''}
                      onChange={(e) => setDraftField(booking._id, 'totalPrice', e.target.value)}
                      className="w-28 px-2 py-1 border border-cyan-200 rounded-lg"
                    />
                  ) : (
                    <>LKR {Number(booking.totalPrice || 0).toLocaleString()}</>
                  )}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={booking.status}
                    onChange={(e) => onStatusChange(booking._id, e.target.value)}
                    className="px-2 py-1 border border-cyan-200 rounded-lg"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Accepted">Accepted</option>
                    <option value="En Route">En Route</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  {booking.assignedDriver
                    ? `${booking.assignedDriver.name || '-'}${booking.assignedDriver.phone ? ` (${booking.assignedDriver.phone})` : ''}`
                    : '-'}
                </td>
                <td className="px-4 py-3">
                  {booking.assignedVehicle
                    ? `${booking.assignedVehicle.plateNumber || '-'}${booking.assignedVehicle.make || booking.assignedVehicle.model ? ` - ${booking.assignedVehicle.make || ''} ${booking.assignedVehicle.model || ''}` : ''}`
                    : '-'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <select
                      value={selectionMap[booking._id]?.driverId || booking.assignedDriver?._id || ''}
                      onChange={(e) => setSelection(booking._id, 'driverId', e.target.value)}
                      className="px-2 py-1 border border-cyan-200 rounded-lg"
                    >
                      <option value="">Driver</option>
                      {drivers.map((driver) => (
                        <option key={driver._id} value={driver._id}>{driver.name}</option>
                      ))}
                    </select>
                    <select
                      value={selectionMap[booking._id]?.vehicleId || booking.assignedVehicle?._id || ''}
                      onChange={(e) => setSelection(booking._id, 'vehicleId', e.target.value)}
                      className="px-2 py-1 border border-cyan-200 rounded-lg"
                    >
                      <option value="">Vehicle</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle._id} value={vehicle._id}>
                          {vehicle.plateNumber} - {vehicle.make} {vehicle.model}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => onAssign(booking._id)}
                      disabled={['Completed', 'Cancelled'].includes(booking.status)}
                      className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Assign
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {editingId === booking._id ? (
                      <>
                        <button
                          onClick={() => onSaveDetails(booking._id)}
                          className="px-2 py-1 rounded-lg bg-cyan-700 text-white text-xs font-semibold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId('')}
                          className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEdit(booking)}
                        className="px-2 py-1 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-semibold"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(booking._id)}
                      className="px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
