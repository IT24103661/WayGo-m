import { MdFavorite, MdShare, MdMoreVert, MdAccessTime, MdPeople, MdLocationOn } from 'react-icons/md';
import { useState } from 'react';

const FAVORITE_TOURS = [
  {
    id: 1,
    name: 'Sigiriya Rock Climb',
    destination: 'Sigiriya',
    price: 'LKR 5,500',
    duration: '4 hours',
    groupSize: '2-8',
    rating: 4.8,
    reviews: 324,
    image: '🏔️',
    category: 'Adventure',
    savedDate: 'Feb 28, 2026',
    timesViewed: 5
  },
  {
    id: 2,
    name: 'Mirissa Beach Resort',
    destination: 'Mirissa',
    price: 'LKR 6,800',
    duration: '1 day',
    groupSize: '2-8',
    rating: 4.9,
    reviews: 401,
    image: '🏖️',
    category: 'Beach',
    savedDate: 'Mar 10, 2026',
    timesViewed: 8
  },
  {
    id: 3,
    name: 'Yala Safari Adventure',
    destination: 'Yala National Park',
    price: 'LKR 12,000',
    duration: '6 hours',
    groupSize: '4-10',
    rating: 4.9,
    reviews: 512,
    image: '🦁',
    category: 'Wildlife',
    savedDate: 'Mar 5, 2026',
    timesViewed: 3
  },
  {
    id: 4,
    name: 'Tea Plantation Tour',
    destination: 'Nuwara Eliya',
    price: 'LKR 4,200',
    duration: '5 hours',
    groupSize: '2-6',
    rating: 4.7,
    reviews: 289,
    image: '🍃',
    category: 'Cultural',
    savedDate: 'Feb 15, 2026',
    timesViewed: 12
  },
];

const CATEGORY_COLORS = {
  'Adventure': 'bg-orange-50 border-orange-200',
  'Beach': 'bg-sky-50 border-sky-200',
  'Wildlife': 'bg-green-50 border-green-200',
  'Cultural': 'bg-amber-50 border-amber-200',
};

export default function FavoritesSection() {
  const [view, setView] = useState('grid');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
            <MdFavorite className="text-red-500" />
            My Favorites
          </h2>
          <p className="text-gray-500">{FAVORITE_TOURS.length} tours saved for later</p>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <button 
            onClick={() => setView('grid')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${view === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Grid
          </button>
          <button 
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${view === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            List
          </button>
        </div>
      </div>

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FAVORITE_TOURS.map((tour) => (
            <div key={tour.id} className={`rounded-2xl border-2 overflow-hidden hover:shadow-lg transition-all ${CATEGORY_COLORS[tour.category]}`}>
              {/* Image Area */}
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 h-32 flex items-center justify-center relative">
                <span className="text-5xl">{tour.image}</span>
                <div className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md">
                  <MdFavorite className="text-red-500 text-lg" />
                </div>
                <span className="absolute bottom-3 left-3 bg-white text-xs px-2 py-1 rounded-full font-semibold">
                  {tour.category}
                </span>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-2">{tour.name}</h3>
                
                <div className="flex items-center gap-2 mb-3">
                  <MdLocationOn className="text-gray-400 text-sm" />
                  <span className="text-sm text-gray-600">{tour.destination}</span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-300 border-opacity-50">
                  <div className="flex items-center gap-1">
                    <MdAccessTime className="text-orange-500" />
                    {tour.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <MdPeople className="text-emerald-500" />
                    {tour.groupSize}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">★</span>
                    <span className="font-bold text-gray-900">{tour.rating}</span>
                    <span className="text-xs text-gray-500">({tour.reviews})</span>
                  </div>
                  <p className="font-bold text-blue-600">{tour.price}</p>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold transition-colors">
                    Book Now
                  </button>
                  <button className="px-3 py-2 rounded-lg bg-white text-gray-600 hover:text-gray-900 border border-gray-200 transition-colors">
                    <MdShare size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="space-y-3">
          {FAVORITE_TOURS.map((tour) => (
            <div key={tour.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <span className="text-4xl">{tour.image}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-gray-900">{tour.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      tour.category === 'Adventure' ? 'bg-orange-100 text-orange-700' :
                      tour.category === 'Beach' ? 'bg-sky-100 text-sky-700' :
                      tour.category === 'Wildlife' ? 'bg-green-100 text-green-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {tour.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MdLocationOn className="text-gray-400" size={14} />
                      {tour.destination}
                    </div>
                    <div className="flex items-center gap-1">
                      <MdAccessTime className="text-gray-400" size={14} />
                      {tour.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      {tour.rating} ({tour.reviews})
                    </div>
                    <div className="text-xs text-gray-500">
                      Viewed {tour.timesViewed}x
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 ml-4">
                <p className="font-bold text-blue-600 text-lg">{tour.price}</p>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                  Book
                </button>
                <button className="text-gray-400 hover:text-gray-600 p-2">
                  <MdMoreVert size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
