import { MdMenu, MdNotificationsNone, MdSearch } from 'react-icons/md';

export default function DriverTopBar({ title, subtitle, onMenuClick }) {
  return (
    <header className="wg-mobile-topbar sticky top-0 z-20 px-3 sm:px-6">
      <div className="flex items-center justify-between bg-white/90 backdrop-blur-md border border-cyan-100 rounded-2xl px-5 h-16 shadow-[0_20px_50px_-40px_rgba(8,145,178,0.4)]">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-cyan-600 hover:bg-cyan-100 hover:text-cyan-800 transition-colors"
          >
            <MdMenu className="text-2xl" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-cyan-950 leading-tight tracking-tight">{title}</h1>
            {subtitle && <p className="text-xs sm:text-sm text-cyan-700/80 font-medium">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden md:flex items-center px-4 py-2 bg-cyan-50 rounded-full w-64 border border-cyan-200 focus-within:border-cyan-400 focus-within:bg-white transition-all shadow-inner overflow-hidden">
            <MdSearch className="text-cyan-500 text-xl mr-2" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-sm w-full text-cyan-900 placeholder-cyan-400/80 font-medium"
            />
          </div>

          <button className="relative p-2.5 rounded-full text-cyan-700 hover:bg-cyan-100 hover:text-cyan-900 transition-colors shadow-sm hover:shadow-md">
            <MdNotificationsNone className="text-xl" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
