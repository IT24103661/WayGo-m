import { MdTour, MdMap, MdTrendingUp, MdAutoGraph } from 'react-icons/md';
import { useMemo } from 'react';
import { useTourManagerBookings, useTourManagerStats } from '../../../hooks/useTourManagerAPI';

const VALID_BOOKING_STATUSES = ['Pending', 'Accepted', 'En Route', 'Completed', 'Cancelled'];

const toSafeNumber = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const toClampedNumber = (value, min, max, fallback = min) => {
  const next = toSafeNumber(value, fallback);
  return Math.min(max, Math.max(min, next));
};

const normalizeBookingStatus = (status) => {
  const text = String(status || '').trim().toLowerCase();
  if (!text) return 'Pending';

  if (text === 'en route' || text === 'enroute' || text === 'in progress') return 'En Route';
  if (text === 'accepted') return 'Accepted';
  if (text === 'completed') return 'Completed';
  if (text === 'cancelled' || text === 'canceled') return 'Cancelled';
  if (text === 'pending') return 'Pending';

  return VALID_BOOKING_STATUSES.includes(status) ? status : 'Pending';
};

export default function OverviewSection() {
  const { stats } = useTourManagerStats();
  const { bookings } = useTourManagerBookings();

  const validatedStats = useMemo(() => {
    return {
      avgRating: toClampedNumber(stats?.avgRating, 0, 5, 0),
      totalReviews: Math.max(0, Math.round(toSafeNumber(stats?.totalReviews, 0))),
      activeTours: Math.max(0, Math.round(toSafeNumber(stats?.activeTours, 0))),
      totalBookings: Math.max(0, Math.round(toSafeNumber(stats?.totalBookings, 0)))
    };
  }, [stats]);

  const validatedBookings = useMemo(() => {
    const allBookings = Array.isArray(bookings) ? bookings : [];
    return allBookings.map((booking) => ({
      ...booking,
      status: normalizeBookingStatus(booking?.status),
      totalPrice: Math.max(0, toSafeNumber(booking?.totalPrice, 0))
    }));
  }, [bookings]);

  const metrics = useMemo(() => {
    const allBookings = validatedBookings;

    const completedBookings = allBookings.filter((booking) => booking.status === 'Completed');
    const cancelledBookings = allBookings.filter((booking) => booking.status === 'Cancelled');

    const completedRevenue = completedBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
    const avgRating = validatedStats.avgRating;

    const onTrackRate = allBookings.length > 0
      ? Math.max(0, Math.round(((allBookings.length - cancelledBookings.length) / allBookings.length) * 100))
      : 100;

    return {
      completedRevenue,
      completedBookings: completedBookings.length,
      avgRating,
      totalBookings: allBookings.length,
      onTrackRate,
      pipeline: {
        pending: allBookings.filter((booking) => booking.status === 'Pending').length,
        accepted: allBookings.filter((booking) => booking.status === 'Accepted').length,
        enRoute: allBookings.filter((booking) => booking.status === 'En Route').length,
        scheduled: allBookings.filter((booking) => ['Accepted', 'En Route', 'Completed'].includes(booking.status)).length
      }
    };
  }, [validatedBookings, validatedStats.avgRating]);

  const cards = [
    {
      label: 'Revenue (Completed)',
      value: `LKR ${metrics.completedRevenue.toLocaleString()}`,
      helper: `${metrics.completedBookings} completed bookings`,
      icon: MdTrendingUp,
      accent: 'from-cyan-600 to-sky-500'
    },
    {
      label: 'Total Bookings',
      value: metrics.totalBookings,
      helper: 'All bookings in your tour flow',
      icon: MdAutoGraph,
      accent: 'from-cyan-600 to-sky-500'
    },
    {
      label: 'Avg Tour Rating',
      value: `${metrics.avgRating || 0} / 5`,
      helper: `${validatedStats.totalReviews} review signals`,
      icon: MdTour,
      accent: 'from-cyan-500 to-sky-400'
    },
    {
      label: 'Execution Health',
      value: `${metrics.onTrackRate}%`,
      helper: 'Non-cancelled booking ratio',
      icon: MdMap,
      accent: 'from-sky-500 to-cyan-400'
    }
  ];

  const pipelineStages = [
    {
      key: 'pending',
      title: 'Pending',
      value: metrics.pipeline.pending,
      hint: 'Awaiting confirmation',
      icon: MdAutoGraph,
      style: 'border-amber-200 bg-amber-50 text-amber-800'
    },
    {
      key: 'accepted',
      title: 'Accepted',
      value: metrics.pipeline.accepted,
      hint: 'Ready for operations',
      icon: MdTrendingUp,
      style: 'border-sky-200 bg-sky-50 text-sky-800'
    },
    {
      key: 'enRoute',
      title: 'En Route',
      value: metrics.pipeline.enRoute,
      hint: 'Tours in progress',
      icon: MdMap,
      style: 'border-cyan-200 bg-cyan-50 text-cyan-800'
    },
    {
      key: 'scheduled',
      title: 'Scheduled',
      value: metrics.pipeline.scheduled,
      hint: 'Assigned or in-progress',
      icon: MdMap,
      style: 'border-cyan-200 bg-cyan-50 text-cyan-800'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.3em] text-cyan-700 uppercase">Overview</p>
        <h2 className="text-2xl font-bold text-cyan-950">Tour Manager Overview</h2>
        <p className="text-cyan-700/80">Monitor premium tours, quotes, and performance at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white/90 backdrop-blur-sm rounded-3xl border border-cyan-200 shadow-[0_20px_50px_-40px_rgba(6,182,212,0.3)] p-5">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.accent} text-white flex items-center justify-center shadow-lg`}>
                <Icon className="text-2xl" />
              </div>
              <p className="mt-4 text-sm font-semibold text-cyan-900">{card.label}</p>
              <p className="text-2xl font-bold text-cyan-950 mt-1">{card.value}</p>
              <p className="text-xs text-cyan-700/70 mt-2">{card.helper}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-cyan-200 shadow-[0_20px_50px_-40px_rgba(6,182,212,0.3)] p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-cyan-950">Booking Pipeline</h3>
            <p className="text-sm text-cyan-700/80 mt-1">Track progression from pending requests to active operations.</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full border border-cyan-200 bg-cyan-50 text-cyan-700 font-semibold">
            Total Bookings: {metrics.totalBookings}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {pipelineStages.map((stage) => {
            const Icon = stage.icon;
            return (
              <div key={stage.key} className={`rounded-2xl border p-4 ${stage.style}`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider font-bold">{stage.title}</p>
                  <Icon className="text-lg" />
                </div>
                <p className="text-2xl font-bold mt-2">{stage.value}</p>
                <p className="text-xs mt-1 opacity-80">{stage.hint}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-cyan-100 via-sky-50 to-white rounded-3xl border border-cyan-200 shadow-[0_20px_50px_-40px_rgba(6,182,212,0.3)] p-6">
          <h3 className="text-lg font-bold text-cyan-950">Operational Pulse</h3>
          <p className="text-sm text-cyan-700/80 mt-2">Your premium operations quality this cycle.</p>
          <div className="mt-4 flex items-center justify-between text-sm text-cyan-800">
            <span>Active Tours</span>
            <span className="font-semibold">{validatedStats.activeTours}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-cyan-800">
            <span>Total Bookings</span>
            <span className="font-semibold">{validatedStats.totalBookings}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-cyan-800">
            <span>Completion Rate</span>
            <span className="font-semibold">
              {metrics.totalBookings > 0
                ? `${Math.round((metrics.completedBookings / metrics.totalBookings) * 100)}%`
                : '0%'}
            </span>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-cyan-200 shadow-[0_20px_50px_-40px_rgba(6,182,212,0.3)] p-6">
          <h3 className="text-lg font-bold text-cyan-950">Next Smart Actions</h3>
          <p className="text-sm text-cyan-700/80 mt-2">Focus these tasks to improve conversion and quality.</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-3 text-cyan-900">
              Prioritize {metrics.pipeline.pending} pending booking requests in the next sprint window.
            </li>
            <li className="rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-3 text-cyan-900">
              Move accepted bookings quickly into dispatch and stay planning stages.
            </li>
            <li className="rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-3 text-cyan-900">
              Review low-performing tours and pause those with repeated cancellations.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
