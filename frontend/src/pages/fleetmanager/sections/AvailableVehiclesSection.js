import { MdLocalShipping } from 'react-icons/md';
import { useFleetVehicles } from '../../../hooks/useFleetManagerAPI';

export default function AvailableVehiclesSection() {
  const { vehicles, loading } = useFleetVehicles();

  const availableVehicles = (vehicles || []).filter((vehicle) => vehicle.status === 'Available');

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-300/70">
            <MdLocalShipping className="text-lg" />
          </span>
          <h2 className="text-xl font-bold text-cyan-950">Available Vehicles</h2>
        </div>
        <p className="text-sm text-cyan-700/80">Vehicles ready to start a trip assignment.</p>
      </div>

      <div className="relative bg-white rounded-3xl shadow-[0_20px_40px_-28px_rgba(12,27,42,0.25)] border border-cyan-100 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-200 via-emerald-500/70 to-cyan-200" />
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-cyan-950 text-cyan-50 uppercase text-xs">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Plate</th>
                <th className="text-left px-4 py-3 font-semibold">Vehicle</th>
                <th className="text-left px-4 py-3 font-semibold">Category</th>
                <th className="text-left px-4 py-3 font-semibold">Mileage</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={5}>Loading available vehicles...</td>
                </tr>
              )}
              {!loading && availableVehicles.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={5}>No available vehicles yet.</td>
                </tr>
              )}
              {!loading && availableVehicles.map((vehicle) => (
                <tr key={vehicle._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-900 font-semibold">{vehicle.plateNumber}</td>
                  <td className="px-4 py-3 text-slate-700">{vehicle.make || vehicle.brand} {vehicle.model}</td>
                  <td className="px-4 py-3 text-slate-700">{vehicle.category || vehicle.type}</td>
                  <td className="px-4 py-3 text-slate-700">{Number(vehicle.mileage?.current || 0).toLocaleString()} km</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                      Available
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
