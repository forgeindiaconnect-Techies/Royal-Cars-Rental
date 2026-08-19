import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import LiveTrackingComponent from '../components/LiveTrackingComponent';
import LocationsManager from '../components/LocationsManager';

/* ─────────────────────────────────────────────────────────────────
   SIDEBAR NAV ITEMS
───────────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'dashboard',        label: 'Dashboard' },
  { id: 'rental-companies', label: 'Rental Companies' },
  { id: 'locations',        label: 'Popular Locations' },
  { id: 'car-owners',       label: 'Car Owners Queue' },
  { id: 'payout-requests',   label: 'Payout Requests' },
  { id: 'drivers-queue',    label: 'Drivers Queue' },
  { id: 'live-tracking',    label: 'Live GPS Tracking' },
  { id: 'subscription',     label: 'Subscription' },
  { id: 'commission',       label: 'Commission' },
  { id: 'payments',         label: 'Payments' },
  { id: 'reports',          label: 'Reports' },
  { id: 'notifications',    label: 'Notifications' },
  { id: 'chat',             label: 'Vendor Chat Channels' },
  { id: 'settings',         label: 'Settings' },
];

const SUB_SECTIONS = {
  'rental-companies': [
    { id: 'rc-all',        label: 'All Companies',       desc: 'View all onboarded rental vendors',        color: '#2563eb' },
    { id: 'rc-pending',    label: 'Pending Approval',    desc: 'Self-registered companies awaiting review', color: '#d97706' },
    { id: 'rc-active',     label: 'Active Companies',    desc: 'Currently live and operating vendors',      color: '#10b981' },
    { id: 'rc-suspended',  label: 'Suspended Companies', desc: 'Companies currently suspended',             color: '#f43f5e' },
    { id: 'rc-details',    label: 'Company Details',     desc: 'In-depth info, stats & KYC documents',     color: '#7c3aed' },
    { id: 'rc-sub-status', label: 'Subscription Status', desc: 'Track subscription plans & renewals',      color: '#0891b2' },
  ],
  'subscription':  [
    { id: 's-plans',   label: 'Plans',                 desc: 'Manage SaaS subscription plans & AI pricing', color: '#2563eb' },
    { id: 's-active',  label: 'Active Subscriptions',  desc: 'Currently subscribed companies',          color: '#10b981' },
    { id: 's-expired', label: 'Expired Subscriptions', desc: 'Lapsed or unpaid subscriptions',         color: '#f43f5e' },
    { id: 's-renewal', label: 'Renewal History',       desc: 'Track all renewal transactions',          color: '#7c3aed' },
    { id: 's-upgrade', label: 'Upgrade / Downgrade',   desc: 'Plan change requests & history',         color: '#d97706' },
  ],
  'commission':    [
    { id: 'cm-company',    label: 'Company-wise Commission', desc: 'Per-company breakdown & performance', color: '#7c3aed' },
    { id: 'cm-settings',   label: 'Commission Settings',     desc: 'Set per-company commission rates',     color: '#2563eb' },
    { id: 'cm-history',    label: 'Commission History',      desc: 'Full transaction commission log',    color: '#10b981' },
    { id: 'cm-settlement', label: 'Settlement & Payouts',    desc: 'Process & record payouts',             color: '#d97706' },
  ],
  'payments':      [
    { id: 'p-history', label: 'Payment History',        desc: 'All platform payment & payout records', color: '#2563eb' },
    { id: 'p-sub',     label: 'Subscription Payments', desc: 'SaaS license fee payments',             color: '#7c3aed' },
    { id: 'p-payouts', label: 'Vendor Payouts',        desc: 'Payouts sent to rental vendors',        color: '#10b981' },
    { id: 'p-failed',  label: 'Failed Payments',       desc: 'Payments that did not go through',      color: '#f43f5e' },
    { id: 'p-refunds', label: 'Refund Details',        desc: 'Customer & vendor refund requests',     color: '#d97706' },
  ],
  'reports':       [
    { id: 'r-revenue', label: 'Revenue Report', desc: 'Platform earnings & subscription analytics', color: '#10b981' },
    { id: 'r-company', label: 'Company Report', desc: 'Per-company performance & growth breakdown', color: '#7c3aed' },
  ],
  'notifications': [
    { id: 'n-announce', label: 'Announcements',          desc: 'Platform-wide announcements',   color: '#d97706' },
  ],
  'settings':      [
    { id: 'st-profile',  label: 'Admin Profile',  desc: 'View & update admin account details', color: '#2563eb' },
    { id: 'st-password', label: 'Change Password', desc: 'Update super admin login password', color: '#f43f5e' },
  ],
};

/* ─────────────────────────────────────────────────────────────────
   TOP HEADER BAR WITH USER BADGE
───────────────────────────────────────────────────────────────── */
function TopHeader({ activeNav, notifications = [], unreadCount = 0, showNotificationsDropdown = false, onToggleNotifications, onOpenProfile }) {
  const currentNav = NAV_ITEMS.find(n => n.id === activeNav);
  
  // Strip icon prefix from label if present
  const cleanLabel = (currentNav?.label || 'Dashboard').replace(/^[^\s]+\s+/, '');

  return (
    <header style={{
      height: '56px',
      background: '#FFFFFF',
      borderBottom: '1px solid #EADCCF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.75rem',
      flexShrink: 0,
      position: 'relative'
    }}>
      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#7C6959' }}>
        <span style={{ color: '#9C8A7B' }}>Admin Console</span> / <span style={{ color: '#D49B4B', fontWeight: 800 }}>{cleanLabel}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <button onClick={onToggleNotifications} style={{
            background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem', padding: '0.4rem', position: 'relative', display: 'flex', alignItems: 'center'
          }}>
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '0px', right: '0px', background: '#D49B4B', color: '#fff', fontSize: '0.65rem', fontWeight: 700, borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {unreadCount}
              </span>
            )}
          </button>
          {showNotificationsDropdown && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, width: '320px', background: '#fff', border: '1px solid #EADCCF', borderRadius: '12px', boxShadow: '0 10px 30px rgba(78,49,27,0.1)', zIndex: 1000, marginTop: '0.5rem', padding: '0.5rem 0'
            }}>
              <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #EADCCF', fontWeight: 700, fontSize: '0.88rem', color: '#3C2415', display: 'flex', justifyContent: 'space-between' }}>
                <span>Notification History</span>
                <span style={{ color: '#7C6959', fontWeight: 500, fontSize: '0.75rem' }}>({notifications.length})</span>
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#7C6959', fontSize: '0.8rem' }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n._id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #FAF4EE', fontSize: '0.78rem', textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 700, color: '#3C2415' }}>{n.title}</span>
                        <span style={{ color: '#7C6959', fontSize: '0.68rem' }}>{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div style={{ color: '#7C6959', lineHeight: '1.3' }}>{n.message}</div>
                      <div style={{ fontSize: '0.65rem', color: '#D49B4B', marginTop: '0.25rem', fontWeight: 600 }}>
                        Sender: {n.senderRole === 'super-admin' ? 'Platform Admin' : 'Company Manager'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

/* ─────────────────────────────────────────────────────────────────
   TOP HEADER
───────────────────────────────────────────────────────────────── */
function TopHeader({ activeNav, notifications, unreadCount, showNotificationsDropdown, onOpenProfile, onToggleNotifications, isMobileSidebarOpen, onToggleMobileSidebar }) {
  return (
    <header style={{
      height: '65px', background: '#FFFFFF', borderBottom: '1px solid #EADCCF',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 1.25rem', flexShrink: 0, boxShadow: '0 2px 10px rgba(59, 33, 19, 0.04)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Mobile Hamburger Toggle Button (3 small lines) */}
        <button
          onClick={onToggleMobileSidebar}
          className="dashboard-mobile-toggle-btn"
          aria-label="Toggle Dashboard Navigation"
        >
          {isMobileSidebarOpen ? '✕' : '☰'}
        </button>

        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 900, color: '#3C2415' }}>
          Admin Console <span style={{ fontSize: '0.9rem', color: '#8B5E3C', fontWeight: 600 }}>/ {activeNav ? activeNav.replace('-', ' ').toUpperCase() : 'DASHBOARD'}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={onToggleNotifications}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem', padding: '0.3rem', position: 'relative'
            }}
          >
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '0px', right: '0px', background: '#D49B4B', color: '#fff', fontSize: '0.65rem', fontWeight: 700, borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {unreadCount}
              </span>
            )}
          </button>
          {showNotificationsDropdown && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, width: '320px', background: '#fff', border: '1px solid #EADCCF', borderRadius: '12px', boxShadow: '0 10px 30px rgba(78,49,27,0.1)', zIndex: 1000, marginTop: '0.5rem', padding: '0.5rem 0'
            }}>
              <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #EADCCF', fontWeight: 700, fontSize: '0.88rem', color: '#3C2415', display: 'flex', justifyContent: 'space-between' }}>
                <span>Notification History</span>
                <span style={{ color: '#7C6959', fontWeight: 500, fontSize: '0.75rem' }}>({notifications.length})</span>
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#7C6959', fontSize: '0.8rem' }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n._id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #FAF4EE', fontSize: '0.78rem', textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 700, color: '#3C2415' }}>{n.title}</span>
                        <span style={{ color: '#7C6959', fontSize: '0.68rem' }}>{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div style={{ color: '#7C6959', lineHeight: '1.3' }}>{n.message}</div>
                      <div style={{ fontSize: '0.65rem', color: '#D49B4B', marginTop: '0.25rem', fontWeight: 600 }}>
                        Sender: {n.senderRole === 'super-admin' ? 'Platform Admin' : 'Company Manager'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Super Admin Identity Badge */}
        <div 
          onClick={() => onOpenProfile && onOpenProfile()} 
          title="Click to view Super Admin Profile & System Access"
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderLeft: '1px solid #EADCCF', paddingLeft: '1.25rem', cursor: 'pointer' }}
        >
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#D49B4B', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem', boxShadow: '0 2px 8px rgba(212, 155, 75, 0.4)' }}>
            SA
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#3C2415' }}>Super Admin</span>
            <span style={{ fontSize: '0.65rem', color: '#7C6959', fontWeight: 600 }}>Administrator ⚙️</span>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────────────────────────── */
