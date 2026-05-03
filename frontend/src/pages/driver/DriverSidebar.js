import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  MdDashboard,
  MdLocalTaxi,
  MdEventNote,
  MdHelp,
  MdSettings,
  MdLogout,
  MdClose,
} from 'react-icons/md';

const NAV_ITEMS = [
  { to: '/dashboard/driver/overview', label: 'Overview', icon: MdDashboard },
  { to: '/dashboard/driver/settings', label: 'My Profile', icon: MdSettings },
  { to: '/dashboard/driver/requests', label: 'Active Requests', icon: MdLocalTaxi },
  { to: '/dashboard/driver/itineraries', label: 'Upcoming Itineraries', icon: MdEventNote },
  { to: '/dashboard/driver/support', label: 'Support', icon: MdHelp },
];

export default function DriverSidebar({ open, onClose }) {
  const navigate = useNavigate();
  const [driverName, setDriverName] = useState('Driver');

  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
           const parsed = JSON.parse(storedUser);
           if (parsed.name) {
             setDriverName(parsed.name);
             return;
           }
        }

        const token = localStorage.getItem('waygo_token');
        if (token) {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          setDriverName(payload.name || 'Driver');
        }
      } catch {
        // ignore errors
      }
    };

    loadUser();
    window.addEventListener('userUpdated', loadUser);
    return () => window.removeEventListener('userUpdated', loadUser);
  }, []);

  function handleLogout() {
    localStorage.removeItem('waygo_token');
    localStorage.removeItem('waygo_role');
    localStorage.removeItem('user');
    navigate('/login');
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-72 z-30 flex flex-col
          bg-gradient-to-b from-[#0f4a61] via-[#13607a] to-[#0f4f66]
          border-r border-cyan-300/45 shadow-[0_30px_80px_-50px_rgba(6,182,212,0.55)]
          transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        <div className="flex items-center justify-between px-6 h-20 border-b border-cyan-200/35 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-cyan-300 via-sky-200 to-teal-200 rounded-2xl flex items-center justify-center font-bold text-cyan-950 text-xl shadow-lg">
              W
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none tracking-tight">WayGo</p>
              <p className="text-cyan-50 text-xs font-semibold mt-0.5 uppercase tracking-[0.2em]">Driver</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-cyan-50 hover:text-white hover:bg-cyan-800/50 rounded-lg transition-colors shrink-0"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        <nav className="flex-1 px-5 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="px-2 mb-2 text-[11px] font-semibold text-cyan-50 uppercase tracking-[0.3em]">
            Command Deck
          </div>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group
                 ${isActive
                   ? 'bg-cyan-100/25 text-white border border-cyan-100/45 shadow-[0_8px_30px_-18px_rgba(125,211,252,0.7)]'
                   : 'text-cyan-50/95 hover:bg-cyan-100/15 hover:text-white border border-transparent'
                 }`
              }
            >
              <Icon className="text-lg transition-colors" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-cyan-200/35 bg-cyan-900/10">
          <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-cyan-100/15 border border-cyan-100/30 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-300 to-teal-200 flex items-center justify-center text-cyan-950 font-bold text-sm flex-shrink-0">
              {driverName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-semibold truncate">{driverName}</p>
              <p className="text-cyan-50/85 text-xs truncate">Driver</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-cyan-50 hover:text-red-200 hover:bg-red-900/25 rounded-xl transition-all text-sm font-semibold"
          >
            <MdLogout className="text-lg" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
