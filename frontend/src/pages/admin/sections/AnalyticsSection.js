import { MdAttachMoney, MdPeople, MdDirectionsBus, MdTrendingUp, MdTrendingDown, MdCircle } from 'react-icons/md';
import { FaTaxi, FaMapMarkedAlt } from 'react-icons/fa';

/* ── Metric card ── */
function MetricCard({ icon: Icon, label, value, sub, trend, trendUp, iconBg }) {
  return (
    <div className="bg-white/85 backdrop-blur-sm rounded-3xl shadow-[0_20px_45px_-30px_rgba(30,64,175,0.22)] border border-white/70 p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className="text-white text-xl" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-600 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5 leading-tight">{value}</p>
        {trend && (
          <p className={`text-xs mt-1 flex items-center gap-0.5 font-medium ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
            {trendUp ? <MdTrendingUp /> : <MdTrendingDown />} {trend}
          </p>
        )}
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Health indicator ── */
function HealthRow({ service, status, latency, uptime }) {
  const ok = status === 'Operational';
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2.5">
        <MdCircle className={`text-xs ${ok ? 'text-emerald-500' : 'text-red-500'}`} />
        <span className="text-sm font-medium text-slate-800">{service}</span>
      </div>
      <div className="flex items-center gap-6 text-xs text-slate-500">
        <span>{latency}</span>
        <span>{uptime} uptime</span>
        <span className={`px-2 py-0.5 rounded-full font-semibold ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
          {status}
        </span>
      </div>
    </div>
  );
}

const MONTHLY_REVENUE = [
  { month: 'Oct', taxi: 42, tour: 58 },
  { month: 'Nov', taxi: 55, tour: 65 },
  { month: 'Dec', taxi: 70, tour: 85 },
  { month: 'Jan', taxi: 60, tour: 72 },
  { month: 'Feb', taxi: 75, tour: 90 },
  { month: 'Mar', taxi: 88, tour: 95 },
];

const HEALTH_SERVICES = [
  { service: 'API Server',        status: 'Operational', latency: '42 ms',  uptime: '99.98%' },
  { service: 'MongoDB Atlas',     status: 'Operational', latency: '18 ms',  uptime: '99.95%' },
  { service: 'Auth Service',      status: 'Operational', latency: '31 ms',  uptime: '100%'   },
  { service: 'Payment Gateway',   status: 'Degraded',    latency: '210 ms', uptime: '98.12%' },
  { service: 'SMS Notifications', status: 'Operational', latency: '65 ms',  uptime: '99.80%' },
];

/* ── Top routes by bookings ── */
const TOP_ROUTES = [
  { route: 'CMB → Kandy',       count: 142, pct: 88 },
  { route: 'CMB → Galle',       count: 118, pct: 73 },
  { route: 'Kandy → Ella',      count: 96,  pct: 60 },
  { route: 'CMB → Sigiriya',    count: 78,  pct: 48 },
  { route: 'CMB → Negombo',     count: 54,  pct: 33 },
];

const MAX_BAR = 95; // just for visual scaling

export default function AnalyticsSection() {
  return (
    <div className="space-y-6 wg-admin-motion wg-motion-analytics">
      <div className="relative overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 px-6 py-5 text-white shadow-[0_26px_55px_-35px_rgba(139,92,246,0.75)]">
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/15 blur-xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-100">Data Observatory</p>
        <h2 className="mt-1 text-xl font-bold">System Analytics</h2>
        <p className="mt-1 text-sm text-violet-100/95">Track trends, route demand, service health, and performance momentum.</p>
      </div>

      {/* ── Top metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard icon={MdAttachMoney} label="Total Revenue (Mar)"    value="LKR 4.2M"  trend="+18% vs Feb" trendUp iconBg="bg-emerald-500" />
        <MetricCard icon={FaTaxi}        label="Taxi Revenue"            value="LKR 1.8M"  trend="+12% vs Feb" trendUp iconBg="bg-blue-500"    />
        <MetricCard icon={FaMapMarkedAlt}label="Tourism Revenue"         value="LKR 2.4M"  trend="+23% vs Feb" trendUp iconBg="bg-purple-500"  />
        <MetricCard icon={MdPeople}      label="Active Users (Today)"    value="284"       sub="of 1,284 registered"   iconBg="bg-orange-500"  />
      </div>

      {/* ── Secondary metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard icon={MdDirectionsBus} label="Active Vehicles"         value="41 / 58"  sub="70.7% fleet utilisation"    iconBg="bg-cyan-500"   />
        <MetricCard icon={MdTrendingUp}    label="Avg. Booking Value"       value="LKR 7,840" trend="+5% vs Feb" trendUp         iconBg="bg-indigo-500" />
        <MetricCard icon={MdAttachMoney}   label="Platform Commission (Mar)" value="LKR 420K"  sub="10% blended rate"          iconBg="bg-rose-500"   />
      </div>

      {/* ── Revenue chart + Top routes ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Grouped bar chart */}
        <div className="xl:col-span-2 bg-white/85 backdrop-blur-sm rounded-3xl shadow-[0_20px_45px_-30px_rgba(30,64,175,0.22)] border border-white/70 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Revenue Breakdown</h2>
              <p className="text-xs text-slate-500">Taxi vs Tourism — last 6 months (LKR ×100K)</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Taxi</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-purple-500 inline-block" /> Tourism</span>
            </div>
          </div>
          <div className="flex items-end gap-3 h-40">
            {MONTHLY_REVENUE.map(({ month, taxi, tour }) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end gap-0.5 justify-center" style={{ height: '128px' }}>
                  <div className="flex-1 rounded-t-md bg-blue-400 transition-all duration-500"    style={{ height: `${(taxi / MAX_BAR) * 100}%` }} />
                  <div className="flex-1 rounded-t-md bg-purple-400 transition-all duration-500"  style={{ height: `${(tour / MAX_BAR) * 100}%` }} />
                </div>
                <span className="text-xs text-slate-500">{month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top routes */}
        <div className="bg-white/85 backdrop-blur-sm rounded-3xl shadow-[0_20px_45px_-30px_rgba(30,64,175,0.22)] border border-white/70 p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">Top Taxi Routes</h2>
          <div className="space-y-3">
            {TOP_ROUTES.map(({ route, count, pct }) => (
              <div key={route}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-800 font-medium">{route}</span>
                  <span className="text-slate-500">{count}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── System health ── */}
      <div className="bg-white/85 backdrop-blur-sm rounded-3xl shadow-[0_20px_45px_-30px_rgba(30,64,175,0.22)] border border-white/70 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">System Health</h2>
            <p className="text-xs text-slate-500">Real-time service status</p>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block" />
            4 / 5 Operational
          </span>
        </div>
        {HEALTH_SERVICES.map((s) => <HealthRow key={s.service} {...s} />)}
      </div>
    </div>
  );
}
