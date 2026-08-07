import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LiveTrackingComponent from '../components/LiveTrackingComponent';

export default function CarOwnerDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notice, setNotice] = useState('');

  // Sample Car Owner Data
  const [vehicles, setVehicles] = useState(() => {
    try {
      const saved = localStorage.getItem('company_vehicles_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 'ov_1',
        name: 'Hyundai Creta SX',
        plate: 'TN29AZ7788',
        category: 'SUV',
        pricePerDay: 2200,
        status: 'Active',
        rcVerified: true,
        insuranceValid: true,
        image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
        imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
        make: 'Hyundai',
        model: 'Creta SX',
        companyName: user?.name || 'Sathya'
      },
      {
        id: 'ov_2',
        name: 'Maruti Suzuki Swift ZXi',
        plate: 'TN29BC4455',
        category: 'Hatchback',
        pricePerDay: 1400,
        status: 'Rented',
        rcVerified: true,
        insuranceValid: true,
        image: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=600&q=80',
        imageUrl: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=600&q=80',
        make: 'Maruti Suzuki',
        model: 'Swift ZXi',
        companyName: user?.name || 'Sathya'
      }
    ];
  });

  const [newVehicle, setNewVehicle] = useState({
    name: '', plate: '', category: 'SUV', pricePerDay: 2000, rcNumber: '', image: ''
  });
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);

  // Profile Data State
  const [profileData, setProfileData] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('car_owner_profile') || '{}');
      return {
        name: saved.name || user?.name || 'Sathya',
        phone: saved.phone || user?.phone || '+91 96301 47852',
        email: saved.email || user?.email || 'sathya@gmail.com',
        aadhaar: saved.aadhaar || 'XXXX-XXXX-9988',
        dlNumber: saved.dlNumber || 'TN-29-2024-0099881',
        bankName: saved.bankName || 'HDFC Bank India',
        accountNo: saved.accountNo || '50100234567899',
        ifscCode: saved.ifscCode || 'HDFC0001234',
        accountHolder: saved.accountHolder || saved.name || user?.name || 'Sathya',
        upiId: saved.upiId || 'sathya@okaxis'
      };
    } catch {
      return {
        name: user?.name || 'Sathya',
        phone: user?.phone || '+91 96301 47852',
        email: user?.email || 'sathya@gmail.com',
        aadhaar: 'XXXX-XXXX-9988',
        dlNumber: 'TN-29-2024-0099881',
        bankName: 'HDFC Bank India',
        accountNo: '50100234567899',
        ifscCode: 'HDFC0001234',
        accountHolder: user?.name || 'Sathya',
        upiId: 'sathya@okaxis'
      };
    }
  });

  const [editProfileForm, setEditProfileForm] = useState(profileData);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  // Payout Requests History State
  const [payoutRequests, setPayoutRequests] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('payout_requests') || '[]');
      if (saved.length > 0) return saved;
      return [
        {
          id: 'PAY-1001',
          ownerEmail: (user?.email || 'sathya@gmail.com').toLowerCase(),
          ownerName: profileData.name,
          amount: 3740,
          bankDetails: 'HDFC Bank India (...8899)',
          upiId: profileData.upiId,
          requestedAt: '04 Aug 2026, 02:30 PM',
          status: 'Dispatched & Paid',
          utrNo: 'UTR99884411'
        }
      ];
    } catch {
      return [];
    }
  });

  const [bookings] = useState([
    {
      id: 'BK-CO-9901',
      customerName: 'Karthik Raja',
      customerPhone: '+91 98765 44321',
      vehicleName: 'Hyundai Creta SX',
      pickupDate: '2026-07-28',
      returnDate: '2026-07-30',
      days: 2,
      grossAmount: 4400,
      commissionPct: 15,
      platformFee: 660,
      netOwnerPayout: 3740,
      status: 'Approved'
    },
    {
      id: 'BK-CO-9902',
      customerName: 'Priya Sharma',
      customerPhone: '+91 97890 12345',
      vehicleName: 'Maruti Suzuki Swift ZXi',
      pickupDate: '2026-07-29',
      returnDate: '2026-07-29',
      days: 1,
      grossAmount: 1400,
      commissionPct: 15,
      platformFee: 210,
      netOwnerPayout: 1190,
      status: 'In Progress'
    }
  ]);

  const showToast = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

  const handleAddVehicleSubmit = (e) => {
    e.preventDefault();
    if (!newVehicle.name || !newVehicle.plate) return;

    const parts = newVehicle.name.split(' ');
    const make = parts[0] || 'Unknown';
    const model = parts.slice(1).join(' ') || 'Model';

    const v = {
      id: 'ov_' + Date.now(),
      _id: 'ov_' + Date.now(),
      name: newVehicle.name,
      make: make,
      model: model,
      year: new Date().getFullYear(),
      transmission: 'Automatic',
      fuelType: 'Petrol',
      seats: 5,
      location: 'Head Office',
      companyName: user?.name || profileData?.name || 'Owner',
      plate: newVehicle.plate,
      category: newVehicle.category,
      pricePerDay: Number(newVehicle.pricePerDay),
      status: 'Active', // Auto-active for demonstration
      rcVerified: false,
      insuranceValid: true,
      image: newVehicle.image || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80',
      imageUrl: newVehicle.image || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80'
    };

    const updatedVehicles = [v, ...vehicles];
    setVehicles(updatedVehicles);
    localStorage.setItem('company_vehicles_list', JSON.stringify(updatedVehicles));
    
    setShowAddVehicleModal(false);
    setNewVehicle({ name: '', plate: '', category: 'SUV', pricePerDay: 2000, rcNumber: '', image: '' });
    showToast('Car successfully added and published!');
  };

  const handleRequestPayout = () => {
    if (totalNet <= 0) {
      showToast('⚠️ No available earnings to request payout.');
      return;
    }
    const newReq = {
      id: 'PAY-' + Math.floor(1000 + Math.random() * 9000),
      ownerEmail: (profileData.email || user?.email || 'sathya@gmail.com').toLowerCase(),
      ownerName: profileData.name || 'Sathya',
      amount: totalNet,
      bankDetails: `${profileData.bankName} (A/C: ...${(profileData.accountNo || '').slice(-4)})`,
      upiId: profileData.upiId || 'N/A',
      requestedAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'Pending Super Admin Approval',
      utrNo: 'Processing'
    };

    const existingReqs = (() => { try { return JSON.parse(localStorage.getItem('payout_requests') || '[]'); } catch { return []; } })();
    const updated = [newReq, ...existingReqs.filter(r => r.id !== newReq.id)];
    setPayoutRequests(updated);
    localStorage.setItem('payout_requests', JSON.stringify(updated));

    showToast(`✅ Payout request of ₹${totalNet.toLocaleString('en-IN')} submitted! Status: Pending Super Admin Approval.`);
  };

  const handleSaveProfileSubmit = (e) => {
    e.preventDefault();
    setProfileData(editProfileForm);
    localStorage.setItem('car_owner_profile', JSON.stringify(editProfileForm));
    
    // Also sync to active user in localStorage if matching
    try {
      const activeUser = JSON.parse(localStorage.getItem('car_owner_user') || '{}');
      if (activeUser) {
        localStorage.setItem('car_owner_user', JSON.stringify({
          ...activeUser,
          name: editProfileForm.name,
          email: editProfileForm.email,
          phone: editProfileForm.phone
        }));
      }
    } catch {}

    setShowEditProfileModal(false);
    showToast('✨ Profile and Settlement Bank Details updated successfully!');
  };

  const totalGross = bookings.reduce((sum, b) => sum + b.grossAmount, 0);
  const totalNet = bookings.reduce((sum, b) => sum + b.netOwnerPayout, 0);
  const totalComm = bookings.reduce((sum, b) => sum + b.platformFee, 0);

  if (user?.status === 'Rejected' || user?.status === 'rejected') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc', padding: '2rem' }}>
        <div style={{ background: '#ffffff', borderRadius: '24px', padding: '3rem 2.5rem', maxWidth: '580px', width: '100%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.06)', border: '1px solid #fecdd3' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#ffe4e6', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.8rem', margin: '0 auto 1.5rem auto' }}>❌</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Car Owner Application Rejected</h2>
          <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            Your registration application was reviewed by Super Admin and rejected due to incomplete or unverified document proofs (RC Book / Aadhaar / Insurance).
          </p>
          <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c', padding: '0.85rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, marginBottom: '1.5rem' }}>
            🔴 Reason: Document Verification Failed. Please re-submit valid document proofs.
          </div>
          <button onClick={() => { logout(); window.location.href = '/'; }} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}>
            🔄 Re-submit Application
          </button>
        </div>
      </div>
    );
  }

  if (user?.status === 'Pending Approval' || user?.status === 'pending_approval') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc', padding: '2rem' }}>
        <div style={{ background: '#ffffff', borderRadius: '24px', padding: '3rem 2.5rem', maxWidth: '580px', width: '100%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.8rem', margin: '0 auto 1.5rem auto' }}>⏳</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Awaiting Super Admin Approval</h2>
          <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            Thank you for registering as a <strong>Car Owner</strong>! Super Admin is currently reviewing your uploaded RC Book, Insurance Policy, and Aadhaar documents. Your dashboard will be activated as soon as approval is granted.
          </p>
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#b45309', padding: '0.85rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, marginBottom: '1.5rem' }}>
            🟡 Registration Status: Pending Verification
          </div>
          <button onClick={logout} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '260px', background: '#0f172a', color: '#ffffff', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        
        {/* Brand */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #1e293b' }}>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8', letterSpacing: '-0.5px' }}>
            Car Owner Hub
          </h1>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
            Partner Vehicle Management
          </p>
        </div>

        {/* User Card */}
        <div style={{ padding: '1rem 1.5rem', background: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem' }}>
            {profileData.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {profileData.name}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Partner Tier (15% Comm)
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ flex: 1, padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'vehicles', label: 'My Vehicles', icon: '🚘' },
            { id: 'bookings', label: 'Bookings & Split', icon: '📑' },
            { id: 'earnings', label: 'Earnings & Payouts', icon: '💰' },
            { id: 'tracking', label: 'Live GPS Tracking', icon: '🛰️' },
            { id: 'profile', label: 'KYC & Profile', icon: '🪪' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1.5rem',
                border: 'none',
                background: activeTab === tab.id ? '#2563eb' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#94a3b8',
                fontWeight: activeTab === tab.id ? 800 : 600,
                fontSize: '0.88rem',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
                borderRadius: activeTab === tab.id ? '0 12px 12px 0' : '0',
                marginRight: activeTab === tab.id ? '0.75rem' : '0'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer Logout */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #1e293b' }}>
          <button
            onClick={logout}
            style={{
              width: '100%',
              padding: '0.65rem',
              borderRadius: '8px',
              border: '1px solid #334155',
              background: 'transparent',
              color: '#f8fafc',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            🚪 Logout Session
          </button>
        </div>

      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        
        {/* TOAST NOTICE */}
        {notice && (
          <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 99999, background: '#0f172a', color: '#38bdf8', padding: '0.85rem 1.5rem', borderRadius: '12px', border: '1px solid #38bdf8', fontWeight: 800, fontSize: '0.88rem', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
            {notice}
          </div>
        )}

        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>
                Welcome back, {profileData.name}! 👋
              </h2>
              <p style={{ margin: '0.3rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                Here is your personal vehicle fleet performance and 15% revenue split breakdown.
              </p>
            </div>

            {/* KPI STAT CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              
              <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Registered Cars</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginTop: '0.3rem' }}>{vehicles.length} Vehicles</div>
                <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginTop: '0.4rem' }}>✓ 100% KYC Verified</div>
              </div>

              <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Bookings Value</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2563eb', marginTop: '0.3rem' }}>₹ {totalGross.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>Across {bookings.length} completed rentals</div>
              </div>

              <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Platform Fee (15%)</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ef4444', marginTop: '0.3rem' }}>- ₹ {totalComm.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>Super Admin commission split</div>
              </div>

              <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Net Owner Earnings</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669', marginTop: '0.3rem' }}>₹ {totalNet.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 800, marginTop: '0.4rem' }}>Available for Payout</div>
              </div>

            </div>

            {/* QUICK ACTIONS & ACTIVE FLEET LIST */}
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>My Listed Personal Fleet</h3>
                <button
                  onClick={() => setShowAddVehicleModal(true)}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.55rem 1rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  + Add New Vehicle
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.72rem', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Vehicle</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Reg Plate</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Daily Rate</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>KYC & Insurance</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map(v => (
                      <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#0f172a' }}>{v.name}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>{v.plate}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 900, color: '#2563eb' }}>₹ {v.pricePerDay}/day</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#059669', fontWeight: 700 }}>✓ RC Book & Insurance Verified</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '12px', background: v.status === 'Active' ? '#dcfce7' : '#fef3c7', color: v.status === 'Active' ? '#15803d' : '#b45309' }}>
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY VEHICLES */}
        {activeTab === 'vehicles' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>My Registered Personal Vehicles</h2>
              <button
                onClick={() => setShowAddVehicleModal(true)}
                style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                + Register Personal Car
              </button>
            </div>

            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.72rem', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Vehicle Name & Model</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Plate Number</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Price / Day</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Document Status</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Listing Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map(v => (
                    <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontWeight: 800, color: '#0f172a' }}>{v.name}</td>
                      <td style={{ padding: '1rem', color: '#475569' }}>{v.plate}</td>
                      <td style={{ padding: '1rem', fontWeight: 900, color: '#2563eb' }}>₹ {v.pricePerDay}</td>
                      <td style={{ padding: '1rem', color: '#059669', fontWeight: 700 }}>✓ RC Book & Insurance Verified</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '12px', background: v.status === 'Active' ? '#dcfce7' : '#fef3c7', color: v.status === 'Active' ? '#15803d' : '#b45309' }}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: BOOKINGS & SPLIT ENGINE */}
        {activeTab === 'bookings' && (
          <div>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>Customer Bookings & 15% Split Ledger</h2>
            
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.72rem', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Booking Ref</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Customer</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Vehicle</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Gross Total</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Platform Comm (15%)</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Net Owner Payout</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontWeight: 800, color: '#0f172a' }}>#{b.id}</td>
                      <td style={{ padding: '1rem', color: '#334155' }}>{b.customerName} ({b.customerPhone})</td>
                      <td style={{ padding: '1rem', fontWeight: 700, color: '#1e293b' }}>{b.vehicleName}</td>
                      <td style={{ padding: '1rem', fontWeight: 800, color: '#0f172a' }}>₹ {b.grossAmount}</td>
                      <td style={{ padding: '1rem', fontWeight: 800, color: '#ef4444' }}>- ₹ {b.platformFee}</td>
                      <td style={{ padding: '1rem', fontWeight: 900, color: '#059669', fontSize: '0.95rem' }}>₹ {b.netOwnerPayout}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '12px', background: '#dcfce7', color: '#15803d' }}>
                          ✓ {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: EARNINGS & PAYOUTS */}
        {activeTab === 'earnings' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>Earnings & Bank Payout Console</h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>Manage your rental payouts, bank settlement account & instant payout requests</p>
              </div>
              <button 
                onClick={() => {
                  setEditProfileForm(profileData);
                  setShowEditProfileModal(true);
                }} 
                style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.2)' }}
              >
                ✏️ Edit Bank Details
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Bank Account Details</h3>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>✓ Verified Account</span>
                </div>
                <div style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', color: '#475569' }}>
                  <div>Bank Name: <strong style={{ color: '#0f172a' }}>{profileData.bankName}</strong></div>
                  <div>Account No: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>XXXX XXXX {(profileData.accountNo || '').slice(-4)}</strong></div>
                  <div>IFSC Code: <strong style={{ color: '#0f172a' }}>{profileData.ifscCode}</strong></div>
                  <div>Account Holder: <strong style={{ color: '#0f172a' }}>{profileData.accountHolder}</strong></div>
                  <div>UPI ID: <strong style={{ color: '#2563eb' }}>{profileData.upiId}</strong></div>
                </div>
              </div>

              <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Available for Payout</h3>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#059669' }}>₹ {totalNet.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>Automated weekly payouts every Monday</div>
                </div>
                <button 
                  onClick={handleRequestPayout} 
                  style={{ background: '#059669', color: '#fff', border: 'none', padding: '0.85rem', borderRadius: '12px', fontWeight: 900, fontSize: '0.92rem', cursor: 'pointer', marginTop: '1.25rem', boxShadow: '0 4px 12px rgba(5,150,105,0.2)' }}
                >
                  Request Instant Payout
                </button>
              </div>
            </div>

            {/* PAYOUT REQUESTS HISTORY LEDGER */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>Payout Requests & Settlement History</h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Total Requests: {payoutRequests.length}</span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.72rem', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Payout Ref ID</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Requested Date</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Amount (₹)</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Settlement Account</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>UTR Ref</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payoutRequests.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No payout requests found. Click "Request Instant Payout" above to withdraw earnings.</td></tr>
                    ) : (
                      payoutRequests.map(req => (
                        <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '1rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>{req.id}</td>
                          <td style={{ padding: '1rem', color: '#475569' }}>{req.requestedAt}</td>
                          <td style={{ padding: '1rem', fontWeight: 900, color: '#059669', fontSize: '0.95rem' }}>₹ {Number(req.amount).toLocaleString('en-IN')}</td>
                          <td style={{ padding: '1rem', color: '#334155', fontWeight: 700 }}>{req.bankDetails}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{
                              fontSize: '0.72rem', fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: '12px',
                              background: req.status.includes('Paid') || req.status.includes('Completed') ? '#dcfce7' : req.status.includes('Rejected') ? '#ffe4e6' : '#fef3c7',
                              color: req.status.includes('Paid') || req.status.includes('Completed') ? '#15803d' : req.status.includes('Rejected') ? '#be123c' : '#b45309',
                              border: req.status.includes('Paid') || req.status.includes('Completed') ? '1px solid #86efac' : req.status.includes('Rejected') ? '1px solid #fca5a5' : '1px solid #fde68a'
                            }}>
                              {req.status.includes('Paid') || req.status.includes('Completed') ? '✓ Dispatched & Paid' : req.status.includes('Rejected') ? '🔴 Rejected' : '⏳ Pending Super Admin Approval'}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', fontFamily: 'monospace', color: '#64748b', fontSize: '0.8rem' }}>{req.utrNo || 'Processing'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: LIVE GPS TRACKING */}
        {activeTab === 'tracking' && (
          <div>
            <LiveTrackingComponent />
          </div>
        )}

        {/* TAB 6: PROFILE */}
        {activeTab === 'profile' && (
          <div style={{ maxWidth: '800px' }}>
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>🚗 Car Owner KYC Profile</h2>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>Verified Vehicle Partner Credentials & Bank Payout Account</p>
                </div>
                <button 
                  onClick={() => {
                    setEditProfileForm(profileData);
                    setShowEditProfileModal(true);
                  }}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}
                >
                  ✏️ Edit Profile Details
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem' }}>
                
                {/* SECTION 1: PERSONAL DETAILS */}
                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    👤 Personal Information
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem', color: '#334155' }}>
                    <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Full Name</span><strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{profileData.name}</strong></div>
                    <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Phone Number</span><strong style={{ color: '#0f172a' }}>{profileData.phone}</strong></div>
                    <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Email Address</span><strong style={{ color: '#2563eb' }}>{profileData.email}</strong></div>
                  </div>
                </div>

                {/* SECTION 2: VERIFIED CREDENTIALS */}
                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    🪪 Verified KYC Documents
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem', color: '#334155' }}>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>KYC Status</span>
                      <span style={{ color: '#15803d', background: '#dcfce7', border: '1px solid #86efac', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>✓ Verified by Super Admin</span>
                    </div>
                    <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Aadhaar Card</span><strong style={{ color: '#0f172a' }}>{profileData.aadhaar}</strong></div>
                    <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Driving Licence No</span><strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{profileData.dlNumber}</strong></div>
                  </div>
                </div>

                {/* SECTION 3: BANK & SETTLEMENT ACCOUNT */}
                <div style={{ gridColumn: 'span 2', background: '#eff6ff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #bfdbfe' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    🏦 Settlement Bank Account & UPI
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.88rem' }}>
                    <div><span style={{ color: '#1e40af', fontSize: '0.78rem', display: 'block', fontWeight: 700 }}>Bank Name</span><strong style={{ color: '#1e3a8a' }}>{profileData.bankName}</strong></div>
                    <div><span style={{ color: '#1e40af', fontSize: '0.78rem', display: 'block', fontWeight: 700 }}>Account Number</span><strong style={{ color: '#1e3a8a', fontFamily: 'monospace' }}>{profileData.accountNo}</strong></div>
                    <div><span style={{ color: '#1e40af', fontSize: '0.78rem', display: 'block', fontWeight: 700 }}>IFSC Code</span><strong style={{ color: '#1e3a8a', fontFamily: 'monospace' }}>{profileData.ifscCode}</strong></div>
                    <div><span style={{ color: '#1e40af', fontSize: '0.78rem', display: 'block', fontWeight: 700 }}>Account Holder Name</span><strong style={{ color: '#1e3a8a' }}>{profileData.accountHolder}</strong></div>
                    <div><span style={{ color: '#1e40af', fontSize: '0.78rem', display: 'block', fontWeight: 700 }}>UPI ID</span><strong style={{ color: '#2563eb' }}>{profileData.upiId}</strong></div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </main>

      {/* ADD VEHICLE MODAL */}
      {showAddVehicleModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '480px', borderRadius: '16px', padding: '2rem', border: '1px solid #cbd5e1' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>List Personal Car for Rent</h3>
            <form onSubmit={handleAddVehicleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, display: 'block', marginBottom: '0.3rem' }}>Vehicle Name & Model</label>
                <input type="text" placeholder="e.g. Mahindra Thar 4x4" value={newVehicle.name} onChange={e => setNewVehicle({ ...newVehicle, name: e.target.value })} required style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, display: 'block', marginBottom: '0.3rem' }}>Registration Number (Plate)</label>
                <input type="text" placeholder="e.g. TN29AB9988" value={newVehicle.plate} onChange={e => setNewVehicle({ ...newVehicle, plate: e.target.value })} required style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, display: 'block', marginBottom: '0.3rem' }}>Vehicle Category</label>
                <select value={newVehicle.category} onChange={e => setNewVehicle({ ...newVehicle, category: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}>
                  <option value="SUV">SUV</option>
                  <option value="Sedan">Sedan</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Hatchback">Hatchback</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, display: 'block', marginBottom: '0.3rem' }}>Daily Rental Rate (₹)</label>
                <input type="number" value={newVehicle.pricePerDay} onChange={e => setNewVehicle({ ...newVehicle, pricePerDay: e.target.value })} required style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, display: 'block', marginBottom: '0.3rem' }}>Car Photo URL (Optional)</label>
                <input type="text" placeholder="https://images.unsplash.com/..." value={newVehicle.image} onChange={e => setNewVehicle({ ...newVehicle, image: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" style={{ flex: 1, padding: '0.7rem', borderRadius: '8px', background: '#2563eb', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}>
                  🚀 Submit for Super Admin Verification
                </button>
                <button type="button" onClick={() => setShowAddVehicleModal(false)} style={{ padding: '0.7rem 1.25rem', borderRadius: '8px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROFILE & BANK DETAILS MODAL */}
      {showEditProfileModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '560px', borderRadius: '20px', padding: '2rem', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>✏️ Edit Profile & Settlement Details</h3>
              <button onClick={() => setShowEditProfileModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '0.35rem 0.75rem', fontWeight: 800, cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={handleSaveProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Full Name *</label>
                  <input type="text" required value={editProfileForm.name} onChange={e => setEditProfileForm({ ...editProfileForm, name: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Phone Number *</label>
                  <input type="text" required value={editProfileForm.phone} onChange={e => setEditProfileForm({ ...editProfileForm, phone: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Email Address *</label>
                  <input type="email" required value={editProfileForm.email} onChange={e => setEditProfileForm({ ...editProfileForm, email: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>DL Number *</label>
                  <input type="text" required value={editProfileForm.dlNumber} onChange={e => setEditProfileForm({ ...editProfileForm, dlNumber: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }} />
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '1rem', marginTop: '0.25rem' }}>
                <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.95rem', fontWeight: 800, color: '#1e40af' }}>🏦 Bank Account & Settlement Info</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Bank Name *</label>
                    <input type="text" required value={editProfileForm.bankName} onChange={e => setEditProfileForm({ ...editProfileForm, bankName: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Account Number *</label>
                    <input type="text" required value={editProfileForm.accountNo} onChange={e => setEditProfileForm({ ...editProfileForm, accountNo: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>IFSC Code *</label>
                    <input type="text" required value={editProfileForm.ifscCode} onChange={e => setEditProfileForm({ ...editProfileForm, ifscCode: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>UPI ID (Instant Settlement)</label>
                    <input type="text" value={editProfileForm.upiId} onChange={e => setEditProfileForm({ ...editProfileForm, upiId: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="submit" style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: '#2563eb', color: '#fff', border: 'none', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}>
                  💾 Save Profile & Bank Changes
                </button>
                <button type="button" onClick={() => setShowEditProfileModal(false)} style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
