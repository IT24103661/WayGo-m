import { Link } from 'react-router-dom';
import {
  FaCar, FaMapMarkedAlt, FaStar, FaArrowRight, FaCheckCircle,
  FaGlobeAmericas, FaHeadset, FaShieldAlt,
} from 'react-icons/fa';
import {
  MdDirectionsCar, MdTour, MdStar, MdArrowForward,
} from 'react-icons/md';
import { HiLocationMarker } from 'react-icons/hi';

/* ─── DATA ─── */
const stats = [
  { value: '50K+', label: 'Happy Travelers' },
  { value: '200+', label: 'Destinations' },
  { value: '1,200+', label: 'Expert Drivers' },
  { value: '4.9★', label: 'Average Rating' },
];

const services = [
  {
    icon: <MdDirectionsCar size={32} />,
    title: 'Taxi Rides',
    desc: 'Instant, comfortable rides with professional vetted drivers available 24/7. Track your trip in real time.',
    color: 'from-blue-500 to-blue-700',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    to: '/taxi',
  },
  {
    icon: <MdTour size={32} />,
    title: 'Tour Packages',
    desc: 'Curated multi-day itineraries with local experts. Hotels, transport, and unforgettable experiences included.',
    color: 'from-orange-400 to-orange-600',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    to: '/tours',
  },
  {
    icon: <FaGlobeAmericas size={32} />,
    title: 'Group Travel',
    desc: "Seamless coordination for corporate trips, school excursions, and friends' adventures.",
    color: 'from-emerald-500 to-emerald-700',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    to: '/tours',
  },
  {
    icon: <FaShieldAlt size={32} />,
    title: 'Safe & Insured',
    desc: 'Every booking is protected. Verified drivers, insured vehicles, 24/7 emergency support.',
    color: 'from-purple-500 to-purple-700',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    to: '/about',
  },
];

const tourPackages = [
  {
    image:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    badge: 'Best Seller',
    badgeColor: 'bg-accent-500',
    title: 'Swiss Alps Adventure',
    location: 'Switzerland',
    days: '7 Days',
    rating: 4.9,
    reviews: 312,
    price: 2199,
  },
  {
    image:
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80',
    badge: 'New',
    badgeColor: 'bg-emerald-500',
    title: 'Bali Cultural Escape',
    location: 'Indonesia',
    days: '5 Days',
    rating: 4.8,
    reviews: 204,
    price: 1349,
  },
  {
    image:
      'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=600&q=80',
    badge: 'Popular',
    badgeColor: 'bg-brand-600',
    title: 'Sahara Desert Trek',
    location: 'Morocco',
    days: '6 Days',
    rating: 4.7,
    reviews: 179,
    price: 1599,
  },
];

const steps = [
  {
    step: '01',
    icon: <FaMapMarkedAlt size={24} />,
    title: 'Choose Your Adventure',
    desc: 'Browse our curated tour packages or book a taxi ride — whatever you need.',
  },
  {
    step: '02',
    icon: <FaCheckCircle size={24} />,
    title: 'Book Instantly',
    desc: 'Secure your spot in seconds with our seamless booking and payment flow.',
  },
  {
    step: '03',
    icon: <FaCar size={24} />,
    title: 'Travel with Ease',
    desc: 'A professional driver or tour guide meets you and takes you from start to finish.',
  },
  {
    step: '04',
    icon: <FaStar size={24} />,
    title: 'Share Your Story',
    desc: 'Rate your experience and inspire the next traveler on their WayGo journey.',
  },
];

const testimonials = [
  {
    name: 'Sophia L.',
    role: 'Solo Traveler',
    avatar:
      'https://randomuser.me/api/portraits/women/44.jpg',
    text: 'WayGo made my solo trip to Bali completely stress-free. The driver was waiting at the airport and the tour itinerary was flawless. Highly recommend!',
    stars: 5,
  },
  {
    name: 'James K.',
    role: 'Business Traveler',
    avatar:
      'https://randomuser.me/api/portraits/men/32.jpg',
    text: 'I use WayGo taxi service every week for client pickups. Punctual, professional, and the app is incredibly smooth. Best service in the city.',
    stars: 5,
  },
  {
    name: 'Aisha R.',
    role: 'Family Vacationer',
    avatar:
      'https://randomuser.me/api/portraits/women/68.jpg',
    text: 'Took the Swiss Alps tour with my family of four. Every detail was handled — hotels, transport, guided hikes. Absolutely magical experience.',
    stars: 5,
  },
];

