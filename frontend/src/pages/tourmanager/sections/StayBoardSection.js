import { useMemo } from 'react';
import { useTourManagerStayRequests } from '../../../hooks/useTourManagerAPI';

const COLUMNS = [
  'Awaiting Stay Allocation',
  'Partially Allocated',
  'Stay Confirmed',
  'Check-in Ready',
  'Checked-in',
  'Checked-out'
];

export default function StayBoardSection() {
  const { requests, loading, error } = useTourManagerStayRequests('');

  const grouped = useMemo(() => {
    const initial = COLUMNS.reduce((acc, key) => {
      acc[key] = [];
      return acc;
    }, {});

    (requests || []).forEach((booking) => {
      const status = booking.stayStatus || 'Awaiting Stay Allocation';
      if (!initial[status]) initial[status] = [];
      initial[status].push(booking);
    });

    return initial;
  }, [requests]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.3em] text-cyan-700 uppercase">Stay Operations</p>
        <h2 className="text-2xl font-bold text-cyan-950">Stay Board</h2>
        <p className="text-cyan-700/80">Visualize all tour bookings by stay readiness stage.</p>
      </div>

      {loading && <p className="text-cyan-700">Loading stay board...</p>}
      {error && <p className="text-rose-600">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {COLUMNS.map((column) => (
            <section key={column} className="bg-white/90 rounded-3xl border border-cyan-200 shadow-sm p-4 min-h-[220px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-cyan-900 uppercase tracking-wide">{column}</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 font-semibold">
                  {grouped[column]?.length || 0}
                </span>
              </div>

              <div className="space-y-2">
                {(grouped[column] || []).length === 0 && (
                  <p className="text-xs text-cyan-700/70">No bookings in this stage.</p>
                )}

                {(grouped[column] || []).map((booking) => (
                  <div key={booking._id} className="border border-cyan-100 rounded-2xl px-3 py-2 bg-cyan-50/40">
                    <p className="text-sm font-semibold text-cyan-950 line-clamp-1">
                      {booking.tourPackage?.title || booking.packageOptions?.tourTitle || 'Tour Booking'}
                    </p>
                    <p className="text-xs text-cyan-700/80 mt-1">
                      {booking.tourist?.name || 'Tourist'} • Rooms requested: {booking.packageOptions?.roomCount || 1}
                    </p>
                    <p className="text-xs text-cyan-700/80">Allocations: {booking.stayAllocations?.length || 0}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
