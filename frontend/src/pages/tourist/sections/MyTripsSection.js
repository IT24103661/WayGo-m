import { MdDirectionsCar, MdCalendarToday, MdPersonPin, MdNavigateNext, MdDownload, MdFlag } from 'react-icons/md';

const MY_TRIPS = [
  {
    id: 1,
    name: 'Sigiriya Rock Climb',
    date: 'Mar 15, 2026',
    time: '06:00 AM - 10:00 AM',
    location: 'Sigiriya, Central Province',
    driver: 'Ruwan Dayarathna',
    vehicle: 'Toyota Fortuner (WP-2024-XYZ)',
    distance: '145 km',
    amount: 'LKR 12,500',
    status: 'Upcoming',
    rating: null,
    passengers: 3,
    image: '🏔️'
  },
  {
    id: 2,
    name: 'Yala Safari Adventure',
    date: 'Mar 20, 2026',
    time: '05:30 AM - 11:30 AM',
    location: 'Yala National Park, Matara',
    driver: 'Kamal Perera',
    vehicle: 'Land Rover Safari Vehicle',
    distance: '280 km',
    amount: 'LKR 28,000',
    status: 'Upcoming',
    rating: null,
    passengers: 5,
    image: '🦁'
  },
  {
    id: 3,
    name: 'Ella Train Journey',
    date: 'Mar 8, 2026',
    time: '02:45 PM - 05:45 PM',
    location: 'Ella Station, Badulla',
    driver: 'Nilantha Silva',
    vehicle: 'Mountain Train',
    distance: '15 km',
    amount: 'LKR 9,000',
    status: 'Completed',
    rating: 5,
    passengers: 2,
    image: '🚂'
  },
  {
    id: 4,
    name: 'Tea Plantation Tour',
    date: 'Mar 5, 2026',
    time: '09:00 AM - 02:00 PM',
    location: 'Nuwara Eliya, Central Province',
    driver: 'Pradeep Mendis',
    vehicle: 'Toyota Innova (WP-2023-ABC)',
    distance: '120 km',
    amount: 'LKR 8,500',
    status: 'Completed',
    rating: 4,
    passengers: 4,
    image: '🍃'
  },
];

const STATUS_GRADIENT = {
  'Upcoming': 'from-blue-500 to-cyan-500',
  'Completed': 'from-emerald-500 to-teal-500',
  'Cancelled': 'from-red-500 to-pink-500',
};

export default function MyTripsSection() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">My Trips</h2>
          <p className="text-gray-500">View your trip history and manage bookings</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Trips', value: '8', icon: '📍' },
          { label: 'Distance Traveled', value: '1,240 km', icon: '🛣️' },
          { label: 'Money Saved', value: 'LKR 45,000', icon: '💰' },
          { label: 'Avg Rating', value: '4.8★', icon: '⭐' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl mb-2">{stat.icon}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Trips List */}
      <div className="space-y-4">
        {MY_TRIPS.map((trip) => (
          <div key={trip.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            {/* Status Bar */}
            <div className={`bg-gradient-to-r ${STATUS_GRADIENT[trip.status]} h-1`}></div>

            <div className="p-6">
              <div className="flex items-start justify-between">
                {/* Left Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{trip.image}</span>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{trip.name}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        trip.status === 'Upcoming' ? 'bg-blue-100 text-blue-700' :
                        trip.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {trip.status}
                      </span>
                    </div>
                  </div>

                  {/* Trip Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MdCalendarToday className="text-blue-500" />
                        <div>
                          <p className="font-semibold text-gray-900">{trip.date}</p>
                          <p className="text-xs text-gray-500">{trip.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MdPersonPin className="text-emerald-500" />
                        <div>
                          <p className="font-semibold text-gray-900">{trip.driver}</p>
                          <p className="text-xs text-gray-500">{trip.vehicle}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MdFlag className="text-orange-500" />
                        <div>
                          <p className="font-semibold text-gray-900">{trip.location}</p>
                          <p className="text-xs text-gray-500">{trip.distance} • {trip.passengers} passengers</p>
                        </div>
                      </div>
                      <div className="pt-2">
                        <p className="text-xs text-gray-500">Amount Paid</p>
                        <p className="text-2xl font-bold text-blue-600">{trip.amount}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rating & Actions */}
                <div className="ml-6 flex flex-col items-end gap-3">
                  {trip.rating && (
                    <div className="bg-yellow-50 rounded-lg px-3 py-2 text-center">
                      <p className="text-2xl font-bold text-yellow-500">{trip.rating}★</p>
                      <p className="text-xs text-gray-500">Your Rating</p>
                    </div>
                  )}
                  {trip.status === 'Completed' ? (
                    <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                      <MdDownload size={16} />
                      Receipt
                    </button>
                  ) : (
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                      <MdNavigateNext size={16} />
                      Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
