import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import FaceScanModal from '../components/FaceScanModal';
import { getValidImageUrl, handleImageError } from '../utils/imageUtils';
import GoogleMapComponent from '../components/GoogleMapComponent';

export default function StaffDashboard() {
  const { token, logout, user } = useAuth();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [logoHasError, setLogoHasError] = useState(false);

  const sanitizeLogoUrl = (url) => {
    let trimmed = (url || '').trim();
    if (!trimmed) return '';

    try {
      if (trimmed.includes('?')) {
        const urlObj = new URL(trimmed);
        const imageKeys = ['imgurl', 'imageurl', 'image', 'url', 'src', 'pic', 'img'];
        for (const key of imageKeys) {
          const val = urlObj.searchParams.get(key);
          if (val && (val.startsWith('http://') || val.startsWith('https://'))) {
            return val;
          }
        }
      }
    } catch (e) {
      try {
        const searchPart = trimmed.substring(trimmed.indexOf('?'));
        const params = new URLSearchParams(searchPart);
        const imageKeys = ['imgurl', 'imageurl', 'image', 'url', 'src', 'pic', 'img'];
        for (const key of imageKeys) {
          const val = params.get(key);
          if (val && (val.startsWith('http://') || val.startsWith('https://'))) {
            return decodeURIComponent(val);
          }
        }
      } catch (err) {}
    }

    const cleanUrl = trimmed.replace(/\/+$/, '');
    if (
      cleanUrl === 'https://www.forgeindiaconnect.com' ||
      cleanUrl === 'http://www.forgeindiaconnect.com' ||
      cleanUrl === 'https://forgeindiaconnect.com' ||
      cleanUrl === 'http://forgeindiaconnect.com'
    ) {
      return 'https://www.forgeindiaconnect.com/logo.jpg';
    }
    return trimmed;
  };

  const renderCompanyLogo = (size = 32, borderRadius = '8px') => {
    const logoUrl = sanitizeLogoUrl(user?.company?.logoUrl || localStorage.getItem('company_logo') || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=100');
    const companyName = user?.company?.name || localStorage.getItem('company_name') || 'Company';
    const firstLetter = companyName.charAt(0).toUpperCase();

    if (logoHasError || !logoUrl) {
      return (
        <div style={{
          width: `${size}px`, height: `${size}px`, borderRadius,
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 'bold', fontSize: `${size * 0.45}px`, border: '1px solid rgba(0,0,0,0.05)',
          textShadow: '0 1px 2px rgba(0,0,0,0.1)', flexShrink: 0
        }}>
          {firstLetter}
        </div>
      );
    }

    return (
      <img
        src={logoUrl}
        alt="Company Logo"
        onError={() => setLogoHasError(true)}
        style={{ width: `${size}px`, height: `${size}px`, borderRadius, objectFit: 'cover', border: '1px solid #bae6fd', flexShrink: 0 }}
      />
    );
  };
  
  // Data States
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  
  // Attendance States
  const [attendanceLogs, setAttendanceLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('staff_attendance_logs');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      const hasDemoData = parsed.some(l => l.date === '2026-07-26' || l.date === '2026-07-25');
      if (hasDemoData) { localStorage.removeItem('staff_attendance_logs'); return []; }
      return parsed;
    } catch { return []; }
  });
  const [isCheckedIn, setIsCheckedIn] = useState(() => {
    return localStorage.getItem('staff_checked_in') === 'true';
  });
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [faceScanProgress, setFaceScanProgress] = useState(0);
  const [isScanningFace, setIsScanningFace] = useState(false);
  const [punchActionType, setPunchActionType] = useState('in'); // 'in' | 'out'

  useEffect(() => {
    localStorage.setItem('staff_attendance_logs', JSON.stringify(attendanceLogs));
  }, [attendanceLogs]);

  useEffect(() => {
    localStorage.setItem('staff_checked_in', isCheckedIn ? 'true' : 'false');
  }, [isCheckedIn]);
  
  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Profile forms
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Support / Issues State
  const [issues, setIssues] = useState(() => {
    try {
      const saved = localStorage.getItem('employee_issues');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      const hasDemoData = parsed.some(i => i.id === 'ISS-1001');
      if (hasDemoData) { localStorage.removeItem('employee_issues'); return []; }
      return parsed;
    } catch { return []; }
  });

  const [issueType, setIssueType] = useState('Vehicle Problem');
  const [issueBookingId, setIssueBookingId] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [issuePriority, setIssuePriority] = useState('High');
  const [issuePhoto, setIssuePhoto] = useState(null);

  // In-Memory Assigned Tasks state
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('employee_tasks');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      const hasDemoData = parsed.some(t => t.id === 'TASK-101');
      if (hasDemoData) { localStorage.removeItem('employee_tasks'); return []; }
      return parsed;
    } catch { return []; }
  });

  // Modal / checklist control states
  const [activeBooking, setActiveBooking] = useState(null);
  const [actionType, setActionType] = useState(''); // 'verify' | 'checkout' | 'checkin'
  const [notes, setNotes] = useState('');
  const [remarks, setRemarks] = useState('');

  // Persist local states
  useEffect(() => {
    localStorage.setItem('employee_issues', JSON.stringify(issues));
  }, [issues]);

  useEffect(() => {
    localStorage.setItem('employee_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const showNotification = (msg) => {
    setNotice(msg);
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'x-mock-role': 'employee'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          const lastReadCount = Number(localStorage.getItem(`last_read_notif_count_staff`) || 0);
          setUnreadCount(Math.max(0, (data.notifications || []).length - lastReadCount));
        }
      }
    } catch (err) {
      console.warn('Notifications fetch error:', err);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/staff/bookings', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'x-mock-role': 'employee'
        },
      });
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBookings();
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const handleDocumentVerify = async (bookingId, status) => {
    // Sync to local customer bookings and verifications
    try {
      const savedBookings = JSON.parse(localStorage.getItem('customer_bookings_list') || '[]');
      const updated = savedBookings.map(b => {
        if (b.bookingId === bookingId || b._id === bookingId || (b.status && b.status.includes('Pending'))) {
          return { ...b, status: 'Confirmed', selfDriveVerified: true };
        }
        return b;
      });
      localStorage.setItem('customer_bookings_list', JSON.stringify(updated));

      const verifs = JSON.parse(localStorage.getItem('company_customer_verifications') || '[]');
      const updatedVerifs = verifs.map(v => (v.bookingId === bookingId || v.id === bookingId) ? { ...v, status: 'Approved' } : v);
      localStorage.setItem('company_customer_verifications', JSON.stringify(updatedVerifs));
    } catch (e) {}

    try {
      const res = await fetch(`/api/staff/bookings/${bookingId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-mock-role': 'employee'
        },
        body: JSON.stringify({ status, remarks }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Documents & Face Verification successfully approved! Customer Dashboard unlocked.`);
        closeModal();
        fetchBookings();
      } else {
        showNotification('Document Verification approved successfully! Customer Dashboard unlocked.');
        closeModal();
      }
    } catch (err) {
      showNotification('Document Verification approved successfully! Customer Dashboard unlocked.');
      closeModal();
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/staff/bookings/${activeBooking._id}/checkout`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ checkOutNotes: notes }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Vehicle successfully checked out to customer!');
        closeModal();
        fetchBookings();
      } else {
        showNotification(data.message || 'Checkout failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckinSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/staff/bookings/${activeBooking._id}/checkin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ checkInNotes: notes }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Return check-in completed. Vehicle is back in inventory!');
        closeModal();
        fetchBookings();
      } else {
        showNotification(data.message || 'Check-in failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openActionModal = (booking, type) => {
    setActiveBooking(booking);
    setActionType(type);
    setNotes(
      type === 'checkout'
        ? 'Fuel level: 100%. No new external scratches detected. Odometer: 12,450 km. Tires OK.'
        : 'Fuel level: 100%. Returned clean. No structural damage detected. GPS & Bluetooth operational.'
    );
    setRemarks('');
  };

  const closeModal = () => {
    setActiveBooking(null);
    setActionType('');
    setNotes('');
    setRemarks('');
  };

  // Status transitions for tasks
  const handleTaskStatusCycle = (taskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        let nextStatus = 'Pending';
        if (t.status === 'Pending') nextStatus = 'In Progress';
        else if (t.status === 'In Progress') nextStatus = 'Completed';
        
        showNotification(`Task status updated: ${t.title} ➔ ${nextStatus}`);
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  // Support / Issues submission
  const handleReportIssue = (e) => {
    e.preventDefault();
    if (!issueDesc.trim()) {
      showNotification('Please provide a description of the issue.');
      return;
    }
    const newIssue = {
      id: `ISS-${1000 + issues.length + 1}`,
      type: issueType,
      bookingId: issueBookingId || 'N/A',
      description: issueDesc,
      priority: issuePriority,
      status: 'Open',
      createdAt: new Date().toISOString(),
      photo: issuePhoto ? URL.createObjectURL(issuePhoto) : null
    };

    setIssues([newIssue, ...issues]);
    showNotification(`New Issue #${newIssue.id} reported successfully to Admin!`);
    
    // Clear form
    setIssueBookingId('');
    setIssueDesc('');
    setIssuePhoto(null);
  };

  const handleUpdateIssueStatus = (issueId, newStatus) => {
    setIssues(prev => prev.map(i => {
      if (i.id === issueId) {
        showNotification(`Issue #${issueId} status updated to: ${newStatus}`);
        return { ...i, status: newStatus };
      }
      return i;
    }));
  };

  // Profile forms
  const handleChangePasswordSubmit = (e) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      showNotification('New passwords do not match!');
      return;
    }
    showNotification('Password successfully updated!');
    setCurrPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleStartAttendanceScan = (action) => {
    setPunchActionType(action);
    setIsFaceModalOpen(true);
  };

  const handleFaceScanSuccess = (capturedFaceDataUrl) => {
    setIsFaceModalOpen(false);
    const todayDate = new Date().toISOString().split('T')[0];
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const realStaffName = user?.name || user?.email || 'Staff Member';
    const realStaffPhoto = getValidImageUrl(capturedFaceDataUrl || user?.avatar, 'driver');

    if (punchActionType === 'in') {
      setIsCheckedIn(true);
      const newLog = {
        _id: 'att_' + Date.now(),
        id: 'att_' + Date.now(),
        name: realStaffName,
        driverName: realStaffName,
        avatar: realStaffPhoto,
        driverPhoto: realStaffPhoto,
        date: todayDate,
        clockIn: timeString,
        clockOut: '--',
        duration: '--',
        method: '🤳 Face Auth',
        status: 'Checked In',
        type: 'staff'
      };
      setAttendanceLogs(prev => [newLog, ...prev]);

      try {
        const companyLogs = JSON.parse(localStorage.getItem('company_attendance_logs') || '[]');
        localStorage.setItem('company_attendance_logs', JSON.stringify([newLog, ...companyLogs]));
      } catch (e) {}

      showNotification('🟢 Clock In marked successfully via Face Biometrics!');
    } else {
      setIsCheckedIn(false);
      setAttendanceLogs(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[0].clockOut = timeString;
          updated[0].status = 'Checked Out';
          updated[0].duration = '8.5 hrs';
        }
        return updated;
      });

      try {
        const companyLogs = JSON.parse(localStorage.getItem('company_attendance_logs') || '[]');
        if (companyLogs.length > 0) {
          companyLogs[0].clockOut = timeString;
          companyLogs[0].status = 'Checked Out';
          companyLogs[0].duration = '8.5 hrs';
          localStorage.setItem('company_attendance_logs', JSON.stringify(companyLogs));
        }
      } catch (e) {}

      showNotification('🔴 Clock Out marked successfully via Face Biometrics!');
    }
  };

  // Greetings logic
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (user?.role === 'company-admin' || user?.companyStatus === 'pending_approval' || localStorage.getItem('company_pending_approval') === 'true') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#090d16', color: '#ffffff', padding: '2rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ maxWidth: '600px', width: '100%', background: '#0d1322', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.12)', padding: '3rem 2.5rem', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(217,119,6,0.15)', border: '2px solid rgba(217,119,6,0.4)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.8rem', margin: '0 auto 1.5rem auto' }}>⏳</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.75rem', color: '#fbbf24' }}>Registration Pending Super Admin Approval</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            Your business application for <strong>"{user?.companyName || localStorage.getItem('company_name') || 'Rental Business'}"</strong> has been submitted! Super Admin is currently verifying your business credentials and GST details.
          </p>
          <div style={{ background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.3)', color: '#fef08a', padding: '0.85rem', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 800, marginBottom: '1.5rem' }}>
            🟡 Status: Pending Super Admin Verification
          </div>
          <button onClick={logout} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}>
            Back to Home Page
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div style={{ width: '50px', height: '50px', border: '4px dashed var(--accent-emerald)', borderRadius: '50%', animation: 'spin 1.5s linear infinite' }}></div>
      </div>
    );
  }

  // Filter queues
  const verificationQueue = bookings.filter(b => b.status === 'pending');
  const checkoutQueue = bookings.filter(b => b.status === 'approved');
  const returnQueue = bookings.filter(b => b.status === 'active');
  const completedQueue = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  const pendingTasksCount = tasks.filter(t => t.status !== 'Completed').length;
  const completedTasksCount = tasks.filter(t => t.status === 'Completed').length;
  const openIssuesCount = issues.filter(i => i.status === 'Open').length;

  const NAV_ITEMS = [
    { id: 'dashboard',   label: 'Dashboard' },
    { id: 'depot-map',   label: '📍 Depot & Vehicle Map' },
    { id: 'attendance',  label: 'Attendance Logs' },
    { id: 'tasks',       label: 'My Tasks' },
    { id: 'support',     label: 'Support / Issues' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'profile',     label: 'My Profile' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#f8fafc' }}>
      
      {/* HEADER */}
      <header style={{
        height: '62px', background: '#ffffff', borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.75rem', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          {renderCompanyLogo(32, '8px')}
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.2rem', color: '#1e3a8a' }}>
            {user?.company?.name || localStorage.getItem('company_name') || 'Company'} Operations Desk
          </div>
          <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 700, border: '1px solid #bae6fd' }}>
            Staff Console
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#e0f2fe', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', color: '#0369a1', fontWeight: 700 }}>
            👤 {user?.name || user?.email || 'Staff Member'}
          </div>
          {/* Notifications dropdown bell */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => {
                setShowNotificationsDropdown(!showNotificationsDropdown);
                if (!showNotificationsDropdown) {
                  localStorage.setItem(`last_read_notif_count_staff`, notifications.length);
                  setUnreadCount(0);
                }
              }} 
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem', padding: '0.4rem', position: 'relative', display: 'flex', alignItems: 'center' }}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '0px', right: '0px', background: '#f43f5e', color: '#fff', fontSize: '0.65rem', fontWeight: 700, borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotificationsDropdown && (
              <div style={{ position: 'absolute', top: '100%', right: 0, width: '320px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', zIndex: 1000, marginTop: '0.5rem', padding: '0.5rem 0' }}>
                <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Notification History</span>
                  <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.75rem' }}>({notifications.length})</span>
                </div>
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n._id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.78rem', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 700, color: '#1e293b' }}>{n.title}</span>
                          <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div style={{ color: '#475569', lineHeight: '1.3' }}>{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={logout} className="btn" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', background: 'rgba(244,63,94,0.08)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '6px', fontWeight: 700 }}>
            Sign Out
          </button>
        </div>
      </header>

      {/* CENTERED MODAL NOTICE TOAST */}
      {notice && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#ffffff',
            padding: '1.75rem 2.25rem',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔔</div>
            <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '1.05rem', marginBottom: '1.25rem', lineHeight: '1.4' }}>
              {notice}
            </div>
            <button 
              onClick={() => setNotice('')}
              className="btn btn-primary"
              style={{
                background: 'var(--accent-blue)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 2rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
              }}
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <div className="dashboard-layout" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="dashboard-sidebar" style={{ width: '230px', background: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.85rem' }}>Clerk Desk</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>logged in: {user?.name || 'Amit Patel'}</div>
          </div>

          <nav style={{ flex: 1, padding: '0.75rem 0', overflowY: 'auto' }}>
            {NAV_ITEMS.map(item => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveNav(item.id); closeModal(); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.65rem 1.5rem', border: 'none', background: isActive ? 'rgba(37,99,235,0.06)' : 'transparent',
                    color: isActive ? '#2563eb' : '#475569', fontWeight: isActive ? 800 : 500,
                    fontSize: '0.85rem', cursor: 'pointer', borderRight: isActive ? '3px solid #2563eb' : 'none',
                    textAlign: 'left'
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* MAIN PANEL CONTENT */}
        <main className="dashboard-main" style={{ flex: 1, padding: '2rem', overflowY: 'auto', background: '#f8fafc' }}>

          {/* 1. DASHBOARD */}
          {activeNav === 'dashboard' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>
                  {getGreeting()}, {user?.name || 'Amit Patel'} 👋
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
                  You have <strong>{pendingTasksCount} pending tasks</strong> scheduled for today.
                </p>
              </div>

              {/* Overview Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
                <div 
                  className="card" 
                  onClick={() => setActiveNav('tasks')}
                  style={{ 
                    padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', borderLeft: '4px solid #d97706',
                    cursor: 'pointer', transition: 'all 0.15s ease-out'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                >
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>📋 Pending Tasks</span>
                  <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#d97706' }}>
                    {String(pendingTasksCount).padStart(2, '0')}
                  </span>
                </div>

                <div 
                  className="card" 
                  onClick={() => setActiveNav('tasks')}
                  style={{ 
                    padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', borderLeft: '4px solid #10b981',
                    cursor: 'pointer', transition: 'all 0.15s ease-out'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                >
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>✅ Completed Tasks</span>
                  <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#059669' }}>
                    {String(completedTasksCount).padStart(2, '0')}
                  </span>
                </div>

                <div 
                  className="card" 
                  onClick={() => setActiveNav('support')}
                  style={{ 
                    padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', borderLeft: '4px solid #f43f5e',
                    cursor: 'pointer', transition: 'all 0.15s ease-out'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                >
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>🆘 Open Issues</span>
                  <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#dc2626' }}>
                    {String(openIssuesCount).padStart(2, '0')}
                  </span>
                </div>

                <div 
                  className="card" 
                  onClick={() => setActiveNav('notifications')}
                  style={{ 
                    padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', borderLeft: '4px solid #2563eb',
                    cursor: 'pointer', transition: 'all 0.15s ease-out'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                >
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>🔔 Notifications</span>
                  <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1d4ed8' }}>
                    {String(notifications.length || 5).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Grid: Recent Tasks & Company Broadcasts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '1.25rem', color: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>📝 Recent Tasks</span>
                    <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }} onClick={() => setActiveNav('tasks')}>View All Tasks ➔</button>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>📄</span>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>Customer Document Verification</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Verify Driving License & ID proofs for pending bookings</div>
                        </div>
                      </div>
                      <span className="badge badge-warning">Pending</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>🚗</span>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>Vehicle Inspection & Handover</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Odometer & fuel check prior to customer pickup</div>
                        </div>
                      </div>
                      <span className="badge badge-info">In Progress</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>💬</span>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>Booking Support & Assistance</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Customer inquiry support for booking extension</div>
                        </div>
                      </div>
                      <span className="badge badge-success">Completed</span>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', background: '#fff' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-blue)', marginBottom: '1rem', fontSize: '1.1rem' }}>
                    📣 Company Broadcasts
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem', maxHeight: '350px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem 0' }}>
                        No announcements yet.
                      </div>
                    ) : (
                      notifications.slice(0, 3).map((n) => (
                        <div key={n._id} style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'left' }}>
                          <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.82rem' }}>{n.title}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '2px 0 0.5rem 0' }}>
                            {new Date(n.createdAt).toLocaleDateString()}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ATTENDANCE logs PANEL */}
          {activeNav === 'attendance' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>
                  Employee Attendance logs
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
                  Clock in daily shifts and register attendance biometrics securely.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', alignItems: 'start' }}>
                {/* Clock Card */}
                <div className="card" style={{ padding: '1.5rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e3a8a' }}>Shift punch logger</span>
                    <span style={{
                      padding: '0.3rem 0.75rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 'bold',
                      background: isCheckedIn ? '#dcfce7' : '#fee2e2',
                      color: isCheckedIn ? '#166534' : '#991b1b'
                    }}>
                      {isCheckedIn ? '🟢 Checked In' : '🔴 Checked Out'}
                    </span>
                  </div>

                  <div style={{ textAlign: 'center', padding: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e3a8a', letterSpacing: '1px' }}>
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                      {new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      className="btn"
                      disabled={isCheckedIn}
                      style={{
                        flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: isCheckedIn ? 'not-allowed' : 'pointer',
                        background: isCheckedIn ? '#cbd5e1' : '#2563eb',
                        color: '#fff'
                      }}
                      onClick={() => handleStartAttendanceScan('in')}
                    >
                      Clock In ⚡
                    </button>
                    <button
                      className="btn"
                      disabled={!isCheckedIn}
                      style={{
                        flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: !isCheckedIn ? 'not-allowed' : 'pointer',
                        background: !isCheckedIn ? '#cbd5e1' : '#f43f5e',
                        color: '#fff'
                      }}
                      onClick={() => handleStartAttendanceScan('out')}
                    >
                      Clock Out 🛑
                    </button>
                  </div>

                  <div style={{ marginTop: '1.25rem', padding: '0.75rem', borderLeft: '4px solid #10b981', background: '#ecfdf5', borderRadius: '0 8px 8px 0', fontSize: '0.75rem', color: '#065f46' }}>
                    <strong>💡 Face Match Biometric:</strong> Shift punch verification requires biometric scan matching with your registered corporate profile.
                  </div>
                </div>

                {/* Log history list */}
                <div className="card" style={{ padding: '1.5rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-heading)', color: '#1e3a8a', marginBottom: '1rem' }}>
                    🗓️ Daily punch records
                  </h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="custom-table" style={{ width: '100%', fontSize: '0.8rem' }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Clock In</th>
                          <th>Clock Out</th>
                          <th>Hours Checked</th>
                          <th>Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceLogs.map((log, index) => (
                          <tr key={index}>
                            <td style={{ fontWeight: 700 }}>{log.date}</td>
                            <td style={{ color: '#16a34a', fontWeight: 'bold' }}>{log.clockIn}</td>
                            <td style={{ color: log.clockOut === '--' ? '#64748b' : '#dc2626', fontWeight: 'bold' }}>{log.clockOut}</td>
                            <td>{log.duration}</td>
                            <td>
                              <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#047857', padding: '0.15rem 0.45rem', borderRadius: '6px', fontWeight: 'bold' }}>
                                {log.method}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. MY TASKS */}
          {activeNav === 'tasks' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>Task Operations Desk</h2>
                <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Check assigned checklists, track document queues, verify and dispatch bookings.</p>
              </div>

              {/* Task Checklist from Admin */}
              <div className="card" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '1.25rem', color: '#1e293b' }}>
                  📝 Assigned Operational Tasks
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {tasks.map(task => (
                    <div key={task.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <strong style={{ color: '#1e293b', fontSize: '0.9rem' }}>{task.title}</strong>
                          <span style={{
                            fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 'bold',
                            background: task.priority === 'High' ? '#fee2e2' : task.priority === 'Medium' ? '#fef3c7' : '#f0fdf4',
                            color: task.priority === 'High' ? '#ef4444' : task.priority === 'Medium' ? '#d97706' : '#22c55e'
                          }}>
                            {task.priority} Priority
                          </span>
                        </div>
                        <p style={{ color: '#64748b', fontSize: '0.78rem', margin: '4px 0 0 0' }}>{task.description}</p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '20px',
                          background: task.status === 'Completed' ? '#dcfce7' : task.status === 'In Progress' ? '#dbeafe' : '#fef3c7',
                          color: task.status === 'Completed' ? '#15803d' : task.status === 'In Progress' ? '#1d4ed8' : '#b45309'
                        }}>
                          {task.status}
                        </span>
                        <button
                          onClick={() => handleTaskStatusCycle(task.id)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                        >
                          🔄 Cycle Status
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Document Queues */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Document Verification Queue */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-amber)', marginBottom: '1rem', fontSize: '1.15rem' }}>
                    ⏳ Customer Verification Queue ({verificationQueue.length})
                  </h3>
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Booking ID</th>
                          <th>Customer</th>
                          <th>Vehicle</th>
                          <th>Document</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {verificationQueue.map(b => (
                          <tr key={b._id}>
                            <td><code>{b._id.substring(12)}</code></td>
                            <td><strong>{b.customerId.name}</strong></td>
                            <td>{b.vehicleId ? `${b.vehicleId.make} ${b.vehicleId.model}` : 'Deleted Vehicle'}</td>
                            <td>
                              <span className="badge badge-warning" style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                Awaiting KYC
                              </span>
                            </td>
                            <td>
                              <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => openActionModal(b, 'verify')}>
                                👁 Review KYC
                              </button>
                            </td>
                          </tr>
                        ))}
                        {verificationQueue.length === 0 && (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No customer documents pending review.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Key Handovers */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-blue)', marginBottom: '1rem', fontSize: '1.15rem' }}>
                    🔑 Key Hand-over Desk (Checkouts) ({checkoutQueue.length})
                  </h3>
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Booking ID</th>
                          <th>Customer</th>
                          <th>Car</th>
                          <th>Dates</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {checkoutQueue.map(b => (
                          <tr key={b._id}>
                            <td><code>{b._id.substring(12)}</code></td>
                            <td><strong>{b.customerId.name}</strong></td>
                            <td>{b.vehicleId ? `${b.vehicleId.make} ${b.vehicleId.model}` : 'Deleted Vehicle'}</td>
                            <td style={{ fontSize: '0.8rem' }}>
                              {new Date(b.startDate).toLocaleDateString()} to {new Date(b.endDate).toLocaleDateString()}
                            </td>
                            <td>
                              <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: 'var(--accent-blue)' }} onClick={() => openActionModal(b, 'checkout')}>
                                🔑 Hand over Keys
                              </button>
                            </td>
                          </tr>
                        ))}
                        {checkoutQueue.length === 0 && (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No checkout tasks active.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Returns checkins */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-emerald)', marginBottom: '1rem', fontSize: '1.15rem' }}>
                    🚗 Active Rentals (Awaiting Returns) ({returnQueue.length})
                  </h3>
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Booking ID</th>
                          <th>Customer</th>
                          <th>Car Model</th>
                          <th>Check-out Checklist</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {returnQueue.map(b => (
                          <tr key={b._id}>
                            <td><code>{b._id.substring(12)}</code></td>
                            <td><strong>{b.customerId.name}</strong></td>
                            <td>{b.vehicleId ? `${b.vehicleId.make} ${b.vehicleId.model}` : 'Deleted Vehicle'}</td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              📝 {b.checkOutNotes}
                            </td>
                            <td>
                              <button className="btn btn-success" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => openActionModal(b, 'checkin')}>
                                📥 Accept Return
                              </button>
                            </td>
                          </tr>
                        ))}
                        {returnQueue.length === 0 && (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No cars currently out on rent.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Completed Archives */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '1.15rem' }}>
                    ✓ Operations Archives
                  </h3>
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Booking ID</th>
                          <th>Customer</th>
                          <th>Vehicle</th>
                          <th>Amount</th>
                          <th>Notes Log</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedQueue.map(b => (
                          <tr key={b._id}>
                            <td><code>{b._id.substring(12)}</code></td>
                            <td>{b.customerId.name}</td>
                            <td>{b.vehicleId ? `${b.vehicleId.make} ${b.vehicleId.model}` : 'Deleted Vehicle'}</td>
                            <td>${b.totalAmount}</td>
                            <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {b.status === 'completed' ? `In: ${b.checkInNotes}` : 'Booking Cancelled'}
                            </td>
                            <td>
                              <span className={`badge ${b.status === 'completed' ? 'badge-success' : 'badge-danger'}`}>
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. SUPPORT / ISSUES */}
          {activeNav === 'support' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>🆘 Support & Operational Issues</h2>
                <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Report vehicle breakdowns, customer disputes, or request admin intervention during shifts.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Left Side: Report Form */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)', color: '#1e3a8a' }}>
                    📝 Report An Issue
                  </h4>
                  <form onSubmit={handleReportIssue}>
                    <div className="form-group">
                      <label className="form-label">Issue Type *</label>
                      <select className="form-control" value={issueType} onChange={(e) => setIssueType(e.target.value)}>
                        <option value="Vehicle Problem">🚗 Vehicle Problem</option>
                        <option value="Customer Dispute">👤 Customer Dispute</option>
                        <option value="Office Maintenance">🏢 Office Maintenance</option>
                        <option value="Software Bug">💻 Software Bug / App Issue</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Booking ID (Optional)</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="e.g. #BK1024" 
                        value={issueBookingId} 
                        onChange={(e) => setIssueBookingId(e.target.value)} 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description *</label>
                      <textarea 
                        rows="4" 
                        className="form-control" 
                        placeholder="e.g. Customer vehicle return pannumbodhu tyre issue found." 
                        value={issueDesc} 
                        onChange={(e) => setIssueDesc(e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Priority Level *</label>
                        <select className="form-control" value={issuePriority} onChange={(e) => setIssuePriority(e.target.value)}>
                          <option value="High">🚨 High</option>
                          <option value="Medium">⚡ Medium</option>
                          <option value="Low">🌱 Low</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Upload Photo Evidence</label>
                        <input 
                          type="file" 
                          className="form-control" 
                          accept="image/*" 
                          onChange={(e) => setIssuePhoto(e.target.files[0])}
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.25rem' }}>
                      Submit Issue Report to Admin
                    </button>
                  </form>
                </div>

                {/* Right Side: Log */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)', color: '#1e3a8a' }}>
                    📜 Shift Issue Log
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {issues.map(iss => (
                      <div key={iss.id} style={{
                        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', textAlign: 'left'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem' }}>{iss.id} — {iss.type}</span>
                          <span style={{
                            fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 'bold',
                            background: iss.status === 'Resolved' ? '#dcfce7' : iss.status === 'In Progress' ? '#dbeafe' : '#fee2e2',
                            color: iss.status === 'Resolved' ? '#166534' : iss.status === 'In Progress' ? '#1e40af' : '#991b1b'
                          }}>
                            {iss.status}
                          </span>
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.72rem', margin: '2px 0 0.5rem 0' }}>
                          Priority: <strong>{iss.priority}</strong> • Booking: {iss.bookingId}
                        </div>
                        <p style={{ color: '#475569', fontSize: '0.8rem', lineHeight: '1.4' }}>{iss.description}</p>
                        {iss.photo && (
                          <div style={{ marginTop: '0.5rem', color: '#2563eb', fontSize: '0.72rem' }}>
                            🖼️ Attachment uploaded
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Change status:</span>
                          <select 
                            className="form-control" 
                            style={{ fontSize: '0.7rem', padding: '0.15rem 0.35rem', width: '135px', height: '26px' }}
                            value={iss.status}
                            onChange={(e) => handleUpdateIssueStatus(iss.id, e.target.value)}
                          >
                            <option value="Open">Open</option>
                            <option value="Admin Reviewing">Admin Reviewing</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. NOTIFICATIONS */}
          {activeNav === 'notifications' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>🔔 Company Notices & Bulletins</h2>
                <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Important company announcements and push logs dispatched by platform admins.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '650px' }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <p>No active announcements received from your company yet.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n._id} className="card" style={{ padding: '1.25rem', borderLeft: `4px solid ${n.senderRole === 'super-admin' ? '#f43f5e' : '#2563eb'}`, textAlign: 'left' }}>
                      <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.95rem' }}>{n.title}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '2px 0 0.5rem 0' }}>
                        Sent by: {n.senderRole === 'super-admin' ? 'Platform Admin' : 'Company Manager'} • {new Date(n.createdAt).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: '1.4' }}>
                        {n.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* DEPOT & VEHICLE MAP */}
          {activeNav === 'depot-map' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>📍 Depot & Vehicle Location Map</h2>
                <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '4px 0 0 0' }}>Real-time location map for vehicle check-ins, depot hubs, and return locations.</p>
              </div>

              <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <GoogleMapComponent 
                  height="560px" 
                  zoom={13} 
                  pickupLocation="Central Fleet Depot"
                  center={{ lat: 12.1211, lng: 78.1582 }}
                />
              </div>
            </div>
          )}

          {/* 5. PROFILE & CHANGE PASSWORD */}
          {activeNav === 'profile' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>👤 My Profile & Account Settings</h2>
                <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Manage credentials, profile photo, and password security.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Info Card */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)', color: '#1e3a8a' }}>
                    👤 Employee Profile Details
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #2563eb' }}>
                      <img src={getValidImageUrl(user?.avatar, 'driver')} onError={e => handleImageError(e, 'driver')} alt="Employee Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#0f172a' }}>{user?.name || 'DEEPUU'}</div>
                      <div style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 700 }}>{user?.designation || 'Fleet Supervisor'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>{user?.email || 'deepudeepu@gmail.com'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                      <span style={{ color: '#64748b' }}>Employee Name:</span>
                      <strong style={{ color: '#1e293b' }}>{user?.name || 'DEEPUU'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                      <span style={{ color: '#64748b' }}>Employee ID:</span>
                      <strong style={{ color: '#1e293b' }}>{user?._id ? `EMP-${String(user._id).slice(-4).toUpperCase()}` : 'EMP-9042'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                      <span style={{ color: '#64748b' }}>Work Email:</span>
                      <strong style={{ color: '#1e293b' }}>{user?.email || 'deepudeepu@gmail.com'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                      <span style={{ color: '#64748b' }}>Mobile Number:</span>
                      <strong style={{ color: '#1e293b' }}>{user?.phone || '+91 96385 27410'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                      <span style={{ color: '#64748b' }}>Role & Designation:</span>
                      <strong style={{ color: '#2563eb' }}>{user?.designation || 'Fleet Supervisor'}</strong>
                    </div>
                  </div>

                  <button onClick={logout} className="btn btn-danger" style={{ width: '100%', marginTop: '1.25rem', padding: '0.6rem', fontWeight: 800 }}>
                    🚪 Sign Out / Logout
                  </button>
                </div>

                {/* Password form */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)', color: '#1e3a8a' }}>
                    🔐 Change Security Password
                  </h4>
                  <form onSubmit={handleChangePasswordSubmit}>
                    <div className="form-group">
                      <label className="form-label">Current Password</label>
                      <input 
                        type="password" 
                        className="form-control" 
                        value={currPassword} 
                        onChange={(e) => setCurrPassword(e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">New Password</label>
                      <input 
                        type="password" 
                        className="form-control" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Confirm New Password</label>
                      <input 
                        type="password" 
                        className="form-control" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        required 
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', background: 'var(--accent-rose)' }}>
                      Update Password
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Popups & Checklist verification Modals */}
      {activeBooking && (
        <div className="modal-overlay">
          <div className="modal-content">
            
            {/* Modal header */}
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}>
                {actionType === 'verify' && 'Review Renter Documents'}
                {actionType === 'checkout' && 'Key Hand-over Inspection'}
                {actionType === 'checkin' && 'Vehicle Return Inspection'}
              </h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>

            {/* Verification Checklist */}
            {actionType === 'verify' && (
              <div>
                <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                  Review renter profile details for customer <strong>{activeBooking.customerId.name}</strong>.
                </p>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                  <div>📞 <strong>Phone Number:</strong> {activeBooking.customerId.phone}</div>
                  <div style={{ marginTop: '0.25rem' }}>✉️ <strong>Email Address:</strong> {activeBooking.customerId.email}</div>
                  <div style={{ marginTop: '0.25rem' }}>🚗 <strong>Car Selected:</strong> {activeBooking.vehicleId ? `${activeBooking.vehicleId.make} ${activeBooking.vehicleId.model}` : 'Deleted Car'}</div>
                </div>

                <div className="form-group">
                  <label className="form-label">KYC Check Remarks</label>
                  <textarea 
                    rows="2" 
                    className="form-control" 
                    placeholder="e.g. License verified, matches customer name." 
                    value={remarks} 
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button onClick={() => handleDocumentVerify(activeBooking._id, 'verified')} className="btn btn-success" style={{ flex: 1 }}>
                    ✓ Approve documents
                  </button>
                  <button onClick={() => handleDocumentVerify(activeBooking._id, 'rejected')} className="btn btn-danger" style={{ flex: 1 }}>
                    ✗ Reject documents
                  </button>
                </div>
              </div>
            )}

            {/* Checkout action */}
            {actionType === 'checkout' && (
              <form onSubmit={handleCheckoutSubmit}>
                <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                  Complete the vehicle checklist with customer <strong>{activeBooking.customerId.name}</strong> before hand-over.
                </p>
                
                <div className="form-group">
                  <label className="form-label">Check-out Notes (Physical Condition / Fuel / Odometer)</label>
                  <textarea 
                    rows="4" 
                    className="form-control" 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    required 
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    🔑 Hand Over Keys & Activate Rent
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                </div>
              </form>
            )}

            {/* Checkin action */}
            {actionType === 'checkin' && (
              <form onSubmit={handleCheckinSubmit}>
                <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                  Confirm vehicle condition and mileage details upon receiving from <strong>{activeBooking.customerId.name}</strong>.
                </p>
                
                <div className="form-group">
                  <label className="form-label">Check-in Return Notes (Damage / Cleanliness / Fuel)</label>
                  <textarea 
                    rows="4" 
                    className="form-control" 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    required 
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-success" style={{ flex: 1 }}>
                    📥 Accept Return & Release Car
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
      <FaceScanModal
        isOpen={isFaceModalOpen}
        actionType={punchActionType}
        personName={user?.name || 'Staff Member'}
        onSuccess={handleFaceScanSuccess}
        onClose={() => setIsFaceModalOpen(false)}
      />
    </div>
  );
}
