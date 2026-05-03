import { useCallback, useEffect, useMemo, useState } from 'react';
import { MdDelete, MdPersonAdd, MdEdit, MdBlock, MdCheckCircle, MdClose, MdSearch } from 'react-icons/md';
import { adminAPI } from '../../../services/adminAPI';

const ROLES = ['TourManager', 'FleetManager'];
const ROLE_LABEL = { TourManager: 'Tour Managers', FleetManager: 'Driver Managers' };

/* ── Add / Edit modal ── */
function StaffModal({ mode, initial, role, saving, existing = [], onSave, onClose }) {
  const [form, setForm] = useState(
    initial || { name: '', email: '', phone: '', status: 'Active', password: '' }
  );
  const [errors, setErrors] = useState({});

  const change = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setForm((p) => ({ ...p, [name]: nextValue }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = () => {
    const nextErrors = {};
    const name = String(form.name || '').trim();
    const email = String(form.email || '').trim().toLowerCase();
    const phone = String(form.phone || '').trim();
    const status = String(form.status || '').trim();

    if (!name) {
      nextErrors.name = 'Name is required.';
    } else if (name.length < 3 || name.length > 60) {
      nextErrors.name = 'Name must be between 3 and 60 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      nextErrors.email = 'Email is required.';
    } else if (!emailRegex.test(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!phone) {
      nextErrors.phone = 'Phone is required.';
    } else if (!/^\d{10}$/.test(phone)) {
      nextErrors.phone = 'Phone number must contain exactly 10 digits (numbers only).';
    }

    if (!['Active', 'Inactive'].includes(status)) {
      nextErrors.status = 'Status must be Active or Inactive.';
    }

    const normalizedCurrentId = String(initial?._id || '');
    const duplicate = existing.some((member) => (
      String(member.email || '').trim().toLowerCase() === email
      && String(member._id || '') !== normalizedCurrentId
    ));
    if (!nextErrors.email && duplicate) {
      nextErrors.email = 'Another staff member already uses this email.';
    }

    if (mode === 'add' && String(form.password || '').length < 8) {
      nextErrors.password = 'Temporary password must be at least 8 characters.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">{mode === 'add' ? `Add ${ROLE_LABEL[role].replace('s', '')}` : 'Edit Staff Member'}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 p-1 rounded-lg hover:bg-gray-100">
            <MdClose className="text-xl" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {[
            { label: 'Full Name',     name: 'name',  type: 'text',  placeholder: 'e.g. Lalith Silva'       },
            { label: 'Email',         name: 'email', type: 'email', placeholder: 'e.g. lalith@waygo.lk'    },
            { label: 'Phone Number',  name: 'phone', type: 'text',  placeholder: 'e.g. 077-xxx-xxxx'       },
          ].map(({ label, name, type, placeholder }) => (
            <div key={name}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
              <input
                name={name} type={type} value={form[name]} onChange={change}
                placeholder={placeholder}
                inputMode={name === 'phone' ? 'numeric' : undefined}
                pattern={name === 'phone' ? '[0-9]*' : undefined}
                maxLength={name === 'phone' ? 10 : undefined}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors[name] && <p className="text-xs text-rose-600 mt-1">{errors[name]}</p>}
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
            <select
              name="status" value={form.status} onChange={change}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
            {errors.status && <p className="text-xs text-rose-600 mt-1">{errors.status}</p>}
          </div>
          {mode === 'add' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Temporary Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={change}
                placeholder="At least 6 characters"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.password && <p className="text-xs text-rose-600 mt-1">{errors.password}</p>}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="text-sm px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50/80 transition-colors">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="text-sm px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : mode === 'add' ? 'Add Member' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Staff table for one role ── */
function StaffTable({ data, onEdit, onToggle, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50/80 text-left text-xs text-slate-600 uppercase tracking-wider">
            {['Name', 'Email', 'Phone', 'Joined', 'Status', 'Actions'].map((h) => (
              <th key={h} className="px-5 py-3 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((m) => (
            <tr key={m._id} className="hover:bg-slate-50/80 transition-colors">
              <td className="px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <span className="font-medium text-slate-900">{m.name}</span>
                </div>
              </td>
              <td className="px-5 py-3 text-slate-600">{m.email}</td>
              <td className="px-5 py-3 text-slate-600">{m.phone}</td>
              <td className="px-5 py-3 text-slate-500 text-xs">{new Date(m.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
              <td className="px-5 py-3">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.adminStatus === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-slate-600'}`}>
                  {m.adminStatus === 'Active' ? <MdCheckCircle className="text-xs" /> : <MdBlock className="text-xs" />}
                  {m.adminStatus}
                </span>
              </td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onEdit(m)}
                    className="flex items-center gap-1 text-xs border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg hover:bg-slate-50/80 transition-colors"
                  >
                    <MdEdit className="text-sm" /> Edit
                  </button>
                  <button
                    onClick={() => onToggle(m)}
                    className={`flex items-center gap-1 text-xs border px-2.5 py-1.5 rounded-lg transition-colors ${
                      m.adminStatus === 'Active'
                        ? 'border-red-200 text-red-500 hover:bg-red-50'
                        : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {m.adminStatus === 'Active' ? <><MdBlock className="text-sm" /> Deactivate</> : <><MdCheckCircle className="text-sm" /> Activate</>}
                  </button>
                  <button
                    onClick={() => onDelete(m)}
                    className="flex items-center gap-1 text-xs border border-rose-200 text-rose-600 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <MdDelete className="text-sm" /> Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500 text-sm">No staff members found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ── Main Section ── */
export default function StaffSection() {
  const [activeRole, setActiveRole] = useState('TourManager');
  const [staff, setStaff] = useState({ TourManager: [], FleetManager: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | { mode: 'add'|'edit', data?: member }

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [tourRes, fleetRes] = await Promise.all([
        adminAPI.getStaff({ role: 'TourManager', page: 1, limit: 100 }),
        adminAPI.getStaff({ role: 'FleetManager', page: 1, limit: 100 })
      ]);

      setStaff({
        TourManager: tourRes?.data || [],
        FleetManager: fleetRes?.data || []
      });
    } catch (err) {
      setError(err.message || 'Failed to load staff members.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return staff[activeRole];
    return staff[activeRole].filter((m) =>
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    );
  }, [activeRole, search, staff]);

  async function handleSave(form) {
    try {
      setSaving(true);
      setError('');
      setMessage('');

      if (modal.mode === 'add') {
        await adminAPI.createStaff({
          name: String(form.name || '').trim(),
          email: String(form.email || '').trim(),
          phone: String(form.phone || '').trim(),
          role: activeRole,
          status: form.status,
          password: String(form.password || '').trim()
        });
        setMessage('Staff member created successfully.');
      } else {
        await adminAPI.updateStaff(modal.data._id, {
          name: String(form.name || '').trim(),
          email: String(form.email || '').trim(),
          phone: String(form.phone || '').trim()
        });

        if (form.status !== modal.data.adminStatus) {
          await adminAPI.updateStaffStatus(modal.data._id, form.status);
        }
        setMessage('Staff member updated successfully.');
      }

      setModal(null);
      await loadStaff();
    } catch (err) {
      setError(err.message || 'Failed to save staff member.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(member) {
    try {
      setError('');
      setMessage('');
      const nextStatus = member.adminStatus === 'Active' ? 'Inactive' : 'Active';
      await adminAPI.updateStaffStatus(member._id, nextStatus);
      setMessage('Staff status updated successfully.');
      await loadStaff();
    } catch (err) {
      setError(err.message || 'Failed to update staff status.');
    }
  }

  async function handleDelete(member) {
    const ok = window.confirm(`Delete ${member.name}? This action cannot be undone.`);
    if (!ok) return;

    try {
      setError('');
      setMessage('');
      await adminAPI.deleteStaff(member._id);
      setMessage('Staff member deleted successfully.');
      await loadStaff();
    } catch (err) {
      setError(err.message || 'Failed to delete staff member.');
    }
  }

  return (
    <div className="space-y-4 wg-admin-motion wg-motion-staff">
      <div className="relative overflow-hidden rounded-3xl border border-cyan-100 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 px-6 py-5 text-white shadow-[0_26px_55px_-35px_rgba(8,145,178,0.75)]">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/15 blur-xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">People Ops</p>
        <h2 className="mt-1 text-xl font-bold">Staff Management Hub</h2>
        <p className="mt-1 text-sm text-cyan-100/95">Onboard, edit, and control operational staff access across teams.</p>
      </div>

      {modal && (
        <StaffModal
          mode={modal.mode}
          initial={modal.data ? {
            ...modal.data,
            status: modal.data.adminStatus
          } : null}
          role={activeRole}
          saving={saving}
          existing={staff[activeRole] || []}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white/85 backdrop-blur-sm rounded-3xl shadow-[0_20px_45px_-30px_rgba(30,64,175,0.22)] border border-white/70 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
          {/* Role tabs */}
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            {ROLES.map((role) => (
              <button
                key={role}
                onClick={() => { setActiveRole(role); setSearch(''); }}
                className={`px-5 py-2 text-sm font-medium transition-colors ${
                  activeRole === role ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-50/80'
                }`}
              >
                {ROLE_LABEL[role]}
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${activeRole === role ? 'bg-blue-500 text-white' : 'bg-gray-100 text-slate-600'}`}>
                  {staff[role]?.length || 0}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder={`Search ${ROLE_LABEL[activeRole]}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-sm border border-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
              />
            </div>
            <button
              onClick={() => setModal({ mode: 'add' })}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl font-medium transition-colors"
            >
              <MdPersonAdd className="text-base" /> Add {ROLE_LABEL[activeRole].replace('s', '')}
            </button>
          </div>
        </div>

        {error && <p className="px-6 pt-4 text-sm font-semibold text-rose-700">{error}</p>}
        {message && <p className="px-6 pt-4 text-sm font-semibold text-emerald-700">{message}</p>}
        {loading && <p className="px-6 pt-4 text-sm text-slate-600">Loading staff members...</p>}

        <StaffTable
          data={filtered}
          onEdit={(m) => setModal({ mode: 'edit', data: m })}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {ROLES.flatMap((role) => [
          { label: `Active ${ROLE_LABEL[role]}`,   value: (staff[role] || []).filter((m) => m.adminStatus === 'Active').length,   color: 'text-emerald-600 bg-emerald-50' },
          { label: `Inactive ${ROLE_LABEL[role]}`, value: (staff[role] || []).filter((m) => m.adminStatus === 'Inactive').length, color: 'text-red-500 bg-red-50' },
        ]).map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs text-slate-600">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color.split(' ')[0]}`}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
