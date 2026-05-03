import { useState, useEffect } from 'react';
import { MdPerson, MdEmail, MdPhone, MdSave, MdDelete } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';



export default function TourManagerProfileSection() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchProfile = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('waygo_token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setProfile(data.user);
        setForm({ name: data.user.name || '', phone: data.user.phone || '', email: data.user.email || '' });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    let { name, value } = e.target;
    
    // Strict typing validations
    if (name === 'name') {
      // Allow only letters and spaces
      value = value.replace(/[^a-zA-Z\s]/g, '');
    } else if (name === 'phone') {
      // Allow only numbers and leading '+'
      value = value.replace(/[^\d+]/g, '');
      // Ensure '+' is only at the beginning
      if (value.indexOf('+') > 0) {
        value = value.replace(/\+/g, '');
        value = '+' + value;
      }
    }

    setForm({ ...form, [name]: value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`http://localhost:5001/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('waygo_token')}`
        },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setProfile(data.user);
        
        // Dispatch custom global event so the sidebar can update instantly!
        window.dispatchEvent(new CustomEvent('profileUpdated', {
          detail: { name: data.user.name }
        }));
        
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you strictly sure you want to completely delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/users/profile`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('waygo_token')}`
        }
      });
      if (response.ok) {
        localStorage.removeItem('waygo_token');
        localStorage.removeItem('waygo_role');
        navigate('/login');
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Failed to delete account.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
  };

  if (loading) {
    return <div className="text-cyan-700">Loading profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <p className="text-xs font-semibold tracking-[0.3em] text-cyan-700 uppercase">My Account</p>
        <h2 className="text-2xl font-bold text-cyan-950">Manager Profile</h2>
        <p className="text-cyan-700/80">Manage your personal information and contact details.</p>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-cyan-200 shadow-[0_20px_50px_-40px_rgba(6,182,212,0.35)] overflow-hidden">
        
        <div className="h-32 bg-gradient-to-r from-cyan-600 to-sky-500 relative">
           <div className="absolute -bottom-12 left-8">
              <div className="w-24 h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center text-4xl font-bold text-cyan-700 border-4 border-white">
                {profile?.name?.charAt(0).toUpperCase() || 'M'}
              </div>
           </div>
        </div>

        <div className="pt-16 p-8">
          <form onSubmit={handleUpdate} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-cyan-900 mb-2 flex items-center gap-2">
                  <MdPerson /> Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  pattern="^[a-zA-Z\s]{3,50}$"
                  title="Name must be between 3 and 50 characters, letters only."
                  className="w-full px-4 py-3 border border-cyan-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-cyan-50/30"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-cyan-900 mb-2 flex items-center gap-2">
                  <MdPhone /> Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  pattern="^\+?[0-9]{9,15}$"
                  title="Phone must be a valid number (e.g., +94771234567 or 0771234567)"
                  className="w-full px-4 py-3 border border-cyan-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-cyan-50/30"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-cyan-900 mb-2 flex items-center gap-2">
                  <MdEmail /> Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-cyan-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-cyan-50/30"
                />
              </div>
            </div>

            {message.text && (
              <div className={`p-4 rounded-2xl text-sm font-semibold ${message.type === 'success' ? 'bg-cyan-100 text-cyan-800' : 'bg-red-100 text-red-800'}`}>
                {message.text}
              </div>
            )}

            <div className="flex items-center gap-4 pt-4 border-t border-cyan-50">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-cyan-600 text-white font-semibold hover:bg-cyan-700 transition-colors disabled:opacity-60"
              >
                <MdSave className="text-xl" />
                {saving ? 'Saving...' : 'Update Profile'}
              </button>
              
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors ml-auto"
              >
                <MdDelete className="text-xl" />
                Delete Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}