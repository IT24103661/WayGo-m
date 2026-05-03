import { useMemo, useState } from 'react';
import { MdSearch, MdArrowForward, MdStar, MdLocationOn, MdAccessTime, MdClose } from 'react-icons/md';
import { useTouristBookings } from '../../../hooks/useTouristAPI';

import imgSigiriya from '../../../assets/images/Sigiriya.jpg';
import imgYala from '../../../assets/images/Yala.jpg';
import imgElla from '../../../assets/images/Ella.jpg';
import imgGalleFort from '../../../assets/images/Galle Fort.jpg';

const TOURS = [
  {
    id: 1,
    title: 'Sigiriya Rock & Dambulla Cave Explorer',
    destination: 'Sigiriya, CP',
    durationDays: 2,
    basePrice: 12500,
    rating: 4.8,
    reviews: 245,
    image: imgSigiriya,
    available: 8,
    includesTag: 'Tour + Stay + Meals'
  },
  {
    id: 2,
    title: 'Yala National Park Safari Adventure',
    destination: 'Yala, SP',
    durationDays: 3,
    basePrice: 28000,
    rating: 4.9,
    reviews: 312,
    image: imgYala,
    available: 5,
    includesTag: 'Tour + Stay'
  },
  {
    id: 3,
    title: 'Ella Nine Arch Bridge & Hill Country',
    destination: 'Ella, UV',
    durationDays: 4,
    basePrice: 18500,
    rating: 4.7,
    reviews: 189,
    image: imgElla,
    available: 12,
    includesTag: 'Tour + Stay + Meals'
  },
  {
    id: 4,
    title: 'Galle Fort Heritage Night Walk',
    destination: 'Galle, SP',
    durationDays: 1,
    basePrice: 5000,
    rating: 4.6,
    reviews: 156,
    image: imgGalleFort,
    available: 20,
    includesTag: 'Tour Only'
  }
];

const ROOM_OPTIONS = {
  Standard: { rate: 6500, capacity: 2 },
  Deluxe: { rate: 9800, capacity: 3 },
  Family: { rate: 14200, capacity: 4 },
  Suite: { rate: 19800, capacity: 5 }
};

const MEAL_RATES = {
  'No Meals': 0,
  Breakfast: 1200,
  'Half Board': 2800,
  'Full Board': 4200
};

const EXTRA_PRICES = {
  airportPickup: 4500,
  privateGuide: 9000,
  safariPass: 6500
};

const FULL_WIZARD_STEPS = [
  'Travel Details',
  'Room Selection',
  'Meal Plan',
  'Extras',
  'Review & Confirm'
];

const TOUR_ONLY_WIZARD_STEPS = [
  'Travel Details',
  'Meal Plan',
  'Extras',
  'Review & Confirm'
];

const initialWizardState = {
  checkInDate: '',
  checkOutDate: '',
  adults: 2,
  children: 0,
  roomType: 'Standard',
  roomCount: 1,
  mealPlan: 'No Meals',
  dietPreference: '',
  extras: {
    airportPickup: false,
    privateGuide: false,
    safariPass: false
  }
};

const getNights = (checkInDate, checkOutDate) => {
  if (!checkInDate || !checkOutDate) return 1;
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 1;
};

const formatLKR = (value) => `LKR ${Number(value || 0).toLocaleString()}`;

const getTodayDateInput = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

