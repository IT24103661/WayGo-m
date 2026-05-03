import { useCallback, useEffect, useMemo, useState } from 'react';
import { MdSave, MdInfo } from 'react-icons/md';
import { adminAPI } from '../../../services/adminAPI';

/* ── Reusable number input row ── */
function NumberField({ label, helpText, name, value, unit, min, max, step = 1, onChange, error }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-50 last:border-0">
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {helpText && <p className="text-xs text-slate-500 mt-0.5">{helpText}</p>}
        {error && <p className="text-xs text-rose-600 mt-1 font-semibold">{error}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {unit && <span className="text-sm text-slate-500 font-medium">{unit}</span>}
        <input
          type="number"
          name={name}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={onChange}
          className="w-28 text-right border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

/* ── Toggle row ── */
function ToggleRow({ label, helpText, enabled, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-50 last:border-0">
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {helpText && <p className="text-xs text-slate-500 mt-0.5">{helpText}</p>}
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-blue-600' : 'bg-gray-200'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

/* ── Card wrapper ── */
function ConfigCard({ title, subtitle, children, onSave, saved, disabled = false, saving = false }) {
  return (
    <div className="bg-white/85 backdrop-blur-sm rounded-3xl shadow-[0_20px_45px_-30px_rgba(30,64,175,0.22)] border border-white/70 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-6 py-2">{children}</div>
      {onSave && (
        <div className="px-6 pb-5 pt-2 flex items-center justify-between">
          {saved && (
            <span className="text-xs text-emerald-600 font-semibold animate-fade-in">✓ Saved successfully</span>
          )}
          {!saved && <span />}
          <button
            onClick={onSave}
            disabled={disabled || saving}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <MdSave className="text-base" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Initial config state ── */
const INITIAL = {
  commission: { taxi: 10, tour: 12, refund: 5 },
  fare: { baseFare: 150, perKm: 85, waitPerMin: 5, surgeMultiplier: 1.5, airportSurcharge: 500 },
  tour: { depositPct: 20, cancellationHrs: 48, maxGroupSize: 20 },
  toggles: {
    surgeEnabled:        true,
    maintenanceMode:     false,
    newRegistrations:    true,
    driverSelfRegister:  false,
    smsNotifications:    true,
    emailReports:        true,
  },
};

const cloneConfig = (cfg) => ({
  commission: { ...cfg.commission },
  fare: { ...cfg.fare },
  tour: { ...cfg.tour },
  toggles: { ...cfg.toggles }
});

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeConfig = (raw = {}) => ({
  commission: {
    taxi: toNumber(raw?.commission?.taxi, INITIAL.commission.taxi),
    tour: toNumber(raw?.commission?.tour, INITIAL.commission.tour),
    refund: toNumber(raw?.commission?.refund, INITIAL.commission.refund)
  },
  fare: {
    baseFare: toNumber(raw?.fare?.baseFare, INITIAL.fare.baseFare),
    perKm: toNumber(raw?.fare?.perKm, INITIAL.fare.perKm),
    waitPerMin: toNumber(raw?.fare?.waitPerMin, INITIAL.fare.waitPerMin),
    surgeMultiplier: toNumber(raw?.fare?.surgeMultiplier, INITIAL.fare.surgeMultiplier),
    airportSurcharge: toNumber(raw?.fare?.airportSurcharge, INITIAL.fare.airportSurcharge)
  },
  tour: {
    depositPct: toNumber(raw?.tour?.depositPct, INITIAL.tour.depositPct),
    cancellationHrs: toNumber(raw?.tour?.cancellationHrs, INITIAL.tour.cancellationHrs),
    maxGroupSize: toNumber(raw?.tour?.maxGroupSize, INITIAL.tour.maxGroupSize)
  },
  toggles: {
    surgeEnabled: Boolean(raw?.toggles?.surgeEnabled ?? INITIAL.toggles.surgeEnabled),
    maintenanceMode: Boolean(raw?.toggles?.maintenanceMode ?? INITIAL.toggles.maintenanceMode),
    newRegistrations: Boolean(raw?.toggles?.newRegistrations ?? INITIAL.toggles.newRegistrations),
    driverSelfRegister: Boolean(raw?.toggles?.driverSelfRegister ?? INITIAL.toggles.driverSelfRegister),
    smsNotifications: Boolean(raw?.toggles?.smsNotifications ?? INITIAL.toggles.smsNotifications),
    emailReports: Boolean(raw?.toggles?.emailReports ?? INITIAL.toggles.emailReports)
  }
});

export default function ConfigSection() {
  const [cfg, setCfg] = useState(INITIAL);
  const [initialCfg, setInitialCfg] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savingSection, setSavingSection] = useState('');
  const [saved, setSaved] = useState({});
  const [fieldErrors, setFieldErrors] = useState({ commission: {}, fare: {}, tour: {} });

  const numChange = (section) => (e) =>
    setCfg((p) => ({ ...p, [section]: { ...p[section], [e.target.name]: Number(e.target.value) } }));

  const toggleChange = (key) =>
    setCfg((p) => ({ ...p, toggles: { ...p.toggles, [key]: !p.toggles[key] } }));

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const result = await adminAPI.getConfig();
      const normalized = normalizeConfig(result?.data || {});
      setCfg(normalized);
      setInitialCfg(cloneConfig(normalized));
    } catch (err) {
      setError(err.message || 'Failed to load configuration.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const isDirty = useMemo(() => ({
    commission: JSON.stringify(cfg.commission) !== JSON.stringify(initialCfg.commission),
    fare: JSON.stringify(cfg.fare) !== JSON.stringify(initialCfg.fare),
    tour: JSON.stringify(cfg.tour) !== JSON.stringify(initialCfg.tour),
    toggles: JSON.stringify(cfg.toggles) !== JSON.stringify(initialCfg.toggles)
  }), [cfg, initialCfg]);

  const validateSection = (key) => {
    if (key === 'toggles') {
      return true;
    }

    const rules = {
      commission: {
        taxi: { min: 0, max: 50, label: 'Taxi Commission' },
        tour: { min: 0, max: 50, label: 'Tour Commission' },
        refund: { min: 0, max: 20, label: 'Refund Handling Fee' }
      },
      fare: {
        baseFare: { min: 0, max: 100000, label: 'Base Fare' },
        perKm: { min: 0, max: 10000, label: 'Rate per km' },
        waitPerMin: { min: 0, max: 1000, label: 'Wait time (per min)' },
        surgeMultiplier: { min: 1, max: 5, label: 'Surge Multiplier' },
        airportSurcharge: { min: 0, max: 100000, label: 'Airport Surcharge' }
      },
      tour: {
        depositPct: { min: 0, max: 100, label: 'Required Deposit' },
        cancellationHrs: { min: 0, max: 720, label: 'Free Cancellation Window' },
        maxGroupSize: { min: 1, max: 100, label: 'Max Group Size' }
      }
    };

    const sectionRules = rules[key] || {};
    const nextErrors = {};
    Object.entries(sectionRules).forEach(([field, rule]) => {
      const raw = cfg[key]?.[field];
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        nextErrors[field] = `${rule.label} must be a valid number.`;
        return;
      }
      if (n < rule.min || n > rule.max) {
        nextErrors[field] = `${rule.label} must be between ${rule.min} and ${rule.max}.`;
      }
    });

    setFieldErrors((prev) => ({ ...prev, [key]: nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  async function saveSection(key) {
    try {
      setError('');
      if (!validateSection(key)) {
        setError('Please fix validation errors before saving.');
        return;
      }
      setSavingSection(key);
      const payload = { [key]: cfg[key] };
      const result = await adminAPI.updateConfig(payload);
      const normalized = normalizeConfig(result?.data || cfg);
      setCfg(normalized);
      setInitialCfg(cloneConfig(normalized));
      setSaved((p) => ({ ...p, [key]: true }));
      setTimeout(() => setSaved((p) => ({ ...p, [key]: false })), 2500);
    } catch (err) {
      setError(err.message || 'Failed to save configuration.');
    } finally {
      setSavingSection('');
    }
  }

  return (
    <div className="space-y-6 max-w-3xl wg-admin-motion wg-motion-config">
      <div className="relative overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-6 py-5 text-white shadow-[0_26px_55px_-35px_rgba(245,158,11,0.75)]">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/15 blur-xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100">Policy Engine</p>
        <h2 className="mt-1 text-xl font-bold">Global Platform Configuration</h2>
        <p className="mt-1 text-sm text-amber-100/95">Control commissions, pricing logic, policies, and platform-wide switches.</p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700">
        <MdInfo className="text-lg flex-shrink-0 mt-0.5" />
        <p>Changes here affect the entire platform in real time. Review carefully before saving.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Loading configuration...
        </div>
      )}

      {/* Commission Rates */}
      <ConfigCard
        title="Commission Rates"
        subtitle="Percentage of booking value retained by WayGo"
        onSave={() => saveSection('commission')}
        saved={saved.commission}
        disabled={!isDirty.commission}
        saving={savingSection === 'commission'}
      >
        <NumberField label="Taxi Commission"        helpText="% taken from each taxi booking"        name="taxi"   value={cfg.commission.taxi}   unit="%" min={0} max={50} onChange={numChange('commission')} error={fieldErrors.commission.taxi} />
        <NumberField label="Tour Commission"         helpText="% taken from each tour booking"        name="tour"   value={cfg.commission.tour}   unit="%" min={0} max={50} onChange={numChange('commission')} error={fieldErrors.commission.tour} />
        <NumberField label="Refund Handling Fee"     helpText="% charged on processed refunds"        name="refund" value={cfg.commission.refund} unit="%" min={0} max={20} onChange={numChange('commission')} error={fieldErrors.commission.refund} />
      </ConfigCard>

      {/* Base Taxi Fares */}
      <ConfigCard
        title="Taxi Fare Structure"
        subtitle="Base pricing rules applied to all taxi bookings"
        onSave={() => saveSection('fare')}
        saved={saved.fare}
        disabled={!isDirty.fare}
        saving={savingSection === 'fare'}
      >
        <NumberField label="Base Fare"              helpText="Fixed charge for every ride"                    name="baseFare"          value={cfg.fare.baseFare}          unit="LKR" min={0}   step={10}  onChange={numChange('fare')} error={fieldErrors.fare.baseFare} />
        <NumberField label="Rate per km"            helpText="Per kilometre charge after base"                name="perKm"             value={cfg.fare.perKm}             unit="LKR" min={0}   step={5}   onChange={numChange('fare')} error={fieldErrors.fare.perKm} />
        <NumberField label="Wait time (per min)"    helpText="Charge when vehicle is stationary"              name="waitPerMin"        value={cfg.fare.waitPerMin}        unit="LKR" min={0}   step={1}   onChange={numChange('fare')} error={fieldErrors.fare.waitPerMin} />
        <NumberField label="Surge Multiplier"       helpText="Maximum surge pricing factor (×)"               name="surgeMultiplier"   value={cfg.fare.surgeMultiplier}   unit="×"   min={1}   step={0.1} onChange={numChange('fare')} error={fieldErrors.fare.surgeMultiplier} />
        <NumberField label="Airport Surcharge"      helpText="Fixed surcharge on BIA pick-up/drop-off"        name="airportSurcharge"  value={cfg.fare.airportSurcharge}  unit="LKR" min={0}   step={50}  onChange={numChange('fare')} error={fieldErrors.fare.airportSurcharge} />
      </ConfigCard>

      {/* Tour Booking Rules */}
      <ConfigCard
        title="Tour Booking Rules"
        subtitle="Policies applied to all tour packages"
        onSave={() => saveSection('tour')}
        saved={saved.tour}
        disabled={!isDirty.tour}
        saving={savingSection === 'tour'}
      >
        <NumberField label="Required Deposit"         helpText="% of tour price paid at booking"                name="depositPct"       value={cfg.tour.depositPct}      unit="%" min={0}  max={100} onChange={numChange('tour')} error={fieldErrors.tour.depositPct} />
        <NumberField label="Free Cancellation Window" helpText="Hours before tour where full refund is issued"  name="cancellationHrs"  value={cfg.tour.cancellationHrs} unit="hrs" min={0} step={6}   onChange={numChange('tour')} error={fieldErrors.tour.cancellationHrs} />
        <NumberField label="Max Group Size"           helpText="Upper cap on tourists per tour booking"          name="maxGroupSize"     value={cfg.tour.maxGroupSize}    unit="pax" min={1} max={100}  onChange={numChange('tour')} error={fieldErrors.tour.maxGroupSize} />
      </ConfigCard>

      {/* System Toggles */}
      <ConfigCard
        title="System Toggles"
        subtitle="Feature flags and platform-wide switches"
        onSave={() => saveSection('toggles')}
        saved={saved.toggles}
        disabled={!isDirty.toggles}
        saving={savingSection === 'toggles'}
      >
        <ToggleRow label="Surge Pricing"          helpText="Enable dynamic fare multiplier during peak hours" enabled={cfg.toggles.surgeEnabled}       onChange={() => toggleChange('surgeEnabled')} />
        <ToggleRow label="New User Registrations" helpText="Allow new tourists to self-register"              enabled={cfg.toggles.newRegistrations}   onChange={() => toggleChange('newRegistrations')} />
        <ToggleRow label="Driver Self-Register"   helpText="Allow drivers to apply without invite"            enabled={cfg.toggles.driverSelfRegister} onChange={() => toggleChange('driverSelfRegister')} />
        <ToggleRow label="SMS Notifications"      helpText="Send booking SMS to tourists and drivers"         enabled={cfg.toggles.smsNotifications}   onChange={() => toggleChange('smsNotifications')} />
        <ToggleRow label="Weekly Email Reports"   helpText="Send summary reports to admin email"              enabled={cfg.toggles.emailReports}       onChange={() => toggleChange('emailReports')} />
        <ToggleRow
          label={<span className="text-red-600">Maintenance Mode</span>}
          helpText="Lock the platform — only admins can access"
          enabled={cfg.toggles.maintenanceMode}
          onChange={() => toggleChange('maintenanceMode')}
        />
      </ConfigCard>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <span className={`px-2.5 py-1 rounded-full ${isDirty.commission ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
          Commission: {isDirty.commission ? 'Unsaved' : 'Saved'}
        </span>
        <span className={`px-2.5 py-1 rounded-full ${isDirty.fare ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
          Fare: {isDirty.fare ? 'Unsaved' : 'Saved'}
        </span>
        <span className={`px-2.5 py-1 rounded-full ${isDirty.tour ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
          Tour Rules: {isDirty.tour ? 'Unsaved' : 'Saved'}
        </span>
        <span className={`px-2.5 py-1 rounded-full ${isDirty.toggles ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
          Toggles: {isDirty.toggles ? 'Unsaved' : 'Saved'}
        </span>
        {savingSection && <span className="font-semibold text-blue-700">Saving {savingSection}...</span>}
      </div>
    </div>
  );
}
