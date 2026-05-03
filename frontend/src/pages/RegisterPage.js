import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdFlight, MdPerson, MdEmail, MdLock, MdPhone, MdVisibility, MdVisibilityOff, MdArrowForward } from 'react-icons/md';
import { FaCheckCircle, FaShieldAlt, FaGlobeAmericas, FaStar } from 'react-icons/fa';

const ROLES = [
  { value: 'Tourist', label: 'Tourist', emoji: '🧳', desc: 'Browse tours & book rides' },
  { value: 'Driver', label: 'Driver', emoji: '🚗', desc: 'Accept ride requests' },
  { value: 'TourManager', label: 'Tour Manager', emoji: '🗺️', desc: 'Manage tour packages' },
  { value: 'FleetManager', label: 'Fleet Manager', emoji: '🚌', desc: 'Manage drivers & vehicles' },
];

/* ── password strength ── */
function getStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let s = 0;
  if (pw.length >= 6)  s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { label: 'Very Weak', color: 'bg-red-500' },
    { label: 'Weak',      color: 'bg-orange-400' },
    { label: 'Fair',      color: 'bg-yellow-400' },
    { label: 'Good',      color: 'bg-blue-400' },
    { label: 'Strong',    color: 'bg-green-500' },
  ];
  return { score: s, ...map[Math.min(s, 4)] };
}

