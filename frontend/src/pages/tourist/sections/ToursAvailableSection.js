import { MdStar, MdLocationOn, MdPeople, MdAccessTime, MdFavoriteBorder, MdFavorite } from 'react-icons/md';
import { useState } from 'react';

const AVAILABLE_TOURS = [
  { 
    id: 1, 
    name: 'Sigiriya Rock Climb', 
    destination: 'Sigiriya', 
    price: 'LKR 5,500', 
    rating: 4.8, 
    reviews: 324,
    duration: '4 hours',
    groupSize: '2-8',
    image: '🏔️',
    description: 'Experience the ancient fortress with expert guides'
  },
  { 
    id: 2, 
    name: 'Yala Safari Adventure', 
    destination: 'Yala National Park', 
    price: 'LKR 12,000', 
    rating: 4.9, 
    reviews: 512,
    duration: '6 hours',
    groupSize: '4-10',
    image: '🦁',
    description: 'Wildlife spotting with expert naturalists'
  },
  { 
    id: 3, 
    name: 'Tea Plantation Tour', 
    destination: 'Nuwara Eliya', 
    price: 'LKR 4,200', 
    rating: 4.7, 
    reviews: 289,
    duration: '5 hours',
    groupSize: '2-6',
    image: '🍃',
    description: 'Learn tea production in scenic hill country'
  },
  { 
    id: 4, 
    name: 'Ella Train Journey', 
    destination: 'Ella', 
    price: 'LKR 2,800', 
    rating: 4.6, 
    reviews: 198,
    duration: '3 hours',
    groupSize: '1-20',
    image: '🚂',
    description: 'Scenic train ride through mountain valleys'
  },
  { 
    id: 5, 
    name: 'Galle Fort History Walk', 
    destination: 'Galle', 
    price: 'LKR 3,500', 
    rating: 4.8, 
    reviews: 276,
    duration: '2 hours',
    groupSize: '2-15',
    image: '🏰',
    description: 'Explore historic coastal fortress and colonial architecture'
  },
  { 
    id: 6, 
    name: 'Mirissa Beach Resort', 
    destination: 'Mirissa', 
    price: 'LKR 6,800', 
    rating: 4.9, 
    reviews: 401,
    duration: '1 day',
    groupSize: '2-8',
    image: '🏖️',
    description: 'Beach relaxation with water activities'
  },
];

export default function ToursAvailableSection() {
  const [favorites, setFavorites] = useState(new Set());

  const toggleFavorite = (id) => {
    setFavorites(new Set(favorites.has(id) ? [...favorites].filter(f => f !== id) : [...favorites, id]));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Explore Tours</h2>
        <p className="text-gray-500">Discover amazing experiences across Sri Lanka</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {['All Tours', 'Adventure', 'Cultural', 'Beaches', 'Wildlife', 'Food'].map((filter) => (
          <button key={filter} className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors">
            {filter}
          </button>
        ))}
      </div>

      {/* Tours Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AVAILABLE_TOURS.map((tour) => (
          <div key={tour.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow group">
            {/* Tour Image */}
            <div className="bg-gradient-to-br from-blue-100 to-cyan-100 h-40 flex items-center justify-center relative overflow-hidden">
              <span className="text-6xl">{tour.image}</span>
              <button 
                onClick={() => toggleFavorite(tour.id)}
                className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
              >
                {favorites.has(tour.id) ? (
                  <MdFavorite className="text-red-500 text-lg" />
                ) : (
                  <MdFavoriteBorder className="text-gray-400 text-lg" />
                )}
              </button>
            </div>

            {/* Tour Details */}
            <div className="p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{tour.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{tour.description}</p>

              {/* Location & Duration */}
              <div className="flex items-center gap-4 text-xs text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <MdLocationOn className="text-blue-500" />
                  {tour.destination}
                </div>
                <div className="flex items-center gap-1">
                  <MdAccessTime className="text-orange-500" />
                  {tour.duration}
                </div>
              </div>

              {/* Group Size */}
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-4 pb-4 border-b border-gray-100">
                <MdPeople className="text-emerald-500" />
                {tour.groupSize} people
              </div>

              {/* Rating & Price */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <MdStar key={i} className={i < Math.floor(tour.rating) ? 'text-yellow-400' : 'text-gray-300'} size={16} />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{tour.rating}</span>
                  <span className="text-xs text-gray-500">({tour.reviews})</span>
                </div>
              </div>

              {/* Price & Button */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xl font-bold text-blue-600">{tour.price}</p>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                  Book Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