/* ─── COMPONENT ─── */
export default function HomePage() {
  return (
    <div className="overflow-x-hidden">
      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/85 via-brand-800/70 to-gray-900/80" />

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto pt-20">
          <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white text-xs font-semibold px-4 py-2 rounded-full border border-white/20 mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Trusted by 50,000+ travelers worldwide
          </span>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
            Your Journey,{' '}
            <span className="bg-gradient-to-r from-accent-400 to-yellow-300 bg-clip-text text-transparent">
              Perfectly
            </span>{' '}
            Managed.
          </h1>

          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            WayGo connects you with expert tour guides and professional drivers.
            Whether you need a quick ride or a dream vacation, we've got you covered.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            <Link
              to="/tours"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 hover:-translate-y-1"
            >
              Explore Tours <FaArrowRight size={14} />
            </Link>
            <Link
              to="/taxi"
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/30 text-white font-bold text-base px-8 py-4 rounded-2xl transition-all duration-200 hover:-translate-y-1"
            >
              <FaCar size={16} /> Book a Taxi
            </Link>
          </div>

          {/* Quick Search Bar */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 max-w-3xl mx-auto flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-3 bg-white rounded-xl px-4 py-3">
              <HiLocationMarker className="text-brand-600 shrink-0" size={20} />
              <input
                type="text"
                placeholder="Where do you want to go?"
                className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
              />
            </div>
            <button className="bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all duration-200 whitespace-nowrap">
              Search Now
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce">
          <div className="w-1 h-6 bg-white/40 rounded-full" />
          <div className="w-1 h-3 bg-white/20 rounded-full" />
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {stats.map((s) => (
              <div key={s.label} className="p-4">
                <p className="text-4xl font-black text-brand-700 mb-1">{s.value}</p>
                <p className="text-sm text-gray-500 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Heading */}
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-accent-500 mb-3 block">
              What We Offer
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent">
                Travel Better
              </span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              From spontaneous taxi rides to fully-planned multi-day tours, WayGo
              handles the logistics so you can focus on the memories.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((svc) => (
              <Link
                key={svc.title}
                to={svc.to}
                className="group bg-white rounded-2xl p-7 shadow-sm hover:shadow-xl border border-gray-100 card-hover flex flex-col"
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${svc.color} flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform duration-300`}
                >
                  {svc.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{svc.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed flex-1">{svc.desc}</p>
                <div className={`flex items-center gap-1 mt-4 text-sm font-semibold ${svc.text}`}>
                  Learn more <MdArrowForward size={16} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOUR PACKAGES ── */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-14 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-accent-500 mb-3 block">
                Tour Packages
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900">
                Top Destinations
              </h2>
            </div>
            <Link
              to="/tours"
              className="self-start sm:self-auto inline-flex items-center gap-2 text-brand-700 font-semibold text-sm hover:gap-3 transition-all"
            >
              View all packages <FaArrowRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tourPackages.map((pkg) => (
              <Link
                to="/tours"
                key={pkg.title}
                className="group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl border border-gray-100 card-hover"
              >
                <div className="relative overflow-hidden h-56">
                  <img
                    src={pkg.image}
                    alt={pkg.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <span
                    className={`absolute top-4 left-4 ${pkg.badgeColor} text-white text-xs font-bold px-3 py-1.5 rounded-full`}
                  >
                    {pkg.badge}
                  </span>
                  <div className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                    {pkg.days}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-1 text-gray-400 text-xs mb-2">
                    <HiLocationMarker className="text-accent-500" />
                    {pkg.location}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{pkg.title}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm">
                      <MdStar className="text-yellow-400" />
                      <span className="font-semibold text-gray-800">{pkg.rating}</span>
                      <span className="text-gray-400">({pkg.reviews})</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400">From</span>
                      <p className="text-xl font-black text-brand-700">
                        ${pkg.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-gradient-to-br from-brand-900 via-brand-800 to-gray-900 py-24 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-accent-500/10 rounded-full" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-accent-400 mb-3 block">
              How It Works
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Travel in 4 Simple Steps
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              From browsing to arriving at your destination — it's effortless with WayGo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={step.step} className="relative text-center">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[calc(50%+40px)] right-0 h-px border-t-2 border-dashed border-white/20" />
                )}
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 border border-white/20 rounded-2xl mb-5 text-white mx-auto">
                  {step.icon}
                </div>
                <span className="block text-5xl font-black text-white/10 -mt-2 mb-2 select-none">
                  {step.step}
                </span>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-accent-500 mb-3 block">
              Testimonials
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900">
              What Our Travelers Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl border border-gray-100 card-hover"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <MdStar key={i} className="text-yellow-400" size={18} />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-brand-100"
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl p-12 relative overflow-hidden shadow-2xl">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-accent-500/20 rounded-full" />
            <div className="relative z-10">
              <FaHeadset size={40} className="text-white/80 mx-auto mb-4" />
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                Ready to Start Your Journey?
              </h2>
              <p className="text-white/70 mb-8 max-w-lg mx-auto">
                Join over 50,000 happy travelers. Create your free account and
                unlock exclusive deals today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-white text-brand-700 font-bold px-8 py-4 rounded-2xl hover:bg-gray-100 transition-all duration-200 hover:-translate-y-1 shadow-lg"
                >
                  Create Free Account <FaArrowRight size={14} />
                </Link>
                <Link
                  to="/tours"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-8 py-4 rounded-2xl transition-all duration-200 hover:-translate-y-1"
                >
                  Browse Tours
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
