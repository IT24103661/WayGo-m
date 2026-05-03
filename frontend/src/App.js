import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import TouristDashboard from './pages/tourist/TouristDashboard';
import DriverDashboard from './pages/driver/DriverDashboard';
import TourManagerDashboard from './pages/tourmanager/TourManagerDashboard';
import FleetManagerDashboard from './pages/fleetmanager/FleetManagerDashboard';

const AUTH_ROUTES = ['/login', '/register'];

function Layout() {
  const { pathname } = useLocation();
  const isAuth = AUTH_ROUTES.includes(pathname);
  const isDashboard = pathname.startsWith('/dashboard');
  const hideChrome = isAuth || isDashboard;

  return (
    <div className="flex flex-col min-h-screen">
      {!hideChrome && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard/tourist/*" element={<TouristDashboard />} />
          <Route path="/dashboard/admin/*" element={<AdminDashboard />} />
          <Route path="/dashboard/tourmanager/*" element={<TourManagerDashboard />} />
          <Route path="/dashboard/driver/*" element={<DriverDashboard />} />
          <Route path="/dashboard/fleetmanager/*" element={<FleetManagerDashboard />} />
        </Routes>
      </main>
      {!hideChrome && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
