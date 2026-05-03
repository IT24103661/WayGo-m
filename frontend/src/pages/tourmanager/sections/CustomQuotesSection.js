import { useState } from 'react';
import { MdOutlineRequestQuote, MdCheckCircle, MdAccessTime, MdAutoAwesome } from 'react-icons/md';
import { useTourManagerQuotes } from '../../../hooks/useTourManagerAPI';
import { useTourManagerPackages } from '../../../hooks/useTourManagerAPI';

const DEMO_QUOTES = [
  {
    _id: 'CQ-301',
    requestedRoute: 'Colombo -> Kandy -> Sigiriya -> Dambulla',
    status: 'Pending',
    userId: { name: 'Amaya Perera' },
    quotedPrice: 0
  },
  {
    _id: 'CQ-302',
    requestedRoute: 'Negombo -> Wilpattu -> Anuradhapura',
    status: 'Pending',
    userId: { name: 'Liam Carter' },
    quotedPrice: 0
  },
];

export default function CustomQuotesSection() {
  const [statusFilter, setStatusFilter] = useState('Pending');
  const { quotes, loading, updateQuote, refetch } = useTourManagerQuotes(statusFilter === 'All' ? '' : statusFilter);
  const { createPackage } = useTourManagerPackages();
  const [prices, setPrices] = useState({});
  const [message, setMessage] = useState('');

  const displayQuotes = quotes.length > 0 ? quotes : DEMO_QUOTES;

  const handlePriceChange = (quoteId) => (event) => {
    setPrices((prev) => ({ ...prev, [quoteId]: event.target.value }));
  };

  const handleSendQuote = async (quoteId) => {
    setMessage('');
    const quotedPrice = Number(prices[quoteId]);
    if (!quotedPrice) {
      setMessage('Enter a valid quote price before sending.');
      return;
    }
    try {
      await updateQuote(quoteId, { quotedPrice, status: 'Quoted' });
      setMessage('Quote sent successfully.');
      await refetch();
    } catch (error) {
      setMessage(error.message || 'Failed to send quote.');
    }
  };

  const handleConvertToPackage = async (quote) => {
    setMessage('');
    const sourcePrice = Number(prices[quote._id] || quote.quotedPrice || 0);

    if (!sourcePrice) {
      setMessage('Set a quote price first, then convert to package.');
      return;
    }

    const stops = String(quote.requestedRoute || '')
      .split('->')
      .map((item) => item.trim())
      .filter(Boolean);

    const packagePayload = {
      title: `Custom Route: ${stops[0] || 'Premium Journey'}`,
      description: `Converted from custom quote ${quote._id}. Route plan: ${quote.requestedRoute || 'Not specified'}`,
      flatPrice: sourcePrice,
      durationDays: Math.max(1, stops.length),
      itineraryStops: stops,
      vehicleType: 'SUV'
    };

    try {
      await createPackage(packagePayload);
      await updateQuote(quote._id, { quotedPrice: sourcePrice, status: 'Accepted' });
      setMessage(`Quote ${quote._id} converted into a reusable package.`);
      await refetch();
    } catch (error) {
      setMessage(error.message || 'Failed to convert quote to package.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.3em] text-cyan-700 uppercase">Custom Quotes</p>
        <h2 className="text-2xl font-bold text-cyan-950">Pending Custom Quotes</h2>
        <p className="text-cyan-700/80">Review bespoke trip requests and send premium quotes.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {['Pending', 'Quoted', 'Accepted', 'All'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${statusFilter === status ? 'bg-cyan-600 text-white' : 'bg-white border border-cyan-200 text-cyan-700 hover:bg-cyan-50'}`}
          >
            {status}
          </button>
        ))}
      </div>

      {message && (
        <p className="text-sm font-semibold text-cyan-700">{message}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading && (
          <div className="col-span-full text-cyan-700">Loading quotes...</div>
        )}
        {!loading && displayQuotes.map((quote) => (
          <div key={quote._id} className="bg-white/90 backdrop-blur-sm rounded-3xl border border-cyan-200 shadow-[0_20px_50px_-40px_rgba(6,182,212,0.35)] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-cyan-100 text-cyan-600 flex items-center justify-center">
                  <MdOutlineRequestQuote className="text-xl" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-cyan-900">{quote.userId?.name || 'Guest'}</p>
                  <p className="text-xs text-cyan-600/80">{quote._id}</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700">
                {quote.status || 'Pending'}
              </span>
            </div>

            <div className="mt-4 text-sm text-cyan-800">
              <p className="font-semibold">Route</p>
              <p className="text-cyan-700/80 mt-1">{quote.requestedRoute}</p>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-cyan-700">
              <div className="flex items-center gap-2">
                <MdAccessTime className="text-cyan-500" />
                Quote needed in 6 hrs
              </div>
              <div className="flex items-center gap-2">
                <MdCheckCircle className="text-cyan-500" />
                {quote.quotedPrice ? `LKR ${quote.quotedPrice.toLocaleString()}` : 'Pending price'}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <input
                type="number"
                value={prices[quote._id] || ''}
                onChange={handlePriceChange(quote._id)}
                placeholder="Enter price"
                className="flex-1 px-4 py-2 border border-cyan-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <button
                onClick={() => handleSendQuote(quote._id)}
                className="px-4 py-2 rounded-2xl bg-cyan-600 text-white font-semibold hover:bg-cyan-700 transition-colors"
              >
                Send
              </button>
            </div>

            <button
              onClick={() => handleConvertToPackage(quote)}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl border border-cyan-200 bg-cyan-50 text-cyan-800 font-semibold hover:bg-cyan-100 transition-colors"
            >
              <MdAutoAwesome className="text-lg" />
              Convert Quote to Package
            </button>

          </div>
        ))}
      </div>
    </div>
  );
}
