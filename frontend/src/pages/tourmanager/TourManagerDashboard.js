import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TourManagerSidebar from './TourManagerSidebar';
import TourManagerTopBar from './TourManagerTopBar';
import OverviewSection from './sections/OverviewSection';
import ActiveToursMapSection from './sections/ActiveToursMapSection';
import ManageToursSection from './sections/ManageToursSection';
import TourManagerProfileSection from './sections/TourManagerProfileSection';
import StayRequestsSection from './sections/StayRequestsSection';
import StayInventorySection from './sections/StayInventorySection';
import StayBoardSection from './sections/StayBoardSection';

export default function TourManagerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const segment = location.pathname.split('/').filter(Boolean).pop();
  const PAGE_META = {
    overview: { title: 'Tour Manager Console', subtitle: 'Curate premium, multi-day journeys' },
    tours: { title: 'Manage Custom Tours', subtitle: 'Detailed standalone itineraries' },
    'stay-requests': { title: 'Stay Requests', subtitle: 'Allocate stays for incoming tour bookings' },
    'stay-inventory': { title: 'Stay Inventory', subtitle: 'Track room stock and availability by property' },
    'stay-board': { title: 'Stay Board', subtitle: 'Monitor stay readiness lifecycle at a glance' },
    map: { title: 'Active Tours Map', subtitle: 'Monitor premium tours in motion' },
    profile: { title: 'Manager Profile', subtitle: 'Account management and settings' },
  };
  const meta = PAGE_META[segment] || PAGE_META.overview;

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#f0fbff]" style={{ fontFamily: '"Space Grotesk", "Sora", "Segoe UI", sans-serif' }}>
      <div className="pointer-events-none absolute -top-28 -right-16 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-sky-300/20 blur-3xl" />

      <div className="relative z-10 flex h-full w-full">
        <TourManagerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-hidden">
          <TourManagerTopBar
            title={meta.title}
            subtitle={meta.subtitle}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main className="flex-1 overflow-y-auto px-6 pb-6 pt-4 bg-gradient-to-b from-white/30 via-transparent to-transparent">
            <Routes>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<OverviewSection />} />
              <Route path="tours" element={<ManageToursSection />} />
              <Route path="stay-requests" element={<StayRequestsSection />} />
              <Route path="stay-inventory" element={<StayInventorySection />} />
              <Route path="stay-board" element={<StayBoardSection />} />
              <Route path="map" element={<ActiveToursMapSection />} />
              <Route path="profile" element={<TourManagerProfileSection />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}
