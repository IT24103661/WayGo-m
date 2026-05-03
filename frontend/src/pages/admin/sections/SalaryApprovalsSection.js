import { useCallback, useEffect, useMemo, useState } from 'react';
import { MdDelete } from 'react-icons/md';
import { adminAPI } from '../../../services/adminAPI';

const ROLE_OPTIONS = ['Driver', 'TourManager', 'FleetManager'];

const INITIAL_RULES = {
  Driver: { baseSalary: 60000, performanceRate: 250, maxBonus: 25000 },
  TourManager: { baseSalary: 75000, performanceRate: 1000, maxBonus: 30000 },
  FleetManager: { baseSalary: 85000, performanceRate: 400, maxBonus: 20000 }
};

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

const asNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString();
};

const todayDateISO = () => new Date().toISOString().slice(0, 10);

const isPastDateValue = (value) => {
  if (!value) return false;
  return value < todayDateISO();
};

export default function SalaryApprovalsSection() {
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [salaryRules, setSalaryRules] = useState(INITIAL_RULES);
  const [staffByRole, setStaffByRole] = useState({ Driver: [], TourManager: [], FleetManager: [] });
  const [generation, setGeneration] = useState({
    role: 'Driver',
    employeeId: 'ALL',
    paymentDate: '',
    performanceValue: 0,
    performanceRate: INITIAL_RULES.Driver.performanceRate,
    bonus: 0,
    deductions: 0,
    notes: ''
  });
  const [reviewRows, setReviewRows] = useState([]);
  const [savingGenerated, setSavingGenerated] = useState(false);
  const [savingRowId, setSavingRowId] = useState('');
  const [editingReviewId, setEditingReviewId] = useState('');
  const [reviewDraft, setReviewDraft] = useState(null);
  const [savedRows, setSavedRows] = useState([]);
  const [loadingSavedRows, setLoadingSavedRows] = useState(false);
  const [updatingSalaryId, setUpdatingSalaryId] = useState('');
  const [salaryViewFilter, setSalaryViewFilter] = useState('Paid');

  const fetchRoleCandidates = useCallback(async (role) => {
    // Preferred source: dedicated salary candidate endpoint.
    try {
      const result = await adminAPI.getSalaryCandidates(role);
      const list = result?.data || [];
      if (list.length > 0) {
        return list.map((item) => ({ _id: item._id, name: item.name }));
      }
    } catch {
      // Fallbacks below keep UI functional with older backend deployments.
    }

    // Fallback for staff roles from existing admin staff endpoint.
    if (role === 'TourManager' || role === 'FleetManager') {
      try {
        const result = await adminAPI.getStaff({ role, page: 1, limit: 200 });
        return (result?.data || []).map((item) => ({ _id: item._id, name: item.name }));
      } catch {
        return [];
      }
    }

    // Fallback for drivers from existing salary rows (deduplicated).
    if (role === 'Driver') {
      try {
        const result = await adminAPI.getSalaryApprovals('');
        const seen = new Set();
        const drivers = [];
        (result?.data || []).forEach((row) => {
          const id = String(row?.driver?._id || '');
          const name = String(row?.driver?.name || '').trim();
          if (!id || !name || seen.has(id)) return;
          seen.add(id);
          drivers.push({ _id: id, name });
        });
        return drivers;
      } catch {
        return [];
      }
    }

    return [];
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      setLoadingStaff(true);
      const [drivers, tourManagers, fleetManagers] = await Promise.all([
        fetchRoleCandidates('Driver'),
        fetchRoleCandidates('TourManager'),
        fetchRoleCandidates('FleetManager')
      ]);

      setStaffByRole({
        Driver: drivers,
        TourManager: tourManagers,
        FleetManager: fleetManagers
      });
    } finally {
      setLoadingStaff(false);
    }
  }, [fetchRoleCandidates]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const fetchSavedRows = useCallback(async (filter = salaryViewFilter) => {
    try {
      setLoadingSavedRows(true);
      const status = filter === 'All' ? '' : filter;
      const result = await adminAPI.getSalaryApprovals(status);
      setSavedRows(result?.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load saved salary rows.');
    } finally {
      setLoadingSavedRows(false);
    }
  }, [salaryViewFilter]);

  useEffect(() => {
    fetchSavedRows(salaryViewFilter);
  }, [fetchSavedRows, salaryViewFilter]);

  const roleStaff = useMemo(() => staffByRole[generation.role] || [], [staffByRole, generation.role]);

  useEffect(() => {
    const loadRoleCandidatesIfMissing = async () => {
      if (roleStaff.length > 0) return;
      try {
        setLoadingStaff(true);
        const next = await fetchRoleCandidates(generation.role);
        setStaffByRole((prev) => ({ ...prev, [generation.role]: next }));
      } catch (err) {
        setError(err.message || `Failed to load ${generation.role} candidates.`);
      } finally {
        setLoadingStaff(false);
      }
    };

    loadRoleCandidatesIfMissing();
  }, [generation.role, roleStaff, fetchRoleCandidates]);

  useEffect(() => {
    if (generation.employeeId === 'ALL') return;
    const stillExists = roleStaff.some((person) => String(person._id) === String(generation.employeeId));
    if (!stillExists) {
      setGeneration((prev) => ({ ...prev, employeeId: 'ALL' }));
    }
  }, [generation.employeeId, roleStaff]);

  useEffect(() => {
    setGeneration((prev) => ({
      ...prev,
      performanceRate: salaryRules[generation.role]?.performanceRate || 0
    }));
  }, [generation.role, salaryRules]);

  const updateRule = (role, key, value) => {
    setSalaryRules((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [key]: asNumber(value, 0)
      }
    }));
  };

  const generateReviewRows = () => {
    if (isPastDateValue(generation.paymentDate)) {
      setError('Payment date cannot be in the past.');
      setMessage('');
      return;
    }

    const selectedRole = generation.role;
    const selectedRule = salaryRules[selectedRole];
    const targetMonth = generation.paymentDate ? generation.paymentDate.slice(0, 7) : getCurrentMonth();
    const candidates = generation.employeeId === 'ALL'
      ? roleStaff
      : roleStaff.filter((person) => String(person._id) === String(generation.employeeId));

    const nextRows = candidates.map((person) => {
      const baseSalary = asNumber(selectedRule.baseSalary);
      const performanceValue = asNumber(generation.performanceValue);
      const performanceRate = asNumber(generation.performanceRate, asNumber(selectedRule.performanceRate));
      const performancePay = performanceValue * performanceRate;
      const bonus = asNumber(generation.bonus);
      const deductions = asNumber(generation.deductions);
      const netSalary = baseSalary + performancePay + bonus - deductions;

      return {
        id: `${selectedRole}-${person._id}-${targetMonth}`,
        employeeId: person._id,
        employeeName: person.name,
        role: selectedRole,
        month: targetMonth,
        baseSalary,
        performanceValue,
        performanceRate,
        bonus,
        deductions,
        paymentDate: generation.paymentDate || '',
        notes: generation.notes,
        netSalary
      };
    });

    setReviewRows(nextRows);
    setMessage(nextRows.length ? 'Review table generated successfully.' : 'No employee found for selected role/filter.');
    setError('');
  };

  const removeReviewRow = (rowId) => {
    setReviewRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const startEditReviewRow = (row) => {
    setEditingReviewId(row.id);
    setReviewDraft({
      baseSalary: asNumber(row.baseSalary, 0),
      performanceValue: asNumber(row.performanceValue, 0),
      performanceRate: asNumber(row.performanceRate, 0),
      bonus: asNumber(row.bonus, 0),
      deductions: asNumber(row.deductions, 0)
    });
  };

  const cancelEditReviewRow = () => {
    setEditingReviewId('');
    setReviewDraft(null);
  };

  const saveEditReviewRow = () => {
    if (!reviewDraft || !editingReviewId) return;

    setReviewRows((prev) => prev.map((row) => {
      if (row.id !== editingReviewId) return row;

      const baseSalary = asNumber(reviewDraft.baseSalary, 0);
      const performanceValue = asNumber(reviewDraft.performanceValue, 0);
      const performanceRate = asNumber(reviewDraft.performanceRate, 0);
      const bonus = asNumber(reviewDraft.bonus, 0);
      const deductions = asNumber(reviewDraft.deductions, 0);
      const netSalary = baseSalary + (performanceValue * performanceRate) + bonus - deductions;

      return {
        ...row,
        baseSalary,
        performanceValue,
        performanceRate,
        bonus,
        deductions,
        netSalary
      };
    }));

    cancelEditReviewRow();
  };

  const saveGeneratedRows = async () => {
    if (!reviewRows.length) {
      setError('Generate review rows first before saving.');
      setMessage('');
      return;
    }

    try {
      setSavingGenerated(true);
      setError('');
      setMessage('');

      await adminAPI.createSalaryApprovals({
        rows: reviewRows.map((row) => ({
          employeeId: row.employeeId,
          role: row.role,
          month: row.month,
          baseSalary: asNumber(row.baseSalary),
          performanceValue: asNumber(row.performanceValue),
          performanceRate: asNumber(row.performanceRate),
          performancePay: asNumber(row.performanceValue) * asNumber(row.performanceRate),
          bonus: asNumber(row.bonus),
          deductions: asNumber(row.deductions),
          notes: row.notes || '',
          paymentStatus: 'Pending',
          paymentDate: row.paymentDate || undefined
        }))
      });

      setMessage('Generated rows saved successfully as Pending.');
      await fetchSavedRows('All');
    } catch (err) {
      setError(err.message || 'Failed to save generated salary rows.');
    } finally {
      setSavingGenerated(false);
    }
  };

  const saveSingleGeneratedRow = async (row) => {
    if (!row) return;
    try {
      setSavingRowId(row.id);
      setError('');
      setMessage('');

      await adminAPI.createSalaryApprovals({
        rows: [{
          employeeId: row.employeeId,
          role: row.role,
          month: row.month,
          baseSalary: asNumber(row.baseSalary),
          performanceValue: asNumber(row.performanceValue),
          performanceRate: asNumber(row.performanceRate),
          performancePay: asNumber(row.performanceValue) * asNumber(row.performanceRate),
          bonus: asNumber(row.bonus),
          deductions: asNumber(row.deductions),
          notes: row.notes || '',
          paymentStatus: 'Pending',
          paymentDate: row.paymentDate || undefined
        }]
      });

      setMessage(`Saved ${row.employeeName} (${row.month}) as Pending.`);
      await fetchSavedRows('All');
    } catch (err) {
      setError(err.message || 'Failed to save salary row.');
    } finally {
      setSavingRowId('');
    }
  };

  const markSalaryAsPaid = async (salaryId) => {
    if (!salaryId) return;
    try {
      setUpdatingSalaryId(String(salaryId));
      setError('');
      setMessage('');

      const today = new Date().toISOString().slice(0, 10);
      await adminAPI.updateSalaryStatus(salaryId, {
        paymentStatus: 'Paid',
        paymentDate: today
      });

      setMessage('Salary marked as Paid successfully.');
      await fetchSavedRows(salaryViewFilter);
    } catch (err) {
      setError(err.message || 'Failed to mark salary as paid.');
    } finally {
      setUpdatingSalaryId('');
    }
  };

  const reviewTotals = useMemo(() => ({
    count: reviewRows.length,
    gross: reviewRows.reduce((sum, row) => sum + asNumber(row.netSalary), 0)
  }), [reviewRows]);

  return (
    <div className="space-y-6 wg-admin-motion wg-motion-salaries">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-5 text-white shadow-[0_26px_55px_-35px_rgba(5,150,105,0.75)]">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/15 blur-xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">Finance Control</p>
        <h2 className="mt-1 text-xl font-bold">Salary Approvals</h2>
        <p className="mt-1 text-sm text-emerald-100/95">Configure rules, generate salary review rows, and process final payout status updates.</p>
      </div>

      <div className="bg-white/85 backdrop-blur-sm border border-white/70 rounded-3xl shadow-[0_20px_45px_-30px_rgba(30,64,175,0.22)] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Salary Rule Setup</h3>
          <p className="text-sm text-slate-600 mt-1">Define base and performance rules by role.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-700 uppercase text-xs">
              <tr>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Base Salary</th>
                <th className="text-left px-4 py-3">Performance Rate</th>
                <th className="text-left px-4 py-3">Max Bonus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ROLE_OPTIONS.map((role) => (
                <tr key={role}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{role}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={salaryRules[role].baseSalary}
                      onChange={(e) => updateRule(role, 'baseSalary', e.target.value)}
                      className="w-36 border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={salaryRules[role].performanceRate}
                      onChange={(e) => updateRule(role, 'performanceRate', e.target.value)}
                      className="w-36 border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={salaryRules[role].maxBonus}
                      onChange={(e) => updateRule(role, 'maxBonus', e.target.value)}
                      className="w-36 border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white/85 backdrop-blur-sm border border-white/70 rounded-3xl shadow-[0_20px_45px_-30px_rgba(30,64,175,0.22)] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Payroll Generation Inputs</h3>
          <p className="text-sm text-slate-600 mt-1">Choose role, employee set, and payment date to build the review table.</p>
        </div>
        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase">Role</label>
            <select
              value={generation.role}
              onChange={(e) => setGeneration((prev) => ({ ...prev, role: e.target.value, employeeId: 'ALL' }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase">Employee</label>
            <select
              value={generation.employeeId}
              onChange={(e) => setGeneration((prev) => ({ ...prev, employeeId: e.target.value }))}
              disabled={loadingStaff}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="ALL">All in Role</option>
              {roleStaff.map((person) => <option key={person._id} value={person._id}>{person.name}</option>)}
            </select>
            {loadingStaff && (
              <p className="text-xs text-blue-700">Loading users for {generation.role}...</p>
            )}
            {!loadingStaff && roleStaff.length === 0 && (
              <p className="text-xs text-amber-700">No users found for {generation.role}.</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase">Payment Date</label>
            <input
              type="date"
              value={generation.paymentDate}
              min={todayDateISO()}
              onChange={(e) => setGeneration((prev) => ({ ...prev, paymentDate: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-slate-500">Month will be auto-detected as {generation.paymentDate ? generation.paymentDate.slice(0, 7) : getCurrentMonth()}.</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase">Perf. Value</label>
            <input
              type="number"
              value={generation.performanceValue}
              onChange={(e) => setGeneration((prev) => ({ ...prev, performanceValue: asNumber(e.target.value, 0) }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase">Perf. Rate</label>
            <input
              type="number"
              value={generation.performanceRate}
              onChange={(e) => setGeneration((prev) => ({ ...prev, performanceRate: asNumber(e.target.value, 0) }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase">Bonus</label>
            <input
              type="number"
              value={generation.bonus}
              onChange={(e) => setGeneration((prev) => ({ ...prev, bonus: asNumber(e.target.value, 0) }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase">Deductions</label>
            <input
              type="number"
              value={generation.deductions}
              onChange={(e) => setGeneration((prev) => ({ ...prev, deductions: asNumber(e.target.value, 0) }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase">Notes</label>
            <input
              type="text"
              value={generation.notes}
              onChange={(e) => setGeneration((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional note"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="px-6 pb-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={generateReviewRows}
            className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
          >
            Generate Review Table
          </button>
          <button
            type="button"
            onClick={() => setReviewRows([])}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100"
          >
            Clear Review Table
          </button>
          <button
            type="button"
            onClick={saveGeneratedRows}
            disabled={savingGenerated}
            className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {savingGenerated ? 'Saving...' : 'Save Generated as Pending'}
          </button>
          {loadingStaff && <span className="text-xs text-slate-500">Loading staff candidates...</span>}
          <span className="text-xs text-slate-500">Generated rows: {reviewTotals.count}</span>
          <span className="text-xs text-slate-500">Total Net: LKR {reviewTotals.gross.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-white/85 backdrop-blur-sm border border-white/70 rounded-3xl shadow-[0_20px_45px_-30px_rgba(30,64,175,0.22)] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Payroll Review Table</h3>
          <p className="text-sm text-slate-600 mt-1">Review and fine-tune salary components before final payout processing.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-700 uppercase text-xs">
              <tr>
                <th className="text-left px-4 py-3">Employee</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Month</th>
                <th className="text-left px-4 py-3">Base</th>
                <th className="text-left px-4 py-3">Perf. Value</th>
                <th className="text-left px-4 py-3">Perf. Rate</th>
                <th className="text-left px-4 py-3">Bonus</th>
                <th className="text-left px-4 py-3">Deductions</th>
                <th className="text-left px-4 py-3">Net Salary</th>
                <th className="text-left px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reviewRows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-4 text-slate-500">No review rows yet. Use generation inputs above.</td>
                </tr>
              )}
              {reviewRows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{row.employeeName}</td>
                  <td className="px-4 py-3 text-slate-700">{row.role}</td>
                  <td className="px-4 py-3 text-slate-700">{row.month}</td>
                  <td className="px-4 py-3 text-slate-700">{Number(row.baseSalary || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-700">{Number(row.performanceValue || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-700">{Number(row.performanceRate || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-700">{Number(row.bonus || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-700">{Number(row.deductions || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">LKR {asNumber(row.netSalary).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => saveSingleGeneratedRow(row)}
                        disabled={savingRowId === row.id}
                        className="rounded-lg border border-emerald-300 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {savingRowId === row.id ? 'Saving...' : 'Save Row'}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditReviewRow(row)}
                        className="rounded-lg border border-indigo-300 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeReviewRow(row.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        <MdDelete className="text-sm" />
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white/85 backdrop-blur-sm border border-white/70 rounded-3xl shadow-[0_20px_45px_-30px_rgba(30,64,175,0.22)] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Saved Salary Records</h3>
            <p className="text-sm text-slate-600 mt-1">Track salaries one by one and keep a clear list of paid salaries.</p>
          </div>
          <div className="flex items-center gap-2">
            {['Paid', 'Pending', 'All'].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setSalaryViewFilter(filter)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${
                  salaryViewFilter === filter
                    ? 'border-cyan-400 bg-cyan-50 text-cyan-700'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {filter}
              </button>
            ))}
            <button
              type="button"
              onClick={() => fetchSavedRows(salaryViewFilter)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-700 uppercase text-xs">
              <tr>
                <th className="text-left px-4 py-3">Employee</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Month</th>
                <th className="text-left px-4 py-3">Base</th>
                <th className="text-left px-4 py-3">Perf. Pay</th>
                <th className="text-left px-4 py-3">Bonus</th>
                <th className="text-left px-4 py-3">Deductions</th>
                <th className="text-left px-4 py-3">Net</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Paid At</th>
                <th className="text-left px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingSavedRows && (
                <tr>
                  <td colSpan={11} className="px-4 py-4 text-slate-500">Loading saved salaries...</td>
                </tr>
              )}
              {!loadingSavedRows && savedRows.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-4 text-slate-500">No salary records found for selected filter.</td>
                </tr>
              )}
              {!loadingSavedRows && savedRows.map((row) => {
                const isPaid = row.paymentStatus === 'Paid';
                const employeeName = row?.employee?.name || row?.driver?.name || 'Employee';
                const employeeRole = row?.employeeRole || row?.employee?.role || 'Driver';
                return (
                  <tr key={row._id}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{employeeName}</td>
                    <td className="px-4 py-3 text-slate-700">{employeeRole}</td>
                    <td className="px-4 py-3 text-slate-700">{row.month || '-'}</td>
                    <td className="px-4 py-3 text-slate-700">LKR {asNumber(row.baseSalary).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-700">LKR {asNumber(row.performancePay).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-700">LKR {asNumber(row.bonus).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-700">LKR {asNumber(row.deductions).toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">LKR {asNumber(row.netSalary).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {row.paymentStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatDateTime(row.paidAt || row.paymentDate)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => markSalaryAsPaid(row._id)}
                        disabled={isPaid || updatingSalaryId === String(row._id)}
                        className="rounded-lg border border-emerald-300 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {updatingSalaryId === String(row._id) ? 'Updating...' : (isPaid ? 'Paid' : 'Mark Paid')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {message && <p className="text-sm text-emerald-700 font-semibold">{message}</p>}
      {error && <p className="text-sm text-rose-700 font-semibold">{error}</p>}

      {editingReviewId && reviewDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-base font-bold text-slate-900">Edit Review Row</h3>
              <button
                type="button"
                onClick={cancelEditReviewRow}
                className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-5 py-5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase">Base Salary</label>
                <input
                  type="number"
                  value={reviewDraft.baseSalary}
                  onChange={(e) => setReviewDraft((prev) => ({ ...prev, baseSalary: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase">Perf. Value</label>
                <input
                  type="number"
                  value={reviewDraft.performanceValue}
                  onChange={(e) => setReviewDraft((prev) => ({ ...prev, performanceValue: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase">Perf. Rate</label>
                <input
                  type="number"
                  value={reviewDraft.performanceRate}
                  onChange={(e) => setReviewDraft((prev) => ({ ...prev, performanceRate: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase">Bonus</label>
                <input
                  type="number"
                  value={reviewDraft.bonus}
                  onChange={(e) => setReviewDraft((prev) => ({ ...prev, bonus: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase">Deductions</label>
                <input
                  type="number"
                  value={reviewDraft.deductions}
                  onChange={(e) => setReviewDraft((prev) => ({ ...prev, deductions: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={cancelEditReviewRow}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEditReviewRow}
                className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
