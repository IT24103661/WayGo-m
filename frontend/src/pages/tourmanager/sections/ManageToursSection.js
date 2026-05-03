import { useMemo, useState } from 'react';
import { MdAddCircle, MdClose, MdDelete, MdEdit } from 'react-icons/md';
import { useTourManagerBookings, useTourManagerTours } from '../../../hooks/useTourManagerAPI';

export default function ManageToursSection() {
  const { tours, createTour, updateTour, deleteTour, loading } = useTourManagerTours();
  const { bookings } = useTourManagerBookings();
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    destination: '',
    durationDays: '',
    price: '',
    maxGroupSize: '',
    includes: '',
    excludes: ''
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    destination: '',
    durationDays: '',
    price: '',
    maxGroupSize: '',
    includes: '',
    excludes: ''
  });
  const [message, setMessage] = useState('');
  const [healthFilter, setHealthFilter] = useState('All');
  const [sortBy, setSortBy] = useState('health');

  const statusFromScore = (score) => {
    if (score >= 75) return 'Healthy';
    if (score >= 50) return 'Watch';
    return 'Critical';
  };

  const getHealthStyles = (status) => {
    if (status === 'Healthy') return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    if (status === 'Watch') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-rose-100 text-rose-700 border-rose-200';
  };

  const toursWithHealth = useMemo(() => {
    const tourList = Array.isArray(tours) ? tours : [];
    const bookingList = Array.isArray(bookings) ? bookings : [];

    return tourList.map((tour) => {
      const tourBookings = bookingList.filter((booking) => {
        const tourPackage = booking?.tourPackage;
        if (!tourPackage) return false;
        const linkedTourId = typeof tourPackage === 'object' ? tourPackage._id : tourPackage;
        return String(linkedTourId) === String(tour._id);
      });

      const totalBookings = tourBookings.length;
      const cancelledCount = tourBookings.filter((booking) => booking.status === 'Cancelled').length;
      const completedBookings = tourBookings.filter((booking) => booking.status === 'Completed');

      const bookingVelocityScore = Math.min(100, totalBookings * 15);
      const ratingScore = Math.min(100, ((Number(tour.rating) || 0) / 5) * 100);
      const cancellationScore = totalBookings > 0
        ? Math.max(0, 100 - Math.round((cancelledCount / totalBookings) * 100))
        : 75;

      const avgBookingValue = completedBookings.length > 0
        ? completedBookings.reduce((sum, booking) => sum + (Number(booking.totalPrice) || 0), 0) / completedBookings.length
        : Number(tour.price) || 0;
      const marginScore = Number(tour.price) > 0
        ? Math.min(100, Math.round((avgBookingValue / Number(tour.price)) * 100))
        : 60;

      const healthScore = Math.round(
        (bookingVelocityScore * 0.30)
        + (ratingScore * 0.30)
        + (cancellationScore * 0.25)
        + (marginScore * 0.15)
      );

      return {
        ...tour,
        healthScore,
        healthStatus: statusFromScore(healthScore),
        healthMeta: {
          totalBookings,
          cancellationRatio: totalBookings > 0 ? Math.round((cancelledCount / totalBookings) * 100) : 0,
          avgBookingValue: Math.round(avgBookingValue)
        }
      };
    });
  }, [bookings, tours]);

  const displayTours = useMemo(() => {
    let next = toursWithHealth;

    if (healthFilter !== 'All') {
      next = next.filter((tour) => tour.healthStatus === healthFilter);
    }

    const sorted = [...next];
    if (sortBy === 'health') {
      sorted.sort((a, b) => b.healthScore - a.healthScore);
    } else if (sortBy === 'price') {
      sorted.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortBy === 'rating') {
      sorted.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }

    return sorted;
  }, [healthFilter, sortBy, toursWithHealth]);

  const normalizeFieldValue = (field, rawValue) => {
    let value = rawValue;

    if (field === 'title') {
      value = value.replace(/[^a-zA-Z0-9\s-]/g, '');
    } else if (field === 'price' || field === 'durationDays' || field === 'maxGroupSize') {
      value = value.replace(/[^\d]/g, '');
    } else if (field === 'destination') {
      value = value.replace(/[^a-zA-Z\s,]/g, '');
    }

    return value;
  };

  const handleChange = (field) => (event) => {
    const value = normalizeFieldValue(field, event.target.value);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditChange = (field) => (event) => {
    const value = normalizeFieldValue(field, event.target.value);
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetEditModal = () => {
    setEditModalOpen(false);
    setEditingId('');
    setEditForm({
      title: '',
      description: '',
      destination: '',
      durationDays: '',
      price: '',
      maxGroupSize: '',
      includes: '',
      excludes: ''
    });
  };

  const handleEdit = (tour) => {
    setEditingId(tour._id);
    setEditForm({
      title: tour.title || '',
      description: tour.description || '',
      destination: tour.destination || '',
      durationDays: tour.durationDays || '',
      price: tour.price || '',
      maxGroupSize: tour.maxGroupSize || '',
      includes: tour.includes?.join(' • ') || '',
      excludes: tour.excludes?.join(' • ') || ''
    });
    setEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this custom tour?')) {
      try {
        await deleteTour(id);
        setMessage('Tour deleted successfully.');
      } catch (error) {
        setMessage('Unable to delete tour.');
      }
    }
  };

  const handleToggleActive = async (tour) => {
    try {
      await updateTour(tour._id, { isActive: !tour.isActive });
      setMessage(`Tour ${!tour.isActive ? 'activated' : 'paused'} successfully.`);
    } catch (error) {
      setMessage(error.message || 'Unable to update tour status.');
    }
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        destination: form.destination,
        durationDays: Number(form.durationDays),
        price: Number(form.price),
        maxGroupSize: Number(form.maxGroupSize) || 10,
        includes: (form.includes || '').split('•').map(i => i.trim()).filter(Boolean),
        excludes: (form.excludes || '').split('•').map(e => e.trim()).filter(Boolean)
      };
      
      await createTour(payload);
      setMessage('Tour created successfully.');

      setForm({
        title: '', description: '', destination: '', durationDays: '', price: '', maxGroupSize: '', includes: '', excludes: ''
      });
    } catch (error) {
      setMessage(error.message || 'Unable to save tour.');
    }
  };

  const handleUpdateSubmit = async (event) => {
    event.preventDefault();
    if (!editingId) return;

    setMessage('');
    try {
      const payload = {
        title: editForm.title,
        description: editForm.description,
        destination: editForm.destination,
        durationDays: Number(editForm.durationDays),
        price: Number(editForm.price),
        maxGroupSize: Number(editForm.maxGroupSize) || 10,
        includes: (editForm.includes || '').split('•').map((item) => item.trim()).filter(Boolean),
        excludes: (editForm.excludes || '').split('•').map((item) => item.trim()).filter(Boolean)
      };

      await updateTour(editingId, payload);
      setMessage('Tour updated successfully.');
      resetEditModal();
    } catch (error) {
      setMessage(error.message || 'Unable to update tour.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.3em] text-cyan-700 uppercase">Manage Tours</p>
        <h2 className="text-2xl font-bold text-cyan-950">Create Custom Tour</h2>
        <p className="text-cyan-700/80">Manage standalone custom tours tailored for specific types of travelers.</p>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-cyan-200 shadow-[0_20px_50px_-40px_rgba(6,182,212,0.35)] p-6">
        <form onSubmit={handleCreateSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-cyan-900 mb-2">Tour Title</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={handleChange('title')}
                placeholder="Serene Beach Getaway"
                className="w-full px-4 py-2 border border-cyan-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-cyan-900 mb-2">Destinations</label>
              <input
                type="text"
                required
                value={form.destination}
                onChange={handleChange('destination')}
                placeholder="South Coast, Sri Lanka"
                className="w-full px-4 py-2 border border-cyan-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-cyan-900 mb-2">Price (LKR)</label>
              <input
                type="number"
                required
                value={form.price}
                onChange={handleChange('price')}
                placeholder="85000"
                className="w-full px-4 py-2 border border-cyan-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-cyan-900 mb-2">Duration (Days)</label>
              <input
                type="number"
                required
                value={form.durationDays}
                onChange={handleChange('durationDays')}
                placeholder="3"
                className="w-full px-4 py-2 border border-cyan-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-cyan-900 mb-2">Max Group Size</label>
              <input
                type="number"
                value={form.maxGroupSize}
                onChange={handleChange('maxGroupSize')}
                placeholder="10"
                className="w-full px-4 py-2 border border-cyan-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-cyan-900 mb-2">Description</label>
            <textarea
              rows="3"
              required
              value={form.description}
              onChange={handleChange('description')}
              placeholder="Highlight the main attractions and vibe of this tour..."
              className="w-full px-4 py-3 border border-cyan-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-cyan-900 mb-2">Included (Separate by •)</label>
              <input
                type="text"
                value={form.includes}
                onChange={handleChange('includes')}
                placeholder="Hotel • Breakfast • Transport"
                className="w-full px-4 py-2 border border-cyan-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-cyan-900 mb-2">Excluded (Separate by •)</label>
              <input
                type="text"
                value={form.excludes}
                onChange={handleChange('excludes')}
                placeholder="Flights • Lunch • Dinner"
                className="w-full px-4 py-2 border border-cyan-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
              />
            </div>
          </div>

          {message && (
            <p className="text-sm font-semibold text-cyan-700">{message}</p>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-cyan-600 text-white font-semibold hover:bg-cyan-700 transition-colors disabled:opacity-60"
            >
              <MdAddCircle className="text-xl" />
              {loading ? 'Saving...' : 'Create Tour'}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Tours List */}
      <div className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h3 className="text-xl font-bold text-cyan-950">Existing Tours</h3>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={healthFilter}
              onChange={(event) => setHealthFilter(event.target.value)}
              className="px-3 py-2 border border-cyan-200 rounded-xl text-sm bg-white"
            >
              <option value="All">All Health States</option>
              <option value="Healthy">Healthy</option>
              <option value="Watch">Watch</option>
              <option value="Critical">Critical</option>
            </select>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="px-3 py-2 border border-cyan-200 rounded-xl text-sm bg-white"
            >
              <option value="health">Sort: Health</option>
              <option value="rating">Sort: Rating</option>
              <option value="price">Sort: Price</option>
            </select>
          </div>
        </div>
        {displayTours.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayTours.map(tour => (
              <div key={tour._id} className="bg-white rounded-3xl shadow-[0_20px_50px_-40px_rgba(6,182,212,0.2)] border border-cyan-100 group flex flex-col hover:-translate-y-1 transition-all duration-300">
                <div className="h-40 bg-cyan-100 rounded-t-3xl overflow-hidden relative">
                  <div className="absolute inset-0 bg-cyan-900/20 group-hover:bg-transparent transition-colors" />
                  <img
                    src={`https://source.unsplash.com/600x400/?srilanka,${encodeURIComponent(tour.destination || tour.title || 'travel')}`}
                    alt={tour.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = 'https://source.unsplash.com/600x400/?srilanka,nature'; }}
                  />
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md ${tour.isActive ? 'bg-white/80 text-cyan-700' : 'bg-white/80 text-gray-600'}`}>
                      {tour.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h4 className="text-lg font-bold text-cyan-950 leading-tight mb-2">{tour.title}</h4>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-600 mb-3 uppercase tracking-wide">
                    <span>{tour.destination}</span>
                    <span>•</span>
                    <span>{tour.durationDays} Days</span>
                  </div>

                  <div className="mb-3 rounded-2xl border border-cyan-100 bg-cyan-50/50 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-wide font-bold text-cyan-800">Tour Health Score</p>
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-full border ${getHealthStyles(tour.healthStatus)}`}>
                        {tour.healthStatus}
                      </span>
                    </div>
                    <p className="text-xl font-black text-cyan-950 mt-1">{tour.healthScore}/100</p>
                    <p className="text-[11px] text-cyan-700/80 mt-1">
                      {tour.healthMeta.totalBookings} bookings • {tour.healthMeta.cancellationRatio}% cancellation • Avg LKR {tour.healthMeta.avgBookingValue.toLocaleString()}
                    </p>
                  </div>
                  
                  <p className="text-sm text-cyan-900/70 line-clamp-2 mb-4 flex-1">{tour.description}</p>
                  
                  <div className="flex items-end justify-between mb-4 border-t border-cyan-50 pt-4 mt-auto">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-cyan-600">Price</p>
                      <p className="text-lg font-bold text-cyan-950">LKR {tour.price.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-cyan-50">
                    <button 
                      onClick={() => handleEdit(tour)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-cyan-50 text-cyan-700 rounded-xl hover:bg-cyan-100 transition-colors font-semibold text-sm"
                    >
                      <MdEdit /> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(tour._id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-semibold text-sm"
                    >
                      <MdDelete /> Delete
                    </button>
                  </div>
                  <button
                    onClick={() => handleToggleActive(tour)}
                    className={`mt-2 w-full py-2 rounded-xl text-sm font-semibold transition-colors ${tour.isActive ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'}`}
                  >
                    {tour.isActive ? 'Pause Low Performer' : 'Activate Tour'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-cyan-50/50 rounded-3xl p-8 border border-cyan-100 text-center">
            <p className="text-cyan-700 font-medium">No custom tours created yet.</p>
          </div>
        )}
      </div>

      {editModalOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm px-4 py-8 overflow-y-auto" onClick={resetEditModal}>
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-cyan-200 shadow-[0_24px_60px_-32px_rgba(6,182,212,0.45)] p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-cyan-950">Edit Custom Tour</h3>
                <p className="text-sm text-cyan-700/80 mt-1">Update your selected tour details and save changes.</p>
              </div>
              <button
                type="button"
                onClick={resetEditModal}
                className="p-2 rounded-xl border border-cyan-200 text-cyan-700 hover:bg-cyan-50"
              >
                <MdClose className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-6 mt-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-cyan-900 mb-2">Tour Title</label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={handleEditChange('title')}
                    className="w-full px-4 py-2 border border-cyan-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-cyan-900 mb-2">Destinations</label>
                  <input
                    type="text"
                    required
                    value={editForm.destination}
                    onChange={handleEditChange('destination')}
                    className="w-full px-4 py-2 border border-cyan-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-cyan-900 mb-2">Price (LKR)</label>
                  <input
                    type="number"
                    required
                    value={editForm.price}
                    onChange={handleEditChange('price')}
                    className="w-full px-4 py-2 border border-cyan-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-cyan-900 mb-2">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    value={editForm.durationDays}
                    onChange={handleEditChange('durationDays')}
                    className="w-full px-4 py-2 border border-cyan-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-cyan-900 mb-2">Max Group Size</label>
                  <input
                    type="number"
                    value={editForm.maxGroupSize}
                    onChange={handleEditChange('maxGroupSize')}
                    className="w-full px-4 py-2 border border-cyan-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-cyan-900 mb-2">Description</label>
                <textarea
                  rows="3"
                  required
                  value={editForm.description}
                  onChange={handleEditChange('description')}
                  className="w-full px-4 py-3 border border-cyan-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-cyan-900 mb-2">Included (Separate by •)</label>
                  <input
                    type="text"
                    value={editForm.includes}
                    onChange={handleEditChange('includes')}
                    className="w-full px-4 py-2 border border-cyan-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-cyan-900 mb-2">Excluded (Separate by •)</label>
                  <input
                    type="text"
                    value={editForm.excludes}
                    onChange={handleEditChange('excludes')}
                    className="w-full px-4 py-2 border border-cyan-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-cyan-600 text-white font-semibold hover:bg-cyan-700 transition-colors disabled:opacity-60"
                >
                  <MdEdit className="text-lg" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={resetEditModal}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}