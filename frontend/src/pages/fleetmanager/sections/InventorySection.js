import { useState } from 'react';
import { MdDirectionsCar } from 'react-icons/md';
import { useFleetVehicles } from '../../../hooks/useFleetManagerAPI';

const STATUS_BADGE = {
  Active: 'bg-cyan-100 text-cyan-700',
  Available: 'bg-emerald-100 text-emerald-700',
  'Under Maintenance': 'bg-amber-100 text-amber-700',
  'Out of Service': 'bg-rose-100 text-rose-700',
};

const FALLBACK_VEHICLES = [
  {
    _id: 'veh-001',
    plateNumber: 'CAF-1234',
    brand: 'Toyota',
    model: 'Hiace',
    category: 'Van',
    status: 'Active',
    mileage: { current: 48210 },
  },
  {
    _id: 'veh-002',
    plateNumber: 'CBB-8890',
    brand: 'Nissan',
    model: 'Caravan',
    category: 'Van',
    status: 'Under Maintenance',
    mileage: { current: 90560 },
  },
  {
    _id: 'veh-003',
    plateNumber: 'WP-4521',
    brand: 'Mitsubishi',
    model: 'RVR',
    category: 'SUV',
    status: 'Active',
    mileage: { current: 23120 },
  },
];

const CURRENT_YEAR = new Date().getFullYear() + 1;
const PLATE_REGEX = /^[A-Z]{2,3}-\d{4}$/;

const validateVehicleForm = (form) => {
  const plateNumber = form.plateNumber.trim().toUpperCase();
  const make = form.make.trim();
  const model = form.model.trim();
  const year = Number(form.year);

  if (!plateNumber || !make || !model || !form.year || !form.category || !form.status) {
    return 'Please fill all required fields.';
  }

  if (!PLATE_REGEX.test(plateNumber)) {
    return 'Plate number must follow format ABC-1234.';
  }

  if (make.length < 2 || model.length < 2) {
    return 'Make and model must be at least 2 characters.';
  }

  if (Number.isNaN(year) || year < 1980 || year > CURRENT_YEAR) {
    return `Year must be between 1980 and ${CURRENT_YEAR}.`;
  }

  if (form.currentMileage !== '' && (Number.isNaN(Number(form.currentMileage)) || Number(form.currentMileage) < 0)) {
    return 'Current mileage must be a valid non-negative number.';
  }

  if (form.serviceInterval !== '' && (Number.isNaN(Number(form.serviceInterval)) || Number(form.serviceInterval) < 500)) {
    return 'Service interval must be at least 500 km.';
  }

  return null;
};

