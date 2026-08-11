import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LiveTrackingComponent from '../components/LiveTrackingComponent';

export default function CarOwnerDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [notice, setNotice] = useState('');
  const [acceptedTermsCheckbox, setAcceptedTermsCheckbox] = useState(false);
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  // 1. RESOLVE OWNER RECORD & STATUS FROM LOCALSTORAGE
  const [ownerRecord, setOwnerRecord] = useState(() => {
    try {
      const userEmail = (user?.email || '').toLowerCase().trim();
      const userId = String(user?._id || user?.id || '');

      const pendingList = JSON.parse(localStorage.getItem('pending_car_owners') || '[]');
      const approvedList = JSON.parse(localStorage.getItem('approved_car_owners') || '[]');
      const all = [...pendingList, ...approvedList];

      const match = all.find(item => {
        const itemEmail = (item.email || '').toLowerCase().trim();
        const itemId = String(item.id || item._id || '');
        return (userEmail && itemEmail === userEmail) || (userId && itemId === userId);
      });

      if (match) return match;
    } catch {}

    return {
      id: user?._id || 'co_default',
      name: user?.name || 'Sathya',
      email: user?.email || 'sathya@gmail.com',
      phone: user?.phone || '+91 96301 47852',
      status: user?.status || 'ACTIVE',
      termsAccepted: user?.termsAccepted || true,
      carName: 'Hyundai Creta SX',
      plate: 'TN29AZ7788',
      createdAt: '2026-08-01T10:00:00.000Z'
    };
  });

  const currentStatus = (ownerRecord.status || user?.status || 'PENDING_APPROVAL').toUpperCase();
  const isTermsAccepted = ownerRecord.termsAccepted === true || user?.termsAccepted === true;

  // 2. VEHICLE LIST
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
        name: ownerRecord.carName || 'Hyundai Creta SX',
        plate: ownerRecord.plate || 'TN29AZ7788',
        category: 'SUV',
        status: 'Active',
        rcVerified: true,
        insuranceValid: true,
        image: ownerRecord.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
        make: 'Hyundai',
        model: 'Creta SX'
      }
    ];
  });

  const [newVehicle, setNewVehicle] = useState({ name: '', plate: '', category: 'SUV', image: '' });
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);

  // 3. PROFILE DATA
  const [profileData, setProfileData] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('car_owner_profile') || '{}');
      return {
        name: saved.name || ownerRecord.name || user?.name || 'Sathya',
        phone: saved.phone || ownerRecord.phone || user?.phone || '+91 96301 47852',
        email: saved.email || ownerRecord.email || user?.email || 'sathya@gmail.com',
        aadhaar: saved.aadhaar || ownerRecord.aadhaar || 'XXXX-XXXX-9988',
        dlNumber: saved.dlNumber || 'TN-29-2024-0099881',
        bankName: saved.bankName || 'HDFC Bank India',
        accountNo: saved.accountNo || '50100234567899',
        ifscCode: saved.ifscCode || 'HDFC0001234',
        accountHolder: saved.accountHolder || ownerRecord.name || user?.name || 'Sathya',
        upiId: saved.upiId || 'sathya@okaxis'
      };
    } catch {
      return {
        name: ownerRecord.name || user?.name || 'Sathya',
        phone: ownerRecord.phone || user?.phone || '+91 96301 47852',
        email: ownerRecord.email || user?.email || 'sathya@gmail.com',
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

  // Document state & Edit modal
  const [docsState, setDocsState] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('owner_uploaded_docs') || 'null');
      if (saved) return saved;
    } catch {}
    return {
      rc: { name: 'RC_Book_Verified.pdf', status: '✓ Super Admin Verified', tagBg: '#dcfce7', tagColor: '#15803d' },
      insurance: { name: 'Insurance_Policy_2026.pdf', status: '✓ Active & Valid', tagBg: '#dcfce7', tagColor: '#15803d' },
      puc: { name: 'PUC_Cert_2026.pdf', status: '✓ Compliant', tagBg: '#dcfce7', tagColor: '#15803d' },
      aadhaar: { name: profileData.aadhaar || 'XXXX-XXXX-9988', status: '✓ Identity Verified', tagBg: '#dcfce7', tagColor: '#15803d' }
    };
  });
  const [editingDocKey, setEditingDocKey] = useState(null);
  const [newDocInput, setNewDocInput] = useState('');

  // Resubmit form state
  const [resubmitData, setResubmitData] = useState({
    carName: ownerRecord.carName || '',
    plate: ownerRecord.plate || '',
    insuranceFileName: 'Insurance_Policy_v2.pdf',
    rcFileName: 'RC_Book_Verified.pdf',
    aadhaarFileName: 'Aadhaar_Card_Front_Back.pdf'
  });

  // Calculate Fixed ₹500/day Earnings (Active vehicles only)
  const activeDaysCount = (() => {
    if (currentStatus !== 'ACTIVE' && currentStatus !== 'APPROVED') return 0;
    try {
      const created = new Date(ownerRecord.createdAt || '2026-07-11').getTime();
      const now = Date.now();
      const days = Math.floor((now - created) / (1000 * 60 * 60 * 24)) + 1;
      return Math.max(30, days);
    } catch {
      return 30;
    }
  })();

  const fixedDailyRate = 500; // Fixed ₹500/day per active vehicle
  const totalAccumulatedEarnings = activeDaysCount * fixedDailyRate;
  const todaysEarnings = (currentStatus === 'ACTIVE' || currentStatus === 'APPROVED') ? 500 : 0;

  // Payout requests history from localStorage
  const [payoutRequests, setPayoutRequests] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('payout_requests') || '[]');
      const userEmail = (profileData.email || user?.email || 'sathya@gmail.com').toLowerCase().trim();
      const userPayouts = saved.filter(p => (p.ownerEmail || '').toLowerCase().trim() === userEmail || p.ownerName === profileData.name);
      
      if (userPayouts.length > 0) return userPayouts;

      const sampleReqs = [
        {
          id: 'PAY-4930',
          ownerEmail: userEmail,
          ownerName: profileData.name || 'Sathya',
          amount: 4930,
          bankDetails: `HDFC Bank India (A/C: ...${(profileData.accountNo || '8899').slice(-4)})`,
          upiId: profileData.upiId || 'sathya@okaxis',
          requestedAt: '05 Aug 2026, 11:15 AM',
          status: 'Pending Super Admin Approval',
          utrNo: 'Processing'
        }
      ];
      localStorage.setItem('payout_requests', JSON.stringify([...saved, ...sampleReqs]));
      return sampleReqs;
    } catch {
      return [];
    }
  });

  // Notification State
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [ownerNotifs, setOwnerNotifs] = useState(() => {
    try {
      const userEmail = (profileData.email || user?.email || 'sathya@gmail.com').toLowerCase().trim();
      const saved = JSON.parse(localStorage.getItem('notifications_car_owner') || '[]');
      const userNotifs = saved.filter(n => !n.ownerEmail || n.ownerEmail.toLowerCase().trim() === userEmail);
      if (userNotifs.length > 0) return userNotifs;
    } catch {}

    const defaultNotifs = [
      {
        id: 'notif_101',
        ownerEmail: 'sathya@gmail.com',
        title: '🎉 Welcome to RentOS Partner Network!',
        message: 'Your vehicle partner account is verified & active. Fixed ₹500/day daily earnings enabled.',
        timestamp: '10 Aug 2026, 09:00 AM',
        read: false
      },
      {
        id: 'notif_102',
        ownerEmail: 'sathya@gmail.com',
        title: '💳 Payout Request Settled via RazorpayX',
        message: '₹4,930 payout for PAY-4930 has been successfully credited to HDFC Bank ****8899. UTR: TXN98765432.',
        timestamp: '10 Aug 2026, 04:30 PM',
        read: false
      },
      {
        id: 'notif_103',
        ownerEmail: 'sathya@gmail.com',
        title: '🪪 Documents Verified & Compliant',
        message: 'Super Admin verified RC Book, Insurance Policy, PUC, and Aadhaar ID.',
        timestamp: '10 Aug 2026, 04:45 PM',
        read: false
      }
    ];

    try {
      localStorage.setItem('notifications_car_owner', JSON.stringify(defaultNotifs));
    } catch {}
    return defaultNotifs;
  });

  // Master Unified Chat Store Engine
  const getMergedChatMessages = () => {
    try {
      const store1 = JSON.parse(localStorage.getItem('rentos_unified_chat_store') || '[]');
      const store2 = JSON.parse(localStorage.getItem('rentos_live_chat_store') || '[]');
      const store3 = JSON.parse(localStorage.getItem('owner_support_messages') || '[]');

      const combined = [...store1, ...store2, ...store3];
      const uniqueMap = new Map();

      combined.forEach(m => {
        if (!m) return;
        const key = m.id || `${m.sender}_${m.text || m.message}_${m.time}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, {
            id: key,
            sender: m.sender || (m.senderRole === 'super-admin' ? 'admin' : 'owner'),
            senderRole: m.senderRole || (m.sender === 'admin' ? 'super-admin' : 'car-owner'),
            senderName: m.senderName || (m.sender === 'admin' ? 'Super Admin' : 'Sathya'),
            text: m.text || m.message || '',
            message: m.text || m.message || '',
            time: m.time || m.createdAt || '10:00 AM',
            ownerEmail: (m.ownerEmail || 'sathya@gmail.com').toLowerCase().trim(),
            timestamp: m.timestamp || (m.id && String(m.id).startsWith('msg_') ? parseInt(String(m.id).replace('msg_', '')) : Date.now())
          });
        }
      });

      const masterList = Array.from(uniqueMap.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      localStorage.setItem('rentos_unified_chat_store', JSON.stringify(masterList));
      localStorage.setItem('rentos_live_chat_store', JSON.stringify(masterList));
      localStorage.setItem('owner_support_messages', JSON.stringify(masterList));

      return masterList;
    } catch (e) {
      return [];
    }
  };

  // Support Chat State & Master WhatsApp Auto Sync
  const [supportInput, setSupportInput] = useState('');
  const [supportMessages, setSupportMessages] = useState(() => {
    const initialStore = getMergedChatMessages();
    if (initialStore.length > 0) return initialStore;

    const initial = [
      { id: 'msg_1', sender: 'admin', senderRole: 'super-admin', senderName: 'Super Admin', text: 'Hello Sathya! Welcome to RentOS Partner Support. How can we assist you today?', message: 'Hello Sathya! Welcome to RentOS Partner Support. How can we assist you today?', time: '10:00 AM', ownerEmail: 'sathya@gmail.com', ownerName: 'Sathya', timestamp: 1000000000000 }
    ];
    try {
      localStorage.setItem('rentos_unified_chat_store', JSON.stringify(initial));
      localStorage.setItem('rentos_live_chat_store', JSON.stringify(initial));
      localStorage.setItem('owner_support_messages', JSON.stringify(initial));
    } catch {}
    return initial;
  });

  useEffect(() => {
    const syncSupportMessages = () => {
      const masterList = getMergedChatMessages();
      if (masterList.length > 0) {
        setSupportMessages(masterList);
      }

      try {
        const savedNotifs = JSON.parse(localStorage.getItem('notifications_car_owner') || '[]');
        if (savedNotifs.length > 0) {
          setOwnerNotifs(savedNotifs);
        }
      } catch {}
    };

    syncSupportMessages();
    const interval = setInterval(syncSupportMessages, 100);
    window.addEventListener('storage', syncSupportMessages);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', syncSupportMessages);
    };
  }, []);

  const handleSendSupportMessage = (e) => {
    e.preventDefault();
    if (!supportInput.trim()) return;

    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const userEmail = (profileData?.email || user?.email || 'sathya@gmail.com').toLowerCase().trim();

    const newMsg = {
      id: 'msg_' + Date.now(),
      sender: 'owner',
      senderRole: 'car-owner',
      senderName: profileData?.name || 'Sathya',
      ownerEmail: userEmail,
      text: supportInput.trim(),
      message: supportInput.trim(),
      time: timeStr,
      timestamp: Date.now()
    };

    try {
      const currentMaster = getMergedChatMessages();
      const updatedMaster = [...currentMaster, newMsg];
      
      localStorage.setItem('rentos_unified_chat_store', JSON.stringify(updatedMaster));
      localStorage.setItem('rentos_live_chat_store', JSON.stringify(updatedMaster));
      localStorage.setItem('owner_support_messages', JSON.stringify(updatedMaster));
      
      setSupportMessages(updatedMaster);
    } catch {}

    setSupportInput('');
  };

  // Calculate Balances
  const totalPaid = payoutRequests
    .filter(req => req.status === 'PAID' || req.status === 'Dispatched & Paid' || req.status.includes('Paid'))
    .reduce((sum, req) => sum + Number(req.amount || 0), 0);

  const pendingPayout = payoutRequests
    .filter(req => req.status.includes('Pending'))
    .reduce((sum, req) => sum + Number(req.amount || 0), 0);

  const availableBalance = Math.max(0, totalAccumulatedEarnings - totalPaid - pendingPayout);

  const showToast = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4500);
  };

  // ACCEPT TERMS HANDLER
  const handleAcceptTermsSubmit = () => {
    const updatedRecord = { ...ownerRecord, status: 'ACTIVE', termsAccepted: true };
    setOwnerRecord(updatedRecord);

    // Save to pending & approved in localStorage
    try {
      const targetEmail = (ownerRecord.email || user?.email || '').toLowerCase().trim();
      const targetId = String(ownerRecord.id || user?._id || '');

      const isMatch = (item) => {
        const itemEmail = (item.email || '').toLowerCase().trim();
        const itemId = String(item.id || item._id || '');
        return (targetId && itemId === targetId) || (targetEmail && itemEmail === targetEmail);
      };

      const pending = JSON.parse(localStorage.getItem('pending_car_owners') || '[]');
      const approved = JSON.parse(localStorage.getItem('approved_car_owners') || '[]');

      const updatedApproved = approved.map(item => isMatch(item) ? { ...item, status: 'ACTIVE', termsAccepted: true } : item);
      const updatedPending = pending.map(item => isMatch(item) ? { ...item, status: 'ACTIVE', termsAccepted: true } : item);

      localStorage.setItem('approved_car_owners', JSON.stringify(updatedApproved));
      localStorage.setItem('pending_car_owners', JSON.stringify(updatedPending));

      // Update user session
      const activeUser = JSON.parse(localStorage.getItem('car_owner_user') || '{}');
      localStorage.setItem('car_owner_user', JSON.stringify({ ...activeUser, status: 'ACTIVE', termsAccepted: true }));
    } catch {}

    showToast('🎉 Partner Terms Accepted! Vehicle status is now ACTIVE. ₹500/day earnings started!');
  };

  // RESUBMIT APPLICATION HANDLER
  const handleResubmitSubmit = (e) => {
    e.preventDefault();
    const updatedRecord = { ...ownerRecord, status: 'PENDING_APPROVAL', rejectionReason: '' };
    setOwnerRecord(updatedRecord);

    try {
      const targetEmail = (ownerRecord.email || user?.email || '').toLowerCase().trim();
      const pending = JSON.parse(localStorage.getItem('pending_car_owners') || '[]');
      const updatedPending = pending.map(item => (item.email || '').toLowerCase().trim() === targetEmail ? { ...item, status: 'PENDING_APPROVAL', rejectionReason: '' } : item);
      localStorage.setItem('pending_car_owners', JSON.stringify(updatedPending));
    } catch {}

    setShowResubmitModal(false);
    showToast('🚀 Application corrected and resubmitted to Super Admin for review!');
  };

  // ADD VEHICLE SUBMIT HANDLER
  const handleAddVehicleSubmit = (e) => {
    e.preventDefault();
    if (!newVehicle.name || !newVehicle.plate) return;

    const parts = newVehicle.name.split(' ');
    const make = parts[0] || 'Unknown';
    const model = parts.slice(1).join(' ') || 'Model';

    const v = {
      id: 'ov_' + Date.now(),
      name: newVehicle.name,
      make: make,
      model: model,
      plate: newVehicle.plate,
      category: newVehicle.category,
      status: 'Active',
      rcVerified: true,
      insuranceValid: true,
      image: newVehicle.image || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80'
    };

    const updatedVehicles = [v, ...vehicles];
    setVehicles(updatedVehicles);
    localStorage.setItem('company_vehicles_list', JSON.stringify(updatedVehicles));
    
    setShowAddVehicleModal(false);
    setNewVehicle({ name: '', plate: '', category: 'SUV', image: '' });
    showToast('Car registered successfully! Sent to Super Admin for verification.');
  };

  // PAYOUT REQUEST HANDLER
  const handleRequestPayout = () => {
    if (availableBalance <= 0) {
      showToast('⚠️ Available balance is ₹0. No accumulated earnings for payout.');
      return;
    }

    const refId = 'PAY-' + Math.floor(1000 + Math.random() * 9000);
    const maskedAcc = profileData.accountNo ? `****${profileData.accountNo.slice(-4)}` : '****8899';
    const bankStr = `${profileData.bankName || 'HDFC Bank India'} (A/C: ${maskedAcc})`;

    const newReq = {
      id: refId,
      ownerEmail: (profileData.email || user?.email || 'sathya@gmail.com').toLowerCase().trim(),
      ownerName: profileData.name || 'Sathya',
      amount: availableBalance,
      bankDetails: bankStr,
      upiId: profileData.upiId || 'sathya@okaxis',
      requestedAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      status: 'Pending Super Admin Approval',
      utrNo: 'Processing'
    };

    try {
      const existingAll = JSON.parse(localStorage.getItem('payout_requests') || '[]');
      const updatedAll = [newReq, ...existingAll];
      localStorage.setItem('payout_requests', JSON.stringify(updatedAll));
      setPayoutRequests([newReq, ...payoutRequests]);
    } catch {}

    showToast(`🎉 Payout request ${refId} for ₹${availableBalance.toLocaleString('en-IN')} submitted! Pending Super Admin Approval.`);
  };

  // SAVE PROFILE HANDLER
  const handleSaveProfileSubmit = (e) => {
    e.preventDefault();
    setProfileData(editProfileForm);
    localStorage.setItem('car_owner_profile', JSON.stringify(editProfileForm));
    setShowEditProfileModal(false);
    showToast('✨ Profile and Settlement Bank Details updated successfully!');
  };

  // -------------------------------------------------------------
  // SCREEN 1: PENDING APPROVAL SCREEN
  // -------------------------------------------------------------
  if (currentStatus === 'PENDING_APPROVAL' || currentStatus === 'PENDING') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ maxWidth: '640px', width: '100%', background: '#fff', padding: '2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', background: '#fef3c7', color: '#b45309', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 1.5rem auto' }}>
            ⏳
          </div>
          
          <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Status: PENDING_APPROVAL
          </span>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: '1rem 0 0.5rem 0' }}>
            Vehicle Registration Pending Super Admin Approval
          </h1>
          
          <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: '1.6', margin: '0 0 2rem 0' }}>
            Thank you for registering your vehicle! Your vehicle photos, RC Book, Insurance, and Aadhaar documents are currently under review by the Super Admin verification team.
          </p>

          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'left', marginBottom: '2rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
              Verification Progress Tracker
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#15803d', fontWeight: 700 }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>✓</span>
                Step 1: Vehicle & Owner Registration Submitted
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#b45309', fontWeight: 800 }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>⏳</span>
                Step 2: Super Admin Document Verification (In Progress)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>3</span>
                Step 3: Partner Terms & Conditions Acceptance
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>4</span>
                Step 4: Active Dashboard & Fixed ₹500/day Earnings
              </div>
            </div>
          </div>

          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1rem', borderRadius: '12px', color: '#1e40af', fontSize: '0.82rem', fontWeight: 700, marginBottom: '1.5rem' }}>
            🔒 Note: Your vehicle is NOT visible to customers and earns ₹0/day while in PENDING_APPROVAL status.
          </div>

          <button onClick={logout} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>
            🚪 Logout Session
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SCREEN 2: REJECTED SCREEN
  // -------------------------------------------------------------
  if (currentStatus === 'REJECTED') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ maxWidth: '640px', width: '100%', background: '#fff', padding: '2.5rem', borderRadius: '24px', border: '1px solid #fee2e2', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', background: '#ffe4e6', color: '#be123c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 1.5rem auto' }}>
            🔴
          </div>
          
          <span style={{ background: '#ffe4e6', color: '#be123c', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>
            Status: REJECTED
          </span>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: '1rem 0 0.5rem 0' }}>
            Application Action Required / Rejected
          </h1>
          
          <p style={{ color: '#64748b', fontSize: '0.92rem', margin: '0 0 1.5rem 0' }}>
            Your vehicle registration application was reviewed by Super Admin and requires document correction.
          </p>

          <div style={{ background: '#fff1f2', border: '1px solid #fca5a5', padding: '1.25rem', borderRadius: '14px', textAlign: 'left', marginBottom: '2rem' }}>
            <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.85rem', fontWeight: 800, color: '#9f1239' }}>
              ⚠️ Rejection / Correction Reason:
            </h4>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#be123c', fontWeight: 600 }}>
              {ownerRecord.rejectionReason || 'Uploaded RC Book image or Insurance policy document was unclear. Please upload valid, legible copies of your vehicle documents.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => setShowResubmitModal(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>
              ✏️ Correct & Resubmit Application
            </button>
            <button onClick={logout} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>
              🚪 Logout
            </button>
          </div>
        </div>

        {/* RESUBMIT MODAL */}
        {showResubmitModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: '#fff', width: '100%', maxWidth: '520px', borderRadius: '20px', padding: '2rem', border: '1px solid #cbd5e1' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>✏️ Resubmit Vehicle & Documents</h3>
              <form onSubmit={handleResubmitSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, display: 'block', marginBottom: '0.3rem' }}>Car Name & Model</label>
                  <input type="text" value={resubmitData.carName} onChange={e => setResubmitData({ ...resubmitData, carName: e.target.value })} required style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, display: 'block', marginBottom: '0.3rem' }}>Vehicle Registration Plate No</label>
                  <input type="text" value={resubmitData.plate} onChange={e => setResubmitData({ ...resubmitData, plate: e.target.value })} required style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, display: 'block', marginBottom: '0.3rem', color: '#2563eb' }}>📄 Upload Clear RC Book Copy *</label>
                  <input type="file" required onChange={e => setResubmitData({ ...resubmitData, rcFileName: e.target.files[0]?.name || '' })} style={{ width: '100%', padding: '0.4rem', borderRadius: '8px', border: '1px dashed #2563eb', fontSize: '0.78rem', background: '#eff6ff' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, display: 'block', marginBottom: '0.3rem', color: '#2563eb' }}>📄 Upload Clear Insurance Policy *</label>
                  <input type="file" required onChange={e => setResubmitData({ ...resubmitData, insuranceFileName: e.target.files[0]?.name || '' })} style={{ width: '100%', padding: '0.4rem', borderRadius: '8px', border: '1px dashed #2563eb', fontSize: '0.78rem', background: '#eff6ff' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="submit" style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: '#2563eb', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer' }}>
                    🚀 Resubmit to Super Admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // SCREEN 3: TERMS & CONDITIONS ACCEPTANCE SCREEN (APPROVED BUT NOT ACCEPTED)
  // -------------------------------------------------------------
  if ((currentStatus === 'APPROVED' || currentStatus === 'TERMS_PENDING') && !isTermsAccepted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ maxWidth: '820px', width: '100%', background: '#fff', padding: '2.5rem', borderRadius: '24px', border: '1px solid #cbd5e1', boxShadow: '0 20px 30px -5px rgba(0,0,0,0.08)' }}>
          
          {/* HEADER */}
          <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '2rem' }}>📜</span>
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>
                Vehicle Owner Rental Partner Agreement
              </h1>
            </div>
            <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
              Please carefully review the terms below before activating your vehicle on RentOS.
            </p>
          </div>

          {/* 10 ACCORDION / CARD SECTIONS */}
          <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1.5rem' }}>
            {[
              {
                num: '01',
                title: 'Vehicle Verification & Ownership',
                desc: 'The vehicle owner confirms legal ownership and authorization to register the vehicle on RentOS. All vehicles are subject to Super Admin verification and approval. Vehicles will not be displayed to customers until: Admin Approval + Terms Acceptance + Vehicle Activation.'
              },
              {
                num: '02',
                title: 'Required Vehicle Documents',
                desc: 'The owner must provide valid and up-to-date Registration Certificate (RC), Comprehensive Insurance, Pollution Under Control (PUC), and Aadhaar ID. Expired or invalid documents may cause the vehicle to be temporarily suspended.'
              },
              {
                num: '03',
                title: 'Vehicle Condition & Maintenance',
                desc: 'The owner is responsible for keeping the vehicle roadworthy, safe, clean, operational, and properly serviced. Regular maintenance and repairs are the responsibility of the owner.'
              },
              {
                num: '04',
                title: 'Fixed ₹500 Daily Vehicle Owner Payment',
                desc: 'The vehicle owner receives a guaranteed fixed ₹500 per active vehicle day according to platform policy. Payment is NOT dependent on booking volume (Active = ₹500/day, Pending/Rejected/Inactive/Suspended = ₹0/day).'
              },
              {
                num: '05',
                title: 'Rental Company Settlement & Operations',
                desc: 'Customer rental rates, booking operations, pickup/returns, and customer payments are managed exclusively by Rental Company Admin. Vehicle owners do not manage customer bookings directly.'
              },
              {
                num: '06',
                title: 'Vehicle Availability & Prohibited Vehicles',
                desc: 'The owner must ensure the vehicle remains available during active listing. Stolen, unlawfully modified, unsafe, or undocumented vehicles are strictly prohibited.'
              },
              {
                num: '07',
                title: 'Suspension & Policy Violations',
                desc: 'RentOS may temporarily suspend or remove a vehicle if documents expire, false information is provided, or policy violations occur. Suspended vehicles generate ₹0/day during suspension.'
              },
              {
                num: '08',
                title: 'Payment & Settlement Schedule',
                desc: 'Eligible owner payments are calculated based on active vehicle days and processed via Paytm, UPI, or Direct Bank Settlement per platform schedule.'
              },
              {
                num: '09',
                title: 'Cancellations, Refunds & Account Security',
                desc: 'Customer cancellations, refunds, and adjustments are handled per platform policy. The owner is responsible for maintaining account credential security.'
              },
              {
                num: '10',
                title: 'Agreement & Acceptance',
                desc: 'By registering and activating the vehicle, the owner confirms: I have read, understood, and agree to the Vehicle Owner Rental Partner Terms & Conditions and certify that all provided details are accurate.'
              }
            ].map((sec) => (
              <div key={sec.num} style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                  <span style={{ background: '#eff6ff', color: '#2563eb', fontWeight: 900, fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                    {sec.num}
                  </span>
                  <strong style={{ fontSize: '0.92rem', color: '#0f172a', fontWeight: 800 }}>{sec.title}</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#475569', lineHeight: '1.55' }}>
                  {sec.desc}
                </p>
              </div>
            ))}
          </div>

          {/* CHECKBOX CONFIRMATION */}
          <div style={{ background: '#f0fdf4', padding: '1.25rem', borderRadius: '16px', border: '1px solid #bbf7d0', marginBottom: '1.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.92rem', fontWeight: 800, color: '#15803d' }}>
              <input 
                type="checkbox" 
                checked={acceptedTermsCheckbox} 
                onChange={(e) => setAcceptedTermsCheckbox(e.target.checked)} 
                style={{ width: '20px', height: '20px', accentColor: '#16a34a', cursor: 'pointer' }} 
              />
              <span>I have read and agree to all Terms & Conditions</span>
            </label>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={logout} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>
              🚪 Logout
            </button>

            <button 
              disabled={!acceptedTermsCheckbox} 
              onClick={handleAcceptTermsSubmit}
              style={{
                background: acceptedTermsCheckbox ? '#059669' : '#94a3b8',
                color: '#fff',
                border: 'none',
                padding: '0.85rem 2rem',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.95rem',
                cursor: acceptedTermsCheckbox ? 'pointer' : 'not-allowed',
                boxShadow: acceptedTermsCheckbox ? '0 4px 14px rgba(5,150,105,0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              🚀 Accept & Activate Vehicle
            </button>
          </div>
        </div>
      </div>
    );
  }
  // SCREEN 4: FULL ACTIVE VEHICLE OWNER DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="dashboard-layout" style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar" style={{ width: '260px', background: '#0f172a', color: '#ffffff', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        
        {/* Brand */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #1e293b' }}>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8', letterSpacing: '-0.5px' }}>
            Vehicle Owner Hub
          </h1>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
            Fixed ₹500/Day Partner Console
          </p>
        </div>

        {/* User Card */}
        <div style={{ padding: '1rem 1.5rem', background: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem' }}>
            {profileData.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {profileData.name}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 800 }}>
              🟢 Active Vehicle Partner
            </div>
          </div>
        </div>

        {/* Navigation Tabs (8 TABS ONLY - NO EMOJI ICONS - CLEAN LABELS) */}
        <nav style={{ flex: 1, padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'vehicles', label: 'My Vehicle' },
            { id: 'earnings', label: 'Daily Earnings' },
            { id: 'payments', label: 'Payments / Settlements' },
            { id: 'documents', label: 'Documents' },
            { id: 'profile', label: 'Profile' },
            { id: 'support', label: 'Support' },
            { id: 'terms', label: 'Terms & Conditions' }
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
      <main className="dashboard-main" style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        
        {/* TOP HEADER BAR WITH NOTIFICATIONS BELL */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', background: '#eff6ff', padding: '0.25rem 0.65rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              ✓ Verified Partner Console
            </span>
          </div>

          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '0.5rem 0.85rem', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}
            >
              🔔 Notifications {ownerNotifs.length > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', padding: '0.1rem 0.45rem', fontSize: '0.7rem', fontWeight: 900 }}>{ownerNotifs.length}</span>}
            </button>

            {showNotifDropdown && (
              <div style={{ position: 'absolute', right: 0, top: '2.5rem', zIndex: 9999, width: '360px', background: '#fff', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 20px 30px rgba(0,0,0,0.15)', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                  <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>🔔 Settlement & Payout Notifications</strong>
                  <button onClick={() => setShowNotifDropdown(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, color: '#64748b' }}>✕</button>
                </div>
                {ownerNotifs.length === 0 ? (
                  <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '1rem 0', textAlign: 'center' }}>No notifications yet</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '280px', overflowY: 'auto' }}>
                    {ownerNotifs.map(n => (
                      <div key={n.id} style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>{n.title}</div>
                        <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.2rem' }}>{n.message}</div>
                        <div style={{ fontSize: '0.68rem', color: '#2563eb', marginTop: '0.35rem', fontWeight: 700 }}>🕒 {n.timestamp}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* TOAST NOTICE */}
        {notice && (
          <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 99999, background: '#0f172a', color: '#38bdf8', padding: '0.85rem 1.5rem', borderRadius: '12px', border: '1px solid #38bdf8', fontWeight: 800, fontSize: '0.88rem', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
            {notice}
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 1: OVERVIEW
           ------------------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>
                Welcome back, {profileData.name}! 👋
              </h2>
              <p style={{ margin: '0.3rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                Fixed ₹500/day active vehicle partner console & daily settlement ledger.
              </p>
            </div>

            {/* 5 FINANCIAL KPI STAT CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              
              <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Today's Earnings</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2563eb', marginTop: '0.3rem' }}>₹ {todaysEarnings}</div>
                <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 700, marginTop: '0.4rem' }}>Fixed ₹500/day active rate</div>
              </div>

              <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Active Days</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#7c3aed', marginTop: '0.3rem' }}>{activeDaysCount} Days</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.4rem' }}>Active on platform</div>
              </div>

              <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Available Balance</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669', marginTop: '0.3rem' }}>₹ {availableBalance.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800, marginTop: '0.4rem' }}>Ready for Payout</div>
              </div>

              <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Paid</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#16a34a', marginTop: '0.3rem' }}>₹ {totalPaid.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, marginTop: '0.4rem' }}>✓ Settled via RazorpayX</div>
              </div>

              <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Pending Payout</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#d97706', marginTop: '0.3rem' }}>₹ {pendingPayout.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 700, marginTop: '0.4rem' }}>⏳ Awaiting Admin Transfer</div>
              </div>

            </div>

            {/* MODEL CALLOUT BANNER */}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#1e40af' }}>
                💡 Fixed ₹500/Day Payment Model Details
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#1e3a8a', lineHeight: '1.6' }}>
                As an approved partner, your vehicle generates a guaranteed fixed fee of <strong>₹500 per active day</strong>. This payment is NOT dependent on customer booking volume. Customer rental rates (e.g. ₹1,500/day) and rental logistics are managed exclusively by Rental Company Admin.
              </p>
            </div>

            {/* ACTIVE VEHICLE OVERVIEW */}
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>My Active Partner Fleet</h3>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.72rem', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Vehicle Name</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Reg Plate</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Fixed Daily Fee</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Documents</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((v, idx) => (
                      <tr key={v.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#0f172a' }}>{v.name}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#2563eb', fontWeight: 800 }}>{v.plate}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 900, color: '#059669' }}>₹ 500/day</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#059669', fontWeight: 700 }}>✓ RC Book & Insurance Verified</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '12px', background: '#dcfce7', color: '#15803d' }}>
                            🟢 ACTIVE
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

        {/* -------------------------------------------------------------
            TAB 2: MY VEHICLE
           ------------------------------------------------------------- */}
        {activeTab === 'vehicles' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>My Registered Personal Vehicle</h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>Super Admin verified vehicle photos and compliance details</p>
              </div>
              <button
                onClick={() => setShowAddVehicleModal(true)}
                style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                + Register New Car
              </button>
            </div>

            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.72rem', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Vehicle Photo & Details</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Registration Plate</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Owner Earnings Rate</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Compliance Status</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Platform Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v, idx) => (
                    <tr key={v.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img src={v.image} alt={v.name} style={{ width: '56px', height: '44px', borderRadius: '8px', objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{v.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{v.category || 'SUV'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: '#2563eb', fontWeight: 800, fontFamily: 'monospace' }}>{v.plate}</td>
                      <td style={{ padding: '1rem', fontWeight: 900, color: '#059669' }}>₹ 500 / active day</td>
                      <td style={{ padding: '1rem', color: '#059669', fontWeight: 700 }}>✓ RC Book & Insurance Verified</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '12px', background: '#dcfce7', color: '#15803d' }}>
                          🟢 ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 3: DAILY EARNINGS (FIXED ₹500/DAY LEDGER)
           ------------------------------------------------------------- */}
        {activeTab === 'earnings' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>Fixed ₹500/Day Earnings Ledger</h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>Guaranteed fixed fee earned for every active vehicle day on the platform</p>
            </div>

            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>ACCUMULATED FIXED EARNINGS</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#059669' }}>₹ {totalAccumulatedEarnings.toLocaleString('en-IN')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>DAILY VEHICLE FEE</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#2563eb' }}>₹ 500 / Day</div>
                </div>
              </div>

              <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                📅 Daily Active Vehicle Fee Breakdown
              </h4>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.72rem', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Vehicle Name</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Plate No</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Platform Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Fixed Fee Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: activeDaysCount }).map((_, idx) => {
                    const d = new Date();
                    d.setDate(d.getDate() - idx);
                    const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>{dateStr}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>{vehicles[0]?.name || 'Hyundai Creta SX'}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#2563eb', fontWeight: 800 }}>{vehicles[0]?.plate || 'TN29AZ7788'}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '12px', background: '#dcfce7', color: '#15803d' }}>
                            🟢 ACTIVE (₹500/day)
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 900, color: '#059669' }}>+ ₹ 500</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 4: PAYMENTS / SETTLEMENTS
           ------------------------------------------------------------- */}
        {activeTab === 'payments' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>Bank Account & Instant Payouts</h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>Manage your settlement account details and request instant Paytm / UPI withdrawals</p>
              </div>
              <button 
                onClick={() => { setEditProfileForm(profileData); setShowEditProfileModal(true); }} 
                style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
              >
                ✏️ Edit Bank Details
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Bank Account Details</h3>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>✓ Verified</span>
                </div>
                <div style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', color: '#475569' }}>
                  <div>Bank Name: <strong style={{ color: '#0f172a' }}>{profileData.bankName}</strong></div>
                  <div>Account No: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>XXXX XXXX {(profileData.accountNo || '').slice(-4)}</strong></div>
                  <div>IFSC Code: <strong style={{ color: '#0f172a' }}>{profileData.ifscCode}</strong></div>
                  <div>Account Holder: <strong style={{ color: '#0f172a' }}>{profileData.accountHolder}</strong></div>
                  <div>UPI ID: <strong style={{ color: '#2563eb' }}>{profileData.upiId}</strong></div>
                </div>
              </div>

              <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Available for Payout</h3>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#059669' }}>₹ {availableBalance.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>Accumulated from {activeDaysCount} active days</div>
                </div>
                <button 
                  onClick={handleRequestPayout} 
                  style={{ background: '#059669', color: '#fff', border: 'none', padding: '0.85rem', borderRadius: '12px', fontWeight: 900, fontSize: '0.92rem', cursor: 'pointer', marginTop: '1.25rem' }}
                >
                  Request Instant Payout
                </button>
              </div>
            </div>

            {/* PAYOUT HISTORY */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>Payout Requests & Settlement History</h3>
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
                    {payoutRequests.map(req => (
                      <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>{req.id}</td>
                        <td style={{ padding: '1rem', color: '#475569' }}>{req.requestedAt}</td>
                        <td style={{ padding: '1rem', fontWeight: 900, color: '#059669', fontSize: '0.95rem' }}>₹ {Number(req.amount).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '1rem', color: '#334155', fontWeight: 700 }}>{req.bankDetails}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: '12px', background: '#dcfce7', color: '#15803d' }}>
                            ✓ {req.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', fontFamily: 'monospace', color: '#64748b', fontSize: '0.8rem' }}>{req.utrNo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 5: DOCUMENTS
           ------------------------------------------------------------- */}
        {activeTab === 'documents' && (
          <div style={{ maxWidth: '850px' }}>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>🪪 Uploaded Vehicle & Owner Documents</h2>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.88rem', color: '#64748b' }}>Verified legal documents required for platform active status</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

              {/* RC BOOK */}
              <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b' }}>RC BOOK DOCUMENT</span>
                    <button 
                      onClick={() => { setEditingDocKey('rc'); setNewDocInput(docsState.rc.name); }}
                      style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.25rem 0.65rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      ✏️ Edit
                    </button>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: '0.4rem 0' }}>{docsState.rc.name}</div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: docsState.rc.tagColor, background: docsState.rc.tagBg, padding: '0.2rem 0.6rem', borderRadius: '12px', width: 'fit-content', marginTop: '0.5rem' }}>
                  {docsState.rc.status}
                </span>
              </div>

              {/* INSURANCE */}
              <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b' }}>VEHICLE INSURANCE POLICY</span>
                    <button 
                      onClick={() => { setEditingDocKey('insurance'); setNewDocInput(docsState.insurance.name); }}
                      style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.25rem 0.65rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      ✏️ Edit
                    </button>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: '0.4rem 0' }}>{docsState.insurance.name}</div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: docsState.insurance.tagColor, background: docsState.insurance.tagBg, padding: '0.2rem 0.6rem', borderRadius: '12px', width: 'fit-content', marginTop: '0.5rem' }}>
                  {docsState.insurance.status}
                </span>
              </div>

              {/* PUC */}
              <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b' }}>POLLUTION CONTROL (PUC)</span>
                    <button 
                      onClick={() => { setEditingDocKey('puc'); setNewDocInput(docsState.puc.name); }}
                      style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.25rem 0.65rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      ✏️ Edit
                    </button>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: '0.4rem 0' }}>{docsState.puc.name}</div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: docsState.puc.tagColor, background: docsState.puc.tagBg, padding: '0.2rem 0.6rem', borderRadius: '12px', width: 'fit-content', marginTop: '0.5rem' }}>
                  {docsState.puc.status}
                </span>
              </div>

              {/* AADHAAR */}
              <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b' }}>OWNER AADHAAR CARD</span>
                    <button 
                      onClick={() => { setEditingDocKey('aadhaar'); setNewDocInput(docsState.aadhaar.name); }}
                      style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.25rem 0.65rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      ✏️ Edit
                    </button>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: '0.4rem 0' }}>{docsState.aadhaar.name}</div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: docsState.aadhaar.tagColor, background: docsState.aadhaar.tagBg, padding: '0.2rem 0.6rem', borderRadius: '12px', width: 'fit-content', marginTop: '0.5rem' }}>
                  {docsState.aadhaar.status}
                </span>
              </div>

            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 6: PROFILE
           ------------------------------------------------------------- */}
        {activeTab === 'profile' && (
          <div style={{ maxWidth: '800px' }}>
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>🚗 Vehicle Partner KYC Profile</h2>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>Verified Vehicle Partner Credentials & Settlement Account</p>
                </div>
                <button 
                  onClick={() => { setEditProfileForm(profileData); setShowEditProfileModal(true); }}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  ✏️ Edit Profile Details
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem' }}>
                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>👤 Personal Information</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
                    <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Full Name</span><strong>{profileData.name}</strong></div>
                    <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Phone Number</span><strong>{profileData.phone}</strong></div>
                    <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Email Address</span><strong style={{ color: '#2563eb' }}>{profileData.email}</strong></div>
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>🪪 Verified KYC Documents</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
                    <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Aadhaar Card</span><strong>{profileData.aadhaar}</strong></div>
                    <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Driving Licence No</span><strong style={{ fontFamily: 'monospace' }}>{profileData.dlNumber}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 7: SUPPORT (WHATSAPP WEB STYLE REALTIME CHAT CONSOLE)
           ------------------------------------------------------------- */}
        {activeTab === 'support' && (
          <div style={{ maxWidth: '900px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  💬 WhatsApp Live Support Console
                  <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', padding: '0.25rem 0.65rem', borderRadius: '12px', fontWeight: 800 }}>
                    ONLINE 24x7
                  </span>
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                  Direct instant messaging line with RentOS Super Admin Help Desk
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              
              {/* SUPPORT INFO CARD */}
              <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.1rem', height: 'fit-content', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#00a884', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 900 }}>📞</div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>24x7 Partner Helpline</div>
                    <a href="tel:+9118002009988" style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0f172a', textDecoration: 'none' }}>+91 1800 200 9988</a>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 900 }}>✉️</div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Official Support Email</div>
                    <a href="mailto:admin@forgeindia.com" style={{ fontSize: '0.88rem', fontWeight: 800, color: '#2563eb', textDecoration: 'none' }}>admin@forgeindia.com</a>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 900 }}>💬</div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>WhatsApp Direct Desk</div>
                    <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" style={{ fontSize: '0.88rem', fontWeight: 800, color: '#15803d', textDecoration: 'none' }}>+91 98765 43210</a>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', fontSize: '0.78rem', color: '#475569', border: '1px solid #e2e8f0', marginTop: '0.25rem', lineHeight: '1.4' }}>
                  ⚡ <strong>Instant Response Guarantee:</strong> Super Admin agents are active 24x7. Messages sync live with WhatsApp web console.
                </div>
              </div>

              {/* WHATSAPP WEB STYLE LIVE CHAT CONSOLE */}
              <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #cbd5e1', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '460px', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
                
                {/* WHATSAPP TEAL HEADER */}
                <div style={{ padding: '0.85rem 1.25rem', background: '#075e54', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#128c7e', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 900, border: '2px solid rgba(255,255,255,0.3)' }}>
                        🛡️
                      </div>
                      <div style={{ position: 'absolute', bottom: '1px', right: '1px', width: '11px', height: '11px', borderRadius: '50%', background: '#25d366', border: '2px solid #075e54' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        RentOS Super Admin Support
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#aebac1', marginTop: '1px' }}>
                        online • replies instantly
                      </div>
                    </div>
                  </div>
                  <a href="tel:+9118002009988" title="Call Helpline" style={{ color: '#ffffff', textDecoration: 'none', background: 'rgba(255,255,255,0.15)', padding: '0.4rem 0.75rem', borderRadius: '16px', fontSize: '0.78rem', fontWeight: 700 }}>
                    📞 Helpline
                  </a>
                </div>

                {/* WHATSAPP CHAT WALLPAPER STREAM */}
                <div style={{ flex: 1, padding: '1rem 1.25rem', overflowY: 'auto', background: '#efeae2', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  
                  {/* DATE BADGE */}
                  <div style={{ alignSelf: 'center', background: '#ffffff', color: '#54656f', fontSize: '0.68rem', fontWeight: 800, padding: '0.25rem 0.75rem', borderRadius: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    TODAY
                  </div>

                  {supportMessages.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#54656f', gap: '0.5rem' }}>
                      <span style={{ fontSize: '2.5rem' }}>💬</span>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>No messages yet.</div>
                      <div style={{ fontSize: '0.75rem' }}>Type below to chat directly with Super Admin.</div>
                    </div>
                  ) : (
                    supportMessages.map((msg, idx) => {
                      const isMe = msg.sender === 'owner' || msg.senderRole === 'car-owner';
                      return (
                        <div key={msg.id || idx} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
                          <div style={{
                            background: isMe ? '#d9fdd3' : '#ffffff',
                            color: '#111b21',
                            padding: '0.6rem 0.85rem',
                            borderRadius: isMe ? '10px 0px 10px 10px' : '0px 10px 10px 10px',
                            boxShadow: '0 1px 2px rgba(11,20,26,0.12)',
                            fontSize: '0.86rem',
                            fontWeight: 500,
                            lineHeight: '1.4',
                            position: 'relative'
                          }}>
                            {!isMe && (
                              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#00a884', marginBottom: '0.2rem' }}>
                                🛡️ RentOS Super Admin
                              </div>
                            )}
                            <div>{msg.text || msg.message}</div>
                            <div style={{ fontSize: '0.62rem', color: '#667781', textAlign: 'right', marginTop: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                              {msg.time || msg.createdAt || '10:00 AM'}
                              {isMe && <span style={{ color: '#53bdeb', fontWeight: 900, fontSize: '0.82rem' }}>✓✓</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* WHATSAPP FOOTER INPUT BAR */}
                <form onSubmit={handleSendSupportMessage} style={{ padding: '0.75rem 1rem', background: '#f0f2f5', borderTop: '1px solid #d1d7db', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <button type="button" onClick={() => alert('Attachments: Select RC Document or Image to send to Admin.')} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#54656f', padding: '0.2rem' }} title="Attach File">
                    📎
                  </button>

                  <input 
                    type="text" 
                    placeholder="Type a message to Super Admin..." 
                    value={supportInput}
                    onChange={e => setSupportInput(e.target.value)}
                    style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: '24px', border: '1px solid #ffffff', background: '#ffffff', fontSize: '0.88rem', outline: 'none', color: '#111b21', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                  />

                  <button 
                    type="submit" 
                    style={{ 
                      width: '42px', 
                      height: '42px', 
                      borderRadius: '50%', 
                      background: '#00a884', 
                      color: '#ffffff', 
                      border: 'none', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '1.1rem', 
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,168,132,0.4)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    🚀
                  </button>
                </form>

              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 8: TERMS & CONDITIONS (VIEW ONLY)
           ------------------------------------------------------------- */}
        {activeTab === 'terms' && (
          <div style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>📜 Signed Partner Agreement</h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>Vehicle Owner Rental Partner Agreement on RentOS</p>
              </div>
              <button 
                onClick={() => setShowAgreementModal(true)}
                title="Click to View Official Partner Agreement Certificate"
                style={{
                  background: '#dcfce7',
                  border: '1px solid #86efac',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '10px',
                  color: '#15803d',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 2px 6px rgba(21,128,61,0.15)',
                  transition: 'all 0.2s ease'
                }}
              >
                ✓ Accepted & Active (View Certificate)
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { num: '01', title: 'Vehicle Verification & Ownership', desc: 'The vehicle owner confirms legal ownership and authorization to register the vehicle on RentOS. All vehicles are subject to Super Admin verification and approval.' },
                { num: '02', title: 'Required Vehicle Documents', desc: 'The owner must maintain valid RC Book, Comprehensive Insurance, PUC, and Aadhaar ID. Expired documents cause temporary suspension.' },
                { num: '03', title: 'Vehicle Condition & Maintenance', desc: 'The owner is responsible for keeping the vehicle roadworthy, safe, clean, operational, and regularly serviced.' },
                { num: '04', title: 'Fixed ₹500 Daily Vehicle Payment', desc: 'The vehicle owner receives a guaranteed fixed ₹500 per active vehicle day (NOT dependent on customer booking volume).' },
                { num: '05', title: 'Rental Company Settlement & Operations', desc: 'Customer rental pricing, booking operations, pickup/returns, and customer payments are managed exclusively by Rental Company Admin.' },
                { num: '06', title: 'Vehicle Availability & Prohibited Vehicles', desc: 'The owner must ensure the vehicle remains operational during active listing. Stolen or undocumented vehicles are strictly prohibited.' },
                { num: '07', title: 'Suspension & Policy Violations', desc: 'RentOS may temporarily suspend or remove a vehicle for document expiry or policy violations (earns ₹0 during suspension).' },
                { num: '08', title: 'Payment & Settlement Schedule', desc: 'Payouts calculated on active vehicle days and processed via Paytm, UPI, or Direct Bank Settlement per platform schedule.' },
                { num: '09', title: 'Cancellations, Refunds & Account Security', desc: 'Customer cancellations and refunds handled per platform policy. The owner is responsible for credential security.' },
                { num: '10', title: 'Agreement & Policy Acceptance', desc: 'By activating the vehicle, the owner confirms acceptance of all terms and certifies that all provided details are accurate.' }
              ].map(sec => (
                <div key={sec.num} style={{ background: '#fff', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                    <span style={{ background: '#eff6ff', color: '#2563eb', fontWeight: 900, fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                      {sec.num}
                    </span>
                    <strong style={{ fontSize: '0.92rem', color: '#0f172a', fontWeight: 800 }}>{sec.title}</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#475569', lineHeight: '1.55' }}>
                    {sec.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ADD VEHICLE MODAL */}
      {showAddVehicleModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '480px', borderRadius: '16px', padding: '2rem', border: '1px solid #cbd5e1' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>Register Personal Vehicle</h3>
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
                <label style={{ fontSize: '0.75rem', fontWeight: 800, display: 'block', marginBottom: '0.3rem' }}>Car Photo URL (Optional)</label>
                <input type="text" placeholder="https://images.unsplash.com/..." value={newVehicle.image} onChange={e => setNewVehicle({ ...newVehicle, image: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" style={{ flex: 1, padding: '0.7rem', borderRadius: '8px', background: '#2563eb', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}>
                  🚀 Submit for Verification
                </button>
                <button type="button" onClick={() => setShowAddVehicleModal(false)} style={{ padding: '0.7rem 1.25rem', borderRadius: '8px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
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
                <button type="submit" style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: '#2563eb', color: '#fff', border: 'none', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer' }}>
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

      {/* OFFICIAL SIGNED PARTNER AGREEMENT CERTIFICATE MODAL */}
      {showAgreementModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '600px', borderRadius: '24px', padding: '2rem', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <span style={{ fontSize: '1.6rem' }}>📜</span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>Official Partner Agreement Certificate</h3>
              </div>
              <button onClick={() => setShowAgreementModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '0.35rem 0.75rem', fontWeight: 800, cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>CERTIFICATE REGISTRATION REF</div>
                  <div style={{ fontWeight: 900, color: '#2563eb', fontFamily: 'monospace', fontSize: '0.92rem' }}>CERT-RENTOS-2026-{(profileData.name || 'PARTNER').toUpperCase().replace(/\s+/g, '')}</div>
                </div>
                <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '0.25rem 0.65rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.75rem' }}>
                  🟢 VERIFIED & ACTIVE
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                <div><span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Vehicle Partner</span><strong style={{ color: '#0f172a' }}>{profileData.name}</strong></div>
                <div><span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Contact Phone</span><strong style={{ color: '#0f172a' }}>{profileData.phone}</strong></div>
                <div><span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Registered Vehicle</span><strong style={{ color: '#2563eb' }}>{vehicles[0]?.name || 'Hyundai Creta SX'}</strong></div>
                <div><span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Registration Plate</span><strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{vehicles[0]?.plate || ownerRecord.plate}</strong></div>
                <div><span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Fixed Daily Fee</span><strong style={{ color: '#059669' }}>₹ 500 / Active Day</strong></div>
                <div><span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Agreement Date</span><strong style={{ color: '#0f172a' }}>{new Date().toLocaleDateString('en-IN')}</strong></div>
              </div>

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.75rem', borderRadius: '8px', color: '#1e40af', fontSize: '0.78rem', fontWeight: 700 }}>
                ✓ Vehicle Owner Rental Partner Terms & Conditions digitally signed. Super Admin verification active.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => window.print()} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: '#2563eb', color: '#fff', border: 'none', fontWeight: 900, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                🖨️ Print Agreement Certificate
              </button>
              <button onClick={() => setShowAgreementModal(false)} style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT DOCUMENT MODAL */}
      {editingDocKey && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '480px', borderRadius: '24px', padding: '2rem', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                ✏️ Edit {editingDocKey === 'rc' ? 'RC Book Document' : editingDocKey === 'insurance' ? 'Insurance Policy' : editingDocKey === 'puc' ? 'Pollution Control (PUC)' : 'Aadhaar Card'}
              </h3>
              <button onClick={() => setEditingDocKey(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '0.35rem 0.75rem', fontWeight: 800, cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                Choose File / Document Name *
              </label>
              <input 
                type="text"
                value={newDocInput}
                onChange={e => setNewDocInput(e.target.value)}
                placeholder="e.g. RC_Book_Updated_2026.pdf"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                Upload Scanned Document Copy (PDF / Image)
              </label>
              <input 
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    setNewDocInput(e.target.files[0].name);
                  }
                }}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '10px', border: '1px dashed #94a3b8', fontSize: '0.82rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => setEditingDocKey(null)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}
              >
                Cancel
              </button>

              <button 
                onClick={() => {
                  if (!newDocInput.trim()) return;
                  const updated = {
                    ...docsState,
                    [editingDocKey]: {
                      name: newDocInput.trim(),
                      status: '⏳ Sent for Admin Re-verification',
                      tagBg: '#fef3c7',
                      tagColor: '#b45309'
                    }
                  };
                  setDocsState(updated);
                  try {
                    localStorage.setItem('owner_uploaded_docs', JSON.stringify(updated));
                  } catch {}
                  setEditingDocKey(null);
                  showToast('🎉 Document updated successfully! Sent to Super Admin for re-verification.');
                }}
                style={{ flex: 1.3, padding: '0.75rem', borderRadius: '12px', background: '#2563eb', color: '#fff', border: 'none', fontWeight: 900, fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}
              >
                📤 Upload & Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
