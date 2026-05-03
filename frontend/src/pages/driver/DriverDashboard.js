import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import DriverSidebar from './DriverSidebar';
import DriverTopBar from './DriverTopBar';
import OverviewSection from './sections/OverviewSection';
import PendingRequestsSection from './sections/PendingRequestsSection';
import ItinerariesSection from './sections/ItinerariesSection';
import SupportSection from './sections/SupportSection';
import SettingsSection from './sections/SettingsSection';
import useMobileDrawerLock from '../../hooks/useMobileDrawerLock';

export default function DriverDashboard() {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const location = useLocation();
	useMobileDrawerLock(sidebarOpen);

	const segment = location.pathname.split('/').filter(Boolean).pop();
	const PAGE_META = {
		overview: { title: 'Driver Dashboard', subtitle: 'Manage your availability and jobs' },
		settings: { title: 'My Profile', subtitle: 'Update your driver profile' },
		requests: { title: 'Active Requests', subtitle: 'Taxi rides waiting for acceptance' },
		itineraries: { title: 'Upcoming Itineraries', subtitle: 'Pre-booked tours and schedules' },
		support: { title: 'Support', subtitle: 'Get help and report issues' },
	};
	const meta = PAGE_META[segment] || PAGE_META.overview;
	return (
		<div className="relative flex h-[100dvh] min-h-[100dvh] overflow-hidden bg-[#f0fbff]" style={{ fontFamily: '"Space Grotesk", "Sora", "Segoe UI", sans-serif' }}>
			<div className="pointer-events-none absolute -top-28 -right-16 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
			<div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-sky-300/20 blur-3xl" />
			<div className="relative z-10 flex h-full w-full">
				<DriverSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

				<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
					<DriverTopBar
						title={meta.title}
						subtitle={meta.subtitle}
						onMenuClick={() => setSidebarOpen(true)}
					/>
					<main className="wg-mobile-main flex-1 overflow-y-auto px-3 pb-10 bg-gradient-to-b from-white/30 via-transparent to-transparent sm:px-6">
						<Routes>
							<Route index element={<Navigate to="overview" replace />} />
							<Route path="overview" element={<OverviewSection />} />
							<Route path="requests" element={<PendingRequestsSection />} />
							<Route path="itineraries" element={<ItinerariesSection />} />
							<Route path="support" element={<SupportSection />} />
							<Route path="settings" element={<SettingsSection />} />
						</Routes>
					</main>
				</div>
			</div>
		</div>
	);
}