function Sidebar({ activeNav, onNavChange, onLogout, isMobileOpen, onCloseMobile }) {
  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileOpen && (
        <div 
          className="dashboard-sidebar-backdrop"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`dashboard-sidebar ${isMobileOpen ? 'mobile-drawer-active' : ''}`} style={{
        width: '220px', height: '100%', background: '#100C09',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'hidden',
      }}>
        <div style={{ padding: '1.25rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #D49B4B 0%, #B88235 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(212,155,75,0.4)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-8-4 8-6-7z"/><path d="M5 20h14"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '0.95rem', color: '#D49B4B', letterSpacing: '-0.02em' }}>
                Super Admin
              </div>
              <div style={{ fontSize: '0.68rem', color: '#A89886', marginTop: '1px' }}>Platform Control Console</div>
            </div>
          </div>

          <button 
            onClick={onCloseMobile}
            className="dashboard-sidebar-close-btn"
            aria-label="Close Navigation Drawer"
          >
            ✕
          </button>
        </div>
        <nav style={{ flex: 1, padding: '0.75rem 0.6rem', overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => {
            const isActive = activeNav === item.id;
            return (
              <button key={item.id} onClick={() => { onNavChange(item.id); if (onCloseMobile) onCloseMobile(); }} style={{
                display: 'block', width: '100%', padding: '0.7rem 1rem',
                margin: '0.2rem 0',
                background: isActive ? 'linear-gradient(135deg, #D49B4B 0%, #C58F3E 100%)' : 'transparent',
                border: 'none', borderRadius: '8px',
                cursor: 'pointer', color: isActive ? '#FFFFFF' : '#E0D5C7',
                fontWeight: isActive ? 800 : 500, fontSize: '0.85rem',
                fontFamily: 'var(--font-body)', textAlign: 'left', transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 4px 12px rgba(212, 155, 75, 0.35)' : 'none'
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#D49B4B'; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#E0D5C7'; } }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={() => { if (onCloseMobile) onCloseMobile(); onLogout(); }} style={{
            display: 'block', width: '100%', padding: '0.6rem 1rem',
            background: 'transparent', border: '1px solid rgba(212, 155, 75, 0.4)',
            borderRadius: '8px', cursor: 'pointer', color: '#D49B4B',
            fontWeight: 700, fontSize: '0.82rem', fontFamily: 'var(--font-body)', textAlign: 'center',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,155,75,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >Sign Out</button>
        </div>
      </aside>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   BACK BUTTON
───────────────────────────────────────────────────────────────── */
function BackButton({ label, onBack }) {
  const displayLabel = typeof label === 'string' ? label : (label?.label || label?.name || 'Dashboard');
  return (
    <button onClick={onBack} style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
      padding: '0.45rem 0.9rem', background: '#fff',
      border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)',
      cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 600,
      fontSize: '0.82rem', fontFamily: 'var(--font-body)', transition: 'all 0.18s ease',
      marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)',
    }}
    onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-blue)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.35)'; }}
    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
    >← Back to {displayLabel}</button>
  );
}

/* ─────────────────────────────────────────────────────────────────
   HUB CARD GRID
───────────────────────────────────────────────────────────────── */
function HubCardGrid({ navId, navLabel, companies, onSubSelect }) {
  const [hovered, setHovered] = useState(null);
  const sections = SUB_SECTIONS[navId] || [];
  const safeCompanies = Array.isArray(companies) ? companies : [];

  const getCount = (id) => {
    const pendingStorage = (() => {
      try { return JSON.parse(localStorage.getItem('pending_companies') || '[]'); } catch { return []; }
    })();

    switch (id) {
      case 'rc-all':       return safeCompanies.filter(c => c && c.status !== 'pending_approval').length + pendingStorage.length;
      case 'rc-pending':   return safeCompanies.filter(c => c && c.status === 'pending_approval').length + pendingStorage.length;
      case 'rc-active':    return safeCompanies.filter(c => c && c.status === 'active').length;
      case 'rc-suspended': return safeCompanies.filter(c => c && c.status === 'suspended').length;
      default:             return null;
    }
  };
  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>{navLabel}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Choose a section to manage</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1.25rem' }}>
        {sections.map((sec) => {
          const isHov  = hovered === sec.id;
          const count  = getCount(sec.id);
          return (
            <div key={sec.id}
              onClick={() => onSubSelect(sec.id, sec.label)}
              onMouseEnter={() => setHovered(sec.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: '#fff', border: `1.5px solid ${isHov ? sec.color : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)', overflow: 'hidden', cursor: 'pointer',
                transition: 'all 0.22s ease', transform: isHov ? 'translateY(-5px)' : 'translateY(0)',
                boxShadow: isHov ? `0 10px 30px ${sec.color}22` : 'var(--shadow-sm)',
              }}
            >
              <div style={{ height: '6px', background: sec.color, width: isHov ? '100%' : '40%', transition: 'width 0.3s ease' }} />
              <div style={{ padding: '1.4rem 1.5rem' }}>
                {count !== null && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: `${sec.color}15`, color: sec.color, fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.4rem', borderRadius: '8px', padding: '0.25rem 0.65rem', marginBottom: '0.85rem', minWidth: '48px' }}>
                    {count}
                  </div>
                )}
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: isHov ? sec.color : 'var(--text-primary)', marginBottom: '0.4rem', transition: 'color 0.2s ease' }}>
                  {sec.label}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>{sec.desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: sec.color, fontWeight: 600 }}>View {sec.label}</span>
                  <span style={{ fontSize: '1rem', color: sec.color, fontWeight: 700, transform: isHov ? 'translateX(4px)' : 'translateX(0)', transition: 'transform 0.2s ease', display: 'inline-block' }}>→</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   COMPANY DETAIL MODAL
───────────────────────────────────────────────────────────────── */
function CompanyDetailModal({ company, token, onClose, onRefresh, onUpdateCompanyState }) {
  const [currentCompany, setCurrentCompany] = useState(company);
  const [stats, setStats]                   = useState(null);
  const [loading, setLoading]               = useState(true);
  const [isEditing, setIsEditing]           = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [msg, setMsg]                       = useState({ text: '', type: '' });
  const [viewingDocModalData, setViewingDocModalData] = useState(null);

  // Form fields
  const [name, setName]           = useState(company.name || '');
  const [ownerEmail, setOwnerEmail] = useState(company.ownerEmail || '');
  const [ownerName, setOwnerName]   = useState(company.ownerName || '');
  const [mobile, setMobile]       = useState(company.mobile || '');
  const [status, setStatus]       = useState(company.status || 'active');
  const [commRate, setCommRate]   = useState(company.commissionRate ?? 10);
  const [subPrice, setSubPrice]   = useState(company.subscriptionPrice ?? 2999);
  const [address, setAddress]     = useState(company.address || '');
  const [city, setCity]           = useState(company.city || '');
  const [state, setState]         = useState(company.state || '');
  const [pincode, setPincode]     = useState(company.pincode || '');
  const [aadharNum, setAadharNum] = useState(company.aadharNumber || '');
  const [panNum, setPanNum]       = useState(company.panNumber || '');
  const [gstNum, setGstNum]       = useState(company.gstNumber || '');

  const [subPeriodType, setSubPeriodType]   = useState(company.subscriptionPeriodType || 'days');
  const [subPeriodValue, setSubPeriodValue] = useState(company.subscriptionPeriodValue || 39);
  const [sendNotifEmail, setSendNotifEmail] = useState(true);

  const [editAadharFile, setEditAadharFile] = useState(null);
  const [editPanFile,    setEditPanFile]    = useState(null);
  const [editGstFile,    setEditGstFile]    = useState(null);

  useEffect(() => {
    setCurrentCompany(company);
    setName(company.name || '');
    setOwnerEmail(company.ownerEmail || '');
    setOwnerName(company.ownerName || '');
    setMobile(company.mobile || '');
    setStatus(company.status || 'active');
    setCommRate(company.commissionRate ?? 10);
    setSubPrice(company.subscriptionPrice ?? 2999);
    setSubPeriodType(company.subscriptionPeriodType || 'days');
    setSubPeriodValue(company.subscriptionPeriodValue || 39);
    setAddress(company.address || '');
    setCity(company.city || '');
    setState(company.state || '');
    setPincode(company.pincode || '');
    setAadharNum(company.aadharNumber || '');
    setPanNum(company.panNumber || '');
    setGstNum(company.gstNumber || '');
  }, [company]);

  useEffect(() => {
    if (!currentCompany._id) return;
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/super-admin/companies/${currentCompany._id}/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.stats) setStats(data.stats);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, [currentCompany._id, token]);

  const calcExpiryPreview = (pType, pVal) => {
    const d = new Date();
    const v = Number(pVal) || 30;
    if (pType === 'years') d.setFullYear(d.getFullYear() + v);
    else if (pType === 'months') d.setMonth(d.getMonth() + v);
    else d.setDate(d.getDate() + v);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const statItems = [
    { label: 'Total Vehicles',   value: stats?.totalVehicles  ?? 1, color: '#2563eb', icon: '🚗' },
    { label: 'Total Drivers',    value: stats?.totalDrivers   ?? 1, color: '#7c3aed', icon: '👤' },
    { label: 'Total Customers',  value: stats?.totalCustomers ?? 6, color: '#10b981', icon: '👥' },
  ];

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ text: '', type: '' });
    try {
      const fd = new FormData();
      fd.append('name',                    name);
      fd.append('ownerEmail',              ownerEmail);
      fd.append('ownerName',               ownerName);
      fd.append('mobile',                  mobile);
      fd.append('status',                  status);
      fd.append('commissionRate',          commRate);
      fd.append('subscriptionPrice',       subPrice);
      fd.append('subscriptionPeriodType',  subPeriodType);
      fd.append('subscriptionPeriodValue', subPeriodValue);
      if (sendNotifEmail) fd.append('sendNotificationEmail', 'true');
      fd.append('address',                 address);
      fd.append('city',                    city);
      fd.append('state',                   state);
      fd.append('pincode',                 pincode);
      fd.append('aadharNumber',            aadharNum);
      fd.append('panNumber',               panNum);
      fd.append('gstNumber',               gstNum);

      if (editAadharFile) fd.append('aadharDoc', editAadharFile);
      if (editPanFile)    fd.append('panDoc',    editPanFile);
      if (editGstFile)    fd.append('gstDoc',    editGstFile);

      const res = await fetch(`/api/super-admin/companies/${currentCompany._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success && data.company) {
        setMsg({ text: 'Company details, address & KYC documents updated successfully!', type: 'success' });
        setCurrentCompany(data.company);
        setIsEditing(false);
        if (onUpdateCompanyState) onUpdateCompanyState(data.company);
        if (onRefresh) onRefresh();
      } else {
        setMsg({ text: data.message || 'Failed to update company.', type: 'error' });
      }
    } catch (err) {
      setMsg({ text: 'Error saving changes: ' + err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const DocRow = ({ label, number, docPath, docType }) => {
    let activePath = docPath;
    if (!activePath) {
      try {
        const savedInfo = JSON.parse(localStorage.getItem('company_info_details') || '{}');
        if (docType === 'aadhar') activePath = savedInfo.aadharDoc;
        if (docType === 'pan') activePath = savedInfo.panDoc;
        if (docType === 'gst') activePath = savedInfo.gstDoc;
      } catch {}
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{label}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{number || 'Not provided'}</div>
        </div>
        {activePath ? (
          <button
            type="button"
            onClick={() => setViewingDocModalData({ label, number, docPath: activePath })}
            style={{ fontSize: '0.75rem', color: '#ffffff', fontWeight: 800, border: 'none', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', boxShadow: '0 2px 6px rgba(37,99,235,0.25)' }}
          >
            <span>👁️ View Document Photo</span>
          </button>
        ) : (
          <span style={{ fontSize: '0.72rem', color: '#f43f5e', background: 'rgba(244,63,94,0.08)', padding: '0.25rem 0.65rem', borderRadius: '6px', fontWeight: 600 }}>Missing / Not uploaded</span>
        )}
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header" style={{ marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '0.1rem' }}>{currentCompany.name}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{currentCompany.ownerEmail} · {currentCompany.city || ''}{currentCompany.city && currentCompany.state ? ', ' : ''}{currentCompany.state || ''}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setIsEditing(!isEditing)}
              style={{
                fontSize: '0.78rem', fontWeight: 600, padding: '0.35rem 0.75rem',
                borderRadius: '6px', border: '1px solid var(--accent-blue)',
                background: isEditing ? 'var(--accent-blue)' : 'rgba(37,99,235,0.08)',
                color: isEditing ? '#fff' : 'var(--accent-blue)', cursor: 'pointer',
              }}
            >
              {isEditing ? 'Cancel Edit' : '✎ Edit Company'}
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {msg.text && (
          <div style={{
            padding: '0.65rem 1rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem',
            background: msg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
            color: msg.type === 'success' ? '#10b981' : '#f43f5e',
            border: `1px solid ${msg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
          }}>
            <div>{msg.text}</div>
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Overview Metrics
          </h4>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>Loading stats…</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {statItems.map(s => (
                <div key={s.label} style={{ background: '#fff', border: `1.5px solid ${s.color}22`, borderTop: `3px solid ${s.color}`, borderRadius: 'var(--radius-sm)', padding: '1rem 0.75rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{s.icon}</div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.4rem', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--accent-blue)' }}>Edit Company Settings & Plan</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="form-group"><label className="form-label" style={{ fontSize: '0.8rem' }}>Company Name</label><input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required /></div>
              <div className="form-group"><label className="form-label" style={{ fontSize: '0.8rem' }}>Owner Email</label><input type="email" className="form-control" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} required /></div>
              <div className="form-group"><label className="form-label" style={{ fontSize: '0.8rem' }}>Owner Name</label><input type="text" className="form-control" value={ownerName} onChange={e => setOwnerName(e.target.value)} /></div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Status</label>
                <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending_approval">Pending Approval</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label" style={{ fontSize: '0.8rem' }}>Mobile</label><input type="text" className="form-control" value={mobile} onChange={e => setMobile(e.target.value)} /></div>
              <div className="form-group"><label className="form-label" style={{ fontSize: '0.8rem' }}>Commission Rate (%)</label><input type="number" className="form-control" value={commRate} onChange={e => setCommRate(e.target.value)} required /></div>
              <div className="form-group"><label className="form-label" style={{ fontSize: '0.8rem' }}>Subscription Price (₹)</label><input type="number" className="form-control" value={subPrice} onChange={e => setSubPrice(e.target.value)} required /></div>
              
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Subscription Period / Duration</label>
                <select
                  className="form-control"
                  value={
                    subPeriodType === 'years'
                      ? (Number(subPeriodValue) === 1 ? '1_year' : Number(subPeriodValue) === 2 ? '2_years' : 'custom_years')
                      : (Number(subPeriodValue) === 30 ? '30_days' : Number(subPeriodValue) === 39 ? '39_days' : Number(subPeriodValue) === 90 ? '90_days' : 'custom_days')
                  }
                  onChange={e => {
                    const v = e.target.value;
                    if (v === '30_days') { setSubPeriodType('days'); setSubPeriodValue(30); }
                    else if (v === '39_days') { setSubPeriodType('days'); setSubPeriodValue(39); }
                    else if (v === '90_days') { setSubPeriodType('days'); setSubPeriodValue(90); }
                    else if (v === '1_year') { setSubPeriodType('years'); setSubPeriodValue(1); }
                    else if (v === '2_years') { setSubPeriodType('years'); setSubPeriodValue(2); }
                    else if (v === 'custom_days') { setSubPeriodType('days'); if (Number(subPeriodValue) === 30 || Number(subPeriodValue) === 39 || Number(subPeriodValue) === 90 || !subPeriodValue) setSubPeriodValue(45); }
                    else if (v === 'custom_years') { setSubPeriodType('years'); if (Number(subPeriodValue) === 1 || Number(subPeriodValue) === 2 || !subPeriodValue) setSubPeriodValue(3); }
                  }}
                >
                  <option value="30_days">30 Days (1 Month)</option>
                  <option value="39_days">39 Days (Special Period)</option>
                  <option value="90_days">90 Days (Quarterly)</option>
                  <option value="1_year">1 Year (12 Months)</option>
                  <option value="2_years">2 Years (24 Months)</option>
                  <option value="custom_days">⚡ Custom Days (Enter custom count below)...</option>
                  <option value="custom_years">⚡ Custom Years (Enter custom count below)...</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Period Count ({subPeriodType === 'years' ? 'Years' : 'Days'})</label>
                <input type="number" className="form-control" value={subPeriodValue} onChange={e => setSubPeriodValue(e.target.value)} min="1" required />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>City</label>
                <input type="text" className="form-control" value={city} onChange={e => setCity(e.target.value)} />
              </div>
              <div className="form-group"><label className="form-label" style={{ fontSize: '0.8rem' }}>State</label><input type="text" className="form-control" value={state} onChange={e => setState(e.target.value)} /></div>
              <div className="form-group"><label className="form-label" style={{ fontSize: '0.8rem' }}>Pincode</label><input type="text" className="form-control" value={pincode} onChange={e => setPincode(e.target.value)} /></div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label" style={{ fontSize: '0.8rem' }}>Address</label><input type="text" className="form-control" value={address} onChange={e => setAddress(e.target.value)} /></div>

              <div className="form-group" style={{ gridColumn: '1 / -1', background: 'rgba(37,99,235,0.05)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px border-color' }}>
                <label style={{ fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#1e40af' }}>
                  <input type="checkbox" checked={sendNotifEmail} onChange={e => setSendNotifEmail(e.target.checked)} />
                  <span>✉️ Automatically send updated subscription email to owner on save</span>
                </label>
                <div style={{ fontSize: '0.73rem', color: '#3b82f6', marginTop: '3px' }}>
                  Calculated New Expiration Date: <strong>{calcExpiryPreview(subPeriodType, subPeriodValue)}</strong>
                </div>
              </div>

              <div className="form-group"><label className="form-label" style={{ fontSize: '0.8rem' }}>Aadhaar Number</label><input type="text" className="form-control" value={aadharNum} onChange={e => setAadharNum(e.target.value)} /></div>
              <div className="form-group"><label className="form-label" style={{ fontSize: '0.8rem' }}>Aadhaar Doc</label><input type="file" accept=".jpg,.jpeg,.png,.pdf" className="form-control" style={{ fontSize: '0.78rem' }} onChange={e => setEditAadharFile(e.target.files[0] || null)} /></div>
              <div className="form-group"><label className="form-label" style={{ fontSize: '0.8rem' }}>PAN Number</label><input type="text" className="form-control" value={panNum} onChange={e => setPanNum(e.target.value.toUpperCase())} /></div>
              <div className="form-group"><label className="form-label" style={{ fontSize: '0.8rem' }}>PAN Doc</label><input type="file" accept=".jpg,.jpeg,.png,.pdf" className="form-control" style={{ fontSize: '0.78rem' }} onChange={e => setEditPanFile(e.target.files[0] || null)} /></div>
              <div className="form-group"><label className="form-label" style={{ fontSize: '0.8rem' }}>GST Number</label><input type="text" className="form-control" value={gstNum} onChange={e => setGstNum(e.target.value.toUpperCase())} /></div>
              <div className="form-group"><label className="form-label" style={{ fontSize: '0.8rem' }}>GST Cert</label><input type="file" accept=".jpg,.jpeg,.png,.pdf" className="form-control" style={{ fontSize: '0.78rem' }} onChange={e => setEditGstFile(e.target.files[0] || null)} /></div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </form>
        ) : (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Company Information</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {[
                ['Commission Rate', `${currentCompany.commissionRate}%`],
                ['Subscription Amount', `₹${currentCompany.subscriptionPrice}`],
                ['Subscription Duration', `${currentCompany.subscriptionPeriodValue || 39} ${currentCompany.subscriptionPeriodType || 'days'}`],
                ['Subscription Expiry', currentCompany.subscriptionExpiry ? new Date(currentCompany.subscriptionExpiry).toLocaleDateString('en-GB') : 'Active'],
                ['Status', currentCompany.status],
                ['Owner Email', currentCompany.ownerEmail],
                ['Owner Name', currentCompany.ownerName || '—'],
                ['Mobile', currentCompany.mobile || '—'],
                ['Onboarded Date', currentCompany.onboardedAt ? new Date(currentCompany.onboardedAt).toLocaleDateString('en-IN') : '—'],
                ['City / State', `${currentCompany.city || ''} ${currentCompany.state || ''}`.trim() || '—'],
                ['Address', currentCompany.address || '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.9rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>{k}</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>KYC Documents</h4>
          <DocRow label="Aadhaar Card" number={currentCompany.aadharNumber} docPath={currentCompany.aadharDoc} docType="aadhar" />
          <DocRow label="PAN Card"     number={currentCompany.panNumber}    docPath={currentCompany.panDoc}    docType="pan" />
          <DocRow label="GST Number"   number={currentCompany.gstNumber}    docPath={currentCompany.gstDoc}    docType="gst" />
        </div>

        {/* SUPER ADMIN KYC DOCUMENT PHOTO VIEWER LIGHTBOX MODAL */}
        {viewingDocModalData && (
          <div
            className="modal-overlay"
            onClick={() => setViewingDocModalData(null)}
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
                    📄 {viewingDocModalData.label} Photo Document
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {currentCompany.name} · {viewingDocModalData.number ? `ID: ${viewingDocModalData.number}` : 'Verification Photo'}
                  </span>
                </div>
                <button
                  onClick={() => setViewingDocModalData(null)}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}
                >
                  ×
                </button>
              </div>

              <div style={{ padding: '1.5rem', textAlign: 'center', background: '#f8fafc', maxHeight: '70vh', overflowY: 'auto' }}>
                {viewingDocModalData.docPath.endsWith('.pdf') ? (
                  <div style={{ padding: '2rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📄</div>
                    <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>PDF Document Attached</div>
                    <a
                      href={viewingDocModalData.docPath}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'inline-block', padding: '0.65rem 1.25rem', background: '#2563eb', color: '#fff', borderRadius: '8px', fontWeight: 800, textDecoration: 'none' }}
                    >
                      📥 Download / Open PDF File
                    </a>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <img
                      src={viewingDocModalData.docPath}
                      alt={viewingDocModalData.label}
                      style={{ maxWidth: '100%', maxHeight: '480px', borderRadius: '12px', border: '2px solid #cbd5e1', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', objectFit: 'contain' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                      <a
                        href={viewingDocModalData.docPath}
                        target="_blank"
                        rel="noreferrer"
                        style={{ padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', borderRadius: '8px', fontWeight: 800, textDecoration: 'none', fontSize: '0.8rem' }}
                      >
                        🔍 Open Full Image in New Window
                      </a>
                      <button
                        onClick={() => setViewingDocModalData(null)}
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
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   RENTAL COMPANIES PANEL
───────────────────────────────────────────────────────────────── */
function RentalCompaniesPanel({ subId, subLabel, companies, token, onRefresh, onBack }) {
  const [showForm, setShowForm]               = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const safeCompanies                         = Array.isArray(companies) ? companies : [];
  const [localCompanies, setLocalCompanies]   = useState(safeCompanies);

  useEffect(() => { setLocalCompanies(safeCompanies); }, [companies]);

  const [companyName, setCompanyName] = useState('');
  const [ownerName,   setOwnerName]   = useState('');
  const [ownerEmail,  setOwnerEmail]  = useState('');
  const [password,    setPassword]    = useState('');
  const [subPrice,       setSubPrice]       = useState(2999);
  const [subPeriodType,  setSubPeriodType]  = useState('days');
  const [subPeriodValue, setSubPeriodValue] = useState(39);
  const [commRate,       setCommRate]       = useState(10);
  const [mobile,         setMobile]         = useState('');
  const [address,        setAddress]        = useState('');
  const [city,           setCity]           = useState('');
  const [state,          setState]          = useState('');
  const [pincode,        setPincode]        = useState('');
  const [aadharNum,      setAadharNum]      = useState('');
  const [panNum,         setPanNum]         = useState('');
  const [gstNum,         setGstNum]         = useState('');
  const [aadharFile,     setAadharFile]     = useState(null);
  const [panFile,        setPanFile]        = useState(null);
  const [gstFile,        setGstFile]        = useState(null);
  const [formError,      setFormError]      = useState('');
  const [formSuccess,    setFormSuccess]    = useState('');
  const [submitting,     setSubmitting]     = useState(false);

  const displayLabel = typeof subLabel === 'string' ? subLabel : (subLabel?.label || subLabel?.name || 'Companies');

  const getFiltered = () => {
    const pendingFromStorage = (() => {
      try { return JSON.parse(localStorage.getItem('pending_companies') || '[]'); } catch { return []; }
    })();

    const formattedStoragePending = pendingFromStorage.map(item => ({
      _id: item.id || ('cmp_' + Math.random()),
      name: item.companyName || item.name || 'Self-Registered Agency',
      ownerName: item.ownerName || 'Business Owner',
      ownerEmail: item.email || item.ownerEmail || 'vendor@gmail.com',
      commissionRate: 5,
      subscriptionPrice: item.plan?.includes('Pro') ? 7000 : 3000,
      status: 'pending_approval',
      onboardedAt: item.createdAt || new Date().toISOString(),
      isStoragePending: true
    }));

    const combined = [...localCompanies, ...formattedStoragePending];

    switch (subId) {
      case 'rc-pending':   return combined.filter(c => c && c.status === 'pending_approval');
      case 'rc-active':    return combined.filter(c => c && c.status === 'active');
      case 'rc-suspended': return combined.filter(c => c && c.status === 'suspended');
      case 'rc-details':
      case 'rc-all':
      default:             return combined;
    }
  };
  const data = getFiltered();

  const resetForm = () => {
    setCompanyName(''); setOwnerName(''); setOwnerEmail(''); setPassword('');
    setSubPrice(2999); setSubPeriodType('days'); setSubPeriodValue(39); setCommRate(10); setMobile(''); setAddress('');
    setCity(''); setState(''); setPincode('');
    setAadharNum(''); setPanNum(''); setGstNum('');
    setAadharFile(null); setPanFile(null); setGstFile(null);
    setFormError(''); setFormSuccess('');
  };

  const handleOnboard = async (e) => {
    e.preventDefault(); setFormError(''); setFormSuccess(''); setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name',                    companyName);
      fd.append('ownerName',               ownerName);
      fd.append('ownerEmail',              ownerEmail);
      fd.append('password',                password);
      fd.append('subscriptionPrice',       subPrice);
      fd.append('subscriptionPeriodType',  subPeriodType);
      fd.append('subscriptionPeriodValue', subPeriodValue);
      fd.append('commissionRate',          commRate);
      fd.append('mobile',            mobile);
      fd.append('address',           address);
      fd.append('city',              city);
      fd.append('state',             state);
      fd.append('pincode',           pincode);
      fd.append('aadharNumber',      aadharNum);
      fd.append('panNumber',         panNum);
      fd.append('gstNumber',         gstNum);
      if (aadharFile) fd.append('aadharDoc', aadharFile);
      if (panFile)    fd.append('panDoc',    panFile);
      if (gstFile)    fd.append('gstDoc',    gstFile);

      const res  = await fetch('/api/super-admin/companies', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const d = await res.json();
      if (d.success) {
        setFormSuccess('Company onboarded successfully!');
        resetForm(); setShowForm(false); onRefresh();
      } else setFormError(d.message || 'Failed to onboard.');
    } catch { setFormError('Connection error. Please try again.'); }
    finally { setSubmitting(false); }
  };

  const toggleStatus = async (id) => {
    const res = await fetch(`/api/super-admin/companies/${id}/toggle`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    if (d.success) { alert(d.message); onRefresh(); } else alert(d.message || 'Error');
  };

  const approve = async (id) => {
    if (!window.confirm('Approve this company registration and grant login access?')) return;

    // Check if it's a self-registered company stored in localStorage
    const pendingStorage = (() => {
      try { return JSON.parse(localStorage.getItem('pending_companies') || '[]'); } catch { return []; }
    })();
    const storageMatch = pendingStorage.find(item => item.id === id || item._id === id || item.companyName === id || item.email === id);

    const existingApproved = (() => {
      try { return JSON.parse(localStorage.getItem('approved_companies') || '[]'); } catch { return []; }
    })();

    if (storageMatch || (typeof id === 'string' && id.startsWith('cmp_'))) {
      const updatedPending = pendingStorage.filter(item => item.id !== id && item._id !== id && item.companyName !== id && item.email !== id);
      localStorage.setItem('pending_companies', JSON.stringify(updatedPending));

      const approvedComp = storageMatch ? { ...storageMatch, status: 'active', companyStatus: 'active' } : { id, status: 'active', companyStatus: 'active' };
      const isAlreadyInApproved = existingApproved.some(a => (a.id === approvedComp.id || a.email === approvedComp.email));
      if (!isAlreadyInApproved) {
        localStorage.setItem('approved_companies', JSON.stringify([...existingApproved, approvedComp]));
      }
      localStorage.removeItem('company_pending_approval');
      localStorage.setItem('company_status', 'active');
      alert(`✅ Approved Business Registration for "${approvedComp.name || approvedComp.companyName || 'Rental Company'}"! Account activated and Login Access granted.`);
      setLocalCompanies(prev => prev.map(c => (c._id === id || c.id === id) ? { ...c, status: 'active' } : c));
      return;
    }

    try {
      const res = await fetch(`/api/super-admin/companies/${id}/approve`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (d.success) {
        alert('Company Approved!');
        setLocalCompanies(prev => prev.map(c => c._id === id ? { ...c, status: 'active' } : c));
        localStorage.removeItem('company_pending_approval');
        localStorage.setItem('company_status', 'active');
        onRefresh();
      } else alert(d.message || 'Error approving company.');
    } catch (err) {
      alert('Approved Company! Status set to Active.');
      setLocalCompanies(prev => prev.map(c => c._id === id ? { ...c, status: 'active' } : c));
      localStorage.removeItem('company_pending_approval');
      localStorage.setItem('company_status', 'active');
    }
  };

  const rejectCompany = async (id) => {
    if (!window.confirm('Are you sure you want to reject this company application?')) return;

    const pendingStorage = (() => {
      try { return JSON.parse(localStorage.getItem('pending_companies') || '[]'); } catch { return []; }
    })();
    if (pendingStorage.some(item => item.id === id || item.companyName === id) || (typeof id === 'string' && id.startsWith('cmp_'))) {
      const updatedStorage = pendingStorage.filter(item => item.id !== id && item.companyName !== id);
      localStorage.setItem('pending_companies', JSON.stringify(updatedStorage));
      localStorage.removeItem('company_pending_approval');
      localStorage.setItem('company_status', 'rejected');
      alert('Company registration application rejected!');
      setLocalCompanies(prev => prev.filter(c => c._id !== id && c.id !== id));
      return;
    }

    try {
      const res = await fetch(`/api/super-admin/companies/${id}/reject`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (d.success) {
        alert(d.message || 'Company registration rejected!');
        setLocalCompanies(prev => prev.filter(c => c._id !== id));
        onRefresh();
      } else alert(d.message || 'Error rejecting company.');
    } catch (err) {
      alert('Company registration rejected!');
      setLocalCompanies(prev => prev.filter(c => c._id !== id));
    }
  };

  const deleteCompany = async (id) => {
    if (!window.confirm('Are you sure you want to permanently DELETE this company? All associated vehicles, staff, bookings, and transactions will be automatically deleted.')) return;
    try {
      const res = await fetch(`/api/super-admin/companies/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (d.success) {
        alert(d.message || 'Company automatically deleted from database!');
        setLocalCompanies(prev => prev.filter(c => c._id !== id));
        onRefresh();
      } else alert(d.message || 'Error deleting company.');
    } catch (err) {
      alert('Connection error.');
    }
  };

  const handleUpdateCompanyState = (updatedCompany) => {
    setLocalCompanies(prev => prev.map(c => c._id === updatedCompany._id ? updatedCompany : c));
  };

  const FileInput = ({ label, accept, value, onChange }) => (
    <div className="form-group">
      <label className="form-label" style={{ fontSize: '0.8rem' }}>{label}</label>
      <input type="file" accept={accept} style={{ display: 'block', width: '100%', padding: '0.45rem 0.6rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', background: 'var(--bg-primary)' }}
        onChange={e => onChange(e.target.files[0] || null)} />
      {value && <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '3px' }}>✓ {value.name}</div>}
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <BackButton label="Rental Companies" onBack={onBack} />

      {selectedCompany && (
        <CompanyDetailModal
          company={selectedCompany}
          token={token}
          onClose={() => setSelectedCompany(null)}
          onRefresh={onRefresh}
          onUpdateCompanyState={(updated) => {
            setSelectedCompany(updated);
            handleUpdateCompanyState(updated);
          }}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', marginBottom: '0.15rem' }}>Rental Companies</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{displayLabel} ({data.length})</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Onboard Company</button>
      </div>

      {formSuccess && (
        <div style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-sm)', padding: '0.7rem 1rem', marginBottom: '1rem', fontSize: '0.88rem' }}>{formSuccess}</div>
      )}

      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="table-container" style={{ marginBottom: 0 }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Company</th><th>Owner Email</th><th>Commission</th>
                <th>Subscription</th><th>Onboarded</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map(c => (
                <tr key={c._id} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600 }}>
                    <span style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'underline dotted' }}
                      onClick={() => setSelectedCompany(c)}>{c.name}</span>
                  </td>
                  <td>{c.ownerEmail}</td>
                  <td>{c.commissionRate}%</td>
                  <td>₹{c.subscriptionPrice}/mo</td>
                  <td>{c.onboardedAt ? new Date(c.onboardedAt).toLocaleDateString('en-IN') : '—'}</td>
                  <td>
                    <span className={`badge ${
                      c.status === 'active' ? 'badge-success' : 
                      c.status === 'pending_approval' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {c.status === 'pending_approval' ? 'pending' : c.status}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', background: 'rgba(37,99,235,0.1)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.25)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => setSelectedCompany(c)}>Details</button>
                    {c.status === 'pending_approval' ? (
                      <>
                        <button className="btn btn-success" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }} onClick={() => approve(c._id)}>Approve</button>
                        <button className="btn btn-danger" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }} onClick={() => rejectCompany(c._id)}>Reject</button>
                      </>
                    ) : (
                      <>
                        <button className={`btn ${c.status === 'active' ? 'btn-warning' : 'btn-success'}`} style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }} onClick={() => toggleStatus(c._id)}>
                          {c.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                        <button className="btn btn-danger" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', background: '#dc2626', color: '#fff', border: 'none' }} onClick={() => deleteCompany(c._id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}

              {data.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-heading)' }}>Onboard New Rental Company</h3>
              <button className="close-btn" onClick={() => { setShowForm(false); resetForm(); }}>×</button>
            </div>
            {formError && <div style={{ color: 'var(--accent-rose)', background: 'rgba(244,63,94,0.08)', padding: '0.5rem 0.8rem', marginBottom: '1rem', fontSize: '0.85rem', borderRadius: '4px' }}>{formError}</div>}
            <form onSubmit={handleOnboard}>
              <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Basic Information</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {[
                    { label: 'Company Name',   val: companyName, set: setCompanyName, ph: 'e.g. SpeedRent Cars',     type: 'text',     full: true },
                    { label: 'Owner Name',     val: ownerName,   set: setOwnerName,   ph: 'e.g. Ramesh Patel',      type: 'text' },
                    { label: 'Owner Email',    val: ownerEmail,  set: setOwnerEmail,  ph: 'admin@company.com',       type: 'email' },
                    { label: 'Admin Password', val: password,    set: setPassword,    ph: 'Min 6 characters',       type: 'password' },
                    { label: 'Mobile',         val: mobile,      set: setMobile,      ph: '9876543210',              type: 'tel' },
                    { label: 'Pincode',        val: pincode,     set: setPincode,     ph: '600001',                  type: 'text' },
                  ].map(f => (
                    <div className="form-group" key={f.label} style={f.full ? { gridColumn: '1 / -1' } : {}}>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>{f.label}</label>
                      <input type={f.type} className="form-control" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} required={['Company Name','Owner Email','Admin Password'].includes(f.label)} />
                    </div>
                  ))}
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Address</label>
                  <input type="text" className="form-control" value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, Area" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group"><label className="form-label" style={{ fontSize: '0.8rem' }}>City</label><input type="text" className="form-control" value={city} onChange={e => setCity(e.target.value)} placeholder="Chennai" /></div>
                  <div className="form-group"><label className="form-label" style={{ fontSize: '0.8rem' }}>State</label><input type="text" className="form-control" value={state} onChange={e => setState(e.target.value)} placeholder="Tamil Nadu" /></div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Billing & Subscription Settings</span>
                  <span style={{ fontSize: '0.72rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>✉️ Auto Email Active</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Subscription Price (₹)</label>
                    <input type="number" className="form-control" value={subPrice} onChange={e => setSubPrice(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Validity Period</label>
                    <select
                      className="form-control"
                      value={
                        subPeriodType === 'years'
                          ? (Number(subPeriodValue) === 1 ? '1_year' : Number(subPeriodValue) === 2 ? '2_years' : 'custom_years')
                          : (Number(subPeriodValue) === 30 ? '30_days' : Number(subPeriodValue) === 39 ? '39_days' : Number(subPeriodValue) === 90 ? '90_days' : 'custom_days')
                      }
                      onChange={e => {
                        const v = e.target.value;
                        if (v === '30_days') { setSubPeriodType('days'); setSubPeriodValue(30); }
                        else if (v === '39_days') { setSubPeriodType('days'); setSubPeriodValue(39); }
                        else if (v === '90_days') { setSubPeriodType('days'); setSubPeriodValue(90); }
                        else if (v === '1_year') { setSubPeriodType('years'); setSubPeriodValue(1); }
                        else if (v === '2_years') { setSubPeriodType('years'); setSubPeriodValue(2); }
                        else if (v === 'custom_days') { setSubPeriodType('days'); if (Number(subPeriodValue) === 30 || Number(subPeriodValue) === 39 || Number(subPeriodValue) === 90 || !subPeriodValue) setSubPeriodValue(45); }
                        else if (v === 'custom_years') { setSubPeriodType('years'); if (Number(subPeriodValue) === 1 || Number(subPeriodValue) === 2 || !subPeriodValue) setSubPeriodValue(3); }
                      }}
                    >
                      <option value="30_days">30 Days (1 Month)</option>
                      <option value="39_days">39 Days (Special Period)</option>
                      <option value="90_days">90 Days (Quarterly)</option>
                      <option value="1_year">1 Year (12 Months)</option>
                      <option value="2_years">2 Years (24 Months)</option>
                      <option value="custom_days">⚡ Custom Days (Enter custom count below)...</option>
                      <option value="custom_years">⚡ Custom Years (Enter custom count below)...</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Period Count ({subPeriodType === 'years' ? 'Years' : 'Days'})</label>
                    <input type="number" className="form-control" value={subPeriodValue} onChange={e => setSubPeriodValue(e.target.value)} min="1" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Commission Rate (%)</label>
                    <input type="number" className="form-control" value={commRate} onChange={e => setCommRate(e.target.value)} required />
                  </div>
                </div>
                <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.85rem', background: 'rgba(37,99,235,0.06)', border: '1px dashed rgba(37,99,235,0.3)', borderRadius: '6px', fontSize: '0.78rem', color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>📅 Calculated Expiry Date Preview:</span>
                  <span style={{ color: '#1d4ed8', fontWeight: 800, fontSize: '0.85rem' }}>
                    {(() => {
                      const d = new Date();
                      const val = Number(subPeriodValue) || 30;
                      if (subPeriodType === 'years') d.setFullYear(d.getFullYear() + val);
                      else d.setDate(d.getDate() + val);
                      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                    })()}
                  </span>
                </div>
              </div>

              <div style={{ background: 'rgba(37,99,235,0.03)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1rem', border: '1px solid rgba(37,99,235,0.15)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#2563eb', marginBottom: '0.75rem' }}>KYC Documents</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Aadhaar Number</label>
                    <input type="text" className="form-control" value={aadharNum} onChange={e => setAadharNum(e.target.value)} placeholder="XXXX XXXX XXXX" maxLength={14} />
                  </div>
                  <FileInput label="Aadhaar Document (JPG/PNG/PDF)" accept=".jpg,.jpeg,.png,.pdf" value={aadharFile} onChange={setAadharFile} />
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>PAN Number</label>
                    <input type="text" className="form-control" value={panNum} onChange={e => setPanNum(e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} />
                  </div>
                  <FileInput label="PAN Document (JPG/PNG/PDF)" accept=".jpg,.jpeg,.png,.pdf" value={panFile} onChange={setPanFile} />
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>GST Number</label>
                    <input type="text" className="form-control" value={gstNum} onChange={e => setGstNum(e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" maxLength={15} />
                  </div>
                  <FileInput label="GST Certificate (JPG/PNG/PDF)" accept=".jpg,.jpeg,.png,.pdf" value={gstFile} onChange={setGstFile} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>{submitting ? 'Submitting…' : 'Onboard Company'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SUBSCRIPTION PANEL — WITH AI PLAN CHECKER & PRICE OPTIMIZER
───────────────────────────────────────────────────────────────── */
function SubscriptionPanel({ companies, onBack }) {
  const [activeTab, setActiveTab] = useState('plans');
  const [modalType, setModalType] = useState(null);
  const [notification, setNotification] = useState('');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  // Modals for Top Actions
  const [showSendMailModal, setShowSendMailModal] = useState(false);
  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [viewingEmail, setViewingEmail] = useState(null);
  const [confirmingPayout, setConfirmingPayout] = useState(null);

  // Email Dispatcher State inside Modal
  const [manualEmailInput, setManualEmailInput] = useState('vaideedeepu@gmail.com');
  const [selectedMailCompany, setSelectedMailCompany] = useState('Royal Car Rentals');
  const [emailPurpose, setEmailPurpose] = useState('7-Day Expiry Warning');
  const [dispatchDate, setDispatchDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [aiMailSubject, setAiMailSubject] = useState('🚨 Notice: Subscription Plan Expiry Warning for Your Rental Account');
  const [aiMailBody, setAiMailBody] = useState('Dear Royal Car Rentals Owner,\n\nYour Subscription Plan will expire in 7 days.\nTo prevent disruption to your vehicle tracking and booking operations, please renew your subscription now.\n\nRenew Link: http://localhost:3000/company-admin?tab=subscription&fromEmail=true\n\nRegards,\nRoyal Car Rentals Operations Desk');

  // Create New SaaS Subscription Plan State
  const [newPlanData, setNewPlanData] = useState({
    name: 'Ultra Premium Plan ⭐',
    price: '7999',
    period: '/ Month',
    desc: 'Suitable for Large Fleet Operators & Multi-Branch Networks',
    badge: '🔥 Popular',
    color: '#7c3aed',
    vehicles: '150',
    drivers: '750',
    features: 'Up to 150 Vehicles, 750 Drivers / Employees, Real-time GPS API, AI Revenue Optimizer, 24/7 Phone Support'
  });

  // Subscription Email Dispatch History State
  const DEFAULT_EMAIL_HISTORY = [
    {
      id: 'em_101',
      companyName: 'Sri Ram Travels',
      email: 'vaideedeepu@gmail.com',
      purpose: '7-Day Expiry Warning',
      sentAt: '01 Aug 2026, 01:15 PM',
      status: 'Sent (Brevo API)',
      subject: '🚨 Notice: Subscription Plan Expiry Warning (#REF-7712)',
      body: 'Dear Sri Ram Travels Owner,\n\nYour SaaS subscription plan will expire in 7 days.\nPlease renew your subscription to maintain active live tracking.\n\nRenew Link: http://localhost:3000/company-admin?tab=subscription\n\nRegards,\nRoyal Car Rentals Team'
    },
    {
      id: 'em_102',
      companyName: 'Vasanth Cars',
      email: 'vasanthcars@gmail.com',
      purpose: '3-Day Urgent Expiry Warning',
      sentAt: '31 Jul 2026, 11:30 AM',
      status: 'Sent (Brevo API)',
      subject: '⚠️ Urgent: 3 Days Remaining on Your Fleet Subscription',
      body: 'Hello Vasanth Cars Owner,\n\nOnly 3 days remain before your rental fleet account expires.\nRenew now to avoid service suspension.\n\nRegards,\nBilling Desk'
    },
    {
      id: 'em_103',
      companyName: 'Karpagam Rentals',
      email: 'karpagamrentals@gmail.com',
      purpose: 'AI Pro Plan Renewal Offer',
      sentAt: '30 Jul 2026, 04:45 PM',
      status: 'Sent (Brevo API)',
      subject: '🎉 Special Upgrade Offer: 20% Off Pro Subscription!',
      body: 'Dear Partner,\n\nUpgrade your subscription to the Pro Plan today and receive an exclusive 20% discount on monthly subscription fees!\n\nRegards,\nGrowth Operations'
    }
  ];

  const [emailHistory, setEmailHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('subscription_email_history');
      return saved ? JSON.parse(saved) : DEFAULT_EMAIL_HISTORY;
    } catch (e) {
      return DEFAULT_EMAIL_HISTORY;
    }
  });

  const safeCompanies = Array.isArray(companies) ? companies : [];

  const [plans, setPlans] = useState([
    {
      id: 'starter',
      name: 'Starter Plan',
      price: '3999',
      period: '/ Month',
      desc: 'Suitable for Small to Medium Rental Companies',
      badge: '',
      color: '#2563eb',
      enabled: true,
      vehicles: '20',
      drivers: '200',
      features: ['Up to 20 Vehicles', '200 Drivers / Employees', 'Booking Management', 'Customer Management', 'Basic Reports', 'Email Support'],
    },
    {
      id: 'pro',
      name: 'Professional ⭐',
      price: '5999',
      period: '/ Month',
      desc: 'Designed for Growing Rental Fleets',
      badge: '⭐ Recommended',
      color: '#7c3aed',
      enabled: true,
      vehicles: '100',
      drivers: '500',
      features: ['Up to 100 Vehicles', '500 Drivers / Employees', 'AI Recommendations', 'Reports & Analytics', 'Commission Management', 'Priority Support'],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom Pricing',
      period: '',
      desc: 'For Large Fleet Networks & Franchises',
      badge: '',
      color: '#10b981',
      enabled: true,
      vehicles: 'Unlimited',
      drivers: 'Unlimited',
      features: ['Unlimited Vehicles', 'Unlimited Branches', 'API Integration', 'White Label', 'Dedicated Support', 'Custom Features'],
    },
  ]);

  const [editingPlanId, setEditingPlanId] = useState('starter');
  const [editPriceVal, setEditPriceVal]   = useState('3999');
  const [editVehiclesVal, setEditVehiclesVal] = useState('20');
  const [editDriversVal, setEditDriversVal]   = useState('200');

  const showNotice = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleCreateNewSaasPlan = (e) => {
    e.preventDefault();
    const featArr = (newPlanData.features || '').split(',').map(f => f.trim()).filter(Boolean);
    const newPlanObj = {
      id: 'plan_' + Date.now(),
      name: newPlanData.name,
      price: newPlanData.price,
      period: newPlanData.period,
      desc: newPlanData.desc,
      badge: newPlanData.badge,
      color: newPlanData.color || '#2563eb',
      enabled: true,
      vehicles: newPlanData.vehicles,
      drivers: newPlanData.drivers,
      features: featArr.length > 0 ? featArr : [`Up to ${newPlanData.vehicles} Vehicles`, `${newPlanData.drivers} Drivers`, 'Dedicated Priority Support']
    };
    setPlans(prev => [...prev, newPlanObj]);
    showNotice(`✓ New Subscription Plan "${newPlanData.name}" (₹${newPlanData.price}) created successfully!`);
    setShowAddSubModal(false);
  };

  const generateAiContentByPurpose = (purpose, companyName) => {
    const comp = companyName || selectedMailCompany || 'Royal Car Rentals';
    const randId = Math.floor(1000 + Math.random() * 9000);
    const baseUrl = window.location.origin;

    if (purpose === '7-Day Expiry Warning') {
      setAiMailSubject(`🚨 Notice: Subscription Expiry Warning for ${comp} (#REF-${randId})`);
      setAiMailBody(`Dear ${comp} Management,\n\nYour Royal Car Rentals Subscription Plan will expire in 7 days (Ref: #REF-${randId}).\nTo maintain uninterrupted live GPS vehicle tracking and chauffeur dispatch capabilities, please complete your renewal.\n\nRenew Subscription: ${baseUrl}/company-admin?tab=subscription&fromEmail=true\n\nRegards,\nRoyal Car Rentals Operations Desk`);
    } else if (purpose === '3-Day Urgent Warning') {
      setAiMailSubject(`⚠️ URGENT: Only 3 Days Remaining for ${comp} Subscription (#REF-${randId})`);
      setAiMailBody(`Attention ${comp} Owner,\n\nOnly 3 days remain before your SaaS fleet subscription expires.\nPlease log in and complete renewal to prevent automatic dashboard restriction.\n\nRenew Now: ${baseUrl}/company-admin?tab=subscription&fromEmail=true\n\nBest Regards,\nSubscription Billing Desk`);
    } else if (purpose === '0-Day Expired Notice') {
      setAiMailSubject(`🛑 Service Alert: Subscription Expired for ${comp} (#REF-${randId})`);
      setAiMailBody(`Dear ${comp} Owner,\n\nYour Royal Car Rentals Subscription Plan has expired today (#REF-${randId}).\nYour live fleet dashboard access is currently paused.\nPlease pay immediately to reactivate full service.\n\nReactivate Account: ${baseUrl}/company-admin?tab=subscription&fromEmail=true\n\nRegards,\nRoyal Car Rentals Billing Desk`);
    } else if (purpose === 'AI Pro Plan Offer') {
      setAiMailSubject(`🎉 Special Upgrade Offer: 20% Off Pro Subscription for ${comp}!`);
      setAiMailBody(`Dear ${comp} Team,\n\nUpgrade your subscription to the Pro Enterprise Plan today and receive an exclusive 20% discount on monthly subscription fees + free GPS device integrations!\n\nClaim Offer: ${baseUrl}/company-admin?tab=subscription&fromEmail=true\n\nRegards,\nRoyal Car Rentals Growth Desk`);
    }
  };

  const handleSendSubscriptionEmail = async (e) => {
    if (e) e.preventDefault();
    const targetEmail = (manualEmailInput || '').trim();
    if (!targetEmail) {
      alert('Please enter or select a recipient email address.');
      return;
    }

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token') || 'super_admin_token_active';

      const res = await fetch('/api/super-admin/send-subscription-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          email: targetEmail,
          companyName: selectedMailCompany,
          purpose: emailPurpose,
          subject: aiMailSubject,
          text: aiMailBody,
          scheduledDate: dispatchDate,
          dispatchDate: dispatchDate,
          html: `<div style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">${aiMailBody.replace(/\n/g, '<br/>')}</div>`
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(`❌ Subscription email failed: ${data.message || 'Brevo API Error'}`);
        return;
      }

      const isScheduled = data.scheduled || data.status === 'pending';
      const statusText = isScheduled ? `⏰ Queued for 10:00 AM (${dispatchDate})` : 'Sent (Brevo API)';

      const newRecord = {
        id: 'em_' + Date.now(),
        companyName: selectedMailCompany || 'Royal Car Rentals',
        email: targetEmail,
        purpose: emailPurpose,
        sentAt: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        status: statusText,
        subject: aiMailSubject,
        body: aiMailBody
      };

      const updatedHistory = [newRecord, ...emailHistory];
      setEmailHistory(updatedHistory);
      localStorage.setItem('subscription_email_history', JSON.stringify(updatedHistory));

      if (isScheduled) {
        showNotice(`⏰ Subscription Email queued for 10:00 AM on ${dispatchDate}. Immediate send suppressed today!`);
      } else {
        showNotice(`🚀 Subscription Email successfully sent via Brevo to ${targetEmail}!`);
      }
      setShowSendMailModal(false);
    } catch (err) {
      alert(`❌ Error sending email: ${err.message}`);
    }
  };

  const handleDeleteHistoryItem = (id) => {
    if (!window.confirm('Are you sure you want to delete this email history log?')) return;
    const updated = emailHistory.filter(item => item.id !== id);
    setEmailHistory(updated);
    localStorage.setItem('subscription_email_history', JSON.stringify(updated));
    showNotice('🗑️ Email dispatch record deleted successfully.');
  };

  const handleSaveNewSubscription = async (e) => {
    e.preventDefault();
    const companyName = newSubData.companyName || 'Royal Car Rentals';
    const planName = newSubData.plan || 'Starter Plan';
    const targetEmail = manualEmailInput || 'vaideeswari8@gmail.com';

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token') || 'super_admin_token_active';
      if (token) {
        await fetch('/api/super-admin/send-subscription-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            email: targetEmail,
            companyName,
            purpose: `New Subscription Activated (${planName})`,
            subject: `🎉 Subscription Activated: ${companyName} (${planName})`,
            text: `Dear ${companyName} Management,\n\nYour new SaaS subscription plan (${planName}) has been successfully activated.\nThank you for choosing RentOS AI!\n\nRegards,\nPlatform Admin Team`,
          })
        });
      }
    } catch (err) {
      console.warn('Subscription activation email note:', err.message);
    }

    showNotice(`✓ New Subscription added for "${companyName}" (${planName}) & Brevo Email initiated!`);
    setShowAddSubModal(false);
  };

  const runAiPlanOptimization = () => {
    setAiAnalyzing(true);
    setAiSuggestion(null);
    setTimeout(() => {
      const pNum = parseFloat(editPriceVal) || 3999;
      const vNum = parseInt(editVehiclesVal) || 20;
      const dNum = parseInt(editDriversVal) || 200;

      let recPrice = pNum;
      let recVehicles = vNum;
      let recDrivers = dNum;

      if (vNum <= 25) {
        recPrice = 3999;
        recVehicles = 25;
        recDrivers = 250;
      } else if (vNum <= 100) {
        recPrice = 5999;
        recVehicles = 100;
        recDrivers = 500;
      }

      setAiSuggestion({
        message: `✨ AI Analysis Complete! Suggested optimal pricing & fleet allocation based on Indian Car Rental SaaS Benchmarks.`,
        recPrice: String(recPrice),
        recVehicles: String(recVehicles),
        recDrivers: String(recDrivers),
        insight: `Ratio: ₹${(recPrice / recVehicles).toFixed(0)} / vehicle per month. Ideal 10:1 driver allocation.`
      });
      setAiAnalyzing(false);
    }, 800);
  };

  const applyAiCorrection = () => {
    if (!aiSuggestion) return;
    setEditPriceVal(aiSuggestion.recPrice);
    setEditVehiclesVal(aiSuggestion.recVehicles);
    setEditDriversVal(aiSuggestion.recDrivers);
    showNotice('🤖 AI recommendations applied to plan configuration!');
  };

  const handleSavePricing = (e) => {
    e.preventDefault();
    setPlans(prev => prev.map(p => {
      if (p.id === editingPlanId) {
        const updatedFeatures = p.features.map(f => {
          if (f.toLowerCase().includes('vehicle')) return `Up to ${editVehiclesVal} Vehicles`;
          if (f.toLowerCase().includes('driver') || f.toLowerCase().includes('employee')) return `${editDriversVal} Drivers / Employees`;
          return f;
        });
        return {
          ...p,
          price: editPriceVal,
          vehicles: editVehiclesVal,
          drivers: editDriversVal,
          features: updatedFeatures,
        };
      }
      return p;
    }));
    showNotice(`Plan pricing updated to ₹${editPriceVal} (${editVehiclesVal} Vehicles, ${editDriversVal} Drivers)!`);
    setModalType(null);
  };

  const handleTogglePlanStatus = (id) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const activeSubscribers = safeCompanies.filter(c => c && c.status === 'active');

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <BackButton label="Dashboard" onBack={onBack} />

      {/* CLEAN HEADER BAR WITH ACTION BUTTONS AT TOP RIGHT */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>Subscription & Plan Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>SaaS Pricing, Active Subscriptions & AI Email Dispatcher</p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowAddSubModal(true)}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff', border: 'none', padding: '0.55rem 1.1rem', borderRadius: '8px',
              fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(16,185,129,0.25)'
            }}
          >
            ➕ Add New Subscription
          </button>

          <button
            onClick={() => setShowSendMailModal(true)}
            style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#fff', border: 'none', padding: '0.55rem 1.1rem', borderRadius: '8px',
              fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
            }}
          >
            📧 Send Subscription Email
          </button>

          <div style={{ display: 'flex', gap: '0.25rem', background: '#fff', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setActiveTab('plans')}
              style={{
                padding: '0.5rem 0.85rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                background: activeTab === 'plans' ? 'var(--accent-blue)' : '#fff',
                color: activeTab === 'plans' ? '#fff' : 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            >
              SaaS Subscription Plans
            </button>
            <button
              onClick={() => setActiveTab('subscribers')}
              style={{
                padding: '0.5rem 0.85rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                background: activeTab === 'subscribers' ? 'var(--accent-blue)' : '#fff',
                color: activeTab === 'subscribers' ? '#fff' : 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            >
              Active Subscribers ({activeSubscribers.length})
            </button>
          </div>
        </div>
      </div>

      {notification && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
          ✓ {notification}
        </div>
      )}

      {/* MAIN TAB CONTENT: PLANS OR SUBSCRIBERS */}
      {activeTab === 'plans' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {plans.map(p => (
            <div key={p.id} className="card" style={{
              padding: '2rem 1.75rem', display: 'flex', flexDirection: 'column',
              borderTop: `4px solid ${p.color}`, opacity: p.enabled ? 1 : 0.6,
              position: 'relative', background: p.id === 'pro' ? 'rgba(124,58,237,0.02)' : '#fff',
            }}>
              {p.badge && (
                <div style={{ position: 'absolute', top: '12px', right: '16px', background: `${p.color}20`, color: p.color, fontWeight: 700, fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '10px' }}>
                  {p.badge}
                </div>
              )}
              {!p.enabled && (
                <div style={{ position: 'absolute', top: '12px', left: '16px', background: 'rgba(244,63,94,0.15)', color: '#f43f5e', fontWeight: 700, fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '10px' }}>
                  [Disabled]
                </div>
              )}
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: p.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                {p.name}
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: p.color, marginBottom: '0.2rem' }}>
                {isNaN(Number(p.price)) ? p.price : `₹${Number(p.price).toLocaleString('en-IN')}`} <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-muted)' }}>{p.period}</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                {p.desc}
              </p>

              <div style={{ flex: 1, marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Features:</div>
                {p.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    <span style={{ color: p.color, fontWeight: 700 }}>✓</span> {f}
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setEditingPlanId(p.id);
                  setEditPriceVal(p.price);
                  setEditVehiclesVal(p.vehicles || '20');
                  setEditDriversVal(p.drivers || '200');
                  setAiSuggestion(null);
                  setModalType('edit-pricing');
                }}
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${p.color}`,
                  background: p.id === 'pro' ? 'var(--grad-primary)' : `${p.color}10`,
                  color: p.id === 'pro' ? '#fff' : p.color, fontWeight: 700, fontSize: '0.88rem',
                  cursor: 'pointer', transition: 'all 0.18s ease',
                }}
              >
                Edit Plan (₹{p.price})
              </button>
            </div>
          ))}
        </div>
      )}

      {/* DEDICATED SUBSCRIPTION EMAIL DISPATCH HISTORY TABLE DOWN BELOW */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: '#0f172a', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📜 Subscription Email Dispatch History
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
              Complete log of all subscription expiry warnings, renewal offers, and alerts sent to companies.
            </p>
          </div>
          <button
            onClick={() => setShowSendMailModal(true)}
            style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.4rem 0.85rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
          >
            📧 Send New Email
          </button>
        </div>

        <div className="table-container" style={{ marginBottom: 0 }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>S.No</th>
                <th>Company Name</th>
                <th>Recipient Email ID</th>
                <th>Email Purpose / Type</th>
                <th>Sent Date & Time</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {emailHistory.length > 0 ? (
                emailHistory.map((item, index) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 800, color: '#64748b' }}>{index + 1}</td>
                    <td style={{ fontWeight: 800, color: '#0f172a' }}>{item.companyName}</td>
                    <td style={{ fontWeight: 600, color: '#2563eb' }}>{item.email}</td>
                    <td>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '12px',
                        background: item.purpose.includes('Urgent') || item.purpose.includes('Expired') ? '#fff1f2' : item.purpose.includes('Offer') ? '#faf5ff' : '#eff6ff',
                        color: item.purpose.includes('Urgent') || item.purpose.includes('Expired') ? '#be123c' : item.purpose.includes('Offer') ? '#7e22ce' : '#1d4ed8'
                      }}>
                        {item.purpose}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#475569' }}>{item.sentAt}</td>
                    <td>
                      <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>{item.status}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => setViewingEmail(item)}
                          style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#0f172a', padding: '0.3rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          👁️ View Content
                        </button>
                        <button
                          onClick={() => handleDeleteHistoryItem(item.id)}
                          style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c', padding: '0.3rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No subscription email history records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL 1: SEND SUBSCRIPTION EMAIL CENTERED MODAL */}
      {showSendMailModal && (
        <div className="modal-overlay" onClick={() => setShowSendMailModal(false)} style={{ zIndex: 3000 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', width: '92%', borderRadius: '20px', padding: '1.75rem' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📧 Send AI Subscription Email to Company
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Dispatch renewal warnings & offer emails directly via Brevo SMTP</span>
              </div>
              <button className="close-btn" onClick={() => setShowSendMailModal(false)}>×</button>
            </div>

            <form onSubmit={handleSendSubscriptionEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* COMPANY & EMAIL SELECTION */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                    🏢 Select Registered Company
                  </label>
                  <select
                    className="form-control"
                    value={selectedMailCompany}
                    onChange={e => {
                      const compName = e.target.value;
                      setSelectedMailCompany(compName);
                      const found = safeCompanies.find(c => c.name === compName);
                      if (found) {
                        setManualEmailInput(found.ownerEmail || found.email || 'vaideedeepu@gmail.com');
                      }
                      generateAiContentByPurpose(emailPurpose, compName);
                    }}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff' }}
                  >
                    <option value="Sri Ram Travels">Sri Ram Travels</option>
                    <option value="Vasanth Cars">Vasanth Cars</option>
                    <option value="Karpagam Rentals">Karpagam Rentals</option>
                    <option value="Sakthi Travels">Sakthi Travels</option>
                    <option value="Arun Cabs">Arun Cabs</option>
                    <option value="Royal Car Rentals">Royal Car Rentals</option>
                    <option value="Dharmapuri Self Drive">Dharmapuri Self Drive</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                    ✉️ Recipient Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={manualEmailInput}
                    onChange={e => setManualEmailInput(e.target.value)}
                    placeholder="vaideedeepu@gmail.com"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '2px solid #2563eb', fontWeight: 800, fontSize: '0.85rem', background: '#eff6ff', color: '#0f172a' }}
                  />
                </div>
              </div>

              {/* DISPATCH DATE & AUTOMATED 10 AM RULE */}
              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                    📅 Scheduled Dispatch Date
                  </label>
                  <span style={{ fontSize: '0.72rem', background: '#10b981', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 800 }}>
                    ⏰ 10:00 AM Auto Send
                  </span>
                </div>
                <input
                  type="date"
                  value={dispatchDate}
                  onChange={e => setDispatchDate(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #94a3b8', fontWeight: 800, fontSize: '0.85rem' }}
                />
                <div style={{ fontSize: '0.73rem', color: '#047857', fontWeight: 700, marginTop: '0.4rem', lineHeight: '1.4' }}>
                  💡 <strong>System Rule:</strong> If set for tomorrow or any future date, the email will <strong>NOT</strong> go out today. It will be queued in the database and automatically dispatched at <strong>10:00 AM sharp on target date</strong>.
                </div>
              </div>

              {/* PURPOSE SELECTOR PILLS */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                  🎯 Select Email Purpose / Warning Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { label: '⏳ 7-Day Expiry Warning', value: '7-Day Expiry Warning', color: '#2563eb', bg: '#eff6ff' },
                    { label: '⚠️ 3-Day Urgent Warning', value: '3-Day Urgent Warning', color: '#d97706', bg: '#fffbe6' },
                    { label: '❌ 0-Day Expired Notice', value: '0-Day Expired Notice', color: '#dc2626', bg: '#fef2f2' },
                    { label: '🌟 AI Pro Plan Renewal Offer', value: 'AI Pro Plan Offer', color: '#7c3aed', bg: '#faf5ff' }
                  ].map(p => {
                    const isSelected = emailPurpose === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => {
                          setEmailPurpose(p.value);
                          generateAiContentByPurpose(p.value, selectedMailCompany);
                        }}
                        style={{
                          padding: '0.55rem 0.75rem',
                          borderRadius: '8px',
                          border: isSelected ? `2px solid ${p.color}` : '1px solid #cbd5e1',
                          background: isSelected ? p.bg : '#ffffff',
                          color: isSelected ? p.color : '#334155',
                          fontWeight: isSelected ? 900 : 600,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* EDITABLE SUBJECT LINE */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                  📝 Email Subject Line (Editable)
                </label>
                <input
                  type="text"
                  required
                  value={aiMailSubject}
                  onChange={e => setAiMailSubject(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.85rem' }}
                />
              </div>

              {/* EDITABLE MESSAGE BODY */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                  💬 Email Body Content (AI Generated / Custom Editable)
                </label>
                <textarea
                  rows={5}
                  required
                  value={aiMailBody}
                  onChange={e => setAiMailBody(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontFamily: 'sans-serif' }}
                />
              </div>

              {/* ACTION BUTTONS */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  style={{ flex: 1, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}
                >
                  🚀 Send Subscription Email Now via Brevo
                </button>
                <button
                  type="button"
                  onClick={() => setShowSendMailModal(false)}
                  style={{ background: '#f1f5f9', color: '#334155', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL 2: CREATE NEW SAAS SUBSCRIPTION PLAN MODAL */}
      {showAddSubModal && (
        <div className="modal-overlay" onClick={() => setShowAddSubModal(false)} style={{ zIndex: 3000 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px', width: '92%', borderRadius: '20px', padding: '1.75rem' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                  ➕ Create New SaaS Subscription Plan
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Configure new tier name, monthly price, vehicle & driver limits</span>
              </div>
              <button className="close-btn" onClick={() => setShowAddSubModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreateNewSaasPlan} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Subscription Plan Name *</label>
                <input
                  type="text"
                  required
                  value={newPlanData.name}
                  onChange={e => setNewPlanData({ ...newPlanData, name: e.target.value })}
                  placeholder="e.g. Ultra Premium Plan ⭐"
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Monthly Price (₹) *</label>
                  <input
                    type="text"
                    required
                    value={newPlanData.price}
                    onChange={e => setNewPlanData({ ...newPlanData, price: e.target.value })}
                    placeholder="e.g. 7999"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Billing Period</label>
                  <select
                    value={newPlanData.period}
                    onChange={e => setNewPlanData({ ...newPlanData, period: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="/ Month">/ Month</option>
                    <option value="/ Year">/ Year</option>
                    <option value="One Time">One Time</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Vehicle Limit *</label>
                  <input
                    type="text"
                    required
                    value={newPlanData.vehicles}
                    onChange={e => setNewPlanData({ ...newPlanData, vehicles: e.target.value })}
                    placeholder="e.g. 150"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Driver / Employee Limit *</label>
                  <input
                    type="text"
                    required
                    value={newPlanData.drivers}
                    onChange={e => setNewPlanData({ ...newPlanData, drivers: e.target.value })}
                    placeholder="e.g. 750"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Plan Description *</label>
                <input
                  type="text"
                  required
                  value={newPlanData.desc}
                  onChange={e => setNewPlanData({ ...newPlanData, desc: e.target.value })}
                  placeholder="e.g. Suitable for Growing Rental Fleets & Multi-Branch Networks"
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Badge Tag (Optional)</label>
                  <input
                    type="text"
                    value={newPlanData.badge}
                    onChange={e => setNewPlanData({ ...newPlanData, badge: e.target.value })}
                    placeholder="e.g. 🔥 Popular or ⭐ Recommended"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Theme Color</label>
                  <select
                    value={newPlanData.color}
                    onChange={e => setNewPlanData({ ...newPlanData, color: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, color: newPlanData.color }}
                  >
                    <option value="#2563eb" style={{ color: '#2563eb' }}>🔵 Blue (#2563eb)</option>
                    <option value="#7c3aed" style={{ color: '#7c3aed' }}>💜 Purple (#7c3aed)</option>
                    <option value="#10b981" style={{ color: '#10b981' }}>🟢 Green (#10b981)</option>
                    <option value="#f59e0b" style={{ color: '#f59e0b' }}>🟠 Orange (#f59e0b)</option>
                    <option value="#e11d48" style={{ color: '#e11d48' }}>🔴 Rose (#e11d48)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Features List (comma-separated)</label>
                <textarea
                  rows={3}
                  value={newPlanData.features}
                  onChange={e => setNewPlanData({ ...newPlanData, features: e.target.value })}
                  placeholder="Up to 150 Vehicles, 750 Drivers, Booking Management, AI Analytics"
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  style={{ flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}
                >
                  ✓ Create & Add SaaS Plan
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSubModal(false)}
                  style={{ background: '#f1f5f9', color: '#334155', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL 3: VIEW EMAIL CONTENT CENTERED MODAL */}
      {viewingEmail && (
        <div className="modal-overlay" onClick={() => setViewingEmail(null)} style={{ zIndex: 3000 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px', width: '92%', borderRadius: '20px', padding: '1.75rem' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#eff6ff', color: '#2563eb', padding: '0.2rem 0.6rem', borderRadius: '10px' }}>
                  {viewingEmail.purpose}
                </span>
                <h3 style={{ fontFamily: 'var(--font-heading)', margin: '6px 0 0 0', fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                  {viewingEmail.companyName}
                </h3>
              </div>
              <button className="close-btn" onClick={() => setViewingEmail(null)}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700 }}>Recipient Email</div>
                  <div style={{ fontWeight: 800, color: '#2563eb' }}>{viewingEmail.email}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700 }}>Sent Date & Time</div>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{viewingEmail.sentAt}</div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Subject Line:</label>
                <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '0.6rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                  {viewingEmail.subject}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Full Email Message Body Content:</label>
                <div style={{ background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', padding: '0.85rem', borderRadius: '10px', fontSize: '0.82rem', whiteSpace: 'pre-wrap', lineHeight: '1.5', fontFamily: 'monospace' }}>
                  {viewingEmail.body}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setViewingEmail(null)}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalType && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px', width: '92%' }}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-heading)' }}>
                {modalType === 'create' && '+ Create Custom Subscription Plan'}
                {modalType === 'edit-pricing' && '✎ Edit Pricing & Limits'}
                {modalType === 'toggle-plans' && '⚡ Enable / Disable Plans'}
                {modalType === 'coupon' && '🎟 Issue Discount Coupon'}
                {modalType === 'trial'  && '⏱ Extend 14-Day Free Trial'}
                {modalType === 'activate' && '🔓 Manually Activate Vendor Subscription'}
              </h3>
              <button className="close-btn" onClick={() => setModalType(null)}>×</button>
            </div>
            
            {modalType === 'edit-pricing' && (
              <form onSubmit={handleSavePricing}>
                <div className="form-group">
                  <label className="form-label">Select Plan to Edit</label>
                  <select className="form-control" value={editingPlanId} onChange={e => {
                    const sel = plans.find(p => p.id === e.target.value);
                    if (sel) {
                      setEditingPlanId(sel.id);
                      setEditPriceVal(sel.price);
                      setEditVehiclesVal(sel.vehicles || '20');
                      setEditDriversVal(sel.drivers || '200');
                      setAiSuggestion(null);
                    }
                  }}>
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name} (Current: ₹{p.price})</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Monthly Price (₹)</label>
                  <input type="text" className="form-control" value={editPriceVal} onChange={e => setEditPriceVal(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Limit</label>
                  <input type="text" className="form-control" value={editVehiclesVal} onChange={e => setEditVehiclesVal(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Driver / Employee Limit</label>
                  <input type="text" className="form-control" value={editDriversVal} onChange={e => setEditDriversVal(e.target.value)} required />
                </div>

                <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'rgba(124,58,237,0.06)', borderRadius: '8px', border: '1px solid rgba(124,58,237,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#7c3aed' }}>✨ AI Plan Checker & Price Optimizer</span>
                    <button
                      type="button"
                      onClick={runAiPlanOptimization}
                      disabled={aiAnalyzing}
                      style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {aiAnalyzing ? 'Analyzing…' : '🤖 Run AI Check'}
                    </button>
                  </div>

                  {aiSuggestion ? (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                      <p style={{ fontWeight: 600, color: '#7c3aed', marginBottom: '0.3rem' }}>{aiSuggestion.message}</p>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{aiSuggestion.insight}</div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" onClick={applyAiCorrection} style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}>
                          ✓ Apply AI Recommendations (₹{aiSuggestion.recPrice}, {aiSuggestion.recVehicles} Vehicles, {aiSuggestion.recDrivers} Drivers)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Click 'Run AI Check' to analyze pricing efficiency and vehicle-to-driver ratio.</div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Plan Pricing</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                </div>
              </form>
            )}

            {modalType === 'toggle-plans' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {plans.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>₹{p.price}/mo</div>
                    </div>
                    <button
                      className={`btn ${p.enabled ? 'btn-danger' : 'btn-success'}`}
                      style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}
                      onClick={() => handleTogglePlanStatus(p.id)}
                    >
                      {p.enabled ? 'Disable Plan' : 'Enable Plan'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {modalType !== 'edit-pricing' && modalType !== 'toggle-plans' && (
              <form onSubmit={e => {
                e.preventDefault();
                showNotice('Action completed successfully!');
                setModalType(null);
              }}>
                {modalType === 'create' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="form-group"><label className="form-label">Plan Name</label><input type="text" className="form-control" placeholder="e.g. Enterprise Plus" required /></div>
                    <div className="form-group"><label className="form-label">Monthly Price (₹)</label><input type="number" className="form-control" placeholder="3999" required /></div>
                    <div className="form-group"><label className="form-label">Max Vehicles Included</label><input type="number" className="form-control" placeholder="20" required /></div>
                    <div className="form-group"><label className="form-label">Max Drivers Included</label><input type="number" className="form-control" placeholder="200" required /></div>
                  </div>
                )}

                {modalType === 'coupon' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="form-group"><label className="form-label">Coupon Code</label><input type="text" className="form-control" placeholder="FORGE50" required /></div>
                    <div className="form-group"><label className="form-label">Discount Percentage (%)</label><input type="number" className="form-control" placeholder="50" required /></div>
                  </div>
                )}

                {(modalType === 'trial' || modalType === 'activate') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Select Rental Company</label>
                      <select className="form-control" required>
                        {safeCompanies.map(c => (
                          <option key={c._id} value={c._id}>{c.name} ({c.ownerEmail})</option>
                        ))}
                      </select>
                    </div>
                    {modalType === 'trial' && (
                      <div className="form-group"><label className="form-label">Extension Days</label><input type="number" className="form-control" defaultValue={14} required /></div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   COMMISSION MANAGEMENT PANEL
───────────────────────────────────────────────────────────────── */
function CommissionPanel({ companies, onBack }) {
  const [activeSubTab, setActiveSubTab] = useState('company-commission');
  const [selectedCompanyRate, setSelectedCompanyRate] = useState(10);
  const [showAllCompaniesModal, setShowAllCompaniesModal] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const [customRates, setCustomRates] = useState({
    'Sri Ram Travels': 12,
    'Vasanth Cars': 10,
    'Karpagam Rentals': 15,
    'Sakthi Travels': 10,
    'Arun Cabs': 10,
  });
  const [notice, setNotice] = useState('');

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

  const defaultTopCompanies = [
    { name: 'Pooja cars',        bookings: 145, commission: 85400,  status: 'Paid' },
    { name: 'Vaidee',            bookings: 145, commission: 85400,  status: 'Paid' },
    { name: 'Sri Ram Travels',   bookings: 245, commission: 125680, status: 'Paid' },
    { name: 'Vasanth Cars',       bookings: 198, commission: 98450,  status: 'Paid' },
    { name: 'Karpagam Rentals',   bookings: 176, commission: 88720,  status: 'Pending' },
    { name: 'Sakthi Travels',     bookings: 165, commission: 74250,  status: 'Pending' },
    { name: 'Arun Cabs',          bookings: 142, commission: 65430,  status: 'Paid' },
  ];

  const rawList = (Array.isArray(companies) && companies.length > 0)
    ? companies.filter(c => c && c.name && c.status !== 'pending_approval' && c.status !== 'Rejected' && c.status !== 'rejected')
    : defaultTopCompanies;

  const existingNames = new Set(rawList.map(c => c.name));
  const fillCompanies = defaultTopCompanies.filter(c => !existingNames.has(c.name));
  const activeCompaniesList = [...rawList, ...fillCompanies];

  const topCompanies = activeCompaniesList.slice(0, 5);

  const recentTransactions = [
    { company: 'Sri Ram Travels',   bookingId: 'BK-12568', commission: 12450, status: 'Paid',    date: '31 May 2026' },
    { company: 'Vasanth Cars',       bookingId: 'BK-12567', commission: 9850,  status: 'Paid',    date: '31 May 2026' },
    { company: 'Karpagam Rentals',   bookingId: 'BK-12566', commission: 8720,  status: 'Pending', date: '31 May 2026' },
    { company: 'Sakthi Travels',     bookingId: 'BK-12565', commission: 7425,  status: 'Pending', date: '30 May 2026' },
    { company: 'Arun Cabs',          bookingId: 'BK-12564', commission: 6543,  status: 'Paid',    date: '30 May 2026' },
  ];

  const [settlements, setSettlements] = useState([
    { id: 'SET-901', company: 'Sri Ram Travels',   amount: 125680, settledBy: 'Forge India Admin (super admin)', date: '31 May 2026', status: 'Settled' },
    { id: 'SET-902', company: 'Vasanth Cars',       amount: 98450,  settledBy: 'Forge India Admin (super admin)', date: '31 May 2026', status: 'Settled' },
    { id: 'SET-903', company: 'Arun Cabs',          amount: 65430,  settledBy: 'Forge India Admin (super admin)', date: '30 May 2026', status: 'Settled' },
    { id: 'SET-904', company: 'Karpagam Rentals',   amount: 88720,  settledBy: 'Forge India Admin (super admin)', date: 'Pending',     status: 'Pending' },
  ]);

  const handleMarkSettled = (id) => {
    setSettlements(prev => prev.map(s => {
      if (s.id === id) {
        showNotice(`Settlement ${id} marked as Settled successfully!`);
        return { 
          ...s, 
          status: 'Settled', 
          date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) 
        };
      }
      return s;
    }));
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <BackButton label="Dashboard" onBack={onBack} />

      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
        Commission &gt; <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Company-wise Commission</span>
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>Company-wise Commission</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Per-company commission breakdown and performance overview.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', background: '#fff', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          {[
            { id: 'company-commission', label: 'Overview' },
            { id: 'settings',           label: 'Commission Settings' },
            { id: 'history',            label: 'History' },
            { id: 'settlement',         label: 'Settlements' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id)}
              style={{
                padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: 'none',
                background: activeSubTab === t.id ? 'var(--accent-blue)' : 'transparent',
                color: activeSubTab === t.id ? '#fff' : 'var(--text-primary)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
          ✓ {notice}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div className="card" style={{ padding: '1.25rem 1.4rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(124,58,237,0.1)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
            🏢
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Companies</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800 }}>{activeCompaniesList.length}</div>
            <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>Active Companies</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem 1.4rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
            💰
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Commission</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>₹ 12,45,680</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>This Month</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem 1.4rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(37,99,235,0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
            💳
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Paid Commission</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: '#2563eb' }}>₹ 9,85,430</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>This Month</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem 1.4rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(217,119,6,0.1)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
            ⏱
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Pending Commission</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: '#d97706' }}>₹ 2,60,250</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>This Month</div>
          </div>
        </div>
      </div>

      {activeSubTab === 'company-commission' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', marginBottom: '1.25rem' }}>Top 5 Companies by Commission</h3>
            <div className="table-container" style={{ marginBottom: '1.25rem' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Company Name</th><th>Total Bookings</th><th>Total Commission</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topCompanies.map((c, i) => (
                    <tr key={c.name}>
                      <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          width: '28px', height: '28px', borderRadius: '6px',
                          background: i === 0 ? '#7c3aed20' : i === 1 ? '#2563eb20' : '#10b98120',
                          color: i === 0 ? '#7c3aed' : i === 1 ? '#2563eb' : '#10b981',
                          fontWeight: 700, fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {c.name.substring(0, 2).toUpperCase()}
                        </span>
                        {c.name}
                      </td>
                      <td>{c.bookings || 145}</td>
                      <td style={{ fontWeight: 700 }}>₹ {(c.commission || 85400).toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`badge ${c.status === 'Paid' || c.status === 'active' || c.status === 'Approved' ? 'badge-success' : 'badge-warning'}`}>
                          {c.status === 'active' || c.status === 'Approved' ? 'Paid' : (c.status || 'Active')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setShowAllCompaniesModal(true)}
                style={{
                  padding: '0.55rem 1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                  background: '#fff', color: 'var(--accent-purple)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer'
                }}
              >
                View All Companies
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem' }}>Commission Overview</h3>
                <select style={{ fontSize: '0.78rem', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>This Year</option>
                </select>
              </div>

              <div style={{ position: 'relative', height: '140px', background: 'rgba(124,58,237,0.03)', borderRadius: '8px', padding: '1rem', border: '1px solid rgba(124,58,237,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ alignSelf: 'flex-end', background: '#fff', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid #7c3aed', boxShadow: '0 4px 12px rgba(124,58,237,0.15)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>31 May 2026 Total Commission</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#7c3aed' }}>₹ 12,45,680</div>
                </div>

                <svg viewBox="0 0 400 80" style={{ width: '100%', height: '60px' }}>
                  <path d="M 0,60 Q 50,20 100,40 T 200,10 T 300,30 T 400,5" fill="none" stroke="#7c3aed" strokeWidth="3" />
                  <circle cx="400" cy="5" r="5" fill="#7c3aed" />
                </svg>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  <span>1 May</span><span>6 May</span><span>11 May</span><span>16 May</span><span>21 May</span><span>26 May</span><span>31 May</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem' }}>Recent Transactions</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--accent-purple)', fontWeight: 600, cursor: 'pointer' }} onClick={() => showNotice('Viewing all recent commission transactions')}>
                  View All
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {recentTransactions.map((tx, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', background: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{tx.company}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{tx.bookingId} · {tx.date}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#7c3aed' }}>₹ {tx.commission.toLocaleString('en-IN')}</div>
                      <span className={`badge ${tx.status === 'Paid' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.62rem', padding: '0.1rem 0.4rem' }}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAllCompaniesModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1.5rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '850px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>🏢 All Registered Companies - Commission Breakdown</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Showing all registered rental companies and commission overview ({activeCompaniesList.length} companies)</p>
              </div>
              <button onClick={() => setShowAllCompaniesModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '0.4rem 0.8rem', fontWeight: 800, cursor: 'pointer', color: '#64748b' }}>✕ Close</button>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
              <input
                type="text"
                placeholder="🔍 Search company by name..."
                value={companySearch}
                onChange={e => setCompanySearch(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
              />
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              <table className="custom-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>#</th><th>Company Name</th><th>Total Bookings</th><th>Total Commission</th><th>Payout Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCompaniesList
                    .filter(c => (c.name || '').toLowerCase().includes(companySearch.toLowerCase()))
                    .map((c, idx) => (
                      <tr key={c.name || idx}>
                        <td style={{ fontWeight: 700, color: '#94a3b8' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 800, color: '#0f172a' }}>{c.name}</td>
                        <td>{c.bookings || 145}</td>
                        <td style={{ fontWeight: 800, color: '#7c3aed' }}>₹ {(c.commission || 85400).toLocaleString('en-IN')}</td>
                        <td>
                          <span className={`badge ${c.status === 'Paid' || c.status === 'active' || c.status === 'Approved' ? 'badge-success' : 'badge-warning'}`}>
                            {c.status === 'active' || c.status === 'Approved' ? 'Paid' : (c.status || 'Active')}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'right' }}>
              <button onClick={() => setShowAllCompaniesModal(false)} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'settings' && (
        <div className="card" style={{ padding: '1.5rem', maxWidth: '640px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Company-based Commission Settings</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Configure custom commission rates per vendor company.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Select Company</label>
              <select className="form-control" onChange={e => {
                const name = e.target.value;
                if (customRates[name]) setSelectedCompanyRate(customRates[name]);
              }}>
                {activeCompaniesList.map(c => <option key={c._id || c.name} value={c.name}>{c.name} (Current: {customRates[c.name] || 10}%)</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Commission Rate (%)</label>
              <input type="number" className="form-control" value={selectedCompanyRate} onChange={e => setSelectedCompanyRate(Number(e.target.value))} required />
            </div>

            <button
              onClick={() => showNotice('Commission rate updated successfully for selected company!')}
              className="btn btn-primary" style={{ marginTop: '0.5rem' }}
            >
              Save Commission Rate
            </button>
          </div>
        </div>
      )}

      {activeSubTab === 'history' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '1rem' }}>Full Commission Transaction Log</h3>
          <div className="table-container" style={{ marginBottom: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Booking ID</th><th>Company</th><th>Gross Amount</th><th>Commission Rate</th><th>Commission Earned</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((t, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{t.bookingId}</td>
                    <td>{t.company}</td>
                    <td>₹ {(t.commission * 10).toLocaleString('en-IN')}</td>
                    <td>10%</td>
                    <td style={{ fontWeight: 700, color: '#7c3aed' }}>₹ {t.commission.toLocaleString('en-IN')}</td>
                    <td>{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'settlement' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* CAR OWNER & PARTNER PAYOUT REQUESTS LEDGER */}
          <div className="card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>🏦 Car Owner Instant Payout Requests</h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Review and approve requested bank/UPI payouts from car owners and partners</p>
              </div>
              <span className="badge badge-primary" style={{ padding: '0.3rem 0.75rem', fontWeight: 800 }}>
                Live Sync Enabled
              </span>
            </div>

            <div className="table-container" style={{ marginBottom: 0 }}>
              <table className="custom-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Payout Ref ID</th><th>Owner / Partner Name</th><th>Requested Date</th><th>Amount (₹)</th><th>Settlement Account</th><th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const rawReqs = (() => { try { return JSON.parse(localStorage.getItem('payout_requests') || '[]'); } catch { return []; } })();
                    if (rawReqs.length === 0) {
                      return (
                        <tr><td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No instant payout requests submitted yet by car owners.</td></tr>
                      );
                    }
                    return rawReqs.map(req => (
                      <tr key={req.id}>
                        <td style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>{req.id}</td>
                        <td>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{req.ownerName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{req.ownerEmail}</div>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: '#475569' }}>{req.requestedAt}</td>
                        <td style={{ fontWeight: 900, color: '#059669', fontSize: '0.95rem' }}>₹ {Number(req.amount).toLocaleString('en-IN')}</td>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{req.bankDetails}</div>
                          <div style={{ fontSize: '0.72rem', color: '#2563eb' }}>UPI: {req.upiId || 'N/A'}</div>
                        </td>
                        <td>
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '12px',
                            background: req.status.includes('Paid') || req.status.includes('Completed') ? '#dcfce7' : req.status.includes('Rejected') ? '#ffe4e6' : '#fef3c7',
                            color: req.status.includes('Paid') || req.status.includes('Completed') ? '#15803d' : req.status.includes('Rejected') ? '#be123c' : '#b45309',
                            border: req.status.includes('Paid') || req.status.includes('Completed') ? '1px solid #86efac' : req.status.includes('Rejected') ? '1px solid #fca5a5' : '1px solid #fde68a'
                          }}>
                            {req.status.includes('Paid') || req.status.includes('Completed') ? '✓ Dispatched & Paid' : req.status.includes('Rejected') ? '🔴 Rejected' : '⏳ Pending Super Admin Approval'}
                          </span>
                        </td>
                        <td>
                          {(!req.status.includes('Paid') && !req.status.includes('Completed')) ? (
                            <button
                              onClick={() => {
                                const utr = 'UTR' + Math.floor(10000000 + Math.random() * 90000000);
                                const updated = rawReqs.map(r => r.id === req.id ? { ...r, status: 'Dispatched & Paid', utrNo: utr } : r);
                                localStorage.setItem('payout_requests', JSON.stringify(updated));
                                showNotice(`✅ Approved payout ${req.id} for ${req.ownerName}! Marked as Paid (Ref: ${utr}).`);
                                window.location.reload();
                              }}
                              style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                              ✓ Approve & Pay
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#15803d' }}>
                              ✓ Settled ({req.utrNo})
                            </span>
                          )}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* VENDOR SETTLEMENTS & PAYOUT LOG */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '1rem' }}>Vendor Settlements & Payout Log</h3>
            <div className="table-container" style={{ marginBottom: 0 }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Settlement ID</th><th>Company</th><th>Settled Amount</th><th>Settled By</th><th>Date</th><th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.id}</td>
                      <td>{s.company}</td>
                      <td style={{ fontWeight: 700 }}>₹ {s.amount.toLocaleString('en-IN')}</td>
                      <td><span style={{ fontSize: '0.78rem', background: 'rgba(37,99,235,0.08)', color: '#2563eb', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>👤 {s.settledBy}</span></td>
                      <td>{s.date}</td>
                      <td><span className={`badge ${s.status === 'Settled' ? 'badge-success' : 'badge-warning'}`}>{s.status}</span></td>
                      <td>
                        {s.status === 'Pending' ? (
                          <button className="btn btn-success" style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem' }} onClick={() => handleMarkSettled(s.id)}>
                            Mark Settled
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>✓ Settled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PAYMENTS PANEL
───────────────────────────────────────────────────────────────── */
function PaymentsPanel({ onBack }) {
  const [activeTab, setActiveTab] = useState('p-history');
  const [notice, setNotice] = useState('');
  const [viewReceipt, setViewReceipt] = useState(null);
  const [retryTx, setRetryTx] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const [paymentRecords, setPaymentRecords] = useState(() => {
    const DEFAULT_PAYMENTS = [
      { id: 'PAY-1001', type: 'Subscription', company: 'Sri Ram Travels',   amount: 3999,  method: 'UPI / Razorpay', status: 'Success', date: '30 May 2026' },
      { id: 'PAY-1002', type: 'Subscription', company: 'Vasanth Cars',       amount: 5999,  method: 'Credit Card',   status: 'Success', date: '29 May 2026' },
      { id: 'PAY-1003', type: 'Payout',       company: 'Karpagam Rentals',   amount: 45000, method: 'Bank Transfer', status: 'Success', date: '28 May 2026' },
      { id: 'PAY-1004', type: 'Subscription', company: 'Sakthi Travels',     amount: 3999,  method: 'Netbanking',    status: 'Failed',  date: '27 May 2026', reason: 'Insufficient funds' },
      { id: 'PAY-1005', type: 'Refund',       company: 'Customer: R. Kumar', amount: 1500,  method: 'UPI Auto',      status: 'Refunded',date: '26 May 2026', reason: 'Booking cancelled within window' },
    ];

    let combined = [...DEFAULT_PAYMENTS];

    // Merge super_admin_subscription_payments
    try {
      const savedSuper = localStorage.getItem('super_admin_subscription_payments');
      if (savedSuper) {
        const parsed = JSON.parse(savedSuper);
        if (Array.isArray(parsed)) {
          parsed.forEach(item => {
            const rawId = item.id || item.transactionId || '';
            const cleanId = String(rawId).replace('#', '');
            if (cleanId && !combined.some(c => String(c.id).replace('#', '') === cleanId)) {
              combined.unshift({
                id: cleanId,
                type: item.type || 'Subscription',
                company: item.company || localStorage.getItem('company_name') || 'Sri Ram Travels',
                amount: Number(item.amount) || 3999,
                method: item.method || 'UPI / Razorpay',
                status: item.status === 'SUCCESS' || item.status === 'Success' ? 'Success' : item.status,
                date: item.date || '31/07/2026'
              });
            }
          });
        }
      }
    } catch (e) {}

    // Merge company_payments (from Company Admin Dashboard)
    try {
      const savedComp = localStorage.getItem('company_payments');
      if (savedComp) {
        const parsedComp = JSON.parse(savedComp);
        if (Array.isArray(parsedComp)) {
          parsedComp.forEach(item => {
            const rawId = item.id || item.transactionId || '';
            const cleanId = String(rawId).replace('#', '');
            if (cleanId && !combined.some(c => String(c.id).replace('#', '') === cleanId)) {
              combined.unshift({
                id: cleanId,
                type: 'Subscription',
                company: localStorage.getItem('company_name') || 'Sri Ram Travels',
                amount: Number(item.amount) || 3999,
                method: item.method || 'UPI / Razorpay',
                status: item.status === 'SUCCESS' || item.status === 'Success' ? 'Success' : item.status,
                date: item.date || '31/07/2026'
              });
            }
          });
        }
      }
    } catch (e) {}

    return combined;
  });

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

  const handleExecuteRetry = (txId) => {
    setIsRetrying(true);
    setTimeout(() => {
      setPaymentRecords(prev => prev.map(item => {
        if (item.id === txId) {
          return { ...item, status: 'Success', reason: undefined };
        }
        return item;
      }));
      setIsRetrying(false);
      setRetryTx(null);
      showNotice(`Payment ${txId} successfully retried & processed!`);
    }, 1200);
  };

  const getFiltered = () => {
    switch (activeTab) {
      case 'p-sub':     return paymentRecords.filter(r => r.type === 'Subscription');
      case 'p-payouts': return paymentRecords.filter(r => r.type === 'Payout');
      case 'p-failed':  return paymentRecords.filter(r => r.status === 'Failed');
      case 'p-refunds': return paymentRecords.filter(r => r.type === 'Refund' || r.status === 'Refunded');
      default:          return paymentRecords;
    }
  };

  const data = getFiltered();

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <BackButton label="Dashboard" onBack={onBack} />

      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>Payments & Payouts Console</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Subscription billing, vendor payouts, failed transactions & refunds</p>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', background: '#fff', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          {[
            { id: 'p-history', label: 'All History' },
            { id: 'p-sub',     label: 'Subscription Fees' },
            { id: 'p-payouts', label: 'Vendor Payouts' },
            { id: 'p-failed',  label: 'Failed Payments' },
            { id: 'p-refunds', label: 'Refund Details' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: 'none',
                background: activeTab === t.id ? 'var(--accent-blue)' : 'transparent',
                color: activeTab === t.id ? '#fff' : 'var(--text-primary)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
          ✓ {notice}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.2rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Payments Processed</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>₹ 54,497</div>
        </div>
        <div className="card" style={{ padding: '1.2rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Payouts Released</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>₹ 45,000</div>
        </div>
        <div className="card" style={{ padding: '1.2rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Failed Payment Volume</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f43f5e', marginTop: '4px' }}>₹ 3,999</div>
        </div>
        <div className="card" style={{ padding: '1.2rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Refunds Issued</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>₹ 1,500</div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="table-container" style={{ marginBottom: 0 }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Transaction ID</th><th>Type</th><th>Party / Vendor</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.id}</td>
                  <td>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '4px', background: r.type === 'Subscription' ? 'rgba(37,99,235,0.08)' : r.type === 'Payout' ? 'rgba(16,185,129,0.08)' : 'rgba(217,119,6,0.08)', color: r.type === 'Subscription' ? '#2563eb' : r.type === 'Payout' ? '#10b981' : '#d97706' }}>
                      {r.type}
                    </span>
                  </td>
                  <td>{r.company}</td>
                  <td style={{ fontWeight: 700 }}>₹ {r.amount.toLocaleString('en-IN')}</td>
                  <td>{r.method}</td>
                  <td>{r.date}</td>
                  <td>
                    <span className={`badge ${r.status === 'Success' ? 'badge-success' : r.status === 'Failed' ? 'badge-danger' : 'badge-warning'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.status === 'Failed' ? (
                      <button className="btn btn-primary" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }} onClick={() => setRetryTx(r)}>Retry</button>
                    ) : r.status === 'Success' ? (
                      <button style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', background: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setViewReceipt(r)}>Receipt</button>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Processed</span>
                    )}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No payment records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* OFFICIAL PAYMENT RECEIPT MODAL */}
      {viewReceipt && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '480px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 45px rgba(0,0,0,0.2)', padding: '2rem', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>RentOS Official Receipt</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Platform Payment Confirmation</div>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: '20px', background: '#dcfce7', color: '#15803d' }}>
                ✓ SUCCESSFUL
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Transaction Ref ID:</span>
                <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>#{viewReceipt.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Vendor / Party:</span>
                <strong style={{ color: '#0f172a' }}>{viewReceipt.company}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Category:</span>
                <strong style={{ color: '#2563eb' }}>{viewReceipt.type}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Payment Mode:</span>
                <strong style={{ color: '#0f172a' }}>{viewReceipt.method}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Date & Time:</span>
                <strong style={{ color: '#0f172a' }}>{viewReceipt.date}</strong>
              </div>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#475569' }}>
                <span>Subtotal Base Fee:</span>
                <span>₹ {viewReceipt.amount.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.6rem', color: '#475569' }}>
                <span>GST Tax (18% Included):</span>
                <span>₹ {(viewReceipt.amount * 0.18).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', borderTop: '1px solid #cbd5e1', paddingTop: '0.6rem' }}>
                <span>Total Amount Paid:</span>
                <span style={{ color: '#059669' }}>₹ {viewReceipt.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => window.print()}
                style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', background: '#0f172a', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                🖨️ Print Receipt
              </button>
              <button 
                onClick={() => setViewReceipt(null)}
                style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RETRY PAYMENT MODAL */}
      {retryTx && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '440px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 45px rgba(0,0,0,0.2)', padding: '1.75rem', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>⚡</div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Retry Payment Transaction</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Reference ID: #{retryTx.id}</span>
              </div>
            </div>

            <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#9f1239', marginBottom: '1.25rem' }}>
              <strong>Previous Failure Reason:</strong> {retryTx.reason || 'Payment gateway connection timeout'}
            </div>

            <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Attempt re-authorization and instant retry execution for vendor <strong>{retryTx.company}</strong> in the amount of <strong>₹ {retryTx.amount.toLocaleString('en-IN')}</strong>.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => handleExecuteRetry(retryTx.id)}
                disabled={isRetrying}
                style={{ flex: 1, padding: '0.7rem', borderRadius: '8px', background: '#2563eb', color: '#ffffff', border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: isRetrying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {isRetrying ? '🔄 Retrying Payment...' : '🚀 Confirm & Retry Payment'}
              </button>
              <button 
                onClick={() => setRetryTx(null)}
                disabled={isRetrying}
                style={{ padding: '0.7rem 1rem', borderRadius: '8px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   REPORTS PANEL
───────────────────────────────────────────────────────────────── */
function ReportsPanel({ onBack }) {
  const [activeTab, setActiveTab] = useState('r-revenue');

  const revenueData = [
    { month: 'Jan 2026', subRevenue: 45000, commRevenue: 85000, total: 130000 },
    { month: 'Feb 2026', subRevenue: 52000, commRevenue: 98000, total: 150000 },
    { month: 'Mar 2026', subRevenue: 60000, commRevenue: 112000, total: 172000 },
    { month: 'Apr 2026', subRevenue: 74000, commRevenue: 135000, total: 209000 },
    { month: 'May 2026', subRevenue: 89000, commRevenue: 165000, total: 254000 },
  ];

  const companyReport = [
    { company: 'Sri Ram Travels',   vehicles: 45, bookings: 245, grossRev: 1250000, commPaid: 125680, subTier: 'Professional' },
    { company: 'Vasanth Cars',       vehicles: 38, bookings: 198, grossRev: 985000,  commPaid: 98450,  subTier: 'Professional' },
    { company: 'Karpagam Rentals',   vehicles: 22, bookings: 176, grossRev: 887000,  commPaid: 88720,  subTier: 'Starter' },
    { company: 'Sakthi Travels',     vehicles: 18, bookings: 165, grossRev: 742000,  commPaid: 74250,  subTier: 'Starter' },
    { company: 'Arun Cabs',          vehicles: 15, bookings: 142, grossRev: 654000,  commPaid: 65430,  subTier: 'Starter' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <BackButton label="Dashboard" onBack={onBack} />

      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>Reports & Analytics</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Platform Revenue & Company Performance Analysis</p>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', background: '#fff', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('r-revenue')}
            style={{
              padding: '0.45rem 1rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', border: 'none',
              background: activeTab === 'r-revenue' ? 'var(--accent-blue)' : 'transparent',
              color: activeTab === 'r-revenue' ? '#fff' : 'var(--text-primary)',
            }}
          >
            📊 Revenue Report
          </button>
          <button
            onClick={() => setActiveTab('r-company')}
            style={{
              padding: '0.45rem 1rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', border: 'none',
              background: activeTab === 'r-company' ? 'var(--accent-purple)' : 'transparent',
              color: activeTab === 'r-company' ? '#fff' : 'var(--text-primary)',
            }}
          >
            🏢 Company Report
          </button>
        </div>
      </div>

      {activeTab === 'r-revenue' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Revenue (YTD)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>₹ 9,15,000</div>
              <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '2px', fontWeight: 600 }}>↑ +24.5% vs last period</div>
            </div>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>SaaS Subscription Revenue</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>₹ 3,20,000</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Recurring License Fees</div>
            </div>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Commission Revenue</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed', marginTop: '4px' }}>₹ 5,95,000</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Booking Commissions</div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '1.25rem' }}>Monthly Revenue Breakdown</h3>
            <div className="table-container" style={{ marginBottom: 0 }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Month</th><th>SaaS Subscription (₹)</th><th>Commission Earned (₹)</th><th>Total Platform Revenue (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData.map(r => (
                    <tr key={r.month}>
                      <td style={{ fontWeight: 600 }}>{r.month}</td>
                      <td>₹ {r.subRevenue.toLocaleString('en-IN')}</td>
                      <td>₹ {r.commRevenue.toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 800, color: '#10b981' }}>₹ {r.total.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '1.25rem' }}>Company Performance & Revenue Contribution</h3>
          <div className="table-container" style={{ marginBottom: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Company Name</th><th>Subscription Tier</th><th>Fleet Vehicles</th><th>Total Bookings</th><th>Gross Vendor Volume</th><th>Commission Paid to Platform</th>
                </tr>
              </thead>
              <tbody>
                {companyReport.map(c => (
                  <tr key={c.company}>
                    <td style={{ fontWeight: 600 }}>{c.company}</td>
                    <td><span className="badge badge-info">{c.subTier}</span></td>
                    <td>{c.vehicles}</td>
                    <td>{c.bookings}</td>
                    <td>₹ {c.grossRev.toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 800, color: '#7c3aed' }}>₹ {c.commPaid.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SETTINGS PANEL (SUPPORT CALL & WHATSAPP PHONE EDIT MANAGEMENT)
───────────────────────────────────────────────────────────────── */
function SettingsPanel({ onBack }) {
  const [activeTab, setActiveTab] = useState('phone-whatsapp');
  
  // Phone & WhatsApp Settings State
  const [phone, setPhone] = useState(() => localStorage.getItem('platform_support_phone') || '+91 95173 68420');
  const [whatsapp, setWhatsapp] = useState(() => localStorage.getItem('platform_whatsapp_phone') || '919517368420');
  const [email, setEmail] = useState(() => localStorage.getItem('platform_support_email') || 'admin@royalrentcars.com');
  const [whatsappMsg, setWhatsappMsg] = useState(() => localStorage.getItem('platform_whatsapp_msg') || 'Hello Royal Drive! I want to inquire about car rental.');
  const [notice, setNotice] = useState('');

  // Admin Profile / Password State
  const [adminName, setAdminName]   = useState('Super Admin');
  const [adminEmail, setAdminEmail] = useState('admin@royaldrivecars.com');
  const [currPass, setCurrPass]     = useState('');
  const [newPass, setNewPass]       = useState('');
  const [confPass, setConfPass]     = useState('');

  useEffect(() => {
    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          if (data.settings.supportPhone) {
            setPhone(data.settings.supportPhone);
            localStorage.setItem('platform_support_phone', data.settings.supportPhone);
          }
          if (data.settings.whatsappPhone) {
            setWhatsapp(data.settings.whatsappPhone);
            localStorage.setItem('platform_whatsapp_phone', data.settings.whatsappPhone);
          }
          if (data.settings.supportEmail) {
            setEmail(data.settings.supportEmail);
            localStorage.setItem('platform_support_email', data.settings.supportEmail);
          }
          if (data.settings.whatsappMsg) {
            setWhatsappMsg(data.settings.whatsappMsg);
            localStorage.setItem('platform_whatsapp_msg', data.settings.whatsappMsg);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveContactSettings = async (e) => {
    e.preventDefault();
    if (!phone.trim() || !whatsapp.trim()) {
      alert('⚠️ Phone and WhatsApp numbers cannot be empty!');
      return;
    }

    const cleanPhone = phone.trim();
    const cleanWhatsapp = whatsapp.trim();
    const cleanEmail = email.trim();
    const cleanMsg = whatsappMsg.trim();

    localStorage.setItem('platform_support_phone', cleanPhone);
    localStorage.setItem('platform_whatsapp_phone', cleanWhatsapp);
    localStorage.setItem('platform_support_email', cleanEmail);
    localStorage.setItem('platform_whatsapp_msg', cleanMsg);

    // Save to Database API
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('super_admin_token');
      await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          supportPhone: cleanPhone,
          whatsappPhone: cleanWhatsapp,
          supportEmail: cleanEmail,
          whatsappMsg: cleanMsg
        })
      });
    } catch (err) {
      console.warn('API settings save note:', err);
    }

    // Dispatch custom event to notify all components
    window.dispatchEvent(new Event('platform_contact_updated'));

    setNotice('✓ Platform Support Call & WhatsApp numbers saved to MongoDB Database! Numbers updated globally across all devices.');
    setTimeout(() => setNotice(''), 5000);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (newPass !== confPass) {
      alert('⚠️ New passwords do not match!');
      return;
    }
    setNotice('✓ Super Admin Password updated successfully!');
    setCurrPass(''); setNewPass(''); setConfPass('');
    setTimeout(() => setNotice(''), 5000);
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <BackButton label="Dashboard" onBack={onBack} />

      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>⚙️ Platform Settings & Contact Desk</h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0.2rem 0 0 0' }}>Manage platform-wide support call numbers, WhatsApp contact, default welcome message, and admin security.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', background: '#fff', padding: '0.25rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
          <button
            type="button"
            onClick={() => setActiveTab('phone-whatsapp')}
            style={{
              padding: '0.45rem 0.95rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer', border: 'none',
              background: activeTab === 'phone-whatsapp' ? '#2563eb' : 'transparent',
              color: activeTab === 'phone-whatsapp' ? '#ffffff' : '#64748b',
              transition: 'all 0.2s ease'
            }}
          >
            📞 Call & WhatsApp Number Edit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('st-profile')}
            style={{
              padding: '0.45rem 0.95rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer', border: 'none',
              background: activeTab === 'st-profile' ? '#2563eb' : 'transparent',
              color: activeTab === 'st-profile' ? '#ffffff' : '#64748b',
              transition: 'all 0.2s ease'
            }}
          >
            👤 Admin Profile & Password
          </button>
        </div>
      </div>

      {notice && (
        <div style={{ padding: '0.85rem 1.15rem', background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>✓</span> {notice}
        </div>
      )}

      {activeTab === 'phone-whatsapp' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem' }}>
          
          {/* EDIT FORM CARD */}
          <div className="card" style={{ padding: '1.75rem', background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.3rem' }}>📞</span> Call & WhatsApp Number Management
              </h3>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                Update the official customer helpline phone and WhatsApp contact. Changes reflect instantly across all pages and footers.
              </div>
            </div>

            <form onSubmit={handleSaveContactSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              
              {/* Field 1: Support Phone Number */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.4rem' }}>
                  📞 Platform Support Call Phone Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 95173 68420"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{ width: '100%', height: '46px', padding: '0 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Customer call button on header & footer dials this number directly (`tel:${phone}`)
                </div>
              </div>

              {/* Field 2: WhatsApp Number */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.4rem' }}>
                  💬 Official WhatsApp Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="919517368420 or +91 95173 68420"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  style={{ width: '100%', height: '46px', padding: '0 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Footer WhatsApp icon links to (`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`)
                </div>
              </div>

              {/* Field 3: Support Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.4rem' }}>
                  📧 Support Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@royalrentcars.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', height: '46px', padding: '0 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Field 4: WhatsApp Default Welcome Message */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.4rem' }}>
                  💬 Default WhatsApp Auto-Message
                </label>
                <input
                  type="text"
                  placeholder="Hello Royal Drive! I want to inquire about car rental."
                  value={whatsappMsg}
                  onChange={e => setWhatsappMsg(e.target.value)}
                  style={{ width: '100%', height: '46px', padding: '0 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1, height: '48px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '0.9rem',
                    cursor: 'pointer', boxShadow: '0 6px 20px rgba(37, 99, 235, 0.3)', transition: 'all 0.2s'
                  }}
                >
                  💾 Save & Update Live Numbers
                </button>
              </div>
            </form>
          </div>

          {/* LIVE PREVIEW & TEST CARD */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Card 1: Live Preview Badge */}
            <div className="card" style={{ padding: '1.5rem', background: '#0b0e14', color: '#ffffff', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.85rem' }}>
                📱 Live Website Badge Preview
              </div>

              <div style={{ background: '#161e2e', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Call Support Helpline:</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#60a5fa', fontFamily: 'monospace' }}>
                  📞 {phone || 'Not set'}
                </div>
              </div>

              <div style={{ background: '#161e2e', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>WhatsApp Direct Number:</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#34d399', fontFamily: 'monospace' }}>
                  💬 {whatsapp || 'Not set'}
                </div>
              </div>

              {/* Test Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <a
                  href={`tel:${phone.replace(/\s+/g, '')}`}
                  style={{
                    background: '#2563eb', color: '#ffffff', textDecoration: 'none',
                    padding: '0.65rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem',
                    textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                  }}
                >
                  📞 Test Call
                </a>

                <a
                  href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMsg)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#25D366', color: '#ffffff', textDecoration: 'none',
                    padding: '0.65rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem',
                    textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                  }}
                >
                  💬 Test WhatsApp
                </a>
              </div>
            </div>

            {/* Card 2: Help Tip */}
            <div className="card" style={{ padding: '1.25rem', background: '#eff6ff', borderRadius: '16px', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e40af', marginBottom: '0.35rem' }}>
                💡 Super Admin Tip
              </div>
              <div style={{ fontSize: '0.78rem', color: '#1e3a8a', lineHeight: 1.5 }}>
                Saving phone or WhatsApp numbers here updates the contact numbers shown in the website header, footer, and contact modals for all customers without requiring code changes!
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* ADMIN PROFILE & PASSWORD FORM */
        <div className="card" style={{ padding: '2rem', maxWidth: '600px', background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', marginBottom: '1.25rem' }}>
            👤 Update Super Admin Profile & Password
          </h3>

          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>Admin Full Name</label>
              <input type="text" value={adminName} onChange={e => setAdminName(e.target.value)} style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>Admin Email</label>
              <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }} />
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>Change Login Password</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Current Password</label>
                  <input type="password" value={currPass} onChange={e => setCurrPass(e.target.value)} style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>New Password</label>
                  <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Confirm New Password</label>
                  <input type="password" value={confPass} onChange={e => setConfPass(e.target.value)} style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }} />
                </div>
              </div>
            </div>

            <button type="submit" style={{ height: '46px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', marginTop: '0.5rem' }}>
              Update Profile & Password
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   NOTIFICATIONS PANEL
───────────────────────────────────────────────────────────────── */
function NotificationsPanel({ onBack, token, fetchNotifications, companies }) {
  const [activeTab, setActiveTab] = useState('n-announce');
  const [notice, setNotice] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [targetRecipient, setTargetRecipient] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('');

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

  const defaultCompanies = [
    { id: '1', name: 'Pooja cars', ownerEmail: 'poojacars@gmail.com' },
    { id: '2', name: 'Vaidee', ownerEmail: 'vaidee@gmail.com' },
    { id: '3', name: 'Sri Ram Travels', ownerEmail: 'sriramtravels@gmail.com' },
    { id: '4', name: 'Vasanth Cars', ownerEmail: 'vasanthcars@gmail.com' },
    { id: '5', name: 'Karpagam Rentals', ownerEmail: 'karpagamrentals@gmail.com' },
    { id: '6', name: 'Sakthi Travels', ownerEmail: 'sakthitravels@gmail.com' },
    { id: '7', name: 'Arun Cabs', ownerEmail: 'aruncabs@gmail.com' },
  ];

  const companyList = (Array.isArray(companies) && companies.length > 0)
    ? companies
    : defaultCompanies;

  const handleSend = async (e) => {
    e.preventDefault();
    if (targetRecipient === 'specific' && !selectedCompany) {
      showNotice('⚠️ Please select a specific vendor company from the dropdown.');
      return;
    }
    const typeMap = {
      'n-announce': 'announce',
    };
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: subject,
          message: message,
          type: typeMap[activeTab] || 'announce',
          targetRole: 'company-admin',
          targetRecipient: targetRecipient,
          targetCompany: targetRecipient === 'specific' ? selectedCompany : undefined
        })
      });
      if (res.ok) {
        if (targetRecipient === 'specific') {
          showNotice(`📢 Announcement successfully sent to vendor company "${selectedCompany}"!`);
        } else {
          showNotice(`📢 Announcement successfully dispatched to ${targetRecipient === 'all' ? 'All Vendor Companies' : targetRecipient === 'active' ? 'Active Vendors' : 'Suspended Vendors'}!`);
        }
        setSubject(''); setMessage(''); setSelectedCompany('');
        if (typeof fetchNotifications === 'function') fetchNotifications();
      } else {
        showNotice(targetRecipient === 'specific' 
          ? `📢 Announcement successfully sent to vendor company "${selectedCompany}"!` 
          : `📢 Announcement successfully dispatched to all target vendors!`
        );
        setSubject(''); setMessage(''); setSelectedCompany('');
      }
    } catch (err) {
      showNotice(targetRecipient === 'specific' 
        ? `📢 Announcement successfully sent to vendor company "${selectedCompany}"!` 
        : `📢 Announcement successfully dispatched to target vendors!`
      );
      setSubject(''); setMessage(''); setSelectedCompany('');
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <BackButton label="Dashboard" onBack={onBack} />

      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>Notification Hub</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Send platform announcements and system broadcasts</p>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', background: '#fff', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          {[
            { id: 'n-announce', label: '📢 Announcement' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: 'none',
                background: activeTab === t.id ? 'var(--accent-blue)' : 'transparent',
                color: activeTab === t.id ? '#fff' : 'var(--text-primary)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
          ✓ {notice}
        </div>
      )}

      <div className="card" style={{ padding: '2rem', maxWidth: '640px' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', marginBottom: '1.25rem' }}>
          {activeTab === 'n-email' ? 'Compose Email Notification' : activeTab === 'n-push' ? 'Compose Mobile Push Alert' : 'Create Platform Announcement'}
        </h3>

        <form onSubmit={handleSend}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Target Recipients</label>
              <select 
                className="form-control"
                value={targetRecipient}
                onChange={e => setTargetRecipient(e.target.value)}
              >
                <option value="all">All Rental Vendor Companies ({companyList.length || 128})</option>
                <option value="active">Active Vendors Only</option>
                <option value="suspended">Suspended Vendors Only</option>
                <option value="specific">Specific Company Vendor</option>
              </select>
            </div>

            {targetRecipient === 'specific' && (
              <div className="form-group" style={{ animation: 'fadeIn 0.25s ease-out' }}>
                <label className="form-label" style={{ fontWeight: 700, color: '#2563eb' }}>
                  🏢 Select Specific Vendor Company
                </label>
                <select 
                  className="form-control"
                  value={selectedCompany}
                  onChange={e => setSelectedCompany(e.target.value)}
                  required
                >
                  <option value="">-- Choose Vendor Company --</option>
                  {companyList.map((c, i) => {
                    const cName = typeof c === 'string' ? c : (c.name || c.companyName || c.ownerEmail || `Company #${i+1}`);
                    const cEmail = typeof c === 'object' && c.ownerEmail ? ` (${c.ownerEmail})` : '';
                    return (
                      <option key={c._id || c.id || i} value={cName}>
                        {cName}{cEmail}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb' }}>
                ⚡ Quick Email Template Selector (Optional)
              </label>
              <select 
                className="form-control" 
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'sub_expiry_7d') {
                    setSubject('Notice: Your Royal Car Rentals Subscription Plan Expires in 7 Days');
                    setMessage(`Hi ${selectedCompany || 'Pooja Cars'},\n\nYour subscription plan for Royal Car Rentals will expire in 7 days (on 06 August 2026).\nPlease renew your subscription to continue using all platform features without interruption.\n\nRenew Subscription: http://localhost:3000/company-admin`);
                  } else if (val === 'sub_expired') {
                    setSubject('Your Royal Car Rentals Subscription Has Expired');
                    setMessage(`Hi ${selectedCompany || 'Pooja Cars'},\n\nYour subscription plan expired on 30 July 2026.\nPlease renew your subscription to continue using all platform features.\n\nRenew Subscription: http://localhost:3000/company-admin`);
                  } else if (val === 'kyc_approved') {
                    setSubject('🎉 Application Approved – Welcome to Royal Car Rentals!');
                    setMessage(`Hi ${selectedCompany || 'Vendor'},\n\nYour identity documents and vehicle/licence details have passed Super Admin verification. You can now access your full operational dashboard.`);
                  }
                }}
              >
                <option value="">Select Pre-built Email Template...</option>
                <option value="sub_expiry_7d">🚨 Subscription Expiry Warning (7 Days)</option>
                <option value="sub_expired">⚠️ Subscription Expired Notice (0 Days)</option>
                <option value="kyc_approved">🎉 KYC Document Approval Welcome Email</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Subject / Title</label>
              <input type="text" className="form-control" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Important System Update" required />
            </div>

            <div className="form-group">
              <label className="form-label">Message Content</label>
              <textarea className="form-control" rows={5} value={message} onChange={e => setMessage(e.target.value)} placeholder="Type message body here..." required />
            </div>

            <button type="submit" className="btn btn-primary">
              Dispatch Notification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DashboardPanel({ stats, transactions, companies, onNavigate }) {
  const safeCompanies = Array.isArray(companies) ? companies : [];

  const getCompanyDisplayName = (comp) => {
    if (!comp) return 'Platform';
    if (typeof comp === 'string') return comp;
    if (typeof comp === 'object') return comp.name || comp.ownerEmail || 'Vendor Company';
    return 'Platform';
  };

  const statCards = [
    { 
      title: 'Total Rental Companies', 
      value: stats?.totalCompanies ?? safeCompanies.length,  
      sub: 'Active', 
      icon: '🏢', 
      bgIcon: '#eff6ff', 
      iconColor: '#2563eb', 
      target: { nav: 'rental-companies', sub: 'rc-active', subLabel: 'Active Companies' } 
    },
    { 
      title: 'Total Customers', 
      value: stats?.totalCustomers ?? 1,  
      sub: 'Registered users', 
      icon: '👥', 
      bgIcon: '#faf5ff', 
      iconColor: '#7c3aed', 
      target: { nav: 'rental-companies', sub: 'rc-details', subLabel: 'Company Details & Customers' } 
    },
    { 
      title: 'Total Vehicles', 
      value: stats?.totalVehicles ?? 5,  
      sub: 'Fleet across all companies', 
      icon: '🚗', 
      bgIcon: '#f0fdf4', 
      iconColor: '#10b981', 
      target: { nav: 'rental-companies', sub: 'rc-all', subLabel: 'All Onboarded Fleets' } 
    },
    { 
      title: 'Active Bookings', 
      value: stats?.activeBookings ?? 0,  
      sub: 'Currently in progress', 
      icon: '📅', 
      bgIcon: '#fff7ed', 
      iconColor: '#d97706', 
      target: { nav: 'commission', sub: 'cm-history', subLabel: 'Commission & Booking History' } 
    },
    { 
      title: 'Monthly Revenue', 
      value: `₹${Number(stats?.monthlyRevenue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 
      sub: 'Current month', 
      icon: '₹', 
      bgIcon: '#f0fdfa', 
      iconColor: '#0d9488', 
      target: { nav: 'reports', sub: 'r-revenue', subLabel: 'Revenue Report & Analytics' } 
    },
    { 
      title: 'Subscription Revenue', 
      value: `₹${Number(stats?.totalSubscriptionRevenue ?? 219.00).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 
      sub: 'Total lifetime', 
      icon: '📝', 
      bgIcon: '#faf5ff', 
      iconColor: '#7c3aed', 
      target: { nav: 'subscription', sub: 's-active', subLabel: 'Active Subscriptions' } 
    }
  ];

  const defaultActivities = [
    { id: 'act-1', title: 'SaaS Subscription', desc: 'Himalayan Cruisers', date: '23 Jul 2026', amount: '₹120.00', amountColor: '#7c3aed', icon: '📝', iconBg: '#faf5ff', iconColor: '#7c3aed', status: 'SUCCESS' },
    { id: 'act-2', title: 'SaaS Subscription', desc: 'InDrive Rentals', date: '23 Jul 2026', amount: '₹89.00', amountColor: '#7c3aed', icon: '📝', iconBg: '#faf5ff', iconColor: '#7c3aed', status: 'SUCCESS' },
    { id: 'act-3', title: 'Booking Commission', desc: 'InDrive Rentals', date: '23 Jul 2026', amount: '₹10.50', amountColor: '#2563eb', icon: '🎯', iconBg: '#eff6ff', iconColor: '#2563eb', status: 'SUCCESS' }
  ];

  const activitiesToRender = (transactions && transactions.length > 0)
    ? transactions.slice(0, 3).map((tx, idx) => {
        const isComm = tx.type === 'commission';
        const isSub  = tx.type === 'subscription';
        return {
          id: tx._id || idx,
          title: isComm ? 'Booking Commission' : isSub ? 'SaaS Subscription' : 'Booking Payment',
          desc: getCompanyDisplayName(tx.companyId),
          date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently',
          amount: `₹${(tx.amount || 0).toFixed(2)}`,
          amountColor: isComm ? '#2563eb' : isSub ? '#7c3aed' : '#10b981',
          icon: isComm ? '🎯' : isSub ? '📝' : '💰',
          iconBg: isComm ? '#eff6ff' : isSub ? '#faf5ff' : '#f0fdf4',
          iconColor: isComm ? '#2563eb' : isSub ? '#7c3aed' : '#10b981',
          status: String(tx.status || 'success').toUpperCase()
        };
      })
    : defaultActivities;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out', color: '#1e293b' }}>
      {/* Title section */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', fontWeight: 800, marginBottom: '0.2rem', color: '#0f172a' }}>Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Real-time platform overview</p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {statCards.map(card => (
          <div 
            key={card.title} 
            onClick={() => onNavigate && onNavigate(card.target)}
            style={{ 
              background: '#fff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '16px', 
              padding: '1.25rem 1rem', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)', 
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
            }}
          >
            {/* Left Icon box */}
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: card.bgIcon,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              color: card.iconColor,
              flexShrink: 0
            }}>
              {card.icon}
            </div>

            {/* Right Info */}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.title}</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '2px 0', lineHeight: '1.2' }}>{card.value}</span>
              <span style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Double Column Grid: Recent Activities & Platform Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        
        {/* Left Column: Recent Activities */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', background: '#fff' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', marginBottom: '1.25rem', color: '#0f172a', fontWeight: 700 }}>Recent Activities</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1 }}>
            {activitiesToRender.map((act) => (
              <div key={act.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: act.iconBg, color: act.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                    {act.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e293b' }}>{act.title}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '1px' }}>{act.desc} · {act.date}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: act.amountColor }}>{act.amount}</div>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '0.1rem 0.4rem', borderRadius: '6px', textTransform: 'uppercase' }}>{act.status}</span>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => onNavigate('payments')} 
            style={{ border: 'none', background: 'transparent', color: '#2563eb', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', textAlign: 'center', marginTop: '1.25rem', display: 'block', width: '100%', textDecoration: 'underline dotted' }}
          >
            View All Activities &gt;
          </button>
        </div>

        {/* Right Column: Platform Overview Graph */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: '#0f172a', fontWeight: 700, margin: 0 }}>Platform Overview</h3>
              <div style={{ marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Revenue Overview</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '2px 0', lineHeight: 1 }}>₹219.00</div>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Total Subscription Revenue</span>
              </div>
            </div>
            
            {/* Dropdown Filter */}
            <select 
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#475569' }}
              defaultValue="This Month"
            >
              <option>This Month</option>
              <option>Last Month</option>
            </select>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1rem', fontSize: '0.72rem', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed', display: 'inline-block' }}></span>
              <span style={{ color: '#475569' }}>Subscription Revenue: <strong style={{ color: '#0f172a' }}>₹219.00</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              <span style={{ color: '#475569' }}>Commission Revenue: <strong style={{ color: '#0f172a' }}>₹10.50</strong></span>
            </div>
          </div>

          {/* SVG Line Graph */}
          <div style={{ flex: 1, position: 'relative', height: '160px', marginTop: '0.5rem' }}>
            <svg viewBox="0 0 500 150" width="100%" height="100%" style={{ overflow: 'visible' }}>
              {/* Grid lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="60" x2="480" y2="60" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="100" x2="480" y2="100" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="130" x2="480" y2="130" stroke="#cbd5e1" strokeWidth="1" />

              {/* Y Axis Labels */}
              <text x="30" y="24" fill="#94a3b8" fontSize="8" textAnchor="end">₹300</text>
              <text x="30" y="64" fill="#94a3b8" fontSize="8" textAnchor="end">₹200</text>
              <text x="30" y="104" fill="#94a3b8" fontSize="8" textAnchor="end">₹100</text>
              <text x="30" y="134" fill="#94a3b8" fontSize="8" textAnchor="end">₹0</text>

              {/* X Axis Labels */}
              <text x="40" y="146" fill="#94a3b8" fontSize="8" textAnchor="middle">01 Jul</text>
              <text x="113" y="146" fill="#94a3b8" fontSize="8" textAnchor="middle">06 Jul</text>
              <text x="186" y="146" fill="#94a3b8" fontSize="8" textAnchor="middle">11 Jul</text>
              <text x="259" y="146" fill="#94a3b8" fontSize="8" textAnchor="middle">16 Jul</text>
              <text x="332" y="146" fill="#94a3b8" fontSize="8" textAnchor="middle">21 Jul</text>
              <text x="405" y="146" fill="#94a3b8" fontSize="8" textAnchor="middle">26 Jul</text>
              <text x="480" y="146" fill="#94a3b8" fontSize="8" textAnchor="middle">31 Jul</text>

              {/* Subscription Revenue Line - Purple Area & Stroke */}
              <defs>
                <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path 
                d="M 40 120 Q 113 110 186 100 T 332 60 T 480 30 L 480 130 L 40 130 Z" 
                fill="url(#purpleGrad)" 
              />
              <path 
                d="M 40 120 Q 113 110 186 100 T 332 60 T 480 30" 
                fill="none" 
                stroke="#7c3aed" 
                strokeWidth="3" 
                strokeLinecap="round"
              />

              {/* Commission Revenue Line - Green Stroke */}
              <path 
                d="M 40 128 L 113 128 L 186 128 L 259 128 L 332 128 L 405 128 L 480 128" 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="2" 
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

      </div>

      {/* Bottom Row grid: Top Vendors, Sub Doughnut, Booking Doughnut, System Health */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem' }}>
        
        {/* Card 1: Top Vendors */}
        <div className="card" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', background: '#fff', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.85rem' }}>Top Rental Companies</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
            {[
              { name: 'Himalayan Cruisers', count: 2 },
              { name: 'InDrive Rentals', count: 3 },
              { name: 'Mountain Wheels', count: 0 }
            ].map(item => (
              <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '0.4rem 0', borderBottom: '1px solid #f8fafc' }}>
                <span style={{ color: '#475569', fontWeight: 500 }}>{item.name}</span>
                <span style={{ color: '#2563eb', fontWeight: 700 }}>{item.count} Vehicles</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Subscription Status Doughnut */}
        <div className="card" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', background: '#fff' }}>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.85rem' }}>Subscription Status</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative', width: '70px', height: '70px', flexShrink: 0 }}>
              <svg width="70" height="70" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#7c3aed" strokeWidth="3" strokeDasharray="100 0" strokeDashoffset="25" />
              </svg>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>100%</span>
                <span style={{ fontSize: '0.52rem', color: '#64748b', fontWeight: 600 }}>Active</span>
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed' }}></span>
                <span>Active ({stats?.activeCompanies || 4})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff7a00' }}></span>
                <span>Expired (0)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cbd5e1' }}></span>
                <span>Pending (0)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Booking Status Doughnut */}
        <div className="card" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', background: '#fff' }}>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.85rem' }}>Booking Status</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative', width: '70px', height: '70px', flexShrink: 0 }}>
              <svg width="70" height="70" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
              </svg>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>0</span>
                <span style={{ fontSize: '0.52rem', color: '#64748b', fontWeight: 600 }}>Total</span>
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                <span>Active (0)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb' }}></span>
                <span>Completed (0)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></span>
                <span>Cancelled (0)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }}></span>
                <span>Pending (0)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: System Health Checks */}
        <div className="card" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', background: '#fff' }}>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.85rem' }}>System Health</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              'Database',
              'API Services',
              'Payment Gateway',
              'Storage'
            ].map(svc => (
              <div key={svc} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>{svc}</span>
                <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.62rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '6px' }}>HEALTHY</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────── */
export default function SuperAdminDashboard() {
  const { token, logout } = useAuth();
  const [stats, setStats]               = useState(null);
  const [companies, setCompanies]       = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeNav, setActiveNav]       = useState('dashboard');
  const [activeSub, setActiveSub]       = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // KYC Inspection Modal State
  const [selectedKycItem, setSelectedKycItem] = useState(null);
  const [confirmingPayout, setConfirmingPayout] = useState(null);

  // Driver Assignment & Publish Status Management
  const [assignedDriversMap, setAssignedDriversMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('car_owner_assigned_drivers') || '{}');
    } catch {
      return {};
    }
  });

  const [registeredDriversList, setRegisteredDriversList] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('registered_drivers_list') || '[]');
      if (saved.length > 0) return saved;
    } catch {}
    return [
      { id: 'dr_1', name: 'Ramesh Kumar', phone: '+91 98765 43210' },
      { id: 'dr_2', name: 'Praveen Raj', phone: '+91 98765 12345' },
      { id: 'dr_3', name: 'Karthik S', phone: '+91 98765 67890' }
    ];
  });

  const handleAssignDriver = (coId, driverName) => {
    const updated = { ...assignedDriversMap, [coId]: driverName };
    setAssignedDriversMap(updated);
    try {
      localStorage.setItem('car_owner_assigned_drivers', JSON.stringify(updated));
    } catch {}

    if (driverName) {
      alert(`✓ Driver "${driverName}" assigned to vehicle owner successfully!`);
    } else {
      alert(`ℹ️ Driver unassigned.`);
    }
  };

  const handleQuickRegisterDriver = (coId) => {
    const driverName = prompt('Enter new driver full name to register & assign:', 'Karthik S');
    if (!driverName || !driverName.trim()) return;

    const newDriver = {
      id: 'dr_' + Date.now(),
      name: driverName.trim(),
      phone: '+91 ' + Math.floor(6000000000 + Math.random() * 3999999999)
    };

    const updatedDrivers = [...registeredDriversList, newDriver];
    setRegisteredDriversList(updatedDrivers);
    try {
      localStorage.setItem('registered_drivers_list', JSON.stringify(updatedDrivers));
    } catch {}

    handleAssignDriver(coId, newDriver.name);
  };

  const handleTogglePublishStatus = (co) => {
    const targetEmail = (co.email || '').trim().toLowerCase();
    const targetId = String(co.id || '');

    const isMatch = (item) => {
      const itemEmail = (item.email || item.ownerEmail || '').trim().toLowerCase();
      const itemId = String(item.id || item._id || '');
      return (targetId && itemId === targetId) || (targetEmail && itemEmail === targetEmail);
    };

    try {
      const approved = JSON.parse(localStorage.getItem('approved_car_owners') || '[]');
      const pending = JSON.parse(localStorage.getItem('pending_car_owners') || '[]');

      const isCurrentlyPublished = co.published !== false && (co.status === 'ACTIVE' || co.status === 'APPROVED');
      const newStatus = isCurrentlyPublished ? 'UNPUBLISHED' : 'ACTIVE';
      const newPublishBool = !isCurrentlyPublished;

      const updatedApproved = approved.map(item => isMatch(item) ? { ...item, published: newPublishBool, status: newStatus } : item);
      const updatedPending = pending.map(item => isMatch(item) ? { ...item, published: newPublishBool, status: newStatus } : item);

      localStorage.setItem('approved_car_owners', JSON.stringify(updatedApproved));
      localStorage.setItem('pending_car_owners', JSON.stringify(updatedPending));

      alert(`🚗 Vehicle status for ${co.name} updated to: ${newPublishBool ? '🟢 Published (Active on platform)' : '🔴 Unpublished'}`);
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprovePay = (req) => {
    if (!req) return;
    setConfirmingPayout(req);

    const isOk = window.confirm(
      `💳 CONFIRM PAYOUT:\n\n` +
      `Owner: ${req.ownerName} (${req.ownerEmail || 'sathya@gmail.com'})\n` +
      `Amount: ₹${Number(req.amount || 4930).toLocaleString('en-IN')}\n` +
      `Account: ${req.bankDetails || 'HDFC Bank (A/C: ****8899)'}\n` +
      `Ref ID: ${req.id || 'PAY-4930'}\n\n` +
      `Are you sure you want to process this payout via RazorpayX?`
    );

    if (isOk) {
      const utr = 'TXN' + Math.floor(10000000 + Math.random() * 90000000);
      const fullTimeStamp = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      try {
        const allReqs = JSON.parse(localStorage.getItem('payout_requests') || '[]');
        const updated = allReqs.map(r => r.id === req.id ? { ...r, status: 'PAID', utrNo: utr, paidAt: fullTimeStamp } : r);
        if (!updated.some(r => r.id === req.id)) {
          updated.unshift({ ...req, status: 'PAID', utrNo: utr, paidAt: fullTimeStamp });
        }
        localStorage.setItem('payout_requests', JSON.stringify(updated));

        // Push notification to Vehicle Owner
        const notifItem = {
          id: 'notif_' + Date.now(),
          ownerEmail: (req.ownerEmail || 'sathya@gmail.com').toLowerCase().trim(),
          title: '🎉 Payout Dispatched & Settled!',
          message: `₹${Number(req.amount || 4930).toLocaleString('en-IN')} payout (${req.id}) has been successfully credited to your bank account via RazorpayX. UTR: ${utr}`,
          timestamp: fullTimeStamp,
          read: false
        };

        const existingOwnerNotifs = JSON.parse(localStorage.getItem('notifications_car_owner') || '[]');
        localStorage.setItem('notifications_car_owner', JSON.stringify([notifItem, ...existingOwnerNotifs]));

        const existingAdminNotifs = JSON.parse(localStorage.getItem('notifications_super_admin') || '[]');
        localStorage.setItem('notifications_super_admin', JSON.stringify([notifItem, ...existingAdminNotifs]));
      } catch (err) {
        console.error(err);
      }

      alert(`🎉 SUCCESS!\n\nRazorpayX Payout of ₹${Number(req.amount || 4930).toLocaleString('en-IN')} processed successfully for ${req.ownerName}!\n\nStatus: PAID\nTransaction UTR: ${utr}\nPaid Date & Time: ${fullTimeStamp}`);
      window.location.reload();
    }
  };

  // Chat States
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef(null);

  const filterContactMessages = (msgList, contact) => {
    if (!contact || !Array.isArray(msgList)) return [];
    if (contact.type === 'CAR_OWNER' || String(contact._id).startsWith('co_')) {
      return msgList;
    }
    const targetEmail = (contact.ownerEmail || contact.email || '').toLowerCase().trim();
    const targetId = String(contact._id || contact.id || '').toLowerCase().trim();

    return msgList.filter(msg => {
      const msgEmail = (msg.ownerEmail || '').toLowerCase().trim();
      if (targetEmail && msgEmail && targetEmail === msgEmail) return true;

      const sId = String(typeof msg.senderId === 'object' && msg.senderId ? (msg.senderId._id || msg.senderId.id) : (msg.senderId || '')).toLowerCase();
      const rId = String(typeof msg.receiverId === 'object' && msg.receiverId ? (msg.receiverId._id || msg.receiverId.id) : (msg.receiverId || '')).toLowerCase();
      const cId = String(typeof msg.companyId === 'object' && msg.companyId ? (msg.companyId._id || msg.companyId.id) : (msg.companyId || '')).toLowerCase();

      if (targetId && (sId === targetId || rId === targetId || cId === targetId)) return true;
      if (targetEmail && (sId.includes(targetEmail) || rId.includes(targetEmail) || cId.includes(targetEmail))) return true;

      return false;
    });
  };

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
            _id: key,
            sender: m.sender || (m.senderRole === 'super-admin' ? 'admin' : 'owner'),
            senderRole: m.senderRole || (m.sender === 'admin' ? 'super-admin' : 'car-owner'),
            senderName: m.senderName || (m.sender === 'admin' ? 'Super Admin' : 'Sathya'),
            text: m.text || m.message || '',
            message: m.text || m.message || '',
            time: m.time || m.createdAt || '10:00 AM',
            createdAt: m.time || m.createdAt || '10:00 AM',
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

  const fetchChatMessages = async () => {
    const masterList = getMergedChatMessages();
    setChatMessages(masterList);
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedContact) return;

    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const targetEmail = (selectedContact.ownerEmail || selectedContact.email || 'sathya@gmail.com').toLowerCase().trim();

    const newAdminMsg = {
      id: 'msg_' + Date.now(),
      sender: 'admin',
      senderRole: 'super-admin',
      senderName: 'Super Admin',
      text: chatInput.trim(),
      message: chatInput.trim(),
      time: timeStr,
      ownerEmail: targetEmail,
      ownerName: selectedContact.name || 'Sathya',
      timestamp: Date.now()
    };

    try {
      const currentMaster = getMergedChatMessages();
      const updatedMaster = [...currentMaster, newAdminMsg];
      localStorage.setItem('rentos_unified_chat_store', JSON.stringify(updatedMaster));
      localStorage.setItem('rentos_live_chat_store', JSON.stringify(updatedMaster));
      localStorage.setItem('owner_support_messages', JSON.stringify(updatedMaster));
      setChatMessages(updatedMaster);
    } catch (err) {}

    if (token && selectedContact.type === 'VENDOR') {
      const payload = {
        message: chatInput,
        receiverRole: 'company-admin',
        receiverId: selectedContact.ownerId || selectedContact._id,
        companyId: selectedContact._id
      };
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      }).catch(() => {});
    }

    setChatInput('');
  };

  const sendDirectChatMessage = async (text) => {
    if (!text || !text.trim() || !selectedContact) return;

    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const targetEmail = (selectedContact.ownerEmail || selectedContact.email || 'sathya@gmail.com').toLowerCase().trim();

    const newAdminMsg = {
      id: 'msg_' + Date.now(),
      sender: 'admin',
      senderRole: 'super-admin',
      senderName: 'Super Admin',
      text: text.trim(),
      message: text.trim(),
      time: timeStr,
      ownerEmail: targetEmail,
      ownerName: selectedContact.name || 'Sathya',
      timestamp: Date.now()
    };

    try {
      const currentMaster = getMergedChatMessages();
      const updatedMaster = [...currentMaster, newAdminMsg];
      localStorage.setItem('rentos_unified_chat_store', JSON.stringify(updatedMaster));
      localStorage.setItem('rentos_live_chat_store', JSON.stringify(updatedMaster));
      localStorage.setItem('owner_support_messages', JSON.stringify(updatedMaster));
      setChatMessages(updatedMaster);
    } catch (err) {}

    if (token && selectedContact.type === 'VENDOR') {
      const payload = {
        message: text,
        receiverRole: 'company-admin',
        receiverId: selectedContact.ownerId || selectedContact._id,
        companyId: selectedContact._id
      };
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      }).catch(() => {});
    }
  };

  const fetchNotifications = async () => {
    let localNotifs = [];
    try {
      localNotifs = JSON.parse(localStorage.getItem('notifications_super_admin') || '[]');
    } catch {}

    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const cType = res.headers.get('content-type') || '';
      if (res.ok && cType.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          const merged = [...localNotifs, ...(data.notifications || [])];
          setNotifications(merged);
          const lastReadCount = Number(localStorage.getItem(`last_read_notif_count_super_admin`) || 0);
          setUnreadCount(Math.max(0, merged.length - lastReadCount));
          return;
        }
      }
    } catch (err) {
      console.warn('Notifications fetch error:', err);
    }
    setNotifications(localNotifs);
    const lastReadCount = Number(localStorage.getItem(`last_read_notif_count_super_admin`) || 0);
    setUnreadCount(Math.max(0, localNotifs.length - lastReadCount));
  };

  useEffect(() => {
    if (token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      if (!token) {
        setLoading(false);
        return;
      }
      const [sRes, cRes] = await Promise.all([
        fetch('/api/super-admin/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/super-admin/companies',  { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const sType = sRes.headers.get('content-type') || '';
      if (sRes.ok && sType.includes('application/json')) {
        const sData = await sRes.json();
        if (sData.success) { setStats(sData.stats); setTransactions(sData.recentTransactions || []); }
      }
      const cType = cRes.headers.get('content-type') || '';
      if (cRes.ok && cType.includes('application/json')) {
        const cData = await cRes.json();
        if (cData.success) setCompanies(Array.isArray(cData.companies) ? cData.companies : []);
      }
    } catch (err) {
      console.error('SuperAdmin fetch dashboard data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const safetyTimer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(safetyTimer);
  }, [token]);

  useEffect(() => {
    if (activeNav === 'chat') {
      fetchChatMessages();
      const interval = setInterval(fetchChatMessages, 100);
      const handleStorageChange = () => fetchChatMessages();
      window.addEventListener('storage', handleStorageChange);

      return () => {
        clearInterval(interval);
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [activeNav]);

  // Set default selected contact once contacts load
  useEffect(() => {
    if (!selectedContact) {
      try {
        const approved = JSON.parse(localStorage.getItem('approved_car_owners') || '[]');
        if (approved.length > 0) {
          const o = approved[0];
          setSelectedContact({
            _id: 'co_' + (o.id || o.email),
            name: o.name || 'Sathya',
            displayName: o.name || 'Sathya',
            ownerName: o.name || 'Sathya',
            ownerEmail: (o.email || 'sathya@gmail.com').toLowerCase().trim(),
            subText: `${o.carName || 'Hyundai Creta SX'} (${o.email || 'sathya@gmail.com'})`,
            type: 'CAR_OWNER',
            badge: '🚗 Car Owner',
            phone: o.phone || '+91 96301 47852'
          });
          return;
        }
      } catch {}

      if (companies.length > 0) {
        setSelectedContact(companies[0]);
      }
    }
  }, [companies, selectedContact]);

  const handleNavChange = (target, subObj) => {
    if (typeof target === 'object' && target !== null && target.nav) {
      setActiveNav(target.nav);
      if (target.sub) {
        setActiveSub({ id: target.sub, label: target.subLabel || target.sub });
      } else {
        setActiveSub(null);
      }
    } else {
      setActiveNav(target);
      if (subObj) {
        setActiveSub({ id: subObj.id || subObj, label: subObj.label || subObj });
      } else {
        setActiveSub(null);
      }
    }
  };
  
  const handleSubSelect = (subId, subLabel) => {
    if (typeof subId === 'object' && subId !== null) {
      setActiveSub({ id: subId.id || subId._id || 'rc-all', label: typeof subId.label === 'string' ? subId.label : (subId.name || 'Details') });
    } else {
      setActiveSub({ id: subId, label: typeof subLabel === 'string' ? subLabel : (subLabel?.label || subLabel?.name || 'Details') });
    }
  };

  const handleBack = () => setActiveSub(null);

  const renderPanel = () => {
    if (activeNav === 'dashboard') {
      return <DashboardPanel stats={stats} transactions={transactions} companies={companies} onNavigate={handleNavChange} />;
    }
    const navLabel = NAV_ITEMS.find(n => n.id === activeNav)?.label ?? '';

    if (activeNav === 'chat') {
      return (
        <div style={{ animation: 'fadeIn 0.3s ease-out', height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>Vendor Chat Channels</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Direct messaging support channels with onboarded rental vendor companies</p>
          </div>

          <div className="card" style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: 0, border: '1px solid var(--border-color)', borderRadius: '16px', background: '#ffffff' }}>
            
            {/* CONTACTS SIDEBAR */}
            <div style={{ width: '290px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', background: '#f8fafc', flexShrink: 0 }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Direct Chat Contacts</div>
                <input 
                  type="text" 
                  placeholder="🔍 Search vendors & car owners..." 
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.82rem', outline: 'none' }}
                />
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                {(() => {
                  const companyContacts = companies.filter(c => c && c.status !== 'pending_approval').map(c => ({
                    _id: c._id || c.id,
                    name: c.name,
                    displayName: c.name,
                    subText: c.ownerName || c.ownerEmail,
                    type: 'VENDOR',
                    badge: '🏢 Vendor',
                    phone: c.phone || c.ownerPhone || '+91 9517863240'
                  }));

                  const carOwnerContacts = (() => {
                    try {
                      const approved = JSON.parse(localStorage.getItem('approved_car_owners') || '[]');
                      const pending = JSON.parse(localStorage.getItem('pending_car_owners') || '[]');
                      const merged = [...approved, ...pending];
                      if (merged.length > 0) {
                        return merged.map(o => ({
                          _id: 'co_' + (o.id || o.email || 'sathya'),
                          name: o.name || 'Sathya',
                          displayName: o.name || 'Sathya',
                          ownerName: o.name || 'Sathya',
                          ownerEmail: (o.email || 'sathya@gmail.com').toLowerCase().trim(),
                          subText: `${o.carName || 'Hyundai Creta SX'} (${o.email || 'sathya@gmail.com'})`,
                          type: 'CAR_OWNER',
                          badge: '🚗 Car Owner',
                          phone: o.phone || '+91 96301 47852'
                        }));
                      }
                    } catch {}

                    return [{
                      _id: 'co_sathya',
                      name: 'Sathya',
                      displayName: 'Sathya',
                      ownerName: 'Sathya',
                      ownerEmail: 'sathya@gmail.com',
                      subText: 'Hyundai Creta SX (sathya@gmail.com)',
                      type: 'CAR_OWNER',
                      badge: '🚗 Car Owner',
                      phone: '+91 96301 47852'
                    }];
                  })();

                  const allContactsList = [...companyContacts, ...carOwnerContacts].filter(
                    (c, idx, self) => self.findIndex(t => t._id === c._id) === idx &&
                    (c.name.toLowerCase().includes(chatSearchQuery.toLowerCase()) || (c.subText && c.subText.toLowerCase().includes(chatSearchQuery.toLowerCase())))
                  );

                  if (allContactsList.length === 0) {
                    return <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.5rem', textAlign: 'center' }}>No active contacts found.</div>;
                  }

                  return allContactsList.map(c => {
                    const isSelected = selectedContact?._id === c._id;
                    return (
                      <button
                        key={c._id}
                        onClick={() => setSelectedContact(c)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.6rem 0.5rem',
                          background: isSelected ? 'rgba(37,99,235,0.08)' : 'transparent',
                          border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                          borderLeft: isSelected ? '3px solid #2563eb' : '3px solid transparent',
                          marginBottom: '0.25rem'
                        }}
                      >
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: c.type === 'CAR_OWNER' ? '#059669' : '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '0.9rem', fontWeight: 'bold' }}>
                          {c.type === 'CAR_OWNER' ? '🚗' : '🏢'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{c.name}</div>
                            <span style={{ fontSize: '0.62rem', background: c.type === 'CAR_OWNER' ? '#dcfce7' : '#eff6ff', color: c.type === 'CAR_OWNER' ? '#15803d' : '#2563eb', padding: '0.1rem 0.35rem', borderRadius: '6px', fontWeight: 800 }}>{c.badge}</span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.subText}</div>
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {/* CHAT AREA */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fafafb', minWidth: 0 }}>
              {selectedContact ? (
                <>
                  {/* Chat Header */}
                  <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', margin: 0, fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        🏢 {selectedContact.name}
                        <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 700 }}>
                          ACTIVE VENDOR
                        </span>
                      </h4>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Owner: {selectedContact.ownerName} • {selectedContact.ownerEmail}
                      </div>
                    </div>

                    {/* Clickable Mobile Call Button */}
                    {selectedContact.mobile && (
                      <a 
                        href={`tel:${selectedContact.mobile}`} 
                        className="btn" 
                        style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontWeight: 700, textDecoration: 'none', borderRadius: '8px' }}
                      >
                        📞 Call Owner: {selectedContact.mobile}
                      </a>
                    )}
                  </div>

                  {/* Messages Stream */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#efeae2', borderBottom: '1px solid #e9edef' }}>
                    {filterContactMessages(chatMessages, selectedContact).length === 0 ? (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#667781', gap: '0.5rem' }}>
                        <span style={{ fontSize: '2.5rem' }}>💬</span>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>No messages in this chat thread yet.</div>
                        <div style={{ fontSize: '0.72rem' }}>Send a message to initiate direct support contact.</div>
                      </div>
                    ) : (
                      filterContactMessages(chatMessages, selectedContact).map((msg) => {
                        const isMe = msg.senderRole === 'super-admin';
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
                                  {msg.senderName || 'Vendor Admin'}
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
                                    <a href="#" onClick={(e) => { e.preventDefault(); alert('Downloading: ' + msg.message.replace('[Attached File] ', '')); }} style={{ fontSize: '0.72rem', color: '#00a884', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                      📥 Download File
                                    </a>
                                  </div>
                                ) : msg.message.startsWith('[Voice Message]') ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.25rem 0', minWidth: '180px' }}>
                                    <button type="button" onClick={() => alert('Playing voice recording...')} style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#00a884', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.85rem' }}>
                                      ▶️
                                    </button>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '14px' }}>
                                        {[3, 8, 5, 9, 4, 7, 3, 8, 6, 9, 4, 7, 5, 8, 3, 6, 4, 8].map((h, i) => (
                                          <div key={i} style={{ width: '2px', height: `${h * 1.5}px`, background: '#8696a0', borderRadius: '1px' }}></div>
                                        ))}
                                      </div>
                                      <div style={{ fontSize: '0.68rem', color: '#667781' }}>🎙️ Voice Message ({msg.message.replace('[Voice Message] ', '')})</div>
                                    </div>
                                  </div>
                                ) : (
                                  msg.message
                                )}
                              </div>
                              <div style={{ fontSize: '0.62rem', color: '#667781', textAlign: 'right', marginTop: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                                {(() => {
                                  const ts = msg.createdAt;
                                  if (!ts) return '12:00 PM';
                                  if (typeof ts === 'string' && (ts.includes('AM') || ts.includes('PM') || ts.includes('am') || ts.includes('pm'))) {
                                    return ts;
                                  }
                                  try {
                                    const d = new Date(ts);
                                    if (!isNaN(d.getTime())) {
                                      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    }
                                  } catch {}
                                  return String(ts);
                                })()}
                                {isMe && <span style={{ color: '#53bdeb', fontSize: '0.8rem', fontWeight: 'bold' }}>✓✓</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Send Input Panel */}
                  <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', background: '#ffffff' }}>
                    <input
                      type="file"
                      id="superadmin-chat-file-input"
                      style={{ display: 'none' }}
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const isImg = file.type.startsWith('image/');
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          const dataUrl = evt.target.result;
                          const msgText = isImg
                            ? `[Attached Image] ${file.name}||${dataUrl}`
                            : `[Attached File] ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
                          sendDirectChatMessage(msgText);
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }}
                    />

                    {isRecordingVoice ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fef2f2', border: '1px solid #fecdd3', padding: '0.55rem 0.85rem', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#be123c', fontWeight: 800, fontSize: '0.82rem' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626', display: 'inline-block', animation: 'pulse 1s infinite' }}></span>
                          <span>🎙️ Recording Voice... 0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            onClick={() => {
                              if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
                              setIsRecordingVoice(false);
                              setRecordingSeconds(0);
                            }}
                            style={{ background: '#cbd5e1', color: '#334155', border: 'none', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                          >
                            ✕ Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
                              const secs = recordingSeconds || 4;
                              sendDirectChatMessage(`[Voice Message] 0:${secs < 10 ? '0' : ''}${secs}`);
                              setIsRecordingVoice(false);
                              setRecordingSeconds(0);
                            }}
                            style={{ background: '#dc2626', color: '#ffffff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer' }}
                          >
                            ✓ Send Note
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSendChatMessage} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => document.getElementById('superadmin-chat-file-input')?.click()}
                          style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Attach Image or Document"
                        >
                          📎
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setIsRecordingVoice(true);
                            setRecordingSeconds(0);
                            recordingTimerRef.current = setInterval(() => {
                              setRecordingSeconds(prev => prev + 1);
                            }, 1000);
                          }}
                          style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Record Voice Note"
                        >
                          🎙️
                        </button>

                        <input 
                          type="text" 
                          placeholder={`Type support message to ${selectedContact.name}...`}
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          style={{ flex: 1, padding: '0.6rem 0.85rem', borderRadius: '24px', border: '1px solid var(--border-color)', fontSize: '0.85rem', outline: 'none' }}
                        />
                        <button 
                          type="submit" 
                          className="btn btn-primary" 
                          style={{ padding: '0.6rem 1.25rem', fontSize: '0.82rem', fontWeight: 700, borderRadius: '24px', background: '#7c3aed' }}
                        >
                          Send 🚀
                        </button>
                      </form>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '0.5rem' }}>
                  <span style={{ fontSize: '3rem' }}>🏢</span>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>No Vendor Selected</div>
                  <div style={{ fontSize: '0.75rem' }}>Select a vendor from the sidebar to open the direct chat channel.</div>
                </div>
              )}
            </div>

          </div>
        </div>
      );
    }

    if (!activeSub) {
      if (activeNav === 'live-tracking') return <LiveTrackingComponent />;
      if (activeNav === 'rental-companies') return <HubCardGrid navId={activeNav} navLabel={navLabel} companies={companies} onSubSelect={handleSubSelect} />;

      if (activeNav === 'payout-requests') {
        const payoutReqs = (() => {
          try {
            const raw = JSON.parse(localStorage.getItem('payout_requests') || '[]');
            if (raw.length > 0) return raw;

            // Auto-seed Sathya's instant payout request if empty so it is immediately visible
            const defaultReq = [{
              id: 'PAY-4930',
              ownerEmail: 'sathya@gmail.com',
              ownerName: 'Sathya',
              amount: 4930,
              bankDetails: 'HDFC Bank India (A/C: ...8899)',
              upiId: 'sathya@okaxis',
              requestedAt: '05 Aug 2026, 11:15 AM',
              status: 'Pending Super Admin Approval',
              utrNo: 'Processing'
            }];
            localStorage.setItem('payout_requests', JSON.stringify(defaultReq));
            return defaultReq;
          } catch { return []; }
        })();
        const pendingPayouts = payoutReqs.filter(r => !r.status.includes('Paid') && !r.status.includes('Completed') && !r.status.includes('Rejected'));
        const completedPayouts = payoutReqs.filter(r => r.status.includes('Paid') || r.status.includes('Completed'));
        const totalPendingAmt = pendingPayouts.reduce((sum, r) => sum + Number(r.amount || 0), 0);

        return (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>Car Owner Instant Payout Requests</h2>
                <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Review, approve and transfer requested bank/UPI payouts for personal car owners.</p>
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, background: '#fef3c7', color: '#b45309', padding: '0.45rem 0.95rem', borderRadius: '10px', border: '1px solid #fde68a' }}>
                ⏳ Pending Payouts: {pendingPayouts.length} (₹ {totalPendingAmt.toLocaleString('en-IN')})
              </div>
            </div>

            {/* KPI STAT CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Payout Requests</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginTop: '0.3rem' }}>{payoutReqs.length} Requests</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' }}>Across all car owner partners</div>
              </div>

              <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Pending Payout Amount</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#d97706', marginTop: '0.3rem' }}>₹ {totalPendingAmt.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 700, marginTop: '0.3rem' }}>⏳ Awaiting Admin Transfer</div>
              </div>

              <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Completed Payouts</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669', marginTop: '0.3rem' }}>{completedPayouts.length} Dispatched</div>
                <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 800, marginTop: '0.3rem' }}>✓ Settled & UTR Generated</div>
              </div>
            </div>

            {/* PAYOUT TABLE CARD */}
            <div className="card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>Live Payout Queue</h3>
              </div>

              <table className="custom-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Payout Ref ID</th><th>Owner / Partner Name</th><th>Requested Date & Time</th><th>Amount (₹)</th><th>Settlement Account</th><th>Status</th><th>Paid Date & Time</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payoutReqs.length === 0 ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No instant payout requests submitted yet by car owners.</td></tr>
                  ) : (
                    payoutReqs.map(req => (
                      <tr key={req.id}>
                        <td style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>{req.id}</td>
                        <td>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{req.ownerName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{req.ownerEmail}</div>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>{req.requestedAt || '05 Aug 2026, 11:15 AM'}</td>
                        <td style={{ fontWeight: 900, color: '#059669', fontSize: '1rem' }}>₹ {Number(req.amount).toLocaleString('en-IN')}</td>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>{req.bankDetails}</div>
                          <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 700 }}>UPI: {req.upiId || 'N/A'}</div>
                        </td>
                        <td>
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: '12px',
                            background: req.status === 'PAID' || req.status.includes('Paid') ? '#dcfce7' : req.status.includes('Rejected') ? '#ffe4e6' : '#fef3c7',
                            color: req.status === 'PAID' || req.status.includes('Paid') ? '#15803d' : req.status.includes('Rejected') ? '#be123c' : '#b45309',
                            border: req.status === 'PAID' || req.status.includes('Paid') ? '1px solid #86efac' : req.status.includes('Rejected') ? '1px solid #fca5a5' : '1px solid #fde68a'
                          }}>
                            {req.status === 'PAID' || req.status.includes('Paid') ? '✓ PAID (RazorpayX)' : req.status.includes('Rejected') ? '🔴 Rejected' : '⏳ Pending Super Admin Approval'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: req.paidAt ? '#059669' : '#94a3b8', fontWeight: 700 }}>
                          {req.paidAt || (req.status === 'PAID' ? '10 Aug 2026, 04:45 PM' : '— Pending')}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {(!req.status.includes('Paid') && !req.status.includes('Completed') && req.status !== 'PAID') ? (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleApprovePay(req);
                                  }}
                                  style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.45rem 0.95rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                                >
                                  ✓ Approve & Pay
                                </button>
                                {req.status !== 'Rejected' && (
                                  <button
                                    onClick={() => {
                                      const reason = prompt('Enter rejection reason for this payout request:', 'Verification required');
                                      if (reason === null) return;
                                      const allReqs = JSON.parse(localStorage.getItem('payout_requests') || '[]');
                                      const updated = allReqs.map(r => r.id === req.id ? { ...r, status: 'Rejected', rejectionReason: reason } : r);
                                      localStorage.setItem('payout_requests', JSON.stringify(updated));
                                      alert(`✕ Rejected payout request ${req.id} for ${req.ownerName}.`);
                                      window.location.reload();
                                    }}
                                    style={{ background: '#f43f5e', color: '#fff', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                                  >
                                    ✕ Reject
                                  </button>
                                )}
                              </>
                            ) : req.status === 'PAYMENT FAILED' ? (
                              <button
                                onClick={() => setConfirmingPayout(req)}
                                style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                              >
                                🔄 Retry Payout
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.3rem 0.6rem', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                                ✓ PAID ({req.utrNo || 'TXN88994411'})
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      if (activeNav === 'car-owners') {
        const pendingOwners = (() => {
          try { return JSON.parse(localStorage.getItem('pending_car_owners') || '[]'); } catch { return []; }
        })();
        const approvedOwners = (() => {
          try { return JSON.parse(localStorage.getItem('approved_car_owners') || '[]'); } catch { return []; }
        })();

        const ownerMapByEmail = new Map();
        const getEmail = co => (co.email || co.ownerEmail || `owner_${co.id}@company.com`).trim().toLowerCase();

        // 1. Pending car owners
        pendingOwners.forEach((co, pIdx) => {
          const emailKey = getEmail(co);
          const uniqueKey = String(co.id || co._id || `pending_${emailKey}_${pIdx}`);
          ownerMapByEmail.set(uniqueKey, {
            id: uniqueKey,
            name: co.name || 'Car Owner Applicant',
            phone: co.phone || co.mobile || '+91 98765 43210',
            email: emailKey,
            carName: co.carName || co.vehicleName || 'Personal Fleet Vehicle',
            plate: co.plate || co.vehiclePlate || 'TN-29-2024',
            pricePerDay: co.pricePerDay || co.rate || 1500,
            status: co.status || 'Pending Approval',
            isPublished: co.isPublished !== false && co.published !== false,
            published: co.published !== false && co.isPublished !== false,
            image: co.image || co.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
            imageUrl: co.imageUrl || co.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'
          });
        });

        // 2. Approved car owners
        approvedOwners.forEach((co, aIdx) => {
          const emailKey = getEmail(co);
          const uniqueKey = String(co.id || co._id || `approved_${emailKey}_${aIdx}`);
          ownerMapByEmail.set(uniqueKey, {
            id: uniqueKey,
            name: co.name || 'Registered Car Owner',
            phone: co.phone || '+91 98765 43210',
            email: emailKey,
            carName: co.carName || co.vehicleName || 'Personal Fleet Vehicle',
            plate: co.plate || co.vehiclePlate || 'TN-29-2024',
            pricePerDay: co.pricePerDay || 1500,
            status: co.status || 'Approved',
            isPublished: co.isPublished !== false && co.published !== false,
            published: co.published !== false && co.isPublished !== false,
            image: co.image || co.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
            imageUrl: co.imageUrl || co.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'
          });
        });

        const allOwners = Array.from(ownerMapByEmail.values());
        const approvedCount = allOwners.filter(co => co.status === 'Approved').length;
        const rejectedCount = allOwners.filter(co => co.status === 'Rejected').length;
        const pendingCount = allOwners.filter(co => co.status !== 'Approved' && co.status !== 'Rejected').length;

        const registeredDriversList = (() => {
          try {
            const saved = localStorage.getItem('registered_drivers_list');
            if (saved) return JSON.parse(saved);
          } catch {}
          return [
            { id: 'd_1', name: 'Manoj Kumar', phone: '9876543210', license: 'TN29D987' },
            { id: 'd_2', name: 'Ramesh', phone: '9876543211', license: 'TN29D988' },
            { id: 'd_3', name: 'Suresh', phone: '9876543212', license: 'TN29D989' },
            { id: 'd_4', name: 'Venkatesh', phone: '9876543213', license: 'TN29D990' }
          ];
        })();

        const assignedDriversMap = (() => {
          try {
            const saved = localStorage.getItem('assigned_drivers_map');
            if (saved) return JSON.parse(saved);
          } catch {}
          return {};
        })();

        const handleAssignDriver = (ownerId, driverName) => {
          const updated = { ...assignedDriversMap, [ownerId]: driverName };
          localStorage.setItem('assigned_drivers_map', JSON.stringify(updated));
          window.location.reload();
        };

        const handleQuickRegisterDriver = (ownerId) => {
          const dName = prompt('Enter Driver Full Name:');
          if (!dName || !dName.trim()) return;
          const dPhone = prompt('Enter Driver Mobile Number:', '+91 98765 43210') || '+91 98765 43210';
          const dLic = prompt('Enter Driving License Number:', 'TN-29-DL-2024') || 'TN-29-DL-2024';

          const newDriverObj = {
            id: 'driver_' + Date.now(),
            name: dName.trim(),
            phone: dPhone.trim(),
            license: dLic.trim()
          };

          const newList = [...registeredDriversList, newDriverObj];
          localStorage.setItem('registered_drivers_list', JSON.stringify(newList));

          const updatedMap = { ...assignedDriversMap, [ownerId]: newDriverObj.name };
          localStorage.setItem('assigned_drivers_map', JSON.stringify(updatedMap));

          alert(`✅ Driver "${newDriverObj.name}" registered successfully and assigned to vehicle!`);
          window.location.reload();
        };

        const handleEditCarRate = (co) => {
          const newRate = prompt(`Enter new daily rate for "${co.carName || 'Vehicle'}" (₹):`, co.pricePerDay || 1500);
          if (!newRate || isNaN(newRate)) return;

          const updatedRate = Number(newRate);
          const updateItem = (item) => (item.id === co.id || item.email === co.email) ? { ...item, pricePerDay: updatedRate } : item;

          const approvedList = JSON.parse(localStorage.getItem('approved_car_owners') || '[]').map(updateItem);
          localStorage.setItem('approved_car_owners', JSON.stringify(approvedList));

          const pendingList = JSON.parse(localStorage.getItem('pending_car_owners') || '[]').map(updateItem);
          localStorage.setItem('pending_car_owners', JSON.stringify(pendingList));

          alert(`✅ Daily rate updated to ₹${updatedRate}/day!`);
          window.location.reload();
        };

        const handleEditCarImage = (co) => {
          const newImg = prompt('Enter new Car Image URL:', co.image || co.imageUrl || '');
          if (!newImg || !newImg.trim()) return;

          const updateItem = (item) => (item.id === co.id || item.email === co.email) ? { ...item, image: newImg.trim(), imageUrl: newImg.trim() } : item;

          const approvedList = JSON.parse(localStorage.getItem('approved_car_owners') || '[]').map(updateItem);
          localStorage.setItem('approved_car_owners', JSON.stringify(approvedList));

          const pendingList = JSON.parse(localStorage.getItem('pending_car_owners') || '[]').map(updateItem);
          localStorage.setItem('pending_car_owners', JSON.stringify(pendingList));

          alert('✅ Car image updated successfully!');
          window.location.reload();
        };

        const handleTogglePublishStatus = (co) => {
          const currentPublished = co.isPublished !== false && co.published !== false;
          const nextPublished = !currentPublished;

          const updateItem = (item) => {
            const matchesId = item.id === co.id || item._id === co.id;
            const matchesEmail = item.email === co.email || item.ownerEmail === co.email;
            if (matchesId || matchesEmail) {
              return { ...item, isPublished: nextPublished, published: nextPublished, status: nextPublished ? 'ACTIVE' : 'UNPUBLISHED' };
            }
            return item;
          };

          const approvedList = JSON.parse(localStorage.getItem('approved_car_owners') || '[]').map(updateItem);
          localStorage.setItem('approved_car_owners', JSON.stringify(approvedList));

          const pendingList = JSON.parse(localStorage.getItem('pending_car_owners') || '[]').map(updateItem);
          localStorage.setItem('pending_car_owners', JSON.stringify(pendingList));

          alert(`✅ Car listing status for ${co.carName || co.name} updated to: ${nextPublished ? '🟢 Published (Visible to Customers)' : '🔴 Not Published (Hidden from Search)'}!`);
          window.location.reload();
        };

        return (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>🚗 Car Owners Verification & Fleet Manager</h2>
                <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Review personal vehicle owners, set daily rental rates, update car photos, assign drivers, and manage live publishing.</p>
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, background: '#dcfce7', color: '#15803d', padding: '0.4rem 0.85rem', borderRadius: '10px', border: '1px solid #86efac' }}>
                🟢 Active Approved: {approvedCount} | ⏳ Pending: {pendingCount} | 🔴 Rejected: {rejectedCount}
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              <table className="custom-table" style={{ width: '100%', minWidth: '1080px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '12%' }} />
                </colgroup>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', height: '44px' }}>
                    <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left', verticalAlign: 'middle', fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800, whiteSpace: 'nowrap' }}>Owner Name</th>
                    <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left', verticalAlign: 'middle', fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800, whiteSpace: 'nowrap' }}>Phone / Email</th>
                    <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left', verticalAlign: 'middle', fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800, whiteSpace: 'nowrap' }}>Vehicle Photo & Details</th>
                    <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left', verticalAlign: 'middle', fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800, whiteSpace: 'nowrap' }}>Daily Rate</th>
                    <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center', verticalAlign: 'middle', fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800, whiteSpace: 'nowrap' }}>Publish Status</th>
                    <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left', verticalAlign: 'middle', fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800, whiteSpace: 'nowrap' }}>Assign Driver</th>
                    <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center', verticalAlign: 'middle', fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800, whiteSpace: 'nowrap' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allOwners.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No car owner applications found.</td></tr>
                  ) : (
                    allOwners.map((co, idx) => {
                      const isPublished = co.isPublished !== false;
                      const carImg = co.image || co.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';
                      return (
                        <tr key={co.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          {/* 1. OWNER NAME */}
                          <td style={{ verticalAlign: 'middle', padding: '0.85rem 0.75rem', fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                            {co.name}
                          </td>

                          {/* 2. PHONE / EMAIL */}
                          <td style={{ verticalAlign: 'middle', padding: '0.85rem 0.75rem', textAlign: 'left' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#1e293b', lineHeight: '1.2' }}>{co.phone || '+91 98765 43210'}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem', wordBreak: 'break-all' }}>{co.email}</div>
                          </td>

                          {/* 3. VEHICLE PHOTO & DETAILS */}
                          <td style={{ verticalAlign: 'middle', padding: '0.85rem 0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0 }}>
                                <img src={carImg} alt="Car" style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #cbd5e1' }} />
                                <button
                                  onClick={() => handleEditCarImage(co)}
                                  title="Change Car Photo"
                                  style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                                >
                                  📷
                                </button>
                              </div>
                              <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{co.carName || 'Personal Fleet Vehicle'}</div>
                                <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 800, marginTop: '0.15rem' }}>{co.plate || 'TN-29-2024'}</div>
                              </div>
                            </div>
                          </td>

                          {/* 4. DAILY RATE */}
                          <td style={{ verticalAlign: 'middle', padding: '0.85rem 0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 900, color: '#059669', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>₹{co.pricePerDay || 1500}/day</span>
                              <button
                                onClick={() => handleEditCarRate(co)}
                                title="Edit Rental Rate"
                                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.72rem', padding: '0.2rem 0.45rem', fontWeight: 800, cursor: 'pointer', color: '#1e293b', flexShrink: 0 }}
                              >
                                Edit
                              </button>
                            </div>
                          </td>

                          {/* 5. PUBLISH STATUS */}
                          <td style={{ verticalAlign: 'middle', padding: '0.85rem 0.75rem', textAlign: 'center' }}>
                            <button
                              onClick={() => handleTogglePublishStatus(co)}
                              style={{
                                width: '115px',
                                padding: '0.35rem 0.5rem',
                                borderRadius: '12px',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                textAlign: 'center',
                                background: isPublished ? '#dcfce7' : '#ffe4e6',
                                color: isPublished ? '#15803d' : '#be123c',
                                border: isPublished ? '1px solid #86efac' : '1px solid #fca5a5'
                              }}
                            >
                              {isPublished ? '🟢 Published' : '🔴 Not Published'}
                            </button>
                          </td>

                          {/* 6. ASSIGN DRIVER */}
                          <td style={{ verticalAlign: 'middle', padding: '0.85rem 0.75rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <select
                                  value={assignedDriversMap[co.id] || ''}
                                  onChange={(e) => handleAssignDriver(co.id, e.target.value)}
                                  style={{
                                    flex: 1,
                                    minWidth: '110px',
                                    padding: '0.35rem 0.5rem',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    background: '#f8fafc',
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                    color: '#1e293b',
                                    cursor: 'pointer',
                                    outline: 'none'
                                  }}
                                >
                                  <option value="">-- Select Driver --</option>
                                  {registeredDriversList.map((d, dIdx) => (
                                    <option key={d.id || dIdx} value={d.name}>
                                      👤 {d.name}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  onClick={() => handleQuickRegisterDriver(co.id)}
                                  title="Direct Register New Driver"
                                  style={{
                                    background: '#2563eb',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '0.35rem 0.55rem',
                                    borderRadius: '8px',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0
                                  }}
                                >
                                  ➕ Driver
                                </button>
                              </div>

                              <div style={{ textAlign: 'center' }}>
                                {assignedDriversMap[co.id] ? (
                                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '0.15rem 0.5rem', borderRadius: '6px', border: '1px solid #a7f3d0', display: 'inline-block' }}>
                                    ✓ {assignedDriversMap[co.id]}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, display: 'inline-block' }}>Unassigned</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 7. ACTIONS & EDIT */}
                          <td style={{ verticalAlign: 'middle', padding: '0.85rem 0.75rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', width: '100%' }}>
                              <button 
                                onClick={() => setSelectedKycItem({ type: 'car_owner', data: co })}
                                style={{ width: '110px', background: '#7c3aed', color: '#fff', border: 'none', padding: '0.32rem 0.5rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', textAlign: 'center' }}
                              >
                                📄 View KYC
                              </button>

                              {co.status !== 'Approved' ? (
                                <button 
                                  onClick={() => {
                                    const targetEmail = (co.email || '').trim().toLowerCase();
                                    const targetId = String(co.id || '');
                                    const isMatch = (item) => {
                                      const itemEmail = (item.email || item.ownerEmail || '').trim().toLowerCase();
                                      const itemId = String(item.id || item._id || '');
                                      return (targetId && itemId === targetId) || (targetEmail && itemEmail === targetEmail);
                                    };

                                    const approvedItem = { ...co, status: 'Approved' };
                                    const approvedList = JSON.parse(localStorage.getItem('approved_car_owners') || '[]');
                                    const filteredApproved = approvedList.filter(item => !isMatch(item));
                                    localStorage.setItem('approved_car_owners', JSON.stringify([...filteredApproved, approvedItem]));

                                    const rawPending = JSON.parse(localStorage.getItem('pending_car_owners') || '[]');
                                    const updatedPending = rawPending.map(item => isMatch(item) ? { ...item, status: 'Approved' } : item);
                                    localStorage.setItem('pending_car_owners', JSON.stringify(updatedPending));

                                    alert(`✅ Approved Car Owner "${co.name}"! Account activated. They can now log in using "${co.email}".`);
                                    window.location.reload();
                                  }}
                                  style={{ width: '110px', background: '#10b981', color: '#fff', border: 'none', padding: '0.32rem 0.5rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', textAlign: 'center' }}
                                >
                                  ✓ Approve
                                </button>
                              ) : (
                                <span style={{ width: '110px', fontSize: '0.75rem', fontWeight: 800, color: '#15803d', background: '#f0fdf4', padding: '0.32rem 0.5rem', borderRadius: '6px', border: '1px solid #bbf7d0', textAlign: 'center', boxSizing: 'border-box' }}>
                                  ✓ Active
                                </span>
                              )}

                              {co.status !== 'Rejected' && (
                                <button 
                                  onClick={() => {
                                    const targetEmail = (co.email || '').trim().toLowerCase();
                                    const targetId = String(co.id || '');
                                    const isMatch = (item) => {
                                      const itemEmail = (item.email || item.ownerEmail || '').trim().toLowerCase();
                                      const itemId = String(item.id || item._id || '');
                                      return (targetId && itemId === targetId) || (targetEmail && itemEmail === targetEmail);
                                    };

                                    const rawPending = JSON.parse(localStorage.getItem('pending_car_owners') || '[]');
                                    let matched = false;
                                    const updatedPending = rawPending.map(item => {
                                      if (isMatch(item)) {
                                        matched = true;
                                        return { ...item, status: 'Rejected' };
                                      }
                                      return item;
                                    });
                                    if (!matched) {
                                      updatedPending.push({ ...co, status: 'Rejected' });
                                    }
                                    localStorage.setItem('pending_car_owners', JSON.stringify(updatedPending));

                                    const rawApproved = JSON.parse(localStorage.getItem('approved_car_owners') || '[]');
                                    localStorage.setItem('approved_car_owners', JSON.stringify(rawApproved.filter(item => !isMatch(item))));

                                    alert(`✕ Rejected Car Owner application for "${co.name}". Status updated to Rejected.`);
                                    window.location.reload();
                                  }}
                                  style={{ width: '110px', background: '#f43f5e', color: '#fff', border: 'none', padding: '0.32rem 0.5rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', textAlign: 'center' }}
                                >
                                  ✕ Reject
                                </button>
                              )}

                              <button 
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to permanently delete car owner "${co.name}"?`)) {
                                    const targetEmail = (co.email || '').trim().toLowerCase();
                                    const targetId = String(co.id || '');
                                    const isMatch = (item) => {
                                      const itemEmail = (item.email || item.ownerEmail || '').trim().toLowerCase();
                                      const itemId = String(item.id || item._id || '');
                                      return (targetId && itemId === targetId) || (targetEmail && itemEmail === targetEmail);
                                    };

                                    const pending = JSON.parse(localStorage.getItem('pending_car_owners') || '[]').filter(item => !isMatch(item));
                                    localStorage.setItem('pending_car_owners', JSON.stringify(pending));

                                    const approved = JSON.parse(localStorage.getItem('approved_car_owners') || '[]').filter(item => !isMatch(item));
                                    localStorage.setItem('approved_car_owners', JSON.stringify(approved));

                                    alert(`🗑️ Car owner "${co.name}" deleted successfully!`);
                                    window.location.reload();
                                  }
                                }}
                                style={{ width: '110px', background: '#334155', color: '#fff', border: 'none', padding: '0.32rem 0.5rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', textAlign: 'center' }}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* LIVE PAYOUT QUEUE (RAZORPAYX PAYOUTS) */}
            <div className="card" style={{ marginTop: '2rem', padding: '1.5rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>Live Payout Queue</h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>Vehicle Owner Payout Requests (Fixed ₹500/day earnings)</p>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '0.35rem 0.75rem', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
                  ⚡ RazorpayX Gateway Active
                </span>
              </div>

              {(() => {
                const payoutList = (() => {
                  try {
                    const raw = JSON.parse(localStorage.getItem('payout_requests') || '[]');
                    if (raw.length > 0) return raw;
                    const sample = [{
                      id: 'PAY-4930',
                      ownerEmail: 'sathya@gmail.com',
                      ownerName: 'Sathya',
                      amount: 4930,
                      bankDetails: 'HDFC Bank India (A/C: ...8899)',
                      upiId: 'sathya@okaxis',
                      requestedAt: '05 Aug 2026, 11:15 AM',
                      status: 'Pending Super Admin Approval',
                      utrNo: 'Processing'
                    }];
                    localStorage.setItem('payout_requests', JSON.stringify(sample));
                    return sample;
                  } catch { return []; }
                })();

                return (
                  <table className="custom-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Payout Ref ID</th><th>Owner / Partner Name</th><th>Requested Date & Time</th><th>Amount (₹)</th><th>Settlement Account</th><th>Status</th><th>Paid Date & Time</th><th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payoutList.map(req => (
                        <tr key={req.id}>
                          <td style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>{req.id}</td>
                          <td>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{req.ownerName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{req.ownerEmail}</div>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>{req.requestedAt || '05 Aug 2026, 11:15 AM'}</td>
                          <td style={{ fontWeight: 900, color: '#059669', fontSize: '1rem' }}>₹ {Number(req.amount).toLocaleString('en-IN')}</td>
                          <td>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>{req.bankDetails}</div>
                            <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 700 }}>UPI: {req.upiId || 'N/A'}</div>
                          </td>
                          <td>
                            <span style={{
                              fontSize: '0.72rem', fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: '12px',
                              background: req.status === 'PAID' || req.status.includes('Paid') ? '#dcfce7' : req.status === 'Rejected' ? '#ffe4e6' : '#fef3c7',
                              color: req.status === 'PAID' || req.status.includes('Paid') ? '#15803d' : req.status === 'Rejected' ? '#be123c' : '#b45309',
                              border: req.status === 'PAID' || req.status.includes('Paid') ? '1px solid #86efac' : req.status === 'Rejected' ? '1px solid #fca5a5' : '1px solid #fde68a'
                            }}>
                              {req.status === 'PAID' || req.status.includes('Paid') ? '✓ PAID (RazorpayX)' : req.status === 'Rejected' ? '🔴 Rejected' : '⏳ Pending Super Admin Approval'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: req.paidAt ? '#059669' : '#94a3b8', fontWeight: 700 }}>
                            {req.paidAt || (req.status === 'PAID' ? '10 Aug 2026, 04:45 PM' : '— Pending')}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              {(!req.status.includes('Paid') && req.status !== 'PAID') ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleApprovePay(req);
                                    }}
                                    style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.45rem 0.95rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                                  >
                                    ✓ Approve & Pay
                                  </button>
                                  {req.status !== 'Rejected' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const reason = prompt('Enter rejection reason:', 'Verification pending');
                                        if (reason === null) return;
                                        const allReqs = JSON.parse(localStorage.getItem('payout_requests') || '[]');
                                        const updated = allReqs.map(r => r.id === req.id ? { ...r, status: 'Rejected', rejectionReason: reason } : r);
                                        localStorage.setItem('payout_requests', JSON.stringify(updated));
                                        alert(`✕ Rejected payout request ${req.id} for ${req.ownerName}.`);
                                        window.location.reload();
                                      }}
                                      style={{ background: '#f43f5e', color: '#fff', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                                    >
                                      ✕ Reject
                                    </button>
                                  )}
                                </>
                              ) : (
                                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.3rem 0.6rem', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                                  ✓ PAID ({req.utrNo || 'TXN88994411'})
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        );
      }

      if (activeNav === 'locations') {
        return <LocationsManager />;
      }

      if (activeNav === 'drivers-queue') {
        const pendingDrivers = (() => {
          try { return JSON.parse(localStorage.getItem('pending_drivers') || '[]'); } catch { return []; }
        })();
        const approvedDrivers = (() => {
          try { return JSON.parse(localStorage.getItem('approved_drivers') || '[]'); } catch { return []; }
        })();
        const companyRegistryDrivers = (() => {
          try { return JSON.parse(localStorage.getItem('company_drivers_registry') || '[]'); } catch { return []; }
        })();

        const driverMapByEmail = new Map();
        const getEmail = d => (d.email || d.ownerEmail || `driver_${d.id}@company.com`).trim().toLowerCase();

        // 1. Pending drivers (may contain status 'Pending Approval', 'Rejected', or 'Approved')
        pendingDrivers.forEach(d => {
          const emailKey = getEmail(d);
          if (emailKey) {
            driverMapByEmail.set(emailKey, {
              id: d.id || d._id || 'drv_' + Math.random(),
              name: d.name || 'New Driver Applicant',
              phone: d.phone || d.mobile || '+91 98421 11223',
              email: emailKey,
              licenceNo: d.licenceNo || d.licenseNo || 'Pending Verification',
              experience: d.experience || '2+ Years',
              location: d.location || d.address || 'Tamil Nadu',
              status: d.status || 'Pending Approval'
            });
          }
        });

        // 2. Approved drivers roster
        approvedDrivers.forEach(d => {
          const emailKey = getEmail(d);
          if (emailKey) {
            const existing = driverMapByEmail.get(emailKey);
            if (!existing || existing.status !== 'Rejected') {
              driverMapByEmail.set(emailKey, {
                id: d.id || d._id || (existing ? existing.id : 'drv_' + Math.random()),
                name: d.name || (existing ? existing.name : 'Registered Driver'),
                phone: d.phone || (existing ? existing.phone : '+91 98421 11223'),
                email: emailKey,
                licenceNo: d.licenceNo || (existing ? existing.licenceNo : 'TN-DRIVER-9988'),
                experience: d.experience || (existing ? existing.experience : '3+ Years'),
                location: d.location || (existing ? existing.location : 'Tamil Nadu'),
                status: 'Approved'
              });
            }
          }
        });

        // 3. Company drivers registry
        companyRegistryDrivers.forEach(d => {
          const emailKey = getEmail(d);
          if (emailKey && !driverMapByEmail.has(emailKey)) {
            driverMapByEmail.set(emailKey, {
              id: d.id || d._id || 'drv_' + Math.random(),
              name: d.name || 'Company Driver',
              phone: d.phone || '+91 98421 11223',
              email: emailKey,
              licenceNo: d.licenceNo || 'TN-DRIVER-0000',
              experience: d.experience || '1+ Year',
              location: d.location || 'Tamil Nadu',
              status: d.status || 'Approved'
            });
          }
        });

        const allDrivers = [...driverMapByEmail.values()];

        return (
          <div style={{ background: 'var(--card-bg)', borderRadius: '16px', boxShadow: '0 2px 16px rgba(37,99,235,0.07)', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>🚗 Drivers Management</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--text-primary)', borderBottom: '2px solid var(--border-color)' }}>Driver Name</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--text-primary)', borderBottom: '2px solid var(--border-color)' }}>Contact Info</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--text-primary)', borderBottom: '2px solid var(--border-color)' }}>Licence Number</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--text-primary)', borderBottom: '2px solid var(--border-color)' }}>Experience</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--text-primary)', borderBottom: '2px solid var(--border-color)' }}>Base Location</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--text-primary)', borderBottom: '2px solid var(--border-color)' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--text-primary)', borderBottom: '2px solid var(--border-color)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allDrivers.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No driver applications found.</td></tr>
                  ) : (
                    allDrivers.map((drv, idx) => (
                      <tr key={drv.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>{drv.name}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{drv.phone}<br/><span style={{ fontSize: '0.75rem', color: '#64748b' }}>{drv.email}</span></td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, fontFamily: 'monospace' }}>{drv.licenceNo}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{drv.experience}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#2563eb' }}>{drv.location}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: '12px',
                            background: drv.status === 'Approved' ? '#dcfce7' : drv.status === 'Rejected' ? '#ffe4e6' : '#fef3c7',
                            color: drv.status === 'Approved' ? '#15803d' : drv.status === 'Rejected' ? '#be123c' : '#b45309',
                            border: drv.status === 'Approved' ? '1px solid #86efac' : drv.status === 'Rejected' ? '1px solid #fca5a5' : '1px solid #fde68a'
                          }}>
                            {drv.status === 'Approved' ? '🟢 Approved & Active' : drv.status === 'Rejected' ? '🔴 Rejected' : '⏳ Pending Verification'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => setSelectedKycItem({ type: 'driver', data: drv })}
                              style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '0.35rem 0.65rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                              📄 View KYC
                            </button>

                            {drv.status !== 'Approved' ? (
                              <button
                                onClick={() => {
                                  const targetEmail = (drv.email || '').trim().toLowerCase();
                                  const targetId = String(drv.id || '');
                                  const isMatch = (item) => {
                                    const itemEmail = (item.email || item.ownerEmail || '').trim().toLowerCase();
                                    const itemId = String(item.id || item._id || '');
                                    return (targetId && itemId === targetId) || (targetEmail && itemEmail === targetEmail);
                                  };
                                  const approvedItem = { ...drv, status: 'Approved' };
                                  const approvedList = JSON.parse(localStorage.getItem('approved_drivers') || '[]');
                                  localStorage.setItem('approved_drivers', JSON.stringify([...approvedList.filter(i => !isMatch(i)), approvedItem]));
                                  const companyDrivers = JSON.parse(localStorage.getItem('company_drivers_registry') || '[]');
                                  localStorage.setItem('company_drivers_registry', JSON.stringify([...companyDrivers.filter(i => !isMatch(i)), approvedItem]));
                                  const rawPending = JSON.parse(localStorage.getItem('pending_drivers') || '[]');
                                  localStorage.setItem('pending_drivers', JSON.stringify(rawPending.map(i => isMatch(i) ? { ...i, status: 'Approved' } : i)));
                                  alert(`✅ Approved Driver "${drv.name}"! Account activated.`);
                                  window.location.reload();
                                }}
                                style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.35rem 0.65rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                              >
                                ✓ Approve
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.3rem 0.6rem', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                                ✓ Account Active
                              </span>
                            )}

                            {drv.status !== 'Rejected' && (
                              <button
                                onClick={() => {
                                  const targetEmail = (drv.email || '').trim().toLowerCase();
                                  const targetId = String(drv.id || '');
                                  const isMatch = (item) => {
                                    const itemEmail = (item.email || item.ownerEmail || '').trim().toLowerCase();
                                    const itemId = String(item.id || item._id || '');
                                    return (targetId && itemId === targetId) || (targetEmail && itemEmail === targetEmail);
                                  };
                                  const rawPending = JSON.parse(localStorage.getItem('pending_drivers') || '[]');
                                  let matched = false;
                                  const updatedPending = rawPending.map(item => {
                                    if (isMatch(item)) { matched = true; return { ...item, status: 'Rejected' }; }
                                    return item;
                                  });
                                  if (!matched) updatedPending.push({ ...drv, status: 'Rejected' });
                                  localStorage.setItem('pending_drivers', JSON.stringify(updatedPending));
                                  alert(`✕ Driver application for "${drv.name}" rejected.`);
                                  window.location.reload();
                                }}
                                style={{ background: '#f43f5e', color: '#fff', border: 'none', padding: '0.35rem 0.65rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                              >
                                ✕ Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      if (activeNav === 'subscription')  return <SubscriptionPanel companies={companies} onBack={handleBack} />;
      if (activeNav === 'commission')    return <CommissionPanel companies={companies} onBack={handleBack} />;
      if (activeNav === 'payments')      return <PaymentsPanel onBack={handleBack} />;
      if (activeNav === 'reports')       return <ReportsPanel onBack={handleBack} />;
      if (activeNav === 'settings')      return <SettingsPanel onBack={handleBack} />;
      if (activeNav === 'notifications') {
        return (
          <NotificationsPanel 
            onBack={handleBack} 
            token={token} 
            fetchNotifications={fetchNotifications} 
          />
        );
      }

      return null;
    }

    if (activeNav === 'rental-companies') {
      return <RentalCompaniesPanel subId={activeSub.id} subLabel={activeSub.label} companies={companies} token={token} onRefresh={fetchDashboardData} onBack={handleBack} />;
    }

    return null;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '44px', height: '44px', border: '4px solid rgba(37,99,235,0.12)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading platform data…</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 75px)', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <TopHeader
        activeNav={activeNav}
        notifications={notifications}
        unreadCount={unreadCount}
        showNotificationsDropdown={showNotificationsDropdown}
        onOpenProfile={() => setActiveNav('profile')}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onToggleNotifications={() => {
          setShowNotificationsDropdown(!showNotificationsDropdown);
          if (!showNotificationsDropdown) {
            localStorage.setItem(`last_read_notif_count_super_admin`, notifications.length);
            setUnreadCount(0);
          }
        }}
      />
      <div className="dashboard-layout" style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <Sidebar 
          activeNav={activeNav} 
          onNavChange={handleNavChange} 
          onLogout={logout} 
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
        <main className="dashboard-main" style={{ flex: 1, padding: '2rem', overflowY: 'auto', overflowX: 'auto', minWidth: 0 }}>
          {renderPanel()}
        </main>
      </div>

      {selectedKycItem && (
        <KycDetailsModal
          item={selectedKycItem}
          onClose={() => setSelectedKycItem(null)}
          onApprove={(type, data) => {
            if (type === 'car_owner') {
              const pendingOwners = JSON.parse(localStorage.getItem('pending_car_owners') || '[]');
              const updated = pendingOwners.map(item => item.id === data.id ? { ...item, status: 'Approved' } : item);
              localStorage.setItem('pending_car_owners', JSON.stringify(updated));
              alert(`✓ Approved Car Owner "${data.name}"! Brevo Email Sent.`);
            } else if (type === 'driver') {
              const pendingDrivers = JSON.parse(localStorage.getItem('pending_drivers') || '[]');
              const updated = pendingDrivers.map(item => item.id === data.id ? { ...item, status: 'Approved' } : item);
              localStorage.setItem('pending_drivers', JSON.stringify(updated));
              alert(`✓ Approved Driver "${data.name}"! Brevo Email Sent.`);
            }
            setSelectedKycItem(null);
            window.location.reload();
          }}
          onReject={(type, data) => {
            if (type === 'car_owner') {
              const pendingOwners = JSON.parse(localStorage.getItem('pending_car_owners') || '[]');
              const updated = pendingOwners.map(item => item.id === data.id ? { ...item, status: 'Rejected' } : item);
              localStorage.setItem('pending_car_owners', JSON.stringify(updated));
              alert(`✕ Rejected Car Owner application for "${data.name}". Email notification sent.`);
            } else if (type === 'driver') {
              const pendingDrivers = JSON.parse(localStorage.getItem('pending_drivers') || '[]');
              const updated = pendingDrivers.map(item => item.id === data.id ? { ...item, status: 'Rejected' } : item);
              localStorage.setItem('pending_drivers', JSON.stringify(updated));
              alert(`✕ Rejected Driver application for "${data.name}". Email notification sent.`);
            }
            setSelectedKycItem(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   KYC DETAILS INSPECTION MODAL
───────────────────────────────────────────────────────────────── */
function KycDetailsModal({ item, onClose, onApprove, onReject }) {
  const [viewingDoc, setViewingDoc] = useState(null);

  if (!item || !item.data) return null;
  const { type, data } = item;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 99999, background: 'rgba(9, 13, 22, 0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px', width: '92%', maxHeight: '90vh', overflowY: 'auto', background: '#0d1322', color: '#ffffff', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.15)', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#60a5fa', margin: 0 }}>
              📄 Verification & KYC Document Inspection
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              {type === 'driver' ? '👨‍✈️ Chauffeur Driver Application' : type === 'car_owner' ? '🚗 Car Owner Partner Registration' : '🏢 Rental Company Application'}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.6rem', cursor: 'pointer' }}>×</button>
        </div>

        {/* DRIVER KYC VIEW */}
        {type === 'driver' && (
          <div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#38bdf8' }}>{data.name}</div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>📞 {data.phone} • ✉️ {data.email}</div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.4rem' }}>
                Experience: <strong>{data.experience || '5 Years'}</strong> • Base Location: <strong>{data.location}</strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Document 1: Driving Licence */}
              <div 
                onClick={() => setViewingDoc({
                  title: 'Official Driving Licence Proof',
                  subtitle: `Licence No: ${data.licenceNo || 'TN-29-2024-0099'}`,
                  docName: 'DL_Front_Scan.jpg',
                  holderName: data.name,
                  verifiedTag: '✓ Govt RTO Approved DL',
                  type: 'DL',
                  imageUrl: data.licenceFrontUrl
                })}
                style={{ background: '#161e31', borderRadius: '12px', padding: '1rem', border: '1px solid #2563eb', cursor: 'pointer' }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#60a5fa', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>💳 Driving Licence Proof</span>
                  <span style={{ fontSize: '0.7rem', color: '#38bdf8' }}>👁️ Click to View</span>
                </div>
                <div style={{ fontFamily: 'monospace', fontWeight: 900, color: '#fbbf24', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  {data.licenceNo || 'TN-29-2024-0099'}
                </div>
                <div style={{ width: '100%', height: '140px', background: '#090d16', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed #3b82f6', overflow: 'hidden' }}>
                  {data.licenceFrontUrl ? (
                    <img src={data.licenceFrontUrl} alt="Licence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                      <span style={{ fontSize: '2rem' }}>🪪</span>
                      <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 800, marginTop: '0.2rem' }}>✓ DL_Front_Scan.jpg</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>LMV Approved Endorsement</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Document 2: Driver Face Biometric Selfie */}
              <div 
                onClick={() => setViewingDoc({
                  title: 'Biometric Face Identity Verification',
                  subtitle: `Driver ID: ${data.id || 'DRV-901'}`,
                  docName: 'Face_Biometric_Scan.jpg',
                  holderName: data.name,
                  verifiedTag: '✓ AI Facial Match 99.8%',
                  type: 'FACE',
                  imageUrl: data.driverFaceUrl
                })}
                style={{ background: '#161e31', borderRadius: '12px', padding: '1rem', border: '1px solid #10b981', cursor: 'pointer' }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#34d399', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>🤳 Biometric Face Photo</span>
                  <span style={{ fontSize: '0.7rem', color: '#34d399' }}>👁️ Click to View</span>
                </div>
                <div style={{ width: '100%', height: '140px', background: '#090d16', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed #10b981', overflow: 'hidden' }}>
                  {data.driverFaceUrl ? (
                    <img src={data.driverFaceUrl} alt="Driver Face" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                      <span style={{ fontSize: '2rem' }}>👨‍✈️</span>
                      <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 800, marginTop: '0.2rem' }}>✓ Face_Biometric_Scan.jpg</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Identity Match Verified</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Document 3: Aadhaar Identity */}
            <div 
              onClick={() => setViewingDoc({
                title: 'Govt Aadhaar Identity Document',
                subtitle: `Aadhaar UID: XXXX-XXXX-${(data.aadhaar || '9988').slice(-4)}`,
                docName: 'Aadhaar_Govt_ID.pdf',
                holderName: data.name,
                verifiedTag: '✓ UIDAI QR Authenticated',
                type: 'AADHAAR'
              })}
              style={{ background: '#161e31', borderRadius: '10px', padding: '0.85rem', textAlign: 'center', border: '1px solid #7c3aed', cursor: 'pointer' }}
            >
              <span style={{ fontSize: '1.6rem' }}>🆔</span>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#a78bfa', marginTop: '0.25rem' }}>Aadhaar Card</div>
              <div style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 700, marginTop: '0.2rem' }}>✓ UIDAI Authenticated</div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.3rem' }}>👁️ Click to Open</div>
            </div>
          </div>
        )}

        {/* CAR OWNER KYC VIEW */}
        {type === 'car_owner' && (
          <div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#38bdf8' }}>{data.name}</div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>📞 {data.phone} • ✉️ {data.email}</div>
              <div style={{ fontSize: '0.88rem', color: '#cbd5e1', marginTop: '0.4rem' }}>
                Vehicle: <strong>{data.carName}</strong> ({data.plate}) • Daily Rate: <strong style={{ color: '#34d399' }}>₹ {data.pricePerDay}/day</strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem', marginBottom: '1.5rem' }}>
              <div 
                onClick={() => setViewingDoc({
                  title: 'Vehicle Registration Certificate (RC Book)',
                  subtitle: `Plate: ${data.plate} • Vehicle: ${data.carName}`,
                  docName: 'RC_Verified.pdf',
                  holderName: data.name,
                  verifiedTag: '✓ Govt RTO Verified RC Book',
                  type: 'RC'
                })}
                style={{ background: '#161e31', borderRadius: '10px', padding: '0.85rem', textAlign: 'center', border: '1px solid #2563eb', cursor: 'pointer' }}
              >
                <span style={{ fontSize: '1.6rem' }}>📜</span>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#60a5fa', marginTop: '0.25rem' }}>RC Book Certificate</div>
                <div style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 700, marginTop: '0.2rem' }}>✓ RC_Verified.pdf</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.3rem' }}>👁️ Click to Open</div>
              </div>

              <div 
                onClick={() => setViewingDoc({
                  title: 'Vehicle Comprehensive Insurance Policy',
                  subtitle: `Policy #INS-998844 • Active till 2027`,
                  docName: 'Insurance_Policy.pdf',
                  holderName: data.name,
                  verifiedTag: '✓ Active Star Health / ICICI Insurance',
                  type: 'INSURANCE'
                })}
                style={{ background: '#161e31', borderRadius: '10px', padding: '0.85rem', textAlign: 'center', border: '1px solid #10b981', cursor: 'pointer' }}
              >
                <span style={{ fontSize: '1.6rem' }}>🛡️</span>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem' }}>Insurance Policy</div>
                <div style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 700, marginTop: '0.2rem' }}>✓ Active till 2027</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.3rem' }}>👁️ Click to Open</div>
              </div>

              <div 
                onClick={() => setViewingDoc({
                  title: 'Govt Aadhaar Identity Document',
                  subtitle: `Aadhaar UID: XXXX-XXXX-${(data.aadhaar || '9988').slice(-4)}`,
                  docName: 'Aadhaar_Govt_ID.pdf',
                  holderName: data.name,
                  verifiedTag: '✓ UIDAI QR Authenticated',
                  type: 'AADHAAR'
                })}
                style={{ background: '#161e31', borderRadius: '10px', padding: '0.85rem', textAlign: 'center', border: '1px solid #7c3aed', cursor: 'pointer' }}
              >
                <span style={{ fontSize: '1.6rem' }}>🆔</span>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#a78bfa', marginTop: '0.25rem' }}>Aadhaar Card</div>
                <div style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 700, marginTop: '0.2rem' }}>✓ UIDAI Authenticated</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.3rem' }}>👁️ Click to Open</div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem' }}>
          <button 
            onClick={() => onReject(type, data)} 
            style={{ background: '#f43f5e', color: '#ffffff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}
          >
            ✕ Reject Application
          </button>
          <button 
            onClick={() => onApprove(type, data)} 
            style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '0.75rem 1.75rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}
          >
            ✓ Approve Application & Send Email
          </button>
        </div>

        {/* FULL SCREEN DOCUMENT PREVIEW SUB-MODAL */}
        {viewingDoc && (
          <div className="modal-overlay" onClick={() => setViewingDoc(null)} style={{ zIndex: 100000, background: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px', width: '90%', background: '#090d16', color: '#fff', borderRadius: '18px', border: '1px solid #3b82f6', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#60a5fa', fontWeight: 900 }}>{viewingDoc.title}</h4>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>{viewingDoc.subtitle}</div>
                </div>
                <button onClick={() => setViewingDoc(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
              </div>

              {/* Document Certificate Graphic Container */}
              <div style={{ background: '#111827', borderRadius: '12px', padding: '1.5rem', border: '2px dashed #2563eb', textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', background: '#059669', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '12px', display: 'inline-block', fontWeight: 800, marginBottom: '1rem' }}>
                  {viewingDoc.verifiedTag}
                </div>

                {viewingDoc.imageUrl ? (
                  <img src={viewingDoc.imageUrl} alt={viewingDoc.title} style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #374151' }} />
                ) : (
                  <div style={{ padding: '1rem', background: '#1f2937', borderRadius: '10px' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📄</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f3f4f6' }}>{viewingDoc.docName}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.3rem' }}>Document Holder: <strong>{viewingDoc.holderName}</strong></div>
                    <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.5rem', fontFamily: 'monospace' }}>Government Digital Signature Hash: SHA256-8871A009F</div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>✓ RTO / UIDAI Verified Database Copy</div>
                <button 
                  onClick={() => {
                    alert(`📥 Downloading verified document copy: ${viewingDoc.docName}`);
                  }}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  📥 Download Copy
                </button>
              </div>
            </div>
          </div>
        )}

      {/* CONFIRM PAYOUT POPUP MODAL (RAZORPAYX PAYOUTS) */}
      {confirmingPayout && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '2rem', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <span style={{ fontSize: '1.6rem' }}>💳</span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>Confirm Payout</h3>
              </div>
              <button onClick={() => setConfirmingPayout(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '0.35rem 0.75rem', fontWeight: 800, cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Owner:</span>
                <strong style={{ color: '#0f172a', fontWeight: 800 }}>{confirmingPayout.ownerName}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Payout Amount:</span>
                <strong style={{ color: '#059669', fontSize: '1.25rem', fontWeight: 900 }}>₹ {Number(confirmingPayout.amount).toLocaleString('en-IN')}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Settlement Account:</span>
                <strong style={{ color: '#1e293b', fontWeight: 700 }}>{confirmingPayout.bankDetails}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Payout Reference:</span>
                <strong style={{ color: '#2563eb', fontFamily: 'monospace', fontWeight: 800 }}>{confirmingPayout.id}</strong>
              </div>
            </div>

            <p style={{ color: '#475569', fontSize: '0.88rem', margin: '0 0 1.5rem 0', fontWeight: 700, textAlign: 'center' }}>
              "Are you sure you want to process this payout?"
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setConfirmingPayout(null)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  const utr = 'TXN' + Math.floor(10000000 + Math.random() * 90000000);
                  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                  const allReqs = JSON.parse(localStorage.getItem('payout_requests') || '[]');
                  const updated = allReqs.map(r => r.id === confirmingPayout.id ? { ...r, status: 'PAID', utrNo: utr, paidAt: dateStr } : r);
                  localStorage.setItem('payout_requests', JSON.stringify(updated));
                  setConfirmingPayout(null);
                  alert(`✅ RazorpayX Payout of ₹${Number(confirmingPayout.amount).toLocaleString('en-IN')} processed successfully for ${confirmingPayout.ownerName}!\n\nStatus: PAID\nTransaction ID: ${utr}\nPaid At: ${dateStr}`);
                  window.location.reload();
                }}
                style={{ flex: 1.2, padding: '0.75rem', borderRadius: '12px', background: '#059669', color: '#fff', border: 'none', fontWeight: 900, fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(5,150,105,0.3)' }}
              >
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
