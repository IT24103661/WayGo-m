import { useMemo, useState } from 'react';
import { MdPayments } from 'react-icons/md';
import { useFleetSalaries } from '../../../hooks/useFleetManagerAPI';

const currentDate = new Date().toISOString().slice(0, 10);

const validateSalaryForm = (form) => {
  if (!form.driverId || form.baseSalary === '') {
    return 'Driver and base salary are required.';
  }

  if (form.paymentDate && Number.isNaN(new Date(form.paymentDate).getTime())) {
    return 'Payment date must be valid.';
  }

  const baseSalary = Number(form.baseSalary);
  const bonus = Number(form.bonus || 0);
  const deductions = Number(form.deductions || 0);

  if (Number.isNaN(baseSalary) || baseSalary < 0) {
    return 'Base salary must be a non-negative number.';
  }

  if (Number.isNaN(bonus) || bonus < 0 || Number.isNaN(deductions) || deductions < 0) {
    return 'Bonus and deductions must be non-negative numbers.';
  }

  if (form.notes && form.notes.length > 300) {
    return 'Notes cannot exceed 300 characters.';
  }

  return null;
};

export default function SalariesSection() {
  const { drivers, salaries, loading, error, saveSalary, updateSalary, deleteSalary, refetch } = useFleetSalaries();
  const [form, setForm] = useState({
    driverId: '',
    paymentDate: currentDate,
    baseSalary: '',
    bonus: '',
    deductions: '',
    paymentStatus: 'Pending',
    notes: ''
  });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingSalaryId, setEditingSalaryId] = useState('');

  const salaryMap = useMemo(() => {
    const map = new Map();
    salaries.forEach((item) => {
      map.set(`${item.driver?._id}-${item.month}`, item);
    });
    return map;
  }, [salaries]);

  const onDriverMonthChange = (driverId, month) => {
    const derivedMonth = (month || currentDate).slice(0, 7);
    const existing = salaryMap.get(`${driverId}-${derivedMonth}`);
    const selectedDate = month && month.length >= 10 ? month : currentDate;

    if (!existing) {
      setForm((prev) => ({
        ...prev,
        driverId,
        paymentDate: selectedDate,
        baseSalary: '',
        bonus: '',
        deductions: '',
        paymentStatus: 'Pending',
        notes: ''
      }));
      return;
    }

    setForm({
      driverId,
      paymentDate: selectedDate,
      baseSalary: existing.baseSalary,
      bonus: existing.bonus,
      deductions: existing.deductions,
      paymentStatus: existing.paymentStatus,
      notes: existing.notes || ''
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setMessage('');

    const validationError = validateSalaryForm(form);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setSaving(true);
    try {
      const derivedMonth = (form.paymentDate || currentDate).slice(0, 7);
      const payload = {
        driverId: form.driverId,
        month: derivedMonth,
        paymentDate: form.paymentDate || null,
        baseSalary: Number(form.baseSalary),
        bonus: Number(form.bonus || 0),
        deductions: Number(form.deductions || 0),
        paymentStatus: form.paymentStatus,
        notes: form.notes
      };

      if (editingSalaryId) {
        await updateSalary(editingSalaryId, payload);
        setMessage('Driver salary updated successfully.');
      } else {
        await saveSalary(payload);
        setMessage('Driver salary created successfully.');
      }

      setEditingSalaryId('');
      refetch(derivedMonth);
    } catch (err) {
      setMessage(err.message || 'Failed to save salary.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingSalaryId(item._id);
    setForm({
      driverId: item.driver?._id || '',
      paymentDate: item.paymentDate ? new Date(item.paymentDate).toISOString().slice(0, 10) : currentDate,
      baseSalary: item.baseSalary ?? '',
      bonus: item.bonus ?? '',
      deductions: item.deductions ?? '',
      paymentStatus: item.paymentStatus || 'Pending',
      notes: item.notes || ''
    });
    setMessage('Loaded salary record for editing.');
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete salary record for ${item.driver?.name || 'this driver'}?`);
    if (!confirmed) return;

    setMessage('');
    try {
      await deleteSalary(item._id);
      setMessage('Salary record deleted successfully.');
      if (editingSalaryId === item._id) {
        setEditingSalaryId('');
      }
      if (form.driverId === item.driver?._id) {
        setForm((prev) => ({
          ...prev,
          baseSalary: '',
          bonus: '',
          deductions: '',
          paymentStatus: 'Pending',
          notes: ''
        }));
      }
    } catch (err) {
      setMessage(err.message || 'Failed to delete salary record.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-cyan-900 text-white flex items-center justify-center shadow-md shadow-cyan-300/70">
            <MdPayments className="text-lg" />
          </span>
          <h2 className="text-xl font-bold text-cyan-950">Driver Salaries</h2>
        </div>
        <p className="text-sm text-cyan-700/80">Set and process monthly salaries for managed drivers.</p>
      </div>

      <form onSubmit={handleSave} className="relative bg-white rounded-3xl shadow-[0_20px_40px_-28px_rgba(12,27,42,0.25)] border border-cyan-100 p-5 space-y-4 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-200 via-cyan-500/70 to-sky-200" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={form.driverId}
            onChange={(e) => onDriverMonthChange(e.target.value, form.paymentDate)}
            className="px-3 py-2.5 border border-cyan-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
            required
          >
            <option value="">Select Driver</option>
            {drivers.map((driver) => (
              <option key={driver._id} value={driver._id}>{driver.name} ({driver.email})</option>
            ))}
          </select>

          <input
            type="date"
            value={form.paymentDate}
            onChange={(e) => {
              const nextDate = e.target.value;
              setForm({ ...form, paymentDate: nextDate });
              if (form.driverId) {
                onDriverMonthChange(form.driverId, nextDate);
              }
            }}
            className="px-3 py-2.5 border border-cyan-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
          />

          <select
            value={form.paymentStatus}
            onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
            className="px-3 py-2.5 border border-cyan-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
          >
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Base Salary"
            value={form.baseSalary}
            onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
            className="px-3 py-2.5 border border-cyan-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
            required
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Bonus"
            value={form.bonus}
            onChange={(e) => setForm({ ...form, bonus: e.target.value })}
            className="px-3 py-2.5 border border-cyan-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Deductions"
            value={form.deductions}
            onChange={(e) => setForm({ ...form, deductions: e.target.value })}
            className="px-3 py-2.5 border border-cyan-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
          />
        </div>

        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Notes (optional)"
          maxLength={300}
          className="w-full px-3 py-2.5 border border-cyan-200 rounded-xl min-h-[90px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
        />

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-cyan-700 text-white text-sm font-semibold hover:bg-cyan-800 disabled:opacity-60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-12px_rgba(8,145,178,0.9)]"
          >
            {saving ? 'Saving...' : (editingSalaryId ? 'Update Salary' : 'Create Salary')}
          </button>
          {editingSalaryId && (
            <button
              type="button"
              onClick={() => {
                setEditingSalaryId('');
                setForm({
                  driverId: '',
                  paymentDate: currentDate,
                  baseSalary: '',
                  bonus: '',
                  deductions: '',
                  paymentStatus: 'Pending',
                  notes: ''
                });
                setMessage('');
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel Edit
            </button>
          )}
          {message && <p className="text-sm text-cyan-700 font-medium">{message}</p>}
        </div>
      </form>

      <div className="relative bg-white rounded-3xl shadow-[0_20px_40px_-28px_rgba(12,27,42,0.25)] border border-cyan-100 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-200 via-cyan-500/70 to-sky-200" />
        <table className="min-w-full text-sm">
          <thead className="bg-cyan-950 text-cyan-50 uppercase text-xs">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Driver</th>
              <th className="text-left px-4 py-3 font-semibold">Month</th>
              <th className="text-left px-4 py-3 font-semibold">Date</th>
              <th className="text-left px-4 py-3 font-semibold">Net Salary</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={6}>Loading salaries...</td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td className="px-4 py-4 text-rose-600" colSpan={6}>{error}</td>
              </tr>
            )}
            {!loading && !error && salaries.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={6}>No salary records yet.</td>
              </tr>
            )}
            {!loading && salaries.map((item) => (
              <tr key={item._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-900 font-semibold">{item.driver?.name || 'Unknown Driver'}</td>
                <td className="px-4 py-3 text-slate-700">{item.month}</td>
                <td className="px-4 py-3 text-slate-700">{item.paymentDate ? new Date(item.paymentDate).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-3 text-slate-700">LKR {Number(item.netSalary || 0).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold transition-all duration-200 hover:shadow-[0_8px_18px_-12px_rgba(8,145,178,0.7)] ${item.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {item.paymentStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-cyan-200 text-cyan-700 bg-cyan-50 hover:bg-cyan-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
