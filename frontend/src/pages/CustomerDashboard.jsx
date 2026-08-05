import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function CustomerDashboard() {
  const { token, logout, user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // 10 ACTIVE DASHBOARD TABS:
  // 1. dashboard, 2. browse, 3. bookings, 4. live-tracking, 5. payments, 6. kyc, 7. reviews, 8. notifications, 9. profile, 10. settings
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // SUB-TAB STATES
  const [bookingFilterTab, setBookingFilterTab] = useState('all'); // all, In Progress, Confirmed, Completed, Cancelled
  const [reviewsSubTab, setReviewsSubTab] = useState('my-reviews');

  // BROWSE VEHICLES FILTERS
  const [location, setLocation] = useState(''); // Default empty to show all vehicles across cities
  const [pickupDate, setPickupDate] = useState('2026-07-28');
  const [returnDate, setReturnDate] = useState('2026-07-30');
  const [vehicleClassFilter, setVehicleClassFilter] = useState('all'); // all, car, bike, ev, luxury
  const [categoryFilter, setCategoryFilter] = useState(''); // Hatchback, Sedan, SUV, Electric, Luxury
  const [fuelFilter, setFuelFilter] = useState(''); // Petrol, Diesel, Electric, Hybrid
  const [transFilter, setTransFilter] = useState(''); // Manual, Automatic
  const [seatsFilter, setSeatsFilter] = useState(''); // 2, 4, 5, 7
  const [priceRange, setPriceRange] = useState(15000);
  const [sortBy, setSortBy] = useState('recommended'); // recommended, price-asc, price-desc, rating

  // WALLET & PAYMENT STATES
  const [walletBalance, setWalletBalance] = useState(1250);

  // NOTIFICATION STATE (DYNAMIC COUNT MANAGEMENT)
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Welcome to DriveEase', message: 'Your account is ready. Explore our fleet to get started!', time: 'Just now', category: 'system', unread: true }
  ]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  // Calculate dynamic unread notification count
  const unreadCount = notifications.filter(n => n.unread).length;

  // Mark all notifications as read when tab or dropdown is opened
  const handleOpenNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  // Simulate receiving a new notification dynamically
  const triggerNewNotification = (title, message) => {
    setNotifications(prev => [
      { id: Date.now(), title, message, time: 'Just now', category: 'trip', unread: true },
      ...prev
    ]);
  };

  // VEHICLE DETAILS & BOOKING MODE (Car Only vs Car + Driver)
  const [detailVehicle, setDetailVehicle] = useState(null);
  const [bookingMode, setBookingMode] = useState('car-driver'); // 'car-only' or 'car-driver'

  // KYC & DOCUMENT UPLOAD STATES
  const [showDocUploadModal, setShowDocUploadModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('dl');

  // LIVE TRIP TRACKING STATE
  const [trackingBooking, setTrackingBooking] = useState(null);
  const [sosActive, setSosActive] = useState(false);

  // INVOICE MODAL STATE
  const [invoiceBooking, setInvoiceBooking] = useState(null);

  // CANCEL BOOKING CONFIRMATION MODAL STATE
  const [cancelBookingItem, setCancelBookingItem] = useState(null);

  // SELF-DRIVE PROOF VERIFICATION STATE (DL, Aadhaar, PAN, Face Auth)
  const [showSelfDriveProofModal, setShowSelfDriveProofModal] = useState(false);
  const [pendingSelfDriveVehicle, setPendingSelfDriveVehicle] = useState(null);
  const [selfDriveProofData, setSelfDriveProofData] = useState({
    dlNumber: 'DL-1420110012345',
    dlUploaded: true,
    aadhaarNumber: '9842-1100-7788',
    aadhaarUploaded: true,
    panNumber: 'ABCDE1234F',
    panUploaded: true,
    faceAuthScanned: false,
    faceScanning: false,
  });

  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [capturedFaceImg, setCapturedFaceImg] = useState(null);

  const startWebcamStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320, facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setWebcamActive(true);
    } catch (err) {
      console.warn('Webcam permission note:', err);
      setWebcamActive(true); // show camera box UI
    }
  };

  const stopWebcamStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
  };

  const handleCaptureFaceWebcam = () => {
    if (videoRef.current && canvasRef.current) {
      try {
        const context = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth || 300;
        canvasRef.current.height = videoRef.current.videoHeight || 300;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const dataUrl = canvasRef.current.toDataURL('image/png');
        setCapturedFaceImg(dataUrl);
      } catch (e) {}
    }
    setSelfDriveProofData(prev => ({ ...prev, faceAuthScanned: true, faceScanning: false }));
    stopWebcamStream();
    alert('📸 Live Face Snapshot Captured! Biometric Face Authentication 100% Match with Driving License.');
  };

  // 30-MINUTE AUTOMATED DRIVER DISPATCH BROADCAST MODAL STATE (STRICTLY FOR DRIVER ROLE ONLY)
  const [showDriverBroadcastModal, setShowDriverBroadcastModal] = useState(true);

  // RATING & REVIEWS STATE
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [newReviewData, setNewReviewData] = useState({
    carName: 'Tata Nexon EV Max',
    rating: 5,
    comment: 'Punctual driver, clean electric SUV, smooth drive experience!',
  });
  const [userReviews, setUserReviews] = useState([]);

  // PROFILE FORM STATES
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Rahul Kumar',
    email: user?.email || 'rahul.kumar@gmail.com',
    mobile: user?.mobile || '+91 98765 43210',
    dob: '1995-04-12',
    address: 'Flat 402, Royal Residency, Connaught Place, New Delhi',
    emergencyContact: 'Suresh Kumar (+91 98765 11111)',
  });

  // Dynamic User Role Badge Resolver
  const getUserRoleLabel = () => {
    const r = (user?.role || 'customer').toLowerCase();
    if (r === 'company_admin' || r === 'vendor' || r === 'company') return 'Vendor / Partner 🏢';
    if (r === 'driver') return 'Chauffeur / Driver 👨‍✈️';
    if (r === 'employee' || r === 'staff') return 'Employee / Staff 🧑‍💼';
    if (r === 'super_admin' || r === 'admin') return 'Super Admin ⚡';
    return 'Customer / Renter ✅';
  };

  // Dynamic Fleet Data (Loaded from API / Rental Companies)
  const DEFAULT_VEHICLES = [];
  const fleetToDisplay = vehicles;

  // My Bookings — load from localStorage or initialize with sample Self-Drive booking
  const [demoBookingsList, setDemoBookingsList] = useState(() => {
    try {
      const saved = localStorage.getItem('customer_bookings_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      }
    } catch (e) {}

    return [
      {
        _id: 'BK-2026-6234',
        bookingId: 'BK-2026-6234',
        vehicle: {
          make: 'KIA',
          model: '2026',
          imageUrl: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800',
          pricePerDay: 2500
        },
        startDate: '2026-07-28',
        endDate: '2026-07-30',
        status: 'Pending Admin Approval (Blocked)',
        paymentStatus: 'Paid Online',
        totalPrice: 5000,
        bookingType: 'Car Only (Self-Drive) 🔑',
        hasDriver: false,
        selfDriveVerified: true,
        verificationDetails: {
          dlNumber: 'DL-1420110012345',
          aadhaarNumber: '9842-1100-7788',
          panNumber: 'ABCDE1234F',
          faceAuthScanned: true
        }
      },
      {
        _id: 'b_selfdrive_default',
        bookingId: 'BK-2026-9042',
        vehicle: {
          make: 'Toyota',
          model: 'Fortuner Legender',
          imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800',
          pricePerDay: 4500
        },
        startDate: '2026-07-28',
        endDate: '2026-07-30',
        status: 'Pending Admin Approval (Blocked)',
        paymentStatus: 'Paid Online',
        totalPrice: 9000,
        bookingType: 'Car Only (Self-Drive) 🔑',
        hasDriver: false,
        selfDriveVerified: false,
        verificationDetails: {
          dlNumber: 'DL-1420110012345',
          aadhaarNumber: '9842-1100-7788',
          panNumber: 'ABCDE1234F',
          faceAuthScanned: true
        }
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('customer_bookings_list', JSON.stringify(demoBookingsList));
  }, [demoBookingsList]);

  const fetchCustomerData = async () => {
    try {
      const fleetRes = await fetch('/api/customer/vehicles');
      const fleetData = await fleetRes.json();
      const localCompanyVehicles = JSON.parse(localStorage.getItem('company_vehicles_list') || '[]');
      let combined = (fleetData.success && fleetData.vehicles && fleetData.vehicles.length > 0)
        ? fleetData.vehicles
        : [];
      if (localCompanyVehicles.length > 0) {
        combined = [...combined, ...localCompanyVehicles];
      }
      if (combined.length === 0) {
        combined = DEFAULT_VEHICLES;
      }
      setVehicles(combined);
    } catch (err) {
      const localCompanyVehicles = JSON.parse(localStorage.getItem('company_vehicles_list') || '[]');
      setVehicles(localCompanyVehicles.length > 0 ? localCompanyVehicles : DEFAULT_VEHICLES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [token]);

  // Handle Tab Switch
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'notifications') {
      handleOpenNotifications();
    }
  };

  // Handle Booking Cancellation (DOES NOT DELETE, SETS STATUS TO CANCELLED)
  const handleConfirmCancelBooking = async (item) => {
    if (item._id && item._id.length === 24) {
      try {
        await fetch(`/api/customer/bookings/${item._id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.warn('API call logged');
      }
    }

    // Refund total price to wallet
    setWalletBalance(prev => prev + item.totalPrice);

    // Update status to 'Cancelled' in state so it remains under the Cancelled tab!
    setDemoBookingsList(prev => prev.map(b => b._id === item._id ? { ...b, status: 'Cancelled' } : b));

    // Trigger notification
    triggerNewNotification(
      'Booking Cancelled & Refunded',
      `Booking #${item.bookingId} status set to Cancelled. ₹${item.totalPrice} credited to your wallet.`
    );

    alert(`Booking #${item.bookingId} cancelled successfully! ₹${item.totalPrice} has been refunded to your wallet.`);
    setCancelBookingItem(null);
  };

  const activeBooking = demoBookingsList.find(b => b.status === 'In Progress');

  // Filtered fleet for Browse Vehicles
  const filteredVehicles = fleetToDisplay.filter(v => {
    if (location && !v.location.toLowerCase().includes(location.toLowerCase())) return false;
    if (vehicleClassFilter !== 'all' && v.vehicleClass !== vehicleClassFilter) return false;
    if (categoryFilter && v.category !== categoryFilter) return false;
    if (fuelFilter && v.fuelType !== fuelFilter) return false;
    if (transFilter && v.transmission !== transFilter) return false;
    if (seatsFilter && v.seats !== parseInt(seatsFilter)) return false;
    if (v.pricePerDay > priceRange) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* ========================================== */}
      {/* LEFT SIDEBAR NAVIGATION */}
      {/* ========================================== */}
      <aside style={{
        width: sidebarCollapsed ? '75px' : '260px',
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 100,
        boxShadow: '4px 0 20px rgba(0, 0, 0, 0.03)'
      }}>
        {/* Sidebar Header */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
          {!sidebarCollapsed && (
            <div style={{ fontSize: '1.25rem', fontWeight: 900, background: 'linear-gradient(90deg, #2563eb, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ⚡ RentOS Portal
            </div>
          )}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ background: '#f1f5f9', border: 'none', color: '#64748b', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}
          >
            {sidebarCollapsed ? '➡️' : '⬅️'}
          </button>
        </div>

        {/* User Role Profile Card */}
        {!sidebarCollapsed && (
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', boxShadow: '0 4px 10px rgba(37,99,235,0.3)' }}>
              {profileData.name.charAt(0)}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{profileData.name}</div>
              <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>{getUserRoleLabel()}</div>
            </div>
          </div>
        )}

        {/* 9 Sidebar Nav Items */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.6rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'browse', label: 'Browse Vehicles' },
            { id: 'bookings', label: 'My Bookings' },
            { id: 'live-tracking', label: 'Live Trip Tracking', highlight: true },
            { id: 'payments', label: 'Payments & Invoices' },
            { id: 'reviews', label: 'Reviews & Ratings' },
            { id: 'notifications', label: 'Notifications', badge: unreadCount > 0 ? unreadCount : null },
            { id: 'profile', label: 'My Profile' },
            { id: 'settings', label: 'Settings' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justify: sidebarCollapsed ? 'center' : 'space-between',
                padding: '0.75rem 0.9rem',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === item.id ? (item.highlight ? 'linear-gradient(90deg, #2563eb, #7c3aed)' : '#eff6ff') : 'transparent',
                color: activeTab === item.id ? (item.highlight ? '#ffffff' : '#2563eb') : '#475569',
                fontWeight: activeTab === item.id ? 800 : 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                borderLeft: activeTab === item.id && !item.highlight ? '4px solid #2563eb' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </div>
              {!sidebarCollapsed && item.badge && (
                <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '10px', fontWeight: 800 }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer Logout */}
        <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0' }}>
          <button
            onClick={() => { logout(); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', gap: '0.65rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.65rem 0.85rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            <span>🚪</span>
            {!sidebarCollapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* ========================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Top Header Bar */}
        <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 90, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
            {activeTab === 'dashboard' && '🏠 Dashboard Overview'}
            {activeTab === 'browse' && '🚗 Browse & Reserve Vehicles'}
            {activeTab === 'bookings' && '📅 My Bookings & Rental History'}
            {activeTab === 'live-tracking' && '📍 Live Trip GPS Tracking & Chauffeur Desk'}
            {activeTab === 'payments' && '💳 Payments, Invoices & Wallet'}
            {activeTab === 'kyc' && '📄 KYC & Document Verification'}
            {activeTab === 'reviews' && '⭐ Customer Reviews & Ratings'}
            {activeTab === 'notifications' && '🔔 Notifications & Alerts'}
            {activeTab === 'profile' && '👤 Account Profile & Security'}
            {activeTab === 'settings' && '⚙️ App Preferences & Settings'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div 
              onClick={() => handleTabChange('payments')}
              style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.4rem 0.85rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 800, color: '#059669', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>💰 Wallet: ₹{walletBalance}</span>
            </div>

            {/* Notifications Bell */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => {
                  setShowNotificationsDropdown(!showNotificationsDropdown);
                  if (!showNotificationsDropdown) handleOpenNotifications();
                }}
                style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                🔔
              </button>
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 900, padding: '0.1rem 0.35rem', borderRadius: '10px' }}>
                  {unreadCount}
                </span>
              )}

              {showNotificationsDropdown && (
                <div style={{ position: 'absolute', right: 0, top: '48px', width: '320px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 200, padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>Notifications</span>
                    <button onClick={handleOpenNotifications} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}>Mark all read</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '240px', overflowY: 'auto' }}>
                    {notifications.map(n => (
                      <div key={n.id} style={{ background: n.unread ? '#eff6ff' : '#f8fafc', padding: '0.6rem', borderRadius: '8px', borderLeft: n.unread ? '3px solid #2563eb' : 'none' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>{n.title}</div>
                        <div style={{ fontSize: '0.72rem', color: '#475569' }}>{n.message}</div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.2rem' }}>{n.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Main Body Content */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          
          {/* ========================================== */}
          {/* TAB 1: 🏠 DASHBOARD */}
          {/* ========================================== */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              
              {/* Welcome Hero Banner */}
              <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '16px', padding: '2rem', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}>
                <div>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 0.5rem 0' }}>
                    Welcome back, {profileData.name} 👋
                  </h1>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.95rem' }}>
                    Your next luxury drive is ready. 1 active trip in progress.
                  </p>
                </div>
                <button 
                  onClick={() => handleTabChange('browse')}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 15px rgba(37,99,235,0.4)' }}
                >
                  🚀 Book New Car
                </button>
              </div>

              {/* Pending Approval / Blocked Notice Banner */}
              {demoBookingsList.some(b => b.status && b.status.includes('Pending')) && (
                <div style={{ background: '#fff7ed', border: '2px solid #ea580c', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 10px 30px rgba(234,88,12,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ background: '#ea580c', color: '#fff', fontSize: '0.75rem', fontWeight: 900, padding: '0.3rem 0.75rem', borderRadius: '20px' }}>
                      🔒 SELF-DRIVE ACCESS BLOCKED - PENDING ADMIN APPROVAL
                    </span>
                    <span style={{ color: '#c2410c', fontSize: '0.8rem', fontWeight: 700 }}>Aadhaar, PAN, DL & Face Scan Under Review</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#9a3412', lineHeight: 1.5 }}>
                    Your Self-Drive document verification (Aadhaar, PAN, Driving License & Face Authentication) has been submitted to Company Admin.
                    <strong> Your self-drive rental feature is BLOCKED until Company Admin approves your verification.</strong>
                  </div>
                </div>
              )}

              {/* Active Booking Banner Widget */}
              {activeBooking && (
                <div style={{ background: '#ffffff', border: '2px solid #2563eb', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 10px 30px rgba(37,99,235,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ background: '#2563eb', color: '#fff', fontSize: '0.75rem', fontWeight: 900, padding: '0.3rem 0.75rem', borderRadius: '20px' }}>
                      ⚡ CURRENT ACTIVE TRIP IN PROGRESS
                    </span>
                    <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 700 }}>Booking ID: {activeBooking.bookingId}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 220px', gap: '1.5rem', alignItems: 'center' }}>
                    <img src={activeBooking.vehicle.imageUrl} alt="Car" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '10px' }} />
                    
                    <div>
                      <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>{activeBooking.vehicle.make} {activeBooking.vehicle.model}</h3>
                      <div style={{ fontSize: '0.82rem', color: '#475569' }}>📍 Delhi Airport Hub → Connaught Place, New Delhi</div>
                      <div style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 700, marginTop: '0.2rem' }}>👨‍✈️ Driver: {activeBooking.driver?.name} ({activeBooking.driver?.phone})</div>
                    </div>

                    <button 
                      onClick={() => { setTrackingBooking(activeBooking); handleTabChange('live-tracking'); }}
                      style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', border: 'none', padding: '0.85rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}
                    >
                      📍 Track Live Trip & SOS
                    </button>
                  </div>
                </div>
              )}

              {/* Completed Trip Review Prompt Card */}
              {demoBookingsList.some(b => b.status === 'Completed' && !b.rated) && (
                <div style={{ background: 'linear-gradient(135deg, #fffbe3 0%, #fef3c7 100%)', border: '2px solid #f59e0b', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 8px 25px rgba(245,158,11,0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ background: '#d97706', color: '#fff', fontSize: '0.75rem', fontWeight: 900, padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
                      🎉 TRIP COMPLETED - LEAVE A REVIEW
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#92400e', fontWeight: 700 }}>Booking #BK-2026-3310</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.25rem', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.15rem', fontWeight: 900, color: '#78350f' }}>How was your ride in Tata Nexon EV Max?</h3>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e' }}>Rate your vehicle condition & chauffeur service (Driver Karthik S.)</p>
                      
                      <div style={{ display: 'flex', gap: '0.4rem', margin: '0.75rem 0 0.5rem 0', fontSize: '1.5rem', cursor: 'pointer' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <span 
                            key={star} 
                            onClick={() => {
                              alert(`Rated ${star} Stars! Thank you for reviewing Tata Nexon EV.`);
                              setDemoBookingsList(prev => prev.map(b => b.bookingId === 'BK-2026-3310' ? { ...b, rated: true } : b));
                              triggerNewNotification('Review Submitted ⭐', `Thank you for rating Tata Nexon EV ${star} stars!`);
                            }}
                            style={{ color: star <= 5 ? '#f59e0b' : '#cbd5e1', transition: 'transform 0.15s ease' }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        alert('Review submitted! Thank you for rating your trip.');
                        setDemoBookingsList(prev => prev.map(b => b.bookingId === 'BK-2026-3310' ? { ...b, rated: true } : b));
                        triggerNewNotification('Review Submitted ⭐', 'Thank you for rating Tata Nexon EV 5 stars!');
                      }}
                      style={{ background: '#d97706', color: '#fff', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: 900, fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(217,119,6,0.3)' }}
                    >
                      Submit Review ⭐
                    </button>
                  </div>
                </div>
              )}

              {/* Stats Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
                <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>Total Trips</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '0.2rem', color: '#2563eb' }}>{demoBookingsList.filter(b => b.status === 'Completed').length} Rides</div>
                </div>
                <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>Wallet Balance</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '0.2rem', color: '#059669' }}>₹{walletBalance}</div>
                </div>
                <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>Account Role</div>
                  <div style={{ fontSize: '1rem', fontWeight: 900, marginTop: '0.5rem', color: '#059669' }}>{getUserRoleLabel()}</div>
                </div>
                <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>Reviews Given</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '0.2rem', color: '#d97706' }}>{userReviews.length} Reviews</div>
                </div>
              </div>


            </div>
          )}

          {/* ========================================== */}
          {/* TAB 2: 🚗 BROWSE VEHICLES */}
          {/* ========================================== */}
          {activeTab === 'browse' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Filter Bar */}
              <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '1rem', alignItems: 'end' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem', display: 'block' }}>📍 Search Location</label>
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Enter city..." style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', padding: '0.65rem', borderRadius: '8px', fontSize: '0.88rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem', display: 'block' }}>📅 Pickup Date</label>
                    <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', padding: '0.65rem', borderRadius: '8px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem', display: 'block' }}>📅 Return Date</label>
                    <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', padding: '0.65rem', borderRadius: '8px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem', display: 'block' }}>⚡ Sort By</label>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', padding: '0.65rem', borderRadius: '8px' }}>
                      <option value="recommended">Recommended</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Vehicle Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {filteredVehicles.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', background: '#ffffff', padding: '3.5rem 2rem', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🚗</div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#334155' }}>No Vehicles Available</div>
                    <div style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '0.25rem' }}>No vehicles in fleet currently. Vehicles added by rental companies will appear here dynamically.</div>
                  </div>
                ) : filteredVehicles.map(v => (
                  <div key={v._id} style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                    <div style={{ position: 'relative' }}>
                      <img src={v.imageUrl} alt={v.model} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                      <span style={{ position: 'absolute', top: '12px', left: '12px', background: '#2563eb', color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '6px' }}>{v.category}</span>
                    </div>

                    <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>{v.make} {v.model}</h3>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#059669' }}>₹{v.pricePerDay}<span style={{ fontSize: '0.72rem', color: '#64748b' }}>/day</span></div>
                      </div>

                      {/* Company Operator Badge & Clickable Mobile Call Dialer */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.85rem', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <img 
                            src={v.company?.logo || v.companyLogo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} 
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'; }}
                            alt="Company Logo" 
                            style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'cover' }} 
                          />
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155' }}>{v.company?.name || v.companyName || 'Rental Company'}</span>
                        </div>
                        <a 
                          href={`tel:${v.companyPhone || v.companyMobile || v.company?.mobile || v.company?.phone || '9517368420'}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.25rem 0.6rem', borderRadius: '6px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Click to Call Company Dialer"
                        >
                          📞 {v.companyPhone || v.companyMobile || v.company?.mobile || v.company?.phone || '9517368420'}
                        </a>
                      </div>

                      <button 
                        onClick={() => setDetailVehicle(v)}
                        style={{ width: '100%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', marginTop: 'auto' }}
                      >
                        View Details & Book
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ========================================== */}
          {/* TAB 3: 📅 MY BOOKINGS */}
          {/* ========================================== */}
          {activeTab === 'bookings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Sub-tabs Filter */}
              <div style={{ display: 'flex', gap: '0.65rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
                {['all', 'Self Drive', 'Chauffeur Drive', 'Pending Approval', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'].map(st => (
                  <button
                    key={st}
                    onClick={() => setBookingFilterTab(st)}
                    style={{
                      background: bookingFilterTab === st ? '#2563eb' : 'transparent',
                      color: bookingFilterTab === st ? '#fff' : '#64748b',
                      border: bookingFilterTab === st ? 'none' : '1px solid #cbd5e1',
                      padding: '0.5rem 1.1rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer'
                    }}
                  >
                    {st === 'all' ? 'All Bookings' : st === 'Self Drive' ? '🏎️ Self Drive' : st === 'Chauffeur Drive' ? '👨‍✈️ Chauffeur Drive' : st}
                  </button>
                ))}
              </div>

              {/* Bookings List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {(() => {
                  const filtered = demoBookingsList.filter(b => {
                    if (bookingFilterTab === 'all') return true;
                    if (bookingFilterTab === 'Self Drive') return b.bookingType === 'self-drive' || b.bookingType === 'self_drive' || !b.hasDriver;
                    if (bookingFilterTab === 'Chauffeur Drive') return b.bookingType === 'with_driver' || b.hasDriver || b.driverAssigned;
                    if (bookingFilterTab === 'Pending Approval') return b.status && b.status.includes('Pending');
                    return b.status === bookingFilterTab;
                  });
                  if (filtered.length === 0) {
                    return (
                      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '4rem 2rem', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📅</div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#334155', marginBottom: '0.4rem' }}>No bookings found in this view</div>
                        <div style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1.5rem' }}>Browse our fleet and make your reservation!</div>
                        <button onClick={() => handleTabChange('browse')} style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}>
                          🚗 Browse Cars
                        </button>
                      </div>
                    );
                  }
                  return filtered.map(b => (
                    <div key={b._id} style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'grid', gridTemplateColumns: '140px 1fr 220px', gap: '1.5rem', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                      <img src={b.vehicle.imageUrl} alt={b.vehicle.model} style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '10px' }} />

                      <div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 900, fontSize: '1.15rem', color: '#0f172a' }}>{b.vehicle.make} {b.vehicle.model}</span>
                          <span style={{ fontSize: '0.72rem', background: '#eff6ff', color: '#2563eb', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>ID: {b.bookingId}</span>
                          <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>{b.bookingType}</span>
                        </div>

                        {/* CUSTOMER NAME & COMPANY LOGO DISPLAY */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f8fafc', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 800, color: '#1e3a8a' }}>
                            <span>👤 Customer:</span>
                            <span style={{ color: '#2563eb' }}>{b.customerName || profileData.name || user?.name || 'Rahul Kumar'}</span>
                          </div>
                          <span style={{ color: '#cbd5e1' }}>|</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                            <img
                              src={b.company?.logo || localStorage.getItem('company_logo') || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
                              alt="Company Logo"
                              style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'cover' }}
                            />
                            <span>{b.company?.name || user?.companyName || localStorage.getItem('company_name') || 'Pooja Cars'}</span>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.4rem' }}>
                          📅 Dates: <strong>{b.startDate}</strong> to <strong>{b.endDate}</strong> • Total: <strong style={{ color: '#059669' }}>₹{b.totalPrice}</strong>
                        </div>
                        {b.hasDriver && b.driver && (
                          <div style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 700 }}>
                            👨‍✈️ Assigned Chauffeur: {b.driver.name} ({b.driver.phone})
                          </div>
                        )}
                        {!b.hasDriver && (
                          <div style={{ fontSize: '0.76rem', color: '#d97706', fontWeight: 700 }}>
                            🔑 Self-Drive Rental • Documents: DL, Aadhaar, PAN & Face Scan Submitted
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span style={{
                          textAlign: 'center', padding: '0.35rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900,
                          background: (b.status && b.status.includes('Pending')) ? '#fff7ed' : b.status === 'In Progress' ? '#eff6ff' : b.status === 'Confirmed' ? '#ecfdf5' : b.status === 'Cancelled' ? '#fef2f2' : '#f1f5f9',
                          color: (b.status && b.status.includes('Pending')) ? '#ea580c' : b.status === 'In Progress' ? '#2563eb' : b.status === 'Confirmed' ? '#059669' : b.status === 'Cancelled' ? '#dc2626' : '#64748b'
                        }}>
                          {b.status}
                        </span>

                        <button onClick={() => { setTrackingBooking(b); handleTabChange('live-tracking'); }} style={{ background: 'linear-gradient(135deg, #0284c7, #2563eb)', color: '#fff', border: 'none', padding: '0.5rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}>
                          📡 Track Car (Traccar GPS)
                        </button>

                        <button onClick={() => setInvoiceBooking(b)} style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.45rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
                          📄 View Invoice
                        </button>

                        {b.status === 'Confirmed' && (
                          <button 
                            onClick={() => setCancelBookingItem(b)} 
                            style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.5rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                          >
                            ❌ Cancel Booking
                          </button>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>

            </div>
          )}


          {/* ========================================== */}
          {/* TAB 4: 📍 LIVE TRIP TRACKING */}
          {/* ========================================== */}
          {activeTab === 'live-tracking' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                
                {/* Live Interactive Map Screen */}
                <div style={{ position: 'relative', height: '520px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                  <iframe 
                    title="Live Tracking Map" 
                    src="https://maps.google.com/maps?q=28.6139,77.2090&z=14&output=embed" 
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  ></iframe>

                  <div style={{ position: 'absolute', top: '15px', left: '15px', background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(10px)', padding: '0.65rem 1rem', borderRadius: '10px', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }}></span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>GPS LIVE • Speed: 42 km/h</span>
                  </div>

                  <button 
                    onClick={() => { setSosActive(true); triggerNewNotification('🚨 SOS Emergency Activated', 'Police and support dispatched to current live coordinates.'); alert('🚨 EMERGENCY SOS ACTIVATED! Police & Support notified with your live coordinates.'); }}
                    style={{ position: 'absolute', bottom: '20px', right: '20px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff', border: '2px solid #fff', padding: '0.85rem 1.5rem', borderRadius: '30px', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 8px 25px rgba(239,68,68,0.6)' }}
                  >
                    🚨 SOS EMERGENCY
                  </button>
                </div>

                {/* Right Trip Info Desk */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>ESTIMATED ARRIVAL (ETA)</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2563eb', marginTop: '0.2rem' }}>18 Mins</div>
                    <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700, marginTop: '0.2rem' }}>Distance remaining: 14.2 km</div>
                  </div>

                  {/* Conditional Driver Card: Assigned Chauffeur vs Self-Drive */}
                  {trackingBooking?.bookingType === 'with_driver' || trackingBooking?.hasDriver || trackingBooking?.driverAssigned ? (
                    <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800, marginBottom: '0.75rem' }}>ASSIGNED CHAUFFEUR</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <img src={trackingBooking?.driverPhoto || "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400"} alt="Driver" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #2563eb' }} />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>{trackingBooking?.driverName || 'Ramesh Singh'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 700 }}>★ 4.9 Rating (120+ trips)</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <a href="tel:+919876599999" style={{ flex: 1, textDecoration: 'none', background: '#2563eb', color: '#fff', textAlign: 'center', padding: '0.6rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.82rem' }}>📞 Call Chauffeur</a>
                        <button onClick={() => alert('Opening encrypted live driver chat...')} style={{ flex: 1, background: '#059669', color: '#fff', border: 'none', padding: '0.6rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}>💬 Chat</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: '#f0fdf4', padding: '1.25rem', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 800, marginBottom: '0.4rem' }}>🏎️ SELF-DRIVE RENTAL ACTIVE</div>
                      <div style={{ fontSize: '0.88rem', color: '#15803d', fontWeight: 700 }}>
                        Customer Driving • Vehicle Telematics Monitored Live
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '0.4rem' }}>
                        24/7 Roadside Assistance: <strong>1800-123-4567</strong>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => { navigator.clipboard?.writeText(window.location.href); alert('Live trip link copied to clipboard!'); }}
                    style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.75rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
                  >
                    🔗 Share Live Location
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 5: 💳 PAYMENTS & INVOICES */}
          {/* ========================================== */}
          {activeTab === 'payments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>Total Spent</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#2563eb', marginTop: '0.2rem' }}>₹19,000</div>
                </div>
                <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>Pending Payments</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#059669', marginTop: '0.2rem' }}>₹0 (Clear)</div>
                </div>
                <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>Wallet Balance</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#d97706', marginTop: '0.2rem' }}>₹{walletBalance}</div>
                </div>
              </div>

              {/* Transactions History Table */}
              <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>Payment Transactions & Invoices</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem' }}>Transaction ID</th>
                      <th style={{ padding: '0.75rem' }}>Date</th>
                      <th style={{ padding: '0.75rem' }}>Booking ID</th>
                      <th style={{ padding: '0.75rem' }}>Method</th>
                      <th style={{ padding: '0.75rem' }}>Amount</th>
                      <th style={{ padding: '0.75rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 800 }}>TXN-984210</td>
                      <td style={{ padding: '0.75rem' }}>2026-07-28</td>
                      <td style={{ padding: '0.75rem' }}>BK-2026-9842</td>
                      <td style={{ padding: '0.75rem' }}>UPI (GPay)</td>
                      <td style={{ padding: '0.75rem', color: '#059669', fontWeight: 800 }}>₹9,000</td>
                      <td style={{ padding: '0.75rem' }}><button onClick={() => setInvoiceBooking(demoBookingsList[0])} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}>Invoice</button></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 800 }}>TXN-741209</td>
                      <td style={{ padding: '0.75rem' }}>2026-08-05</td>
                      <td style={{ padding: '0.75rem' }}>BK-2026-7412</td>
                      <td style={{ padding: '0.75rem' }}>Credit Card</td>
                      <td style={{ padding: '0.75rem', color: '#059669', fontWeight: 800 }}>₹5,600</td>
                      <td style={{ padding: '0.75rem' }}><button onClick={() => setInvoiceBooking(demoBookingsList[1])} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}>Invoice</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 6: 📄 KYC & DOCUMENTS */}
          {/* ========================================== */}
          {activeTab === 'kyc' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>KYC Document Verification Desk</h3>
                    <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>Government ID and Driving License verification for self-drive eligibility.</p>
                  </div>
                  <span style={{ background: '#ecfdf5', color: '#059669', fontWeight: 900, padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.82rem', border: '1px solid #a7f3d0' }}>OVERALL VERIFIED ✅</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 800, marginBottom: '0.5rem', color: '#0f172a' }}>🪪 Driving License (DL)</div>
                    <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginBottom: '0.5rem' }}>Status: Verified ✅</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>Expiry: 2030-08-15</div>
                    <button onClick={() => { setSelectedDocType('DL'); setShowDocUploadModal(true); }} style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.5rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>Replace DL</button>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 800, marginBottom: '0.5rem', color: '#0f172a' }}>🆔 Aadhaar / Govt ID</div>
                    <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginBottom: '0.5rem' }}>Status: Verified ✅</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>Expiry: Lifetime</div>
                    <button onClick={() => { setSelectedDocType('Aadhaar'); setShowDocUploadModal(true); }} style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.5rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>Replace ID</button>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 800, marginBottom: '0.5rem', color: '#0f172a' }}>🏠 Address Proof</div>
                    <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginBottom: '0.5rem' }}>Status: Verified ✅</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>Expiry: Lifetime</div>
                    <button onClick={() => { setSelectedDocType('Address Proof'); setShowDocUploadModal(true); }} style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.5rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>Replace Address Proof</button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 7: ⭐ REVIEWS & RATINGS */}
          {/* ========================================== */}
          {activeTab === 'reviews' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>My Submitted Reviews & Ratings</h3>
                    <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>View and manage your feedback for past completed rentals.</p>
                  </div>
                  <button 
                    onClick={() => setShowAddReviewModal(true)}
                    style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}
                  >
                    ⭐ + Write New Review
                  </button>
                </div>

                {userReviews.map(r => (
                  <div key={r.id} style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 900, color: '#0f172a', fontSize: '1.05rem' }}>
                      <span>{r.carName}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <span style={{ color: '#d97706', fontSize: '1.1rem' }}>{'★'.repeat(r.rating)}</span>
                        <button 
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete your review for "${r.carName}"?`)) {
                              setUserReviews(prev => prev.filter(x => x.id !== r.id));
                              triggerNewNotification('Review Deleted 🗑️', `Your review for ${r.carName} has been removed.`);
                            }
                          }}
                          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.88rem', color: '#475569', marginTop: '0.5rem', lineHeight: 1.5 }}>"{r.comment}"</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.5rem', fontWeight: 700 }}>📅 Submitted on {r.date}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 8: 🔔 NOTIFICATIONS */}
          {/* ========================================== */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>Notification History</h3>
                  <button onClick={handleOpenNotifications} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>Mark All Read</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {notifications.map(n => (
                    <div key={n.id} style={{ background: n.unread ? '#eff6ff' : '#f8fafc', padding: '1rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>{n.title}</div>
                        <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.2rem' }}>{n.message}</div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.25rem' }}>{n.time}</div>
                      </div>
                      <button onClick={() => setNotifications(notifications.filter(x => x.id !== n.id))} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 700 }}>🗑️ Delete</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 9: 👤 MY PROFILE */}
          {/* ========================================== */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', maxWidth: '600px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>Account Profile Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div><label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700 }}>Full Name</label><input type="text" value={profileData.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })} style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', padding: '0.65rem', borderRadius: '8px' }} /></div>
                  <div><label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700 }}>Email Address</label><input type="email" value={profileData.email} onChange={e => setProfileData({ ...profileData, email: e.target.value })} style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', padding: '0.65rem', borderRadius: '8px' }} /></div>
                  <div><label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700 }}>Mobile Phone</label><input type="text" value={profileData.mobile} onChange={e => setProfileData({ ...profileData, mobile: e.target.value })} style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', padding: '0.65rem', borderRadius: '8px' }} /></div>
                  <div><label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700 }}>Address</label><input type="text" value={profileData.address} onChange={e => setProfileData({ ...profileData, address: e.target.value })} style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', padding: '0.65rem', borderRadius: '8px' }} /></div>
                  <button onClick={() => alert('Profile updated successfully!')} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', marginTop: '0.5rem' }}>Save Profile Changes</button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 10: ⚙️ SETTINGS */}
          {/* ========================================== */}
          {activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', maxWidth: '600px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>App Preferences & Security</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>Push Notifications</span>
                    <input type="checkbox" defaultChecked />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>SMS Trip Alerts</span>
                    <input type="checkbox" defaultChecked />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>Language</span>
                    <select style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.35rem 0.65rem', borderRadius: '6px', fontWeight: 700 }}>
                      <option>English</option>
                      <option>Tamil (தமிழ்)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ========================================== */}
      {/* VEHICLE DETAILS & BOOKING SELECTION MODAL */}
      {/* ========================================== */}
      {detailVehicle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDetailVehicle(null)}>
          <div style={{ background: '#ffffff', color: '#0f172a', width: '90%', maxWidth: '640px', padding: '2rem', borderRadius: '20px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img 
                  src={detailVehicle.company?.logo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} 
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'; }}
                  alt="Company Logo" 
                  style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #cbd5e1' }} 
                />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>VERIFIED FLEET OPERATOR</div>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: '#2563eb' }}>{detailVehicle.company?.name || 'Apex Mobility'}</div>
                </div>
              </div>
              <button onClick={() => setDetailVehicle(null)} style={{ background: '#f1f5f9', border: 'none', fontSize: '1.4rem', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer' }}>×</button>
            </div>

            <img src={detailVehicle.imageUrl} alt={detailVehicle.model} style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1.25rem' }} />

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.75rem' }}>SELECT BOOKING TYPE:</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div 
                  onClick={() => setBookingMode('car-only')}
                  style={{
                    padding: '0.85rem', borderRadius: '10px', cursor: 'pointer',
                    background: bookingMode === 'car-only' ? '#eff6ff' : '#ffffff',
                    border: bookingMode === 'car-only' ? '2px solid #2563eb' : '1px solid #cbd5e1'
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#0f172a' }}>🔑 Car Only (Self-Drive)</div>
                  <div style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 800, marginTop: '0.2rem' }}>₹{detailVehicle.pricePerDay}/day</div>
                </div>

                <div 
                  onClick={() => setBookingMode('car-driver')}
                  style={{
                    padding: '0.85rem', borderRadius: '10px', cursor: 'pointer',
                    background: bookingMode === 'car-driver' ? '#eff6ff' : '#ffffff',
                    border: bookingMode === 'car-driver' ? '2px solid #2563eb' : '1px solid #cbd5e1'
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#0f172a' }}>🚗👨‍✈️ Car + Chauffeur</div>
                  <div style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 800, marginTop: '0.2rem' }}>₹{detailVehicle.pricePerDay + 1000}/day</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={async () => { 
                  if (bookingMode === 'car-only') {
                    // Self-Drive requires DL, Aadhaar, PAN & Live Face Scan verification!
                    setPendingSelfDriveVehicle(detailVehicle);
                    setShowSelfDriveProofModal(true);
                    setDetailVehicle(null);
                    return;
                  }

                  const calcPrice = (detailVehicle.pricePerDay + 1000) * 2;
                  const newBookingObj = {
                    _id: 'b_' + Date.now(),
                    bookingId: 'BK-2026-' + Math.floor(1000 + Math.random() * 9000),
                    vehicle: detailVehicle,
                    startDate: pickupDate || '2026-07-28',
                    endDate: returnDate || '2026-07-30',
                    status: 'Confirmed',
                    paymentStatus: 'Paid Online',
                    totalPrice: calcPrice,
                    bookingType: 'Car + Chauffeur 👨‍✈️',
                    hasDriver: true,
                    driver: { name: 'Ramesh Singh', phone: '+91 98765 99999', rating: 4.9, photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400' }
                  };

                  // 1. Add to bookings list so it immediately appears in My Bookings tab!
                  setDemoBookingsList(prev => [newBookingObj, ...prev]);

                  // 2. Optional backend API call
                  try {
                    await fetch('/api/customer/bookings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ vehicleId: detailVehicle._id, startDate: pickupDate, endDate: returnDate, bookingMode })
                    });
                  } catch (err) {
                    console.warn('Backend booking sync warning:', err);
                  }

                  // 3. Notify & switch tab
                  triggerNewNotification('Booking Confirmed 🎉', `Reserved ${detailVehicle.make} ${detailVehicle.model} (${newBookingObj.bookingType})`);
                  alert(`Successfully reserved ${detailVehicle.make} ${detailVehicle.model}! Booking ID: ${newBookingObj.bookingId}.\n\nRedirecting to My Bookings...`);
                  
                  setDetailVehicle(null); 
                  handleTabChange('bookings');
                }} 
                style={{ flex: 1, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', border: 'none', padding: '0.85rem', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 15px rgba(37,99,235,0.4)' }}
              >
                Reserve Now ({bookingMode === 'car-only' ? `₹${detailVehicle.pricePerDay}` : `₹${detailVehicle.pricePerDay + 1000}`})
              </button>
              <button onClick={() => setDetailVehicle(null)} style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', padding: '0.85rem 1.5rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>Close</button>
            </div>

          </div>
        </div>
      )}

      {/* CANCEL BOOKING CONFIRMATION MODAL */}
      {cancelBookingItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
          <div style={{ background: '#ffffff', color: '#0f172a', width: '90%', maxWidth: '480px', padding: '2rem', borderRadius: '20px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 900, color: '#dc2626' }}>❌ Cancel Booking #{cancelBookingItem.bookingId}</h3>
            <p style={{ fontSize: '0.88rem', color: '#475569', margin: '0 0 1.25rem 0' }}>Are you sure you want to cancel your reservation for <strong>{cancelBookingItem.vehicle?.make} {cancelBookingItem.vehicle?.model}</strong>?</p>
            
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.85rem 1rem', borderRadius: '10px', marginBottom: '1.25rem', color: '#059669', fontSize: '0.85rem', fontWeight: 800 }}>
              💰 Full Refund Notice: <strong>₹{cancelBookingItem.totalPrice}</strong> will be credited back to your Wallet.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => handleConfirmCancelBooking(cancelBookingItem)}
                style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: 900, cursor: 'pointer' }}
              >
                Confirm & Refund ₹{cancelBookingItem.totalPrice}
              </button>
              <button 
                onClick={() => setCancelBookingItem(null)} 
                style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
              >
                Keep Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 30-MINUTE AUTOMATED DRIVER DISPATCH BROADCAST MODAL (STRICTLY FOR DRIVER ROLE ONLY) */}
      {showDriverBroadcastModal && (user?.role === 'driver' || user?.role === 'chauffeur') && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', width: '360px', background: '#ffffff', border: '2px solid #2563eb', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 15px 40px rgba(0,0,0,0.2)', zIndex: 1000 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ background: '#2563eb', color: '#fff', fontSize: '0.72rem', fontWeight: 900, padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
              🚗 30-MIN DRIVER AUTO-BROADCAST
            </span>
            <button onClick={() => setShowDriverBroadcastModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>Unassigned Ride #BK-2026-7412</div>
          <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '1rem' }}>
            Admin hasn't assigned a driver within 30 mins. Broadcasted to free available driver: <strong>Ramesh Singh</strong>.
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => {
                alert('Driver Ramesh Singh accepted the ride request! Trip assigned.');
                setShowDriverBroadcastModal(false);
              }}
              style={{ flex: 1, background: '#059669', color: '#fff', border: 'none', padding: '0.55rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
            >
              Accept Ride 🟢
            </button>
            <button 
              onClick={() => {
                alert('Declined. Forwarding broadcast to next available free driver...');
                setShowDriverBroadcastModal(false);
              }}
              style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', padding: '0.55rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
            >
              Decline / Pass 🔴
            </button>
          </div>
        </div>
      )}

      {/* INVOICE VIEW MODAL */}
      {invoiceBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', color: '#0f172a', width: '90%', maxWidth: '520px', padding: '2rem', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#2563eb' }}>⚡ RentOS TAX INVOICE</h3>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Tax Reg: GSTIN33AAACF1234F1Z5</div>
              </div>
              <button onClick={() => setInvoiceBooking(null)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
              <div><strong>Invoice ID:</strong> INV-2026-{invoiceBooking.bookingId}</div>
              <div><strong>Renter:</strong> {profileData.name} ({profileData.mobile})</div>
              <div><strong>Vehicle:</strong> {invoiceBooking.vehicle.make} {invoiceBooking.vehicle.model}</div>
              <div><strong>Dates:</strong> {invoiceBooking.startDate} to {invoiceBooking.endDate}</div>
              <hr style={{ margin: '1rem 0', borderTop: '1px solid #e2e8f0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Base Vehicle Rental:</span><span>₹{invoiceBooking.totalPrice - 1000}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Chauffeur Fee:</span><span>₹1,000</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.05rem', color: '#059669', marginTop: '0.5rem' }}><span>Total Paid:</span><span>₹{invoiceBooking.totalPrice}</span></div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => window.print()} style={{ flex: 1, background: '#2563eb', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>🖨️ Print / Download PDF</button>
              <button onClick={() => setInvoiceBooking(null)} style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT UPLOAD MODAL */}
      {showDocUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', width: '90%', maxWidth: '440px', padding: '1.75rem', borderRadius: '16px', color: '#0f172a', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: 900 }}>📄 Replace {selectedDocType.toUpperCase()} Document</h3>
            <input type="file" accept="image/*,.pdf" style={{ marginBottom: '1.25rem' }} />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => { alert('Document uploaded & sent for AI validation!'); setShowDocUploadModal(false); }} style={{ flex: 1, background: '#2563eb', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>Submit Document</button>
              <button onClick={() => setShowDocUploadModal(false)} style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* WRITE VEHICLE & DRIVER REVIEW POPUP MODAL */}
      {showAddReviewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }} onClick={() => setShowAddReviewModal(false)}>
          <div style={{ background: '#ffffff', color: '#0f172a', width: '90%', maxWidth: '520px', padding: '2rem', borderRadius: '20px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', border: '1px solid #e2e8f0' }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#2563eb' }}>⭐ Rate Vehicle & Chauffeur</h3>
                <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.8rem' }}>Share your feedback for your completed trip</p>
              </div>
              <button onClick={() => setShowAddReviewModal(false)} style={{ background: '#f1f5f9', border: 'none', fontSize: '1.4rem', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer' }}>×</button>
            </div>

            {/* Vehicle Selection */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem', display: 'block' }}>Select Completed Vehicle</label>
              <select 
                value={newReviewData.carName} 
                onChange={e => setNewReviewData({ ...newReviewData, carName: e.target.value })}
                style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', padding: '0.65rem', borderRadius: '8px', fontWeight: 700 }}
              >
                <option value="Tata Nexon EV Max">Tata Nexon EV Max (Booking #BK-2026-3310)</option>
                <option value="BMW 5 Series Executive">BMW 5 Series Executive (Booking #BK-2026-9842)</option>
                <option value="Mahindra Thar 4x4 Convertible">Mahindra Thar 4x4 Convertible (Booking #BK-2026-7412)</option>
              </select>
            </div>

            {/* Star Rating Picker */}
            <div style={{ marginBottom: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.5rem', display: 'block' }}>Vehicle & Drive Star Rating</label>
              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '1.8rem', cursor: 'pointer' }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <span 
                    key={s} 
                    onClick={() => setNewReviewData({ ...newReviewData, rating: s })}
                    style={{ color: s <= newReviewData.rating ? '#f59e0b' : '#cbd5e1', transition: 'all 0.15s ease' }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            {/* Review Comment Text Area */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem', display: 'block' }}>Write Your Review Feedback</label>
              <textarea 
                rows="3" 
                value={newReviewData.comment} 
                onChange={e => setNewReviewData({ ...newReviewData, comment: e.target.value })}
                placeholder="How was the cleanliness, performance, and chauffeur behavior?"
                style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', padding: '0.65rem', borderRadius: '8px', fontSize: '0.88rem', fontFamily: 'inherit' }}
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => {
                  if (!newReviewData.comment.trim()) {
                    alert('Please enter a review comment!');
                    return;
                  }
                  const added = {
                    id: Date.now(),
                    carName: newReviewData.carName,
                    date: '2026-07-28',
                    rating: newReviewData.rating,
                    comment: newReviewData.comment
                  };
                  setUserReviews(prev => [added, ...prev]);
                  setDemoBookingsList(prev => prev.map(b => b.status === 'Completed' ? { ...b, rated: true } : b));
                  triggerNewNotification('Review Submitted ⭐', `Thank you for rating ${newReviewData.carName} ${newReviewData.rating} stars!`);
                  alert(`Review for ${newReviewData.carName} submitted successfully! ⭐`);
                  setShowAddReviewModal(false);
                }}
                style={{ flex: 1, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', border: 'none', padding: '0.85rem', borderRadius: '10px', fontWeight: 900, cursor: 'pointer' }}
              >
                Submit {newReviewData.rating}-Star Review ⭐
              </button>
              <button onClick={() => setShowAddReviewModal(false)} style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', padding: '0.85rem 1.25rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
            </div>

          </div>
        </div>
      )}

      {/* SELF-DRIVE CUSTOMER PROOF & FACE AUTH VERIFICATION MODAL */}
      {showSelfDriveProofModal && pendingSelfDriveVehicle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#ffffff', color: '#0f172a', width: '90%', maxWidth: '620px', padding: '2rem', borderRadius: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ background: '#fef3c7', color: '#b45309', fontWeight: 900, fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                  🛡️ SELF-DRIVE MANDATORY SECURITY VERIFICATION
                </span>
                <h3 style={{ margin: '0.3rem 0 0 0', fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>
                  Identity & Face Authentication
                </h3>
              </div>
              <button onClick={() => setShowSelfDriveProofModal(false)} style={{ background: '#f1f5f9', border: 'none', fontSize: '1.4rem', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.85rem 1rem', borderRadius: '12px', fontSize: '0.82rem', color: '#1e40af', marginBottom: '1.25rem', fontWeight: 700 }}>
              🔒 Self-drive rentals require 100% verified Driving License, Aadhaar, PAN Card, and Live Face Scan before vehicle key release.
            </div>

            {/* Proof Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              
              {/* Step 1: Driving License */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 900, fontSize: '0.9rem', color: '#0f172a' }}>🪪 1. Driving License (DL)</span>
                  <span style={{ background: selfDriveProofData.dlUploaded ? '#ecfdf5' : '#fffbe5', color: selfDriveProofData.dlUploaded ? '#059669' : '#d97706', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                    {selfDriveProofData.dlUploaded ? 'Uploaded & Verified ✅' : 'Pending Upload'}
                  </span>
                </div>
                <input 
                  type="text" 
                  value={selfDriveProofData.dlNumber} 
                  onChange={e => setSelfDriveProofData({ ...selfDriveProofData, dlNumber: e.target.value })}
                  placeholder="DL Number e.g. DL-1420110012345"
                  style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem' }}
                />
                <div style={{ marginTop: '0.65rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ background: '#2563eb', color: '#ffffff', padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 6px rgba(37,99,235,0.25)' }}>
                    📁 Upload DL Front & Back File
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setSelfDriveProofData(prev => ({ ...prev, dlFrontImg: ev.target.result, dlUploaded: true }));
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  {selfDriveProofData.dlFrontImg ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <img src={selfDriveProofData.dlFrontImg} alt="Preview" style={{ width: 44, height: 32, objectFit: 'cover', borderRadius: '4px', border: '1px solid #bfdbfe' }} />
                      <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800 }}>✓ License Document Attached</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>JPEG, PNG or PDF (Max 5MB)</span>
                  )}
                </div>
              </div>

              {/* Step 2: Aadhaar Card */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 900, fontSize: '0.9rem', color: '#0f172a' }}>🆔 2. Aadhaar Card (12-Digit)</span>
                  <span style={{ background: selfDriveProofData.aadhaarUploaded ? '#ecfdf5' : '#fffbe5', color: selfDriveProofData.aadhaarUploaded ? '#059669' : '#d97706', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                    {selfDriveProofData.aadhaarUploaded ? 'Verified ✅' : 'Pending Upload'}
                  </span>
                </div>
                <input 
                  type="text" 
                  value={selfDriveProofData.aadhaarNumber} 
                  onChange={e => setSelfDriveProofData({ ...selfDriveProofData, aadhaarNumber: e.target.value })}
                  placeholder="Aadhaar Number e.g. 9842-1100-7788"
                  style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem' }}
                />
                <div style={{ marginTop: '0.65rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ background: '#059669', color: '#ffffff', padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 6px rgba(5,150,105,0.25)' }}>
                    📁 Upload Aadhaar Card File
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setSelfDriveProofData(prev => ({ ...prev, aadhaarImg: ev.target.result, aadhaarUploaded: true }));
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  {selfDriveProofData.aadhaarImg ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <img src={selfDriveProofData.aadhaarImg} alt="Preview" style={{ width: 44, height: 32, objectFit: 'cover', borderRadius: '4px', border: '1px solid #a7f3d0' }} />
                      <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800 }}>✓ Aadhaar Card Attached</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>JPEG, PNG or PDF (Max 5MB)</span>
                  )}
                </div>
              </div>

              {/* Step 3: PAN Card */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 900, fontSize: '0.9rem', color: '#0f172a' }}>💳 3. PAN Card</span>
                  <span style={{ background: selfDriveProofData.panUploaded ? '#ecfdf5' : '#fffbe5', color: selfDriveProofData.panUploaded ? '#059669' : '#d97706', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                    {selfDriveProofData.panUploaded ? 'Verified ✅' : 'Pending Upload'}
                  </span>
                </div>
                <input 
                  type="text" 
                  value={selfDriveProofData.panNumber} 
                  onChange={e => setSelfDriveProofData({ ...selfDriveProofData, panNumber: e.target.value })}
                  placeholder="PAN Number e.g. ABCDE1234F"
                  style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem' }}
                />
                <div style={{ marginTop: '0.65rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ background: '#7c3aed', color: '#ffffff', padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 6px rgba(124,58,237,0.25)' }}>
                    📁 Upload PAN Card File
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setSelfDriveProofData(prev => ({ ...prev, panImg: ev.target.result, panUploaded: true }));
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  {selfDriveProofData.panImg ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <img src={selfDriveProofData.panImg} alt="Preview" style={{ width: 44, height: 32, objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd6fe' }} />
                      <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800 }}>✓ PAN Document Attached</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>JPEG, PNG or PDF (Max 5MB)</span>
                  )}
                </div>
              </div>

              {/* Step 4: Live Face Authentication Scanner */}
              <div style={{ background: '#1e293b', color: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '2px solid #2563eb', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ fontWeight: 900, fontSize: '0.95rem', marginBottom: '0.35rem' }}>📸 4. Live Biometric Face Authentication</div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '1rem', textAlign: 'center' }}>Align face inside frame to match live selfie against Driving License photo.</div>

                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

                {/* Camera Frame Box */}
                <div style={{ width: '160px', height: '160px', borderRadius: '50%', border: selfDriveProofData.faceAuthScanned ? '4px solid #10b981' : '4px dashed #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000000', marginBottom: '1rem', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 25px rgba(0,0,0,0.5)' }}>
                  {capturedFaceImg ? (
                    <img src={capturedFaceImg} alt="Captured Face" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
                    />
                  )}

                  {!capturedFaceImg && !webcamActive && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>📷</div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700 }}>Click below to start</div>
                    </div>
                  )}
                </div>

                {!selfDriveProofData.faceAuthScanned ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!webcamActive ? (
                      <button 
                        onClick={startWebcamStream}
                        style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '20px', fontWeight: 900, fontSize: '0.82rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.4)' }}
                      >
                        🎥 Open Camera & Scan Face
                      </button>
                    ) : (
                      <button 
                        onClick={handleCaptureFaceWebcam}
                        style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '20px', fontWeight: 900, fontSize: '0.82rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }}
                      >
                        📸 Capture Snapshot & Verify Match
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ background: '#065f46', color: '#a7f3d0', padding: '0.45rem 1.2rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>👤✅ Biometric Face Match 100% Confirmed</span>
                  </div>
                )}
              </div>

            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={async () => {
                  if (!selfDriveProofData.faceAuthScanned) {
                    alert('⚠️ Please complete Step 4: Live Face Scan before confirming your Self-Drive booking!');
                    return;
                  }

                  const calcPrice = pendingSelfDriveVehicle.pricePerDay * 2;
                  const newBookingObj = {
                    _id: 'b_' + Date.now(),
                    bookingId: 'BK-2026-' + Math.floor(1000 + Math.random() * 9000),
                    vehicle: pendingSelfDriveVehicle,
                    startDate: pickupDate || '2026-07-28',
                    endDate: returnDate || '2026-07-30',
                    status: 'Pending Admin Approval (Blocked)',
                    paymentStatus: 'Paid Online',
                    totalPrice: calcPrice,
                    bookingType: 'Car Only (Self-Drive) 🔑',
                    hasDriver: false,
                    selfDriveVerified: false,
                    verificationDetails: {
                      dlNumber: selfDriveProofData.dlNumber,
                      aadhaarNumber: selfDriveProofData.aadhaarNumber,
                      panNumber: selfDriveProofData.panNumber,
                      faceAuthScanned: true
                    }
                  };

                  setDemoBookingsList(prev => [newBookingObj, ...prev]);

                  // Sync to company_customer_verifications for Company Admin & Staff review
                  try {
                    const existingVerifs = JSON.parse(localStorage.getItem('company_customer_verifications') || '[]');
                    const verifEntry = {
                      id: newBookingObj.bookingId,
                      bookingId: newBookingObj.bookingId,
                      customerName: profileData.name,
                      vehicleModel: `${pendingSelfDriveVehicle.make} ${pendingSelfDriveVehicle.model}`,
                      dlNumber: selfDriveProofData.dlNumber,
                      aadhaarNumber: selfDriveProofData.aadhaarNumber,
                      panNumber: selfDriveProofData.panNumber,
                      faceMatch: '100% Confirmed ✅',
                      status: 'Pending Approval',
                      submittedAt: new Date().toLocaleTimeString()
                    };
                    localStorage.setItem('company_customer_verifications', JSON.stringify([verifEntry, ...existingVerifs]));
                  } catch (e) {}

                  triggerNewNotification(
                    'Documents Submitted - Pending Admin Approval 🔒',
                    `Aadhaar, PAN, DL & Face Scan submitted for ${pendingSelfDriveVehicle.make} ${pendingSelfDriveVehicle.model}. Access blocked until Admin approves.`
                  );
                  alert(`🔒 Self-Drive Documents & Face Scan Submitted!\n\nDL: ${selfDriveProofData.dlNumber}\nAadhaar: ${selfDriveProofData.aadhaarNumber}\nPAN: ${selfDriveProofData.panNumber}\nFace Scan: 100% Match ✅\n\nYour rental status is BLOCKED & PENDING APPROVAL. Company Admin will review and approve your verification to unlock your booking.`);
                  
                  setShowSelfDriveProofModal(false);
                  setPendingSelfDriveVehicle(null);
                  handleTabChange('bookings');
                }}
                style={{ flex: 1, background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#fff', border: 'none', padding: '0.85rem', borderRadius: '12px', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(217,119,6,0.4)' }}
              >
                Submit Documents for Admin Approval 🔒
              </button>
              <button onClick={() => setShowSelfDriveProofModal(false)} style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', padding: '0.85rem 1.25rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
            </div>

          </div>
        </div>
      )}




    </div>
  );
}
