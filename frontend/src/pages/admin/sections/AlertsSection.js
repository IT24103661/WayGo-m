import { useEffect, useState } from 'react';
import { MdWarning, MdRefresh } from 'react-icons/md';
import { adminAPI } from '../../../services/adminAPI';
import ReviewCard from './ReviewCard';

export default function AlertsSection() {
  const [sentimentFilter, setSentimentFilter] = useState('');
  const [reviews, setReviews] = useState([]);
  const [flaggedDrivers, setFlaggedDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const [reviewsRes, driversRes] = await Promise.all([
        adminAPI.getSentimentReviews({ sentiment: sentimentFilter, page: 1, limit: 20 }),
        adminAPI.getFlaggedDrivers()
      ]);

      setReviews(Array.isArray(reviewsRes?.data) ? reviewsRes.data : []);
      setFlaggedDrivers(Array.isArray(driversRes?.data) ? driversRes.data : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load sentiment alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [sentimentFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sentiment Alerts</h2>
          <p className="text-sm text-slate-600 mt-1">Monitor review sentiment and flagged drivers.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
          >
            <option value="">All Sentiments</option>
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Negative">Negative</option>
          </select>
          <button
            onClick={fetchAlerts}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-semibold hover:bg-slate-100"
          >
            <MdRefresh /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-5">
        <div className="flex items-center gap-2 text-rose-700 font-bold">
          <MdWarning className="text-xl" />
          Flagged Drivers ({flaggedDrivers.length})
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          {flaggedDrivers.length === 0 ? (
            <p className="text-sm text-slate-600">No flagged drivers at the moment.</p>
          ) : flaggedDrivers.map((driver) => (
            <div key={driver._id} className="rounded-2xl border border-rose-200 bg-white px-4 py-3">
              <p className="text-sm font-bold text-slate-900">{driver.name}</p>
              <p className="text-xs text-slate-600 mt-1">{driver.email}</p>
              <p className="text-xs text-slate-600">{driver.phone || '-'}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900">Recent Reviews with Sentiment</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-slate-500">No reviews found for selected sentiment.</p>
        ) : (
          reviews.map((review) => <ReviewCard key={review._id} review={review} />)
        )}
      </div>
    </div>
  );
}
