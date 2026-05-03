import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  MdDashboard, MdLogout, MdClose, MdKeyboardArrowRight,
  MdSupervisedUserCircle, MdBarChart, MdTune, MdGavel, MdPayments, MdPerson, MdWarning,
} from 'react-icons/md';

const NAV_ITEMS = [
  { to: '/dashboard/admin/overview',   label: 'Overview',   icon: MdDashboard            },
  { to: '/dashboard/admin/profile',    label: 'Profile',    icon: MdPerson               },
  { to: '/dashboard/admin/staff',      label: 'Staff',      icon: MdSupervisedUserCircle },
  { to: '/dashboard/admin/analytics',  label: 'Analytics',  icon: MdBarChart             },
  { to: '/dashboard/admin/config',     label: 'Config',     icon: MdTune                 },
  { to: '/dashboard/admin/salaries',   label: 'Salaries',   icon: MdPayments             },
  { to: '/dashboard/admin/alerts',     label: 'Alerts',     icon: MdWarning              },
  { to: '/dashboard/admin/conflicts',  label: 'Conflicts',  icon: MdGavel                },
];

const getStoredAdminName = () => {
  try {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      const fromUser = String(parsed?.name || '').trim();
      if (fromUser) return fromUser;
    }

    const token = localStorage.getItem('waygo_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const fromToken = String(payload?.name || '').trim();
      if (fromToken) return fromToken;
    }

    return 'Admin';
  } catch {
    return 'Admin';
  }
};

export default function AdminSidebar({ open, onClose }) {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState(getStoredAdminName);

  useEffect(() => {
    const syncName = () => setAdminName(getStoredAdminName());
    window.addEventListener('storage', syncName);
    window.addEventListener('waygo:profile-updated', syncName);
    return () => {
      window.removeEventListener('storage', syncName);
      window.removeEventListener('waygo:profile-updated', syncName);
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem('waygo_token');
    localStorage.removeItem('waygo_role');
    localStorage.removeItem('user');
    navigate('/login');
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-stone-900/40 z-20 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-72 z-30 flex flex-col overflow-hidden
          bg-gradient-to-b from-[#0f4a61] via-[#13607a] to-[#0f4f66]
          border-r border-cyan-300/45 shadow-[0_30px_80px_-50px_rgba(6,182,212,0.55)] transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        <div className="pointer-events-none absolute -right-14 top-20 h-40 w-40 rounded-full bg-cyan-200/20 blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center justify-between px-6 h-20 border-b border-cyan-200/35 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 bg-gradient-to-br from-cyan-300 via-sky-200 to-teal-200 rounded-2xl flex items-center justify-center font-bold text-cyan-950 text-xl shadow-lg">
              W
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none tracking-tight">WayGo</p>
              <p className="text-cyan-50 text-xs font-semibold mt-0.5 uppercase tracking-[0.2em]">Admin Panel</p>
            </div>
          </div>
          <button onClick={onClose} className="text-cyan-50 hover:text-white hover:bg-cyan-800/50 p-2 rounded-lg lg:hidden transition-colors shrink-0">
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 px-4 py-8 overflow-y-auto">
          <p className="px-4 mb-4 text-[11px] font-semibold text-cyan-50 uppercase tracking-[0.3em]">Navigation</p>
          <div className="space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className="group"
            >
              {({ isActive }) => (
                <div
                  className={`relative flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 border
                    ${isActive
                      ? 'bg-cyan-100/25 text-white border-cyan-100/45 shadow-[0_8px_30px_-18px_rgba(125,211,252,0.7)]'
                      : 'text-cyan-50/95 border-transparent hover:bg-cyan-100/15 hover:text-white'
                    }`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-white/12 text-cyan-50' : 'bg-white/8 text-cyan-100 group-hover:text-white'}`}>
                    <Icon className="text-lg flex-shrink-0" />
                  </span>
                  <span className="flex-1 tracking-wide relative top-[1px]">{label}</span>
                  <MdKeyboardArrowRight className={`text-lg transition-all ${isActive ? 'opacity-100 translate-x-0 text-cyan-100' : 'opacity-0 -translate-x-1 group-hover:opacity-70 group-hover:translate-x-0'}`} />
                </div>
              )}
            </NavLink>
          ))}
          </div>
        </nav>

        {/* Profile + logout */}
        <div className="relative px-4 py-4 border-t border-cyan-200/35 bg-cyan-900/10 flex-shrink-0 space-y-1">
          <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-cyan-100/15 border border-cyan-100/30 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-300 to-teal-200 flex items-center justify-center text-cyan-950 font-bold text-sm flex-shrink-0 shadow-md">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{adminName}</p>
              <p className="text-cyan-50/85 text-xs">System Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-cyan-50 hover:bg-cyan-800/40 hover:text-white transition-all"
          >
            <MdLogout className="text-lg" />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
