const ALL_TOURS = [
  { title: 'Sigiriya Rock & Dambulla Cave', destination: 'Sigiriya', duration: '2 Days', price: 'LKR 12,500', status: 'Active',   bookings: 38 },
  { title: 'Yala National Park Safari',     destination: 'Yala',     duration: '3 Days', price: 'LKR 28,000', status: 'Active',   bookings: 22 },
  { title: 'Ella Hill Country Explorer',    destination: 'Ella',     duration: '4 Days', price: 'LKR 18,500', status: 'Active',   bookings: 55 },
  { title: 'Galle Fort Heritage Walk',      destination: 'Galle',    duration: '1 Day',  price: 'LKR 5,000',  status: 'Inactive', bookings: 0  },
];

export default function ToursSection() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl font-medium transition-colors">
          + Add Tour
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ALL_TOURS.map((t) => (
          <div key={t.title} className="bg-white/85 backdrop-blur-sm rounded-3xl shadow-[0_20px_45px_-30px_rgba(30,64,175,0.22)] border border-white/70 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 leading-snug">{t.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t.destination} · {t.duration}</p>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${t.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-slate-600'}`}>
                {t.status}
              </span>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-500">Price per person</p>
                <p className="font-bold text-slate-900">{t.price}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Bookings</p>
                <p className="font-bold text-blue-600">{t.bookings}</p>
              </div>
              <div className="flex gap-2">
                <button className="text-xs border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50/80 transition-colors">Edit</button>
                <button className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
