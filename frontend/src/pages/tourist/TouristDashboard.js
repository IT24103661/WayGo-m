import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TouristSidebar from './TouristSidebar';
import TouristTopBar from './TouristTopBar';
import OverviewSection from './sections/OverviewSection';
import ProfileSection from './sections/ProfileSection';
import ToursSection from './sections/ToursSection';
import BookingsSection from './sections/BookingsSection';
import FleetBookingsSection from './sections/FleetBookingsSection';
import ReviewsSection from './sections/ReviewsSection';
import NotificationsSection from './sections/NotificationsSection';
import SupportSection from './sections/SupportSection';

export default function TouristDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const segment = window.location.pathname.split('/').filter(Boolean).pop();
  const PAGE_META = {
    overview: { title: 'Dashboard', subtitle: 'Welcome back to your travel hub!' },
    tours: { title: 'Browse Tours', subtitle: 'Discover amazing travel packages' },
    bookings: { title: 'My Bookings', subtitle: 'Manage your upcoming trips' },
    fleetbookings: { title: 'Fleet Bookings', subtitle: 'Create and manage your fleet rides' },
    reviews: { title: 'My Reviews', subtitle: 'Share your travel experiences' },
    notifications: { title: 'Notifications', subtitle: 'Stay updated with your bookings' },
    support: { title: 'Support', subtitle: 'Get help whenever you need it' },
  };
  const meta = PAGE_META[segment] || PAGE_META.overview;

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#f0fbff]" style={{ fontFamily: '"Space Grotesk", "Sora", "Segoe UI", sans-serif' }}>
      {/* Background Blobs */}
      <div className="pointer-events-none absolute -top-28 -right-16 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-sky-300/20 blur-3xl" />

      <div className="relative z-10 flex h-full w-full">
        <TouristSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TouristTopBar
            title={meta.title}
            subtitle={meta.subtitle}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main className="flex-1 overflow-y-auto px-6 pb-10 bg-gradient-to-b from-white/30 via-transparent to-transparent">
            <Routes>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<OverviewSection />} />
              <Route path="profile" element={<ProfileSection />} />
              <Route path="tours" element={<ToursSection />} />
              <Route path="bookings" element={<BookingsSection />} />
              <Route path="fleetbookings" element={<FleetBookingsSection />} />
              <Route path="reviews" element={<ReviewsSection />} />
              <Route path="notifications" element={<NotificationsSection />} />
              <Route path="support" element={<SupportSection />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}