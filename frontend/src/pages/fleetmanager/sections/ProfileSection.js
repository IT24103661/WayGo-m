import { useEffect, useState } from 'react';
import { MdPerson } from 'react-icons/md';
import { useFleetProfile } from '../../../hooks/useFleetManagerAPI';

const REGION_OPTIONS = [
  'Western Province',
  'Central Province',
  'Southern Province',
  'Northern Province',
  'North Western Province'
];

const DEPOT_OPTIONS = [
  'Colombo Central Depot',
  'Kandy Depot',
  'Galle Depot',
  'Negombo Depot',
  'Jaffna Depot'
];

export default function ProfileSection() {
  const { profile, loading, updateProfile } = useFleetProfile();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    depot: '',
    region: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      company: profile.company || '',
      depot: profile.depot || '',
      region: profile.region || ''
    });
  }, [profile]);

  const handleSave = async () => {
    setMessage('');
    setSaving(true);
    try {
      await updateProfile({
        name: form.name,
        email: form.email,
        phone: form.phone,
        company: form.company,
        depot: form.depot,
        region: form.region
      });
      setMessage('Profile updated successfully.');
    } catch (err) {
      setMessage(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="relative space-y-6 rounded-[28px] bg-gradient-to-br from-cyan-950 via-cyan-900 to-[#0c4153] p-6 md:p-8 text-slate-100 overflow-hidden"
      style={{ fontFamily: '"Outfit", "Plus Jakarta Sans", "Segoe UI", sans-serif' }}
    >
      <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-cyan-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" />

      <div className="relative rounded-3xl border border-cyan-400/20 bg-white/5 backdrop-blur-xl shadow-[0_30px_80px_-60px_rgba(6,182,212,0.6)] p-6 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-200/70 via-cyan-300 to-sky-200/70" />
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-md shadow-black/20">
                <MdPerson className="text-lg" />
              </span>
              <h2 className="text-2xl font-bold text-white">Profile</h2>
            </div>
            <p className="text-sm text-cyan-100/80 mt-1">Manage your fleet manager details and contact info.</p>
          </div>
          <span className="text-xs uppercase tracking-[0.3em] text-cyan-100/90 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-400/35 transition-all duration-200 hover:shadow-[0_8px_18px_-12px_rgba(8,145,178,0.85)]">
            Fleet Manager
          </span>
        </div>

        {loading && <p className="text-sm text-cyan-100/80 mt-4">Loading profile...</p>}

        <div className="grid grid-cols-1 xl:grid-cols-[1.3fr,1fr] gap-5 mt-6">
          <div className="space-y-4 rounded-2xl border border-cyan-400/20 bg-cyan-900/20 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-cyan-100 mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400/70 bg-white/90 text-slate-900 placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-cyan-100 mb-1">Company</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full px-4 py-2.5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400/70 bg-white/90 text-slate-900 placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-cyan-100 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400/70 bg-white/90 text-slate-900 placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-cyan-100 mb-1">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400/70 bg-white/90 text-slate-900 placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-cyan-100 mb-1">Depot Location</label>
                <input
                  type="text"
                  value={form.depot}
                  onChange={(e) => setForm({ ...form, depot: e.target.value })}
                  className="w-full px-4 py-2.5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400/70 bg-white/90 text-slate-900 placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-cyan-100 mb-1">Region</label>
                <input
                  type="text"
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className="w-full px-4 py-2.5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400/70 bg-white/90 text-slate-900 placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-cyan-400/20 bg-slate-950/30 p-4">
            <div>
              <p className="text-sm font-semibold text-cyan-100 mb-2">Quick Region Options</p>
              <div className="flex flex-wrap gap-2">
                {REGION_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setForm({ ...form, region: option })}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${form.region === option ? 'bg-cyan-200 text-cyan-950 border-cyan-100' : 'bg-white/5 text-cyan-100 border-cyan-500/40 hover:bg-cyan-500/20'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-cyan-100 mb-2">Quick Depot Options</p>
              <div className="flex flex-wrap gap-2">
                {DEPOT_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setForm({ ...form, depot: option })}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${form.depot === option ? 'bg-sky-200 text-sky-950 border-sky-100' : 'bg-white/5 text-cyan-100 border-cyan-500/40 hover:bg-cyan-500/20'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-cyan-100/80 leading-relaxed">
              You can type custom values or tap quick options, then hit save.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 text-white font-semibold hover:bg-cyan-700 disabled:opacity-60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-12px_rgba(8,145,178,0.9)]"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
          {message && <p className="text-sm text-cyan-100/90">{message}</p>}
        </div>
      </div>
    </div>
  );
}
