import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import FleetManagerSidebar from './FleetManagerSidebar';
import FleetManagerTopBar from './FleetManagerTopBar';
import InventorySection from './sections/InventorySection';
import AvailableVehiclesSection from './sections/AvailableVehiclesSection';
import ServiceDueSection from './sections/ServiceDueSection';
import FleetBookingsSection from './sections/FleetBookingsSection';
import NotificationsSection from './sections/NotificationsSection';
import SalariesSection from './sections/SalariesSection';
import DriversSection from './sections/DriversSection';
import ProfileSection from './sections/ProfileSection';
import useMobileDrawerLock from '../../hooks/useMobileDrawerLock';

export default function FleetManagerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  useMobileDrawerLock(sidebarOpen);

  const segment = location.pathname.split('/').filter(Boolean).pop();
  const PAGE_META = {
    inventory: { title: 'Vehicle Inventory', subtitle: 'Track all fleet vehicles' },
    available: { title: 'Available Vehicles', subtitle: 'Vehicles ready for trip assignment' },
    fleetbookings: { title: 'Fleet Bookings', subtitle: 'Manage tourist fleet ride requests' },
    service: { title: 'Service Due', subtitle: 'Maintenance and oil change alerts' },
    notifications: { title: 'Booking Notifications', subtitle: 'Tourist booking alerts for fleet operations' },
    drivers: { title: 'Drivers', subtitle: 'Add and view manually managed drivers' },
    salaries: { title: 'Driver Salaries', subtitle: 'Manage and pay driver monthly salaries' },
    profile: { title: 'Profile', subtitle: 'Manage fleet manager details' },
  };
  const meta = PAGE_META[segment] || PAGE_META.inventory;
  return (
    <div className="relative flex h-[100dvh] min-h-[100dvh] overflow-hidden bg-[#f0fbff]" style={{ fontFamily: '"Space Grotesk", "Sora", "Segoe UI", sans-serif' }}>
      <div className="pointer-events-none absolute -top-28 -right-16 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-sky-300/20 blur-3xl" />
      <FleetManagerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-hidden">
        <FleetManagerTopBar
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuClick={() => setSidebarOpen(true)}
          segment={segment}
        />
        <main className="wg-mobile-main flex-1 overflow-y-auto px-3 pb-6 pt-3 sm:px-6 sm:pt-4 bg-gradient-to-b from-white/30 via-transparent to-transparent">
          <Routes>
            <Route index element={<Navigate to="inventory" replace />} />
            <Route path="overview" element={<Navigate to="/dashboard/fleetmanager/inventory" replace />} />
            <Route path="inventory" element={<InventorySection />} />
            <Route path="available" element={<AvailableVehiclesSection />} />
            <Route path="fleetbookings" element={<FleetBookingsSection />} />
            <Route path="service" element={<ServiceDueSection />} />
            <Route path="notifications" element={<NotificationsSection />} />
            <Route path="drivers" element={<DriversSection />} />
            <Route path="salaries" element={<SalariesSection />} />
            <Route path="profile" element={<ProfileSection />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
