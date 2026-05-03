import { MdPeople, MdBookOnline, MdDirectionsBus, MdMap, MdArrowUpward, MdArrowDownward } from 'react-icons/md';
import { Badge, ROLE_COLOR } from './shared';

/* ── Stat card ── */
function StatCard({ icon: Icon, label, value, change, up, color }) {
  return (
    <div className="bg-white/85 backdrop-blur-sm rounded-3xl shadow-[0_20px_45px_-30px_rgba(30,64,175,0.22)] border border-white/70 p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="text-white text-2xl" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-600 font-medium">{label}</p>
        <p className="text-3xl font-bold text-slate-900 mt-0.5">{value}</p>
        <p className={`text-xs mt-1 flex items-center gap-0.5 font-medium ${up ? 'text-emerald-600' : 'text-red-500'}`}>
          {up ? <MdArrowUpward /> : <MdArrowDownward />}
          {change} this month
        </p>
      </div>
    </div>
  );
}

const RECENT_BOOKINGS = [
  { id: '#BK-0041', tourist: 'Amal Perera',         type: 'Tour', destination: 'Sigiriya Rock',   status: 'Completed', amount: 'LKR 12,500' },
  { id: '#BK-0042', tourist: 'Nimal Silva',          type: 'Taxi', destination: 'CMB → Kandy',     status: 'En Route',  amount: 'LKR 4,200'  },
  { id: '#BK-0043', tourist: 'Sara Fernando',        type: 'Tour', destination: 'Yala Safari',     status: 'Pending',   amount: 'LKR 18,000' },
  { id: '#BK-0044', tourist: 'Kamal Jayawardena',    type: 'Taxi', destination: 'BIA → Colombo',   status: 'Accepted',  amount: 'LKR 3,800'  },
  { id: '#BK-0045', tourist: 'Emma Thompson',        type: 'Tour', destination: 'Ella Train Ride', status: 'Cancelled', amount: 'LKR 9,000'  },
];

const RECENT_USERS = [
  { name: 'Kamal Suresh',      role: 'Tourist',      joined: '2 hrs ago',  avatar: 'KS' },
  { name: 'Ruwan Dissanayake', role: 'Driver',        joined: '5 hrs ago',  avatar: 'RD' },
  { name: 'Lalith Silva',      role: 'TourManager',   joined: '1 day ago',  avatar: 'LS' },
  { name: 'Priya Mendis',      role: 'Tourist',       joined: '1 day ago',  avatar: 'PM' },
];

export default function Overview() {
  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={MdPeople}        label="Total Users"  value="1,284" change="+48" up color="bg-blue-600" />
        <StatCard icon={MdBookOnline}    label="Bookings"     value="342"   change="+23" up color="bg-emerald-500" />
        <StatCard icon={MdDirectionsBus} label="Vehicles"     value="58"    change="-2"  up={false} color="bg-orange-500" />
        <StatCard icon={MdMap}           label="Active Tours" value="19"    change="+5"  up color="bg-purple-500" />
      </div>

      {/* Revenue chart + New users */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Bar chart mock */}
        <div className="xl:col-span-2 bg-white/85 backdrop-blur-sm rounded-3xl shadow-[0_20px_45px_-30px_rgba(30,64,175,0.22)] border border-white/70 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Revenue Overview</h2>
              <p className="text-xs text-slate-500">March 2026</p>
            </div>
            <select className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
          <div className="flex items-end gap-2 h-36">
            {[65, 80, 55, 90, 70, 95, 75].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-500"
                  style={{ height: `${h}%` }}
                />
                <span className="text-xs text-slate-500">{['M','T','W','T','F','S','S'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* New users */}
        <div className="bg-white/85 backdrop-blur-sm rounded-3xl shadow-[0_20px_45px_-30px_rgba(30,64,175,0.22)] border border-white/70 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">New Users</h2>
            <button className="text-xs text-blue-600 hover:underline font-medium">View all</button>
          </div>
          <div className="space-y-3">
            {RECENT_USERS.map((u) => (
              <div key={u.name} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {u.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.joined}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${ROLE_COLOR[u.role] || 'bg-gray-100 text-slate-700'}`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="bg-white/85 backdrop-blur-sm rounded-3xl shadow-[0_20px_45px_-30px_rgba(30,64,175,0.22)] border border-white/70 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Recent Bookings</h2>
          <button className="text-xs text-blue-600 hover:underline font-medium">View all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-left text-xs text-slate-600 uppercase tracking-wider">
                {['ID','Tourist','Type','Destination','Status','Amount'].map(h => (
                  <th key={h} className={`px-6 py-3 font-semibold ${h === 'Amount' ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {RECENT_BOOKINGS.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">{b.id}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{b.tourist}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${b.type === 'Tour' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {b.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{b.destination}</td>
                  <td className="px-6 py-4"><Badge status={b.status} /></td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-900">{b.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
