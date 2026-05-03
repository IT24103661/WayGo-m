import { useFleetMaintenanceAlerts } from '../../../hooks/useFleetManagerAPI';
import { MdBuild } from 'react-icons/md';

const FALLBACK_SERVICE_DUE = [
  {
    id: 'svc-001',
    plateNumber: 'CAF-1234',
    brand: 'Toyota',
    model: 'Hiace',
    mileage: { current: 48210, lastService: 40000, serviceInterval: 10000 },
  },
  {
    id: 'svc-002',
    plateNumber: 'WP-7843',
    brand: 'Suzuki',
    model: 'Wagon R',
    mileage: { current: 73500, lastService: 65000, serviceInterval: 8000 },
  },
];

export default function ServiceDueSection() {
  const { serviceDue, loading } = useFleetMaintenanceAlerts();
  const safeServiceDue = !loading && serviceDue.length === 0 ? FALLBACK_SERVICE_DUE : serviceDue;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-cyan-900 text-white flex items-center justify-center shadow-md shadow-cyan-300/70">
            <MdBuild className="text-lg" />
          </span>
          <h2 className="text-xl font-bold text-cyan-950">Service Due</h2>
        </div>
        <p className="text-sm text-cyan-700/80">Vehicles that require immediate maintenance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading && (
          <div className="text-gray-500">Loading service alerts...</div>
        )}
        {!loading && serviceDue.length === 0 && (
          <div className="text-gray-500">Showing sample service alerts.</div>
        )}
        {!loading && safeServiceDue.map((vehicle) => (
          <div key={vehicle.id} className="relative bg-white rounded-2xl shadow-sm border border-cyan-100 p-5 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-200 via-cyan-500/70 to-sky-200" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{vehicle.brand || vehicle.make} {vehicle.model}</p>
                <p className="text-xs text-gray-500">{vehicle.plateNumber}</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 transition-all duration-200 hover:shadow-[0_8px_18px_-12px_rgba(217,119,6,0.8)]">
                Service Due
              </span>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <p>Current: {(vehicle.mileage?.current || 0).toLocaleString()} km</p>
              <p>Last Service: {(vehicle.mileage?.lastService || 0).toLocaleString()} km</p>
              <p>Interval: {(vehicle.mileage?.serviceInterval || 0).toLocaleString()} km</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
