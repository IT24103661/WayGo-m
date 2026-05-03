import { MdMenu, MdNotificationsNone, MdSearch } from 'react-icons/md';

export default function TourManagerTopBar({ title, subtitle, onMenuClick }) {
  return (
    <header className="wg-mobile-topbar sticky top-0 z-10 px-3 sm:px-6 flex-shrink-0">
      <div className="h-16 bg-white/90 backdrop-blur-md border border-cyan-100 rounded-2xl shadow-[0_20px_50px_-40px_rgba(8,145,178,0.4)] px-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-cyan-700 hover:bg-cyan-100 hover:text-cyan-900 transition-colors"
          >
            <MdMenu className="text-2xl" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-cyan-950 leading-tight">{title}</h1>
            {subtitle && <p className="text-xs sm:text-sm text-cyan-700/80">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden md:flex items-center px-4 py-2 bg-cyan-50 rounded-full w-64 border border-cyan-200 focus-within:border-cyan-400 focus-within:bg-white transition-all">
            <MdSearch className="text-cyan-500 text-xl mr-2" />
            <input
              type="text"
              placeholder="Search tours..."
              className="bg-transparent border-none outline-none text-sm w-full text-cyan-900 placeholder-cyan-400/80"
            />
          </div>

          <button className="relative p-2.5 rounded-full text-cyan-700 hover:bg-cyan-100 hover:text-cyan-900 transition-colors">
            <MdNotificationsNone className="text-xl" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
