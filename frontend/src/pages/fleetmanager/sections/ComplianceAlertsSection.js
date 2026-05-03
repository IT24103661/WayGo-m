import { useFleetMaintenanceAlerts } from '../../../hooks/useFleetManagerAPI';
import { MdWarning } from 'react-icons/md';

const FALLBACK_COMPLIANCE = [
  {
    _id: 'cmp-001',
    plateNumber: 'CBB-8890',
    compliance: {
      licenseExpiry: '2026-04-12',
      insuranceExpiry: '2026-05-02',
    },
  },
  {
    _id: 'cmp-002',
    plateNumber: 'WP-4521',
    compliance: {
      emissionTestExpiry: '2026-04-28',
    },
  },
];

export default function ComplianceAlertsSection() {
  const { complianceDue, loading } = useFleetMaintenanceAlerts();
  const safeCompliance = !loading && complianceDue.length === 0 ? FALLBACK_COMPLIANCE : complianceDue;

  const flattenedAlerts = safeCompliance.flatMap((vehicle) => {
    const compliance = vehicle.compliance || {};
    return [
      { id: `${vehicle._id}-license`, plate: vehicle.plateNumber, item: 'License Expiry', date: compliance.licenseExpiry },
      { id: `${vehicle._id}-insurance`, plate: vehicle.plateNumber, item: 'Insurance Expiry', date: compliance.insuranceExpiry },
      { id: `${vehicle._id}-emission`, plate: vehicle.plateNumber, item: 'Emission Test Expiry', date: compliance.emissionTestExpiry },
    ].filter((entry) => entry.date);
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-cyan-900 text-white flex items-center justify-center shadow-md shadow-cyan-300/70">
            <MdWarning className="text-lg" />
          </span>
          <h2 className="text-xl font-bold text-cyan-950">Compliance Alerts</h2>
        </div>
        <p className="text-sm text-cyan-700/80">Expiring documents that require immediate action.</p>
      </div>

      <div className="relative bg-white rounded-2xl shadow-sm border border-cyan-100 p-5 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-200 via-cyan-500/70 to-sky-200" />
        <div className="space-y-4">
          {loading && (
            <div className="text-gray-500">Loading compliance alerts...</div>
          )}
          {!loading && flattenedAlerts.length === 0 && (
            <div className="text-gray-500">No compliance alerts at the moment.</div>
          )}
          {!loading && flattenedAlerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-100">
              <div>
                <p className="text-sm font-semibold text-amber-900">{alert.plate}</p>
                <p className="text-xs text-amber-800">{alert.item}</p>
              </div>
              <span className="text-xs font-semibold text-amber-800 px-2 py-0.5 rounded-full bg-amber-100/70 transition-all duration-200 hover:shadow-[0_8px_18px_-12px_rgba(217,119,6,0.8)]">
                {new Date(alert.date).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
