import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';
import OverviewSection   from './sections/OverviewSection';
import StaffSection      from './sections/StaffSection';
import AnalyticsSection  from './sections/AnalyticsSection';
import ConfigSection     from './sections/ConfigSection';
import SalaryApprovalsSection from './sections/SalaryApprovalsSection';
import ConflictsSection  from './sections/ConflictsSection';
import ProfileSection    from './sections/ProfileSection';
import AlertsSection     from './sections/AlertsSection';
import useAdminGuard     from './useAdminGuard';
import './adminMotion.css';

export default function AdminDashboard() {
  useAdminGuard();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const segment = window.location.pathname.split('/').filter(Boolean).pop();
  const PAGE_META = {
    overview:   { title: 'Dashboard Overview',    subtitle: 'Welcome back, System Admin!' },
    staff:      { title: 'Staff Management',      subtitle: 'Manage Tour & Driver Managers' },
    analytics:  { title: 'System Analytics',      subtitle: 'Revenue, users and system health' },
    config:     { title: 'Global Configuration',  subtitle: 'Platform rates and settings' },
    salaries:   { title: 'Salary Approvals',      subtitle: 'Approve pending fleet salary requests' },
    alerts:     { title: 'Sentiment Alerts',      subtitle: 'Monitor review sentiment and flagged drivers' },
    conflicts:  { title: 'Conflict Resolution',   subtitle: 'Refunds and user bans' },
    profile:    { title: 'Admin Profile',         subtitle: 'Update your personal account details' },
  };
  const meta = PAGE_META[segment] || PAGE_META.overview;

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#f0fbff]" style={{ fontFamily: '"Space Grotesk", "Sora", "Segoe UI", sans-serif' }}>
      <div className="pointer-events-none absolute -top-28 -right-16 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-sky-300/20 blur-3xl" />
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopBar
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuClick={() => setSidebarOpen(true)}
          segment={segment}
        />
        <main className="flex-1 overflow-y-auto px-6 pb-6 pt-4 bg-gradient-to-b from-white/30 via-transparent to-transparent">
          <Routes>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview"   element={<OverviewSection />} />
            <Route path="staff"      element={<StaffSection />} />
            <Route path="analytics"  element={<AnalyticsSection />} />
            <Route path="config"     element={<ConfigSection />} />
            <Route path="salaries"   element={<SalaryApprovalsSection />} />
            <Route path="alerts"     element={<AlertsSection />} />
            <Route path="conflicts"  element={<ConflictsSection />} />
            <Route path="profile"    element={<ProfileSection />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
