import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './Responsive.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import CompanyAdminDashboard from './pages/CompanyAdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import DriverDashboard from './pages/DriverDashboard';
import CarOwnerDashboard from './pages/CarOwnerDashboard';
import SubscriptionPayPage from './pages/SubscriptionPayPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DriverAuthModal from './components/DriverAuthModal';
import CarsPage from './pages/CarsPage';
import ContactPage from './pages/ContactPage';
import AboutSupportPage from './pages/AboutSupportPage';
import FeatureDetailsPage from './pages/FeatureDetailsPage';

// Custom Navbar Component
function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (e, targetSectionId) => {
    e.preventDefault();
    setIsMobileMenuOpen(false); // Close mobile menu when a link is clicked
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        if (!targetSectionId || targetSectionId === '#home') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const el = document.querySelector(targetSectionId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    } else {
      if (!targetSectionId || targetSectionId === '#home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const el = document.querySelector(targetSectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'super-admin': return '/super-admin';
      case 'company-admin': return '/company-admin';
      case 'employee': return '/staff-dashboard';
      case 'driver': return '/driver-dashboard';
      case 'car-owner': return '/car-owner-dashboard';
      case 'customer': return '/customer-dashboard';
      default: return '/';
    }
  };

  return (
    <>
      <nav className="app-navbar">
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }} className="app-navbar-brand-row">
          {/* BRAND LOGO: ROYAL CAR RENTALS */}
          <div 
            onClick={(e) => handleNavClick(e, '#home')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }}
          >
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #e6c875 0%, #c5a059 50%, #8c6e28 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(197, 160, 89, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              flexShrink: 0
            }}>
              <span style={{ fontSize: '1.35rem', lineHeight: 1 }}>👑</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{
                color: '#c5a059',
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: '1.25rem',
                fontWeight: 900,
                letterSpacing: '3px',
                lineHeight: 1.1,
                textTransform: 'uppercase'
              }}>
                ROYAL
              </span>
              <span style={{
                color: '#ffffff',
                fontSize: '0.62rem',
                fontWeight: 800,
                letterSpacing: '2.5px',
                textTransform: 'uppercase',
                marginTop: '1px'
              }}>
                CAR RENTALS
              </span>
            </div>
          </div>

          <button 
            className="app-navbar-hamburger" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? '✖' : '☰'}
          </button>
        </div>
        
        <div className={`app-navbar-menu-wrapper ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {/* CENTER / RIGHT-CENTER NAV LINKS */}
          <ul className="app-navbar-links">
            <li>
              <a href="#home" onClick={(e) => handleNavClick(e, '#home')} style={{ fontSize: '0.95rem', fontWeight: 800, color: '#c5a059', textDecoration: 'none' }}>Home</a>
            </li>
            <li>
              <a href="#fleets" onClick={(e) => handleNavClick(e, '#fleets')} style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', textDecoration: 'none' }}>Fleet</a>
            </li>
            <li>
              <a href="#services" onClick={(e) => handleNavClick(e, '#services')} style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', textDecoration: 'none' }}>Services</a>
            </li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/about'); setIsMobileMenuOpen(false); }} style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', textDecoration: 'none' }}>About Us</a>
            </li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/contact'); setIsMobileMenuOpen(false); }} style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', textDecoration: 'none' }}>Contact Us</a>
            </li>
          </ul>

          <div className="app-navbar-actions">
            {user ? (
              <>
                <Link to={getDashboardPath()} style={{ fontSize: '0.9rem', color: '#c5a059', fontWeight: 800, textDecoration: 'none', marginRight: '0.5rem' }}>Dashboard</Link>
                <button 
                  onClick={() => { logout(); navigate('/auth'); setIsMobileMenuOpen(false); }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '24px',
                    color: '#ffffff',
                    padding: '0.55rem 1.25rem',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/auth" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.12)', 
                    border: '1px solid rgba(255, 255, 255, 0.3)', 
                    borderRadius: '24px', 
                    color: '#ffffff', 
                    padding: '0.55rem 1.5rem', 
                    fontSize: '0.9rem', 
                    fontWeight: 800, 
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <span style={{ fontSize: '0.88rem' }}>👤</span> Login
                </Link>
                <a 
                  href="#search-widget" 
                  onClick={(e) => handleNavClick(e, '#search-widget')}
                  style={{ 
                    background: '#c5a059', 
                    color: '#1a1918', 
                    padding: '0.55rem 1.6rem', 
                    borderRadius: '24px', 
                    fontWeight: 800, 
                    fontSize: '0.9rem', 
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(197, 160, 89, 0.3)',
                    cursor: 'pointer'
                  }}
                >
                  Book Now
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      <DriverAuthModal isOpen={showDriverModal} onClose={() => setShowDriverModal(false)} />
    </>
  );
}

// Protected Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const isSubscriptionEmailLink = allowedRoles?.includes('company-admin') && (
    params.get('tab') === 'subscription' ||
    params.get('fromEmail') === 'true' ||
    params.get('emailFlow') === 'true' ||
    !!params.get('plan') ||
    params.get('action') === 'subscribe'
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  // If opening via Super Admin Subscription Email Link, auto-set company admin token if unauthenticated
  if (isSubscriptionEmailLink) {
    if (!user || user.role !== 'company-admin') {
      if (!sessionStorage.getItem('token') && !localStorage.getItem('token')) {
        sessionStorage.setItem('token', 'mock_comp_token_email');
        if (!localStorage.getItem('company_name')) {
          localStorage.setItem('company_name', 'DriveX Rentals');
        }
        if (!localStorage.getItem('company_status')) {
          localStorage.setItem('company_status', 'active');
        }
        window.location.reload();
        return null;
      }
    }
    return children;
  }

  if (!user) {
    return <Navigate to={`/auth${location.search}`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Admin routes that use their own full-width sidebar layout
const ADMIN_ROUTES = ['/super-admin', '/company-admin', '/staff-dashboard', '/driver-dashboard', '/car-owner-dashboard', '/dashboard', '/car-register', '/register-car', '/owner-dashboard', '/car-owner'];

function AppContent() {
  const location = useLocation();
  const isAdminRoute = ADMIN_ROUTES.some(r => location.pathname.startsWith(r)) || location.pathname.startsWith('/subscription') || location.pathname.startsWith('/reset-password');
  const hideNavbar = location.pathname === '/' || isAdminRoute;

  return (
    <div className="app-container">
      {!hideNavbar && <Navbar />}
      <main
        className={isAdminRoute ? 'main-content-admin' : 'main-content'}
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/info" element={<AboutSupportPage />} />
          <Route path="/feature/:id" element={<FeatureDetailsPage />} />
          <Route path="/subscription/pay" element={<SubscriptionPayPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Super Admin Dashboard (Forge India Connect) */}
          <Route path="/superadmin" element={<Navigate to="/super-admin" replace />} />
          <Route 
            path="/super-admin" 
            element={
              <ProtectedRoute allowedRoles={['super-admin', 'super_admin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Company Admin Dashboard (Rental Company) */}
          <Route 
            path="/company-admin" 
            element={
              <ProtectedRoute allowedRoles={['company-admin', 'company_admin', 'super-admin', 'super_admin', 'car-owner', 'car_owner', 'vendor', 'owner', 'customer', 'driver', 'employee']}>
                <CompanyAdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Staff Dashboard (Employee) */}
          <Route 
            path="/staff-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['employee', 'company-admin', 'super-admin']}>
                <StaffDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Driver Dashboard */}
          <Route 
            path="/driver-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['driver', 'company-admin', 'super-admin', 'employee', 'customer', 'car-owner', 'vendor', 'owner']}>
                <DriverDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Car Owner & Car Register Dashboard + Route Aliases */}
          <Route 
            path="/car-owner-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['car-owner', 'car_owner', 'company-admin', 'company_admin', 'super-admin', 'super_admin', 'vendor', 'owner', 'customer', 'driver', 'employee']}>
                <CarOwnerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['car-owner', 'car_owner', 'company-admin', 'company_admin', 'super-admin', 'super_admin', 'vendor', 'owner', 'customer', 'driver', 'employee']}>
                <CarOwnerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/car-register" 
            element={
              <ProtectedRoute allowedRoles={['car-owner', 'car_owner', 'company-admin', 'company_admin', 'super-admin', 'super_admin', 'vendor', 'owner', 'customer', 'driver', 'employee']}>
                <CarOwnerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/register-car" 
            element={
              <ProtectedRoute allowedRoles={['car-owner', 'car_owner', 'company-admin', 'company_admin', 'super-admin', 'super_admin', 'vendor', 'owner', 'customer', 'driver', 'employee']}>
                <CarOwnerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/owner-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['car-owner', 'car_owner', 'company-admin', 'company_admin', 'super-admin', 'super_admin', 'vendor', 'owner', 'customer', 'driver', 'employee']}>
                <CarOwnerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/car-owner" 
            element={
              <ProtectedRoute allowedRoles={['car-owner', 'car_owner', 'company-admin', 'company_admin', 'super-admin', 'super_admin', 'vendor', 'owner', 'customer', 'driver', 'employee']}>
                <CarOwnerDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Customer Dashboard */}
          <Route 
            path="/customer-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['customer', 'car-owner', 'company-admin', 'super-admin']}>
                <CustomerDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Cars Catalog Page */}
          <Route path="/cars" element={<CarsPage />} />

          {/* Redirect all unmatched routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
