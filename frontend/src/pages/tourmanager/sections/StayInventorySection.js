import { useMemo, useState } from 'react';
import { MdDelete, MdEdit, MdHotel, MdSave } from 'react-icons/md';
import { useTourManagerStayInventory } from '../../../hooks/useTourManagerAPI';

const INITIAL_FORM = {
  propertyName: '',
  location: '',
  roomType: 'Standard',
  totalRooms: 10,
  isActive: true
};

export default function StayInventorySection() {
  const { inventory, loading, error, createInventory, updateInventory, deleteInventory } = useTourManagerStayInventory();
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');

  const sortedInventory = useMemo(() => {
    return [...inventory].sort((a, b) => String(a.propertyName || '').localeCompare(String(b.propertyName || '')));
  }, [inventory]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    const payload = {
      propertyName: String(form.propertyName).trim(),
      location: String(form.location).trim(),
      roomType: form.roomType,
      totalRooms: Number(form.totalRooms),
      isActive: Boolean(form.isActive)
    };

    try {
      if (editingId) {
        await updateInventory(editingId, payload);
        setMessage('Inventory updated successfully.');
      } else {
        await createInventory(payload);
        setMessage('Inventory created successfully.');
      }
      setEditingId('');
      setForm(INITIAL_FORM);
    } catch (err) {
      setMessage(err.message || 'Failed to save inventory.');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      propertyName: item.propertyName || '',
      location: item.location || '',
      roomType: item.roomType || 'Standard',
      totalRooms: Number(item.totalRooms || 1),
      isActive: Boolean(item.isActive)
    });
    setMessage('Editing selected stay inventory item.');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this stay inventory item?')) return;
    setMessage('');
    try {
      await deleteInventory(id);
      setMessage('Inventory deleted successfully.');
      if (editingId === id) {
        setEditingId('');
        setForm(INITIAL_FORM);
      }
    } catch (err) {
      setMessage(err.message || 'Failed to delete inventory.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.3em] text-cyan-700 uppercase">Stay Operations</p>
        <h2 className="text-2xl font-bold text-cyan-950">Stay Inventory</h2>
        <p className="text-cyan-700/80">Manage room availability and property room stock.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-sm rounded-3xl border border-cyan-200 p-5 shadow-[0_20px_50px_-40px_rgba(6,182,212,0.35)] space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            value={form.propertyName}
            onChange={(event) => setForm((prev) => ({ ...prev, propertyName: event.target.value }))}
            placeholder="Property name"
            className="px-3 py-2.5 rounded-xl border border-cyan-200"
            required
          />
          <input
            value={form.location}
            onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
            placeholder="Location"
            className="px-3 py-2.5 rounded-xl border border-cyan-200"
            required
          />
          <select
            value={form.roomType}
            onChange={(event) => setForm((prev) => ({ ...prev, roomType: event.target.value }))}
            className="px-3 py-2.5 rounded-xl border border-cyan-200"
          >
            {['Standard', 'Deluxe', 'Family', 'Suite'].map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            value={form.totalRooms}
            onChange={(event) => setForm((prev) => ({ ...prev, totalRooms: Number(event.target.value || 1) }))}
            className="px-3 py-2.5 rounded-xl border border-cyan-200"
            required
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-cyan-800 font-semibold flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
            />
            Active inventory
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-60"
          >
            <MdSave className="text-lg" />
            {editingId ? 'Update Inventory' : 'Create Inventory'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId('');
                setForm(INITIAL_FORM);
                setMessage('');
              }}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700"
            >
              Cancel
            </button>
          )}
          {message && <p className="text-sm font-semibold text-cyan-700">{message}</p>}
        </div>
      </form>

      <div className="bg-white rounded-3xl border border-cyan-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-cyan-100">
          <h3 className="font-bold text-cyan-950">Current Inventory</h3>
        </div>

        {loading && sortedInventory.length === 0 && <p className="px-5 py-4 text-cyan-700">Loading inventory...</p>}
        {error && <p className="px-5 py-4 text-rose-600">{error}</p>}

        {!error && !loading && sortedInventory.length === 0 && (
          <p className="px-5 py-6 text-cyan-700/80">No stay inventory available yet.</p>
        )}

        {!error && sortedInventory.length > 0 && (
          <div className="divide-y divide-cyan-100">
            {sortedInventory.map((item) => {
              const reservedRooms = (item.reservations || []).reduce((sum, reservation) => sum + (Number(reservation.roomsAllocated) || 0), 0);
              const availableRooms = Math.max(0, Number(item.totalRooms || 0) - reservedRooms);
              return (
                <div key={item._id} className="px-5 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
                        <MdHotel />
                      </span>
                      <p className="font-semibold text-cyan-950 truncate">{item.propertyName}</p>
                      <span className={`text-xs px-2 py-1 rounded-full border ${item.isActive ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-cyan-700/80 mt-1">{item.location} • {item.roomType}</p>
                    <p className="text-xs text-cyan-800 mt-1">Available {availableRooms} / {item.totalRooms}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="px-3 py-2 rounded-lg border border-cyan-200 bg-cyan-50 text-cyan-700 text-xs font-bold inline-flex items-center gap-1"
                    >
                      <MdEdit /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold inline-flex items-center gap-1"
                    >
                      <MdDelete /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