/* ── ripple helper ── */
function Ripple({ btnRef, onClick, children, className, disabled, type = 'button' }) {
  const handleClick = (e) => {
    if (disabled) return;
    const btn = btnRef?.current || e.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const rect = btn.getBoundingClientRect();
    circle.style.cssText = `
      width:${diameter}px; height:${diameter}px;
      left:${e.clientX - rect.left - diameter / 2}px;
      top:${e.clientY - rect.top - diameter / 2}px;
      position:absolute; border-radius:50%;
      background:rgba(255,255,255,0.35); pointer-events:none;
      animation: ripple 0.6s linear forwards;
    `;
    btn.style.overflow = 'hidden';
    btn.style.position  = 'relative';
    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 650);
    onClick && onClick(e);
  };
  return (
    <button type={type} disabled={disabled} onClick={handleClick} className={className}>
      {children}
    </button>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'Tourist',
    vehiclePlateNumber: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleType: 'Sedan',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const strength = getStrength(form.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setForm((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (!/^\d{10}$/.test(form.phone.trim())) {
      setError('Phone number must contain exactly 10 digits (numbers only).');
      return;
    }

    if (form.role === 'Driver') {
      if (!/^[A-Z]{2,3}-\d{4}$/.test(form.vehiclePlateNumber.trim().toUpperCase())) {
        setError('Vehicle plate number must follow format ABC-1234.');
        return;
      }
      if (!form.vehicleMake.trim() || !form.vehicleModel.trim()) {
        setError('Vehicle make and model are required for driver registration.');
        return;
      }

      const year = Number(form.vehicleYear);
      const maxYear = new Date().getFullYear() + 1;
      if (Number.isNaN(year) || year < 1980 || year > maxYear) {
        setError(`Vehicle year must be between 1980 and ${maxYear}.`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: form.role,
          vehicleDetails: form.role === 'Driver' ? {
            plateNumber: form.vehiclePlateNumber.trim().toUpperCase(),
            make: form.vehicleMake.trim(),
            model: form.vehicleModel.trim(),
            year: Number(form.vehicleYear),
            type: form.vehicleType,
          } : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Registration failed. Please try again.');
      } else {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch {
      setError('Unable to reach the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  /* ─── SUCCESS SCREEN ─── */
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-gray-900 flex items-center justify-center px-4">
        <div className="text-center animate-scale-in">
          <div className="w-28 h-28 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-green-400/30">
            <FaCheckCircle size={56} className="text-green-400 animate-check-pop" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">You're in! 🎉</h2>
          <p className="text-white/60 mb-6">Account created successfully.</p>
          {/* Progress bar */}
          <div className="w-48 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-400 to-accent-400 rounded-full animate-bar-fill" />
          </div>
          <p className="text-xs text-white/40 mt-3">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  /* ─── MAIN PAGE ─── */
  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL (decorative) ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative bg-gradient-to-br from-brand-900 via-brand-800 to-gray-900 flex-col justify-between p-12 overflow-hidden">
        {/* Animated blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-80 h-80 bg-brand-500/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-[-60px] right-[-60px] w-72 h-72 bg-accent-500/15 rounded-full blur-3xl animate-blob [animation-delay:3s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-700/20 rounded-full blur-3xl animate-blob [animation-delay:1.5s]" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg">
            <MdFlight className="text-white text-xl rotate-45" />
          </div>
          <span className="text-2xl font-black text-white">
            Way<span className="text-accent-400">Go</span>
          </span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-6">
          <div className="animate-slide-in-left">
            <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight">
              Start your<br />
              <span className="bg-gradient-to-r from-accent-400 to-yellow-300 bg-clip-text text-transparent">
                journey today
              </span>
            </h2>
            <p className="text-white/60 mt-4 text-base leading-relaxed">
              Join 50,000+ travelers who trust WayGo for tours and taxi rides worldwide.
            </p>
          </div>

          {/* Feature chips */}
          <div className="space-y-3 animate-fade-in-up-d2">
            {[
              { icon: <FaShieldAlt />,      text: 'Secure & verified drivers' },
              { icon: <FaGlobeAmericas />,  text: '200+ destinations covered' },
              { icon: <FaStar />,           text: '4.9★ average rating' },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 text-sm text-white/80">
                <span className="text-accent-400">{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom testimonial */}
        <div className="relative z-10 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5 animate-fade-in-up-d4">
          <p className="text-white/80 text-sm italic leading-relaxed">
            "WayGo made our whole trip seamless. From airport pickup to the mountain tour — flawless."
          </p>
          <div className="flex items-center gap-3 mt-4">
            <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="" className="w-9 h-9 rounded-full object-cover border-2 border-white/30" />
            <div>
              <p className="text-white text-xs font-semibold">Sophia L.</p>
              <p className="text-white/40 text-xs">Solo Traveler</p>
            </div>
            <div className="ml-auto flex gap-0.5">
              {[...Array(5)].map((_, i) => <FaStar key={i} size={10} className="text-yellow-400" />)}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden animate-fade-in">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-600 to-accent-500 rounded-xl flex items-center justify-center">
              <MdFlight className="text-white text-lg rotate-45" />
            </div>
            <span className="text-xl font-black text-gray-900">
              Way<span className="text-accent-500">Go</span>
            </span>
          </div>

          {/* Heading */}
          <div className="mb-7 animate-fade-in-up">
            <h1 className="text-3xl font-black text-gray-900">Create account</h1>
            <p className="text-sm text-gray-500 mt-1">
              Already have one?{' '}
              <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 rounded-xl mb-5 animate-fade-in">
              <span className="text-red-400 mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="animate-fade-in-up-d1">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-widest">
                Full Name
              </label>
              <div className="relative group">
                <MdPerson className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                <input
                  type="text" name="name" value={form.name} onChange={handleChange} required
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Email + Phone side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up-d2">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-widest">Email</label>
                <div className="relative group">
                  <MdEmail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                  <input
                    type="email" name="email" value={form.email} onChange={handleChange} required
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-widest">Phone</label>
                <div className="relative group">
                  <MdPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                  <input
                    type="tel" name="phone" value={form.phone} onChange={handleChange} required
                    placeholder="0712345678"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Role Selector */}
            <div className="animate-fade-in-up-d3">
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">
                I am joining as
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value} type="button"
                    onClick={() => setForm((prev) => ({ ...prev, role: r.value }))}
                    className={`relative flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-200 overflow-hidden ${
                      form.role === r.value
                        ? 'border-brand-600 bg-brand-50 shadow-md shadow-brand-100'
                        : 'border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50/50'
                    }`}
                  >
                    {form.role === r.value && (
                      <span className="absolute top-2 right-2 w-4 h-4 bg-brand-600 rounded-full flex items-center justify-center">
                        <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2.5">
                          <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                    <span className="text-2xl leading-none">{r.emoji}</span>
                    <span>
                      <span className={`block text-sm font-bold ${
                        form.role === r.value ? 'text-brand-700' : 'text-gray-800'
                      }`}>{r.label}</span>
                      <span className="block text-xs text-gray-400 leading-tight">{r.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up-d4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-widest">Password</label>
                <div className="relative group">
                  <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'} name="password"
                    value={form.password} onChange={handleChange} required
                    placeholder="Min. 6 chars"
                    className="w-full pl-10 pr-10 py-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                  </button>
                </div>
                {/* Strength bar */}
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4,5].map((n) => (
                        <div key={n} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          n <= strength.score ? strength.color : 'bg-gray-200'
                        }`} />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${
                      strength.score <= 1 ? 'text-red-500' :
                      strength.score <= 2 ? 'text-orange-400' :
                      strength.score <= 3 ? 'text-yellow-500' : 'text-green-500'
                    }`}>{strength.label}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-widest">Confirm</label>
                <div className="relative group">
                  <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                  <input
                    type={showConfirm ? 'text' : 'password'} name="confirmPassword"
                    value={form.confirmPassword} onChange={handleChange} required
                    placeholder="Repeat password"
                    className={`w-full pl-10 pr-10 py-3.5 rounded-xl border text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm bg-white ${
                      form.confirmPassword && form.confirmPassword !== form.password
                        ? 'border-red-400 focus:ring-red-400'
                        : form.confirmPassword && form.confirmPassword === form.password
                        ? 'border-green-400 focus:ring-green-400'
                        : 'border-gray-200'
                    }`}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showConfirm ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                  </button>
                  {form.confirmPassword && (
                    <span className="absolute right-9 top-1/2 -translate-y-1/2 text-sm">
                      {form.confirmPassword === form.password ? '✅' : '❌'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {form.role === 'Driver' && (
              <div className="animate-fade-in-up-d4 rounded-2xl border border-brand-200 bg-brand-50/40 p-4 space-y-4">
                <div>
                  <p className="text-xs font-bold text-brand-700 uppercase tracking-widest">Vehicle Details</p>
                  <p className="text-xs text-gray-500 mt-1">Required for driver account creation.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-widest">Plate Number</label>
                    <input
                      type="text"
                      name="vehiclePlateNumber"
                      value={form.vehiclePlateNumber}
                      onChange={(e) => setForm((prev) => ({ ...prev, vehiclePlateNumber: e.target.value.toUpperCase() }))}
                      placeholder="BGK-1234"
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-widest">Vehicle Type</label>
                    <select
                      name="vehicleType"
                      value={form.vehicleType}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm"
                      required
                    >
                      <option value="Sedan">Sedan</option>
                      <option value="SUV">SUV</option>
                      <option value="Van">Van</option>
                      <option value="Bus">Bus</option>
                      <option value="Minivan">Minivan</option>
                      <option value="Luxury">Luxury</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-widest">Make</label>
                    <input
                      type="text"
                      name="vehicleMake"
                      value={form.vehicleMake}
                      onChange={handleChange}
                      placeholder="Toyota"
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-widest">Model</label>
                    <input
                      type="text"
                      name="vehicleModel"
                      value={form.vehicleModel}
                      onChange={handleChange}
                      placeholder="Prius"
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-widest">Year</label>
                    <input
                      type="number"
                      name="vehicleYear"
                      value={form.vehicleYear}
                      onChange={handleChange}
                      placeholder="2021"
                      min="1980"
                      max={new Date().getFullYear() + 1}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="animate-fade-in-up-d5">
              <Ripple
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-sm relative overflow-hidden"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Creating account…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Create Account <MdArrowForward size={18} />
                  </span>
                )}
              </Ripple>

              <p className="text-center text-xs text-gray-400 mt-4">
                By registering you agree to our{' '}
                <Link to="#" className="text-brand-600 hover:underline">Terms</Link>
                {' '}&amp;{' '}
                <Link to="#" className="text-brand-600 hover:underline">Privacy Policy</Link>.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
