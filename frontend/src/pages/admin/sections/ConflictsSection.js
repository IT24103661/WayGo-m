import { useCallback, useEffect, useMemo, useState } from 'react';
import { MdCheck, MdClose, MdBlock, MdUndo, MdWarning, MdSearch } from 'react-icons/md';
import { adminAPI } from '../../../services/adminAPI';

/* ─────────────────────────────────────────
   BAN USER MODAL
───────────────────────────────────────── */
function BanModal({ onConfirm, onClose, saving, existingBans = [], users = [] }) {
  const [form, setForm] = useState({ userId: '', reason: '' });
  const [errors, setErrors] = useState({ userId: '', reason: '' });

  const selectedUser = useMemo(
    () => users.find((item) => String(item._id) === String(form.userId)) || null,
    [users, form.userId]
  );

  const validate = () => {
    const nextErrors = { userId: '', reason: '' };
    const trimmedReason = form.reason.trim();

    if (!form.userId) {
      nextErrors.userId = 'Please select a user to ban.';
    }

    if (!trimmedReason) {
      nextErrors.reason = 'Reason is required.';
    } else if (trimmedReason.length < 8) {
      nextErrors.reason = 'Reason must be at least 8 characters.';
    } else if (trimmedReason.length > 250) {
      nextErrors.reason = 'Reason must be 250 characters or fewer.';
    }

    const hasActiveDuplicate = existingBans.some((item) => (
      item.active
      && String(item.user?._id || item.user || '') === String(form.userId)
    ));

    if (hasActiveDuplicate) {
      nextErrors.userId = 'An active ban already exists for this user.';
    }

    setErrors(nextErrors);
    return !nextErrors.userId && !nextErrors.reason;
  };

  const change = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 flex items-center gap-2"><MdBlock className="text-red-500" /> Ban User / Driver</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 p-1 rounded-lg hover:bg-gray-100"><MdClose className="text-xl" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">User</label>
            <select name="userId" value={form.userId} onChange={change}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
              <option value="">Select user...</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
            {errors.userId && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.userId}</p>}
            {selectedUser && (
              <p className="mt-1 text-xs text-slate-600">{selectedUser.email || '-'} {selectedUser.phone ? `| ${selectedUser.phone}` : ''}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Reason</label>
            <input name="reason" type="text" value={form.reason} onChange={change} placeholder="Brief reason for ban"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            {errors.reason && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.reason}</p>}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} disabled={saving} className="text-sm px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">Cancel</button>
          <button
            onClick={() => {
                if (!validate()) return;
              if (!selectedUser) return;
              onConfirm({
                userId: selectedUser._id,
                name: selectedUser.name,
                role: selectedUser.role,
                reason: form.reason.trim()
              });
            }}
              disabled={saving}
            className="text-sm px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Confirm Ban'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN SECTION
