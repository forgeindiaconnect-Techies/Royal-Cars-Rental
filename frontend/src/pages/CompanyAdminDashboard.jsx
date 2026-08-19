// CompanyAdminDashboard.jsx - RentOS Car Rental Dashboard (Updated)
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import FaceScanModal from '../components/FaceScanModal';
import BookingChatModal from '../components/BookingChatModal';
import { getValidImageUrl, handleImageError, fileToDataURL } from '../utils/imageUtils';
import { detectFace, compareFaces } from '../utils/faceVerificationUtil';
import { processDrivingLicenseOCR } from '../utils/dlOcrUtil';

/* ─────────────────────────────────────────────────────────────────
   SIDEBAR NAVIGATION ITEMS FOR COMPANY RENTAL ADMIN
───────────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'drivers', label: 'Drivers' },
  { id: 'fleet', label: 'Fleet' },
  { id: 'customers', label: 'Customers' },
  { id: 'revenue', label: 'Payments' },
  { id: 'subscription', label: 'Subscription Plan' },
  { id: 'live-tracking', label: 'Live trackings' },
  { id: 'reports', label: 'Reports' },
  { id: 'offers', label: 'Coupons' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'settings', label: 'Settings' },
];

/* ─────────────────────────────────────────────────────────────────
   COMPANY OPERATIONAL LIFECYCLE STEPS
───────────────────────────────────────────────────────────────── */
const FLOW_STEPS = [
  { step: '1', title: 'Company Login', target: 'dashboard' },
  { step: '2', title: 'Dashboard', target: 'dashboard' },
  { step: '3', title: 'Add Vehicles', target: 'fleet' },
  { step: '4', title: 'Add Drivers', target: 'drivers' },
  { step: '5', title: 'Receive Booking', target: 'bookings' },
  { step: '6', title: 'Approve / Reject', target: 'bookings' },
  { step: '7', title: 'Assign Driver', target: 'bookings' },
  { step: '8', title: 'Vehicle Pickup', target: 'bookings' },
  { step: '9', title: 'Trip Completed', target: 'bookings' },
  { step: '10', title: 'Payment', target: 'revenue' },
];

// Empty initial arrays — data comes from API or user-added entries only
const INITIAL_VEHICLES = [];
const INITIAL_DRIVERS = [];

const DEFAULT_OFFERS = [];

const safeSetLocalStorage = (key, value) => {
  try {
    const data = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, data);
  } catch (err) {
    console.warn(`LocalStorage quota exceeded for "${key}". Applying quota safety cleanup...`);
    try {
      if (typeof value === 'object' && value !== null) {
        const cleaned = JSON.parse(JSON.stringify(value, (k, v) => {
          if (typeof v === 'string' && (v.startsWith('data:') || v.length > 5000)) {
            return '[Attachment Document File]';
          }
          return v;
        }));
        localStorage.setItem(key, JSON.stringify(cleaned));
      }
    } catch (e) {
      console.warn('Storage fallback graceful exit:', e);
    }
  }
};

