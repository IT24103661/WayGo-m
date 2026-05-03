import {
  MdMenu,
  MdDashboard,
  MdDirectionsCar,
  MdLocalShipping,
  MdAssignment,
  MdBuild,
  MdNotifications,
  MdPayments,
  MdPeople,
  MdPerson
} from 'react-icons/md';

const TAB_STYLES = {
  overview: {
    icon: MdDashboard,
    chip: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    dot: 'bg-cyan-500'
  },
  inventory: {
    icon: MdDirectionsCar,
    chip: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    dot: 'bg-cyan-500'
  },
  available: {
    icon: MdLocalShipping,
    chip: 'bg-sky-50 text-sky-800 border-sky-200',
    dot: 'bg-sky-500'
  },
  fleetbookings: {
    icon: MdAssignment,
    chip: 'bg-teal-50 text-teal-800 border-teal-200',
    dot: 'bg-teal-500'
  },
  service: {
    icon: MdBuild,
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500'
  },
  notifications: {
    icon: MdNotifications,
    chip: 'bg-cyan-50 text-cyan-900 border-cyan-200',
    dot: 'bg-cyan-600'
  },
  drivers: {
    icon: MdPeople,
    chip: 'bg-sky-50 text-sky-800 border-sky-200',
    dot: 'bg-sky-500'
  },
  salaries: {
    icon: MdPayments,
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500'
  },
  profile: {
    icon: MdPerson,
    chip: 'bg-sky-50 text-sky-800 border-sky-200',
    dot: 'bg-sky-500'
  }
};

export default function FleetManagerTopBar({ title, subtitle, onMenuClick, segment = 'overview' }) {
  const tabStyle = TAB_STYLES[segment] || TAB_STYLES.overview;
  const SegmentIcon = tabStyle.icon;

  return (
    <header className="sticky top-0 z-10 px-6 pt-5 flex-shrink-0">
      <div className="h-16 bg-white/90 backdrop-blur-md border border-cyan-100 rounded-2xl shadow-[0_20px_50px_-40px_rgba(8,145,178,0.4)] px-5 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-cyan-700 hover:bg-cyan-100 hover:text-cyan-900 transition-colors"
        >
          <MdMenu className="text-xl" />
        </button>
        <span className={`hidden sm:inline-flex w-8 h-8 rounded-lg items-center justify-center ${tabStyle.chip} border`}>
          <SegmentIcon className="text-lg" />
        </span>
        <div className="min-w-0">
          <h1 className="text-base font-bold text-cyan-950 leading-none truncate">{title}</h1>
          {subtitle && <p className="text-xs text-cyan-700/80 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold border ${tabStyle.chip}`}>
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse inline-block ${tabStyle.dot}`} />
          {segment.charAt(0).toUpperCase() + segment.slice(1)} Live
        </span>
      </div>
      </div>
    </header>
  );
}