───────────────────────────────────────── */
export default function ConflictsSection() {
  const [refunds, setRefunds] = useState([]);
  const [bans, setBans] = useState([]);
  const [loadingRefunds, setLoadingRefunds] = useState(false);
  const [loadingBans, setLoadingBans] = useState(false);
  const [savingBan, setSavingBan] = useState(false);
  const [actingRefundId, setActingRefundId] = useState('');
  const [actingBanId, setActingBanId] = useState('');
  const [refundStatusFilter, setRefundStatusFilter] = useState('All');
  const [showBanModal, setShowBanModal] = useState(false);
  const [banSearch, setBanSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const askDecisionNote = (status) => {
    const note = window.prompt(`Optional decision note for ${status}:`, '') ?? '';
    const trimmed = note.trim();
    if (trimmed.length > 250) {
      setError('Decision note must be 250 characters or fewer.');
      return null;
    }
    return trimmed;
  };

  const fetchRefunds = useCallback(async () => {
    try {
      setLoadingRefunds(true);
      const res = await adminAPI.getRefundRequests(refundStatusFilter === 'All' ? '' : refundStatusFilter);
      setRefunds(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load refund requests.');
    } finally {
      setLoadingRefunds(false);
    }
  }, [refundStatusFilter]);

  const fetchBans = useCallback(async () => {
    try {
      setLoadingBans(true);
      const res = await adminAPI.getBans('');
      setBans(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load bans.');
    } finally {
      setLoadingBans(false);
    }
  }, []);

  const fetchConflictUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const res = await adminAPI.getConflictUsers({});
      setUsers(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  useEffect(() => {
    fetchBans();
  }, [fetchBans]);

  useEffect(() => {
    fetchConflictUsers();
  }, [fetchConflictUsers]);

  const processRefund = async (id, nextStatus) => {
    try {
      const decisionNote = askDecisionNote(nextStatus);
      if (decisionNote === null) return;
      if (nextStatus === 'Rejected' && decisionNote.length < 8) {
        setError('Please provide at least 8 characters in the rejection note.');
        return;
      }

      setActingRefundId(id);
      setError('');
      setMessage('');
      await adminAPI.updateRefundRequest(id, { status: nextStatus, decisionNote });
      setRefunds((prev) => prev.map((r) => (r._id === id ? { ...r, status: nextStatus } : r)));
      setMessage(`Refund ${nextStatus.toLowerCase()} successfully.`);
    } catch (err) {
      setError(err.message || 'Failed to update refund request.');
    } finally {
      setActingRefundId('');
    }
  };

  const addBan = async (form) => {
    try {
      setSavingBan(true);
      setError('');
      setMessage('');
      const res = await adminAPI.createBan(form);
      if (res?.data) {
        setBans((prev) => [res.data, ...prev]);
      }
      setShowBanModal(false);
      setMessage('Ban created successfully.');
    } catch (err) {
      setError(err.message || 'Failed to create ban.');
    } finally {
      setSavingBan(false);
    }
  };

  const toggleBan = async (ban) => {
    try {
      setActingBanId(ban._id);
      setError('');
      setMessage('');
      await adminAPI.updateBan(ban._id, { active: !ban.active });
      setBans((prev) => prev.map((b) => (b._id === ban._id ? { ...b, active: !b.active } : b)));
      setMessage(ban.active ? 'Ban lifted successfully.' : 'Ban re-activated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update ban status.');
    } finally {
      setActingBanId('');
    }
  };

  const REFUND_STATUS = {
    Pending:  'bg-yellow-100 text-yellow-700',
    Approved: 'bg-emerald-100 text-emerald-700',
    Rejected: 'bg-red-100 text-red-600',
  };

  const filteredBans = useMemo(() => bans.filter((b) => {
    const q = banSearch.toLowerCase().trim();
    if (!q) return true;
    return String(b.name || '').toLowerCase().includes(q)
      || String(b.reason || '').toLowerCase().includes(q)
      || String(b.role || '').toLowerCase().includes(q);
  }), [bans, banSearch]);

  return (
    <div className="space-y-6 wg-admin-motion wg-motion-conflicts">
      <div className="relative overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-r from-rose-600 via-red-600 to-orange-500 px-6 py-5 text-white shadow-[0_26px_55px_-35px_rgba(225,29,72,0.75)]">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/15 blur-xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-100">Risk Desk</p>
        <h2 className="mt-1 text-xl font-bold">Conflict Resolution Center</h2>
        <p className="mt-1 text-sm text-rose-100/95">Handle refunds, enforce bans, and document sensitive administrative actions.</p>
      </div>

      {showBanModal && <BanModal onConfirm={addBan} onClose={() => setShowBanModal(false)} saving={savingBan} existingBans={bans} users={users} />}

      {/* ── Alert banner ── */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
        <MdWarning className="text-lg flex-shrink-0 mt-0.5 text-amber-500" />
        <p>Actions in this section are <strong>irreversible or high-impact</strong>. Use with caution. All actions are logged.</p>
      </div>

      {/* ── Refund Requests ── */}
      <div className="bg-white/85 backdrop-blur-sm rounded-3xl shadow-[0_20px_45px_-30px_rgba(30,64,175,0.22)] border border-white/70 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Refund Requests</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {refunds.filter((r) => r.status === 'Pending').length} pending review
            </p>
          </div>
          <div className="flex gap-2 text-xs items-center">
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full font-semibold">
              {refunds.filter((r) => r.status === 'Pending').length} Pending
            </span>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-semibold">
              {refunds.filter((r) => r.status === 'Approved').length} Approved
            </span>
            <select
              value={refundStatusFilter}
              onChange={(e) => setRefundStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white"
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-left text-xs text-slate-600 uppercase tracking-wider">
                {['ID','Tourist','Booking','Amount','Reason','Date','Status','Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingRefunds && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500 text-sm">Loading refund requests...</td>
                </tr>
              )}
              {!loadingRefunds && refunds.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500 text-sm">No refund requests found.</td>
                </tr>
              )}
              {!loadingRefunds && refunds.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{String(r._id).slice(-6).toUpperCase()}</td>
                  <td className="px-5 py-3 font-medium text-slate-900">{r.tourist?.name || '-'}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">{r.booking?.bookingType || '-'}</td>
                  <td className="px-5 py-3 font-semibold text-slate-900">LKR {Number(r.amount || 0).toLocaleString()}</td>
                  <td className="px-5 py-3 text-slate-600 max-w-[200px] truncate">{r.reason}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${REFUND_STATUS[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {r.status === 'Pending' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => processRefund(r._id, 'Approved')}
                          disabled={actingRefundId === r._id}
                          className="flex items-center gap-1 text-xs border border-emerald-200 text-emerald-600 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <MdCheck className="text-sm" /> Approve
                        </button>
                        <button
                          onClick={() => processRefund(r._id, 'Rejected')}
                          disabled={actingRefundId === r._id}
                          className="flex items-center gap-1 text-xs border border-red-200 text-red-500 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <MdClose className="text-sm" /> Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Banned Users ── */}
      <div className="bg-white/85 backdrop-blur-sm rounded-3xl shadow-[0_20px_45px_-30px_rgba(30,64,175,0.22)] border border-white/70 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Banned Accounts</h2>
            <p className="text-xs text-slate-500 mt-0.5">{bans.filter((b) => b.active).length} active bans</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search bans..."
                value={banSearch}
                onChange={(e) => setBanSearch(e.target.value)}
                className="text-sm border border-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 w-44"
              />
            </div>
            <button
              disabled={loadingUsers || users.length === 0}
              onClick={() => setShowBanModal(true)}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <MdBlock className="text-base" /> Ban User
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-left text-xs text-slate-600 uppercase tracking-wider">
                {['ID','Name','Role','Reason','Banned On','Status','Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingBans && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500 text-sm">Loading bans...</td></tr>
              )}
              {filteredBans.map((b) => (
                <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{String(b._id).slice(-6).toUpperCase()}</td>
                  <td className="px-5 py-3 font-medium text-slate-900">{b.name}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${b.role === 'Driver' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {b.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600 max-w-[180px] truncate">{b.reason}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{new Date(b.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${b.active ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-slate-600'}`}>
                      {b.active ? 'Banned' : 'Lifted'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleBan(b)}
                      disabled={actingBanId === b._id}
                      className={`flex items-center gap-1 text-xs border px-2.5 py-1.5 rounded-lg transition-colors ${
                        b.active
                          ? 'border-slate-200 text-slate-700 hover:bg-slate-50/80'
                          : 'border-red-200 text-red-500 hover:bg-red-50'
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {b.active ? <><MdUndo className="text-sm" /> Lift Ban</> : <><MdBlock className="text-sm" /> Re-ban</>}
                    </button>
                  </td>
                </tr>
              ))}
              {!loadingBans && filteredBans.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500 text-sm">No banned accounts found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {message && <p className="text-sm text-emerald-700 font-semibold">{message}</p>}
      {error && <p className="text-sm text-rose-700 font-semibold">{error}</p>}
    </div>
  );
}
