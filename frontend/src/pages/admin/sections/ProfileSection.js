import { useCallback, useEffect, useState } from 'react';
import { MdEmail, MdLock, MdPerson, MdPhone, MdRefresh, MdSave } from 'react-icons/md';
import { adminAPI } from '../../../services/adminAPI';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: ''
};

function normalize(value) {
  return String(value || '').trim();
}

function getInitials(name) {
  const parts = normalize(name).split(/\s+/).filter(Boolean).slice(0, 2);
  if (!parts.length) return 'AD';
  return parts.map((part) => part[0].toUpperCase()).join('');
}

export default function ProfileSection() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({});

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const result = await adminAPI.getMyProfile();
      const user = result?.user || {};
      const next = {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      };
      setForm(next);
      setInitialForm(next);
      setFieldErrors({});
      setMessage('');
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateField = (key, value) => {
    setMessage('');
    const nextValue = key === 'phone' ? String(value).replace(/\D/g, '').slice(0, 10) : value;
    setForm((prev) => ({ ...prev, [key]: nextValue }));
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const updatePasswordField = (key, value) => {
    setPasswordMessage('');
    setPasswordError('');
    setPasswordForm((prev) => ({ ...prev, [key]: value }));
    setPasswordFieldErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const isDirty =
    normalize(form.name) !== normalize(initialForm.name) ||
    normalize(form.email) !== normalize(initialForm.email) ||
    normalize(form.phone) !== normalize(initialForm.phone);

  const validate = () => {
    const nextErrors = {};
    const name = normalize(form.name);
    const email = normalize(form.email).toLowerCase();
    const phone = normalize(form.phone);

    if (!name || name.length < 3) {
      nextErrors.name = 'Name should be at least 3 characters.';
    } else if (name.length > 60) {
      nextErrors.name = 'Name should be 60 characters or fewer.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      nextErrors.email = 'Enter a valid email address.';
    } else if (email.length > 120) {
      nextErrors.email = 'Email should be 120 characters or fewer.';
    }

    if (!/^\d{10}$/.test(phone)) {
      nextErrors.phone = 'Phone number must contain exactly 10 digits (numbers only).';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleReset = () => {
    setForm(initialForm);
    setFieldErrors({});
    setError('');
    setMessage('Changes were reset.');
  };

  const validatePasswordForm = () => {
    const nextErrors = {};
    const currentPassword = String(passwordForm.currentPassword || '');
    const newPassword = String(passwordForm.newPassword || '');
    const confirmPassword = String(passwordForm.confirmPassword || '');

    if (!currentPassword) nextErrors.currentPassword = 'Current password is required.';
    if (!newPassword || newPassword.length < 8) {
      nextErrors.newPassword = 'New password should be at least 8 characters.';
    } else {
      const hasUpper = /[A-Z]/.test(newPassword);
      const hasLower = /[a-z]/.test(newPassword);
      const hasNumber = /\d/.test(newPassword);
      if (!hasUpper || !hasLower || !hasNumber) {
        nextErrors.newPassword = 'Use at least 1 uppercase letter, 1 lowercase letter, and 1 number.';
      }
    }
    if (!confirmPassword) nextErrors.confirmPassword = 'Please confirm your new password.';
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      nextErrors.confirmPassword = 'New password and confirm password do not match.';
    }
    if (currentPassword && newPassword && currentPassword === newPassword) {
      nextErrors.newPassword = 'New password must be different from current password.';
    }

    setPasswordFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handlePasswordReset = () => {
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordFieldErrors({});
    setPasswordError('');
    setPasswordMessage('Password form was cleared.');
  };

  const handlePasswordSave = async () => {
    setPasswordMessage('');
    setPasswordError('');

    if (!validatePasswordForm()) return;

    try {
      setChangingPassword(true);
      const payload = {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      };
      const result = await adminAPI.changeMyPassword(payload);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordFieldErrors({});
      setPasswordMessage(result?.message || 'Password updated successfully.');
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSave = async () => {
    setMessage('');
    setError('');

    if (!validate()) return;

    try {
      setSaving(true);
      const payload = {
        name: normalize(form.name),
        email: normalize(form.email).toLowerCase(),
        phone: normalize(form.phone)
      };
      const result = await adminAPI.updateMyProfile(payload);
      const updated = result?.user || payload;

      const next = {
        name: updated.name || '',
        email: updated.email || '',
        phone: updated.phone || ''
      };
      setForm(next);
      setInitialForm(next);

      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser);
          localStorage.setItem('user', JSON.stringify({ ...parsed, ...next }));
        } catch {
          localStorage.setItem('user', JSON.stringify(next));
        }
      } else {
        localStorage.setItem('user', JSON.stringify(next));
      }
      window.dispatchEvent(new Event('waygo:profile-updated'));

      setMessage(result?.message || 'Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl wg-admin-motion wg-motion-staff">
      <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 px-6 py-5 text-white shadow-[0_26px_55px_-35px_rgba(79,70,229,0.72)]">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/15 blur-xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-100">Identity</p>
        <h2 className="mt-1 text-xl font-bold">Admin Profile</h2>
        <p className="mt-1 text-sm text-indigo-100/95">Update your account details used across the admin workspace.</p>
      </div>

      <div className="bg-white/85 backdrop-blur-sm rounded-3xl shadow-[0_20px_45px_-30px_rgba(30,64,175,0.22)] border border-white/70 p-6">
        {loading ? (
          <p className="text-sm text-slate-600">Loading profile...</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
            <aside className="rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50 to-cyan-50 p-5 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white flex items-center justify-center text-lg font-bold shadow-lg shadow-indigo-200">
                {getInitials(form.name)}
              </div>
              <div>
                <p className="text-base font-bold text-slate-900 break-words">{normalize(form.name) || 'Admin'}</p>
                <p className="text-sm text-slate-600 break-all">{normalize(form.email) || 'No email set'}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <MdPerson className="text-base text-indigo-600" />
                  <span>Role: System Admin</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <MdPhone className="text-base text-indigo-600" />
                  <span>{normalize(form.phone) || 'No phone set'}</span>
                </div>
              </div>
            </aside>

            <section className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center">
                  <MdPerson className="text-xl" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Profile Information</h3>
                  <p className="text-sm text-slate-600">Keep your identity and contact details up to date.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-800">Full Name</label>
                  <input
                    value={form.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="Enter your full name"
                  />
                  {fieldErrors.name && <p className="text-xs text-rose-600">{fieldErrors.name}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800">Email</label>
                  <div className="relative">
                    <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => updateField('email', event.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      placeholder="you@example.com"
                    />
                  </div>
                  {fieldErrors.email && <p className="text-xs text-rose-600">{fieldErrors.email}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800">Phone</label>
                  <div className="relative">
                    <MdPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={form.phone}
                      onChange={(event) => updateField('phone', event.target.value)}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      placeholder="Enter contact number"
                    />
                  </div>
                  {fieldErrors.phone && <p className="text-xs text-rose-600">{fieldErrors.phone}</p>}
                </div>
              </div>

              {error && <p className="text-sm font-semibold text-rose-700">{error}</p>}
              {message && <p className="text-sm font-semibold text-emerald-700">{message}</p>}

              <div className="pt-1 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving || loading || !isDirty}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <MdSave className="text-lg" />
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
                <button
                  onClick={handleReset}
                  disabled={saving || loading || !isDirty}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <MdRefresh className="text-lg" />
                  Reset Changes
                </button>
                {!isDirty && <span className="text-xs font-medium text-slate-500">No unsaved changes</span>}
              </div>
            </section>
          </div>
        )}
      </div>

      <div className="bg-white/85 backdrop-blur-sm rounded-3xl shadow-[0_20px_45px_-30px_rgba(30,64,175,0.22)] border border-white/70 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center">
            <MdLock className="text-xl" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
            <p className="text-sm text-slate-600">Use a strong password and keep your account secure.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-800">Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) => updatePasswordField('currentPassword', event.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Enter current password"
            />
            {passwordFieldErrors.currentPassword && <p className="text-xs text-rose-600">{passwordFieldErrors.currentPassword}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800">New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) => updatePasswordField('newPassword', event.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="At least 6 characters"
            />
            {passwordFieldErrors.newPassword && <p className="text-xs text-rose-600">{passwordFieldErrors.newPassword}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800">Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) => updatePasswordField('confirmPassword', event.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Re-enter new password"
            />
            {passwordFieldErrors.confirmPassword && <p className="text-xs text-rose-600">{passwordFieldErrors.confirmPassword}</p>}
          </div>
        </div>

        {passwordError && <p className="text-sm font-semibold text-rose-700">{passwordError}</p>}
        {passwordMessage && <p className="text-sm font-semibold text-emerald-700">{passwordMessage}</p>}

        <div className="pt-1 flex flex-wrap items-center gap-3">
          <button
            onClick={handlePasswordSave}
            disabled={changingPassword}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <MdSave className="text-lg" />
            {changingPassword ? 'Updating...' : 'Update Password'}
          </button>
          <button
            onClick={handlePasswordReset}
            disabled={changingPassword}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <MdRefresh className="text-lg" />
            Clear Fields
          </button>
        </div>
      </div>
    </div>
  );
}
