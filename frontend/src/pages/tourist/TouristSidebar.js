import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import md5 from 'md5';
import { touristAPI } from '../../services/touristAPI';
import {
  MdPerson,
  MdDashboard,
  MdMap,
  MdLocalTaxi,
  MdPermContactCalendar,
  MdStar,
  MdNotifications,
  MdHelp,
  MdLogout,
  MdClose,
} from 'react-icons/md';

const NAV_ITEMS = [
  { to: '/dashboard/tourist/overview', label: 'Overview', icon: MdDashboard },
  { to: '/dashboard/tourist/profile', label: 'My Profile', icon: MdPerson },
  { to: '/dashboard/tourist/tours', label: 'Browse Tours', icon: MdMap },
  { to: '/dashboard/tourist/bookings', label: 'My Bookings', icon: MdPermContactCalendar },
  { to: '/dashboard/tourist/fleetbookings', label: 'Fleet Bookings', icon: MdLocalTaxi },
  { to: '/dashboard/tourist/reviews', label: 'Reviews', icon: MdStar },
  { to: '/dashboard/tourist/notifications', label: 'Notifications', icon: MdNotifications },
  { to: '/dashboard/tourist/support', label: 'Support', icon: MdHelp },
];

export default function TouristSidebar({ open, onClose }) {
  const navigate = useNavigate();
  const [touristName, setTouristName] = useState('Tourist');
  const [photoUrl, setPhotoUrl] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    // 1. Try to get basic name from token payload initially for speed
    try {
      const token = localStorage.getItem('waygo_token');
      if (token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        if (payload.name) setTouristName(payload.name);
      }
    } catch {
      // ignore
    }

    // 2. Fetch fresh profile for latest name and email to hash photo
    touristAPI.getProfile().then(profile => {
      setTouristName(profile.name || 'Tourist');
      if (profile.email) {
        const hash = md5(profile.email.trim().toLowerCase());
        setPhotoUrl(`https://www.gravatar.com/avatar/${hash}?d=identicon&s=150`);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchUnreadNotifications = async () => {
      try {
        const items = await touristAPI.getNotifications();
        const unread = (Array.isArray(items) ? items : []).filter((item) => !item.isRead).length;
        if (mounted) {
          setUnreadNotifications(unread);
        }
      } catch {
        if (mounted) {
          setUnreadNotifications(0);
        }
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadNotifications();
      }
    };

    fetchUnreadNotifications();
    const interval = window.setInterval(fetchUnreadNotifications, 15000);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
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
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-stone-900/40 z-20 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 z-30 flex flex-col font-sans
          bg-gradient-to-b from-[#0f4a61] via-[#13607a] to-[#0f4f66]
          border-r border-cyan-300/45 shadow-[0_30px_80px_-50px_rgba(6,182,212,0.55)]
          transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between px-6 h-20 border-b border-cyan-200/35 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-cyan-300 via-sky-200 to-teal-200 rounded-2xl flex items-center justify-center font-bold text-cyan-950 text-xl shadow-lg">
              W
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none tracking-tight">WayGo</p>
              <p className="text-cyan-50 text-xs font-semibold mt-0.5 uppercase tracking-[0.2em]">
                Tourist
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-cyan-50 hover:text-white hover:bg-cyan-800/50 rounded-lg transition-colors shrink-0"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-4 text-[11px] font-semibold text-cyan-50 uppercase tracking-[0.3em]">
            Main Menu
          </div>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 group
                 ${isActive
                   ? 'bg-cyan-100/25 text-white border border-cyan-100/45 shadow-[0_8px_30px_-18px_rgba(125,211,252,0.7)]'
                   : 'text-cyan-50/95 hover:bg-cyan-100/15 hover:text-white border border-transparent'
                 }`
              }
            >
              <Icon className="text-xl transition-colors" />
              <span className="tracking-wide relative top-[1px] flex-1">{label}</span>
              {to === '/dashboard/tourist/notifications' && unreadNotifications > 0 && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                </span>
              )}
              {to === '/dashboard/tourist/notifications' && unreadNotifications > 0 && (
                <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile & Logout Section */}
        <div className="p-4 border-t border-cyan-200/35 bg-cyan-900/10">
          <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-cyan-100/15 border border-cyan-100/30 mb-3 cursor-pointer">
            {photoUrl ? (
              <img src={photoUrl} alt={touristName} className="w-10 h-10 rounded-full border-2 border-cyan-500/30 shadow-md object-cover flex-shrink-0 bg-white" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-300 to-teal-200 flex items-center justify-center text-cyan-950 font-bold text-sm flex-shrink-0">
                {touristName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-semibold truncate">{touristName}</p>
              <p className="text-cyan-50/85 text-xs truncate">Premium Member</p>
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
