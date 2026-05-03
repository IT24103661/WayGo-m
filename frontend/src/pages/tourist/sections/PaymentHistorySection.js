import { MdDownload, MdCheck, MdClose, MdHourglassEmpty, MdMoreVert, MdFilterList, MdSearch } from 'react-icons/md';
import { useState } from 'react';

const PAYMENTS = [
  {
    id: '#TXN-0001',
    description: 'Sigiriya Rock Climb Tour',
    amount: 'LKR 5,500',
    date: 'Mar 15, 2026',
    time: '09:30 AM',
    method: 'Visa Card ****1234',
    status: 'Completed',
    type: 'Tour Booking'
  },
  {
    id: '#TXN-0002',
    description: 'Yala Safari Adventure',
    amount: 'LKR 12,000',
    date: 'Mar 14, 2026',
    time: '02:15 PM',
    method: 'MasterCard ****5678',
    status: 'Completed',
    type: 'Tour Booking'
  },
  {
    id: '#TXN-0003',
    description: 'Taxi: CMB → Kandy',
    amount: 'LKR 4,200',
    date: 'Mar 12, 2026',
    time: '06:45 AM',
    method: 'Wallet Balance',
    status: 'Completed',
    type: 'Taxi Ride'
  },
  {
    id: '#TXN-0004',
    description: 'Wallet Top-up',
    amount: '+LKR 10,000',
    date: 'Mar 10, 2026',
    time: '11:20 AM',
    method: 'Bank Transfer',
    status: 'Completed',
    type: 'Wallet'
  },
  {
    id: '#TXN-0005',
    description: 'Tea Plantation Tour',
    amount: 'LKR 4,200',
    date: 'Mar 8, 2026',
    time: '08:00 AM',
    method: 'Visa Card ****1234',
    status: 'Completed',
    type: 'Tour Booking'
  },
  {
    id: '#TXN-0006',
    description: 'Ella Train Journey Booking',
    amount: 'LKR 2,800',
    date: 'Mar 6, 2026',
    time: '03:30 PM',
    method: 'Wallet Balance',
    status: 'Pending',
    type: 'Tour Booking'
  },
];

const STATUS_BADGE = {
  'Completed': 'bg-emerald-100 text-emerald-700',
  'Pending': 'bg-yellow-100 text-yellow-700',
  'Failed': 'bg-red-100 text-red-700',
};

const STATUS_ICON = {
  'Completed': MdCheck,
  'Pending': MdHourglassEmpty,
  'Failed': MdClose,
};

const TYPE_COLORS = {
  'Tour Booking': 'bg-blue-50 text-blue-700',
  'Taxi Ride': 'bg-purple-50 text-purple-700',
  'Wallet': 'bg-green-50 text-green-700',
};

export default function PaymentHistorySection() {
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPayments = PAYMENTS.filter(payment => {
    const matchesType = filter === 'All' || payment.type === filter;
    const matchesSearch = payment.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         payment.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Calculate summary stats
  const totalSpent = PAYMENTS.filter(p => p.status === 'Completed' && p.amount.startsWith('LKR')).length;
  const totalAmount = 'LKR 28,700';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment History</h2>
        <p className="text-gray-500">Track all your transactions and payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-5">
          <p className="text-sm text-gray-600 font-medium mb-2">Total Spent</p>
          <p className="text-3xl font-bold text-blue-600">{totalAmount}</p>
          <p className="text-xs text-gray-500 mt-2">{totalSpent} transactions</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-5">
          <p className="text-sm text-gray-600 font-medium mb-2">This Month</p>
          <p className="text-3xl font-bold text-purple-600">LKR 22,900</p>
          <p className="text-xs text-gray-500 mt-2">5 transactions</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-5">
          <p className="text-sm text-gray-600 font-medium mb-2">Wallet Balance</p>
          <p className="text-3xl font-bold text-emerald-600">LKR 15,300</p>
          <p className="text-xs text-gray-500 mt-2">Ready to use</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by description or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          {['All', 'Tour Booking', 'Taxi Ride', 'Wallet'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4 font-semibold">Transaction ID</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Date & Time</th>
                <th className="px-6 py-4 font-semibold">Payment Method</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.map((payment) => {
                const StatusIcon = STATUS_ICON[payment.status];
                return (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-gray-700">{payment.id}</td>
                    <td className="px-6 py-4 text-gray-800 font-medium">{payment.description}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${TYPE_COLORS[payment.type]}`}>
                        {payment.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="text-sm font-medium">{payment.date}</div>
                      <div className="text-xs text-gray-500">{payment.time}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{payment.method}</td>
                    <td className="px-6 py-4 font-bold text-gray-900 text-lg">{payment.amount}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1 w-fit ${STATUS_BADGE[payment.status]}`}>
                        <StatusIcon className="text-sm" />
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                        {payment.status === 'Completed' ? (
                          <MdDownload className="text-lg" />
                        ) : (
                          <MdMoreVert className="text-lg" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* No Results */}
      {filteredPayments.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500 font-medium">No transactions found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search terms</p>
        </div>
      )}
    </div>
  );
}
