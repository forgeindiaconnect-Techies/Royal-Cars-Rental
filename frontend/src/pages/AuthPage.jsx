import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AnimatedAuthBackground from '../components/AnimatedAuthBackground';
import { fileToDataURL } from '../utils/imageUtils';

export default function AuthPage() {
  const { login, register, user, setUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // URL configurations
  const redirect = searchParams.get('redirect');
  const mode = searchParams.get('mode'); // e.g. 'register-business'

  // View tabs: 'login' | 'register-customer' | 'register-company'
  const [activeTab, setActiveTab] = useState('login');
  const [selectedRole, setSelectedRole] = useState('company-admin');

  // Customer / Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Company Self-Registration Wizard States
  const [activeStep, setActiveStep] = useState(1); // 1, 2, 3, or 8 (Success)
  const [compName, setCompName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [compEmail, setCompEmail] = useState('');
  const [compLogo, setCompLogo] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [compPassword, setCompPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Password Visibility Toggle State
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'mobile'
  const [mobileNum, setMobileNum] = useState('');

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: Mail Sent Notification with Link, 3: Password Reset Form
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [showForgotNewPass, setShowForgotNewPass] = useState(false);
  const [showForgotConfirmPass, setShowForgotConfirmPass] = useState(false);

  // Set active tab & check reset password URL params
  useEffect(() => {
    const urlResetToken = searchParams.get('resetToken') || searchParams.get('token');
    const urlEmail = searchParams.get('email');
    if (urlResetToken || urlEmail) {
      setForgotEmail(urlEmail || '');
      setForgotStep(3);
      setShowForgotModal(true);
    } else if (mode === 'register-business') {
      setActiveTab('register-company');
    } else {
      setActiveTab('login');
    }
  }, [mode, searchParams]);

  // Route user if already authenticated
  useEffect(() => {
    if (user) {
      navigateUser(user.role);
    }
  }, [user]);

  const navigateUser = (role) => {
    if (redirect) {
      navigate(`/${redirect}`);
      return;
    }
    switch (role) {
      case 'super-admin':
        navigate('/super-admin');
        break;
      case 'company-admin':
      case 'admin':
        navigate('/company-admin');
        break;
      case 'employee':
      case 'staff':
        navigate('/staff-dashboard');
        break;
      case 'customer':
        navigate('/customer-dashboard');
        break;
      case 'driver':
        navigate('/driver-dashboard');
        break;
      case 'car-owner':
      case 'owner':
        navigate('/car-owner-dashboard');
        break;
      default:
        navigate('/company-admin');
    }
  };

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !password) {
      setErrorMsg('Please enter both email address and password.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await login(cleanEmail, password);
      if (res && res.success && res.user) {
        navigateUser(res.user.role);
        setSubmitting(false);
        return;
      } else {
        setErrorMsg(res?.message || 'Invalid email or password.');
      }
    } catch (err) {
      setErrorMsg('Invalid email or password. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomerRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await register(name, email, password);
      if (res.success) {
        navigateUser(res.user.role);
      } else {
        setErrorMsg(res.message || 'Registration failed.');
      }
    } catch (err) {
      setErrorMsg('Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  // Company self-registration wizard steps validation
  const validateStep1 = () => {
    if (!compName || !ownerName || !mobile || !compEmail) {
      setErrorMsg('Please fill all required (*) fields.');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const validateStep2 = () => {
    if (!address || !city || !state || !pincode) {
      setErrorMsg('Address details are required.');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const handleCompanyRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (compPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (!acceptTerms) {
      setErrorMsg('You must accept the Terms & Conditions.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: compName,
          ownerName,
          ownerEmail: compEmail,
          mobile,
          gstNumber,
          address,
          city,
          state,
          pincode,
          password: compPassword,
          logoUrl: compLogo,
          logo: compLogo,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Save to pending companies local storage
        const newCompanyObj = {
          id: data.companyId || 'cmp_' + Date.now(),
          name: compName,
          ownerName,
          ownerEmail: compEmail,
          mobile,
          gstNumber,
          address,
          city,
          state,
          pincode,
          logo: compLogo || '',
          logoUrl: compLogo || '',
          status: 'pending_approval',
          createdAt: new Date().toISOString()
        };
        const existingPending = JSON.parse(localStorage.getItem('pending_companies') || '[]');
        localStorage.setItem('pending_companies', JSON.stringify([...existingPending, newCompanyObj]));

        // Step 8 Success State
        setActiveStep(8);
      } else {
        setErrorMsg(data.message || 'Error registering company.');
      }
    } catch (err) {
      setErrorMsg('Server connection failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatedAuthBackground>
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: activeTab === 'register-company' && activeStep !== 8 ? '680px' : '460px',
          padding: '2.5rem 2.25rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          background: 'rgba(15, 19, 32, 0.94)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(2, 132, 199, 0.25)',
          color: '#ffffff',
          textAlign: 'center'
        }}
      >
        {/* TOP BACK TO HOME ACTION */}
        <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            type="button" 
            onClick={() => navigate('/')} 
            style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '0.88rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: 0 }}
          >
            ← Back to Home Page
          </button>
        </div>

        {/* WELCOME BACK HEADER */}
        {activeTab === 'login' && (
          <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.4rem 0', fontFamily: 'system-ui, sans-serif' }}>
              Welcome back!
            </h2>
            <p style={{ fontSize: '0.86rem', color: '#94a3b8', margin: 0, fontWeight: 500 }}>
              Sign in to access your account and manage your rentals
            </p>
          </div>
        )}

        {errorMsg && activeStep !== 8 && (
          <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: 600, textAlign: 'left' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* VIEW 1: SIGN IN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ textAlign: 'left' }}>
            
            {/* Email or Mobile Field with Icon */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
                Email or Mobile Number
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.95rem', color: '#64748b', pointerEvents: 'none' }}>
                  ✉️
                </span>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="driver@indidrive.com or +91 98765 43210"
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem 0.85rem 3rem',
                    background: '#161b26',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '14px',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Password Field with Icon & Eye Toggle */}
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.95rem', color: '#64748b', pointerEvents: 'none' }}>
                  🔒
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '0.85rem 3rem 0.85rem 3rem',
                    background: '#161b26',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '14px',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    padding: 0
                  }}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            {/* Forgot Password Right-Aligned Link */}
            <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email || '');
                  setForgotStep(1);
                  setForgotMsg('');
                  setShowForgotModal(true);
                }}
                style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                Forgot Password?
              </button>
            </div>

            {/* Primary Electric Blue Sign In Button */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '0.9rem 1.5rem',
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                gap: '0.5rem',
                boxShadow: '0 8px 20px rgba(2, 132, 199, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              {submitting ? 'Signing in...' : 'Sign in to Dashboard →'}
            </button>

            {/* Footer Registration Link */}
            <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.85rem', color: '#94a3b8' }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setActiveTab('register-customer')}
                style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                Sign up
              </button>
            </div>
          </form>
        )}

        {/* VIEW 2: REGISTER CUSTOMER */}
        {activeTab === 'register-customer' && (
          <form onSubmit={handleCustomerRegisterSubmit}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: '#64748b', pointerEvents: 'none' }}>👤</span>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Rahul Kumar" required style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.85rem', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '14px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: '#64748b', pointerEvents: 'none' }}>✉️</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rahul@gmail.com" required style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.85rem', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '14px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>Password (Min 6 chars)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: '#64748b', pointerEvents: 'none' }}>🔒</span>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} required style={{ width: '100%', padding: '0.85rem 2.85rem 0.85rem 2.85rem', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '14px', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', fontSize: '1rem', cursor: 'pointer' }}>{showPassword ? '👁️' : '🙈'}</button>
              </div>
            </div>
            <button type="submit" style={{ width: '100%', background: 'linear-gradient(90deg, #2563eb, #8b5cf6)', color: '#ffffff', border: 'none', padding: '0.9rem', borderRadius: '14px', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.4)' }} disabled={submitting}>
              {submitting ? 'Creating Account...' : 'Create Renter Account'}
            </button>
          </form>
        )}

        {/* VIEW 3: REGISTER RENTAL BUSINESS (STEP WIZARD) */}
        {activeTab === 'register-company' && (
          <div>
            {activeStep !== 8 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                <span style={{ color: activeStep >= 1 ? 'var(--accent-blue)' : 'inherit' }}>Step 1: Company Profile</span>
                <span style={{ color: activeStep >= 2 ? 'var(--accent-blue)' : 'inherit' }}>Step 2: Address Info</span>
                <span style={{ color: activeStep >= 3 ? 'var(--accent-blue)' : 'inherit' }}>Step 3: Account Security</span>
              </div>
            )}

            {/* STEP 1: Company Information */}
            {activeStep === 1 && (
              <div>
                <div className="form-group">
                  <label className="form-label">Company Name *</label>
                  <input type="text" className="form-control" value={compName} onChange={(e) => setCompName(e.target.value)} placeholder="e.g. India Tour & Rental Fleet" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Owner Name *</label>
                  <input type="text" className="form-control" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="e.g. Rohan Sharma" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Mobile Number *</label>
                    <input type="tel" className="form-control" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="e.g. +91 98765 43210" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input type="email" className="form-control" value={compEmail} onChange={(e) => setCompEmail(e.target.value)} placeholder="e.g. owner@indidrive.com" required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">GST Number (Optional)</label>
                  <input type="text" className="form-control" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="e.g. 07AAAAA1111A1Z1" />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Brand Logo (Upload Image)</label>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {compLogo && (
                      <img 
                        src={compLogo} 
                        alt="Logo Preview" 
                        style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1.5px solid var(--accent-blue)', background: '#fff' }} 
                      />
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="form-control" 
                      style={{ fontSize: '0.8rem' }}
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          try {
                            const dataUrl = await fileToDataURL(file);
                            setCompLogo(dataUrl);
                          } catch (err) {
                            console.error('Error converting logo to data URL:', err);
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={() => validateStep1() && setActiveStep(2)}>
                  Continue to Address →
                </button>
              </div>
            )}

            {/* STEP 2: Address Information */}
            {activeStep === 2 && (
              <div>
                <div className="form-group">
                  <label className="form-label">Company Address *</label>
                  <input type="text" className="form-control" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Plot No, Street, Landmark" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input type="text" className="form-control" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Delhi" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State *</label>
                    <input type="text" className="form-control" value={state} onChange={(e) => setState(e.target.value)} placeholder="Delhi" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pincode *</label>
                    <input type="text" className="form-control" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="110001" required />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveStep(1)}>
                    ← Back
                  </button>
                  <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={() => validateStep2() && setActiveStep(3)}>
                    Continue to Security →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Create Credentials & Security */}
            {activeStep === 3 && (
              <form onSubmit={handleCompanyRegisterSubmit}>
                <div className="form-group">
                  <label className="form-label">Username (Email Registered)</label>
                  <input type="text" className="form-control" value={compEmail} disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input type="password" className="form-control" value={compPassword} onChange={(e) => setCompPassword(e.target.value)} minLength={6} placeholder="Min 6 characters" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <input type="password" className="form-control" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} placeholder="Re-enter password" required />
                </div>
                
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1.5rem 0' }}>
                  <input type="checkbox" id="accept-tc" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                  <label htmlFor="accept-tc" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    I accept the <strong>Terms & Conditions</strong> of RentOS AI
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveStep(2)}>
                    ← Back
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                    {submitting ? 'Registering...' : 'Complete Register'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 8: Success State */}
            {activeStep === 8 && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem', animation: 'fadeIn 0.5s ease-out' }}>🎉</div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: 'var(--accent-emerald)', marginBottom: '0.75rem' }}>
                  Registration Successful
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                  Your company <strong>{compName}</strong> has been registered.
                </p>
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', textAlign: 'left', marginBottom: '2rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <p style={{ marginBottom: '0.5rem' }}>📋 <strong>Next Steps (Step 9 - Admin Approval):</strong></p>
                  <p>• Super Admin checks your Company Details & GST information.</p>
                  <p>• Verification email has been sent to <strong>{compEmail}</strong>.</p>
                  <p>• Once approved, your Company Dashboard will be created.</p>
                </div>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%' }} 
                  onClick={() => {
                    setActiveTab('login');
                    setActiveStep(1);
                    setEmail(compEmail);
                    // Clear fields
                    setCompName('');
                    setOwnerName('');
                    setCompEmail('');
                    setMobile('');
                    setGstNumber('');
                    setAddress('');
                    setCity('');
                    setState('');
                    setPincode('');
                    setCompPassword('');
                    setConfirmPassword('');
                    setAcceptTerms(false);
                  }}
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        )}

      {/* 🔐 FORGOT PASSWORD INTERACTIVE MODAL (3-STEP RESET FLOW) */}
        {showForgotModal && (
          <div className="modal-overlay" onClick={() => setShowForgotModal(false)} style={{ zIndex: 9999, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', width: '92%', background: '#ffffff', padding: '2rem', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{ position: 'absolute', top: '16px', right: '20px', background: 'none', border: 'none', fontSize: '1.6rem', color: '#64748b', cursor: 'pointer', fontWeight: 800 }}
              >
                ×
              </button>

              {/* STEP 1: Ask Registered Email Address (Default Fallback) */}
              {(forgotStep === 1 || (forgotStep !== 2 && forgotStep !== 3)) && (
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.4rem' }}>
                    🔑 Reset Account Password
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.4 }}>
                    Please enter your registered email address. We will send a secure password reset link to your email.
                  </p>

                  {forgotMsg && (
                    <div style={{ padding: '0.65rem 0.85rem', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1rem', fontWeight: 700, border: '1px solid #fecaca' }}>
                      {forgotMsg}
                    </div>
                  )}

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                      Registered Email Address *
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="e.g. vaideeswari@company.com"
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!forgotEmail.trim()) {
                        setForgotMsg('Please enter your registered email address.');
                        return;
                      }
                      setForgotMsg('');
                      try {
                        const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000/api/auth/forgot-password' : '/api/auth/forgot-password';
                        const res = await fetch(apiUrl, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() })
                        });
                        const data = await res.json();
                        setForgotStep(2);
                      } catch (e) {
                        setForgotStep(2);
                      }
                    }}
                    style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: '#fff', border: 'none', fontWeight: 900, fontSize: '0.92rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(2,132,199,0.35)' }}
                  >
                    📧 Send Password Reset Email
                  </button>
                </div>
              )}

              {/* STEP 2: Sent Reset Mail Notification */}
              {forgotStep === 2 && (
                <div style={{ textAlign: 'center', padding: '0.75rem 0' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>📩</div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#059669', marginBottom: '0.6rem' }}>
                    Password Reset Email Sent!
                  </h3>
                  <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                    Password reset email has been sent to:
                    <br />
                    <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0284c7', display: 'inline-block', marginTop: '0.5rem', padding: '0.4rem 1rem', background: '#e0f2fe', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                      📧 {forgotEmail || 'your email address'}
                    </span>
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.75rem', lineHeight: '1.5' }}>
                    Please check your email inbox and click the password reset link inside the email.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotStep(1);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 900,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(2,132,199,0.35)'
                    }}
                  >
                    Close Window
                  </button>
                </div>
              )}

              {/* STEP 3: Enter & Confirm New Password */}
              {forgotStep === 3 && (
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.4rem' }}>
                    🔒 Create New Password
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '1.25rem' }}>
                    Set a new secure password for <strong style={{ color: '#0f172a' }}>{forgotEmail}</strong>.
                  </p>

                  {forgotMsg && (
                    <div style={{ padding: '0.65rem 0.85rem', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1rem', fontWeight: 700, border: '1px solid #fecaca' }}>
                      {forgotMsg}
                    </div>
                  )}

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                      New Password *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showForgotNewPass ? 'text' : 'password'}
                        value={forgotNewPassword}
                        onChange={e => setForgotNewPassword(e.target.value)}
                        placeholder="Enter new password (min 4 chars)"
                        style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPass(!showForgotNewPass)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                      >
                        {showForgotNewPass ? '👁️' : '🙈'}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                      Confirm New Password *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showForgotConfirmPass ? 'text' : 'password'}
                        value={forgotConfirmPassword}
                        onChange={e => setForgotConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotConfirmPass(!showForgotConfirmPass)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                      >
                        {showForgotConfirmPass ? '👁️' : '🙈'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!forgotNewPassword.trim() || forgotNewPassword.length < 4) {
                        setForgotMsg('Password must be at least 4 characters long.');
                        return;
                      }
                      if (forgotNewPassword.trim() !== forgotConfirmPassword.trim()) {
                        setForgotMsg('New Password and Confirm Password do not match!');
                        return;
                      }

                      const cleanEmailStr = forgotEmail.trim().toLowerCase();
                      const cleanNewPass = forgotNewPassword.trim();

                      // 1. Call backend API to save reset password in DB
                      try {
                        const resetApiUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000/api/auth/reset-password' : '/api/auth/reset-password';
                        fetch(resetApiUrl, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: cleanEmailStr, password: cleanNewPass })
                        }).catch(() => {});
                      } catch (e) {}

                      // 2. Save new password into localStorage custom_user_passwords registry
                      const passes = JSON.parse(localStorage.getItem('custom_user_passwords') || '{}');
                      passes[cleanEmailStr] = cleanNewPass;
                      localStorage.setItem('custom_user_passwords', JSON.stringify(passes));

                      // 3. Pre-fill login input with email & new password
                      setEmail(cleanEmailStr);
                      setPassword(cleanNewPass);

                      setShowForgotModal(false);
                      alert(`🎉 Password reset successful! Your password has been updated to "${cleanNewPass}". Click "Sign in to Dashboard" to log in.`);
                    }}
                    style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', fontWeight: 900, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}
                  >
                    ✅ Submit & Save New Password
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </AnimatedAuthBackground>
  );
}
