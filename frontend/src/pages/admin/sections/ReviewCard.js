import { MdWarning } from 'react-icons/md';

const sentimentBadgeClasses = {
  Positive: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Neutral: 'bg-amber-100 text-amber-700 border-amber-200',
  Negative: 'bg-rose-100 text-rose-700 border-rose-200'
};

export default function ReviewCard({ review }) {
  const label = review?.sentimentLabel || 'Neutral';
  const badgeClass = sentimentBadgeClasses[label] || sentimentBadgeClasses.Neutral;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-900">{review?.tourName || 'General Tour'}</p>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${badgeClass}`}>
          {label}
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-600">{review?.text || '-'}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>Tourist: {review?.tourist?.name || '-'}</span>
        <span>Driver: {review?.driver?.name || 'Unassigned'}</span>
        <span>Score: {Number(review?.sentimentScore || 0)}</span>
        <span>Rating: {Number(review?.rating || 0)}/5</span>
      </div>

      {review?.driver?.isFlagged && (
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
          <MdWarning className="text-sm" />
          Warning: Driver is flagged
        </div>
      )}
    </div>
  );
}
