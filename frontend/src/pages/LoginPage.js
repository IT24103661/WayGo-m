import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdFlight, MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdArrowForward } from 'react-icons/md';
import { FaShieldAlt, FaGlobeAmericas, FaStar } from 'react-icons/fa';

const ROLE_REDIRECTS = {
  Tourist:     '/dashboard/tourist',
  Driver:      '/dashboard/driver',
  TourManager: '/dashboard/tourmanager',
  FleetManager:'/dashboard/fleetmanager',
  SystemAdmin: '/dashboard/admin',
  Admin:       '/dashboard/admin',
};

/* ── ripple helper ── */
function RippleBtn({ onClick, children, className, disabled, type = 'button' }) {
  const handleClick = (e) => {
    if (disabled) return;
    const btn = e.currentTarget;
    const circle = document.createElement('span');
    const d = Math.max(btn.clientWidth, btn.clientHeight);
    const rect = btn.getBoundingClientRect();
    circle.style.cssText = `
      width:${d}px; height:${d}px;
      left:${e.clientX - rect.left - d / 2}px;
      top:${e.clientY - rect.top - d / 2}px;
      position:absolute; border-radius:50%;
      background:rgba(255,255,255,0.35); pointer-events:none;
      animation: ripple 0.6s linear forwards;
    `;
    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 650);
    onClick && onClick(e);
  };
  return (
    <button type={type} disabled={disabled} onClick={handleClick}
      className={`relative overflow-hidden ${className}`}>
      {children}
    </button>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();

  // If already logged in, redirect to the correct dashboard immediately
  useEffect(() => {
    const role = localStorage.getItem('waygo_role');
    const token = localStorage.getItem('waygo_token');
    if (role && token && ROLE_REDIRECTS[role]) {
      navigate(ROLE_REDIRECTS[role], { replace: true });
    }
  }, [navigate]);

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [lockUntil, setLockUntil] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());

  const isLocked = lockUntil && lockUntil > nowTick;
  const remainingSeconds = isLocked ? Math.max(0, Math.ceil((lockUntil - nowTick) / 1000)) : 0;
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const remainingRemainderSeconds = remainingSeconds % 60;

  useEffect(() => {
    if (!isLocked) return undefined;
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [isLocked]);

  useEffect(() => {
    if (!isLocked && lockUntil) {
      setLockUntil(null);
      setError('Lock finished. You can try signing in again.');
    }
  }, [isLocked, lockUntil]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLocked) {
      setError('Account is currently locked. Please wait until the countdown finishes.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5001/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 423) {
          const nextLockUntil = data?.lockUntil ? Date.parse(data.lockUntil) : (Date.now() + 3 * 60 * 1000);
          setLockUntil(Number.isFinite(nextLockUntil) ? nextLockUntil : (Date.now() + 3 * 60 * 1000));
          setNowTick(Date.now());
          setError(data.message || 'Too many attempts. Your account is temporarily locked.');
          return;
        }
        setError(data.message || 'Invalid email or password.');
      } else {
        localStorage.removeItem('user');
        localStorage.setItem('waygo_token', data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('waygo_role', data.role);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        window.dispatchEvent(new Event('userUpdated'));
        window.dispatchEvent(new Event('profileUpdated'));
        setLoginSuccess(true);
        setTimeout(() => {
          const redirect = ROLE_REDIRECTS[data.role] || '/';
          navigate(redirect);
        }, 1000);
      }
    } catch {
      setError('Unable to reach the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL ── */}
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
              Welcome<br />
              <span className="bg-gradient-to-r from-accent-400 to-yellow-300 bg-clip-text text-transparent">
                back!
              </span>
            </h2>
            <p className="text-white/60 mt-4 text-base leading-relaxed">
              Sign in to access your bookings, tour history, and driver dashboard.
            </p>
          </div>
          <div className="space-y-3 animate-fade-in-up-d2">
            {[
              { icon: <FaShieldAlt />,     text: 'Your data is always protected' },
              { icon: <FaGlobeAmericas />, text: 'Access bookings anywhere' },
              { icon: <FaStar />,          text: 'Manage your travel history' },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 text-sm text-white/80">
                <span className="text-accent-400">{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="relative z-10 grid grid-cols-3 gap-4 animate-fade-in-up-d4">
          {[
            { value: '50K+', label: 'Travelers' },
            { value: '200+', label: 'Destinations' },
            { value: '4.9★', label: 'Rating' },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 border border-white/15 rounded-xl p-4 text-center backdrop-blur-sm">
              <p className="text-xl font-black text-white">{s.value}</p>
              <p className="text-xs text-white/50 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-gray-50">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden animate-fade-in">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-600 to-accent-500 rounded-xl flex items-center justify-center">
              <MdFlight className="text-white text-lg rotate-45" />
            </div>
            <span className="text-xl font-black text-gray-900">Way<span className="text-accent-500">Go</span></span>
          </div>

          {/* Heading */}
          <div className="mb-8 animate-fade-in-up">
            <h1 className="text-3xl font-black text-gray-900">Sign in</h1>
            <p className="text-sm text-gray-500 mt-1">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-600 font-semibold hover:underline">Sign up free</Link>
            </p>
          </div>

          {/* Success flash */}
          {loginSuccess && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3.5 rounded-xl mb-5 animate-fade-in">
              <svg className="animate-spin h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Login successful! Redirecting…
            </div>
          )}

          {/* Error */}
          {error && (
            <div className={`flex items-start gap-3 text-sm px-4 py-3.5 rounded-xl mb-5 animate-fade-in ${
              isLocked
                ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-900'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <span className={`mt-0.5 ${isLocked ? 'text-amber-500' : 'text-red-400'}`}>⚠</span>
              <div className="space-y-1">
                <p className="font-semibold">{error}</p>
                {isLocked && (
                  <p className="text-xs text-amber-800">
                    Security lock active: {String(remainingMinutes).padStart(2, '0')}:{String(remainingRemainderSeconds).padStart(2, '0')} remaining.
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="animate-fade-in-up-d1">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-widest">
                Email Address
              </label>
              <div className="relative group">
                <MdEmail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors"
                  size={20}
                />
                <input
                  type="email" name="email" value={form.email}
                  onChange={handleChange} required disabled={isLocked}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password */}
            <div className="animate-fade-in-up-d2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Password</label>
                <Link to="#" className="text-xs text-brand-600 font-medium hover:underline">Forgot password?</Link>
              </div>
              <div className="relative group">
                <MdLock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors"
                  size={20}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password" value={form.password}
                  onChange={handleChange} required disabled={isLocked}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={isLocked}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none animate-fade-in-up-d3">
              <div className="relative">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-5 h-5 rounded-md border-2 border-gray-300 peer-checked:bg-brand-600 peer-checked:border-brand-600 transition-all" />
                <svg className="absolute inset-0 w-5 h-5 text-white opacity-0 peer-checked:opacity-100 transition-opacity p-0.5" fill="none" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-sm text-gray-600">Remember me for 30 days</span>
            </label>

            {/* Submit */}
            <div className="animate-fade-in-up-d4">
              <RippleBtn
                type="submit"
                disabled={loading || loginSuccess || isLocked}
                className="w-full py-4 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In <MdArrowForward size={18} />
                  </span>
                )}
              </RippleBtn>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6 animate-fade-in-up-d5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Role Guide</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Role chips */}
          <div className="grid grid-cols-2 gap-2 text-xs animate-fade-in-up-d5">
            {[
              { emoji: '🧳', role: 'Tourist',      desc: 'Book tours & taxis' },
              { emoji: '🚗', role: 'Driver',        desc: 'Accept ride requests' },
              { emoji: '🗺️', role: 'Tour Manager',  desc: 'Manage itineraries' },
              { emoji: '🚌', role: 'Fleet Manager', desc: 'Manage driver pool' },
            ].map((item) => (
              <div key={item.role}
                className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2.5 border border-gray-100 shadow-sm">
                <span className="text-base">{item.emoji}</span>
                <div>
                  <p className="font-semibold text-gray-700">{item.role}</p>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
