import { MdLocalTaxi, MdTour, MdPeople, MdBookmark, MdArrowForward, MdAccessTime, MdLocationOn } from 'react-icons/md';
import { useState } from 'react';
import imgSigiriya from '../../../assets/images/Sigiriya.jpg';
import { useTouristEmergency } from '../../../hooks/useTouristAPI';

const STATS = [
  { label: 'Completed Trips', value: '12', icon: MdLocalTaxi, gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20', change: '+2 this month' },
  { label: 'Active Bookings', value: '5', icon: MdBookmark, gradient: 'from-teal-500 to-cyan-500', shadow: 'shadow-teal-500/20', change: '2 upcoming' },
  { label: 'Tours Joined', value: '8', icon: MdTour, gradient: 'from-amber-400 to-orange-500', shadow: 'shadow-orange-500/20', change: 'Top 10% traveler' },
  { label: 'Referrals', value: '3', icon: MdPeople, gradient: 'from-rose-500 to-pink-500', shadow: 'shadow-rose-500/20', change: '150pts earned' },
];

const RECENT_BOOKINGS = [
  { id: '#BK-0001', destination: 'Sigiriya Rock Fortress', date: 'Mar 15, 2026', time: '08:00 AM', status: 'Upcoming', driver: 'Ruwan D.' },
  { id: '#BK-0002', destination: 'Yala National Safari', date: 'Mar 20, 2026', time: '05:30 AM', status: 'Upcoming', driver: 'Kamal P.' },
  { id: '#BK-0003', destination: 'Ella Nine Arch Bridge', date: 'Mar 8, 2026', time: '10:00 AM', status: 'Completed', driver: 'Nilantha S.' },
];

export default function OverviewSection() {
  const { sendSOSAlert, loading: sosLoading } = useTouristEmergency();
  const [sosMessage, setSosMessage] = useState('');

  const getPosition = (options) => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  };

  const mapGeoErrorToMessage = (error) => {
    if (!error) return 'Unable to fetch current location. Please try again.';

    if (error.code === error.PERMISSION_DENIED) {
      return 'Location permission denied. Enable GPS/location access and try again.';
    }
    if (error.code === error.POSITION_UNAVAILABLE) {
      return 'Location unavailable. Please check GPS/network and try again.';
    }
    if (error.code === error.TIMEOUT) {
      return 'Location request timed out. Move to an open area and try again.';
    }
    return 'Unable to fetch current location. Please try again.';
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported on this device/browser.');
    }

    const isSecureContextAllowed = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isSecureContextAllowed) {
      throw new Error('Location access requires HTTPS. Open this app on a secure (https) connection.');
    }

    try {
      // 1) Try high-accuracy live location.
      return await getPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      });
    } catch (firstError) {
      if (firstError.code === firstError.PERMISSION_DENIED) {
        throw new Error(mapGeoErrorToMessage(firstError));
      }

      try {
        // 2) Fallback: relaxed request can succeed faster on unstable GPS.
        return await getPosition({
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 60000
        });
      } catch (secondError) {
        throw new Error(mapGeoErrorToMessage(secondError));
      }
    }
  };

  const handleSOS = async () => {
    try {
      setSosMessage('Collecting your live location...');
      const position = await getCurrentLocation();

      const payload = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        emergencyType: 'Safety',
        note: 'SOS triggered from Tourist Dashboard.'
      };

      const result = await sendSOSAlert(payload);
      setSosMessage(result?.message || 'SOS alert sent to WayGo Admin.');

      const shouldCall = window.confirm('SOS sent to WayGo Admin. Call local emergency hotline now?');
      if (shouldCall) {
        window.location.href = 'tel:119';
      }
    } catch (error) {
      setSosMessage(error.message || 'Failed to send SOS alert. Please try again.');
    }
  };

  return (
    <div className="space-y-8 font-sans animate-fade-in-up pb-10">
      
      {/* Top Bento Grid - Hero & Next Trip */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Dynamic Hero Card */}
        <div className="xl:col-span-2 relative bg-white overflow-hidden rounded-[2rem] border border-stone-200 p-8 sm:p-10 lg:p-12 shadow-[0_8px_30px_rgba(0,0,0,0.04)] group">
          {/* Animated Background Layers */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-100/50 blur-[100px] rounded-full pointer-events-none group-hover:bg-emerald-200/50 transition-colors duration-1000" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-100/50 blur-[100px] rounded-full pointer-events-none group-hover:bg-emerald-200/50 transition-colors duration-1000" />
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200/80 mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20"></span>
                <span className="text-xs font-bold text-stone-600 tracking-wider uppercase">Explorer Level 4</span>
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 text-zinc-900 tracking-tight leading-tight">
                Ready for your next <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">great escape?</span>
              </h2>
              <p className="text-stone-500 font-medium max-w-xl text-lg mb-8 leading-relaxed">
                Discover exclusive undiscovered trails, connect with certified local guides, and manage your incoming urban journeys in one place.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <button className="flex items-center gap-2 bg-zinc-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-[0_8px_20px_rgba(15,23,42,0.2)] hover:shadow-[0_12px_25px_rgba(15,23,42,0.3)] hover:-translate-y-1">
                Explore Top Tours
                <MdArrowForward className="text-xl" />
              </button>
              <button className="px-8 py-4 rounded-2xl font-bold text-stone-700 bg-white hover:bg-stone-50 border-2 border-stone-200 hover:border-stone-300 transition-all duration-300">
                View Travel Map
              </button>
              <button
                onClick={handleSOS}
                disabled={sosLoading}
                className="px-8 py-4 rounded-2xl font-black text-white bg-rose-600 hover:bg-rose-700 border-2 border-rose-500 transition-all duration-300 shadow-[0_10px_25px_rgba(225,29,72,0.35)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sosLoading ? 'Sending SOS...' : 'Emergency SOS'}
              </button>
            </div>
            {sosMessage && (
              <p className="mt-4 text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 max-w-2xl">
                {sosMessage}
              </p>
            )}
          </div>
        </div>

        {/* Feature: Next Trip Countdown */}
        <div className="relative bg-white overflow-hidden rounded-[2rem] border border-stone-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col">
          {/* Top Image Banner */}
          <div 
            className="h-48 w-full bg-cover bg-center group-hover:scale-105 transition-transform duration-700 origin-bottom"
            style={{ backgroundImage: `url(${imgSigiriya})` }} 
          />
          <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-black/50 to-transparent" />
          
          {/* Floating Badges */}
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
            <span className="text-xs font-black text-white uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/30 shadow-sm">
              Up Next
            </span>
            <div className="flex items-center gap-1.5 text-zinc-900 text-sm font-bold bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg">
              <MdAccessTime className="text-emerald-600 text-lg" />
              <span>In 3 days</span>
            </div>
          </div>

          <div className="relative z-10 p-6 flex-1 flex flex-col bg-white -mt-6 rounded-t-[2rem]">
            <div className="mb-auto">
              <h3 className="text-2xl font-black text-zinc-900 leading-tight mb-2 tracking-tight">Sigiriya Rock<br/>Fortress Tour</h3>
              <div className="flex items-center gap-2 text-stone-500">
                <MdLocationOn className="text-rose-500" />
                <span className="text-sm font-semibold">Central Province, LK</span>
              </div>
            </div>

            {/* Driver Card */}
            <div className="mt-6 p-4 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-between group cursor-pointer hover:border-emerald-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                  <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Driver" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">Ruwan D.</p>
                  <p className="text-xs font-semibold text-emerald-600">Your Guide & Driver</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-stone-200 flex items-center justify-center text-stone-400 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-colors">
                <MdArrowForward />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="relative bg-white rounded-[1.5rem] border border-stone-200 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-stone-300 transition-all duration-300 group overflow-hidden">
              <div className="relative z-10 flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${stat.gradient} shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform duration-500`}>
                  <Icon className="text-white text-xl" />
                </div>
                {/* Mini trend indicator */}
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 by-1 rounded-md border border-emerald-100">
                  {stat.change}
                </span>
              </div>
              
              <div className="relative z-10">
                <p className="text-4xl font-black text-zinc-900 mb-1 tracking-tight">{stat.value}</p>
                <p className="text-sm text-stone-500 font-bold uppercase tracking-widest">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Area - Recent Bookings & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bookings List */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-stone-200 p-2 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="px-6 py-5 flex items-center justify-between border-b border-stone-100">
            <h3 className="font-bold text-xl text-zinc-900 tracking-tight">Recent Activity</h3>
            <button className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors bg-emerald-50 px-4 py-2 rounded-xl">View All</button>
          </div>
          
          <div className="p-2 space-y-1">
            {RECENT_BOOKINGS.map((booking) => (
              <div key={booking.id} className="p-4 rounded-2xl hover:bg-stone-50 transition-all duration-300 group cursor-pointer border border-transparent hover:border-stone-200 relative overflow-hidden">
                <div className="flex items-center gap-5 relative z-10">
                  {/* Status Indicator Bar */}
                  <div className={`w-1.5 h-12 rounded-full ${booking.status === 'Upcoming' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-emerald-400'}`} />
                  
                  <div className="flex-1">
                    <p className="font-bold text-zinc-900 text-lg group-hover:text-emerald-600 transition-colors">{booking.destination}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-bold text-stone-600 bg-white border border-stone-200 shadow-sm px-2.5 py-1 rounded-md">{booking.date} • {booking.time}</span>
                      <span className="text-xs font-semibold text-stone-500 hidden sm:inline-block">Driver: {booking.driver}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`text-xs px-4 py-2 rounded-xl font-bold tracking-widest uppercase ${
                      booking.status === 'Upcoming' 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      {booking.status}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-400 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-colors hidden sm:flex">
                      <MdArrowForward className="text-lg" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-zinc-900 rounded-[2rem] border border-stone-800 p-8 flex flex-col justify-center relative overflow-hidden shadow-2xl">
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/10">
            <MdLocalTaxi className="text-white text-2xl" />
          </div>
          
          <h3 className="font-black text-2xl text-white mb-3 tracking-tight relative z-10">Need a reliable ride?</h3>
          <p className="text-stone-400 text-sm font-medium mb-8 relative z-10 leading-relaxed">Our premium fleet is on standby. Book a personal driver instantly for your custom itinerary.</p>
          
          <div className="space-y-3 relative z-10">
            <button className="w-full bg-white text-zinc-900 py-4 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_15px_rgba(255,255,255,0.2)]">
              Book Fleet Now
            </button>
            <button className="w-full bg-transparent hover:bg-white/10 text-white py-4 rounded-xl font-bold transition-all border-2 border-white/20 hover:border-white/40">
              Contact Support
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}