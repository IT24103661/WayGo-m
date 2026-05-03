import { useMemo, useState } from 'react';
import { MdPeople, MdPersonAdd } from 'react-icons/md';
import { useFleetDrivers } from '../../../hooks/useFleetManagerAPI';

const INITIAL_FORM = {
  name: '',
  email: '',
  phone: '',
  password: '',
  status: 'Offline'
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateDriverForm = (form, isEditing) => {
  if (!form.name || !form.email || !form.phone) {
    return 'Name, email and phone are required.';
  }

  if (!EMAIL_REGEX.test(form.email)) {
    return 'Please enter a valid email address.';
  }

  if (!isEditing && !form.password) {
    return 'Password is required when creating a new driver.';
  }

  if (form.password && form.password.length < 6) {
    return 'Password must be at least 6 characters.';
  }

  if (!['Online', 'Offline', 'On Trip'].includes(form.status)) {
    return 'Please select a valid status.';
  }

  return null;
};

export default function DriversSection() {
  const { drivers, loading, error, createManualDriver, updateManualDriver, deleteManualDriver } = useFleetDrivers();
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingDriverId, setEditingDriverId] = useState('');

  const sortedDrivers = useMemo(() => {
    return [...drivers].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }, [drivers]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      status: form.status
    };

    if (form.password) {
      payload.password = form.password;
    }

    const validationError = validateDriverForm(payload, Boolean(editingDriverId));
    if (validationError) {
      setMessage(validationError);
      return;
    }

    try {
      setSaving(true);
      if (editingDriverId) {
        await updateManualDriver(editingDriverId, payload);
        setMessage('Driver updated successfully.');
      } else {
        if (!payload.password) {
          setMessage('Password is required when creating a new driver.');
          setSaving(false);
          return;
        }
        await createManualDriver(payload);
        setMessage('Driver created successfully.');
      }
      setForm(INITIAL_FORM);
      setEditingDriverId('');
    } catch (err) {
      setMessage(err.message || 'Failed to save driver.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (driver) => {
    if (!driver?.canManage) {
      setMessage('Only manually added drivers can be edited here.');
      return;
    }

    setEditingDriverId(driver._id);
    setForm({
      name: driver.name || '',
      email: driver.email || '',
      phone: driver.phone || '',
      password: '',
      status: driver.status || 'Offline'
    });
    setMessage('Editing selected driver. Leave password empty to keep current password.');
  };

  const handleDelete = async (driver) => {
    if (!driver?.canManage) {
      setMessage('Only manually added drivers can be deleted here.');
      return;
    }

    const confirmed = window.confirm(`Delete driver ${driver.name}?`);
    if (!confirmed) return;

    try {
      await deleteManualDriver(driver._id);
      setMessage('Driver deleted successfully.');
      if (editingDriverId === driver._id) {
        setEditingDriverId('');
        setForm(INITIAL_FORM);
      }
    } catch (err) {
      setMessage(err.message || 'Failed to delete driver.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-cyan-900 text-white flex items-center justify-center shadow-md shadow-cyan-300/70">
            <MdPeople className="text-lg" />
          </span>
          <h2 className="text-xl font-bold text-cyan-950">Drivers</h2>
        </div>
        <p className="text-sm text-cyan-700/80">Create and manage drivers manually without assigning a vehicle.</p>
      </div>

      <form onSubmit={handleSubmit} className="relative bg-white rounded-3xl shadow-[0_20px_40px_-28px_rgba(12,27,42,0.25)] border border-cyan-100 p-5 space-y-4 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-200 via-cyan-500/70 to-sky-200" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Driver name"
            className="px-3 py-2.5 border border-cyan-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
            required
          />
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="driver@email.com"
            className="px-3 py-2.5 border border-cyan-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
            required
          />
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="Phone number"
            className="px-3 py-2.5 border border-cyan-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
            required
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder={editingDriverId ? 'New password (optional)' : 'Temporary password'}
            className="px-3 py-2.5 border border-cyan-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
            minLength={6}
            required={!editingDriverId}
          />
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <select
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2.5 border border-cyan-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
          >
            <option value="Offline">Offline</option>
            <option value="Online">Online</option>
            <option value="On Trip">On Trip</option>
          </select>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-700 text-white text-sm font-semibold hover:bg-cyan-800 disabled:opacity-60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-12px_rgba(8,145,178,0.9)]"
          >
            <MdPersonAdd className="text-lg" />
            {saving ? 'Saving...' : (editingDriverId ? 'Update Driver' : 'Add Driver')}
          </button>

          {editingDriverId && (
            <button
              type="button"
              onClick={() => {
                setEditingDriverId('');
                setForm(INITIAL_FORM);
                setMessage('');
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel Edit
            </button>
          )}

          {message && <p className="text-sm text-cyan-700 font-medium">{message}</p>}
        </div>
      </form>

      <div className="relative bg-white rounded-3xl shadow-[0_20px_40px_-28px_rgba(12,27,42,0.25)] border border-cyan-100 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-200 via-cyan-500/70 to-sky-200" />
        <table className="min-w-full text-sm">
          <thead className="bg-cyan-950 text-cyan-50 uppercase text-xs">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Name</th>
              <th className="text-left px-4 py-3 font-semibold">Email</th>
              <th className="text-left px-4 py-3 font-semibold">Phone</th>
              <th className="text-left px-4 py-3 font-semibold">Vehicle</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={5}>Loading drivers...</td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td className="px-4 py-4 text-rose-600" colSpan={5}>{error}</td>
              </tr>
            )}
            {!loading && !error && sortedDrivers.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={5}>No drivers found.</td>
              </tr>
            )}
            {!loading && sortedDrivers.map((driver) => (
              <tr key={driver._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-900 font-semibold">{driver.name}</td>
                <td className="px-4 py-3 text-slate-700">{driver.email}</td>
                <td className="px-4 py-3 text-slate-700">{driver.phone || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${driver.hasVehicle ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-700'}`}>
                    {driver.hasVehicle ? 'With Vehicle' : 'Without Vehicle'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${driver.status === 'Online' ? 'bg-emerald-100 text-emerald-700' : driver.status === 'On Trip' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                    {driver.status || 'Offline'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {driver.canManage ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(driver)}
                        className="px-2.5 py-1 text-xs rounded-lg border border-cyan-200 text-cyan-700 bg-cyan-50 hover:bg-cyan-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(driver)}
                        className="px-2.5 py-1 text-xs rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100"
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">Read-only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