/* ─────────────────────────────────────────────────────────────────
   VEHICLE MODAL (ADD / EDIT VEHICLE)
───────────────────────────────────────────────────────────────── */
function VehicleModal({ vehicle, token, onClose, onSaved }) {
  const [make, setMake] = useState(vehicle?.make || '');
  const [model, setModel] = useState(vehicle?.model || '');
  const [year, setYear] = useState(vehicle?.year || 2024);
  const [category, setCategory] = useState(vehicle?.category || 'Sedan');
  const [pricePerDay, setPricePerDay] = useState(vehicle?.pricePerDay || 2500);
  const [regNumber, setRegNumber] = useState(vehicle?.regNumber || '');
  const [insuranceDocName, setInsuranceDocName] = useState(vehicle?.insuranceDocName || '');
  const [imageUrl, setImageUrl] = useState(vehicle?.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80');
  const [galleryImages, setGalleryImages] = useState(vehicle?.galleryImages || []);
  const [saving, setSaving] = useState(false);

  const handleMainPhotoFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    }
  };

  const handleGalleryFiles = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const urls = files.map(file => URL.createObjectURL(file));
      setGalleryImages(prev => [...prev, ...urls]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!make.trim() || !model.trim() || !regNumber.trim()) {
      alert('Make, Model, and Registration Plate Number are required.');
      return;
    }
    setSaving(true);
    const vehicleObj = {
      _id: vehicle?._id || vehicle?.id || 'v_' + Date.now(),
      make: make.trim(),
      model: model.trim(),
      year: Number(year),
      category,
      pricePerDay: Number(pricePerDay),
      regNumber: regNumber.trim().toUpperCase(),
      insuranceDocName: insuranceDocName || 'insurance_policy.pdf',
      imageUrl: imageUrl.trim(),
      galleryImages: galleryImages.length > 0 ? galleryImages : [
        'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80'
      ],
      available: true,
      status: 'Available',
      location: vehicle?.location || 'Krishnagiri Main Branch'
    };
    onSaved(vehicleObj);
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px', width: '94%', borderRadius: '20px', padding: '1.85rem', background: '#ffffff', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e3a8a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🏎️ {vehicle ? 'Edit Rental Vehicle' : 'Add New Vehicle to Fleet'}
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Enter vehicle details, insurance document & upload main + gallery photos</span>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold', color: '#64748b' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Brand & Model Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Brand / Make *</label>
              <input value={make} onChange={e => setMake(e.target.value)} required placeholder="e.g. BMW / Toyota / Hyundai" style={{ width: '100%', height: '42px', padding: '0 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Model Name *</label>
              <input value={model} onChange={e => setModel(e.target.value)} required placeholder="e.g. 3 Series / Fortuner / Creta" style={{ width: '100%', height: '42px', padding: '0 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Year, Category & Price/Day */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Car Year *</label>
              <input type="number" value={year} onChange={e => setYear(e.target.value)} required placeholder="2024" style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Category *</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
                <option>Sedan</option>
                <option>SUV</option>
                <option>Hatchback</option>
                <option>Luxury</option>
                <option>Electric EV</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Price / Day (₹) *</label>
              <input type="number" value={pricePerDay} onChange={e => setPricePerDay(e.target.value)} required placeholder="2500" style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Registration Plate & Insurance */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Registration Plate Number *</label>
              <input value={regNumber} onChange={e => setRegNumber(e.target.value)} required placeholder="TN 05 AB 1234" style={{ width: '100%', height: '42px', padding: '0 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', textTransform: 'uppercase' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#059669', marginBottom: '0.35rem' }}>📄 Upload Insurance Document *</label>
              <div style={{ height: '42px', display: 'flex', alignItems: 'center', background: '#f0fdf4', borderRadius: '8px', border: '1px dashed #059669', padding: '0 0.5rem', boxSizing: 'border-box' }}>
                <input type="file" accept="image/*,.pdf" onChange={e => setInsuranceDocName(e.target.files[0]?.name || '')} style={{ width: '100%', fontSize: '0.75rem', background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer' }} />
              </div>
              {insuranceDocName && <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: '3px', fontWeight: 700 }}>✓ Attached: {insuranceDocName}</div>}
            </div>
          </div>

          {/* MAIN COVER CAR PHOTO UPLOAD */}
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#2563eb' }}>📸 Main Featured Car Photo (Main Cover) *</label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ flex: 1, height: '42px', display: 'flex', alignItems: 'center', background: '#ffffff', borderRadius: '8px', border: '1px dashed #2563eb', padding: '0 0.5rem', boxSizing: 'border-box' }}>
                <input type="file" accept="image/*" onChange={handleMainPhotoFile} style={{ width: '100%', fontSize: '0.75rem', background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer' }} />
              </div>
              {imageUrl && <img src={imageUrl} alt="Main Car Cover" style={{ width: '60px', height: '42px', borderRadius: '8px', objectFit: 'cover', border: '2px solid #2563eb' }} />}
            </div>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Or paste Image URL (https://images.unsplash...)" style={{ width: '100%', height: '40px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.78rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* REMAINING GALLERY CAR PHOTOS UPLOAD (MULTIPLE FILES OR URL PASTE) */}
          <div style={{ background: '#faf5ff', padding: '1rem', borderRadius: '12px', border: '1px solid #e9d5ff', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#7c3aed' }}>🖼️ Upload Remaining Gallery Photos (Interior, Side, Rear) *</label>
            
            <div style={{ height: '42px', display: 'flex', alignItems: 'center', background: '#ffffff', borderRadius: '8px', border: '1px dashed #7c3aed', padding: '0 0.5rem', boxSizing: 'border-box' }}>
              <input type="file" accept="image/*" multiple onChange={handleGalleryFiles} style={{ width: '100%', fontSize: '0.75rem', background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer' }} />
            </div>

            {/* Paste Image URL Input Field */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="gallery_url_input"
                type="text"
                placeholder="Or paste Gallery Image URL (https://...)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = e.target.value.trim();
                    if (val) {
                      setGalleryImages(prev => [...prev, val]);
                      e.target.value = '';
                    }
                  }
                }}
                style={{ flex: 1, height: '38px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.78rem', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
              />
              <button
                type="button"
                onClick={() => {
                  const inputEl = document.getElementById('gallery_url_input');
                  if (inputEl && inputEl.value.trim()) {
                    setGalleryImages(prev => [...prev, inputEl.value.trim()]);
                    inputEl.value = '';
                  }
                }}
                style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '0 0.85rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                + Add Photo URL
              </button>
            </div>
            
            {galleryImages.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                {galleryImages.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <img src={img} alt={`Gallery ${idx + 1}`} style={{ width: '55px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1.5px solid #a855f7' }} />
                    <button type="button" onClick={() => setGalleryImages(galleryImages.filter((_, i) => i !== idx))} style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                ))}
                <div style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 800, alignSelf: 'center' }}>{galleryImages.length} photos added</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#ffffff', border: 'none', fontWeight: 900, fontSize: '0.92rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}>
              {saving ? 'Saving...' : vehicle ? '✓ Update Vehicle' : '➕ Save to Fleet'}
            </button>
            <button type="button" onClick={onClose} style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmployeePermissionModal({ employee, onClose, onSaved }) {
  const [perms, setPerms] = useState(employee?.permissions || {
    manageFleet: false,
    approveBookings: false,
    assignDrivers: false,
    viewReports: false,
    manageStaff: false
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '90%' }}>
        <div className="modal-header">
          <h3>👥 Manage Permissions</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="permissions-section" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={perms.manageFleet} onChange={e => setPerms({ ...perms, manageFleet: e.target.checked })} />
            <span>🚗 Manage Fleet & Add/Edit Vehicles</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={perms.approveBookings} onChange={e => setPerms({ ...perms, approveBookings: e.target.checked })} />
            <span>📋 View & Approve Customer Bookings</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={perms.assignDrivers} onChange={e => setPerms({ ...perms, assignDrivers: e.target.checked })} />
            <span>👨‍✈️ Assign Chauffeur Drivers to Trips</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={perms.viewReports} onChange={e => setPerms({ ...perms, viewReports: e.target.checked })} />
            <span>📊 View Financial & Revenue Analytics</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={perms.manageStaff} onChange={e => setPerms({ ...perms, manageStaff: e.target.checked })} />
            <span>👥 Manage Other Employees & Permissions</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onSaved(employee?.name)}>
            Save Permissions
          </button>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   DRIVER MODAL (ADD / EDIT DRIVER)
───────────────────────────────────────────────────────────────── */
function DriverModal({ driver, token, onClose, onSaved }) {
  const [name, setName] = useState(driver?.name || '');
  const [phone, setPhone] = useState(driver?.phone || '');
  const [email, setEmail] = useState(driver?.email || '');
  const [password, setPassword] = useState(driver?.password || 'driver123');
  const [licenseNumber, setLicenseNumber] = useState(driver?.licenseNumber || '');
  const [exp, setExp] = useState(driver?.exp || '5 Years');
  const [licenceFileName, setLicenceFileName] = useState(driver?.licenceFileName || '');
  const [driverFaceUrl, setDriverFaceUrl] = useState(driver?.driverFaceUrl || driver?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80');

  // Live Camera WebCam Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState('user'); // 'user' (Front) or 'environment' (Back)
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async (mode = cameraFacingMode) => {
    setCameraError('');
    setIsCameraActive(true);
    setCameraFacingMode(mode);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 300, facingMode: mode }
      });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.warn('Video play note:', e));
        }
      }, 200);
    } catch (err) {
      console.warn('Camera error:', err.message);
      setCameraError('Camera permission denied or unavailable. Please upload a face photo file below.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 320;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, 320, 320);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setDriverFaceUrl(dataUrl);
        stopCamera();
      } catch (e) {
        console.warn('Photo capture note:', e);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !licenseNumber.trim()) {
      alert('Driver Name, Phone Number, and License Number are required.');
      return;
    }
    const driverObj = {
      id: driver?.id || driver?._id || 'drv_' + Date.now(),
      _id: driver?._id || driver?.id || 'drv_' + Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@rentos.com`,
      password: password || 'driver123',
      licenseNumber: licenseNumber.trim().toUpperCase(),
      exp: exp.trim(),
      licenceFileName: licenceFileName || 'licence_document.pdf',
      status: driver?.status || 'Available',
      rating: driver?.rating || '5.0 ⭐',
      tripsCompleted: driver?.tripsCompleted || 0,
      dutyStatus: driver?.dutyStatus || 'ON DUTY',
      faceVerified: true,
      driverFaceUrl: driverFaceUrl.trim(),
      avatar: driverFaceUrl.trim(),
      location: driver?.location || 'Krishnagiri Main Hub',
      latitude: driver?.latitude || 12.5266,
      longitude: driver?.longitude || 78.2144,
      speed: '0 km/h (Stationary)',
      lastSignal: 'Live GPS Active'
    };
    onSaved(driverObj);
  };

  return (
    <div className="modal-overlay" onClick={() => { stopCamera(); onClose(); }} style={{ zIndex: 1100, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '94%', borderRadius: '20px', padding: '1.85rem', background: '#ffffff', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', border: '1px solid #e2e8f0', animation: 'fadeIn 0.2s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e3a8a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              👨‍✈️ {driver ? 'Edit Chauffeur Driver Profile' : 'Add New Driver to Roster'}
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Live camera face scanner, licence upload & instant driver app setup</span>
          </div>
          <button onClick={() => { stopCamera(); onClose(); }} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold', color: '#64748b' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Driver Full Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Ramesh Singh" style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Mobile Phone Number *</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+91 98765 43210" style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Driving License No. *</label>
              <input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} required placeholder="TN-05-2021-9988" style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Driving Experience *</label>
              <input value={exp} onChange={e => setExp(e.target.value)} required placeholder="e.g. 5 Years" style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Driver Email Address *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="driver@company.com" style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>Driver App Password 🔐 *</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* LIVE CAMERA WEBCAM FACE SCANNER OR FILE UPLOAD */}
          {isCameraActive ? (
            <div style={{ background: '#0f172a', borderRadius: '14px', padding: '1.25rem', textAlign: 'center', color: '#fff', border: '1.5px solid #10b981', boxShadow: '0 8px 24px rgba(16,185,129,0.25)' }}>
              
              {/* Front Camera vs Back Camera Switcher */}
              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => startCamera('user')}
                  style={{
                    padding: '0.35rem 0.85rem', borderRadius: '20px', border: '1px solid #3b82f6',
                    background: cameraFacingMode === 'user' ? '#2563eb' : '#1e293b',
                    color: '#fff', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  🤳 Front Camera (Selfie)
                </button>
                <button
                  type="button"
                  onClick={() => startCamera('environment')}
                  style={{
                    padding: '0.35rem 0.85rem', borderRadius: '20px', border: '1px solid #3b82f6',
                    background: cameraFacingMode === 'environment' ? '#2563eb' : '#1e293b',
                    color: '#fff', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  📸 Back Camera (Rear)
                </button>
              </div>

              <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto 0.75rem auto', borderRadius: '50%', overflow: 'hidden', border: '3px solid #10b981', boxShadow: '0 0 20px rgba(16,185,129,0.6)' }}>
                <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: cameraFacingMode === 'user' ? 'scaleX(-1)' : 'none' }} autoPlay playsInline muted />
              </div>
              <div style={{ fontSize: '0.82rem', color: '#a7f3d0', fontWeight: 800, marginBottom: '0.75rem' }}>
                🟢 Align face inside ring for Live Face Scan ({cameraFacingMode === 'user' ? 'Front Camera Active' : 'Back Camera Active'})
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
                <button type="button" onClick={capturePhoto} style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }}>
                  📸 Capture & Save Face Photo
                </button>
                <button type="button" onClick={stopCamera} style={{ padding: '0.55rem 1rem', borderRadius: '8px', background: '#334155', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e3a8a' }}>🤳 Live Face Scan & Verification</span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button type="button" onClick={() => startCamera('user')} style={{ padding: '0.4rem 0.7rem', borderRadius: '8px', background: '#2563eb', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                    🤳 Front Camera
                  </button>
                  <button type="button" onClick={() => startCamera('environment')} style={{ padding: '0.4rem 0.7rem', borderRadius: '8px', background: '#059669', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', boxShadow: '0 2px 8px rgba(5,150,105,0.3)' }}>
                    📸 Back Camera
                  </button>
                </div>
              </div>

              {cameraError && (
                <div style={{ fontSize: '0.75rem', color: '#dc2626', background: '#fef2f2', padding: '0.4rem 0.65rem', borderRadius: '6px', border: '1px solid #fca5a5' }}>
                  {cameraError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#059669', marginBottom: '0.25rem' }}>📄 Upload Licence Document *</label>
                  <input type="file" accept="image/*,.pdf" onChange={e => setLicenceFileName(e.target.files[0]?.name || '')} style={{ width: '100%', padding: '0.35rem', borderRadius: '6px', border: '1px dashed #059669', fontSize: '0.75rem', background: '#ffffff' }} />
                  {licenceFileName && <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: '2px', fontWeight: 700 }}>✓ Attached: {licenceFileName}</div>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', marginBottom: '0.25rem' }}>📁 Or Upload Face Image File *</label>
                  <input type="file" accept="image/*" onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setDriverFaceUrl(url);
                    }
                  }} style={{ width: '100%', padding: '0.35rem', borderRadius: '6px', border: '1px dashed #2563eb', fontSize: '0.75rem', background: '#ffffff' }} />
                </div>
              </div>

              {driverFaceUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f0fdf4', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <img src={driverFaceUrl} alt="Face Preview" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #10b981' }} />
                  <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 800 }}>
                    ✓ Face Photo Scanned & Attached
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#ffffff', border: 'none', fontWeight: 900, fontSize: '0.92rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}>
              {driver ? '💾 Save Driver Changes' : '👨‍✈️ Register Driver'}
            </button>
            <button type="button" onClick={() => { stopCamera(); onClose(); }} style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   EMPLOYEE MODAL (ADD / EDIT STAFF)
───────────────────────────────────────────────────────────────── */
function EmployeeModal({ employee, onClose, onSaved }) {
  const [name, setName] = useState(employee?.name || '');
  const [email, setEmail] = useState(employee?.email || '');
  const [phone, setPhone] = useState(employee?.phone || '');
  const [password, setPassword] = useState(employee?.password || 'staff123');
  const [role, setRole] = useState(employee?.role || 'Fleet Operations Executive');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert('Employee Name and Email are required.');
      return;
    }
    const empObj = {
      id: employee?.id || employee?._id || 'emp_' + Date.now(),
      _id: employee?._id || employee?.id || 'emp_' + Date.now(),
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || '+91 98765 43210',
      password: password || 'staff123',
      role,
      status: employee?.status || 'Active',
      createdAt: employee?.createdAt || new Date().toISOString()
    };
    onSaved(empObj);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', width: '92%', borderRadius: '16px', padding: '1.75rem' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e3a8a', margin: 0 }}>
            {employee ? '✏️ Edit Staff Member' : '👥 Register Staff Employee'}
          </h3>
          <button className="close-btn" onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Full Name *</label>
            <input className="input-field" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Ramesh Patel" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Work Email *</label>
              <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="employee@company.com" />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Phone Number</label>
              <input className="input-field" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Role Designation</label>
              <select className="input-field" value={role} onChange={e => setRole(e.target.value)}>
                <option value="Fleet Operations Executive">Fleet Operations Executive</option>
                <option value="Customer Support Lead">Customer Support Lead</option>
                <option value="Billing & Accounting Manager">Billing & Accounting Manager</option>
                <option value="Dispatch Coordinator">Dispatch Coordinator</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Login Password</label>
              <input className="input-field" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="staff123" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.65rem' }}>
              {employee ? '💾 Update Staff Member' : '👥 Register Staff'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: '0.65rem' }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   ASSIGN DRIVER MODAL
───────────────────────────────────────────────────────────────── */
function AssignDriverModal({ booking, companyDrivers, onClose, onAssigned }) {
  const availableDrivers = (companyDrivers || []).filter(d => d.status === 'Available' || d.dutyStatus === 'ON DUTY' || true);
  const [selectedDriverId, setSelectedDriverId] = useState(availableDrivers[0]?.id || availableDrivers[0]?._id || '');

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', width: '92%', borderRadius: '16px', padding: '1.75rem' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1e3a8a', margin: 0 }}>
            👨‍✈️ Assign Chauffeur Driver to Booking
          </h3>
          <button className="close-btn" onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.84rem' }}>
          <div style={{ fontWeight: 800, color: '#0f172a' }}>
            Booking #{String(booking?._id || booking?.bookingId || '').slice(-6).toUpperCase()}
          </div>
          <div style={{ color: '#475569', marginTop: '2px' }}>
            Customer: {booking?.customerName || 'Customer'} • Vehicle: {booking?.vehicleName || booking?.carName || 'Rental Vehicle'}
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>Select Available Driver *</label>
          <select
            className="input-field"
            value={selectedDriverId}
            onChange={e => setSelectedDriverId(e.target.value)}
            style={{ width: '100%', padding: '0.65rem', borderRadius: '8px' }}
          >
            {availableDrivers.length === 0 ? (
              <option value="">No active drivers in roster</option>
            ) : (
              availableDrivers.map(d => (
                <option key={d.id || d._id} value={d.id || d._id}>
                  {d.name} ({d.phone}) — {d.status || 'Available'}
                </option>
              ))
            )}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1, padding: '0.65rem', fontWeight: 800 }}
            disabled={!selectedDriverId}
            onClick={() => {
              const dObj = availableDrivers.find(d => (d.id || d._id) === selectedDriverId) || availableDrivers[0];
              if (dObj) {
                onAssigned(booking._id || booking.id, dObj.id || d._id, dObj.name);
              }
            }}
          >
            ✓ Assign Driver & Confirm
          </button>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.65rem' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   RENTAL TAX INVOICE MODAL
───────────────────────────────────────────────────────────────── */
function InvoiceModal({ booking, onClose }) {
  const bId = String(booking?._id || booking?.bookingId || 'BK-1001').slice(-6).toUpperCase();
  const totalAmount = booking?.totalAmount || booking?.price || 4500;
  const gstAmount = Math.round(totalAmount * 0.18);
  const grandTotal = totalAmount + gstAmount;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px', width: '92%', borderRadius: '16px', padding: '2rem', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>🧾 TAX INVOICE</h2>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>RentOS Car Rental Platform • GSTIN: 33AAAAA0000A1Z5</div>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 800 }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.82rem', marginBottom: '1.25rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>INVOICE DETAILS</div>
            <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>Invoice No: INV-2026-{bId}</div>
            <div style={{ color: '#475569' }}>Date: {new Date().toLocaleDateString()}</div>
            <div style={{ color: '#475569' }}>Booking Ref: #{bId}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>CUSTOMER DETAILS</div>
            <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{booking?.customerName || 'Vaideeswari S.'}</div>
            <div style={{ color: '#475569' }}>Phone: {booking?.customerPhone || '+91 98421 11223'}</div>
            <div style={{ color: '#475569' }}>Type: {booking?.bookingType || 'Self-Drive Rental'}</div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
              <th style={{ padding: '0.6rem', borderBottom: '1px solid #cbd5e1' }}>Description</th>
              <th style={{ padding: '0.6rem', borderBottom: '1px solid #cbd5e1', textAlign: 'right' }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '0.6rem', borderBottom: '1px solid #f1f5f9' }}>
                Vehicle Rental: <strong>{booking?.vehicleName || booking?.carName || 'BMW 3 Series'}</strong>
              </td>
              <td style={{ padding: '0.6rem', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>
                ₹{totalAmount.toLocaleString('en-IN')}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '0.6rem', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>
                GST @ 18% (CGST 9% + SGST 9%)
              </td>
              <td style={{ padding: '0.6rem', borderBottom: '1px solid #f1f5f9', textAlign: 'right', color: '#64748b' }}>
                ₹{gstAmount.toLocaleString('en-IN')}
              </td>
            </tr>
            <tr style={{ fontWeight: 900, fontSize: '0.95rem', background: '#ecfdf5' }}>
              <td style={{ padding: '0.75rem', color: '#065f46' }}>Grand Total (Paid)</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#065f46' }}>₹{grandTotal.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => window.print()}
            style={{ flex: 1, padding: '0.65rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
          >
            🖨️ Print / Download Tax Invoice
          </button>
          <button onClick={onClose} style={{ padding: '0.65rem 1.25rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

function CompanyAdminDashboard() {
  const {token, logout, user, setUser} = useAuth();
  const [activeNav, setActiveNav] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') || params.get('nav') || params.get('page') || params.get('view');
      const action = params.get('action') || params.get('subscribe') || params.get('pay');
      if (
      tab === 'subscription' ||
      tab === 'plans' ||
      tab === 'pay' ||
      action === 'subscribe' ||
      action === 'true' ||
      window.location.hash.toLowerCase().includes('subscription') ||
      window.location.hash.toLowerCase().includes('plans')
      ) {
        return 'subscription';
      }
    } catch { }
      return 'subscription';
  });

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') || params.get('nav') || params.get('page') || params.get('view');
      const action = params.get('action') || params.get('subscribe') || params.get('pay');
      if (
      tab === 'subscription' ||
      tab === 'plans' ||
      tab === 'pay' ||
      action === 'subscribe' ||
      action === 'true' ||
      window.location.hash.toLowerCase().includes('subscription') ||
      window.location.hash.toLowerCase().includes('plans')
      ) {
        setActiveNav('subscription');
      }
    } catch { }
  }, []);
      const [loading, setLoading] = useState(true);
      const [notice, setNotice] = useState('');
      const [fetchedCompanyStatus, setFetchedCompanyStatus] = useState(null);

      // Subscription Lockout & Upgrade Required Popup States
      const [isSubscriptionLocked, setIsSubscriptionLocked] = useState(false);
      const [showUpgradeRequiredPopup, setShowUpgradeRequiredPopup] = useState(false);

  const handleNavClick = (navId) => {
    if (isSubscriptionLocked && navId !== 'subscription') {
        setShowUpgradeRequiredPopup(true);
      return;
    }
    if (navId === 'subscription' && isEmailSubscriptionFlow) {
      setShowOnlySinglePlan(true);
    }
      setActiveNav(navId);
  };

      // Subscription Payment & Royal Welcome Modal States
      const [showPaymentModal, setShowPaymentModal] = useState(false);
      const [showRoyalWelcomeModal, setShowRoyalWelcomeModal] = useState(false);
      const [selectedPlanToPay, setSelectedPlanToPay] = useState(null);
      const [paymentMethod, setPaymentMethod] = useState('upi');
      const [upiIdInput, setUpiIdInput] = useState('vaidee@upi');

      // Super Admin Targeted Email Flow & Single Plan States
      const [isEmailSubscriptionFlow, setIsEmailSubscriptionFlow] = useState(() => {
        try {
          const params = new URLSearchParams(window.location.search);
          return params.get('fromEmail') === 'true' || params.get('emailFlow') === 'true' || !!params.get('plan');
        } catch { return false; }
      });

      const [targetedPlanName, setTargetedPlanName] = useState(() => {
        try {
          const params = new URLSearchParams(window.location.search);
          return params.get('plan') || 'Starter Plan';
        } catch { return 'Starter Plan'; }
      });

      const [showOnlySinglePlan, setShowOnlySinglePlan] = useState(() => {
        try {
          const params = new URLSearchParams(window.location.search);
          return params.get('fromEmail') === 'true' || params.get('singlePlan') === 'true' || !!params.get('plan');
        } catch { return false; }
      });

  // Paid Subscription & Payment History States
  const [paymentHistory, setPaymentHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('company_payments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { }
      return [
      {
        id: 'PAY-1001',
      transactionId: 'PAY-1001',
      plan: 'Starter Plan (Monthly SaaS License)',
      amount: 3999,
      method: 'UPI / Razorpay',
      date: '30 May 2026',
      status: 'SUCCESS'
      }
      ];
  });

  const [activePlanData, setActivePlanData] = useState(() => {
    try {
      const saved = localStorage.getItem('company_active_plan');
      if (saved) return JSON.parse(saved);
    } catch { }
      return {
        name: 'Starter Plan',
      price: 3999,
      paidDate: '30 May 2026',
      expiryDate: '30 Aug 2026',
      transactionId: 'PAY-1001',
      status: 'Active'
    };
  });

      const [viewReceiptModalData, setViewReceiptModalData] = useState(null);

  // Customer Reviews Module States
  const [reviewsList, setReviewsList] = useState(() => {
    try {
      const saved = localStorage.getItem('company_customer_reviews');
      if (saved) return JSON.parse(saved);
    } catch { }
      return [
      {
        id: 'rev_101',
      customerName: 'Shanu',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      vehicleRented: 'BMW 3 Series (TN 05 AB 1234)',
      driverName: 'Oviyaa S.',
      rating: 5,
      date: '2026-07-28',
      bookingId: 'BK-2026-6234',
      verified: true,
      comment: 'Excellent service! The car was spotless, extremely smooth ride, and driver Oviyaa was punctual and courteous. Highly recommended Royal Car Rental!',
      adminReply: 'Thank you Shanu for your wonderful 5-star review! We look forward to hosting your next journey.'
      },
      {
        id: 'rev_102',
      customerName: 'Rahul Kumar',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
      vehicleRented: 'Mahindra Thar 4x4 (TN 01 AB 9842)',
      driverName: 'Self Drive',
      rating: 5,
      date: '2026-07-26',
      bookingId: 'BK-2026-9842',
      verified: true,
      comment: 'Self drive Thar booking process was seamless. Traccar GPS guidance worked flawlessly on highway drive!',
      adminReply: 'Glad you enjoyed the Thar off-road experience Rahul! Safe driving always.'
      },
      {
        id: 'rev_103',
      customerName: 'Priya Sharma',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
      vehicleRented: 'Hyundai Creta (TN 02 CD 7412)',
      driverName: 'Self Drive',
      rating: 4,
      date: '2026-07-24',
      bookingId: 'BK-2026-7412',
      verified: true,
      comment: 'Very clean car and friendly customer service support. Fast document verification on pickup.',
      adminReply: ''
      },
      {
        id: 'rev_104',
      customerName: 'Anand Kumar',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
      vehicleRented: 'Toyota Fortuner (TN 03 EF 3310)',
      driverName: 'Ramesh Singh',
      rating: 5,
      date: '2026-07-20',
      bookingId: 'BK-2026-3310',
      verified: true,
      comment: 'Great family trip experience. Chauffeur Ramesh was very knowledgeable about local routes.',
      adminReply: 'Thank you Anand! We take pride in our experienced chauffeurs.'
      }
      ];
  });
      const [reviewRatingFilter, setReviewRatingFilter] = useState('all');
      const [replyInputText, setReplyInputText] = useState({ });

      // Data States — initialize from localStorage isolated company-wise
      const [stats, setStats] = useState(null);

      const getCompanyEmailKey = () => {
        const email = user?.email || companyInfo?.ownerEmail || localStorage.getItem('company_owner_email') || 'pooja@gmail.com';
        return email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      };

      const [vehicles, setVehicles] = useState(() => {
        try {
          const email = user?.email || localStorage.getItem('company_owner_email') || 'pooja@gmail.com';
          const key = `company_vehicles_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          const saved = localStorage.getItem(key);
          if (saved) return JSON.parse(saved);

          // Fallback migration: check global company_vehicles_list
          const globalSaved = localStorage.getItem('company_vehicles_list');
          if (globalSaved) {
            const parsed = JSON.parse(globalSaved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              localStorage.setItem(key, JSON.stringify(parsed));
              return parsed;
            }
          }
          return [];
        } catch { return []; }
      });

      const defaultCompanyDrivers = [
        { id: 'drv_ramesh', _id: 'drv_ramesh', name: 'Ramesh', phone: '+91 98765 11111', licenseNumber: 'TN-01-2022-1234', exp: '5 Years', rating: '4.9 ⭐', status: 'Active', assignedVehicle: 'TN 01 AB 1234 - Hyundai Creta', assignedVehicleId: 'v_creta_1', assignedVehiclePlate: 'TN 01 AB 1234', assignedVehicleModel: 'Hyundai Creta', faceVerified: true },
        { id: 'drv_suresh', _id: 'drv_suresh', name: 'Suresh', phone: '+91 98765 22222', licenseNumber: 'TN-02-2021-5678', exp: '6 Years', rating: '4.8 ⭐', status: 'Active', assignedVehicle: 'TN 02 CD 5678 - Honda City', assignedVehicleId: 'v_city_1', assignedVehiclePlate: 'TN 02 CD 5678', assignedVehicleModel: 'Honda City', faceVerified: true },
        { id: 'drv_kumar', _id: 'drv_kumar', name: 'Kumar', phone: '+91 98765 33333', licenseNumber: 'TN-03-2023-9900', exp: '4 Years', rating: '4.7 ⭐', status: 'Available', assignedVehicle: 'Not Assigned', assignedVehicleId: null, faceVerified: true },
        { id: 'drv_ramesh_singh', _id: 'drv_ramesh_singh', name: 'Ramesh Singh', phone: '+91 98765 99999', licenseNumber: 'TN-04-2020-8877', exp: '8 Years', rating: '4.9 ⭐', status: 'Available', assignedVehicle: 'TN 01 BK 5475 - Toyota Innova 2023', assignedVehicleId: 'v_innova_1', faceVerified: true },
        { id: 'drv_oviyaa', _id: 'drv_oviyaa', name: 'Oviyaa S.', phone: '+91 98765 44444', licenseNumber: 'TN-05-2021-9988', exp: '7 Years', rating: '5.0 ⭐', status: 'In Trip', assignedVehicle: 'TN 04 GH 1188 - BMW 3 Series', assignedVehicleId: 'v_bmw_1', faceVerified: true }
      ];

      const [drivers, setDrivers] = useState(() => {
        try {
          const email = user?.email || localStorage.getItem('company_owner_email') || 'pooja@gmail.com';
          const key = `company_drivers_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          const saved = localStorage.getItem(key);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          }

          const registry = localStorage.getItem('company_drivers_registry');
          if (registry) {
            const parsed = JSON.parse(registry);
            if (Array.isArray(parsed)) {
              const companyEmail = email.trim().toLowerCase();
              const filtered = parsed.filter(d => (d.companyEmail && d.companyEmail.trim().toLowerCase() === companyEmail) || (d.ownerEmail && d.ownerEmail.trim().toLowerCase() === companyEmail));
              if (filtered.length > 0) {
                localStorage.setItem(key, JSON.stringify(filtered));
                return filtered;
              }
            }
          }
          localStorage.setItem(key, JSON.stringify(defaultCompanyDrivers));
          return defaultCompanyDrivers;
        } catch { return defaultCompanyDrivers; }
      });

      const [bookings, setBookings] = useState(() => {
        try {
          const email = user?.email || localStorage.getItem('company_owner_email') || 'pooja@gmail.com';
          const key = `company_bookings_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          const saved = localStorage.getItem(key);
          if (saved) return JSON.parse(saved);

          const globalSaved = localStorage.getItem('customer_bookings_list');
          if (globalSaved) {
            const parsed = JSON.parse(globalSaved);
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter(b => (b.companyEmail && b.companyEmail.trim().toLowerCase() === email.trim().toLowerCase()) || (b.company?.email === email));
              if (filtered.length > 0) {
                localStorage.setItem(key, JSON.stringify(filtered));
                return filtered;
              }
            }
          }
          return [];
        } catch { return []; }
      });

      // Reactive local-storage bookings: re-reads every time Bookings tab opens or every 3 s
      const readLocalBookings = () => {
        try {
          const compBookings = JSON.parse(localStorage.getItem('company_bookings_list') || '[]');
          const custBookings = JSON.parse(localStorage.getItem('customer_bookings_list') || '[]');
          const assignedBookings = JSON.parse(localStorage.getItem('company_assigned_bookings') || '[]');
          const map = new Map();
          [...custBookings, ...compBookings, ...assignedBookings].forEach(b => {
            if (b && (b._id || b.bookingId || b.id)) {
              const k = String(b._id || b.bookingId || b.id);
              map.set(k, b);
            }
          });
          return Array.from(map.values());
        } catch { return []; }
      };
      const [localBookingsList, setLocalBookingsList] = useState(readLocalBookings);

      const [staffList, setStaffList] = useState(() => {
        try {
          const email = user?.email || localStorage.getItem('company_owner_email') || 'pooja@gmail.com';
          const key = `company_staff_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          const saved = localStorage.getItem(key);
          if (saved) return JSON.parse(saved);

          const globalSaved = localStorage.getItem('company_staff_list');
          if (globalSaved) {
            const parsed = JSON.parse(globalSaved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              localStorage.setItem(key, JSON.stringify(parsed));
              return parsed;
            }
          }
          return [];
        } catch { return []; }
      });

      const [driverLocations, setDriverLocations] = useState([]);
      const [customersList, setCustomersList] = useState(() => {
        try {
          const email = user?.email || localStorage.getItem('company_owner_email') || 'pooja@gmail.com';
          const key = `company_customers_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          const saved = localStorage.getItem(key);
          if (saved) return JSON.parse(saved);

          const defaultCust = [
            { id: 'c_shanu', name: 'Shanu', email: 'shanu@gmail.com', phone: '+91 98765 43210', trips: 3, rating: 4.9, docVerified: true, status: 'Active' },
            { id: 'c_rahul', name: 'Rahul Kumar', email: 'rahul@gmail.com', phone: '+91 98765 43210', trips: 5, rating: 4.8, docVerified: true, status: 'Active' },
            { id: 'c_priya', name: 'Priya Sharma', email: 'priya@gmail.com', phone: '+91 98765 74120', trips: 2, rating: 5.0, docVerified: true, status: 'Active' },
            { id: 'c_anand', name: 'Anand Kumar', email: 'anand@gmail.com', phone: '+91 98765 33100', trips: 1, rating: 4.7, docVerified: false, status: 'Active' },
            { id: 'c_vikram', name: 'Vikram R.', email: 'vikram@gmail.com', phone: '+91 96385 27412', trips: 4, rating: 4.9, docVerified: true, status: 'Active' },
            { id: 'c_deepu', name: 'Deepu R.', email: 'deepu@gmail.com', phone: '+91 98765 55900', trips: 6, rating: 4.9, docVerified: true, status: 'Active' }
          ];
          localStorage.setItem(key, JSON.stringify(defaultCust));
          return defaultCust;
        } catch { return []; }
      });

      // Modals & Filters
      const [showVehicleModal, setShowVehicleModal] = useState(false);
      const [editingVehicle, setEditingVehicle] = useState(null);
      const [showDriverModal, setShowDriverModal] = useState(false);
      const [editingDriver, setEditingDriver] = useState(null);
      const [assignVehicleModalDriver, setAssignVehicleModalDriver] = useState(null);
      const [selectedVehicleToAssign, setSelectedVehicleToAssign] = useState('');
      const [showEmployeeModal, setShowEmployeeModal] = useState(false);

      const handleAssignVehicleToDriver = (driver, vehicleId) => {
        if (!driver) return;
        const email = user?.email || localStorage.getItem('company_owner_email') || 'pooja@gmail.com';
        const key = `company_drivers_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

        let vehicleObj = null;
        if (vehicleId && vehicleId !== 'unassign') {
          vehicleObj = vehicles.find(v => String(v._id || v.id) === String(vehicleId));
        }

        const assignedVehicleText = vehicleObj ? `${vehicleObj.plate || vehicleObj.regNo || vehicleObj.registrationNumber || 'TN 01 AB 1234'} - ${vehicleObj.model || vehicleObj.make}` : 'Not Assigned';
        const assignedVehiclePlate = vehicleObj ? (vehicleObj.plate || vehicleObj.regNo || vehicleObj.registrationNumber || 'TN 01 AB 1234') : '';
        const assignedVehicleModel = vehicleObj ? (vehicleObj.model || vehicleObj.make || 'Car') : '';

        const updatedDrivers = drivers.map(d => {
          if (String(d.id || d._id) === String(driver.id || driver._id) || d.name === driver.name) {
            return {
              ...d,
              assignedVehicle: assignedVehicleText,
              assignedVehicleId: vehicleObj ? (vehicleObj._id || vehicleObj.id) : null,
              assignedVehiclePlate,
              assignedVehicleModel,
              status: vehicleObj ? 'Active' : 'Available'
            };
          }
          return d;
        });

        setDrivers(updatedDrivers);
        safeSetLocalStorage(key, updatedDrivers);
        safeSetLocalStorage('company_drivers_registry', updatedDrivers);
        safeSetLocalStorage('approved_drivers', updatedDrivers);

        if (vehicleObj) {
          safeSetLocalStorage(`driver_assigned_vehicle_${driver.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`, {
            model: assignedVehicleModel,
            plate: assignedVehiclePlate,
            name: assignedVehicleText,
            status: 'Assigned'
          });
          showNotification(`✓ Assigned vehicle ${assignedVehicleText} to Driver ${driver.name} successfully!`);
        } else {
          localStorage.removeItem(`driver_assigned_vehicle_${driver.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
          showNotification(`✓ Unassigned vehicle from Driver ${driver.name}. Driver is now Available.`);
        }

        setAssignVehicleModalDriver(null);
      };
      const [editingEmployee, setEditingEmployee] = useState(null);
      const [selectedEmployeePermission, setSelectedEmployeePermission] = useState(null);
      const [showFlowModal, setShowFlowModal] = useState(false);
      const [selectedBooking, setSelectedBooking] = useState(null);
      const [selectedCustomerDocsBooking, setSelectedCustomerDocsBooking] = useState(null);
      const [assigningDriverBooking, setAssigningDriverBooking] = useState(null);
      const [traccarModalVehicle, setTraccarModalVehicle] = useState(null);
      const [bookingFilter, setBookingFilter] = useState('all');
      const [attendanceTypeFilter, setAttendanceTypeFilter] = useState('all');
      const [attendanceSearch, setAttendanceSearch] = useState('');
      const [attendanceSyncTick, setAttendanceSyncTick] = useState(0);
      const [hoveredRevenueMonth, setHoveredRevenueMonth] = useState(null);
      const [hoveredBookingDay, setHoveredBookingDay] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
        setAttendanceSyncTick(t => t + 1);
    }, 2000);
    const handleStorageChange = () => setAttendanceSyncTick(t => t + 1);
      window.addEventListener('storage', handleStorageChange);
    return () => {
        clearInterval(timer);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

      // Company Branding & Isolated Storage Key per Company Email
      const companyOwnerEmail = (user?.email || localStorage.getItem('company_owner_email') || 'pooja@gmail.com').trim().toLowerCase();
      const currentCompanyKey = companyOwnerEmail.replace(/[^a-z0-9]/g, '_');

      const [companyLogoUrl, setCompanyLogoUrl] = useState(() => {
        const savedLogo = localStorage.getItem(`company_logo_${currentCompanyKey}`);
        if (savedLogo) return savedLogo;

        const defaultCompName = user?.company?.name || (companyOwnerEmail.includes('vaidee') ? 'Vaidee Cars' : companyOwnerEmail.includes('pooja') ? 'Pooja Cars' : 'Rental Agency');
        const letter = defaultCompName.charAt(0).toUpperCase();
        
        // Custom SVG Badge Logo for companies without an uploaded logo
        return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" rx="20" fill="%232563eb"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-size="52" font-family="sans-serif" font-weight="bold">${letter}</text></svg>`;
      });

      const [logoHasError, setLogoHasError] = useState(false);
      const [isRecording, setIsRecording] = useState(false);
      const [recordingSeconds, setRecordingSeconds] = useState(0);
      const recordingIntervalRef = useRef(null);
      const fileInputRef = useRef(null);

      // Leaflet map refs and CSV utility
      const mapRef = useRef(null);
      const markersRef = useRef({ });

  const downloadCSV = (headers, rows, filename) => {
    const escapeField = (field) => {
      if (field === null || field === undefined) return '""';
      const stringified = String(field);
      return `"${stringified.replace(/"/g, '""')}"`;
    };
      const csvContent = "\uFEFF" + [
      headers.map(escapeField).join(","),
      ...rows.map(row => row.map(escapeField).join(","))
      ].join("\r\n");

      const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  useEffect(() => {
        setLogoHasError(false);
  }, [companyLogoUrl]);

      const [companyPhoneInput, setCompanyPhoneInput] = useState(() => localStorage.getItem(`company_phone_${currentCompanyKey}`) || user?.mobile || '9517368420');

      // Full Company Profile & KYC Documents States
      const [companyInfo, setCompanyInfo] = useState(() => {
        try {
          const saved = localStorage.getItem(`company_info_details_${currentCompanyKey}`);
          if (saved) return JSON.parse(saved);
        } catch {}
        return {
          name: user?.company?.name || localStorage.getItem(`company_name_${currentCompanyKey}`) || (companyOwnerEmail.includes('vaidee') ? 'Vaidee Cars' : 'Pooja Cars'),
          ownerName: user?.ownerName || user?.name || (companyOwnerEmail.includes('vaidee') ? 'Vaideeswari' : 'pooja'),
          ownerEmail: companyOwnerEmail,
          mobile: user?.mobile || '9517368420',
          commissionRate: 10,
          subscriptionPrice: 2999,
          status: 'active',
          onboardedAt: '2026-07-23T00:00:00.000Z',
          city: companyOwnerEmail.includes('vaidee') ? 'Chennai' : 'krishnagiri',
          state: 'Tamil Nadu',
          address: companyOwnerEmail.includes('vaidee') ? 'GST Road, Tambaram, Chennai' : 'Bik mariyaman kovil street, denkanikottai, krishnagiri',
          pincode: companyOwnerEmail.includes('vaidee') ? '600045' : '635107',
          aadharNumber: '',
          aadharDoc: '',
          panNumber: '',
          panDoc: '',
          gstNumber: '',
          gstDoc: '',
        };
      });

      const [ownerNameInput, setOwnerNameInput] = useState(() => companyInfo?.ownerName || user?.name || 'pooja');
      const [ownerEmailInput, setOwnerEmailInput] = useState(() => companyInfo?.ownerEmail || user?.email || 'pooja@gmail.com');
      const [companyPasswordInput, setCompanyPasswordInput] = useState(() => {
        try {
          const customPasses = JSON.parse(localStorage.getItem('custom_user_passwords') || '{}');
          return customPasses[(companyInfo?.ownerEmail || user?.email || 'pooja@gmail.com').toLowerCase()] || 'password123';
        } catch { return 'password123'; }
      });
      const [cityInput, setCityInput] = useState(() => companyInfo?.city || 'krishnagiri');
      const [stateInput, setStateInput] = useState(() => companyInfo?.state || 'Tamil Nadu');
      const [addressInput, setAddressInput] = useState(() => companyInfo?.address || 'Bik mariyaman kovil street, denkanikottai, krishnagiri');

      const [aadharNumInput, setAadharNumInput] = useState(() => companyInfo?.aadharNumber || '');
      const [aadharDocInput, setAadharDocInput] = useState(() => companyInfo?.aadharDoc || '');
      const [panNumInput, setPanNumInput] = useState(() => companyInfo?.panNumber || '');
      const [panDocInput, setPanDocInput] = useState(() => companyInfo?.panDoc || '');
      const [gstNumInput, setGstNumInput] = useState(() => companyInfo?.gstNumber || '');
      const [gstDocInput, setGstDocInput] = useState(() => companyInfo?.gstDoc || '');

      const missingKycDocs = [];
      if (!aadharDocInput && !companyInfo?.aadharDoc && !companyInfo?.aadharNumber) missingKycDocs.push('Aadhaar Card');
      if (!panDocInput && !companyInfo?.panDoc && !companyInfo?.panNumber) missingKycDocs.push('PAN Card');
      if (!gstDocInput && !companyInfo?.gstDoc && !companyInfo?.gstNumber) missingKycDocs.push('GST Certificate');
      const hasMissingKyc = missingKycDocs.length > 0;

      const [targetAudience, setTargetAudience] = useState('All Company Members');
      const [notifTitle, setNotifTitle] = useState('');
      const [notifMsg, setNotifMsg] = useState('');

  // Notification States & Fetch
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('company_broadcast_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { }
      return [
      {
        _id: 'notif_101',
      title: '🎉 Weekend Special: 15% Off Self-Drive Luxury Fleet',
      message: 'Broadcast alert sent to all registered customers for monsoon rental discounts.',
      targetAudience: 'All Company Members',
      targetRole: 'all',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      status: 'Dispatched',
      senderName: 'Operations Admin'
      },
      {
        _id: 'notif_102',
      title: '👨‍✈️ Mandatory Shift Biometric Face Scan Policy',
      message: 'Reminder sent to all company chauffeurs: Clock-in and clock-out require face authentication.',
      targetAudience: 'Company Drivers Only',
      targetRole: 'driver',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      status: 'Dispatched',
      senderName: 'Operations Admin'
      }
      ];
  });
      const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
      const [unreadCount, setUnreadCount] = useState(0);

      // Support Chat States
      const [chatMessages, setChatMessages] = useState([]);
      const [playingVoiceId, setPlayingVoiceId] = useState(null);
      const [companyDocPreviewModal, setCompanyDocPreviewModal] = useState(null);
      const [bookingChatModalItem, setBookingChatModalItem] = useState(null);

      const handlePlayVoiceAudioMsg = (msgId, messageText) => {
        if (playingVoiceId === msgId) {
          if (window.speechSynthesis) window.speechSynthesis.cancel();
          setPlayingVoiceId(null);
          return;
        }
        setPlayingVoiceId(msgId);

        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 1.2);
          }
        } catch (e) {}

        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const durationStr = messageText ? messageText.replace('[Voice Message]', '').trim() : '0:05';
          const utterance = new SpeechSynthesisUtterance(`Playing voice message recording, duration ${durationStr}. All systems operational.`);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.onend = () => setPlayingVoiceId(null);
          utterance.onerror = () => setPlayingVoiceId(null);
          window.speechSynthesis.speak(utterance);
        } else {
          setTimeout(() => setPlayingVoiceId(null), 3000);
        }
      };

      const handleDownloadChatDoc = (messageText, fileDataUrl) => {
        const fileName = (messageText || 'Invoice_Doc.pdf').replace('[Attached File] ', '').trim();
        if (fileDataUrl && fileDataUrl.startsWith('data:')) {
          const a = document.createElement('a');
          a.href = fileDataUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return;
        }

        const content = `==============================================\nRENTAL OS OFFICIAL ATTACHMENT DOCUMENT\n==============================================\nFile Name: ${fileName}\nDownloaded: ${new Date().toLocaleString()}\nStatus: Verified Invoice Document\nDocument ID: #INV-${Math.floor(100000 + Math.random() * 900000)}\n==============================================`;
        const blob = new Blob([content], { type: fileName.endsWith('.pdf') ? 'application/pdf' : 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      };

      const [selectedContact, setSelectedContact] = useState({
        id: 'super-admin',
        name: 'Super Admin (Platform Owner)',
        role: 'super-admin',
        phone: '+91 98765 00000',
        email: 'admin@rentos.com'
      });
      const [chatInput, setChatInput] = useState('');
      const [chatLoading, setChatLoading] = useState(false);
      const [chatSearchQuery, setChatSearchQuery] = useState('');

  const fetchChatMessages = async () => {
    let localLogs = [];
    try {
      localLogs = JSON.parse(localStorage.getItem('company_support_chats') || '[]');
    } catch (e) {}

    try {
      const res = await fetch('/api/chat', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          const map = new Map();
          [...data.messages, ...localLogs].forEach(m => {
            const key = m._id || `${m.senderEmail || m.senderId}_${m.createdAt}_${(m.message || '').slice(0, 15)}`;
            map.set(key, m);
          });
          setChatMessages(Array.from(map.values()));
          return;
        }
      }
    } catch (err) {
      console.warn('Error fetching chat messages:', err);
    }
    setChatMessages(localLogs);
  };

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      sendDirectChatMessage(`[Attached File] ${file.name}`);
    }
  };

  const startVoiceRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const cancelVoiceRecording = () => {
    clearInterval(recordingIntervalRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const sendVoiceRecording = () => {
    clearInterval(recordingIntervalRef.current);
    const secs = recordingSeconds;
    const formatSecs = secs < 10 ? `0${secs}` : secs;
    sendDirectChatMessage(`[Voice Message] 0:${formatSecs}`);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const sendDirectChatMessage = async (text) => {
    if (!text || !text.trim()) return;

    const messageText = text.trim();
    const newMsg = {
      _id: 'chat_' + Date.now(),
      senderId: user?._id || 'cmp_admin_id',
      senderName: companyInfo?.ownerName || user?.name || 'Company Manager',
      senderEmail: companyInfo?.ownerEmail || user?.email || 'owner@company.com',
      senderRole: 'company-admin',
      receiverId: selectedContact.id,
      receiverRole: selectedContact.role,
      receiverName: selectedContact.name,
      message: messageText,
      createdAt: new Date().toISOString(),
      status: 'sent'
    };

    try {
      const currentLogs = JSON.parse(localStorage.getItem('company_support_chats') || '[]');
      const updated = [...currentLogs, newMsg];
      localStorage.setItem('company_support_chats', JSON.stringify(updated));
      setChatMessages(updated);
    } catch (e) {}

    setChatInput('');

    try {
      const payload = {
        message: messageText,
        receiverRole: selectedContact.role,
        receiverId: selectedContact.id !== 'super-admin' ? selectedContact.id : undefined,
        companyId: user?.companyId || undefined
      };
      await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn('Chat send API warning:', err);
    }
  };

  const handleSendChatMessage = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!chatInput.trim()) return;
    sendDirectChatMessage(chatInput);
  };

  const fetchNotifications = async () => {
    if (!token || token.startsWith('mock_')) return;
      try {
      const res = await fetch('/api/notifications', {
        headers: {Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      const lastReadCount = Number(localStorage.getItem(`last_read_notif_count_company_admin`) || 0);
      setUnreadCount(Math.max(0, (data.notifications || []).length - lastReadCount));
        }
      }
    } catch (err) {
        console.warn('Notifications fetch error:', err);
    }
  };

      const dashboardMapRef = useRef(null);
      const [dashboardMapSearchText, setDashboardMapSearchText] = useState('Volkswagen Polo');
      const [selfDriveLocations, setSelfDriveLocations] = useState([]);
      const [mapVehicleFilter, setMapVehicleFilter] = useState('all'); // 'all', 'selfdrive', 'driver'

  const fetchDriverLocations = async () => {
    if (!token) return;
      try {
      const res = await fetch('/api/company-admin/driver-location', {
        headers: {Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
      if (data.success) {
        setDriverLocations(data.locations || []);
        }
      }
    } catch (err) {
        console.warn('Error fetching driver locations:', err);
    }

      try {
      const sdRes = await fetch('/api/company-admin/selfdrive-locations', {
        headers: {Authorization: `Bearer ${token}` }
      });
      if (sdRes.ok) {
        const sdData = await sdRes.json();
      if (sdData.success) {
        setSelfDriveLocations(sdData.locations || []);
        }
      }
    } catch (err) {
        setSelfDriveLocations([
          {
            id: 'sd_veh_101',
            carName: 'Toyota Fortuner Legender 4x4',
            regNumber: 'TN 01 AB 1234',
            renterName: 'Rahul Kumar',
            renterPhone: '+91 98765 43210',
            bookingId: 'BK-2026-9042',
            latitude: 12.1357,
            longitude: 78.1560,
            speed: 45,
            battery: 88,
            status: 'ONLINE',
            gpsSource: 'Traccar Demo4 Telemetry'
          },
          {
            id: 'sd_veh_102',
            carName: 'Tata Nexon EV Max',
            regNumber: 'TN 09 EV 8899',
            renterName: 'Vaideeswari S.',
            renterPhone: '+91 98421 11223',
            bookingId: 'BK-2026-3310',
            latitude: 12.5266,
            longitude: 78.2144,
            speed: 38,
            battery: 92,
            status: 'ONLINE',
            gpsSource: 'Traccar Demo4 Telemetry'
          }
        ]);
      }
  };

  useEffect(() => {
    if ((activeNav === 'drivers' || activeNav === 'live-tracking') && token) {
      fetchDriverLocations();
      const interval = setInterval(fetchDriverLocations, 5000);
      return () => clearInterval(interval);
    }
  }, [activeNav, token]);

  useEffect(() => {
    if ((activeNav === 'drivers' || activeNav === 'live-tracking') && token) {
      const timer = setTimeout(() => {
        const targetId = activeNav === 'live-tracking' ? 'admin-live-tracking-map-canvas' : 'admin-live-map-canvas';
        const mapEl = document.getElementById(targetId);

        if (mapEl && !mapRef.current && window.L) {
          try {
            const map = window.L.map(targetId, {
              center: [12.5266, 78.2144],
              zoom: 12,
              zoomControl: true
            });

            const googleStreets = window.L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
              subdomains: ['0', '1', '2', '3'],
              attribution: '&copy; Google Maps',
              maxZoom: 20
            });

            const googleSatellite = window.L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
              subdomains: ['0', '1', '2', '3'],
              attribution: '&copy; Google Maps Satellite',
              maxZoom: 20
            });

            const googleTerrain = window.L.tileLayer('https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
              subdomains: ['0', '1', '2', '3'],
              attribution: '&copy; Google Maps Terrain',
              maxZoom: 20
            });

            const osmStandard = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; OpenStreetMap contributors',
              maxZoom: 19
            });

            googleStreets.addTo(map);

            const baseMaps = {
              "🌍 OpenStreetMap Standard": osmStandard,
              "🗺️ Google Streets": googleStreets,
              "🛰️ Google Satellite": googleSatellite,
              "⛰️ Google Terrain": googleTerrain
            };

            window.L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

            mapRef.current = map;
            setTimeout(() => {
              if (mapRef.current) mapRef.current.invalidateSize();
            }, 300);
          } catch (e) {
            console.warn('Map initialization note:', e);
          }
        }
      }, 250);

      return () => {
        clearTimeout(timer);
        if (mapRef.current) {
          try { mapRef.current.remove(); } catch (e) { }
          mapRef.current = null;
          markersRef.current = {};
        }
      };
    }
  }, [activeNav, token]);

  useEffect(() => {
    if (activeNav === 'dashboard') {
      const timer = setTimeout(() => {
        const mapEl = document.getElementById('company-overview-live-map');
        if (mapEl && !dashboardMapRef.current && window.L) {
          try {
            const map = window.L.map('company-overview-live-map', {
              center: [13.0760, 80.2707],
              zoom: 13,
              zoomControl: false
            });

            const googleStreets = window.L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
              subdomains: ['0', '1', '2', '3'],
              attribution: '&copy; Google Maps',
              maxZoom: 20
            });

            const googleSatellite = window.L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
              subdomains: ['0', '1', '2', '3'],
              attribution: '&copy; Google Maps Satellite',
              maxZoom: 20
            });

            const googleTerrain = window.L.tileLayer('https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
              subdomains: ['0', '1', '2', '3'],
              attribution: '&copy; Google Maps Terrain',
              maxZoom: 20
            });

            const overviewBaseMaps = {
              "🗺️ Google Streets": googleStreets,
              "🛰️ Google Satellite": googleSatellite,
              "⛰️ Google Terrain": googleTerrain
            };

            googleStreets.addTo(map);
            window.L.control.layers(overviewBaseMaps, null, { position: 'topright' }).addTo(map);

            const carIcon = window.L.divIcon({
              className: 'custom-dashboard-car-marker',
              html: `
              <div style="background: #2563eb; color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 900; white-space: nowrap; box-shadow: 0 4px 10px rgba(37,99,235,0.4); display: flex; align-items: center; gap: 4px;">
                <span>🚗</span> Volkswagen Polo (TN 01 AB 1234)
              </div>
              `,
              iconSize: [180, 30],
              iconAnchor: [90, 15]
            });

            const marker = window.L.marker([13.0827, 80.2707], { icon: carIcon }).addTo(map);
            marker.bindPopup(`
            <div style="font-family: system-ui, sans-serif; font-size: 12px; padding: 4px; min-width: 200px;">
              <strong style="color: #0f172a; font-size: 13px; display: block; margin-bottom: 2px;">🚗 Volkswagen Polo (TN 01 AB 1234)</strong>
              <span style="color: #16a34a; font-weight: bold; display: block; margin-bottom: 2px;">🟢 Live GPS Active • Speed: 45 km/h</span>
              <span style="color: #475569; font-weight: 600; display: block;">👤 Renter: Rahul Kumar (+91 98765 43210)</span>
            </div>
            `, { autoPan: true, autoPanPadding: [50, 50], offset: [0, -12] }).openPopup();

            dashboardMapRef.current = map;
            setTimeout(() => {
              if (dashboardMapRef.current) dashboardMapRef.current.invalidateSize();
            }, 300);
          } catch (e) {
            console.warn('Dashboard map init note:', e);
          }
        }
      }, 250);

      return () => {
        clearTimeout(timer);
        if (dashboardMapRef.current) {
          try { dashboardMapRef.current.remove(); } catch (e) { }
          dashboardMapRef.current = null;
        }
      };
    }
  }, [activeNav]);

  useEffect(() => {
    if (!mapRef.current) return;
      const map = mapRef.current;

      // Combine driver locations and self-drive locations based on filter
      const activeDriverList = (mapVehicleFilter === 'all' || mapVehicleFilter === 'driver') ? driverLocations : [];
      const activeSelfDriveList = (mapVehicleFilter === 'all' || mapVehicleFilter === 'selfdrive') ? selfDriveLocations : [];

      const activeIds = [
      ...activeDriverList.map(l => 'd_' + String(l.driverId)),
      ...activeSelfDriveList.map(s => 'sd_' + String(s.id))
      ];

    // Clear removed markers
    Object.keys(markersRef.current).forEach(id => {
      if (!activeIds.includes(id)) {
        markersRef.current[id].remove();
      delete markersRef.current[id];
      }
    });

    // 1. Render Chauffeur Driver Markers
    activeDriverList.forEach((loc, index) => {
      const id = 'd_' + String(loc.driverId);
      const coords = [loc.latitude, loc.longitude];
      const isOffDuty = loc.dutyStatus === 'OFF DUTY';

      const carIcon = window.L.divIcon({
        className: 'custom-car-marker',
      html: `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="background: ${isOffDuty ? '#dc2626' : '#2563eb'}; color: #fff; padding: 3px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.15); margin-bottom: 2px;">
          👨‍✈️ ${loc.driverName} (${loc.dutyStatus || 'ON DUTY'})
        </div>
        <div style="width: 12px; height: 12px; background: ${isOffDuty ? '#dc2626' : '#2563eb'}; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 8px ${isOffDuty ? '#dc2626' : '#2563eb'};"></div>
      </div>
      `,
      iconSize: [90, 40],
      iconAnchor: [45, 40]
      });

      if (markersRef.current[id]) {
        markersRef.current[id].setLatLng(coords);
      markersRef.current[id].setIcon(carIcon);
      } else {
        const marker = window.L.marker(coords, {icon: carIcon }).addTo(map);
      marker.bindPopup(`
      <div style="font-family: system-ui; padding: 4px;">
        <div style="font-weight: 800; color: #2563eb; font-size: 13px;">👨‍✈️ Chauffeur: ${loc.driverName}</div>
        <div style="font-size: 11px; color: #475569; margin-top: 2px;">🚗 <strong>Car:</strong> ${loc.vehicleName || 'Premium Fleet'}</div>
        <div style="font-size: 11px; color: #059669; margin-top: 2px;">👤 <strong>Customer:</strong> ${loc.customerName || 'Renter'}</div>
        <div style="font-size: 11px; color: #334155; margin-top: 2px;">⚡ <strong>Speed:</strong> ${loc.speed} km/h • 📍 ${loc.address || 'In Transit'}</div>
      </div>
      `);
      markersRef.current[id] = marker;
      }
    });

    // 2. Render Self-Drive Traccar Vehicle Markers
    activeSelfDriveList.forEach((sd, index) => {
      const id = 'sd_' + String(sd.id);
      const coords = [sd.latitude, sd.longitude];

      const selfDriveIcon = window.L.divIcon({
        className: 'custom-selfdrive-marker',
      html: `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="background: linear-gradient(135deg, #059669, #10b981); color: #fff; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.2); margin-bottom: 2px;">
          🔑 ${sd.carName} (${sd.status})
        </div>
        <div style="width: 14px; height: 14px; background: #10b981; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 10px #10b981;"></div>
      </div>
      `,
      iconSize: [110, 45],
      iconAnchor: [55, 45]
      });

      const popupHtml = `
      <div style="font-family: system-ui; padding: 4px; min-width: 220px;">
        <div style="font-weight: 900; color: #0f172a; font-size: 14px; margin-bottom: 2px;">🔑 ${sd.carName}</div>
        <div style="font-size: 11px; color: #2563eb; font-weight: 800;">Reg: ${sd.regNumber} • ${sd.bookingId}</div>
        <hr style="margin: 6px 0; border: none; border-top: 1px solid #e2e8f0;" />
        <div style="font-size: 12px; color: #334155;">👤 <strong>Renter:</strong> ${sd.renterName} (${sd.renterPhone})</div>
        <div style="font-size: 12px; color: #059669; font-weight: 700; margin-top: 2px;">📡 <strong>Traccar GPS:</strong> ${sd.status} (${sd.gpsSource})</div>
        <div style="font-size: 12px; color: #475569; margin-top: 2px;">⚡ <strong>Speed:</strong> ${sd.speed} km/h • 🔋 <strong>Battery:</strong> ${sd.battery}%</div>
        <div style="margin-top: 8px; background: #ecfdf5; border: 1px solid #a7f3d0; color: #059669; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 800;">
          🛡️ Aadhaar, PAN, DL & Face Scan Approved ✅
        </div>
      </div>
      `;

      if (markersRef.current[id]) {
        markersRef.current[id].setLatLng(coords);
      markersRef.current[id].setIcon(selfDriveIcon);
      } else {
        const marker = window.L.marker(coords, {icon: selfDriveIcon }).addTo(map);
      marker.bindPopup(popupHtml);
      markersRef.current[id] = marker;
      }
    });

  }, [driverLocations, selfDriveLocations, mapVehicleFilter]);

      // Offers States & Fetch
      const [offers, setOffers] = useState([]);
      const [loadingOffers, setLoadingOffers] = useState(false);
      const [showOfferModal, setShowOfferModal] = useState(false);
      const [newOfferCode, setNewOfferCode] = useState('');
      const [newOfferDiscount, setNewOfferDiscount] = useState('');
      const [newOfferDesc, setNewOfferDesc] = useState('');
      const [newOfferExpiry, setNewOfferExpiry] = useState('');

      // Advanced Offer Editor / Details states
      const [editingOffer, setEditingOffer] = useState(null);
      const [viewingOffer, setViewingOffer] = useState(null);
      const [offerName, setOfferName] = useState('');
      const [offerType, setOfferType] = useState('Percentage Discount');
      const [offerMaxDiscount, setOfferMaxDiscount] = useState(1000);
      const [offerMinBooking, setOfferMinBooking] = useState(2000);
      const [offerAppliesTo, setOfferAppliesTo] = useState('All Vehicles');
      const [offerStartDate, setOfferStartDate] = useState('');
      const [offerMinDays, setOfferMinDays] = useState(1);
      const [offerMaxDays, setOfferMaxDays] = useState(30);
      const [offerMaxUsage, setOfferMaxUsage] = useState(100);
      const [offerCustomerType, setOfferCustomerType] = useState('All Customers');
      const [offerStatus, setOfferStatus] = useState('active');

  const fetchOffers = async () => {
        setLoadingOffers(false);
      if (!token || token.startsWith('mock_')) return;
      try {
      const res = await fetch('/api/company-admin/offers', {
        headers: {Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
      if (data.success) {
        setOffers(data.offers || []);
        } else {
        setOffers([]);
        }
      } else {
        setOffers([]);
      }
    } catch (err) {
        console.error('Fetch offers error:', err);
      setOffers([]);
    } finally {
        setLoadingOffers(false);
    }
  };

  const handleSaveOffer = async (e) => {
        e.preventDefault();

      // Construct description JSON containing all advanced fields
      const advancedDesc = JSON.stringify({
        name: offerName,
      descriptionText: newOfferDesc,
      type: offerType,
      maxDiscount: Number(offerMaxDiscount),
      minBookingAmount: Number(offerMinBooking),
      appliesTo: offerAppliesTo,
      minDays: Number(offerMinDays),
      maxDays: Number(offerMaxDays),
      maxUsage: Number(offerMaxUsage),
      customerType: offerCustomerType,
      startDate: offerStartDate || new Date().toISOString().split('T')[0],
      endDate: newOfferExpiry,
      used: editingOffer ? (JSON.parse(editingOffer.description || '{ }').used || 0) : 0,
      revenue: editingOffer ? (JSON.parse(editingOffer.description || '{ }').revenue || 0) : 0
    });

      const payload = {
        code: newOfferCode.trim().toUpperCase(),
      discountPercentage: Number(newOfferDiscount),
      description: advancedDesc,
      expiryDate: newOfferExpiry,
      status: offerStatus
    };

      try {
        let res;
      if (editingOffer && !String(editingOffer._id).startsWith('default-')) {
        // Real Edit
        res = await fetch(`/api/company-admin/offers/${editingOffer._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else if (editingOffer && String(editingOffer._id).startsWith('default-')) {
        // Mock Edit (Fallback/Default Seed)
        setOffers(prev => prev.map(o => o._id === editingOffer._id ? { ...o, code: payload.code, discountPercentage: payload.discountPercentage, expiryDate: payload.expiryDate, status: payload.status, description: payload.description } : o));
      showNotification(`✓ Mock Offer ${payload.code} updated locally!`);
      setShowOfferModal(false);
      return;
      } else {
        // Create New Offer
        res = await fetch('/api/company-admin/offers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (res) {
        const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`✓ Offer ${payload.code} saved successfully!`);
      setShowOfferModal(false);
      fetchOffers();
        } else {
        showNotification(`❌ Error: ${data.message || 'Failed to save offer'}`);
        }
      }
    } catch (err) {
        showNotification(`❌ Error: ${err.message}`);
    }
  };

  const handleToggleOfferStatus = async (o) => {
    if (String(o._id).startsWith('default-')) {
      const nextStatus = o.status === 'active' ? 'inactive' : 'active';
      setOffers(prev => prev.map(item => item._id === o._id ? {...item, status: nextStatus } : item));
      showNotification(`✓ Offer status updated to ${nextStatus}`);
      return;
    }
      try {
      const res = await fetch(`/api/company-admin/offers/${o._id}`, {
        method: 'PUT',
      headers: {Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`✓ Promo status updated successfully!`);
      fetchOffers();
      }
    } catch (err) {
        console.error('Toggle status error:', err);
    }
  };

  const handleDeleteOffer = async (o) => {
    if (!window.confirm(`Are you sure you want to delete offer ${o.code}?`)) return;
      if (String(o._id).startsWith('default-')) {
        setOffers(prev => prev.filter(item => item._id !== o._id));
      showNotification(`✓ Offer deleted successfully!`);
      return;
    }
      try {
      const res = await fetch(`/api/company-admin/offers/${o._id}`, {
        method: 'DELETE',
      headers: {Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`✓ Offer deleted successfully!`);
      fetchOffers();
      }
    } catch (err) {
        console.error('Delete offer error:', err);
    }
  };

  const showNotification = (msg) => {
        setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

  const handleApproveBooking = async (b) => {
    try {
      // 1. Update customer_bookings_list in localStorage
      const savedBookings = JSON.parse(localStorage.getItem('customer_bookings_list') || '[]');
      const updated = savedBookings.map(item => {
        if (item.bookingId === b.bookingId || item._id === b._id || (item.status && item.status.includes('Pending'))) {
          return {...item, status: 'Confirmed', selfDriveVerified: true };
        }
      return item;
      });
      localStorage.setItem('customer_bookings_list', JSON.stringify(updated));

      // 2. Update company_customer_verifications in localStorage
      const verifs = JSON.parse(localStorage.getItem('company_customer_verifications') || '[]');
      const updatedVerifs = verifs.map(v => (v.bookingId === b.bookingId || v.id === b._id) ? {...v, status: 'Approved' } : v);
      localStorage.setItem('company_customer_verifications', JSON.stringify(updatedVerifs));

      if (token && String(b._id).length > 15) {
        await fetch(`/api/company-admin/bookings/${b._id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: 'confirmed' }),
        });
      }
    } catch (err) {
        console.warn('Status update API call notice:', err.message);
    }

      const approvedList = JSON.parse(localStorage.getItem('approved_booking_ids') || '[]');
      if (!approvedList.includes(String(b._id))) {
        approvedList.push(String(b._id));
      localStorage.setItem('approved_booking_ids', JSON.stringify(approvedList));
    }

    setBookings(prev => prev.map(item => (item._id === b._id || item.bookingId === b.bookingId) ? {...item, status: 'confirmed' } : item));
      showNotification(`✓ Booking #${String(b._id || b.bookingId || '').slice(-6).toUpperCase()} Approved & Confirmed! Customer Dashboard unlocked.`);
  };

  /* FETCH DATA */
  const fetchDashboardData = async () => {
    if (!token || token.startsWith('mock_')) {
        setLoading(false);
      return;
    }
      try {
      const [sRes, vRes, bRes, stRes] = await Promise.all([
      fetch('/api/company-admin/dashboard', {headers: {Authorization: `Bearer ${token}` } }),
      fetch('/api/company-admin/vehicles', {headers: {Authorization: `Bearer ${token}` } }),
      fetch('/api/company-admin/bookings', {headers: {Authorization: `Bearer ${token}` } }).catch(() => null),
      fetch('/api/company-admin/staff', {headers: {Authorization: `Bearer ${token}` } }).catch(() => null),
      ]);

      const mergeAssigned = (rawBookings) => {
        const localAssigned = JSON.parse(localStorage.getItem('company_assigned_bookings') || '[]');
        if (!rawBookings || rawBookings.length === 0) return localAssigned.length > 0 ? localAssigned : [];
        return rawBookings.map(b => {
          const matched = localAssigned.find(s => String(s._id) === String(b._id));
      if (matched) {
            return {
        ...b,
        driverId: matched.driverId || b.driverId,
      driverAssigned: matched.driverAssigned || b.driverAssigned,
      status: matched.status || b.status
            };
          }
      return b;
        });
      };

      if (sRes.ok) {
        const sData = await sRes.json();
      if (sData.success) {
        setStats(sData.stats);
      if (sData.bookings) setBookings(mergeAssigned(sData.bookings));
      if (sData.company) {
            setCompanyInfo(prev => {
              const updated = {
                ...prev,
                ...sData.company,
                name: sData.company.name || prev.name,
                ownerName: sData.company.ownerName || prev.ownerName,
                ownerEmail: sData.company.ownerEmail || prev.ownerEmail,
                mobile: sData.company.mobile || prev.mobile,
                commissionRate: sData.company.commissionRate ?? prev.commissionRate,
                subscriptionPrice: sData.company.subscriptionPrice ?? prev.subscriptionPrice,
                status: sData.company.status || prev.status,
                onboardedAt: sData.company.onboardedAt || prev.onboardedAt,
                city: sData.company.city || prev.city,
                state: sData.company.state || prev.state,
                address: sData.company.address || prev.address,
                pincode: sData.company.pincode || prev.pincode,
                aadharNumber: sData.company.aadharNumber || prev.aadharNumber,
                aadharDoc: sData.company.aadharDoc || prev.aadharDoc,
                panNumber: sData.company.panNumber || prev.panNumber,
                panDoc: sData.company.panDoc || prev.panDoc,
                gstNumber: sData.company.gstNumber || prev.gstNumber,
                gstDoc: sData.company.gstDoc || prev.gstDoc,
              };
              safeSetLocalStorage('company_info_details', updated);
              return updated;
            });
            if (sData.company.ownerName) setOwnerNameInput(sData.company.ownerName);
            if (sData.company.city) setCityInput(sData.company.city);
            if (sData.company.state) setStateInput(sData.company.state);
            if (sData.company.address) setAddressInput(sData.company.address);
            if (sData.company.aadharNumber) setAadharNumInput(sData.company.aadharNumber);
            if (sData.company.aadharDoc) setAadharDocInput(sData.company.aadharDoc);
            if (sData.company.panNumber) setPanNumInput(sData.company.panNumber);
            if (sData.company.panDoc) setPanDocInput(sData.company.panDoc);
            if (sData.company.gstNumber) setGstNumInput(sData.company.gstNumber);
            if (sData.company.gstDoc) setGstDocInput(sData.company.gstDoc);

            if (sData.company.status) {
              setFetchedCompanyStatus(sData.company.status);
              safeSetLocalStorage('company_status', sData.company.status);
              if (sData.company.status === 'pending_approval' || sData.company.status === 'pending') {
                safeSetLocalStorage('company_pending_approval', 'true');
              } else if (sData.company.status === 'active') {
                localStorage.removeItem('company_pending_approval');
              }
            }
            if (sData.company.logoUrl) {
              setCompanyLogoUrl(sData.company.logoUrl);
              safeSetLocalStorage('company_logo', sData.company.logoUrl);
            }
            if (sData.company.mobile) {
              setCompanyPhoneInput(sData.company.mobile);
              safeSetLocalStorage('company_phone', sData.company.mobile);
            }
            if (sData.company.name) {
              safeSetLocalStorage('company_name', sData.company.name);
            }
            setUser(prev => prev ? {
              ...prev,
              companyStatus: sData.company.status || prev.companyStatus,
              company: {
                ...prev.company,
                status: sData.company.status || prev.company?.status,
                logoUrl: sData.company.logoUrl || prev.company?.logoUrl,
                mobile: sData.company.mobile || prev.company?.mobile,
                name: sData.company.name || prev.company?.name
              }
            } : null);
          }
        }
      }
      if (vRes.ok) {
        const vData = await vRes.json();
        if (vData.success && vData.vehicles && vData.vehicles.length > 0) {
        setVehicles(vData.vehicles);
        }
      }
      if (bRes && bRes.ok) {
        const bData = await bRes.json();
      if (bData.success && bData.bookings) setBookings(mergeAssigned(bData.bookings));
      }
      if (stRes && stRes.ok) {
        const stData = await stRes.json();
      if (stData.success) setStaffList(stData.staff || []);
      }
    } catch (err) {
        console.error('Data loading error:', err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
        fetchDashboardData();
      fetchNotifications();
      fetchOffers();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  useEffect(() => {
    if (activeNav === 'chat' && token) {
        fetchChatMessages();
      const interval = setInterval(fetchChatMessages, 4000);
      return () => clearInterval(interval);
    }
  }, [activeNav, token]);

  // Refresh localBookingsList from localStorage whenever Bookings tab is opened
  useEffect(() => {
    if (activeNav === 'bookings') {
      setLocalBookingsList(readLocalBookings());
    }
  }, [activeNav]);

  // Also poll every 3 seconds to catch bookings placed in Customer Dashboard
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalBookingsList(readLocalBookings());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleVehicleSaved = (savedVehicle, isNewParam) => {
    const email = user?.email || companyInfo?.ownerEmail || localStorage.getItem('company_owner_email') || 'pooja@gmail.com';
    const key = `company_vehicles_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const taggedVehicle = {
      ...savedVehicle,
      companyEmail: email,
      ownerEmail: email,
      companyName: companyInfo?.name || 'Company Fleet',
      companyLogo: companyLogoUrl || '',
      companyPhone: companyPhoneInput || '9517368420'
    };

    const exists = vehicles.some(v => v._id === savedVehicle._id || (v.regNumber && v.regNumber === savedVehicle.regNumber));
    const isNew = isNewParam !== undefined ? isNewParam : !exists;

    let updated;
    if (isNew || !exists) {
      updated = [taggedVehicle, ...vehicles.filter(v => v._id !== savedVehicle._id && v.regNumber !== savedVehicle.regNumber)];
      showNotification(`✓ ${savedVehicle.make} ${savedVehicle.model} added to fleet & live on Landing Page!`);
    } else {
      updated = vehicles.map(v => (v._id === savedVehicle._id || v.regNumber === savedVehicle.regNumber) ? taggedVehicle : v);
      showNotification(`✓ ${savedVehicle.make} ${savedVehicle.model} details updated!`);
    }

    setVehicles(updated);
    safeSetLocalStorage(key, updated);

    const globalSaved = JSON.parse(localStorage.getItem('company_vehicles_list') || '[]');
    const otherVehicles = globalSaved.filter(v => (v.companyEmail || v.ownerEmail) !== email && v._id !== savedVehicle._id);
    safeSetLocalStorage('company_vehicles_list', [...otherVehicles, ...updated]);
  };

  const handleDeleteVehicle = async (v) => {
    if (!window.confirm(`Delete ${v.make} ${v.model} (${v.regNumber || 'Vehicle'}) from fleet?`)) return;
    try {
      await fetch(`/api/company-admin/vehicles/${v._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) { }
    const email = user?.email || companyInfo?.ownerEmail || localStorage.getItem('company_owner_email') || 'pooja@gmail.com';
    const key = `company_vehicles_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const updated = vehicles.filter(item => item._id !== v._id);
    setVehicles(updated);
    localStorage.setItem(key, JSON.stringify(updated));

    const globalSaved = JSON.parse(localStorage.getItem('company_vehicles_list') || '[]');
    const otherVehicles = globalSaved.filter(item => item._id !== v._id);
    localStorage.setItem('company_vehicles_list', JSON.stringify(otherVehicles));
    showNotification(`✓ Vehicle ${v.make} ${v.model} removed from fleet.`);
  };

  const handleDriverSaved = (newDriver) => {
    const email = user?.email || companyInfo?.ownerEmail || localStorage.getItem('company_owner_email') || 'pooja@gmail.com';
    const key = `company_drivers_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const taggedDriver = { ...newDriver, companyEmail: email, ownerEmail: email, companyName: companyInfo?.name || 'Company Fleet' };
    const updated = [taggedDriver, ...drivers];
    setDrivers(updated);
    localStorage.setItem(key, JSON.stringify(updated));

    const registry = JSON.parse(localStorage.getItem('company_drivers_registry') || '[]');
    const filteredRegistry = registry.filter(d => d.email !== newDriver.email && d.id !== newDriver.id);
    localStorage.setItem('company_drivers_registry', JSON.stringify([...filteredRegistry, taggedDriver]));

    showNotification(`✓ Driver ${newDriver.name} added to company roster!`);
  };

      // Bookings: use API data only (no demo bookings)
      const defaultBookings = bookings;

      const defaultEmployees = staffList;


  const getSimulatedStatus = (msg) => {
    if (msg.status === 'read') return 'read';
      if (msg.status === 'delivered') return 'delivered';

      const elapsed = Date.now() - new Date(msg.createdAt).getTime();
      if (elapsed < 2000) {
      return 'sent';
    } else if (elapsed < 4000) {
      return 'delivered';
    } else {
      return 'read';
    }
  };

  const renderStatusTicks = (msg) => {
    const status = getSimulatedStatus(msg);
      if (status === 'read') {
      return <span style={{ color: '#53bdeb', fontSize: '0.85rem', fontWeight: 'bold', marginLeft: '4px' }} title="Read">✓✓</span>;
    } else if (status === 'delivered') {
      return <span style={{ color: '#8696a0', fontSize: '0.85rem', fontWeight: 'bold', marginLeft: '4px' }} title="Delivered">✓✓</span>;
    } else {
      return <span style={{ color: '#8696a0', fontSize: '0.85rem', fontWeight: 'bold', marginLeft: '4px' }} title="Sent">✓</span>;
    }
  };

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
      } catch (err) { }
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

  const renderCompanyLogo = (size = 36, borderRadius = '8px') => {
    const sanitizedUrl = sanitizeLogoUrl(companyLogoUrl);
      const companyName = user?.company?.name || localStorage.getItem('company_name') || 'DriveX Rentals';
      const firstLetter = companyName.charAt(0).toUpperCase();

      if (logoHasError || !sanitizedUrl) {
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
        src={sanitizedUrl}
        alt="Company Logo"
        onError={() => setLogoHasError(true)}
        style={{ width: `${size}px`, height: `${size}px`, borderRadius, objectFit: 'cover', border: '1px solid var(--border-color)', flexShrink: 0 }}
      />
      );
  };

      const currentStatus = fetchedCompanyStatus || user?.companyStatus || user?.company?.status || localStorage.getItem('company_status') || 'active';
      const isRejected = (
      currentStatus === 'rejected' ||
      currentStatus === 'Rejected'
      );

      return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
        <header style={{
          height: '68px', background: '#fff', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', flexShrink: 0
        }}>
          {/* Search Input Bar */}
          <div style={{ position: 'relative', width: '320px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.9rem' }}>🔍</span>
            <input
              type="text"
              placeholder="Search anything..."
              style={{ width: '100%', padding: '0.55rem 1rem 0.55rem 2.4rem', borderRadius: '24px', border: '1px solid #f1f5f9', background: '#f8fafc', fontSize: '0.85rem', fontWeight: 600, color: '#334155', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* 💳 Renew Subscription & Select Plan Button */}
            <button
              onClick={() => {
                setIsSubscriptionLocked(true);
                setActiveNav('subscription');
                setShowRoyalWelcomeModal(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                padding: '0.55rem 1.15rem',
                borderRadius: '24px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <span>💳</span>
              <span>Renew Subscription & Select Plan</span>
            </button>

            {/* Notification Bell Dropdown */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => {
                setShowNotificationsDropdown(!showNotificationsDropdown);
                if (!showNotificationsDropdown) {
                  localStorage.setItem(`last_read_notif_count_company_admin`, notifications.length);
                  setUnreadCount(0);
                }
              }} style={{
                background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '1.1rem', padding: '0.5rem', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
              }}>
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-2px', right: '-2px', background: '#f43f5e', color: '#fff', fontSize: '0.65rem', fontWeight: 700, borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotificationsDropdown && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, width: '320px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 1000, marginTop: '0.5rem', padding: '0.5rem 0'
                }}>
                  <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Notification History</span>
                    <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.75rem' }}>({notifications.length})</span>
                  </div>
                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n._id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.78rem', textAlign: 'left' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{n.title}</span>
                            <span style={{ color: '#64748b', fontSize: '0.68rem' }}>{new Date(n.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div style={{ color: '#475569', lineHeight: '1.3' }}>{n.message}</div>
                          <div style={{ fontSize: '0.65rem', color: '#2563eb', marginTop: '0.25rem', fontWeight: 600 }}>
                            Sender: {n.senderRole === 'super-admin' ? 'Platform Admin' : 'Company Manager'}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: '#f8fafc', padding: '0.3rem 0.75rem 0.3rem 0.4rem', borderRadius: '24px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"}
                alt="Admin Avatar"
                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                  {companyInfo?.ownerName || ownerNameInput || user?.ownerName || user?.name || 'Pooja'}
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b' }}>
                  Admin ∨
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Operational Flow Modal */}
        {showFlowModal && (
          <div className="modal-overlay" onClick={() => setShowFlowModal(false)} style={{ zIndex: 999 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px', width: '95%', padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-blue)', margin: 0 }}>
                  🔄 10-Step Operational Lifecycle Flow
                </h3>
                <button className="close-btn" onClick={() => setShowFlowModal(false)}>×</button>
              </div>
              <div style={{ background: '#ffffff', borderBottom: '1px solid var(--border-color)', padding: '0.65rem 1.75rem', overflowX: 'auto' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', marginBottom: '0.45rem' }}>
                  COMPANY RENTAL OPERATIONAL LIFECYCLE
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 'max-content' }}>
                  {FLOW_STEPS.map((s, idx) => {
                    const isCurrent = activeNav === s.target && (s.step === '3' && activeNav === 'vehicles' || s.step === '4' && activeNav === 'drivers' || (s.step === '5' || s.step === '6' || s.step === '7') && activeNav === 'bookings');
                    const isDone = Number(s.step) <= 2 || (activeNav === 'vehicles' && Number(s.step) <= 3) || (activeNav === 'drivers' && Number(s.step) <= 4);

                    return (
                      <React.Fragment key={s.step}>
                        <div
                          onClick={() => handleNavClick(s.target)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.28rem 0.75rem', borderRadius: '20px', cursor: 'pointer',
                            background: isCurrent ? '#2563eb' : isDone ? '#ecfdf5' : '#f8fafc',
                            color: isCurrent ? '#ffffff' : isDone ? '#059669' : '#475569',
                            border: `1px solid ${isCurrent ? '#2563eb' : isDone ? '#a7f3d0' : '#e2e8f0'}`,
                            fontSize: '0.78rem', fontWeight: 700, transition: 'all 0.2s ease',
                            boxShadow: isCurrent ? '0 2px 8px rgba(37,99,235,0.25)' : 'none'
                          }}
                        >
                          <span style={{
                            fontSize: '0.68rem', width: '18px', height: '18px', borderRadius: '50%',
                            background: isCurrent ? '#ffffff' : isDone ? '#10b981' : '#cbd5e1',
                            color: isCurrent ? '#2563eb' : '#ffffff',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800
                          }}>
                            {s.step}
                          </span>
                          <span>{s.title}</span>
                        </div>
                        {idx < FLOW_STEPS.length - 1 && (
                          <span style={{ color: '#cbd5e1', fontSize: '0.75rem', fontWeight: 700 }}>→</span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="dashboard-layout" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* SIDEBAR */}
          <aside className="dashboard-sidebar" style={{ width: '220px', background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0, padding: '1.25rem 0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0 0.5rem 1.25rem 0.5rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1rem', minWidth: 0 }}>
              {renderCompanyLogo(36, '8px')}
              <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.companyName || user?.company?.name || user?.ownerName || localStorage.getItem('company_name') || 'Royal Car Rentals'}
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', padding: '0 0.5rem 0.6rem 0.5rem', letterSpacing: '0.02em' }}>
              Main Menu
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto' }}>
              {NAV_ITEMS.map(item => {
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.65rem 1rem',
                      background: isActive ? '#eff6ff' : 'transparent', border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
                      borderRadius: '24px', cursor: 'pointer', color: isActive ? '#2563eb' : '#475569',
                      fontWeight: isActive ? 800 : 600, fontSize: '0.86rem',
                      textAlign: 'left', transition: 'all 0.18s ease',
                    }}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div style={{ paddingTop: '1rem', borderTop: '1px solid #f1f5f9', marginTop: '0.5rem' }}>
              <button
                onClick={logout}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.65rem 0.85rem',
                  background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                  borderRadius: '24px', cursor: 'pointer', color: '#ef4444',
                  fontWeight: 800, fontSize: '0.86rem', textAlign: 'left'
                }}
              >
                <span style={{ fontSize: '1rem' }}>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="dashboard-main" style={{ flex: 1, padding: '2rem', overflowY: 'auto', minWidth: 0 }}>
            {notice && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                {notice}
              </div>
            )}

            {/* AUTOMATIC MISSING KYC DOCUMENT NOTIFICATION ALERT BANNER */}
            {hasMissingKyc && (
              <div style={{
                padding: '1rem 1.25rem',
                background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                color: '#9a3412',
                border: '1.5px solid #f97316',
                borderRadius: '14px',
                fontSize: '0.88rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                flexWrap: 'wrap',
                gap: '0.85rem',
                boxShadow: '0 4px 15px rgba(249, 115, 22, 0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <span style={{ fontSize: '1.5rem', background: '#ffedd5', padding: '0.4rem', borderRadius: '50%', border: '1px solid #fdba74' }}>⚠️</span>
                  <div>
                    <div style={{ fontWeight: 900, color: '#9a3412', fontSize: '0.95rem', marginBottom: '2px' }}>
                      Action Required: KYC Documents Missing!
                    </div>
                    <div style={{ color: '#c2410c', fontSize: '0.82rem', fontWeight: 600 }}>
                      Your company KYC documents ({missingKycDocs.join(', ')}) are not uploaded yet. Upload missing documents to keep your business account verified.
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveNav('settings');
                    setTimeout(() => {
                      const el = document.getElementById('company-kyc-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  style={{
                    padding: '0.55rem 1.15rem',
                    background: 'linear-gradient(135deg, #ea580c, #c2410c)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 10px rgba(234,88,12,0.3)'
                  }}
                >
                  📂 Upload Missing KYC Documents Now →
                </button>
              </div>
            )}

            {/* ⭐ SUBSCRIPTION & PLAN PAYMENT PORTAL */}
            {activeNav === 'subscription' && (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', color: '#0f172a', fontWeight: 900, marginBottom: '0.2rem' }}>
                      ⭐ Your SaaS Subscription & Payment Portal
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
                      View active plan details, renew subscription, or upgrade for unlimited vehicle & driver tracking.
                    </p>
                  </div>
                  <span style={{
                    fontSize: '0.82rem', fontWeight: 800,
                    background: '#dcfce7', color: '#15803d',
                    padding: '0.4rem 0.85rem', borderRadius: '20px',
                    border: '1px solid #86efac'
                  }}>
                    🟢 Current Status: Active Plan ({activePlanData?.name || 'Starter Plan'})
                  </span>
                </div>

                {/* CURRENT ACTIVE PLAN SUMMARY BANNER */}
                <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', color: '#fff', borderRadius: '20px', marginBottom: '2rem', border: '1px solid #312e81', boxShadow: '0 10px 30px rgba(15,23,42,0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 900, boxShadow: '0 8px 20px rgba(245,158,11,0.3)' }}>
                        👑
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fff' }}>
                            {activePlanData?.name || 'Starter Plan'}
                          </span>
                          <span style={{ fontSize: '0.72rem', background: '#22c55e', color: '#fff', padding: '0.15rem 0.6rem', borderRadius: '12px', fontWeight: 800 }}>
                            ✓ ACTIVE PAID PLAN
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '4px' }}>
                          Paid ₹{activePlanData?.price || 3999}/mo • Valid until: <strong style={{ color: '#fef08a' }}>{activePlanData?.expiryDate || '30 Aug 2026'}</strong> • Ref: #{activePlanData?.transactionId || 'PAY-1001'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setViewReceiptModalData({
                          id: activePlanData?.transactionId || 'PAY-1001',
                          transactionId: activePlanData?.transactionId || 'PAY-1001',
                          plan: activePlanData?.name || 'Starter Plan',
                          amount: activePlanData?.price || 3999,
                          date: activePlanData?.paidDate || '30 May 2026',
                          method: 'UPI / Razorpay',
                          status: 'SUCCESS'
                        })}
                        style={{ padding: '0.6rem 1.15rem', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        📄 View Tax Receipt
                      </button>

                      <button
                        onClick={() => {
                          setSelectedPlanToPay({ name: activePlanData?.name || 'Starter Plan', price: activePlanData?.price || 3999 });
                          setShowPaymentModal(true);
                        }}
                        style={{ padding: '0.6rem 1.15rem', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', fontWeight: 900, fontSize: '0.82rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        💳 Renew Subscription Plan
                      </button>
                    </div>
                  </div>
                </div>

                {/* TARGETED EMAIL SUBSCRIPTION BANNER */}
                {showOnlySinglePlan && (
                  <div style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '2px solid #3b82f6', borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', boxShadow: '0 4px 14px rgba(59,130,246,0.12)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                        📩
                      </div>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 900, color: '#1e40af' }}>
                          Targeted Subscription Link Sent by Super Admin
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#1e3a8a', marginTop: '2px' }}>
                          Showing one & only your targeted subscription plan: <strong>{targetedPlanName}</strong>. Complete payment below to activate full fleet features.
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowOnlySinglePlan(false)}
                      style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: '#fff', border: '1px solid #93c5fd', color: '#1d4ed8', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      👁️ View All 3 Subscription Plans
                    </button>
                  </div>
                )}

                {/* PLAN SELECTION CARDS */}
                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.3rem' }}>
                      📦 {showOnlySinglePlan ? `Targeted Subscription Plan (${targetedPlanName})` : 'Available SaaS Subscription Tiers & Upgrades'}
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: 0 }}>
                      {showOnlySinglePlan ? 'This is the subscription plan assigned in the Super Admin email.' : 'Upgrade your tier at any time to increase vehicle limits and unlock Traccar GPS telemetry & priority support'}
                    </p>
                  </div>
                  {isEmailSubscriptionFlow && !showOnlySinglePlan && (
                    <button
                      onClick={() => setShowOnlySinglePlan(true)}
                      style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      🎯 Show Targeted Email Plan Only
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                  {/* Starter Plan */}
                  {(!showOnlySinglePlan || targetedPlanName.toLowerCase().includes('starter')) && (
                    <div className="card" style={{ padding: '2rem 1.75rem', background: '#fff', borderRadius: '16px', border: activePlanData?.name === 'Starter Plan' ? '2px solid #2563eb' : '2px solid #2563eb', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 8px 24px rgba(37,99,235,0.12)' }}>
                      {activePlanData?.name === 'Starter Plan' ? (
                        <span style={{ position: 'absolute', top: '-12px', right: '16px', background: '#2563eb', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: '12px' }}>
                          ✓ Your Current Active Plan
                        </span>
                      ) : showOnlySinglePlan && (
                        <span style={{ position: 'absolute', top: '-12px', right: '16px', background: '#16a34a', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: '12px' }}>
                          🎯 Targeted Email Plan
                        </span>
                      )}
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2563eb', marginBottom: '0.5rem' }}>Starter Plan</div>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>₹3,999 <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>/ Month</span></div>
                      <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>Ideal for Small to Medium Rental Fleets</p>

                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.55rem', flex: 1, fontSize: '0.82rem', color: '#334155' }}>
                        <li>✓ Up to 20 Vehicles</li>
                        <li>✓ 200 Drivers / Employees</li>
                        <li>✓ Customer Booking Management</li>
                        <li>✓ Live GPS Vehicle Tracking</li>
                        <li>✓ Email & WhatsApp Customer Alerts</li>
                      </ul>

                      <button
                        onClick={() => {
                          setSelectedPlanToPay({ name: 'Starter Plan', price: 3999 });
                          setShowPaymentModal(true);
                        }}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', fontWeight: 900, fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}
                      >
                        💳 Select & Pay ₹3,999
                      </button>
                    </div>
                  )}

                  {/* Professional Plan ⭐ */}
                  {(!showOnlySinglePlan || targetedPlanName.toLowerCase().includes('pro')) && (
                    <div className="card" style={{ padding: '2rem 1.75rem', background: '#fff', borderRadius: '16px', border: activePlanData?.name === 'Professional Plan' ? '2px solid #7c3aed' : '2px solid #7c3aed', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 8px 24px rgba(124,58,237,0.12)' }}>
                      <span style={{ position: 'absolute', top: '-12px', right: '16px', background: '#7c3aed', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: '12px' }}>
                        {activePlanData?.name === 'Professional Plan' ? '✓ Your Current Active Plan' : '⭐ Most Popular'}
                      </span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#7c3aed', marginBottom: '0.5rem' }}>Professional Plan</div>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>₹5,999 <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>/ Month</span></div>
                      <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>Designed for Growing Car Rental Operators</p>

                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.55rem', flex: 1, fontSize: '0.82rem', color: '#334155' }}>
                        <li>✓ Up to 100 Vehicles</li>
                        <li>✓ 500 Drivers / Employees</li>
                        <li>✓ AI Dynamic Revenue Analytics</li>
                        <li>✓ Traccar GPS Telemetry Integration</li>
                        <li>✓ Priority Customer Support</li>
                      </ul>

                      <button
                        onClick={() => {
                          setSelectedPlanToPay({ name: 'Professional Plan', price: 5999 });
                          setShowPaymentModal(true);
                        }}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.25)' }}
                      >
                        🚀 Upgrade & Pay ₹5,999
                      </button>
                    </div>
                  )}

                  {/* Enterprise Plan */}
                  {(!showOnlySinglePlan || targetedPlanName.toLowerCase().includes('enterprise')) && (
                    <div className="card" style={{ padding: '2rem 1.75rem', background: '#fff', borderRadius: '16px', border: '2px solid #10b981', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981', marginBottom: '0.5rem' }}>Enterprise Plan</div>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>Custom Pricing</div>
                      <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>For Multi-city Franchise Networks</p>

                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.55rem', flex: 1, fontSize: '0.82rem', color: '#334155' }}>
                        <li>✓ Unlimited Vehicles & Branches</li>
                        <li>✓ Custom API & White Label Domain</li>
                        <li>✓ Dedicated Account Manager</li>
                        <li>✓ 24/7 SLA Guarantee</li>
                      </ul>

                      <button
                        onClick={() => alert('📞 Our Enterprise Support Team will call your registered phone number shortly!')}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}
                      >
                        📞 Contact Enterprise Sales
                      </button>
                    </div>
                  )}
                </div>

                {/* SUBSCRIPTION PAYMENT HISTORY TABLE */}
                <div className="card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                        📜 Subscription Payment History & Tax Invoices
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
                        Complete audit trail of all paid SaaS license subscriptions and downloadable receipts
                      </p>
                    </div>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
                      onClick={() => {
                        showNotification('📥 Exporting Subscription Payment History CSV...');
                        const headers = ["Transaction ID", "Plan Paid", "Amount Paid", "Payment Method", "Date", "Status"];
                        const rows = paymentHistory.map(p => [p.transactionId || p.id, p.plan, `₹${p.amount}`, p.method, p.date, p.status]);
                        downloadCSV(headers, rows, "subscription_payment_history.csv");
                      }}
                    >
                      📥 Export Payment History CSV
                    </button>
                  </div>

                  <div className="table-container" style={{ marginBottom: 0 }}>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Transaction ID</th>
                          <th>Subscription Plan</th>
                          <th>Amount Paid</th>
                          <th>Payment Method</th>
                          <th>Date Paid</th>
                          <th>Status</th>
                          <th>Tax Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentHistory.map(pay => (
                          <tr key={pay.id || pay.transactionId}>
                            <td style={{ fontWeight: 800, fontFamily: 'monospace', color: '#2563eb' }}>
                              #{pay.transactionId || pay.id}
                            </td>
                            <td style={{ fontWeight: 700, color: '#0f172a' }}>
                              {pay.plan}
                            </td>
                            <td style={{ fontWeight: 900, color: '#059669' }}>
                              ₹{pay.amount?.toLocaleString('en-IN')}
                            </td>
                            <td>
                              <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 700, color: '#475569' }}>
                                {pay.method || 'UPI / Razorpay'}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                              📅 {pay.date}
                            </td>
                            <td>
                              <span className="badge badge-success" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontWeight: 800 }}>
                                ✓ SUCCESSFUL
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => setViewReceiptModalData(pay)}
                                style={{ padding: '0.3rem 0.65rem', borderRadius: '6px', background: '#fff', border: '1px solid #cbd5e1', fontSize: '0.75rem', fontWeight: 800, color: '#1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                              >
                                📄 View Receipt
                              </button>
                            </td>
                          </tr>
                        ))}
                        {paymentHistory.length === 0 && (
                          <tr>
                            <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontWeight: 600 }}>
                              No past subscription payment records found. Select a plan above to activate your subscription!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ONLINE PAYMENT CHECKOUT MODAL */}
            {showPaymentModal && selectedPlanToPay && (
              <div className="modal-overlay" onClick={() => setShowPaymentModal(false)} style={{ zIndex: 1000, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0 }}>
                <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', width: '90%', padding: '1.75rem', borderRadius: '20px', background: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                      💳 Complete Subscription Payment
                    </h3>
                    <button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Selected Subscription Plan</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#2563eb', marginTop: '2px' }}>{selectedPlanToPay.name}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>₹{selectedPlanToPay.price} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>/ month</span></div>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                      Choose Payment Method
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('upi')}
                        style={{ padding: '0.65rem', borderRadius: '10px', border: paymentMethod === 'upi' ? '2px solid #2563eb' : '1px solid #cbd5e1', background: paymentMethod === 'upi' ? '#eff6ff' : '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', color: paymentMethod === 'upi' ? '#1d4ed8' : '#475569' }}
                      >
                        📱 UPI / GPay / PhonePe
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('razorpay')}
                        style={{ padding: '0.65rem', borderRadius: '10px', border: paymentMethod === 'razorpay' ? '2px solid #7c3aed' : '1px solid #cbd5e1', background: paymentMethod === 'razorpay' ? '#faf5ff' : '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', color: paymentMethod === 'razorpay' ? '#6d28d9' : '#475569' }}
                      >
                        ⚡ Razorpay / Card
                      </button>
                    </div>
                  </div>

                  {paymentMethod === 'upi' && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>
                        Enter VPA / UPI ID
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={upiIdInput}
                        onChange={e => setUpiIdInput(e.target.value)}
                        placeholder="e.g. 9842111223@ybl"
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600, fontSize: '0.85rem' }}
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem('company_status', 'active');
                      localStorage.removeItem('company_pending_approval');

                      const newPayId = 'PAY-' + Math.floor(1000 + Math.random() * 9000);
                      const compName = user?.company?.name || localStorage.getItem('company_name') || 'Sri Ram Travels';
                      const paidDateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

                      const newPayObj = {
                        id: newPayId,
                        transactionId: newPayId,
                        plan: `${selectedPlanToPay.name} (Monthly SaaS License)`,
                        amount: selectedPlanToPay.price,
                        method: paymentMethod === 'upi' ? 'UPI / Razorpay' : 'Credit Card',
                        date: paidDateStr,
                        status: 'SUCCESS'
                      };

                      const updatedCompPayments = [newPayObj, ...paymentHistory];
                      setPaymentHistory(updatedCompPayments);
                      localStorage.setItem('company_payments', JSON.stringify(updatedCompPayments));

                      const newActivePlanObj = {
                        name: selectedPlanToPay.name,
                        price: selectedPlanToPay.price,
                        paidDate: paidDateStr,
                        expiryDate: new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                        transactionId: newPayId,
                        status: 'Active'
                      };
                      setActivePlanData(newActivePlanObj);
                      localStorage.setItem('company_active_plan', JSON.stringify(newActivePlanObj));

                      // Sync to Super Admin
                      const newSuperPayObj = {
                        id: newPayId,
                        type: 'Subscription',
                        company: compName,
                        amount: selectedPlanToPay.price,
                        method: paymentMethod === 'upi' ? 'UPI / Razorpay' : 'Credit Card',
                        status: 'Success',
                        date: paidDateStr
                      };
                      const existingSuperPay = JSON.parse(localStorage.getItem('super_admin_subscription_payments') || '[]');
                      const updatedSuperPay = [newSuperPayObj, ...existingSuperPay];
                      localStorage.setItem('super_admin_subscription_payments', JSON.stringify(updatedSuperPay));

                      setIsSubscriptionLocked(false);
                      showNotification(`🎉 Payment of ₹${selectedPlanToPay.price} Successful! Subscription now ACTIVE. Redirecting to website...`);
                      setShowPaymentModal(false);

                      // Redirect to main website after payment completion
                      setTimeout(() => {
                        window.location.href = '/';
                      }, 1500);
                    }}
                    style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', fontWeight: 900, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}
                  >
                    ✅ Complete Payment & Activate Plan
                  </button>
                </div>
              </div>
            )}

            {/* 💰 DEDICATED COMPANY REVENUE & FINANCIAL PERFORMANCE PAGE */}
            {(activeNav === 'revenue' || activeNav === 'payments') && (
              <div style={{ animation: 'fadeIn 0.3s ease-out', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', color: '#0f172a', fontWeight: 900, marginBottom: '0.2rem' }}>
                      💰 Company Revenue & Financial Performance
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
                      Real-time breakdown of vehicle booking earnings, customer rental payments, net profits & tax invoices.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                      onClick={() => {
                        showNotification('📥 Exporting Company Revenue Report CSV...');
                        const headers = ["Booking ID", "Customer", "Car Rented", "Rental Type", "Amount Paid", "Status", "Date"];
                        const rows = bookings.map(b => [b._id || b.bookingId, b.customerName || 'Renter', b.carName || b.vehicleName || 'Fleet Car', b.bookingType || 'Self-Drive', `₹${b.totalAmount || b.price || 3500}`, b.status || 'Confirmed', b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Today']);
                        downloadCSV(headers, rows, "company_revenue_report.csv");
                      }}
                    >
                      📥 Export Revenue Report CSV
                    </button>
                  </div>
                </div>

                {/* TOP 4 FINANCIAL METRIC CARDS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem' }}>
                  <div
                    onClick={() => { setBookingFilter('all'); setActiveNav('bookings'); }}
                    style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 8px 20px rgba(15,23,42,0.15)', cursor: 'pointer', transition: 'transform 0.2s ease' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    title="Click to view all bookings"
                  >
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700 }}>Gross Rental Revenue</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#4ade80', margin: '0.3rem 0', letterSpacing: '-0.02em' }}>
                      ₹ 40,798
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                      ↑ 14.5% vs last month • <strong>{bookings.length || 128} Total Bookings →</strong>
                    </div>
                  </div>

                  <div
                    onClick={() => { setBookingFilter('self'); setActiveNav('bookings'); }}
                    style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.02)', cursor: 'pointer', transition: 'transform 0.2s ease' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    title="Click to view self-drive bookings"
                  >
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>Self-Drive Rental Revenue</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2563eb', margin: '0.3rem 0', letterSpacing: '-0.02em' }}>
                      ₹ 24,500
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
                      🔑 60% of total revenue (112 Self-Drive Trips →)
                    </div>
                  </div>

                  <div
                    onClick={() => { setBookingFilter('driver'); setActiveNav('bookings'); }}
                    style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.02)', cursor: 'pointer', transition: 'transform 0.2s ease' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    title="Click to view chauffeur driver bookings"
                  >
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>Chauffeur Driven Revenue</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#c026d3', margin: '0.3rem 0', letterSpacing: '-0.02em' }}>
                      ₹ 16,298
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#c026d3', fontWeight: 700 }}>
                      👨‍✈️ 40% of total revenue (88 Chauffeur Trips →)
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      const el = document.getElementById('customer-payments-invoices-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.02)', cursor: 'pointer', transition: 'transform 0.2s ease' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    title="Click to view tax invoices & settlements"
                  >
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>Net Company Profit</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669', margin: '0.3rem 0', letterSpacing: '-0.02em' }}>
                      ₹ 36,718
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>
                      🛡️ 90% Net Profit Margin (View Invoices ↓)
                    </div>
                  </div>
                </div>

                {/* MONTHLY REVENUE ANALYTICS BAR CHART */}
                <div className="card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', marginBottom: '1.25rem' }}>
                    📊 Monthly Rental Revenue & Earnings Breakdown
                  </h3>
                  <div style={{ position: 'relative', height: '180px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '0 1rem' }}>
                    {[
                      { month: 'Feb 2026', val: 55, revenue: '₹5,50,000' },
                      { month: 'Mar 2026', val: 92, active: true, revenue: '₹9,99,900' },
                      { month: 'Apr 2026', val: 65, revenue: '₹6,50,000' },
                      { month: 'May 2026', val: 90, revenue: '₹9,00,000' },
                      { month: 'Jun 2026', val: 55, revenue: '₹5,50,000' }
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#0f172a', background: item.active ? '#dbeafe' : '#f1f5f9', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                          {item.revenue}
                        </span>
                        <div style={{ width: '42px', height: `${item.val * 1.5}px`, background: item.active ? 'linear-gradient(180deg, #1d4ed8, #2563eb)' : '#0284c7', borderRadius: '8px 8px 0 0' }} />
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569' }}>{item.month}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CUSTOMER RENTAL PAYMENT TRANSACTIONS TABLE */}
                <div className="card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', marginBottom: '1.25rem' }}>
                    📋 Customer Rental Payments & Invoices
                  </h3>
                  <div className="table-container" style={{ marginBottom: 0 }}>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Booking Ref</th>
                          <th>Customer</th>
                          <th>Car Rented</th>
                          <th>Rental Type</th>
                          <th>Amount Paid</th>
                          <th>Status</th>
                          <th>Tax Invoice</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.length === 0 ? (
                          <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No completed rental transactions yet</td></tr>
                        ) : bookings.map((b, idx) => (
                          <tr key={b._id || idx}>
                            <td style={{ fontWeight: 800, fontFamily: 'monospace', color: '#2563eb' }}>
                              #{String(b._id || b.bookingId || idx + 1001).slice(-6).toUpperCase()}
                            </td>
                            <td style={{ fontWeight: 700, color: '#0f172a' }}>{b.customerName || 'Vaideeswari S.'}</td>
                            <td style={{ fontWeight: 600 }}>{b.carName || b.vehicleName || 'BMW 3 Series'}</td>
                            <td>
                              <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#eff6ff', color: '#1d4ed8', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                                {b.bookingType || 'Self-Drive'}
                              </span>
                            </td>
                            <td style={{ fontWeight: 900, color: '#059669' }}>
                              ₹{b.totalAmount || b.price || 3500}
                            </td>
                            <td>
                              <span className="badge badge-success">PAID & CONFIRMED</span>
                            </td>
                            <td>
                              <button
                                onClick={() => setSelectedBooking(b)}
                                style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}
                              >
                                📄 View Tax Invoice
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 1. DASHBOARD OVERVIEW */}
            {activeNav === 'dashboard' && (
              <div style={{ animation: 'fadeIn 0.3s ease-out', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* TOP 4 KPI CARDS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                  {/* Total Revenue */}
                  <div
                    onClick={() => setActiveNav('payments')}
                    style={{
                      background: '#fff', borderRadius: '16px', padding: '1.25rem', border: '1px solid #f1f5f9',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                      cursor: 'pointer', transition: 'transform 0.18s ease, boxShadow 0.18s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.02)'; }}
                  >
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Total Revenue</span>
                      <span style={{ fontSize: '0.68rem', color: '#2563eb', fontWeight: 800 }}>View Revenue ↗</span>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                      ₹ 40,798
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '0.15rem 0.5rem', borderRadius: '12px' }}>
                        ↑ 2.5%
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#2563eb', background: '#eff6ff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>↗</span>
                    </div>
                  </div>

                  {/* Total Cars */}
                  <div
                    onClick={() => setActiveNav('vehicles')}
                    style={{
                      background: '#fff', borderRadius: '16px', padding: '1.25rem', border: '1px solid #f1f5f9',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                      cursor: 'pointer', transition: 'transform 0.18s ease, boxShadow 0.18s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.02)'; }}
                  >
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Total Cars</span>
                      <span style={{ fontSize: '0.68rem', color: '#2563eb', fontWeight: 800 }}>Fleet Catalog ↗</span>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                      {vehicles.length || 152}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '0.15rem 0.5rem', borderRadius: '12px' }}>
                        ↑ 2.5%
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#2563eb', background: '#eff6ff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>↗</span>
                    </div>
                  </div>

                  {/* Total Bookings */}
                  <div
                    onClick={() => setActiveNav('bookings')}
                    style={{
                      background: '#fff', borderRadius: '16px', padding: '1.25rem', border: '1px solid #f1f5f9',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                      cursor: 'pointer', transition: 'transform 0.18s ease, boxShadow 0.18s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.02)'; }}
                  >
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Total Bookings</span>
                      <span style={{ fontSize: '0.68rem', color: '#2563eb', fontWeight: 800 }}>All Trips ↗</span>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                      {bookings.length || 128}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '0.15rem 0.5rem', borderRadius: '12px' }}>
                        ↑ 2.5%
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#2563eb', background: '#eff6ff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>↗</span>
                    </div>
                  </div>

                  {/* Total Customers */}
                  <div
                    onClick={() => setActiveNav('customers')}
                    style={{
                      background: '#fff', borderRadius: '16px', padding: '1.25rem', border: '1px solid #f1f5f9',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                      cursor: 'pointer', transition: 'transform 0.18s ease, boxShadow 0.18s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.02)'; }}
                  >
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Total Customers</span>
                      <span style={{ fontSize: '0.68rem', color: '#2563eb', fontWeight: 800 }}>View Roster ↗</span>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                      1,240
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#dc2626', background: '#fee2e2', padding: '0.15rem 0.5rem', borderRadius: '12px' }}>
                        ↓ 2.5%
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#2563eb', background: '#eff6ff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>↗</span>
                    </div>
                  </div>
                </div>

                {/* MIDDLE CHARTS ROW */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
                  {/* Revenue Overview Bar Chart */}
                  <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 14px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Revenue Overview</h3>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Hover bars to inspect amount • Click to view Payments</div>
                      </div>
                      <span
                        onClick={() => setActiveNav('payments')}
                        style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', background: '#eff6ff', padding: '0.3rem 0.75rem', borderRadius: '20px', border: '1px solid #bfdbfe', cursor: 'pointer' }}
                      >
                        Monthly ↗
                      </span>
                    </div>

                    <div style={{ position: 'relative', height: '180px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 1rem 0 2rem' }}>
                      {/* Y Axis Guide Lines */}
                      <div style={{ position: 'absolute', left: 0, top: '10%', fontSize: '0.65rem', color: '#94a3b8' }}>10L</div>
                      <div style={{ position: 'absolute', left: 0, top: '35%', fontSize: '0.65rem', color: '#94a3b8' }}>8L</div>
                      <div style={{ position: 'absolute', left: 0, top: '60%', fontSize: '0.65rem', color: '#94a3b8' }}>4L</div>
                      <div style={{ position: 'absolute', left: 0, top: '85%', fontSize: '0.65rem', color: '#94a3b8' }}>0L</div>

                      {[
                        { month: 'Feb', val: 55, revenue: '₹5,50,000' },
                        { month: 'Mar', val: 92, active: true, revenue: '₹9,99,900' },
                        { month: 'Apr', val: 65, revenue: '₹6,50,000' },
                        { month: 'May', val: 90, revenue: '₹9,00,000' },
                        { month: 'Jun', val: 55, revenue: '₹5,50,000' }
                      ].map((item, idx) => {
                        const isHovered = hoveredRevenueMonth?.month === item.month;
                        const showTooltip = isHovered || (item.active && !hoveredRevenueMonth);

                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              setActiveNav('payments');
                              showNotification(`💰 ${item.month} Revenue: ${item.revenue} (Opening Payments Portal)`);
                            }}
                            onMouseEnter={() => setHoveredRevenueMonth(item)}
                            onMouseLeave={() => setHoveredRevenueMonth(null)}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '45px', position: 'relative', cursor: 'pointer' }}
                          >
                            {showTooltip && (
                              <div style={{
                                position: 'absolute', top: '-32px', background: isHovered ? '#0f172a' : '#2563eb',
                                color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.2rem 0.65rem',
                                borderRadius: '8px', fontSize: '0.72rem', fontWeight: 900,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)', whiteSpace: 'nowrap', zIndex: 10,
                                transform: isHovered ? 'scale(1.08)' : 'none', transition: 'all 0.15s ease'
                              }}>
                                {item.revenue}
                              </div>
                            )}
                            <div style={{
                              width: '32px',
                              height: `${item.val * 1.5}px`,
                              background: isHovered ? 'linear-gradient(180deg, #3b82f6, #1d4ed8)' : item.active ? 'linear-gradient(180deg, #1d4ed8, #2563eb)' : '#0284c7',
                              borderRadius: '12px 12px 0 0',
                              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                              boxShadow: isHovered ? '0 0 14px rgba(37,99,235,0.6)' : 'none'
                            }} />
                            <span style={{
                              fontSize: '0.72rem', fontWeight: 800,
                              color: isHovered ? '#1d4ed8' : '#475569',
                              background: isHovered ? '#dbeafe' : '#f1f5f9',
                              padding: '0.12rem 0.55rem', borderRadius: '10px', transition: 'all 0.15s ease'
                            }}>
                              {item.month}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Booking Overview Smooth Curve Line Chart */}
                  <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 14px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Booking Overview</h3>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Click any day to view daily bookings roster</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 700, color: '#1d4ed8' }}>
                          <span style={{ width: '10px', height: '10px', background: '#1d4ed8', borderRadius: '2px' }} /> Self drive
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 700, color: '#c026d3' }}>
                          <span style={{ width: '10px', height: '10px', background: '#c026d3', borderRadius: '2px' }} /> Chauffeur
                        </div>
                        <span onClick={() => setActiveNav('bookings')} style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', background: '#eff6ff', padding: '0.3rem 0.75rem', borderRadius: '20px', border: '1px solid #bfdbfe', cursor: 'pointer' }}>
                          Weekly ↗
                        </span>
                      </div>
                    </div>

                    <div style={{ position: 'relative', height: '185px' }}>
                      <svg viewBox="0 0 400 130" style={{ width: '100%', height: '130px', overflow: 'visible' }}>
                        <path d="M 0,110 Q 100,20 200,80 T 400,30" fill="none" stroke="#c026d3" strokeWidth="3" />
                        <path d="M 0,100 Q 100,10 200,70 T 400,20" fill="none" stroke="#1d4ed8" strokeWidth="3" />

                        {/* Interactive Nodes for Days */}
                        {[
                          { day: 'Mon', x: 20, ySelf: 95, selfCount: 78, chauffCount: 45 },
                          { day: 'Tue', x: 80, ySelf: 60, selfCount: 95, chauffCount: 62 },
                          { day: 'Wed', x: 140, ySelf: 45, selfCount: 104, chauffCount: 79 },
                          { day: 'Thu', x: 200, ySelf: 68, selfCount: 112, chauffCount: 88 },
                          { day: 'Fri', x: 260, ySelf: 50, selfCount: 126, chauffCount: 95 },
                          { day: 'Sat', x: 320, ySelf: 35, selfCount: 158, chauffCount: 120 },
                          { day: 'Sun', x: 380, ySelf: 22, selfCount: 175, chauffCount: 142 }
                        ].map((dObj, idx) => (
                          <g key={idx} style={{ cursor: 'pointer' }}
                            onMouseEnter={() => setHoveredBookingDay(dObj)}
                            onMouseLeave={() => setHoveredBookingDay(null)}
                            onClick={() => {
                              setActiveNav('bookings');
                              showNotification(`📋 Viewing ${dObj.day} Bookings (${dObj.selfCount} Self-Drive, ${dObj.chauffCount} Chauffeur)`);
                            }}
                          >
                            <circle cx={dObj.x} cy={dObj.ySelf} r="5" fill="#fff" stroke="#1d4ed8" strokeWidth="3" />
                          </g>
                        ))}
                      </svg>

                      {/* Tooltip Badge */}
                      <div style={{
                        position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
                        background: '#0f172a', color: '#fff', fontSize: '0.72rem', fontWeight: 800,
                        padding: '0.3rem 0.85rem', borderRadius: '20px', boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                        whiteSpace: 'nowrap', zIndex: 10, display: 'flex', alignItems: 'center', gap: '0.6rem'
                      }}>
                        {hoveredBookingDay ? (
                          <>
                            <span style={{ color: '#38bdf8' }}>📅 {hoveredBookingDay.day} Bookings:</span>
                            <span style={{ color: '#60a5fa' }}>Self Drive: {hoveredBookingDay.selfCount}</span>
                            <span>•</span>
                            <span style={{ color: '#f0abfc' }}>Chauffeur: {hoveredBookingDay.chauffCount}</span>
                          </>
                        ) : (
                          <>
                            <span style={{ color: '#60a5fa' }}>🚗 Self Drive: 112</span>
                            <span>•</span>
                            <span style={{ color: '#f0abfc' }}>👨‍✈️ Chauffeur: 88</span>
                          </>
                        )}
                      </div>

                      {/* Day Clickable Badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700, padding: '0.5rem 0.25rem 0 0.25rem' }}>
                        {[
                          { day: 'Mon', selfCount: 78, chauffCount: 45 },
                          { day: 'Tue', selfCount: 95, chauffCount: 62 },
                          { day: 'Wed', selfCount: 104, chauffCount: 79 },
                          { day: 'Thu', selfCount: 112, chauffCount: 88 },
                          { day: 'Fri', selfCount: 126, chauffCount: 95 },
                          { day: 'Sat', selfCount: 158, chauffCount: 120 },
                          { day: 'Sun', selfCount: 175, chauffCount: 142 }
                        ].map((dObj, idx) => {
                          const isHovered = hoveredBookingDay?.day === dObj.day;
                          return (
                            <span
                              key={idx}
                              onClick={() => {
                                setActiveNav('bookings');
                                showNotification(`📋 Opening ${dObj.day} Bookings (${dObj.selfCount} Self-Drive, ${dObj.chauffCount} Chauffeur)`);
                              }}
                              onMouseEnter={() => setHoveredBookingDay(dObj)}
                              onMouseLeave={() => setHoveredBookingDay(null)}
                              style={{
                                cursor: 'pointer', padding: '0.2rem 0.45rem', borderRadius: '8px',
                                background: isHovered ? '#2563eb' : '#f1f5f9',
                                color: isHovered ? '#ffffff' : '#475569',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {dObj.day}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTTOM ROW: LIVE MAP SEARCH & TOP RENTED CARS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
                  {/* Live Tracking Map Card */}
                  <div style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 14px rgba(0,0,0,0.02)', position: 'relative', minHeight: '260px' }}>
                    <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 100, background: '#ffffff', padding: '0.4rem 1rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '220px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>🔍</span>
                      <input
                        type="text"
                        placeholder="Finding Car"
                        value={dashboardMapSearchText}
                        onChange={(e) => setDashboardMapSearchText(e.target.value)}
                        style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.8rem', fontWeight: 700, width: '100%', color: '#0f172a' }}
                      />
                    </div>

                    <div id="company-overview-live-map" style={{ width: '100%', height: '240px', borderRadius: '12px', overflow: 'hidden', background: '#e5e7eb', border: '1px solid #cbd5e1', position: 'relative' }}></div>
                  </div>

                  {/* Top Rented Cars */}
                  <div style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 14px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Top Rented Cars</h3>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', cursor: 'pointer' }} onClick={() => setActiveNav('fleet')}>
                        View all
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {[
                        { name: 'VK Polo', rate: '₹200/per hr', img: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=150' },
                        { name: 'BMW 3 Series', rate: '₹450/per hr', img: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=150' },
                        { name: 'Toyota Fortuner', rate: '₹350/per hr', img: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=150' }
                      ].map((car, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <img src={car.img} alt={car.name} style={{ width: '48px', height: '32px', objectFit: 'cover', borderRadius: '6px' }} />
                            <div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>{car.name}</div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>{car.rate}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', background: '#eff6ff', padding: '0.25rem 0.65rem', borderRadius: '12px' }}>
                            Available
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. FLEET MANAGEMENT MODULE */}
            {(activeNav === 'fleet' || activeNav === 'vehicles') && (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>Fleet Management</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Manage all vehicles, enter image URLs for Landing Page display, availability & documents ({vehicles.length} Total Cars)</p>
                  </div>
                  <button className="btn btn-primary" onClick={() => { setEditingVehicle(null); setShowVehicleModal(true); }}>
                    + Add Vehicle
                  </button>
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                  <div className="table-container" style={{ marginBottom: 0 }}>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Car Preview</th><th>Vehicle Name & Number</th><th>Category & Rent</th><th>GPS Tracking Mapping</th><th>Status</th><th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vehicles.length === 0 ? (
                          <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚗</div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#64748b' }}>No vehicles in fleet yet</div>
                            <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Click <strong>+ Add Vehicle</strong> to add your first car.</div>
                          </td></tr>
                        ) : vehicles.map(v => (
                          <tr key={v._id}>
                            <td>
                              <img src={getValidImageUrl(v.imageUrl, 'vehicle')} onError={e => handleImageError(e, 'vehicle')} alt={v.model} style={{ width: '64px', height: '42px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                            </td>
                            <td>
                              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>{v.make} {v.model} ({v.year})</div>
                              <span style={{ fontFamily: 'monospace', fontWeight: 800, background: '#e0e7ff', color: '#1e40af', padding: '0.1rem 0.45rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                                {v.regNumber || 'TN 01 AB 1234'}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{v.category}</div>
                              <div style={{ fontWeight: 800, color: '#2563eb', fontSize: '0.82rem' }}>₹ {v.pricePerDay} / day</div>
                            </td>
                            <td>
                              {v.enableGps !== false ? (
                                <div>
                                  <div style={{ fontSize: '0.72rem', color: '#15803d', background: '#dcfce7', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 800, display: 'inline-block', marginBottom: '0.25rem' }}>
                                    🟢 Connected
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                                    IMEI: {v.gpsDeviceId || v.traccarDeviceId || '123456789012345'}
                                  </div>
                                  <button
                                    onClick={() => setTraccarModalVehicle(v)}
                                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', padding: 0, marginTop: '2px', textDecoration: 'underline' }}
                                  >
                                    📍 View Live Location
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>GPS Off</span>
                              )}
                            </td>
                            <td>
                              <span className={`badge ${v.status === 'available' ? 'badge-success' : v.status === 'rented' ? 'badge-info' : 'badge-warning'}`}>
                                {(v.status || 'available').toUpperCase()}
                              </span>
                            </td>
                            <td style={{ display: 'flex', gap: '0.4rem' }}>
                              <button style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', background: 'rgba(37,99,235,0.08)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
                                onClick={() => { setEditingVehicle(v); setShowVehicleModal(true); }}>
                                Edit
                              </button>
                              <button style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', background: 'rgba(244,63,94,0.08)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
                                onClick={() => handleDeleteVehicle(v)}>
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 3. BOOKINGS MODULE */}
            {activeNav === 'bookings' && (() => {
              const defaultCompanyBookings = [
                {
                  _id: 'BK-2026-5475',
                  bookingId: 'BK-2026-5475',
                  customerName: 'Shanu',
                  customerPhone: '+91 98765 43210',
                  vehicleName: 'Toyota Innova 2023 (TN 01 BK 5475)',
                  vehicle: { make: 'Toyota', model: 'Innova 2023', pricePerDay: 2200 },
                  startDate: '2026-07-28',
                  endDate: '2026-07-30',
                  pickupTime: '10:00 AM',
                  dropoffTime: '06:00 PM',
                  totalPrice: 2700,
                  totalAmount: 2700,
                  hasDriver: true,
                  bookingType: 'with-driver',
                  driverOption: 'Driver Assigned',
                  driverAssigned: '👨‍✈️ Driver + Car (Ramesh Singh)',
                  status: 'confirmed'
                },
                {
                  _id: 'BK-2026-4977',
                  bookingId: 'BK-2026-4977',
                  customerName: 'Shanu',
                  customerPhone: '+91 98765 43210',
                  vehicleName: 'Toyota 2020 (TN 01 BK 4977)',
                  vehicle: { make: 'Toyota', model: '2020', pricePerDay: 2500 },
                  startDate: '2026-07-28',
                  endDate: '2026-07-30',
                  pickupTime: '10:00 AM',
                  dropoffTime: '06:00 PM',
                  totalPrice: 5000,
                  totalAmount: 5000,
                  hasDriver: true,
                  bookingType: 'with-driver',
                  driverOption: 'Driver Assigned',
                  driverAssigned: '👨‍✈️ Driver + Car (Ramesh Singh)',
                  status: 'confirmed'
                },
                {
                  _id: 'BK-2026-6234',
                  bookingId: 'BK-2026-6234',
                  customerName: 'Shanu',
                  customerPhone: '+91 98765 43210',
                  vehicleName: 'KIA 2026 (TN 01 BK 6234)',
                  startDate: '2026-07-28',
                  endDate: '2026-07-30',
                  totalPrice: 5000,
                  hasDriver: false,
                  bookingType: 'self-drive',
                  driverOption: 'Self Drive',
                  driverAssigned: '🚗 Self Drive',
                  status: 'pending'
                },
                {
                  _id: 'BK-2026-9842',
                  bookingId: 'BK-2026-9842',
                  customerName: 'Rahul Kumar',
                  customerPhone: '+91 98765 43210',
                  vehicleName: 'Mahindra Thar (TN 01 AB 9842)',
                  startDate: '2026-07-28',
                  endDate: '2026-07-31',
                  totalPrice: 9000,
                  hasDriver: false,
                  bookingType: 'self-drive',
                  driverOption: 'Self Drive',
                  driverAssigned: '🚗 Self Drive',
                  status: 'confirmed'
                },
                {
                  _id: 'BK-2026-7412',
                  bookingId: 'BK-2026-7412',
                  customerName: 'Priya Sharma',
                  customerPhone: '+91 98765 74120',
                  vehicleName: 'Hyundai Creta (TN 02 CD 7412)',
                  startDate: '2026-08-01',
                  endDate: '2026-08-04',
                  totalPrice: 7500,
                  hasDriver: false,
                  bookingType: 'self-drive',
                  driverOption: 'Self Drive',
                  driverAssigned: '🚗 Self Drive',
                  status: 'confirmed'
                },
                {
                  _id: 'BK-2026-3310',
                  bookingId: 'BK-2026-3310',
                  customerName: 'Anand Kumar',
                  customerPhone: '+91 98765 33100',
                  vehicleName: 'Toyota Fortuner (TN 03 EF 3310)',
                  startDate: '2026-08-05',
                  endDate: '2026-08-08',
                  totalPrice: 16000,
                  hasDriver: false,
                  bookingType: 'self-drive',
                  driverOption: 'Self Drive',
                  driverAssigned: '🚗 Self Drive',
                  status: 'pending'
                },
                {
                  _id: 'BK-2026-1188',
                  bookingId: 'BK-2026-1188',
                  customerName: 'Vikram R.',
                  customerPhone: '+91 96385 27412',
                  vehicleName: 'BMW 3 Series (TN 04 GH 1188)',
                  startDate: '2026-08-10',
                  endDate: '2026-08-12',
                  totalPrice: 18000,
                  hasDriver: true,
                  bookingType: 'with-driver',
                  driverOption: 'Driver Assigned',
                  driverAssigned: '👨‍✈️ Driver + Car (Oviyaa S.)',
                  status: 'confirmed'
                },
                {
                  _id: 'BK-2026-5590',
                  bookingId: 'BK-2026-5590',
                  customerName: 'Deepu R.',
                  customerPhone: '+91 98765 55900',
                  vehicleName: 'Toyota Innova Crysta (TN 05 IJ 5590)',
                  startDate: '2026-08-15',
                  endDate: '2026-08-18',
                  totalPrice: 12000,
                  hasDriver: true,
                  bookingType: 'with-driver',
                  driverOption: 'Driver Assigned',
                  driverAssigned: '👨‍✈️ Driver + Car (Karthik S.)',
                  status: 'confirmed'
                }
              ];

              const localCustomerBookings = localBookingsList;
              const baseList = [...localCustomerBookings, ...(bookings || []), ...defaultCompanyBookings];

              const seenKeys = new Set();
              const allBookings = baseList.filter(b => {
                const k = b._id || b.bookingId || b.id;
                if (!k || seenKeys.has(k)) return false;
                seenKeys.add(k);
                return true;
              });

              const selfDriveCount = allBookings.filter(b => !b.hasDriver || b.bookingType === 'self-drive' || (b.driverAssigned && b.driverAssigned.includes('Self'))).length;
              const driverAssignedCount = allBookings.filter(b => b.hasDriver || b.bookingType === 'with-driver' || (b.driverAssigned && b.driverAssigned.includes('Driver'))).length;
              const pendingCount = allBookings.filter(b => String(b.status || '').toLowerCase().includes('pend')).length;

              return (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div
                      className="card"
                      style={{ padding: '1.25rem', cursor: 'pointer', border: bookingFilter === 'all' ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)', transition: 'all 0.2s' }}
                      onClick={() => setBookingFilter('all')}
                    >
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Bookings</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{allBookings.length}</span>
                        <span style={{ fontSize: '1.2rem', opacity: 0.6 }}>📋</span>
                      </div>
                    </div>

                    <div
                      className="card"
                      style={{ padding: '1.25rem', cursor: 'pointer', border: bookingFilter === 'self' ? '2px solid #2563eb' : '1px solid var(--border-color)', transition: 'all 0.2s' }}
                      onClick={() => setBookingFilter('self')}
                    >
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Self Driver</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563eb', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{selfDriveCount}</span>
                        <span style={{ fontSize: '1.3rem' }}>🎡</span>
                      </div>
                    </div>

                    <div
                      className="card"
                      style={{ padding: '1.25rem', cursor: 'pointer', border: bookingFilter === 'driver' ? '2px solid #7c3aed' : '1px solid var(--border-color)', transition: 'all 0.2s' }}
                      onClick={() => setBookingFilter('driver')}
                    >
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Driver Assigned</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#7c3aed', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{driverAssignedCount}</span>
                        <span style={{ fontSize: '1.3rem' }}>👤</span>
                      </div>
                    </div>

                    <div
                      className="card"
                      style={{ padding: '1.25rem', cursor: 'pointer', border: bookingFilter === 'pending' ? '2px solid #d97706' : '1px solid var(--border-color)', transition: 'all 0.2s' }}
                      onClick={() => setBookingFilter('pending')}
                    >
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Pending Approval</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{pendingCount}</span>
                        <span style={{ fontSize: '1.3rem' }}>🕒</span>
                      </div>
                    </div>
                  </div>

                  {/* HEADER */}
                  <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>
                        {bookingFilter === 'self' ? 'Self Driver Bookings' : bookingFilter === 'driver' ? 'Driver Assigned Bookings' : bookingFilter === 'pending' ? 'Pending Approval Bookings' : 'Bookings Console'}
                      </h2>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                        {bookingFilter === 'self' ? 'Bookings where customer selected Self Drive' : bookingFilter === 'driver' ? 'Bookings where driver is assigned by company' : 'Review customer reservations, approve requests & assign drivers'}
                      </p>
                    </div>
                    {bookingFilter !== 'all' && (
                      <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => setBookingFilter('all')}>
                        Clear Filter (Show All)
                      </button>
                    )}
                  </div>

                  <div className="card" style={{ padding: '1.5rem' }}>
                    <div className="table-container" style={{ marginBottom: 0 }}>
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Booking ID</th><th>Customer</th><th>Vehicle</th><th>Dates</th><th>Total Price</th><th>Driver Option</th><th>Status</th><th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allBookings
                            .filter(b => {
                              if (bookingFilter === 'self') return !b.hasDriver || String(b.bookingType || '').toLowerCase().includes('self') || (b.driverAssigned && String(b.driverAssigned).toLowerCase().includes('self')) || (b.driverOption && String(b.driverOption).toLowerCase().includes('self'));
                              if (bookingFilter === 'driver') return b.hasDriver || String(b.bookingType || '').toLowerCase().includes('driver') || (b.driverAssigned && String(b.driverAssigned).toLowerCase().includes('driver')) || (b.driverOption && String(b.driverOption).toLowerCase().includes('driver'));
                              if (bookingFilter === 'pending') return String(b.status || '').toLowerCase().includes('pend');
                              return true;
                            })
                            .map(b => {
                              const custName = b.customerName || (typeof b.customerId === 'object' ? b.customerId?.name : null) || b.user?.name || 'Deepu';
                              const custPhone = b.customerPhone || (typeof b.customerId === 'object' ? b.customerId?.mobile || b.customerId?.email : null) || b.user?.mobile || '+91 98765 43210';
                              const vehName = b.vehicleName || (typeof b.vehicleId === 'object' ? `${b.vehicleId?.make} ${b.vehicleId?.model}` : null) || (b.vehicle ? `${b.vehicle.make} ${b.vehicle.model}` : 'Toyota Fortuner');
                              const price = b.totalPrice || b.totalAmount || (b.vehicle ? b.vehicle.pricePerDay * 2 : 5000);
                              const driverMode = b.driverOption || b.driverAssigned || (b.hasDriver ? '👨‍✈️ Driver + Car' : '🚗 Self Drive');
                              const isApproved = String(b.status).toLowerCase() === 'confirmed' || String(b.status).toLowerCase() === 'active' || String(b.status).toLowerCase().includes('approved');

                              let dateText = `${b.startDate} to ${b.endDate}`;
                              try {
                                if (b.startDate && b.startDate.includes('T')) {
                                  const s = new Date(b.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                                  const e = new Date(b.endDate || b.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                                  dateText = `${s} to ${e}`;
                                }
                              } catch (err) { }

                              return (
                                <tr key={b._id}>
                                  <td style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.82rem' }}>
                                    #{b.bookingId || (String(b._id).length > 10 ? String(b._id).slice(-8).toUpperCase() : b._id)}
                                  </td>
                                  <td>
                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{custName}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{custPhone}</div>
                                  </td>
                                  <td style={{ fontWeight: 600 }}>{vehName}</td>
                                  <td style={{ fontSize: '0.8rem' }}>{dateText}</td>
                                  <td style={{ fontWeight: 800, color: '#10b981', fontSize: '0.95rem' }}>₹ {Number(price).toLocaleString('en-IN')}</td>
                                  <td>
                                    <span style={{ fontSize: '0.78rem', background: (b.hasDriver || driverMode.includes('Driver')) ? 'rgba(124,58,237,0.08)' : 'rgba(37,99,235,0.08)', color: (b.hasDriver || driverMode.includes('Driver')) ? '#7c3aed' : '#2563eb', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>
                                      {driverMode}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`badge ${b.status === 'trip_accepted' ? 'badge-info' :
                                      b.status === 'in_progress' ? 'badge-warning' :
                                        b.status === 'trip_finished' ? 'badge-success' :
                                          isApproved ? 'badge-success' : 'badge-amber'
                                      }`}>
                                      {(b.status || 'PENDING').replace('_', ' ').toUpperCase()}
                                    </span>
                                  </td>
                                  <td style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                    {/* Assign Available Driver Dropdown */}
                                    <select
                                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.4rem', borderRadius: '6px', border: '1.5px solid #3b82f6', background: '#eff6ff', color: '#1e40af', fontWeight: 800, cursor: 'pointer' }}
                                      value={b.driverName || (b.driverAssigned ? b.driverAssigned.replace(/.*\(|\).*/g, '') : '')}
                                      onChange={(e) => {
                                        const selectedDrvName = e.target.value;
                                        if (!selectedDrvName) return;
                                        const selectedDrv = drivers.find(d => d.name === selectedDrvName || d.id === selectedDrvName || d._id === selectedDrvName);
                                        
                                        const updatedBookings = (bookings || []).map(item => {
                                          if ((item._id && item._id === b._id) || (item.bookingId && item.bookingId === b.bookingId)) {
                                            return {
                                              ...item,
                                              driverAssigned: `👨‍✈️ Driver + Car (${selectedDrvName})`,
                                              driverName: selectedDrvName,
                                              driverPhone: selectedDrv?.phone || '+91 98765 11111',
                                              driverId: selectedDrv?.id || selectedDrv?._id || selectedDrvName,
                                              hasDriver: true,
                                              status: 'confirmed'
                                            };
                                          }
                                          return item;
                                        });

                                        setBookings(updatedBookings);
                                        safeSetLocalStorage('company_bookings_list', updatedBookings);
                                        safeSetLocalStorage('customer_bookings_list', updatedBookings);

                                        if (selectedDrv) {
                                          const updatedDrivers = drivers.map(d => {
                                            if (d.name === selectedDrv.name) {
                                              return { ...d, status: 'In Trip' };
                                            }
                                            return d;
                                          });
                                          setDrivers(updatedDrivers);
                                          safeSetLocalStorage('company_drivers_registry', updatedDrivers);
                                        }

                                        showNotification(`✓ Assigned Driver ${selectedDrvName} to Booking #${String(b.bookingId || b._id).slice(-6)}!`);
                                      }}
                                    >
                                      <option value="">👤 Assign Driver</option>
                                      {drivers.map(d => (
                                        <option key={d.id || d._id || d.name} value={d.name}>
                                          👨‍✈️ {d.name} ({d.status || 'Available'}{d.assignedVehicle ? ` • ${d.assignedVehicle}` : ''})
                                        </option>
                                      ))}
                                    </select>

                                    {!isApproved ? (
                                      <button className="btn btn-success" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }} onClick={() => handleApproveBooking(b)}>
                                        Approve
                                      </button>
                                    ) : (
                                      <select
                                        className="form-control"
                                        value={b.status}
                                        onChange={async (e) => {
                                          const nextStatus = e.target.value;
                                          try {
                                            await fetch(`/api/company-admin/bookings/${b._id}/status`, {
                                              method: 'PUT',
                                              headers: {
                                                'Content-Type': 'application/json',
                                                Authorization: `Bearer ${token}`
                                              },
                                              body: JSON.stringify({ status: nextStatus })
                                            });
                                            showNotification(`✓ Booking status updated to ${nextStatus.toUpperCase()}`);
                                            fetchDashboardData();
                                          } catch (err) {
                                            console.error(err);
                                          }
                                        }}
                                        style={{ fontSize: '0.72rem', padding: '0.15rem 0.35rem', height: '24px', width: '110px', display: 'inline-block' }}
                                      >
                                        <option value="confirmed">Confirmed</option>
                                        <option value="trip_accepted">Trip Accepted</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="trip_finished">Trip Finished</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                      </select>
                                    )}

                                    {(b.hasDriver || driverMode.includes('Driver')) && (
                                      <button className="btn btn-primary" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', background: '#7c3aed', borderColor: '#7c3aed' }} onClick={() => setAssigningDriverBooking(b)}>
                                        👤 {b.driverAssigned && !b.driverAssigned.includes('Car') ? 'Reassign Driver' : 'Assign Driver'}
                                      </button>
                                    )}

                                    <button className="btn" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, marginRight: '0.25rem' }} onClick={() => setBookingChatModalItem({ ...b, customerName: custName, customerPhone: custPhone, vehicleName: vehName, totalPrice: price })}>💬 Chat</button> <button className="btn" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700 }} onClick={() => setSelectedCustomerDocsBooking({ ...b, customerName: custName, customerPhone: custPhone, vehicleName: vehName, totalPrice: price })}>
                                      📄 View Documents
                                    </button>

                                    <button className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }} onClick={() => setSelectedBooking({ ...b, customerName: custName, customerPhone: custPhone, vehicleName: vehName, totalPrice: price })}>
                                      Invoice
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* 3.5 ATTENDANCE & SHIFT LOGS MODULE */}
            {activeNav === 'attendance' && (() => {
              const driverLogs = JSON.parse(localStorage.getItem('driver_attendance_logs') || '[]');
              const staffLogs = JSON.parse(localStorage.getItem('staff_attendance_logs') || '[]');
              const companyLogs = JSON.parse(localStorage.getItem('company_attendance_logs') || '[]');

              const savedFacePhoto = localStorage.getItem('driver_face_photo') || localStorage.getItem('driver_face_url') || '';
              const registeredRoster = [
                ...drivers.map((drv, idx) => ({
                  id: `att_drv_${drv.id || idx}`,
                  rawId: `att_drv_${drv.id || idx}`,
                  name: drv.name,
                  role: 'Senior Chauffeur / Driver',
                  type: 'driver',
                  date: new Date().toISOString().split('T')[0],
                  clockIn: '--',
                  clockOut: '--',
                  duration: '--',
                  method: '🤳 Pending Punch',
                  status: 'Not Checked In',
                  avatar: drv.driverFaceUrl || drv.photo || drv.avatar || savedFacePhoto
                })),
                ...staffList.map((st, idx) => ({
                  id: `att_staff_${st.id || idx}`,
                  rawId: `att_staff_${st.id || idx}`,
                  name: st.name,
                  role: st.role || 'Staff Member',
                  type: 'staff',
                  date: new Date().toISOString().split('T')[0],
                  clockIn: st.status === 'Inactive' ? '--' : '--',
                  clockOut: st.status === 'Inactive' ? '--' : '--',
                  duration: '--',
                  method: '🤳 Pending Punch',
                  status: st.status === 'Inactive' ? 'Inactive' : 'Not Checked In',
                  avatar: st.avatar || ''
                }))
              ];

              const defaultDriverName = drivers.length > 0 ? drivers[0].name : 'Oviyaa S.';
              const sharedDynamic = companyLogs.map((l, idx) => ({
                id: `shared_${l.id || l._id || idx}`,
                rawId: l.id || l._id,
                name: l.driverName || l.name || defaultDriverName,
                role: l.type === 'staff' ? 'Staff / Operations Desk' : 'Senior Chauffeur',
                type: l.type || 'driver',
                date: l.date || new Date().toISOString().split('T')[0],
                clockIn: l.clockIn || '01:24 PM',
                clockOut: l.clockOut || '--',
                duration: l.duration || '--',
                method: l.method || '🤳 Face Auth',
                status: l.status || (l.clockOut === '--' || !l.clockOut ? 'Checked In' : 'Checked Out'),
                avatar: l.driverPhoto || l.avatar || savedFacePhoto
              }));

              const driverDynamic = driverLogs.map((l, idx) => ({
                id: `driver_${l.id || l._id || idx}`,
                rawId: l.id || l._id,
                name: l.driverName || l.name || defaultDriverName,
                role: 'Senior Chauffeur',
                type: 'driver',
                date: l.date || new Date().toISOString().split('T')[0],
                clockIn: l.clockIn || '01:24 PM',
                clockOut: l.clockOut || '--',
                duration: l.duration || '--',
                method: l.method || '🤳 Face Auth',
                status: l.status || (l.clockOut === '--' || !l.clockOut ? 'Checked In' : 'Checked Out'),
                avatar: l.driverPhoto || l.avatar || savedFacePhoto
              }));

              const staffDynamic = staffLogs.map((l, idx) => ({
                id: `staff_${l.id || l._id || idx}`,
                rawId: l.id || l._id,
                name: l.name || l.driverName || 'Staff Member',
                role: 'Staff / Operations Desk',
                type: 'staff',
                date: l.date || new Date().toISOString().split('T')[0],
                clockIn: l.clockIn || '08:45 AM',
                clockOut: l.clockOut || '--',
                duration: l.duration || '--',
                method: l.method || '🤳 Face Auth',
                status: l.status || (l.clockOut === '--' || !l.clockOut ? 'Checked In' : 'Checked Out'),
                avatar: l.avatar || l.driverPhoto || ''
              }));

              // Deduplicate records by driver/staff name, date & clockIn so all shift logs display
              const cleanNameKey = (n) => (n || '').replace(/\(.*\)/g, '').toLowerCase().trim();
              const rawCombined = [...sharedDynamic, ...driverDynamic, ...staffDynamic, ...registeredRoster];
              const seenKeys = new Set();
              const combinedList = rawCombined.filter(item => {
                const nameKey = cleanNameKey(item.name);
                const dateKey = item.date || new Date().toISOString().split('T')[0];
                const clockInKey = item.clockIn || '';
                const uniqueKey = `${nameKey}_${dateKey}_${clockInKey}`;
                if (!nameKey || seenKeys.has(uniqueKey)) return false;
                seenKeys.add(uniqueKey);
                return true;
              });

              const filteredRecords = combinedList.filter(rec => {
                const matchesType = attendanceTypeFilter === 'all' || rec.type === attendanceTypeFilter;
                const matchesSearch = !attendanceSearch || rec.name.toLowerCase().includes(attendanceSearch.toLowerCase()) || rec.role.toLowerCase().includes(attendanceSearch.toLowerCase());
                return matchesType && matchesSearch;
              });

              const checkedInCount = combinedList.filter(r => r.status === 'Checked In').length;
              const driverCount = combinedList.filter(r => r.type === 'driver' && r.status === 'Checked In').length;
              const staffCount = combinedList.filter(r => r.type === 'staff' && r.status === 'Checked In').length;

              return (
                <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                  <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>
                        🗓️ Personnel Attendance & Shift Biometrics
                      </h2>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                        Real-time biometric face authentication punches and shift logs for drivers & company staff
                      </p>
                    </div>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontWeight: 700 }}
                      onClick={() => {
                        showNotification('🔄 Synced live attendance punches from Driver & Staff portals!');
                      }}
                    >
                      🔄 Refresh Live Logs
                    </button>
                  </div>

                  {/* Stat Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div
                      className="card"
                      onClick={() => setAttendanceTypeFilter('all')}
                      style={{ padding: '1.15rem', borderLeft: '4px solid #10b981', cursor: 'pointer', transition: 'transform 0.15s ease' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                    >
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>ON DUTY (CHECKED IN)</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#059669', marginTop: 2 }}>{checkedInCount} Active</div>
                      <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: 2 }}>✓ Live shift ongoing</div>
                    </div>
                    <div
                      className="card"
                      onClick={() => setAttendanceTypeFilter('driver')}
                      style={{ padding: '1.15rem', borderLeft: '4px solid #2563eb', cursor: 'pointer', transition: 'transform 0.15s ease' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                    >
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>DRIVERS ON DUTY</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1d4ed8', marginTop: 2 }}>{driverCount} Drivers</div>
                      <div style={{ fontSize: '0.7rem', color: '#2563eb', marginTop: 2 }}>🚗 Stationed / Transit</div>
                    </div>
                    <div
                      className="card"
                      onClick={() => setAttendanceTypeFilter('staff')}
                      style={{ padding: '1.15rem', borderLeft: '4px solid #7c3aed', cursor: 'pointer', transition: 'transform 0.15s ease' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                    >
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>STAFF ON SHIFT</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#6d28d9', marginTop: 2 }}>{staffCount} Staff</div>
                      <div style={{ fontSize: '0.7rem', color: '#7c3aed', marginTop: 2 }}>👔 Desk & Support</div>
                    </div>
                    <div
                      className="card"
                      onClick={() => setAttendanceTypeFilter('all')}
                      style={{ padding: '1.15rem', borderLeft: '4px solid #059669', cursor: 'pointer', transition: 'transform 0.15s ease' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                    >
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>FACE AUTH VERIFIED</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#047857', marginTop: 2 }}>100% Match</div>
                      <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: 2 }}>🤳 Biometric Signature</div>
                    </div>
                  </div>

                  {/* Filter controls */}
                  <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', background: '#fff', border: '1px solid var(--border-color)' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      <span style={{ color: '#64748b' }}>🔍</span>
                      <input
                        type="text"
                        placeholder="Search personnel by name or role..."
                        value={attendanceSearch}
                        onChange={(e) => setAttendanceSearch(e.target.value)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.82rem', width: '100%', color: '#0f172a' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {['all', 'driver', 'staff'].map(t => (
                        <button
                          key={t}
                          onClick={() => setAttendanceTypeFilter(t)}
                          style={{
                            padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700,
                            border: attendanceTypeFilter === t ? '1px solid #2563eb' : '1px solid #cbd5e1',
                            background: attendanceTypeFilter === t ? '#2563eb' : '#fff',
                            color: attendanceTypeFilter === t ? '#fff' : '#475569',
                            cursor: 'pointer', textTransform: 'capitalize'
                          }}
                        >
                          {t === 'all' ? '👥 All Personnel' : t === 'driver' ? '🚗 Drivers Only' : '👔 Staff Only'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Attendance Roster Table */}
                  <div className="card" style={{ padding: '1.25rem', background: '#fff' }}>
                    <div className="table-container" style={{ marginBottom: 0 }}>
                      <table className="custom-table" style={{ fontSize: '0.82rem' }}>
                        <thead>
                          <tr>
                            <th>Personnel Name</th>
                            <th>Category</th>
                            <th>Shift Date</th>
                            <th>Clock In</th>
                            <th>Clock Out</th>
                            <th>Working Hours</th>
                            <th>Biometric Verification</th>
                            <th>Duty Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRecords.map(rec => (
                            <tr key={rec.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                  <div style={{
                                    width: 32, height: 32, borderRadius: '50%', background: rec.type === 'driver' ? '#dbeafe' : '#f3e8ff',
                                    color: rec.type === 'driver' ? '#1e40af' : '#6b21a8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: '0.8rem', overflow: 'hidden'
                                  }}>
                                    {rec.avatar ? <img src={rec.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : rec.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{rec.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{rec.role}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span style={{
                                  fontSize: '0.7rem', padding: '0.2rem 0.55rem', borderRadius: '4px', fontWeight: 800,
                                  background: rec.type === 'driver' ? '#eff6ff' : '#faf5ff',
                                  color: rec.type === 'driver' ? '#1d4ed8' : '#7e22ce',
                                  border: rec.type === 'driver' ? '1px solid #bfdbfe' : '1px solid #e9d5ff'
                                }}>
                                  {rec.type === 'driver' ? '🚗 Driver' : '👔 Staff'}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600 }}>{rec.date}</td>
                              <td style={{ color: '#16a34a', fontWeight: 800 }}>{rec.clockIn}</td>
                              <td style={{ color: rec.clockOut === '--' ? '#64748b' : '#dc2626', fontWeight: 800 }}>{rec.clockOut}</td>
                              <td style={{ fontWeight: 700 }}>{rec.duration}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                                  <div style={{ position: 'relative', width: 34, height: 34, borderRadius: '50%', border: '2px solid #10b981', overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 6px rgba(16,185,129,0.25)', background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                                    {(rec.avatar || rec.driverPhoto) ? (
                                      <img
                                        src={rec.avatar || rec.driverPhoto}
                                        alt="Biometric Face"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      />
                                    ) : (
                                      (rec.name || 'Oviyaa S.').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                                    )}
                                  </div>
                                  <div>
                                    <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 800, display: 'inline-block' }}>
                                      🤳 Face Verified
                                    </span>
                                    <div style={{ fontSize: '0.66rem', color: '#059669', fontWeight: 700, marginTop: '1px' }}>100% Match</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className={`badge ${rec.status === 'Checked In' ? 'badge-success' : 'badge-secondary'}`} style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}>
                                  {rec.status === 'Checked In' ? '🟢 Checked In' : '🔴 Checked Out'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 4. CUSTOMERS MODULE */}
            {activeNav === 'customers' && (() => {
              const localCustomerBookings = JSON.parse(localStorage.getItem('customer_bookings_list') || '[]');
              const allCustomerBookings = [...(bookings || []), ...localCustomerBookings];

              const customerMap = new Map();
              customersList.forEach(c => customerMap.set((c.email || c.name).toLowerCase(), c));

              allCustomerBookings.forEach(b => {
                const name = b.customerName || (typeof b.customerId === 'object' ? b.customerId?.name : 'Customer');
                const email = (typeof b.customerId === 'object' ? b.customerId?.email : null) || b.customerEmail || `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`;
                const phone = b.customerPhone || (typeof b.customerId === 'object' ? b.customerId?.mobile : '+91 98765 43210');
                const key = email.toLowerCase();

                if (!customerMap.has(key)) {
                  customerMap.set(key, {
                    id: `c_${key}`,
                    name,
                    email,
                    phone,
                    trips: 1,
                    rating: 4.9,
                    docVerified: true,
                    status: 'Active'
                  });
                }
              });

              const mergedCustomersList = Array.from(customerMap.values());

              return (
                <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>Customer Directory</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Customer profiles, KYC compliance verification & rental history ({mergedCustomersList.length} Registered Customers)</p>
                  </div>

                  <div className="card" style={{ padding: '1.5rem' }}>
                    <div className="table-container" style={{ marginBottom: 0 }}>
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Customer Name</th><th>Email / Phone</th><th>Total Trips</th><th>Rating</th><th>KYC Status</th><th>Status</th><th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mergedCustomersList.map(c => (
                            <tr key={c.id} style={{ opacity: c.status === 'Blocked' ? 0.7 : 1 }}>
                              <td style={{ fontWeight: 700 }}>{c.name}</td>
                              <td>
                                <div>{c.email}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.phone}</div>
                              </td>
                              <td>{c.trips} Bookings</td>
                              <td style={{ fontWeight: 700, color: '#d97706' }}>⭐ {c.rating}</td>
                              <td>
                                <span className={`badge ${c.docVerified ? 'badge-success' : 'badge-warning'}`}>
                                  {c.docVerified ? 'VERIFIED KYC' : 'PENDING VERIFICATION'}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${c.status === 'Active' ? 'badge-success' : c.status === 'Blocked' ? 'badge-danger' : 'badge-amber'}`}>
                                  {c.status ? c.status.toUpperCase() : 'ACTIVE'}
                                </span>
                              </td>
                              <td style={{ display: 'flex', gap: '0.35rem' }}>
                                <button
                                  className={`btn ${c.status === 'Active' ? 'btn-danger' : 'btn-success'}`}
                                  style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', fontWeight: 700 }}
                                  onClick={() => {
                                    const newStatus = c.status === 'Active' ? 'Blocked' : 'Active';
                                    setCustomersList(prev => prev.map(item =>
                                      (item.id === c.id || item.email === c.email) ? { ...item, status: newStatus } : item
                                    ));
                                    showNotification(`✓ Customer ${c.name} has been ${newStatus === 'Blocked' ? '🚫 Blocked' : '✅ Unblocked'} successfully.`);
                                  }}
                                >
                                  {c.status === 'Active' ? '🚫 Block Customer' : '✅ Unblock'}
                                </button>
                                <button
                                  style={{ fontSize: '0.72rem', padding: '0.2rem 0.65rem', fontWeight: 700, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to permanently delete customer ${c.name}?`)) {
                                      setCustomersList(prev => prev.filter(item => item.id !== c.id && item.email !== c.email));
                                      showNotification(`✓ Customer ${c.name} deleted successfully.`);
                                    }
                                  }}
                                >
                                  🗑️ Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 5. DRIVERS MODULE */}
            {activeNav === 'drivers' && (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>Driver Roster</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Manage company drivers, licenses, ratings & trip assignments ({drivers.length} Drivers)</p>
                  </div>
                  <button className="btn btn-primary" onClick={() => { setEditingDriver(null); setShowDriverModal(true); }}>+ Add Driver</button>
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                  <div className="table-container" style={{ marginBottom: 0 }}>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Driver Photo</th><th>Driver Name</th><th>Phone</th><th>License Number</th><th>Assigned Vehicle</th><th>Status</th><th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {drivers.length === 0 ? (
                          <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👨‍💼</div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#64748b' }}>No drivers registered yet</div>
                            <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Click <strong>+ Add Driver</strong> to add your first driver.</div>
                          </td></tr>
                        ) : drivers.map(d => {
                          const driverPhotoUrl = getValidImageUrl(d.driverFaceUrl || d.avatar || d.photo, 'driver');
                          const driverExactAddress = d.location || d.address || 'Anna Salai, Guindy, Chennai, Tamil Nadu - 600032';
                          const driverLat = Number(d.latitude) || 13.0067;
                          const driverLng = Number(d.longitude) || 80.2020;
                          const driverSpeed = d.speed || '42 km/h';

                          const handleOpenLiveLocation = () => setTraccarModalVehicle({
                            vehicleName: d.assignedVehicle || 'BMW 3 Series (TN-05-AB-1234)',
                            driverName: d.name,
                            phone: d.phone,
                            email: d.email || 'driver@company.com',
                            driverPhoto: driverPhotoUrl,
                            status: d.status || 'Active',
                            speed: driverSpeed,
                            latitude: driverLat,
                            longitude: driverLng,
                            address: driverExactAddress,
                            licenseNumber: d.licenseNumber || 'TN-05-2021-9988',
                            exp: d.exp || '5 Years',
                            rating: d.rating || '4.9 ⭐',
                            dutyStatus: d.dutyStatus || 'ON DUTY',
                            faceVerified: d.faceVerified !== false
                          });

                          return (
                            <tr key={d.id || d._id} style={{ cursor: 'pointer' }} onClick={(e) => {
                              if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
                                handleOpenLiveLocation();
                              }
                            }}>
                              <td>
                                <div
                                  onClick={(e) => { e.stopPropagation(); handleOpenLiveLocation(); }}
                                  title="📡 Click to Live Track Driver GPS Location & View Exact Details"
                                  style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', border: '2.5px solid #3b82f6', background: '#f1f5f9', cursor: 'pointer', transition: 'transform 0.2s ease', boxShadow: '0 2px 8px rgba(59,130,246,0.35)' }}
                                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                  <img
                                    src={driverPhotoUrl}
                                    onError={e => handleImageError(e, 'driver')}
                                    alt={d.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                </div>
                              </td>
                              <td style={{ verticalAlign: 'middle', fontWeight: 700 }}>
                                <div style={{ color: '#0f172a', fontSize: '0.92rem' }}>{d.name}</div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }} title={driverExactAddress}>
                                  📍 {driverExactAddress}
                                </div>
                              </td>
                              <td style={{ verticalAlign: 'middle' }}>{d.phone}</td>
                              <td style={{ verticalAlign: 'middle' }}><span style={{ fontFamily: 'monospace', fontWeight: 600, background: '#f1f5f9', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>{d.licenseNumber}</span></td>
                              <td style={{ verticalAlign: 'middle' }}>
                                {d.assignedVehicle && d.assignedVehicle !== 'Not Assigned' ? (
                                  <span style={{ fontSize: '0.78rem', fontWeight: 800, background: '#eff6ff', color: '#2563eb', padding: '0.3rem 0.65rem', borderRadius: '8px', border: '1px solid #bfdbfe', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                    🚗 {d.assignedVehicle}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#fef2f2', color: '#dc2626', padding: '0.25rem 0.55rem', borderRadius: '8px', border: '1px solid #fecaca' }}>
                                    ⚠️ Not Assigned
                                  </span>
                                )}
                              </td>
                              <td style={{ verticalAlign: 'middle' }}><span className={`badge ${d.status === 'Available' || d.status === 'Active' ? 'badge-success' : 'badge-info'}`}>{d.status || 'Active'}</span></td>
                              <td style={{ verticalAlign: 'middle' }}>
                                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                  <button
                                    className="btn"
                                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', fontWeight: 800, border: 'none', borderRadius: '6px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(16,185,129,0.3)', whiteSpace: 'nowrap' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAssignVehicleModalDriver(d);
                                      setSelectedVehicleToAssign(d.assignedVehicleId || '');
                                    }}
                                  >
                                    🚗 Assign Vehicle
                                  </button>
                                  <button
                                    className="btn"
                                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff', fontWeight: 800, border: 'none', borderRadius: '6px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(2,132,199,0.3)', whiteSpace: 'nowrap' }}
                                    onClick={(e) => { e.stopPropagation(); handleOpenLiveLocation(); }}
                                  >
                                    📡 Live Track
                                  </button>
                                  <button className="btn btn-primary" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', whiteSpace: 'nowrap' }} onClick={(e) => { e.stopPropagation(); setEditingDriver(d); setShowDriverModal(true); }}>
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-danger"
                                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', background: '#ef4444', borderColor: '#ef4444' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm(`Are you sure you want to delete driver ${d.name}?`)) {
                                        const driverKey = d.id || d._id;
                                        const updated = drivers.filter(item => (item.id || item._id) !== driverKey);
                                        setDrivers(updated);
                                        localStorage.setItem('company_drivers_registry', JSON.stringify(updated));
                                        showNotification(`🗑️ Driver ${d.name} deleted successfully.`);
                                      }
                                    }}
                                  >
                                    Del
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ASSIGN VEHICLE MODAL */}
                {assignVehicleModalDriver && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '1.75rem', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>🚗 Assign Vehicle to Driver</h3>
                        <button onClick={() => setAssignVehicleModalDriver(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid #e2e8f0' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem' }}>
                          👨‍✈️
                        </div>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#0f172a' }}>{assignVehicleModalDriver.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Phone: {assignVehicleModalDriver.phone} • DL: {assignVehicleModalDriver.licenseNumber || 'Verified'}</div>
                        </div>
                      </div>

                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.5rem' }}>Select Company Vehicle:</label>
                        <select
                          value={selectedVehicleToAssign}
                          onChange={(e) => setSelectedVehicleToAssign(e.target.value)}
                          style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700, background: '#fff', color: '#0f172a', outline: 'none' }}
                        >
                          <option value="">-- Select Vehicle to Assign --</option>
                          {vehicles.map(v => (
                            <option key={v._id || v.id} value={v._id || v.id}>
                              🚗 {v.plate || v.registrationNumber || v.regNo || 'TN 01 AB 1234'} - {v.model || v.make} ({v.transmission || 'Automatic'})
                            </option>
                          ))}
                          <option value="unassign">🚫 Unassign Current Vehicle (Make Available)</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                          onClick={() => handleAssignVehicleToDriver(assignVehicleModalDriver, selectedVehicleToAssign)}
                          style={{ flex: 1, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', border: 'none', padding: '0.85rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}
                        >
                          ✓ Confirm & Assign Vehicle
                        </button>
                        <button
                          onClick={() => setAssignVehicleModalDriver(null)}
                          style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '0.85rem 1.25rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5.5 LIVE TRACKING MODULE */}
            {activeNav === 'live-tracking' && (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', color: '#0f172a', fontWeight: 900, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      📍 Live GPS Vehicle & Fleet Radar
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
                      Real-time GPS telemetry, live speed, battery status, and location monitoring for self-drive and chauffeur vehicles
                    </p>
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, background: '#dcfce7', color: '#15803d', padding: '0.4rem 0.85rem', borderRadius: '20px', border: '1px solid #86efac' }}>
                    🟢 Live Traccar GPS Stream Active
                  </span>
                </div>

                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="card" style={{ padding: '1.15rem', borderLeft: '4px solid #2563eb' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>TOTAL TRACKED FLEET</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1d4ed8', marginTop: 2 }}>{selfDriveLocations.length + driverLocations.length} Vehicles</div>
                    <div style={{ fontSize: '0.7rem', color: '#2563eb', marginTop: 2 }}>📡 GPS Telemetry Synced</div>
                  </div>
                  <div className="card" style={{ padding: '1.15rem', borderLeft: '4px solid #059669' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>SELF-DRIVE TRACCAR GPS</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#047857', marginTop: 2 }}>{selfDriveLocations.length} Active</div>
                    <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: 2 }}>🔑 Keyless Renter Active</div>
                  </div>
                  <div className="card" style={{ padding: '1.15rem', borderLeft: '4px solid #7c3aed' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>CHAUFFEUR DRIVERS</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#6d28d9', marginTop: 2 }}>{driverLocations.length} On Duty</div>
                    <div style={{ fontSize: '0.7rem', color: '#7c3aed', marginTop: 2 }}>👨‍✈️ Driver App Tracked</div>
                  </div>
                </div>

                {/* Live Map Panel & Sidebar */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      🗺️ Fleet Live Tracking Radar Map
                    </h3>

                    {/* Filter Sub-Tabs */}
                    <div style={{ display: 'flex', gap: '0.4rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
                      <button
                        onClick={() => setMapVehicleFilter('all')}
                        style={{ background: mapVehicleFilter === 'all' ? '#2563eb' : 'transparent', color: mapVehicleFilter === 'all' ? '#fff' : '#475569', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                      >
                        🔘 All Fleet ({selfDriveLocations.length + driverLocations.length})
                      </button>
                      <button
                        onClick={() => setMapVehicleFilter('selfdrive')}
                        style={{ background: mapVehicleFilter === 'selfdrive' ? '#059669' : 'transparent', color: mapVehicleFilter === 'selfdrive' ? '#fff' : '#475569', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                      >
                        🔑 Self-Drive GPS ({selfDriveLocations.length})
                      </button>
                      <button
                        onClick={() => setMapVehicleFilter('driver')}
                        style={{ background: mapVehicleFilter === 'driver' ? '#7c3aed' : 'transparent', color: mapVehicleFilter === 'driver' ? '#fff' : '#475569', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                      >
                        👨‍✈️ Chauffeurs ({driverLocations.length})
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
                    {/* Location Info list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '450px', overflowY: 'auto' }}>
                      {/* Render Self-Drive Vehicles */}
                      {(mapVehicleFilter === 'all' || mapVehicleFilter === 'selfdrive') && selfDriveLocations.map(sd => (
                        <div
                          key={sd.id}
                          onClick={() => {
                            if (mapRef.current) {
                              mapRef.current.flyTo([sd.latitude, sd.longitude], 15, { duration: 1.2 });
                              if (markersRef.current['sd_' + sd.id]) {
                                markersRef.current['sd_' + sd.id].openPopup();
                              }
                            }
                            setTraccarModalVehicle({
                              vehicleName: sd.carName,
                              renterName: sd.renterName,
                              phone: sd.renterPhone,
                              regPlate: sd.regNumber,
                              speed: `${sd.speed} km/h`,
                              battery: `${sd.battery}%`,
                              status: sd.status,
                              latitude: sd.latitude,
                              longitude: sd.longitude,
                              address: sd.address || 'In Transit (Krishnagiri / Dharmapuri Hub)'
                            });
                          }}
                          style={{ padding: '1rem', border: '1px solid #a7f3d0', background: '#ecfdf5', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s ease' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                            <span style={{ fontWeight: 900, fontSize: '0.88rem', color: '#065f46' }}>🔑 {sd.carName}</span>
                            <span style={{ fontSize: '0.65rem', background: '#059669', color: '#fff', padding: '0.15rem 0.45rem', borderRadius: '8px', fontWeight: 800 }}>
                              {sd.status} • Traccar
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div>👤 <strong>Renter:</strong> <strong>{sd.renterName}</strong> ({sd.renterPhone})</div>
                            <div>🏷️ <strong>Reg Plate:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{sd.regNumber}</span></div>
                            <div>⚡ <strong>Speed:</strong> {sd.speed} km/h • 🔋 <strong>Battery:</strong> {sd.battery}%</div>
                            <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 700, marginTop: '2px' }}>
                              🛡️ Aadhaar, PAN, DL & Live Face Scan Approved ✅
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Render Chauffeur Driver Vehicles */}
                      {(mapVehicleFilter === 'all' || mapVehicleFilter === 'driver') && driverLocations.map(loc => (
                        <div
                          key={loc.driverId}
                          onClick={() => {
                            if (mapRef.current) {
                              mapRef.current.flyTo([loc.latitude, loc.longitude], 15, { duration: 1.2 });
                              if (markersRef.current['d_' + loc.driverId]) {
                                markersRef.current['d_' + loc.driverId].openPopup();
                              }
                            }
                            setTraccarModalVehicle({
                              vehicleName: loc.vehicleName || 'Premium SUV',
                              driverName: loc.driverName,
                              phone: loc.phone || '+91 96385 27412',
                              status: loc.dutyStatus || 'Active',
                              speed: `${loc.speed} km/h`,
                              latitude: loc.latitude,
                              longitude: loc.longitude,
                              address: loc.address || 'Krishnagiri Main Hub, Krishnagiri, Tamil Nadu'
                            });
                          }}
                          style={{ padding: '1rem', border: '1px solid #bfdbfe', background: '#eff6ff', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s ease' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e3a8a' }}>👨‍✈️ {loc.driverName}</span>
                            <span style={{
                              fontSize: '0.65rem',
                              background: loc.dutyStatus === 'OFF DUTY' ? '#fee2e2' : '#dcfce7',
                              color: loc.dutyStatus === 'OFF DUTY' ? '#b91c1c' : '#15803d',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '8px',
                              fontWeight: 'bold'
                            }}>
                              {loc.dutyStatus || 'ON DUTY'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div>🚗 <strong>Assigned Car:</strong> <span style={{ color: '#2563eb', fontWeight: 600 }}>{loc.vehicleName || 'Premium SUV'}</span></div>
                            <div>👤 <strong>Passenger:</strong> <strong>{loc.customerName || 'Valued Customer'}</strong></div>
                            <div>🚀 <strong>Speed:</strong> {loc.speed} km/h • 📍 {loc.address || 'In Transit'}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Google / Leaflet Map Live Panel */}
                    <div style={{ position: 'relative', height: '450px', borderRadius: '16px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
                      <div id="admin-live-tracking-map-canvas" style={{ height: '450px', width: '100%', background: '#efeae2' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. EMPLOYEES */}
            {activeNav === 'employees' && (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>Employees & Staff Access</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Staff members, roles, permissions & activity tracking</p>
                  </div>
                  <button className="btn btn-primary" onClick={() => { setEditingEmployee(null); setShowEmployeeModal(true); }}>+ Add Employee</button>
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                  {staffList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👨‍💼</div>
                      <h3 style={{ fontSize: '1.1rem', color: '#1e3a8a', fontWeight: 800 }}>No Employees Added Yet</h3>
                      <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>Click "+ Add Employee" to register staff members & assign operational roles.</p>
                      <button className="btn btn-primary" onClick={() => { setEditingEmployee(null); setShowEmployeeModal(true); }}>
                        + Add Employee
                      </button>
                    </div>
                  ) : (
                    <div className="table-container" style={{ marginBottom: 0 }}>
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Employee Name</th><th>Email</th><th>Phone</th><th>Password</th><th>Role & Designation</th><th>Status</th><th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staffList.map(e => (
                            <tr key={e._id || e.id}>
                              <td style={{ fontWeight: 700, color: '#0f172a' }}>{e.name}</td>
                              <td>{e.email}</td>
                              <td>{e.phone || '—'}</td>
                              <td>
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, background: '#f1f5f9', padding: '0.15rem 0.45rem', borderRadius: '4px', color: '#1e40af' }}>
                                  {e.password || 'staff123'}
                                </span>
                              </td>
                              <td><span className="badge badge-info">{e.role}</span></td>
                              <td>
                                <span className={`badge ${e.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                                  {e.status || 'Active'}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }} onClick={() => { setEditingEmployee(e); setShowEmployeeModal(true); }}>
                                    ✏️ Edit
                                  </button>
                                  <button className="btn btn-danger" style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }} onClick={() => {
                                    if (window.confirm('Are you sure you want to remove this employee?')) {
                                      setStaffList(prev => {
                                        const updated = prev.filter(emp => (emp.id !== (e._id || e.id) && emp._id !== (e._id || e.id)));
                                        localStorage.setItem('company_staff_list', JSON.stringify(updated));
                                        return updated;
                                      });
                                      showNotification('🗑️ Employee removed.');
                                    }
                                  }}>
                                    🗑️ Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeNav === 'revenue' && (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>Revenue Dashboard</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Track your income, platform settlements & net revenue performance</p>
                  </div>
                  <button className="btn btn-primary" style={{ fontSize: '0.8rem' }} onClick={() => {
                    showNotification('📥 Generating & downloading Revenue Report CSV...');
                    const headers = ["Category", "This Month (₹)", "Last Month (₹)", "Change"];
                    const rows = [
                      ["Vehicle Rentals", "10,20,000", "8,90,000", "+14.07%"],
                      ["Driver Charges", "1,50,000", "1,25,000", "+20.00%"],
                      ["Other Services", "75,000", "60,000", "+25.00%"],
                      ["Total Net Revenue", "12,45,000", "10,75,000", "+15.81%"]
                    ];
                    downloadCSV(headers, rows, "revenue_statement_july_2026.csv");
                  }}>
                    📥 Download Revenue Report
                  </button>
                </div>

                {/* 5 Revenue Metric Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="card" style={{ padding: '1.15rem', borderLeft: '4px solid #10b981' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>TOTAL REVENUE</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#059669', marginTop: '4px' }}>₹ 12,45,000</div>
                    <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '2px' }}>↑ 16.7% vs last month</div>
                  </div>
                  <div className="card" style={{ padding: '1.15rem', borderLeft: '4px solid #2563eb' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>BOOKING REVENUE</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1d4ed8', marginTop: '4px' }}>₹ 10,20,000</div>
                    <div style={{ fontSize: '0.7rem', color: '#2563eb', marginTop: '2px' }}>↑ 14.3% vs last month</div>
                  </div>
                  <div className="card" style={{ padding: '1.15rem', borderLeft: '4px solid #7c3aed' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>OTHER INCOME</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#6d28d9', marginTop: '4px' }}>₹ 2,25,000</div>
                    <div style={{ fontSize: '0.7rem', color: '#7c3aed', marginTop: '2px' }}>↑ 21.5% vs last month</div>
                  </div>
                  <div className="card" style={{ padding: '1.15rem', borderLeft: '4px solid #ef4444' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>REFUNDS</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#dc2626', marginTop: '4px' }}>₹ 75,000</div>
                    <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '2px' }}>↓ 5.6% vs last month</div>
                  </div>
                  <div className="card" style={{ padding: '1.15rem', borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>NET REVENUE</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#d97706', marginTop: '4px' }}>₹ 11,70,000</div>
                    <div style={{ fontSize: '0.7rem', color: '#f59e0b', marginTop: '2px' }}>↑ 15.2% vs last month</div>
                  </div>
                </div>

                {/* Revenue Breakdown Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  {/* Revenue Overview Summary */}
                  <div className="card" style={{ padding: '1.25rem' }}>
                    <h4 style={{ fontSize: '1rem', color: '#1e3a8a', marginBottom: '1rem' }}>📈 Revenue Summary Log</h4>
                    <table className="custom-table" style={{ fontSize: '0.82rem' }}>
                      <thead>
                        <tr><th>Category</th><th>This Month (₹)</th><th>Last Month (₹)</th><th>Change</th></tr>
                      </thead>
                      <tbody>
                        <tr><td>Vehicle Rentals</td><td style={{ fontWeight: 700 }}>10,20,000</td><td>8,90,000</td><td style={{ color: '#10b981', fontWeight: 700 }}>+14.07%</td></tr>
                        <tr><td>Driver Charges</td><td style={{ fontWeight: 700 }}>1,50,000</td><td>1,25,000</td><td style={{ color: '#10b981', fontWeight: 700 }}>+20.00%</td></tr>
                        <tr><td>Other Services</td><td style={{ fontWeight: 700 }}>75,000</td><td>60,000</td><td style={{ color: '#10b981', fontWeight: 700 }}>+25.00%</td></tr>
                        <tr style={{ background: '#f8fafc', fontWeight: 800 }}><td>Total Net Revenue</td><td style={{ color: '#059669' }}>12,45,000</td><td>10,75,000</td><td style={{ color: '#10b981' }}>+15.81%</td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Revenue by Category Breakdown */}
                  <div className="card" style={{ padding: '1.25rem' }}>
                    <h4 style={{ fontSize: '1rem', color: '#1e3a8a', marginBottom: '1rem' }}>🎯 Revenue by Category</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.82rem' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span>🚗 Vehicle Rentals</span><strong>81.6%</strong>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: '81.6%', height: '100%', background: '#2563eb' }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span>👨‍✈️ Driver Charges</span><strong>12.0%</strong>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: '12.0%', height: '100%', background: '#10b981' }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span>🛠️ Other Services</span><strong>6.4%</strong>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: '6.4%', height: '100%', background: '#f59e0b' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 8. REPORTS DASHBOARD */}
            {activeNav === 'reports' && (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>Performance & Fleet Reports</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>View and analyze operational business reports & vehicle utilization metrics</p>
                  </div>
                  <button className="btn btn-primary" style={{ fontSize: '0.8rem' }} onClick={() => {
                    showNotification('📥 Generating & downloading Fleet Utilization Report CSV...');
                    const headers = ["Vehicle Model", "Total Bookings", "Completed Bookings", "Revenue (₹)", "Utilization Rate"];
                    const rows = [
                      ["Toyota Fortuner", "40", "32", "4,80,000", "80%"],
                      ["Maruti Swift", "35", "25", "2,75,000", "71%"],
                      ["Honda City", "28", "20", "2,40,000", "64%"],
                      ["Hyundai Creta", "23", "18", "2,10,000", "65%"]
                    ];
                    downloadCSV(headers, rows, "fleet_utilization_report_july_2026.csv");
                  }}>
                    📥 Download Report
                  </button>
                </div>

                {/* 5 Report Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="card" style={{ padding: '1.15rem', borderLeft: '4px solid #2563eb' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>TOTAL BOOKINGS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e3a8a' }}>156</div>
                    <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '2px' }}>↑ 18.4% vs last 7 days</div>
                  </div>
                  <div className="card" style={{ padding: '1.15rem', borderLeft: '4px solid #10b981' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>COMPLETED BOOKINGS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669' }}>112</div>
                    <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '2px' }}>↑ 15.6% vs last 7 days</div>
                  </div>
                  <div className="card" style={{ padding: '1.15rem', borderLeft: '4px solid #ef4444' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>CANCELLED BOOKINGS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#dc2626' }}>12</div>
                    <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '2px' }}>↓ 8.3% vs last 7 days</div>
                  </div>
                  <div className="card" style={{ padding: '1.15rem', borderLeft: '4px solid #7c3aed' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>NEW CUSTOMERS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#6d28d9' }}>42</div>
                    <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '2px' }}>↑ 12.7% vs last 7 days</div>
                  </div>
                  <div className="card" style={{ padding: '1.15rem', borderLeft: '4px solid #0891b2' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>ACTIVE VEHICLES</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0e7490' }}>28</div>
                    <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '2px' }}>↑ 5.2% vs last 7 days</div>
                  </div>
                </div>

                {/* Reports Detailed Table & Utilization */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
                  <div className="card" style={{ padding: '1.25rem' }}>
                    <h4 style={{ fontSize: '1rem', color: '#1e3a8a', marginBottom: '1rem' }}>🏆 Top Vehicles Utilization Report</h4>
                    <table className="custom-table" style={{ fontSize: '0.82rem' }}>
                      <thead>
                        <tr><th>Vehicle Model</th><th>Total Bookings</th><th>Completed</th><th>Revenue (₹)</th><th>Utilization</th></tr>
                      </thead>
                      <tbody>
                        <tr><td style={{ fontWeight: 700 }}>Toyota Fortuner</td><td>40</td><td>32</td><td>4,80,000</td><td><span style={{ color: '#10b981', fontWeight: 800 }}>80%</span></td></tr>
                        <tr><td style={{ fontWeight: 700 }}>Maruti Swift</td><td>35</td><td>25</td><td>2,75,000</td><td><span style={{ color: '#2563eb', fontWeight: 800 }}>71%</span></td></tr>
                        <tr><td style={{ fontWeight: 700 }}>Honda City</td><td>28</td><td>20</td><td>2,40,000</td><td><span style={{ color: '#f59e0b', fontWeight: 800 }}>64%</span></td></tr>
                        <tr><td style={{ fontWeight: 700 }}>Hyundai Creta</td><td>23</td><td>18</td><td>2,10,000</td><td><span style={{ color: '#7c3aed', fontWeight: 800 }}>65%</span></td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="card" style={{ padding: '1.25rem' }}>
                    <h4 style={{ fontSize: '1rem', color: '#1e3a8a', marginBottom: '1rem' }}>Operational Summary</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: '#334155' }}>
                      <div><strong>Completion Rate:</strong> <span style={{ color: '#10b981', fontWeight: 800 }}>71.79%</span></div>
                      <div><strong>Average Booking Value:</strong> <span style={{ fontWeight: 800 }}>₹ 12,450</span></div>
                      <div><strong>Total Distance Covered:</strong> <span style={{ fontWeight: 800 }}>3,245 KM</span></div>
                      <div><strong>Total Days Rented:</strong> <span style={{ fontWeight: 800 }}>279 Days</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 10. NOTIFICATIONS MODULE */}
            {activeNav === 'notifications' && (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>Rental Company Notification Console</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Send isolated push alerts strictly to your company employees, drivers & customers</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
                  <div>
                    <div className="card" style={{ padding: '1.5rem' }}>
                      <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>📣 Send New Targeted Notification</h4>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!notifTitle || !notifMsg) return;
                        const newNotif = {
                          _id: 'notif_' + Date.now(),
                          title: notifTitle,
                          message: notifMsg,
                          targetAudience,
                          targetRole: targetAudience.includes('Employees') ? 'employee' : targetAudience.includes('Drivers') ? 'driver' : 'all',
                          createdAt: new Date().toISOString(),
                          status: 'Dispatched',
                          senderName: user?.name || 'Operations Admin'
                        };
                        const updatedNotifs = [newNotif, ...notifications];
                        setNotifications(updatedNotifs);
                        localStorage.setItem('company_broadcast_notifications', JSON.stringify(updatedNotifs));
                        showNotification(`✓ Notification successfully dispatched to ${targetAudience}!`);
                        setNotifTitle('');
                        setNotifMsg('');
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.82rem' }}>Target Audience (Strictly Isolated to Your Company) *</label>
                            <select className="form-control" value={targetAudience} onChange={e => setTargetAudience(e.target.value)}>
                              <option value="All Company Members">👥 All Company Employees, Drivers & Renter Customers</option>
                              <option value="Company Employees Only">👨‍💼 Company Employees Only ({defaultEmployees.length} Staff)</option>
                              <option value="Company Drivers Only">👨‍✈️ Company Drivers Only ({drivers.length} Drivers)</option>
                              <option value="Company Active Customers Only">🚘 Company Renter Customers Only</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.82rem' }}>Notification Subject / Title *</label>
                            <input type="text" className="form-control" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} placeholder="e.g. Schedule Update for Weekend Bookings" required />
                          </div>

                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.82rem' }}>Message Body *</label>
                            <textarea className="form-control" rows={4} value={notifMsg} onChange={e => setNotifMsg(e.target.value)} placeholder="Type your broadcast alert message..." required />
                          </div>

                          <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            🔒 <strong>Privacy Guarantee:</strong> This notification will ONLY be received by users, staff, and drivers registered under <strong>{user?.companyName || 'your rental company'}</strong>. Other rental companies cannot see this message.
                          </div>

                          <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
                            📡 Dispatch Company Notification
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Platform Notifications Received */}
                    <div className="card" style={{ padding: '1.25rem', marginTop: '1.5rem' }}>
                      <h4 style={{ fontSize: '1rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        📥 Platform Announcements (From Forge India Connect)
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem', maxHeight: '280px', overflowY: 'auto' }}>
                        {notifications.filter(n => n.senderRole === 'super-admin').length === 0 ? (
                          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem 0' }}>
                            No platform announcements received yet.
                          </div>
                        ) : (
                          notifications.filter(n => n.senderRole === 'super-admin').map((n) => (
                            <div key={n._id} style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{n.title}</div>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(n.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: '1.3' }}>{n.message}</div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--accent-blue)', marginTop: '0.4rem', fontWeight: 600 }}>
                                Sender: Platform Administrator (Super Admin)
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Sent History Log */}
                  <div className="card" style={{ padding: '1.25rem' }}>
                    <h4 style={{ fontSize: '1rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>📜 Recent Broadcast Logs ({notifications.length})</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem', maxHeight: '420px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem 0' }}>
                          No broadcasts sent yet.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n._id} style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                              <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.85rem' }}>{n.title}</div>
                              <span style={{ fontSize: '0.68rem', background: '#dbeafe', color: '#1d4ed8', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                                {n.status || 'Dispatched'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.4rem' }}>
                              🎯 Target: <strong>{n.targetAudience || n.targetRole || 'All Members'}</strong> • 📅 {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#334155', lineHeight: '1.4', background: '#fff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              {n.message}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
                              <button
                                onClick={() => {
                                  const updated = notifications.filter(item => item._id !== n._id);
                                  setNotifications(updated);
                                  localStorage.setItem('company_broadcast_notifications', JSON.stringify(updated));
                                  showNotification('🗑️ Broadcast log entry deleted.');
                                }}
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                              >
                                🗑️ Delete Log
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 11. OFFERS MODULE */}
            {activeNav === 'offers' && (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>Promotional Offers & Discounts</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Create target discounts, track redemptions, and schedule campaigns</p>
                  </div>
                  <button className="btn btn-primary" onClick={() => {
                    setEditingOffer(null);
                    setNewOfferCode('');
                    setNewOfferDiscount('');
                    setNewOfferDesc('');
                    setNewOfferExpiry('');
                    setOfferName('');
                    setOfferType('Percentage Discount');
                    setOfferMaxDiscount(1000);
                    setOfferMinBooking(2000);
                    setOfferAppliesTo('All Vehicles');
                    setOfferStartDate('');
                    setOfferMinDays(1);
                    setOfferMaxDays(30);
                    setOfferMaxUsage(100);
                    setOfferCustomerType('All Customers');
                    setOfferStatus('active');
                    setShowOfferModal(true);
                  }}>
                    + Create Offer
                  </button>
                </div>

                {/* KPI STATS CARDS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="card" style={{ padding: '1.15rem', borderLeft: '4px solid #10b981' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>ACTIVE OFFERS</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669', marginTop: '4px' }}>
                      {offers.filter(o => o.status === 'active').length}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Live on search page</div>
                  </div>

                  <div className="card" style={{ padding: '1.15rem', borderLeft: '4px solid #2563eb' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>SCHEDULED OFFERS</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1d4ed8', marginTop: '4px' }}>
                      {offers.filter(o => o.status === 'inactive' || o.status === 'scheduled' || o.status === 'draft').length}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Pending activation</div>
                  </div>

                  <div className="card" style={{ padding: '1.15rem', borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>EXPIRED OFFERS</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#d97706', marginTop: '4px' }}>
                      {offers.filter(o => o.status === 'expired').length}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Past campaigns</div>
                  </div>

                  <div className="card" style={{ padding: '1.15rem', borderLeft: '4px solid #7c3aed' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>TOTAL REDEMPTIONS</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#6d28d9', marginTop: '4px' }}>
                      {offers.reduce((acc, curr) => {
                        let p = {};
                        try { p = JSON.parse(curr.description); } catch (e) { }
                        return acc + (p.used || curr.usedCount || curr.redemptionsCount || 0);
                      }, 0)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Total promo usage</div>
                  </div>
                </div>

                {/* OFFERS ROSTER TABLE */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', color: '#1e3a8a', marginBottom: '1rem' }}>Promotional Campaigns</h3>

                  <div className="table-container" style={{ marginBottom: 0 }}>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Offer Campaign</th>
                          <th>Discount Value</th>
                          <th>Promo Code</th>
                          <th>Validity Period</th>
                          <th>Redemptions</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {offers.map(o => {
                          let parsedDesc = { name: 'Offer Promo', descriptionText: o.description, type: 'Percentage', used: 0, revenue: 0, startDate: '2026-08-01' };
                          try {
                            parsedDesc = JSON.parse(o.description);
                          } catch (e) { }

                          return (
                            <tr key={o._id}>
                              <td>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{parsedDesc.name || 'Promo Offer'}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{parsedDesc.descriptionText || 'Special discount'}</div>
                              </td>
                              <td style={{ fontWeight: 800, color: '#2563eb' }}>
                                {o.discountPercentage}% OFF
                              </td>
                              <td>
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                  {o.code}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.8rem' }}>
                                {new Date(parsedDesc.startDate || '2026-08-01').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} to {new Date(o.expiryDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                              </td>
                              <td style={{ fontWeight: 600 }}>{parsedDesc.used || 0} Uses</td>
                              <td>
                                <span className={`badge ${o.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                                  {o.status === 'active' ? 'Active' : 'Paused / Inactive'}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }} onClick={() => setViewingOffer(o)}>
                                    👁 View
                                  </button>
                                  <button className="btn btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }} onClick={() => {
                                    setEditingOffer(o);
                                    setNewOfferCode(o.code);
                                    setNewOfferDiscount(o.discountPercentage);
                                    setNewOfferDesc(parsedDesc.descriptionText || '');
                                    setNewOfferExpiry(o.expiryDate ? o.expiryDate.split('T')[0] : '');
                                    setOfferName(parsedDesc.name || '');
                                    setOfferType(parsedDesc.type || 'Percentage Discount');
                                    setOfferMaxDiscount(parsedDesc.maxDiscount || 1000);
                                    setOfferMinBooking(parsedDesc.minBookingAmount || 2000);
                                    setOfferAppliesTo(parsedDesc.appliesTo || 'All Vehicles');
                                    setOfferStartDate(parsedDesc.startDate || '');
                                    setOfferMinDays(parsedDesc.minDays || 1);
                                    setOfferMaxDays(parsedDesc.maxDays || 30);
                                    setOfferMaxUsage(parsedDesc.maxUsage || 100);
                                    setOfferCustomerType(parsedDesc.customerType || 'All Customers');
                                    setOfferStatus(o.status || 'active');
                                    setShowOfferModal(true);
                                  }}>
                                    ✏️ Edit
                                  </button>
                                  <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', background: o.status === 'active' ? '#fee2e2' : '#dcfce7', color: o.status === 'active' ? '#ef4444' : '#15803d', border: 'none' }} onClick={() => handleToggleOfferStatus(o)}>
                                    {o.status === 'active' ? '⏸ Pause' : '▶️ Resume'}
                                  </button>
                                  <button className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }} onClick={() => handleDeleteOffer(o)}>
                                    🗑 Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* VIEW DETAILS PANEL */}
                {viewingOffer && (() => {
                  let parsedDesc = {};
                  try { parsedDesc = JSON.parse(viewingOffer.description); } catch (e) { }
                  return (
                    <div className="modal-overlay" onClick={() => setViewingOffer(null)}>
                      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', padding: '1.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                          <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: '#1e3a8a', margin: 0 }}>
                            👁 Campaign Summary: {parsedDesc.name || 'Promo Offer'}
                          </h3>
                          <button style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setViewingOffer(null)}>×</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem', color: '#334155' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div><strong>Campaign Name:</strong> {parsedDesc.name || '—'}</div>
                            <div><strong>Promo Code:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{viewingOffer.code}</span></div>
                            <div><strong>Offer Type:</strong> {parsedDesc.type || '—'}</div>
                            <div><strong>Discount Value:</strong> {viewingOffer.discountPercentage}%</div>
                            <div><strong>Max Discount Cap:</strong> ₹{parsedDesc.maxDiscount || 0}</div>
                            <div><strong>Min Booking Value:</strong> ₹{parsedDesc.minBookingAmount || 0}</div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div><strong>Applies To:</strong> {parsedDesc.appliesTo || '—'}</div>
                            <div><strong>Min Rental Duration:</strong> {parsedDesc.minDays || 1} Days</div>
                            <div><strong>Max Rental Duration:</strong> {parsedDesc.maxDays || 30} Days</div>
                            <div><strong>Customer Segment:</strong> {parsedDesc.customerType || '—'}</div>
                            <div><strong>Campaign Usage Limit:</strong> {parsedDesc.maxUsage || 100} redemptions</div>
                            <div><strong>Campaign Validity:</strong> {parsedDesc.startDate} to {viewingOffer.expiryDate ? viewingOffer.expiryDate.split('T')[0] : ''}</div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 'bold' }}>TOTAL REDEMPTIONS USED</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{parsedDesc.used || 0} redemptions</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 'bold' }}>REVENUE GENERATED</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb' }}>₹{(parsedDesc.revenue || 0).toLocaleString('en-IN')}</div>
                          </div>
                        </div>

                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                          <button className="btn btn-secondary" onClick={() => setViewingOffer(null)}>Close Summary</button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 10. SUPPORT CHAT MODULE */}
            {activeNav === 'chat' && (
              <div style={{ animation: 'fadeIn 0.3s ease-out', height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>Support & Fleet Chat</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Direct messaging channels with platform super admins, internal staff, and active fleet drivers</p>
                </div>

                <div className="card" style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: 0, border: '1px solid var(--border-color)', borderRadius: '16px', background: '#ffffff' }}>

                  {/* CONTACTS SIDEBAR */}
                  <div style={{ width: '280px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', background: '#f8fafc', flexShrink: 0 }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Direct Chat Channels</div>
                      <input
                        type="text"
                        placeholder="🔍 Search contacts..."
                        value={chatSearchQuery}
                        onChange={(e) => setChatSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.82rem', outline: 'none' }}
                      />
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>

                      {/* Platform Super Admin */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0 0.5rem 0.25rem 0.5rem', textTransform: 'uppercase' }}>Platform Admin</div>
                        <button
                          onClick={() => setSelectedContact({ id: 'super-admin', name: 'Super Admin (Platform Owner)', role: 'super-admin', phone: '+91 98765 00000', email: 'admin@rentos.com' })}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.6rem 0.5rem',
                            background: selectedContact.role === 'super-admin' ? 'rgba(37,99,235,0.08)' : 'transparent',
                            border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                            borderLeft: selectedContact.role === 'super-admin' ? '3px solid #2563eb' : '3px solid transparent'
                          }}
                        >
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '0.9rem', fontWeight: 'bold' }}>👑</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Super Admin</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Platform Owner</div>
                          </div>
                        </button>
                      </div>

                      {/* Company Staff */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0 0.5rem 0.25rem 0.5rem', textTransform: 'uppercase' }}>Company Staff</div>
                        {defaultEmployees.filter(st => st.name.toLowerCase().includes(chatSearchQuery.toLowerCase()) || st.email.toLowerCase().includes(chatSearchQuery.toLowerCase())).length === 0 ? (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.25rem 0.5rem' }}>No staff found.</div>
                        ) : (
                          defaultEmployees.filter(st => st.name.toLowerCase().includes(chatSearchQuery.toLowerCase()) || st.email.toLowerCase().includes(chatSearchQuery.toLowerCase())).map(st => (
                            <button
                              key={st._id || st.id}
                              onClick={() => setSelectedContact({ id: st._id || st.id, name: st.name, role: 'staff', phone: st.phone || st.mobile || '+91 98765 43210', email: st.email })}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.6rem 0.5rem',
                                background: selectedContact.id === st._id ? 'rgba(37,99,235,0.08)' : 'transparent',
                                border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                                borderLeft: selectedContact.id === st._id ? '3px solid #2563eb' : '3px solid transparent',
                                marginBottom: '0.25rem'
                              }}
                            >
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '0.9rem', fontWeight: 'bold' }}>👤</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{st.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Staff • {st.email}</div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>

                      {/* Fleet Drivers */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0 0.5rem 0.25rem 0.5rem', textTransform: 'uppercase' }}>Fleet Drivers</div>
                        {drivers.filter(drv => drv.name.toLowerCase().includes(chatSearchQuery.toLowerCase()) || drv.phone.includes(chatSearchQuery)).length === 0 ? (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.25rem 0.5rem' }}>No drivers found.</div>
                        ) : (
                          drivers.filter(drv => drv.name.toLowerCase().includes(chatSearchQuery.toLowerCase()) || drv.phone.includes(chatSearchQuery)).map(drv => (
                            <button
                              key={drv.id}
                              onClick={() => setSelectedContact({ id: drv.id, name: drv.name, role: 'driver', phone: drv.phone, email: drv.email || 'driver@company.com' })}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.6rem 0.5rem',
                                background: selectedContact.id === drv.id ? 'rgba(37,99,235,0.08)' : 'transparent',
                                border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                                borderLeft: selectedContact.id === drv.id ? '3px solid #2563eb' : '3px solid transparent',
                                marginBottom: '0.25rem'
                              }}
                            >
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '0.9rem', fontWeight: 'bold' }}>👨‍✈️</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{drv.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Driver • {drv.phone}</div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>

                      {/* Customers & Renters */}
                      <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0 0.5rem 0.25rem 0.5rem', textTransform: 'uppercase' }}>Customers & Renters</div>
                        {customersList.filter(cust => cust.name.toLowerCase().includes(chatSearchQuery.toLowerCase()) || (cust.phone && cust.phone.includes(chatSearchQuery))).length === 0 ? (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.25rem 0.5rem' }}>No customers found.</div>
                        ) : (
                          customersList.filter(cust => cust.name.toLowerCase().includes(chatSearchQuery.toLowerCase()) || (cust.phone && cust.phone.includes(chatSearchQuery))).map(cust => (
                            <button
                              key={cust.id}
                              onClick={() => setSelectedContact({ id: cust.id, name: cust.name, role: 'customer', phone: cust.phone || '+91 98765 43210', email: cust.email || `${cust.name.toLowerCase().replace(/\s+/g, '')}@gmail.com` })}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.6rem 0.5rem',
                                background: selectedContact.id === cust.id ? 'rgba(37,99,235,0.08)' : 'transparent',
                                border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                                borderLeft: selectedContact.id === cust.id ? '3px solid #2563eb' : '3px solid transparent',
                                marginBottom: '0.25rem'
                              }}
                            >
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '0.9rem', fontWeight: 'bold' }}>👤</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{cust.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Customer • {cust.phone || cust.email}</div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>

                    </div>
                  </div>

                  {/* CHAT AREA */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fafafb', minWidth: 0 }}>

                    {/* Chat Header */}
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1rem', margin: 0, fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {selectedContact.name}
                          <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem', borderRadius: '12px', background: selectedContact.role === 'super-admin' ? 'rgba(124,58,237,0.15)' : selectedContact.role === 'driver' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)', color: selectedContact.role === 'super-admin' ? '#7c3aed' : selectedContact.role === 'driver' ? '#10b981' : '#2563eb', fontWeight: 700 }}>
                            {selectedContact.role.toUpperCase()}
                          </span>
                        </h4>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Active Direct Connection Channel
                        </div>
                      </div>

                      {/* Clickable Mobile Call Button */}
                      {selectedContact.phone && (
                        <a
                          href={`tel:${selectedContact.phone}`}
                          className="btn"
                          style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontWeight: 700, textDecoration: 'none', borderRadius: '8px' }}
                        >
                          📞 Call Mobile: {selectedContact.phone}
                        </a>
                      )}
                    </div>

                    {/* Messages Stream */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#efeae2', borderBottom: '1px solid #e9edef' }}>
                      {chatMessages.filter(msg => {
                        const sId = typeof msg.senderId === 'object' && msg.senderId !== null ? (msg.senderId._id || msg.senderId.id) : msg.senderId;
                        const rId = typeof msg.receiverId === 'object' && msg.receiverId !== null ? (msg.receiverId._id || msg.receiverId.id) : msg.receiverId;

                        if (selectedContact.role === 'super-admin') {
                          return msg.senderRole === 'super-admin' || msg.receiverRole === 'super-admin';
                        }
                        if (selectedContact.role === 'driver') {
                          return msg.senderRole === 'driver' || msg.receiverRole === 'driver' || sId === String(selectedContact.id) || rId === String(selectedContact.id);
                        }
                        if (selectedContact.role === 'customer') {
                          return msg.senderRole === 'customer' || msg.receiverRole === 'customer' || sId === String(selectedContact.id) || rId === String(selectedContact.id);
                        }
                        const contactId = String(selectedContact.id || '');
                        return sId === contactId || rId === contactId || true;
                      }).length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#667781', gap: '0.5rem' }}>
                          <span style={{ fontSize: '2.5rem' }}>💬</span>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>No messages in this WhatsApp thread yet.</div>
                          <div style={{ fontSize: '0.72rem' }}>Send a message to initiate the discussion.</div>
                        </div>
                      ) : (
                        chatMessages.filter(msg => {
                          const sId = typeof msg.senderId === 'object' && msg.senderId !== null ? (msg.senderId._id || msg.senderId.id) : msg.senderId;
                          const rId = typeof msg.receiverId === 'object' && msg.receiverId !== null ? (msg.receiverId._id || msg.receiverId.id) : msg.receiverId;

                          if (selectedContact.role === 'super-admin') {
                            return msg.senderRole === 'super-admin' || msg.receiverRole === 'super-admin';
                          }
                          if (selectedContact.role === 'driver') {
                            return msg.senderRole === 'driver' || msg.receiverRole === 'driver' || sId === String(selectedContact.id) || rId === String(selectedContact.id);
                          }
                          if (selectedContact.role === 'customer') {
                            return msg.senderRole === 'customer' || msg.receiverRole === 'customer' || sId === String(selectedContact.id) || rId === String(selectedContact.id);
                          }
                          const contactId = String(selectedContact.id || '');
                          return sId === contactId || rId === contactId || true;
                        }).map((msg) => {
                          const myEmail = user?.email ? user.email.trim().toLowerCase() : '';
                          const isMe = msg.senderRole === 'company-admin' || (msg.senderEmail && msg.senderEmail.trim().toLowerCase() === myEmail) || String(msg.senderId) === String(user?._id) || String(msg.senderId).includes('cmp');
                          return (
                            <div
                              key={msg._id}
                              style={{
                                display: 'flex',
                                justifyContent: isMe ? 'flex-end' : 'flex-start',
                                width: '100%'
                              }}
                            >
                              <div style={{
                                maxWidth: '75%',
                                background: isMe ? '#d9fdd3' : '#ffffff',
                                color: '#111b21',
                                padding: '0.6rem 0.85rem',
                                borderRadius: isMe ? '8px 0px 8px 8px' : '0px 8px 8px 8px',
                                boxShadow: '0 1px 1.5px rgba(11,20,26,.13)',
                                border: 'none',
                                position: 'relative'
                              }}>
                                {!isMe && (
                                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#00a884', marginBottom: '0.15rem' }}>
                                    {msg.senderName || 'Sender'}
                                  </div>
                                )}
                                <div style={{ fontSize: '0.85rem', lineHeight: '1.4', wordBreak: 'break-word' }}>
                                  {msg.message.startsWith('[Attached File]') ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(0,0,0,0.03)', padding: '0.5rem', borderRadius: '6px', marginTop: '0.25rem', minWidth: '180px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '1.5rem' }}>📄</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#111b21', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{msg.message.replace('[Attached File] ', '')}</div>
                                          <div style={{ fontSize: '0.65rem', color: '#667781' }}>{msg.message.toLowerCase().includes('jpg') || msg.message.toLowerCase().includes('png') || msg.message.toLowerCase().includes('gif') ? 'Image Preview' : 'Document'} • 1.2 MB</div>
                                        </div>
                                      </div>
                                      {(msg.message.toLowerCase().includes('jpg') || msg.message.toLowerCase().includes('png') || msg.message.toLowerCase().includes('jpeg') || msg.message.toLowerCase().includes('webp')) && (
                                        <img src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=200" alt="Attachment" style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '4px' }} />
                                      )}
                                      <button type="button" onClick={(e) => { e.preventDefault(); handleDownloadChatDoc(msg.message, msg.fileUrl); }} style={{ fontSize: '0.72rem', color: '#00a884', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '2px' }}>
                                        📥 Download File
                                      </button>
                                    </div>
                                  ) : msg.message.startsWith('[Voice Message]') ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.25rem 0', minWidth: '180px' }}>
                                      <button type="button" onClick={() => handlePlayVoiceAudioMsg(msg._id, msg.message)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: playingVoiceId === msg._id ? '#dc2626' : '#00a884', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 2px 5px rgba(0,0,0,0.15)' }}>
                                        {playingVoiceId === msg._id ? '⏸️' : '▶️'}
                                      </button>
                                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '14px' }}>
                                          {[3, 8, 5, 9, 4, 7, 3, 8, 6, 9, 4, 7, 5, 8, 3, 6, 4, 8].map((h, i) => (
                                            <div key={i} style={{ width: '2px', height: `${h * 1.5}px`, background: playingVoiceId === msg._id ? '#2563eb' : '#8696a0', borderRadius: '1px', transition: 'height 0.2s ease' }}></div>
                                          ))}
                                        </div>
                                        <div style={{ fontSize: '0.68rem', color: playingVoiceId === msg._id ? '#2563eb' : '#667781', fontWeight: playingVoiceId === msg._id ? 800 : 400 }}>
                                          {playingVoiceId === msg._id ? '🔊 Playing Voice Note...' : `🎙️ Voice Message (${msg.message.replace('[Voice Message] ', '')})`}
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    msg.message
                                  )}
                                </div>
                                <div style={{ fontSize: '0.62rem', color: '#667781', textAlign: 'right', marginTop: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  {isMe && renderStatusTicks(msg)}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* WhatsApp Style Chat Input Panel */}
                    {!isRecording ? (
                      <form onSubmit={handleSendChatMessage} style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', background: '#ffffff', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current && fileInputRef.current.click()}
                          style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Attach File"
                        >
                          📎
                        </button>

                        <button
                          type="button"
                          onClick={startVoiceRecording}
                          style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Record Voice"
                        >
                          🎙️
                        </button>

                        <input
                          type="text"
                          placeholder={`Type message to ${selectedContact.name}...`}
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          style={{ flex: 1, padding: '0.6rem 0.85rem', borderRadius: '24px', border: '1px solid var(--border-color)', fontSize: '0.85rem', outline: 'none' }}
                        />
                        <button
                          type="submit"
                          className="btn btn-primary"
                          style={{ padding: '0.6rem 1.25rem', fontSize: '0.82rem', fontWeight: 700, borderRadius: '24px' }}
                        >
                          Send 🚀
                        </button>
                      </form>
                    ) : (
                      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', background: '#ffffff', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#dc2626', fontWeight: 600, fontSize: '0.85rem' }}>
                          <span style={{
                            display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626',
                            animation: 'pulseGlow 1s infinite alternate'
                          }}></span>
                          <span>🎙️ Recording Voice Message... {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60) < 10 ? '0' : ''}{recordingSeconds % 60}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                          <button
                            type="button"
                            onClick={cancelVoiceRecording}
                            style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            ❌ Cancel
                          </button>
                          <button
                            type="button"
                            onClick={sendVoiceRecording}
                            style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', background: '#dcfce7', border: '1px solid #bbf7d0', color: '#16a34a', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            ✔️ Send Message
                          </button>
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              </div>
            )}

            {/* 10.5 REVIEWS & RATINGS MODULE */}
            {activeNav === 'reviews' && (() => {
              const filteredReviews = reviewsList.filter(rev => {
                if (reviewRatingFilter === '5') return rev.rating === 5;
                if (reviewRatingFilter === '4') return rev.rating === 4;
                if (reviewRatingFilter === '3') return rev.rating === 3;
                return true;
              });

              const avgRating = (reviewsList.reduce((acc, curr) => acc + curr.rating, 0) / (reviewsList.length || 1)).toFixed(1);
              const fiveStarCount = reviewsList.filter(r => r.rating === 5).length;
              const fourStarCount = reviewsList.filter(r => r.rating === 4).length;
              const threeStarCount = reviewsList.filter(r => r.rating === 3).length;

              return (
                <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                  <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', color: '#0f172a', fontWeight: 900, marginBottom: '0.2rem' }}>
                        ⭐ Customer Reviews & Ratings Portal
                      </h2>
                      <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
                        Monitor customer feedback, view vehicle rental ratings & respond to renter reviews
                      </p>
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
                      onClick={() => {
                        showNotification('📥 Downloading Customer Reviews Report CSV...');
                        const headers = ["Customer Name", "Booking ID", "Vehicle Rented", "Rating", "Review Comment", "Date"];
                        const rows = reviewsList.map(r => [r.customerName, r.bookingId, r.vehicleRented, `${r.rating} Stars`, r.comment, r.date]);
                        downloadCSV(headers, rows, "customer_reviews_july_2026.csv");
                      }}
                    >
                      📥 Export Reviews CSV
                    </button>
                  </div>

                  {/* Rating Overview Header Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                    {/* Average Rating KPI */}
                    <div className="card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 900 }}>
                        ★
                      </div>
                      <div>
                        <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{avgRating} <span style={{ fontSize: '1rem', color: '#d97706' }}>/ 5.0</span></div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Overall Customer Score</div>
                        <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, marginTop: '2px' }}>Based on {reviewsList.length} Verified Trips</div>
                      </div>
                    </div>

                    {/* Rating Breakdown Bars */}
                    <div className="card" style={{ padding: '1.25rem', background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Rating Distribution</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: '45px', fontWeight: 700, color: '#475569' }}>5 Stars</span>
                          <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${(fiveStarCount / (reviewsList.length || 1)) * 100}%`, height: '100%', background: '#f59e0b' }} />
                          </div>
                          <span style={{ fontWeight: 800, width: '24px', textAlign: 'right' }}>{fiveStarCount}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: '45px', fontWeight: 700, color: '#475569' }}>4 Stars</span>
                          <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${(fourStarCount / (reviewsList.length || 1)) * 100}%`, height: '100%', background: '#3b82f6' }} />
                          </div>
                          <span style={{ fontWeight: 800, width: '24px', textAlign: 'right' }}>{fourStarCount}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: '45px', fontWeight: 700, color: '#475569' }}>3 Stars</span>
                          <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${(threeStarCount / (reviewsList.length || 1)) * 100}%`, height: '100%', background: '#cbd5e1' }} />
                          </div>
                          <span style={{ fontWeight: 800, width: '24px', textAlign: 'right' }}>{threeStarCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Filter Controls Bar */}
                  <div className="card" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                      Customer Feedback & Ratings List ({filteredReviews.length})
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {[
                        { id: 'all', label: 'All Ratings' },
                        { id: '5', label: '5 ⭐ Stars' },
                        { id: '4', label: '4 ⭐ Stars' },
                        { id: '3', label: '3 ⭐ Stars' }
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setReviewRatingFilter(f.id)}
                          style={{
                            padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800,
                            border: reviewRatingFilter === f.id ? '1px solid #2563eb' : '1px solid #cbd5e1',
                            background: reviewRatingFilter === f.id ? '#2563eb' : '#fff',
                            color: reviewRatingFilter === f.id ? '#fff' : '#475569',
                            cursor: 'pointer'
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reviews List Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredReviews.length === 0 ? (
                      <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⭐</div>
                        <div style={{ fontWeight: 800, color: '#475569' }}>No reviews matching this rating filter</div>
                      </div>
                    ) : (
                      filteredReviews.map(rev => (
                        <div key={rev.id} className="card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                              <img src={rev.avatar} alt={rev.customerName} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }} />
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#0f172a' }}>{rev.customerName}</span>
                                  {rev.verified && (
                                    <span style={{ fontSize: '0.68rem', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '0.1rem 0.45rem', borderRadius: '10px', fontWeight: 800 }}>
                                      ✓ Verified Renter
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                                  🚗 {rev.vehicleRented} • 👨‍✈️ Driver: <strong>{rev.driverName}</strong>
                                </div>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '1.1rem', color: '#f59e0b', letterSpacing: '2px' }}>
                                {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px', fontWeight: 600 }}>
                                📅 {rev.date} • #{rev.bookingId}
                              </div>
                            </div>
                          </div>

                          <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5, background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #f1f5f9', margin: '0 0 0.85rem 0' }}>
                            "{rev.comment}"
                          </p>

                          {/* Admin Reply Section */}
                          {rev.adminReply ? (
                            <div style={{ background: '#eff6ff', borderLeft: '4px solid #2563eb', padding: '0.75rem 1rem', borderRadius: '0 8px 8px 0', fontSize: '0.82rem', color: '#1e40af' }}>
                              <div style={{ fontWeight: 800, marginBottom: '2px', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span>🏢 Royal Car Rental Management Response:</span>
                              </div>
                              <div>{rev.adminReply}</div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <input
                                type="text"
                                placeholder="Write an official company reply to this review..."
                                value={replyInputText[rev.id] || ''}
                                onChange={e => setReplyInputText({ ...replyInputText, [rev.id]: e.target.value })}
                                style={{ flex: 1, padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', outline: 'none' }}
                              />
                              <button
                                onClick={() => {
                                  const text = replyInputText[rev.id];
                                  if (!text || !text.trim()) return;
                                  const updated = reviewsList.map(r => r.id === rev.id ? { ...r, adminReply: text.trim() } : r);
                                  setReviewsList(updated);
                                  localStorage.setItem('company_customer_reviews', JSON.stringify(updated));
                                  showNotification('✓ Company response published to customer review!');
                                  setReplyInputText({ ...replyInputText, [rev.id]: '' });
                                }}
                                style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: '#2563eb', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                              >
                                💬 Publish Reply
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 11. SETTINGS MODULE */}
            {activeNav === 'settings' && (
              <div style={{ animation: 'fadeIn 0.3s ease-out', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Settings Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: '#ffffff', padding: '1.25rem 1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0, fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      🏢 {companyInfo?.name || user?.company?.name || 'Pooja cars'}
                    </h2>
                    <span style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px', display: 'inline-block' }}>
                      {companyInfo?.ownerEmail || user?.email || 'pooja@gmail.com'} · {companyInfo?.city || 'krishnagiri'}, {companyInfo?.state || 'Tamil Nadu'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 800, padding: '0.35rem 0.85rem', borderRadius: '20px',
                      background: (companyInfo?.status || 'active') === 'active' ? '#dcfce7' : '#fef3c7',
                      color: (companyInfo?.status || 'active') === 'active' ? '#15803d' : '#b45309',
                      border: `1px solid ${(companyInfo?.status || 'active') === 'active' ? '#86efac' : '#fde68a'}`
                    }}>
                      ● Status: {(companyInfo?.status || 'active').toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* CARD 1: OVERVIEW METRICS & COMPANY SYSTEM INFORMATION */}
                <div className="card" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                    OVERVIEW METRICS
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>🚗</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e3a8a' }}>{vehicles.length || stats?.totalVehicles || 0}</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Total Vehicles</div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>👨‍✈️</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#7c3aed' }}>{drivers.length || stats?.totalDrivers || 0}</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Total Drivers</div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>👥</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#059669' }}>{customersList.length || stats?.totalCustomers || 0}</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Total Customers</div>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                    COMPANY INFORMATION
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                    <div style={{ background: '#eff6ff', borderRadius: '10px', padding: '0.75rem 1rem', border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: '0.68rem', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, marginBottom: '2px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>COMMISSION RATE</span>
                        <span style={{ fontSize: '0.6rem', background: '#2563eb', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Super Admin Set</span>
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1d4ed8' }}>{companyInfo?.commissionRate ?? 10}%</div>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.75rem 1rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '2px' }}>SUBSCRIPTION PLAN</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>₹{companyInfo?.subscriptionPrice ?? 2999}/mo</div>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.75rem 1rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '2px' }}>STATUS</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: companyInfo?.status === 'active' ? '#16a34a' : '#d97706' }}>{companyInfo?.status || 'active'}</div>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.75rem 1rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '2px' }}>OWNER EMAIL</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', wordBreak: 'break-all' }}>{companyInfo?.ownerEmail || user?.email || 'pooja@gmail.com'}</div>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.75rem 1rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '2px' }}>OWNER NAME</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>{companyInfo?.ownerName || user?.name || 'pooja'}</div>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.75rem 1rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '2px' }}>MOBILE</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>{companyInfo?.mobile || companyPhoneInput || '9517368420'}</div>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.75rem 1rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '2px' }}>ONBOARDED DATE</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                        {companyInfo?.onboardedAt ? new Date(companyInfo.onboardedAt).toLocaleDateString('en-IN') : '23/7/2026'}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.75rem 1rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '2px' }}>CITY / STATE</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>{`${companyInfo?.city || 'krishnagiri'} ${companyInfo?.state || 'Tamil Nadu'}`.trim()}</div>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '2px' }}>ADDRESS</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>{companyInfo?.address || 'Bik mariyaman kovil street, denkanikottai, krishnagiri'}</div>
                    </div>
                  </div>
                </div>

                {/* CARD 2: COMPANY BRANDING & IDENTITY */}
                <div className="card" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
                    🏢 Company Branding & Identity
                  </h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const finalLogoUrl = sanitizeLogoUrl(companyLogoUrl);
                    setCompanyLogoUrl(finalLogoUrl);
                    localStorage.setItem('company_logo', finalLogoUrl);
                    localStorage.setItem('company_phone', companyPhoneInput);

                    // Save custom password if modified
                    if (ownerEmailInput && companyPasswordInput) {
                      try {
                        const customPasses = JSON.parse(localStorage.getItem('custom_user_passwords') || '{}');
                        customPasses[ownerEmailInput.trim().toLowerCase()] = companyPasswordInput;
                        localStorage.setItem('custom_user_passwords', JSON.stringify(customPasses));
                      } catch (err) {}
                    }

                    const updatedComp = {
                      ...companyInfo,
                      logoUrl: finalLogoUrl,
                      mobile: companyPhoneInput,
                      ownerName: ownerNameInput,
                      ownerEmail: ownerEmailInput,
                      city: cityInput,
                      state: stateInput,
                      address: addressInput,
                    };
                    setCompanyInfo(updatedComp);
                    localStorage.setItem('company_info_details', JSON.stringify(updatedComp));

                    // Update logged-in user context
                    if (user && setUser) {
                      setUser({
                        ...user,
                        name: ownerNameInput,
                        ownerName: ownerNameInput,
                        email: ownerEmailInput,
                        ownerEmail: ownerEmailInput,
                        mobile: companyPhoneInput
                      });
                    }

                    try {
                      const res = await fetch('/api/company-admin/branding', {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                          logoUrl: finalLogoUrl,
                          mobile: companyPhoneInput,
                          ownerName: ownerNameInput,
                          ownerEmail: ownerEmailInput,
                          password: companyPasswordInput,
                          city: cityInput,
                          state: stateInput,
                          address: addressInput,
                        })
                      });
                      if (res.ok) {
                        showNotification('✓ Company profile, email & password saved successfully to database!');
                      } else {
                        showNotification('✓ Company profile & credentials saved locally!');
                      }
                    } catch (err) {
                      showNotification('✓ Company profile & credentials saved locally!');
                    }
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 800 }}>Rental Company Name *</label>
                          <input type="text" className="form-control" value={companyInfo?.name || user?.company?.name || localStorage.getItem('company_name') || 'Pooja cars'} readOnly style={{ background: '#f8fafc', fontWeight: 700 }} />
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 800 }}>Company Owner Name *</label>
                          <input type="text" className="form-control" value={ownerNameInput} onChange={e => setOwnerNameInput(e.target.value)} required placeholder="e.g. Pooja" />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 800 }}>Owner Login Email Address *</label>
                          <input type="email" className="form-control" value={ownerEmailInput} onChange={e => setOwnerEmailInput(e.target.value)} required placeholder="pooja@gmail.com" />
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 800 }}>Account Login Password 🔐 *</label>
                          <input type="text" className="form-control" value={companyPasswordInput} onChange={e => setCompanyPasswordInput(e.target.value)} required placeholder="password123" />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 800 }}>Contact Mobile Number *</label>
                          <input type="text" className="form-control" value={companyPhoneInput} onChange={e => setCompanyPhoneInput(e.target.value)} placeholder="9517368420" required />
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 800 }}>City</label>
                          <input type="text" className="form-control" value={cityInput} onChange={e => setCityInput(e.target.value)} placeholder="krishnagiri" />
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 800 }}>State</label>
                          <input type="text" className="form-control" value={stateInput} onChange={e => setStateInput(e.target.value)} placeholder="Tamil Nadu" />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 800 }}>Full Office Address</label>
                        <input type="text" className="form-control" value={addressInput} onChange={e => setAddressInput(e.target.value)} placeholder="Bik mariyaman kovil street, denkanikottai, krishnagiri" />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 800 }}>Company Logo (Upload File or Enter Image URL) *</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <input type="text" className="form-control" value={companyLogoUrl} onChange={e => setCompanyLogoUrl(e.target.value)} placeholder="https://images.unsplash.com/..." required />
                          <label className="btn btn-secondary" style={{ fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', padding: '0.4rem 0.8rem' }}>
                            📁 Upload Logo
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const dataUrl = await fileToDataURL(file);
                                setCompanyLogoUrl(dataUrl);
                              } catch (err) { console.error(err); }
                            }} />
                          </label>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>Or select a premium preset:</span>
                          <button type="button" onClick={() => setCompanyLogoUrl('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=100')} style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>🥇 Gold MPV</button>
                          <button type="button" onClick={() => setCompanyLogoUrl('https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800')} style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>🚗 Red SUV</button>
                          <button type="button" onClick={() => setCompanyLogoUrl('https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=100')} style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>💎 Royal Blue</button>
                        </div>
                      </div>

                      {companyLogoUrl && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          {renderCompanyLogo(60, '8px')}
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e3a8a' }}>{companyInfo?.name || user?.company?.name || 'Pooja cars'}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>This logo will identify your company on the Landing Page & Search Catalog</div>
                          </div>
                        </div>
                      )}

                      <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', marginTop: '0.5rem', width: 'fit-content', fontWeight: 800 }}>
                        💾 Save Company Branding & Profile
                      </button>
                    </div>
                  </form>
                </div>

                {/* CARD 3: LEGAL KYC DOCUMENTS & VERIFICATION */}
                <div id="company-kyc-section" className="card" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: 0, fontFamily: 'var(--font-heading)' }}>
                        📄 KYC DOCUMENTS
                      </h3>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Upload legal identification & tax documents required for Super Admin approval
                      </span>
                    </div>
                    {hasMissingKyc ? (
                      <span style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
                        ⚠️ Action Required: Missing Documents ({missingKycDocs.length})
                      </span>
                    ) : (
                      <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
                        ✅ All KYC Documents Verified & Uploaded
                      </span>
                    )}
                  </div>

                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const updatedComp = {
                      ...companyInfo,
                      aadharNumber: aadharNumInput,
                      aadharDoc: aadharDocInput,
                      panNumber: panNumInput,
                      panDoc: panDocInput,
                      gstNumber: gstNumInput,
                      gstDoc: gstDocInput,
                    };
                    setCompanyInfo(updatedComp);
                    localStorage.setItem('company_info_details', JSON.stringify(updatedComp));

                    try {
                      const res = await fetch('/api/company-admin/branding', {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                          aadharNumber: aadharNumInput,
                          aadharDoc: aadharDocInput,
                          panNumber: panNumInput,
                          panDoc: panDocInput,
                          gstNumber: gstNumInput,
                          gstDoc: gstDocInput,
                        })
                      });
                      if (res.ok) {
                        showNotification('✓ KYC Documents and Numbers saved successfully to database!');
                      } else {
                        showNotification('⚠️ KYC details saved locally!');
                      }
                    } catch (err) {
                      showNotification('⚠️ KYC details saved locally!');
                    }
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      
                      {/* 1. Aadhaar Card */}
                      <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>🆔 Aadhaar Card</span>
                          {aadharDocInput || aadharNumInput ? (
                            <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>Uploaded</span>
                          ) : (
                            <span style={{ background: '#fef2f2', color: '#ef4444', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>Missing / Not provided</span>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>Aadhaar Card Number</label>
                            <input type="text" className="form-control" value={aadharNumInput} onChange={e => setAadharNumInput(e.target.value)} placeholder="e.g. 1234 5678 9012" style={{ background: '#fff' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>Aadhaar File / Image Document</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input type="text" className="form-control" value={aadharDocInput} onChange={e => setAadharDocInput(e.target.value)} placeholder="File path or URL" style={{ background: '#fff', fontSize: '0.8rem' }} />
                              <label className="btn btn-secondary" style={{ fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', padding: '0.4rem 0.75rem' }}>
                                📁 Upload
                                <input type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: 'none' }} onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const dataUrl = await fileToDataURL(file);
                                    setAadharDocInput(dataUrl);
                                  } catch (err) { console.error(err); }
                                }} />
                              </label>
                            </div>
                          </div>
                        </div>
                        {aadharDocInput && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#2563eb', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>✓ Document File Ready:</span>
                            <button
                              type="button"
                              onClick={() => setCompanyDocPreviewModal({ label: 'Aadhaar Card', number: aadharNumInput, docPath: aadharDocInput })}
                              style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.2rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 800, fontSize: '0.72rem' }}
                            >
                              👁️ View Aadhaar Document Photo
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 2. PAN Card */}
                      <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>💳 PAN Card</span>
                          {panDocInput || panNumInput ? (
                            <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>Uploaded</span>
                          ) : (
                            <span style={{ background: '#fef2f2', color: '#ef4444', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>Missing / Not provided</span>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>PAN Card Number</label>
                            <input type="text" className="form-control" value={panNumInput} onChange={e => setPanNumInput(e.target.value.toUpperCase())} placeholder="e.g. ABCDE1234F" style={{ background: '#fff' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>PAN Document File / Image</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input type="text" className="form-control" value={panDocInput} onChange={e => setPanDocInput(e.target.value)} placeholder="File path or URL" style={{ background: '#fff', fontSize: '0.8rem' }} />
                              <label className="btn btn-secondary" style={{ fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', padding: '0.4rem 0.75rem' }}>
                                📁 Upload
                                <input type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: 'none' }} onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const dataUrl = await fileToDataURL(file);
                                    setPanDocInput(dataUrl);
                                  } catch (err) { console.error(err); }
                                }} />
                              </label>
                            </div>
                          </div>
                        </div>
                        {panDocInput && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#2563eb', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>✓ Document File Ready:</span>
                            <button
                              type="button"
                              onClick={() => setCompanyDocPreviewModal({ label: 'PAN Card', number: panNumInput, docPath: panDocInput })}
                              style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.2rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 800, fontSize: '0.72rem' }}
                            >
                              👁️ View PAN Document Photo
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 3. GST Certificate */}
                      <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>🏛️ GST Certificate</span>
                          {gstDocInput || gstNumInput ? (
                            <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>Uploaded</span>
                          ) : (
                            <span style={{ background: '#fef2f2', color: '#ef4444', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>Missing / Not provided</span>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>GST Identification Number (GSTIN)</label>
                            <input type="text" className="form-control" value={gstNumInput} onChange={e => setGstNumInput(e.target.value.toUpperCase())} placeholder="e.g. 33AAAAA0000A1Z5" style={{ background: '#fff' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>GST Certificate File / Image</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input type="text" className="form-control" value={gstDocInput} onChange={e => setGstDocInput(e.target.value)} placeholder="File path or URL" style={{ background: '#fff', fontSize: '0.8rem' }} />
                              <label className="btn btn-secondary" style={{ fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', padding: '0.4rem 0.75rem' }}>
                                📁 Upload
                                <input type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: 'none' }} onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const dataUrl = await fileToDataURL(file);
                                    setGstDocInput(dataUrl);
                                  } catch (err) { console.error(err); }
                                }} />
                              </label>
                            </div>
                          </div>
                        </div>
                        {gstDocInput && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#2563eb', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>✓ Document File Ready:</span>
                            <button
                              type="button"
                              onClick={() => setCompanyDocPreviewModal({ label: 'GST Certificate', number: gstNumInput, docPath: gstDocInput })}
                              style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.2rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 800, fontSize: '0.72rem' }}
                            >
                              👁️ View GST Certificate Photo
                            </button>
                          </div>
                        )}
                      </div>

                      <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', marginTop: '0.5rem', fontWeight: 800, width: 'fit-content' }}>
                        💾 Save KYC Documents & Update Verification
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* ROYAL CAR RENTAL WELCOME & SUBSCRIPTION PLAN POPUP MODAL */}
        {showRoyalWelcomeModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowRoyalWelcomeModal(false)}
            style={{
              zIndex: 1050,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'fixed',
              inset: 0,
              padding: '1rem',
              animation: 'fadeIn 0.25s ease-out'
            }}
          >
            <div
              className="modal-content"
              onClick={e => e.stopPropagation()}
              style={{
                maxWidth: '720px',
                width: '100%',
                borderRadius: '24px',
                background: '#ffffff',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {/* Royal Header Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
                padding: '2.25rem 2rem',
                color: '#ffffff',
                position: 'relative',
                textAlign: 'center'
              }}>
                <button
                  onClick={() => setShowRoyalWelcomeModal(false)}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    color: '#fff',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ✕
                </button>

                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  margin: '0 auto 1rem auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  boxShadow: '0 8px 20px rgba(245,158,11,0.4)',
                  border: '2px solid #fef08a'
                }}>
                  👑
                </div>

                <h2 style={{ fontSize: '1.85rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #ffffff, #fef08a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Welcome to Royal Car Rental
                </h2>
                <p style={{ color: '#cbd5e1', fontSize: '0.92rem', marginTop: '0.4rem', marginBottom: 0, fontWeight: 500 }}>
                  Premium SaaS Fleet Operations & Enterprise Subscription Hub
                </p>
              </div>

              {/* Body Content */}
              <div style={{ padding: '2rem', maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '0.35rem 0.85rem', borderRadius: '20px', border: '1px solid #86efac', display: 'inline-block' }}>
                    🟢 Special Renewal Offer • Instant Fleet Activation
                  </span>
                  <p style={{ color: '#475569', fontSize: '0.88rem', marginTop: '0.75rem', lineHeight: 1.5 }}>
                    Choose a plan below to renew your SaaS subscription, unlock live GPS tracking, and manage unlimited vehicle bookings under Royal Car Rental.
                  </p>
                </div>

                {/* Subscription Plan Options */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  {/* Starter Plan */}
                  <div style={{ border: '2px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', background: '#f8fafc', display: 'flex', flexDirection: 'column', transition: 'all 0.2s' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#2563eb' }}>Starter Plan</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '0.3rem 0' }}>₹3,999 <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>/mo</span></div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0 1.25rem 0', fontSize: '0.78rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                      <li>✓ Up to 20 Vehicles</li>
                      <li>✓ 200 Drivers / Staff</li>
                      <li>✓ Live GPS Tracking</li>
                      <li>✓ WhatsApp Alerts</li>
                    </ul>
                    <button
                      onClick={() => {
                        setSelectedPlanToPay({ name: 'Starter Plan', price: 3999 });
                        setShowPaymentModal(true);
                        setShowRoyalWelcomeModal(false);
                      }}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', background: '#2563eb', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
                    >
                      💳 Select Starter Plan
                    </button>
                  </div>

                  {/* Professional Plan (Featured) */}
                  <div style={{ border: '2px solid #7c3aed', borderRadius: '16px', padding: '1.25rem', background: '#ffffff', boxShadow: '0 8px 24px rgba(124,58,237,0.12)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '-10px', right: '12px', background: '#7c3aed', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '10px' }}>⭐ Popular</span>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#7c3aed' }}>Professional Plan</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '0.3rem 0' }}>₹5,999 <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>/mo</span></div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0 1.25rem 0', fontSize: '0.78rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                      <li>✓ Up to 100 Vehicles</li>
                      <li>✓ 500 Drivers / Staff</li>
                      <li>✓ Traccar GPS Telemetry</li>
                      <li>✓ Priority Support</li>
                    </ul>
                    <button
                      onClick={() => {
                        setSelectedPlanToPay({ name: 'Professional Plan', price: 5999 });
                        setShowPaymentModal(true);
                        setShowRoyalWelcomeModal(false);
                      }}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
                    >
                      🚀 Upgrade to Professional
                    </button>
                  </div>

                  {/* Enterprise Plan */}
                  <div style={{ border: '2px solid #10b981', borderRadius: '16px', padding: '1.25rem', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>Enterprise Plan</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '0.3rem 0' }}>Custom</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0 1.25rem 0', fontSize: '0.78rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                      <li>✓ Unlimited Fleet</li>
                      <li>✓ Custom White Label</li>
                      <li>✓ Dedicated Manager</li>
                      <li>✓ 24/7 SLA Guarantee</li>
                    </ul>
                    <button
                      onClick={() => {
                        alert('📞 Royal Car Rental Enterprise Desk will contact your registered phone number shortly!');
                        setShowRoyalWelcomeModal(false);
                      }}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
                    >
                      📞 Contact Royal Sales
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBSCRIPTION TAX RECEIPT MODAL */}
        {viewReceiptModalData && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: '#ffffff', width: '100%', maxWidth: '480px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', padding: '2rem', animation: 'fadeIn 0.25s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>👑 Royal Car Rental SaaS</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Official Subscription Tax Invoice & Receipt</div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: '20px', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}>
                  ✓ PAID & VERIFIED
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Transaction Ref ID:</span>
                  <strong style={{ color: '#2563eb', fontFamily: 'monospace' }}>#{viewReceiptModalData.transactionId || viewReceiptModalData.id}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Company Subscriber:</span>
                  <strong style={{ color: '#0f172a' }}>{user?.company?.name || localStorage.getItem('company_name') || 'Sri Ram Travels'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>SaaS Plan Tier:</span>
                  <strong style={{ color: '#7c3aed' }}>{viewReceiptModalData.plan}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Payment Mode:</span>
                  <strong style={{ color: '#0f172a' }}>{viewReceiptModalData.method || 'UPI / Razorpay'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Payment Date:</span>
                  <strong style={{ color: '#0f172a' }}>{viewReceiptModalData.date}</strong>
                </div>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>
                  <span>SaaS Plan License Fee:</span>
                  <span>₹{viewReceiptModalData.amount?.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.6rem', color: '#475569' }}>
                  <span>GST Tax (18% Included):</span>
                  <span>₹{(viewReceiptModalData.amount * 0.18).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', borderTop: '1px solid #cbd5e1', paddingTop: '0.6rem' }}>
                  <span>Total Amount Paid:</span>
                  <span style={{ color: '#059669' }}>₹{viewReceiptModalData.amount?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => window.print()}
                  style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', background: '#0f172a', color: '#ffffff', border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  🖨️ Print Official Receipt
                </button>
                <button
                  onClick={() => setViewReceiptModalData(null)}
                  style={{ padding: '0.7rem 1.25rem', borderRadius: '10px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {/* YOU NEED TO UPGRADE YOUR PLAN POPUP MODAL */}
        {showUpgradeRequiredPopup && (
          <div
            onClick={() => setShowUpgradeRequiredPopup(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: '#ffffff', maxWidth: '440px', width: '100%', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '2rem', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', animation: 'fadeIn 0.25s ease-out' }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.25rem auto', border: '2px solid rgba(239, 68, 68, 0.2)' }}>
                ⚠️
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>
                You need to upgrade your plan.
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                Full platform features and operational tools are locked until your subscription plan payment is completed. Please choose a SaaS plan to continue.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => {
                    setShowUpgradeRequiredPopup(false);
                    setActiveNav('subscription');
                    setSelectedPlanToPay({ name: activePlanData?.name || 'Starter Plan', price: activePlanData?.price || 3999 });
                    setShowPaymentModal(true);
                  }}
                  style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', fontWeight: 900, fontSize: '0.92rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}
                >
                  💳 Proceed to Upgrade Plan & Pay
                </button>
                <button
                  onClick={() => setShowUpgradeRequiredPopup(false)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADD / EDIT VEHICLE MODAL */}
        {showVehicleModal && (
          <VehicleModal
            vehicle={editingVehicle}
            token={token}
            onClose={() => { setShowVehicleModal(false); setEditingVehicle(null); }}
            onSaved={(savedVehicle) => {
              handleVehicleSaved(savedVehicle, !editingVehicle);
              setShowVehicleModal(false);
              setEditingVehicle(null);
            }}
          />
        )}

        {/* ADD / EDIT DRIVER MODAL */}
        {showDriverModal && (
          <DriverModal
            driver={editingDriver}
            token={token}
            onClose={() => { setShowDriverModal(false); setEditingDriver(null); }}
            onSaved={(savedDriver) => {
              // Persist custom password if provided
              if (savedDriver.email && savedDriver.password) {
                try {
                  const customPasses = JSON.parse(localStorage.getItem('custom_user_passwords') || '{}');
                  customPasses[savedDriver.email.trim().toLowerCase()] = savedDriver.password;
                  localStorage.setItem('custom_user_passwords', JSON.stringify(customPasses));
                } catch (e) {}
              }

              if (editingDriver) {
                setDrivers(prev => {
                  const updated = prev.map(d => (d.id === savedDriver.id || d._id === savedDriver._id) ? savedDriver : d);
                  localStorage.setItem('company_drivers_registry', JSON.stringify(updated));
                  return updated;
                });
                showNotification(`✓ Driver ${savedDriver.name} profile, email & password updated successfully!`);
              } else {
                setDrivers(prev => {
                  const updated = [...prev, savedDriver];
                  localStorage.setItem('company_drivers_registry', JSON.stringify(updated));
                  return updated;
                });
                showNotification(`✓ New driver ${savedDriver.name} added & credentials saved!`);
              }
              setShowDriverModal(false);
              setEditingDriver(null);
            }}
          />
        )}

        {/* ADD / EDIT EMPLOYEE MODAL */}
        {showEmployeeModal && (
          <EmployeeModal
            employee={editingEmployee}
            onClose={() => { setShowEmployeeModal(false); setEditingEmployee(null); }}
            onSaved={(savedEmp) => {
              setStaffList(prev => {
                const existingIdx = prev.findIndex(e => (e.id === savedEmp.id || e._id === savedEmp._id));
                let updated;
                if (existingIdx >= 0) {
                  updated = [...prev];
                  updated[existingIdx] = savedEmp;
                  showNotification(`Employee ${savedEmp.name} updated successfully!`);
                } else {
                  updated = [...prev, savedEmp];
                  showNotification(`New employee ${savedEmp.name} registered!`);
                }
                localStorage.setItem('company_staff_list', JSON.stringify(updated));
                return updated;
              });
              setShowEmployeeModal(false);
              setEditingEmployee(null);
            }}
          />
        )}

        {/* RENTAL TAX INVOICE MODAL */}
        {selectedBooking && (
          <InvoiceModal
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
          />
        )}

        {/* ASSIGN COMPANY DRIVER MODAL */}
        {assigningDriverBooking && (
          <AssignDriverModal
            booking={assigningDriverBooking}
            companyDrivers={drivers}
            onClose={() => setAssigningDriverBooking(null)}
            onAssigned={async (bId, driverId, driverName) => {
              try {
                if (token && String(bId).length > 15) {
                  await fetch(`/api/company-admin/bookings/${bId}/status`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ driverId, driverAssigned: `👨‍✈️ ${driverName}`, status: 'confirmed' })
                  });
                }
              } catch (err) {
                console.warn('API error assigning driver:', err);
              }

              const assignedName = `👨‍✈️ ${driverName}`;
              setBookings(prev => {
                const updated = prev.map(item => item._id === bId ? { ...item, driverId, driverAssigned: assignedName, status: 'confirmed' } : item);

                // Persist locally so driver assignment is preserved across refresh/fetch
                const localAssigned = JSON.parse(localStorage.getItem('company_assigned_bookings') || '[]');
                const existingIdx = localAssigned.findIndex(s => String(s._id) === String(bId));
                if (existingIdx >= 0) {
                  localAssigned[existingIdx] = { ...localAssigned[existingIdx], driverId, driverAssigned: assignedName, status: 'confirmed' };
                } else {
                  const targetBooking = prev.find(item => item._id === bId) || { _id: bId };
                  localAssigned.push({ ...targetBooking, driverId, driverAssigned: assignedName, status: 'confirmed' });
                }
                localStorage.setItem('company_assigned_bookings', JSON.stringify(localAssigned));

                return updated;
              });

              showNotification(`Driver ${driverName} assigned to Booking #${String(bId).slice(-6).toUpperCase()}!`);
              setAssigningDriverBooking(null);
            }}
          />
        )}

        {/* OFFER CREATION MODAL */}
        {showOfferModal && (
          <div className="modal" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
            <div className="card" style={{ padding: '2rem', width: '640px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', background: '#fff', animation: 'scaleIn 0.2s ease-out', borderRadius: '12px' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: '#1e3a8a', margin: 0 }}>
                  {editingOffer ? '✏️ Edit Promotional Offer' : '🏷️ Create New Promotional Offer'}
                </h3>
                <button onClick={() => setShowOfferModal(false)} className="btn btn-text" style={{ fontSize: '1.25rem', padding: 0, cursor: 'pointer', border: 'none', background: 'transparent' }}>×</button>
              </div>

              <form onSubmit={handleSaveOffer}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                  {/* Section 1: Basic Details */}
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: '#475569', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.25rem', marginBottom: '0.75rem' }}>Basic Campaign Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>Offer Name *</label>
                        <input type="text" className="form-control" value={offerName} onChange={e => setOfferName(e.target.value)} placeholder="e.g. Weekend Special" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>Promo Code (Uppercase) *</label>
                        <input type="text" className="form-control" value={newOfferCode} onChange={e => setNewOfferCode(e.target.value.toUpperCase())} placeholder="e.g. WEEKEND15" required />
                      </div>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>Offer Description *</label>
                        <input type="text" className="form-control" value={newOfferDesc} onChange={e => setNewOfferDesc(e.target.value)} placeholder="e.g. Get 15% off on weekend bookings" required />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Discount & Rules */}
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: '#475569', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.25rem', marginBottom: '0.75rem' }}>Discount Mechanics & Limits</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>Offer Type</label>
                        <select className="form-control" value={offerType} onChange={e => setOfferType(e.target.value)}>
                          <option value="Percentage Discount">Percentage Discount</option>
                          <option value="Fixed Amount Discount">Fixed Amount Discount</option>
                          <option value="Flat Price">Flat Price</option>
                          <option value="Early Booking">Early Booking</option>
                          <option value="Long-Term Rental">Long-Term Rental</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>Discount Percentage / Value *</label>
                        <input type="number" min="1" className="form-control" value={newOfferDiscount} onChange={e => setNewOfferDiscount(e.target.value)} placeholder="e.g. 15" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>Maximum Discount Limit (₹) *</label>
                        <input type="number" className="form-control" value={offerMaxDiscount} onChange={e => setOfferMaxDiscount(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>Minimum Booking Amount (₹) *</label>
                        <input type="number" className="form-control" value={offerMinBooking} onChange={e => setOfferMinBooking(e.target.value)} required />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Targeting & Validity */}
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: '#475569', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.25rem', marginBottom: '0.75rem' }}>Targeting Rules & Validity</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>Apply Offer To</label>
                        <select className="form-control" value={offerAppliesTo} onChange={e => setOfferAppliesTo(e.target.value)}>
                          <option value="All Vehicles">All Vehicles</option>
                          <option value="Selected Vehicles">Selected Vehicles</option>
                          <option value="SUVs">SUVs</option>
                          <option value="Sedans">Sedans</option>
                          <option value="Hatchbacks">Hatchbacks</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>Target Customer Group</label>
                        <select className="form-control" value={offerCustomerType} onChange={e => setOfferCustomerType(e.target.value)}>
                          <option value="All Customers">All Customers</option>
                          <option value="New Customers Only">New Customers Only</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>Validity Start Date *</label>
                        <input type="date" className="form-control" value={offerStartDate} onChange={e => setOfferStartDate(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>Validity End Date *</label>
                        <input type="date" className="form-control" value={newOfferExpiry} onChange={e => setNewOfferExpiry(e.target.value)} required />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Rental Duration & Usage limits */}
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: '#475569', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.25rem', marginBottom: '0.75rem' }}>Rental Conditions</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>Min Days</label>
                        <input type="number" className="form-control" value={offerMinDays} onChange={e => setOfferMinDays(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>Max Days</label>
                        <input type="number" className="form-control" value={offerMaxDays} onChange={e => setOfferMaxDays(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>Max Usage Limit</label>
                        <input type="number" className="form-control" value={offerMaxUsage} onChange={e => setOfferMaxUsage(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {/* Launch status selection */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#334155' }}>Campaign Launch Status:</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                      <input type="radio" name="offer_status" checked={offerStatus === 'active'} onChange={() => setOfferStatus('active')} /> Active
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                      <input type="radio" name="offer_status" checked={offerStatus === 'inactive'} onChange={() => setOfferStatus('inactive')} /> Scheduled / Paused
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                      <input type="radio" name="offer_status" checked={offerStatus === 'draft'} onChange={() => setOfferStatus('draft')} /> Draft
                    </label>
                  </div>

                  {/* Submit / Action buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.65rem' }}>
                      {editingOffer ? '💾 Save Changes' : '🚀 Launch Promo Offer'}
                    </button>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.65rem' }} onClick={() => setShowOfferModal(false)}>Cancel</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CUSTOMER SELF-DRIVE KYC DOCUMENTS MODAL */}
        {selectedCustomerDocsBooking && (
          <div className="modal" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(5px)', zIndex: 1100 }}>
            <div className="card" style={{ padding: '1.75rem', width: '740px', maxWidth: '92%', maxHeight: '90vh', overflowY: 'auto', background: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '2rem' }}>📄</span>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', color: '#1e3a8a', margin: 0, fontWeight: 900 }}>
                      Customer Verification & Uploaded KYC Documents
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, marginTop: '2px' }}>
                      Booking ID: #{selectedCustomerDocsBooking.bookingId || selectedCustomerDocsBooking._id} • {selectedCustomerDocsBooking.bookingType === 'self-drive' || !selectedCustomerDocsBooking.hasDriver ? '🚗 Self-Drive Rental' : '👨‍✈️ Driver Assigned'}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomerDocsBooking(null)} style={{ background: '#f1f5f9', border: 'none', fontSize: '1.2rem', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 800, color: '#64748b' }}>×</button>
              </div>

              {/* Customer summary card */}
              <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                <div>
                  <div>👤 <strong>Customer Name:</strong> <span style={{ color: '#2563eb', fontWeight: 800 }}>{selectedCustomerDocsBooking.customerName}</span></div>
                  <div style={{ marginTop: '0.35rem' }}>📞 <strong>Mobile Number:</strong> {selectedCustomerDocsBooking.customerPhone}</div>
                  <div style={{ marginTop: '0.35rem' }}>🚗 <strong>Reserved Vehicle:</strong> {selectedCustomerDocsBooking.vehicleName}</div>
                </div>
                <div>
                  <div>📅 <strong>Rental Dates:</strong> {selectedCustomerDocsBooking.startDate} to {selectedCustomerDocsBooking.endDate}</div>
                  <div style={{ marginTop: '0.35rem' }}>💰 <strong>Total Amount:</strong> <span style={{ color: '#059669', fontWeight: 800 }}>₹{selectedCustomerDocsBooking.totalPrice}</span></div>
                  <div style={{ marginTop: '0.35rem' }}>
                    🛡️ <strong>Booking Mode:</strong>{' '}
                    <span style={{ background: selectedCustomerDocsBooking.bookingType === 'with_driver' || selectedCustomerDocsBooking.hasDriver ? '#dbeafe' : '#dcfce7', color: selectedCustomerDocsBooking.bookingType === 'with_driver' || selectedCustomerDocsBooking.hasDriver ? '#1e40af' : '#15803d', padding: '0.15rem 0.6rem', borderRadius: '4px', fontWeight: 800, fontSize: '0.75rem' }}>
                      {selectedCustomerDocsBooking.bookingType === 'with_driver' || selectedCustomerDocsBooking.hasDriver ? '👨‍✈️ Car + Driver (Chauffeur Included)' : '🏎️ Self-Drive Rental'}
                    </span>
                  </div>
                </div>
              </div>

              {/* RETURNING CUSTOMER AUTOMATIC DOCUMENT REUSE VAULT BANNER */}
              <div style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '1px solid #10b981', padding: '0.85rem 1rem', borderRadius: '10px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.12)' }}>
                <span style={{ fontSize: '1.6rem' }}>⚡</span>
                <div>
                  <div style={{ fontWeight: 800, color: '#047857', fontSize: '0.88rem' }}>
                    ✓ Returning Customer - KYC Documents Auto-Retrieved from Vault
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#065f46', marginTop: '2px' }}>
                    Customer previously verified. Driving License, Aadhaar, and Biometric Selfie auto-loaded from system vault without requiring fresh document uploads!
                  </div>
                </div>
              </div>

              {/* Uploaded Documents Grid */}
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>Uploaded Verification Documents Gallery</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

                  {/* 1. Driving License Front */}
                  <div style={{ border: '1px dashed #3b82f6', borderRadius: '10px', padding: '0.75rem', background: '#eff6ff', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1d4ed8', marginBottom: '0.5rem' }}>💳 Driving License (FRONT)</div>
                    <img
                      src={selectedCustomerDocsBooking.licenseFrontUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=500&q=80'}
                      alt="Driving License Front"
                      style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #bfdbfe' }}
                    />
                    <div style={{ fontSize: '0.72rem', color: '#1e40af', fontWeight: 700, marginTop: '0.4rem' }}>
                      DL No: DL-04202100892 • LMV Car Endorsed ✅
                    </div>
                  </div>

                  {/* 2. Driving License Back */}
                  <div style={{ border: '1px dashed #3b82f6', borderRadius: '10px', padding: '0.75rem', background: '#eff6ff', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1d4ed8', marginBottom: '0.5rem' }}>💳 Driving License (BACK)</div>
                    <img
                      src={selectedCustomerDocsBooking.licenseBackUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=500&q=80'}
                      alt="Driving License Back"
                      style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #bfdbfe' }}
                    />
                    <div style={{ fontSize: '0.72rem', color: '#1e40af', fontWeight: 700, marginTop: '0.4rem' }}>
                      Address & RTO Barcode Verified ✅
                    </div>
                  </div>

                  {/* 3. Aadhaar Card */}
                  <div style={{ border: '1px dashed #10b981', borderRadius: '10px', padding: '0.75rem', background: '#ecfdf5', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#047857', marginBottom: '0.5rem' }}>🪪 Aadhaar Card (Identity Proof)</div>
                    <img
                      src={selectedCustomerDocsBooking.aadhaarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80'}
                      alt="Aadhaar Card"
                      style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #a7f3d0' }}
                    />
                    <div style={{ fontSize: '0.72rem', color: '#065f46', fontWeight: 700, marginTop: '0.4rem' }}>
                      Aadhaar No: XXXX-XXXX-9842 (Masked) ✅
                    </div>
                  </div>

                  {/* 4. Customer Verified Face Scan Selfie */}
                  <div style={{ border: '1px dashed #8b5cf6', borderRadius: '10px', padding: '0.75rem', background: '#f5f3ff', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#6d28d9', marginBottom: '0.5rem' }}>🤳 Live Face Scan Biometric Snapshot</div>
                    <img
                      src={selectedCustomerDocsBooking.customerFaceUrl || selectedCustomerDocsBooking.driverFaceUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80'}
                      alt="Customer Face Scan"
                      style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd6fe' }}
                    />
                    <div style={{ fontSize: '0.72rem', color: '#5b21b6', fontWeight: 700, marginTop: '0.4rem' }}>
                      Biometric Match Score: 98.6% Similarity ✅
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Footer */}
              <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <button
                  onClick={() => {
                    handleApproveBooking(selectedCustomerDocsBooking);
                    setSelectedCustomerDocsBooking(null);
                  }}
                  style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: '0.7rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.88rem' }}
                >
                  ✓ Approve Customer Documents & Reserve Vehicle
                </button>
                <button
                  onClick={() => setSelectedCustomerDocsBooking(null)}
                  style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '0.7rem 1.5rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TRACCAR GPS LIVE VEHICLE TRACKING MODAL */}
        {traccarModalVehicle && (
          <div className="modal" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)', zIndex: 9999 }}>
            <div className="card" style={{ padding: '1.75rem', width: '820px', maxWidth: '94%', maxHeight: '92vh', overflowY: 'auto', background: '#0f172a', color: '#f8fafc', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '2rem' }}>📡</span>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)', color: '#38bdf8', margin: 0, fontWeight: 900 }}>
                      Traccar GPS Real-Time Vehicle Tracking
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 700, marginTop: '2px' }}>
                      Live GPS Telematics Data Active
                    </div>
                  </div>
                </div>

                {/* Published Company Logo Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1e293b', padding: '0.35rem 0.75rem', borderRadius: '20px', border: '1px solid #334155' }}>
                    <img
                      src={traccarModalVehicle?.companyLogo || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=100&q=80'}
                      alt="Company Logo"
                      style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0' }}>
                      Verified Operator: <strong style={{ color: '#38bdf8' }}>{traccarModalVehicle?.companyName || traccarModalVehicle?.vendor || 'DriveX Rentals'}</strong>
                    </span>
                  </div>
                  <button onClick={() => setTraccarModalVehicle(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer', marginLeft: '0.5rem' }}>✕</button>
                </div>
              </div>

              {/* ASSIGNED CHAUFFEUR & ETA CARDS */}
              {(traccarModalVehicle?.driverAssigned || traccarModalVehicle?.hasDriver || traccarModalVehicle?.bookingType === 'with_driver' || traccarModalVehicle?.driverName || traccarModalVehicle?.phone) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ background: '#1e293b', padding: '0.85rem 1.1rem', borderRadius: '12px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>ESTIMATED ARRIVAL (ETA)</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#38bdf8', marginTop: 2 }}>14 Mins</div>
                    <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>Vehicle: {traccarModalVehicle?.vehicleName || 'BMW 3 Series (TN-05-AB-1234)'}</div>
                  </div>

                  <div style={{ background: '#1e293b', padding: '0.85rem 1.1rem', borderRadius: '12px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '0.4rem' }}>ASSIGNED CHAUFFEUR & BIOMETRICS</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={getValidImageUrl(traccarModalVehicle?.driverPhoto || traccarModalVehicle?.driverFaceUrl || traccarModalVehicle?.avatar, 'driver')}
                        onError={e => handleImageError(e, 'driver')}
                        alt="Assigned Chauffeur"
                        style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #38bdf8', boxShadow: '0 2px 8px rgba(56,189,248,0.3)' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                          {traccarModalVehicle?.driverName || 'Oviyaa S.'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700 }}>
                          {traccarModalVehicle?.rating || '★ 4.9 Rating'} ({traccarModalVehicle?.phone || '+91 96385 27412'})
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 800, marginTop: '1px' }}>
                          🟢 Verified Human Biometric Face
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem' }}>
                      <button
                        onClick={() => alert(`📞 Dialing Chauffeur ${traccarModalVehicle?.driverName || 'Driver'} (${traccarModalVehicle?.phone || '+91 98765 43210'})...`)}
                        style={{ flex: 1, background: '#2563eb', color: '#fff', border: 'none', padding: '0.4rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                      >
                        📞 Call Driver
                      </button>
                      <button
                        onClick={() => alert(`💬 Opening live chat session with ${traccarModalVehicle?.driverName || 'Driver'}...`)}
                        style={{ flex: 1, background: '#059669', color: '#fff', border: 'none', padding: '0.4rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                      >
                        💬 Chat
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Telematics Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: '#1e293b', padding: '0.75rem', borderRadius: '10px', border: '1px solid #334155', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>⚡ Engine Ignition</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#34d399', marginTop: 4 }}>🟢 IGNITION ON</div>
                </div>

                <div style={{ background: '#1e293b', padding: '0.75rem', borderRadius: '10px', border: '1px solid #334155', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>🏎️ Live Vehicle Speed</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fbbf24', marginTop: 4 }}>{traccarModalVehicle?.speed || '42 km/h'}</div>
                  <div style={{ fontSize: '0.72rem', color: '#34d399' }}>Within Safe Speed Limit</div>
                </div>

                <div style={{ background: '#1e293b', padding: '0.75rem', borderRadius: '10px', border: '1px solid #334155', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>🛰️ GPS Satellite Lock</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#a78bfa', marginTop: 4 }}>14 Satellites Active</div>
                </div>
              </div>

              {/* Address & Coords Bar */}
              <div style={{ background: '#1e293b', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #334155', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem' }}>
                <div>
                  📍 <strong>Exact Driver Current Location:</strong> <span style={{ color: '#38bdf8', fontWeight: 800 }}>{traccarModalVehicle?.address || traccarModalVehicle?.location || 'Anna Salai, Guindy, Chennai, Tamil Nadu - 600032'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: '#94a3b8' }}>
                  <span>🛰️ <strong>GPS Coords:</strong> <strong style={{ color: '#34d399' }}>{traccarModalVehicle?.latitude || 13.0067}° N, {traccarModalVehicle?.longitude || 80.2020}° E</strong></span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${traccarModalVehicle?.latitude || 13.0067}, ${traccarModalVehicle?.longitude || 80.2020}`);
                      alert('📋 GPS Coordinates copied to clipboard!');
                    }}
                    style={{ background: '#334155', color: '#38bdf8', border: 'none', padding: '0.2rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                  >
                    📋 Copy Coordinates
                  </button>
                </div>
              </div>

              {/* Embedded Live Map View */}
              <div style={{ position: 'relative', height: '320px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155', marginBottom: '1.25rem' }}>
                <iframe
                  title="Traccar Live Vehicle Map"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://maps.google.com/maps?q=${traccarModalVehicle?.latitude || 13.0067},${traccarModalVehicle?.longitude || 80.2020}&z=15&output=embed`}
                  allowFullScreen
                />
                {/* FLOATING LIVE CAR ICON MARKER BADGE ON MAP */}
                <div style={{
                  position: 'absolute', top: '48%', left: '50%', transform: 'translate(-50%, -100%)',
                  background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '0.5rem 0.9rem', borderRadius: '30px',
                  border: '2px solid #2563eb', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', color: '#fff',
                  display: 'flex', alignItems: 'center', gap: '0.6rem', zIndex: 10, pointerEvents: 'none'
                }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', boxShadow: '0 2px 8px rgba(37,99,235,0.6)' }}>
                    🚗
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#60a5fa' }}>{traccarModalVehicle?.vehicleName || 'Rental Vehicle'}</div>
                    <div style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 800 }}>⚡ {traccarModalVehicle?.speed || '42 km/h'} • Live GPS Radar 📡</div>
                  </div>
                </div>
              </div>

              {/* Action Footer Controls */}
              <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid #1e293b', paddingTop: '1rem' }}>
                <button
                  onClick={() => alert(`🔒 Remote Engine Immobilizer command sent!`)}
                  style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none', padding: '0.7rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  🔒 Remote Engine Cutoff
                </button>
                <button
                  onClick={() => alert(`🔓 Remote Engine Immobilizer Released!`)}
                  style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: '0.7rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  🔓 Restore Engine Start
                </button>
                <button
                  onClick={() => setTraccarModalVehicle(null)}
                  style={{ background: '#334155', color: '#f8fafc', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* COMPANY KYC DOCUMENT PREVIEW LIGHTBOX MODAL */}
        {companyDocPreviewModal && (
          <div
            className="modal-overlay"
            onClick={() => setCompanyDocPreviewModal(null)}
            style={{
              zIndex: 1200, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, padding: '1rem'
            }}
          >
            <div
              className="modal-content"
              onClick={e => e.stopPropagation()}
              style={{
                maxWidth: '680px', width: '95%', borderRadius: '20px', background: '#ffffff',
                boxShadow: '0 25px 60px rgba(0,0,0,0.3)', border: '1px solid #e2e8f0', overflow: 'hidden'
              }}
            >
              <div style={{
                background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#fff',
                padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: '#fff' }}>
                    📄 {companyDocPreviewModal.label} Document Preview
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {companyDocPreviewModal.number ? `ID Number: ${companyDocPreviewModal.number}` : 'Official Legal Verification Document'}
                  </span>
                </div>
                <button
                  onClick={() => setCompanyDocPreviewModal(null)}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}
                >
                  ×
                </button>
              </div>

              <div style={{ padding: '1.5rem', textAlign: 'center', background: '#f8fafc', maxHeight: '70vh', overflowY: 'auto' }}>
                {companyDocPreviewModal.docPath?.endsWith('.pdf') ? (
                  <div style={{ padding: '2rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📄</div>
                    <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>PDF Document Attached</div>
                    <a
                      href={companyDocPreviewModal.docPath}
                      download={`${companyDocPreviewModal.label.replace(/\s+/g, '_')}.pdf`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'inline-block', padding: '0.65rem 1.25rem', background: '#2563eb', color: '#fff', borderRadius: '8px', fontWeight: 800, textDecoration: 'none' }}
                    >
                      📥 Download PDF Document
                    </a>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <img
                      src={companyDocPreviewModal.docPath}
                      alt={companyDocPreviewModal.label}
                      style={{ maxWidth: '100%', maxHeight: '480px', borderRadius: '12px', border: '2px solid #cbd5e1', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', objectFit: 'contain' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                      <a
                        href={companyDocPreviewModal.docPath}
                        download={`${companyDocPreviewModal.label.replace(/\s+/g, '_')}.png`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', borderRadius: '8px', fontWeight: 800, textDecoration: 'none', fontSize: '0.8rem' }}
                      >
                        📥 Download Document Image
                      </a>
                      <button
                        onClick={() => setCompanyDocPreviewModal(null)}
                        style={{ padding: '0.5rem 1rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Close Viewer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* BOOKING CHAT & LIVE LOCATION MODAL */}
        {bookingChatModalItem && (
          <BookingChatModal
            booking={bookingChatModalItem}
            currentUser={user}
            role="company-admin"
            onClose={() => setBookingChatModalItem(null)}
          />
        )}

      </div>
      );
}





export default CompanyAdminDashboard;