export default function InventorySection({ showAddForm = true }) {
  const {
    vehicles,
    loading,
    error,
    addVehicle,
    updateVehicle,
    deleteVehicle
  } = useFleetVehicles();
  const [form, setForm] = useState({
    plateNumber: '',
    make: '',
    model: '',
    year: '',
    currentMileage: '',
    serviceInterval: '5000',
    category: 'Economy',
    status: 'Active'
  });
  const [editId, setEditId] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 6;

  const safeVehicles = !loading && vehicles.length === 0 ? FALLBACK_VEHICLES : vehicles;

  const rows = safeVehicles.map((vehicle) => ({
    id: vehicle._id,
    plate: vehicle.plateNumber,
    brand: vehicle.brand || vehicle.make,
    model: vehicle.model,
    category: vehicle.category || vehicle.type,
    status: vehicle.status,
    mileage: vehicle.mileage?.current || 0
  }));

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredRows = rows.filter((vehicle) => {
    const matchesSearch = !normalizedSearch
      || vehicle.plate.toLowerCase().includes(normalizedSearch)
      || `${vehicle.brand} ${vehicle.model}`.toLowerCase().includes(normalizedSearch);
    const matchesStatus = statusFilter === 'All' || vehicle.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || vehicle.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + PAGE_SIZE);

  const resetForm = () => {
    setForm({
      plateNumber: '',
      make: '',
      model: '',
      year: '',
      currentMileage: '',
      serviceInterval: '5000',
      category: 'Economy',
      status: 'Active'
    });
    setEditId('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    const validationError = validateVehicleForm(form);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    const payload = {
      plateNumber: form.plateNumber.trim().toUpperCase(),
      make: form.make.trim(),
      model: form.model.trim(),
      year: Number(form.year),
      category: form.category,
      status: form.status,
      mileage: {
        current: Number(form.currentMileage || 0),
        serviceInterval: Number(form.serviceInterval || 5000),
        lastService: 0
      },
      type: form.category === 'Luxury'
        ? 'Luxury'
        : (form.category === 'SUV' ? 'SUV' : (form.category === 'Van' ? 'Van' : 'Sedan'))
    };

    setSaving(true);
    try {
      if (editId) {
        await updateVehicle(editId, payload);
        setMessage('Vehicle updated successfully.');
      } else {
        await addVehicle(payload);
        setMessage('Vehicle added successfully.');
      }
      resetForm();
    } catch (err) {
      setMessage(err.message || 'Failed to save vehicle.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (vehicle) => {
    setEditId(vehicle._id || vehicle.id);
    setForm({
      plateNumber: vehicle.plateNumber || '',
      make: vehicle.make || vehicle.brand || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      currentMileage: vehicle.mileage?.current ?? '',
      serviceInterval: vehicle.mileage?.serviceInterval ?? 5000,
      category: vehicle.category || 'Economy',
      status: vehicle.status || 'Active'
    });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Delete this vehicle?');
    if (!confirmed) return;

    try {
      await deleteVehicle(id);
      setMessage('Vehicle deleted successfully.');
      if (editId === id) resetForm();
    } catch (err) {
      setMessage(err.message || 'Failed to delete vehicle.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-cyan-900 text-white flex items-center justify-center shadow-md shadow-cyan-300/70">
            <MdDirectionsCar className="text-lg" />
          </span>
          <h2 className="text-xl font-bold text-cyan-950">Vehicle Inventory</h2>
        </div>
        <p className="text-sm text-cyan-700/80">Track all registered vehicles and their current status.</p>
      </div>

      {showAddForm && (
      <form onSubmit={handleSubmit} className="relative bg-white rounded-3xl shadow-[0_20px_40px_-28px_rgba(15,23,42,0.28)] border border-slate-200 p-5 space-y-3 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-200 via-cyan-500/70 to-sky-200" />
        <p className="text-sm font-semibold text-slate-900">{editId ? 'Edit Vehicle' : 'Add New Vehicle'}</p>
        <div className="grid grid-cols-1 md:grid-cols-8 gap-3">
          <input
            value={form.plateNumber}
            onChange={(e) => setForm({ ...form, plateNumber: e.target.value.toUpperCase() })}
            placeholder="BGK-1234"
            maxLength={8}
            pattern="[A-Z]{2,3}-[0-9]{4}"
            title="Use format ABC-1234"
            className="px-3 py-2.5 border border-cyan-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
            required
          />
          <input
            value={form.make}
            onChange={(e) => setForm({ ...form, make: e.target.value })}
            placeholder="Make"
            minLength={2}
            className="px-3 py-2.5 border border-cyan-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
            required
          />
          <input
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            placeholder="Model"
            minLength={2}
            className="px-3 py-2.5 border border-cyan-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
            required
          />
          <input
            type="number"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
            placeholder="Year"
            min="1980"
            max={String(CURRENT_YEAR)}
            className="px-3 py-2.5 border border-cyan-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
            required
          />
          <input
            type="number"
            value={form.currentMileage}
            onChange={(e) => setForm({ ...form, currentMileage: e.target.value })}
            placeholder="Mileage (km)"
            min="0"
            className="px-3 py-2.5 border border-cyan-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
          />
          <input
            type="number"
            value={form.serviceInterval}
            onChange={(e) => setForm({ ...form, serviceInterval: e.target.value })}
            placeholder="Service Interval"
            min="500"
            step="500"
            className="px-3 py-2.5 border border-cyan-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="px-3 py-2.5 border border-cyan-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
          >
            <option value="Economy">Economy</option>
            <option value="Luxury">Luxury</option>
            <option value="Van">Van</option>
            <option value="SUV">SUV</option>
          </select>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="px-3 py-2.5 border border-cyan-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
          >
            <option value="Active">Active</option>
            <option value="Available">Available</option>
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Out of Service">Out of Service</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-cyan-700 text-white text-sm font-semibold hover:bg-cyan-800 disabled:opacity-60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-12px_rgba(8,145,178,0.9)]"
          >
            {saving ? 'Saving...' : (editId ? 'Update Vehicle' : 'Add Vehicle')}
          </button>
          {editId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-14px_rgba(51,65,85,0.35)]"
            >
              Cancel Edit
            </button>
          )}
        </div>
        {message && <p className="text-sm text-cyan-700 font-medium">{message}</p>}
        {!message && error && <p className="text-sm text-rose-700 font-medium">{error}</p>}
      </form>
      )}

      <div className="relative bg-white rounded-3xl shadow-[0_20px_40px_-28px_rgba(12,27,42,0.25)] border border-cyan-100 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-200 via-cyan-500/70 to-sky-200" />
        <div className="px-4 py-4 border-b border-cyan-100 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search by plate, make, or model"
            className="w-full md:w-80 px-3 py-2.5 border border-cyan-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
          />

          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 border border-cyan-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
            >
              <option value="All">All Categories</option>
              <option value="Economy">Economy</option>
              <option value="Luxury">Luxury</option>
              <option value="Van">Van</option>
              <option value="SUV">SUV</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 border border-cyan-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Available">Available</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Out of Service">Out of Service</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-cyan-950 text-cyan-50 uppercase text-xs">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Plate</th>
                <th className="text-left px-4 py-3 font-semibold">Vehicle</th>
                <th className="text-left px-4 py-3 font-semibold">Category</th>
                <th className="text-left px-4 py-3 font-semibold">Mileage</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={6}>Loading vehicles...</td>
                </tr>
              )}
              {!loading && filteredRows.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={6}>
                    {vehicles.length === 0 ? 'Showing sample fleet data.' : 'No vehicles match your search/filter.'}
                  </td>
                </tr>
              )}
              {!loading && paginatedRows.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-900 font-semibold">{vehicle.plate}</td>
                  <td className="px-4 py-3 text-slate-700">{vehicle.brand} {vehicle.model}</td>
                  <td className="px-4 py-3 text-slate-700">{vehicle.category}</td>
                  <td className="px-4 py-3 text-slate-700">{vehicle.mileage.toLocaleString()} km</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 hover:shadow-[0_8px_18px_-12px_rgba(8,145,178,0.7)] ${STATUS_BADGE[vehicle.status] || 'bg-gray-100 text-gray-700'}`}>
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {!String(vehicle.id).startsWith('veh-') && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(vehicles.find((v) => v._id === vehicle.id))}
                          className="px-2.5 py-1 text-xs rounded-lg border border-cyan-200 text-cyan-700 bg-cyan-50 hover:bg-cyan-100 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_-12px_rgba(8,145,178,0.8)]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle.id)}
                          className="px-2.5 py-1 text-xs rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_-12px_rgba(225,29,72,0.8)]"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filteredRows.length > 0 && (
          <div className="px-4 py-3 border-t border-cyan-100 flex items-center justify-between">
            <p className="text-xs text-slate-600">
              Showing {startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, filteredRows.length)} of {filteredRows.length} vehicles
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-cyan-200 text-cyan-700 bg-white disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs font-semibold text-slate-700">Page {currentPage} / {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-cyan-200 text-cyan-700 bg-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
