import { useState, useEffect } from 'react';
import { MdPerson, MdEmail, MdPhone, MdSave } from 'react-icons/md';
import { touristAPI } from '../../../services/touristAPI';

export default function ProfileSection() {
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await touristAPI.getProfile();
      setProfile({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || ''
      });
    } catch (err) {
      console.error(err);
      setMessage('Failed to load profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setProfile({ ...profile, [name]: nextValue });
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateProfile = () => {
    const nextErrors = {};
    const name = profile.name.trim();
    const email = profile.email.trim();
    const phone = profile.phone.trim();

    if (name.length < 2 || name.length > 80) {
      nextErrors.name = 'Name must be between 2 and 80 characters.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!/^\d{10}$/.test(phone)) {
      nextErrors.phone = 'Phone number must contain exactly 10 digits.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateProfile()) {
      setMessage('Please fix the highlighted fields.');
      return;
    }
    setIsSaving(true);
    setMessage('');
    try {
      await touristAPI.updateProfile(profile);
      setMessage('Profile updated successfully! ✅');
      
      // Update local storage so the sidebar name updates on refresh
      try {
        const token = localStorage.getItem('waygo_token');
        if (token) {
           // Simplistic local storage update for fast reaction
           // Normally we'd re-assign token if the backend returns a new one, but let's just alert for now!
        }
      } catch(e) {}
    } catch (err) {
      setMessage(`Update failed: ${err.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-emerald-600 font-bold">Loading Profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up pb-10">
      <div className="bg-white rounded-[2rem] border border-stone-200 p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none" />
        
        <h2 className="text-2xl font-black text-zinc-900 mb-6">Personal Information</h2>
        
        {message && (
          <div className={`p-4 rounded-xl mb-6 font-semibold text-sm ${message.includes('failed') ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="block text-sm font-bold text-stone-500 mb-2 uppercase tracking-wide">Full Name</label>
            <div className="flex items-center bg-stone-50 rounded-xl border border-stone-200 focus-within:border-emerald-500/50 px-4 py-3 transition-colors">
              <MdPerson className="text-stone-400 text-xl mr-3" />
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                className="bg-transparent border-none outline-none w-full text-zinc-900 font-medium"
                required
              />
            </div>
            {fieldErrors.name && <p className="mt-1 text-xs text-rose-600">{fieldErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-500 mb-2 uppercase tracking-wide">Email Address</label>
            <div className="flex items-center bg-stone-50 rounded-xl border border-stone-200 focus-within:border-emerald-500/50 px-4 py-3 transition-colors">
              <MdEmail className="text-stone-400 text-xl mr-3" />
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                className="bg-transparent border-none outline-none w-full text-zinc-900 font-medium"
                required
              />
            </div>
            {fieldErrors.email && <p className="mt-1 text-xs text-rose-600">{fieldErrors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-500 mb-2 uppercase tracking-wide">Phone Number</label>
            <div className="flex items-center bg-stone-50 rounded-xl border border-stone-200 focus-within:border-emerald-500/50 px-4 py-3 transition-colors">
              <MdPhone className="text-stone-400 text-xl mr-3" />
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                className="bg-transparent border-none outline-none w-full text-zinc-900 font-medium"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
              />
            </div>
            {fieldErrors.phone && <p className="mt-1 text-xs text-rose-600">{fieldErrors.phone}</p>}
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-end">
             <button
               type="submit"
               disabled={isSaving}
               className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-[0_4px_15px_rgba(16,185,129,0.2)]"
             >
               <MdSave className="text-lg" />
               {isSaving ? 'Saving...' : 'Save Changes'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
