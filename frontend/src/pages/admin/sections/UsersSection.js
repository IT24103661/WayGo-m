import { useState } from 'react';
import { MdPersonAdd, MdMoreVert } from 'react-icons/md';
import { ROLE_COLOR } from './shared';

const ALL_USERS = [
  { name: 'Amal Perera',        email: 'amal@email.com',    role: 'Tourist',      phone: '077-111-2233', joined: 'Jan 5, 2026'  },
  { name: 'Ruwan Dissanayake',  email: 'ruwan@email.com',   role: 'Driver',        phone: '071-445-6677', joined: 'Jan 12, 2026' },
  { name: 'Lalith Silva',       email: 'lalith@email.com',  role: 'TourManager',   phone: '075-998-0011', joined: 'Feb 2, 2026'  },
  { name: 'Priya Mendis',       email: 'priya@email.com',   role: 'Tourist',       phone: '077-334-5566', joined: 'Feb 14, 2026' },
  { name: 'Suresh Bandara',     email: 'suresh@email.com',  role: 'FleetManager',  phone: '070-223-4455', joined: 'Mar 1, 2026'  },
  { name: 'Sara Fernando',      email: 'sara@email.com',    role: 'Tourist',       phone: '077-556-7788', joined: 'Mar 5, 2026'  },
];

export default function UsersSection() {
  const [search, setSearch] = useState('');
  const filtered = ALL_USERS.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white/85 backdrop-blur-sm rounded-3xl shadow-[0_20px_45px_-30px_rgba(30,64,175,0.22)] border border-white/70 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900">
          All Users <span className="text-slate-500 font-normal text-sm">({filtered.length})</span>
        </h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
          />
          <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl font-medium transition-colors">
            <MdPersonAdd className="text-base" /> Add User
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80 text-left text-xs text-slate-600 uppercase tracking-wider">
              {['Name','Email','Role','Phone','Joined',''].map((h, i) => (
                <th key={i} className="px-6 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((u) => (
              <tr key={u.email} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="font-medium text-slate-900">{u.name}</span>
                  </div>
                </td>
                <td className="px-6 py-3 text-slate-600">{u.email}</td>
                <td className="px-6 py-3">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${ROLE_COLOR[u.role] || 'bg-gray-100 text-slate-700'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-3 text-slate-600">{u.phone}</td>
                <td className="px-6 py-3 text-slate-500 text-xs">{u.joined}</td>
                <td className="px-6 py-3 text-center">
                  <button className="text-slate-500 hover:text-slate-700 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                    <MdMoreVert />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