export default function ToursSection() {
  const { createBooking } = useTouristBookings();
  const [selectedTour, setSelectedTour] = useState(null);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizard, setWizard] = useState(initialWizardState);
  const [bookingStatus, setBookingStatus] = useState({});
  const [message, setMessage] = useState('');
  const todayDate = getTodayDateInput();

  const isTourOnly = selectedTour?.includesTag === 'Tour Only';
  const wizardSteps = isTourOnly ? TOUR_ONLY_WIZARD_STEPS : FULL_WIZARD_STEPS;

  const pricing = useMemo(() => {
    if (!selectedTour) {
      return {
        nights: 1,
        guests: 2,
        tourBase: 0,
        roomCost: 0,
        mealCost: 0,
        extrasCost: 0,
        finalTotal: 0,
        capacityWarning: ''
      };
    }

    const nights = getNights(wizard.checkInDate, wizard.checkOutDate);
    const guests = Number(wizard.adults || 0) + Number(wizard.children || 0);
    const roomMeta = ROOM_OPTIONS[wizard.roomType] || ROOM_OPTIONS.Standard;
    const roomCost = isTourOnly ? 0 : roomMeta.rate * nights * Number(wizard.roomCount || 1);
    const mealCost = (MEAL_RATES[wizard.mealPlan] || 0) * nights * Math.max(1, guests);
    const extrasCost =
      (wizard.extras.airportPickup ? EXTRA_PRICES.airportPickup : 0) +
      (wizard.extras.privateGuide ? EXTRA_PRICES.privateGuide : 0) +
      (wizard.extras.safariPass ? EXTRA_PRICES.safariPass : 0);

    const tourBase = selectedTour.basePrice;
    const finalTotal = tourBase + roomCost + mealCost + extrasCost;
    const maxCapacity = roomMeta.capacity * Number(wizard.roomCount || 1);
    const capacityWarning = !isTourOnly && guests > maxCapacity
      ? `Guest count (${guests}) exceeds room capacity (${maxCapacity}).`
      : '';

    return {
      nights,
      guests,
      tourBase,
      roomCost,
      mealCost,
      extrasCost,
      finalTotal,
      capacityWarning
    };
  }, [selectedTour, wizard, isTourOnly]);

  const openCustomize = (tour) => {
    setSelectedTour(tour);
    setWizardStep(0);
    setWizard({
      ...initialWizardState,
      checkInDate: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
      checkOutDate: new Date(Date.now() + 86400000 * (7 + Math.max(1, tour.durationDays - 1))).toISOString().slice(0, 10)
    });
    setMessage('');
  };

  const closeCustomize = () => {
    setSelectedTour(null);
    setWizardStep(0);
    setWizard(initialWizardState);
  };

  const handleConfirmBooking = async () => {
    if (!selectedTour) return;
    if (!wizard.checkInDate || !wizard.checkOutDate) {
      setMessage('Please select both check-in and check-out dates.');
      return;
    }
    if (wizard.checkInDate < todayDate || wizard.checkOutDate < todayDate) {
      setMessage('Check-in and check-out must be today or future dates.');
      return;
    }
    if (wizard.checkOutDate <= wizard.checkInDate) {
      setMessage('Check-out date must be after check-in date.');
      return;
    }
    if (pricing.capacityWarning) {
      setMessage(pricing.capacityWarning);
      return;
    }

    try {
      setBookingStatus((prev) => ({ ...prev, [selectedTour.id]: 'loading' }));
      setMessage('');

      await createBooking({
        tourId: selectedTour.id,
        date: wizard.checkInDate,
        members: pricing.guests,
        pickupLocation: selectedTour.destination,
        totalPrice: pricing.finalTotal,
        packageOptions: {
          tourTitle: selectedTour.title,
          checkInDate: wizard.checkInDate,
          checkOutDate: wizard.checkOutDate,
          adults: Number(wizard.adults || 0),
          children: Number(wizard.children || 0),
          nights: pricing.nights,
          roomType: isTourOnly ? 'Standard' : wizard.roomType,
          roomCount: isTourOnly ? 0 : Number(wizard.roomCount || 1),
          mealPlan: wizard.mealPlan,
          dietPreference: wizard.dietPreference,
          extras: {
            airportPickup: wizard.extras.airportPickup,
            privateGuide: wizard.extras.privateGuide,
            activityAddons: wizard.extras.safariPass ? ['Safari Pass'] : []
          },
          pricing: {
            tourBase: pricing.tourBase,
            roomCost: pricing.roomCost,
            mealCost: pricing.mealCost,
            extrasCost: pricing.extrasCost,
            finalTotal: pricing.finalTotal
          }
        }
      });

      setBookingStatus((prev) => ({ ...prev, [selectedTour.id]: 'success' }));
      setMessage('Package booked successfully. You can view full details in My Bookings.');
      closeCustomize();
    } catch (err) {
      setBookingStatus((prev) => ({ ...prev, [selectedTour.id]: 'error' }));
      setMessage(err.message || 'Failed to book package.');
    }
  };

  return (
    <div className="space-y-8 font-sans animate-fade-in-up pb-10">
      <div className="bg-white rounded-[2rem] border border-stone-200 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row gap-4 lg:items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 w-full lg:w-1/2">
          <div className="flex items-center px-5 py-3 bg-stone-50 rounded-2xl border border-stone-200 focus-within:border-cyan-500/50 focus-within:ring-4 focus-within:ring-cyan-500/10 transition-all duration-300">
            <MdSearch className="text-stone-400 text-2xl mr-3" />
            <input
              type="text"
              placeholder="Search destinations or packages"
              className="bg-transparent border-none outline-none text-zinc-900 placeholder-stone-400 font-medium w-full text-lg"
            />
          </div>
        </div>

        <p className="text-sm font-semibold text-cyan-800/80">Choose a place, then customize rooms, meals, and extras.</p>
      </div>

      {message && <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-800">{message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {TOURS.map((tour) => (
          <div key={tour.id} className="group relative bg-white rounded-[2rem] border border-stone-200 overflow-hidden hover:border-cyan-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-500 flex flex-col h-full">
            <div className="relative h-64 overflow-hidden">
              <img src={tour.image} alt={tour.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              <div className="absolute top-4 left-4 z-20 flex gap-2">
                <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md border border-white/50 rounded-xl text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MdStar className="text-amber-500 text-base" />
                  {tour.rating}
                </span>
              </div>

              <div className="absolute top-4 right-4 z-20">
                <span className={`px-3 py-1.5 bg-white/90 backdrop-blur-md border border-white/50 rounded-xl text-xs font-black uppercase tracking-wider ${tour.available < 10 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {tour.available} Rooms Left
                </span>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="mb-auto">
                <div className="flex items-center gap-3 text-stone-500 mb-3">
                  <div className="flex items-center gap-1 text-sm font-semibold">
                    <MdLocationOn className="text-rose-500" />
                    {tour.destination}
                  </div>
                  <span className="w-1 h-1 rounded-full bg-stone-300" />
                  <div className="flex items-center gap-1 text-sm font-semibold">
                    <MdAccessTime className="text-cyan-600" />
                    {tour.durationDays} {tour.durationDays > 1 ? 'Days' : 'Day'}
                  </div>
                </div>

                <h3 className="text-xl font-black text-zinc-900 leading-tight mb-2 group-hover:text-cyan-700 transition-colors">
                  {tour.title}
                </h3>
                <p className="text-stone-500 text-sm font-medium mb-2">Based on {tour.reviews} verified reviews</p>
                <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200">
                  {tour.includesTag}
                </span>
              </div>

              <div className="flex items-end justify-between pt-6 border-t border-stone-100">
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Base Price From</p>
                  <p className="text-2xl font-black text-zinc-900">{formatLKR(tour.basePrice)}</p>
                </div>

                <button
                  onClick={() => openCustomize(tour)}
                  className="flex items-center gap-2 bg-cyan-50 hover:bg-cyan-700 text-cyan-700 hover:text-white px-5 py-3 rounded-xl font-bold transition-all duration-300 border border-cyan-200 hover:border-cyan-700"
                >
                  <span>
                    {bookingStatus[tour.id] === 'loading'
                      ? 'Booking...'
                      : bookingStatus[tour.id] === 'success'
                        ? 'Booked'
                        : 'Continue to Customize'}
                  </span>
                  <MdArrowForward className="text-lg" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedTour && (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-zinc-950/45 px-4 pt-12 sm:pt-16 overflow-y-auto" onClick={closeCustomize}>
          <div className="w-full max-w-3xl rounded-3xl border border-cyan-100 bg-white p-6 shadow-[0_30px_60px_-30px_rgba(8,145,178,0.55)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-xl font-bold text-cyan-950">Customize Package</h4>
                <p className="text-sm text-cyan-700/80 mt-1">{selectedTour.title}</p>
              </div>
              <button onClick={closeCustomize} className="p-2 rounded-xl border border-cyan-200 text-cyan-700 hover:bg-cyan-50">
                <MdClose className="text-lg" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {wizardSteps.map((label, index) => (
                <button
                  key={label}
                  onClick={() => setWizardStep(index)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${wizardStep === index ? 'bg-cyan-700 text-white border-cyan-700' : 'bg-white text-cyan-700 border-cyan-200'}`}
                >
                  {index + 1}. {label}
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4">
              {wizardStep === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-cyan-900 mb-1">Check-in Date</label>
                    <input type="date" value={wizard.checkInDate} min={todayDate} onChange={(e) => setWizard((prev) => ({ ...prev, checkInDate: e.target.value }))} className="w-full rounded-xl border border-cyan-200 px-3 py-2.5" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-cyan-900 mb-1">Check-out Date</label>
                    <input type="date" value={wizard.checkOutDate} min={wizard.checkInDate || todayDate} onChange={(e) => setWizard((prev) => ({ ...prev, checkOutDate: e.target.value }))} className="w-full rounded-xl border border-cyan-200 px-3 py-2.5" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-cyan-900 mb-1">Adults</label>
                    <input type="number" min="1" value={wizard.adults} onChange={(e) => setWizard((prev) => ({ ...prev, adults: Number(e.target.value || 1) }))} className="w-full rounded-xl border border-cyan-200 px-3 py-2.5" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-cyan-900 mb-1">Children</label>
                    <input type="number" min="0" value={wizard.children} onChange={(e) => setWizard((prev) => ({ ...prev, children: Number(e.target.value || 0) }))} className="w-full rounded-xl border border-cyan-200 px-3 py-2.5" />
                  </div>
                </div>
              )}

              {wizardStep === 1 && !isTourOnly && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-cyan-900 mb-1">Room Type</label>
                    <select value={wizard.roomType} onChange={(e) => setWizard((prev) => ({ ...prev, roomType: e.target.value }))} className="w-full rounded-xl border border-cyan-200 px-3 py-2.5">
                      {Object.keys(ROOM_OPTIONS).map((type) => (
                        <option key={type} value={type}>{type} ({formatLKR(ROOM_OPTIONS[type].rate)} / night)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-cyan-900 mb-1">Number of Rooms</label>
                    <input type="number" min="1" value={wizard.roomCount} onChange={(e) => setWizard((prev) => ({ ...prev, roomCount: Number(e.target.value || 1) }))} className="w-full rounded-xl border border-cyan-200 px-3 py-2.5" />
                  </div>
                  {pricing.capacityWarning && (
                    <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
                      {pricing.capacityWarning}
                    </div>
                  )}
                </div>
              )}

              {((wizardStep === 2 && !isTourOnly) || (wizardStep === 1 && isTourOnly)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-cyan-900 mb-1">Meal Plan</label>
                    <select value={wizard.mealPlan} onChange={(e) => setWizard((prev) => ({ ...prev, mealPlan: e.target.value }))} className="w-full rounded-xl border border-cyan-200 px-3 py-2.5">
                      {Object.keys(MEAL_RATES).map((plan) => (
                        <option key={plan} value={plan}>{plan}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-cyan-900 mb-1">Diet Preference (optional)</label>
                    <input type="text" value={wizard.dietPreference} onChange={(e) => setWizard((prev) => ({ ...prev, dietPreference: e.target.value }))} placeholder="Veg / Vegan / Halal" className="w-full rounded-xl border border-cyan-200 px-3 py-2.5" />
                  </div>
                </div>
              )}

              {((wizardStep === 3 && !isTourOnly) || (wizardStep === 2 && isTourOnly)) && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="checkbox" checked={wizard.extras.airportPickup} onChange={(e) => setWizard((prev) => ({ ...prev, extras: { ...prev.extras, airportPickup: e.target.checked } }))} />
                    Airport Pickup ({formatLKR(EXTRA_PRICES.airportPickup)})
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="checkbox" checked={wizard.extras.privateGuide} onChange={(e) => setWizard((prev) => ({ ...prev, extras: { ...prev.extras, privateGuide: e.target.checked } }))} />
                    Private Guide ({formatLKR(EXTRA_PRICES.privateGuide)})
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="checkbox" checked={wizard.extras.safariPass} onChange={(e) => setWizard((prev) => ({ ...prev, extras: { ...prev.extras, safariPass: e.target.checked } }))} />
                    Activity Add-on: Safari Pass ({formatLKR(EXTRA_PRICES.safariPass)})
                  </label>
                </div>
              )}

              {((wizardStep === 4 && !isTourOnly) || (wizardStep === 3 && isTourOnly)) && (
                <div className="space-y-2 text-sm text-slate-700">
                  <p><span className="font-semibold">Tour Base:</span> {formatLKR(pricing.tourBase)}</p>
                  <p><span className="font-semibold">Room Cost:</span> {formatLKR(pricing.roomCost)} ({pricing.nights} night(s))</p>
                  <p><span className="font-semibold">Meal Cost:</span> {formatLKR(pricing.mealCost)}</p>
                  <p><span className="font-semibold">Extras:</span> {formatLKR(pricing.extrasCost)}</p>
                  <p className="text-base font-black text-cyan-900 pt-2 border-t border-cyan-200">Final Total: {formatLKR(pricing.finalTotal)}</p>
                  <p className="text-xs text-slate-500 pt-2">Policy: Free cancellation up to 24h before check-in.</p>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={() => setWizardStep((prev) => Math.max(0, prev - 1))}
                disabled={wizardStep === 0}
                className="px-4 py-2 rounded-xl border border-cyan-200 text-cyan-700 bg-white hover:bg-cyan-50 disabled:opacity-50"
              >
                Back
              </button>

              {wizardStep < wizardSteps.length - 1 ? (
                <button
                  onClick={() => setWizardStep((prev) => Math.min(wizardSteps.length - 1, prev + 1))}
                  className="px-4 py-2 rounded-xl bg-cyan-700 text-white hover:bg-cyan-800 font-semibold"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleConfirmBooking}
                  className="px-4 py-2 rounded-xl bg-cyan-700 text-white hover:bg-cyan-800 font-semibold"
                >
                  Confirm Booking
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
