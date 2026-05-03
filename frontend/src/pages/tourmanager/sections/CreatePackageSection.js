import { useState } from 'react';
import { MdAddCircle, MdDelete, MdEdit } from 'react-icons/md';
import { useTourManagerPackages } from '../../../hooks/useTourManagerAPI';

export default function CreatePackageSection() {
  const { packages, createPackage, deletePackage, updatePackage, loading } = useTourManagerPackages();
  const [form, setForm] = useState({
    title: '',
    description: '',
    flatPrice: '',
    durationDays: '',
    itineraryStops: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  const handleChange = (field) => (event) => {
    let value = event.target.value;

    // Strict typing validations
    if (field === 'title') {
      // Allow only letters, numbers, and spaces (preventing weird symbols but keeping it title-friendly)
      value = value.replace(/[^a-zA-Z0-9\s]/g, '');
    } else if (field === 'flatPrice' || field === 'durationDays') {
      // Allow only digits (no words, no decimals if you strictly want integers)
      value = value.replace(/[^\d]/g, '');
    }

    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = (pkg) => {
    setEditingId(pkg._id);
    setForm({
      title: pkg.title,
      description: pkg.description,
      flatPrice: pkg.flatPrice,
      durationDays: pkg.durationDays,
      itineraryStops: pkg.itineraryStops ? pkg.itineraryStops.join(' • ') : ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      try {
        await deletePackage(id);
        setMessage('Package deleted successfully.');
      } catch (error) {
        setMessage('Unable to delete package.');
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        flatPrice: Number(form.flatPrice),
        durationDays: Number(form.durationDays),
        itineraryStops: (form.itineraryStops || '').split('•').map((stop) => stop.trim()).filter(Boolean)
      };
      
      if (editingId) {
        await updatePackage(editingId, payload);
        setMessage('Package updated successfully.');
      } else {
        await createPackage(payload);
        setMessage('Package published successfully.');
      }
      
      setEditingId(null);
      setForm({
        title: '',
        description: '',
        flatPrice: '',
        durationDays: '',
        itineraryStops: ''
      });
    } catch (error) {
      setMessage(error.message || 'Unable to save package.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.3em] text-cyan-700 uppercase">Manage Packages</p>
        <h2 className="text-2xl font-bold text-cyan-950">{editingId ? 'Edit Tour Package' : 'Design a Signature Tour'}</h2>
        <p className="text-cyan-700/80">Craft premium, multi-day experiences for high-value travelers.</p>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-cyan-200 shadow-[0_20px_50px_-40px_rgba(6,182,212,0.35)] p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-cyan-900 mb-2">Package Title</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={handleChange('title')}
                placeholder="Emerald Highlands Expedition"
                className="w-full px-4 py-2 border border-cyan-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-cyan-900 mb-2">Flat Price</label>
              <input
                type="number"
                required
                value={form.flatPrice}
                onChange={handleChange('flatPrice')}
                placeholder="120000"
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
                placeholder="4"
                className="w-full px-4 py-2 border border-cyan-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-cyan-900 mb-2">Description</label>
            <textarea
              rows="4"
              required
              value={form.description}
              onChange={handleChange('description')}
              placeholder="Describe the journey, premium services, and exclusivity..."
              className="w-full px-4 py-3 border border-cyan-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-cyan-900 mb-2">Itinerary Stops</label>
            <input
              type="text"
              value={form.itineraryStops}
              onChange={handleChange('itineraryStops')}
              placeholder="Nuwara Eliya • Ella • Yala • Galle"
              className="w-full px-4 py-2 border border-cyan-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
            />
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
              {loading ? 'Saving...' : editingId ? 'Update Package' : 'Publish Package'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    title: '', description: '', flatPrice: '', durationDays: '', itineraryStops: ''
                  });
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
               >
                 Cancel Edit
               </button>
            )}
          </div>
        </form>
      </div>

      {/* Existing Packages List */}
      <div className="mt-10">
        <h3 className="text-xl font-bold text-cyan-950 mb-6">Existing Packages</h3>
        {packages && packages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {packages.map(pkg => (
              <div key={pkg._id} className="bg-white rounded-3xl shadow-[0_20px_50px_-40px_rgba(6,182,212,0.2)] border border-cyan-100 group flex flex-col hover:-translate-y-1 transition-all duration-300">
                <div className="h-40 bg-cyan-100 rounded-t-3xl overflow-hidden relative">
                  <div className="absolute inset-0 bg-cyan-900/20 group-hover:bg-transparent transition-colors" />
                  <img
                    src={`https://source.unsplash.com/600x400/?srilanka,${encodeURIComponent(pkg.title || 'travel')}`}
                    alt={pkg.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = 'https://source.unsplash.com/600x400/?srilanka,adventure'; }}
                  />
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h4 className="text-lg font-bold text-cyan-950 leading-tight mb-2">{pkg.title}</h4>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-600 mb-3 uppercase tracking-wide">
                    <span>{pkg.durationDays} Days Duration</span>
                  </div>
                  
                  <p className="text-sm text-cyan-900/70 line-clamp-2 mb-4 flex-1">{pkg.description}</p>
                  
                  <div className="flex items-end justify-between mb-4 border-t border-cyan-50 pt-4 mt-auto">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-cyan-600">Flat Price</p>
                      <p className="text-lg font-bold text-cyan-950">LKR {pkg.flatPrice.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-cyan-50">
                    <button 
                      onClick={() => handleEdit(pkg)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-cyan-50 text-cyan-700 rounded-xl hover:bg-cyan-100 transition-colors font-semibold text-sm"
                    >
                      <MdEdit /> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(pkg._id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-semibold text-sm"
                    >
                      <MdDelete /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-cyan-50/50 rounded-3xl p-8 border border-cyan-100 text-center">
            <p className="text-cyan-700 font-medium">No packages created yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
