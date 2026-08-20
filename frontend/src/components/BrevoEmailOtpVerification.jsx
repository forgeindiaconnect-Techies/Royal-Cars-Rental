import React, { useState, useEffect } from 'react';

export default function BrevoEmailOtpVerification({ role = 'customer', defaultEmail = '', onVerified }) {
  const [email, setEmail] = useState(defaultEmail || '');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (defaultEmail) {
      setEmail(defaultEmail);
    }
  }, [defaultEmail]);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const apiBase = window.location.origin.includes('localhost') ? 'http://localhost:5000' : '';

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    if (!email || !email.trim()) {
      setErrorMessage('Please enter a valid registered email address.');
      return;
    }

    setIsSending(true);
    setMessage('');
    setErrorMessage('');

    try {
      const endpoint = `${apiBase}/api/auth/${role}/send-otp`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setOtpSent(true);
        setCooldown(30);
        setMessage(`📩 6-Digit OTP sent to ${email} via Brevo Email! Valid for 5 minutes.`);
      } else {
        setErrorMessage(data.message || 'Failed to send OTP email.');
      }
    } catch (err) {
      setErrorMessage(`Network error sending OTP: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    if (e) e.preventDefault();
    if (!otpInput || otpInput.trim().length !== 6) {
      setErrorMessage('Please enter the full 6-digit OTP code received in your email.');
      return;
    }

    setIsVerifying(true);
    setMessage('');
    setErrorMessage('');

    try {
      const endpoint = `${apiBase}/api/auth/${role}/verify-otp`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otpInput.trim() })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsVerified(true);
        setMessage(`✅ ${role === 'customer' ? 'Customer' : 'Driver'} OTP verified successfully via Brevo!`);
        if (onVerified) {
          onVerified({ email, role });
        }
      } else {
        setErrorMessage(data.message || 'Invalid or expired OTP code.');
      }
    } catch (err) {
      setErrorMessage(`Network error verifying OTP: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', margin: '1rem 0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.6rem' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#0b996f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem' }}>
          📧
        </div>
        <div>
          <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0f172a' }}>
            {role === 'customer' ? 'Customer' : 'Driver'} Brevo Email OTP Verification
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Secure 6-Digit Verification Code Sent via Brevo Email API
          </div>
        </div>
      </div>

      {isVerified ? (
        <div style={{ background: '#f0fdf4', border: '1.5px solid #16a34a', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', color: '#16a34a', marginBottom: '0.3rem' }}>✓</div>
          <div style={{ fontWeight: 900, color: '#14532d', fontSize: '0.95rem' }}>Email Verified Successfully!</div>
          <div style={{ fontSize: '0.78rem', color: '#166534', marginTop: '2px' }}>
            {email} is verified via Brevo OTP for {role} role.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
              Registered {role === 'customer' ? 'Customer' : 'Driver'} Email Address *
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. vaideeswari8@gmail.com"
                disabled={otpSent}
                style={{ flex: 1, padding: '0.65rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600, background: otpSent ? '#f1f5f9' : '#ffffff' }}
              />
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={isSending || cooldown > 0}
                style={{ padding: '0.65rem 1rem', borderRadius: '10px', background: cooldown > 0 ? '#94a3b8' : 'linear-gradient(135deg, #0b996f, #059669)', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.78rem', cursor: cooldown > 0 ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
              >
                {isSending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : otpSent ? '🔄 Resend OTP' : '📩 Send OTP'}
              </button>
            </div>
          </div>

          {otpSent && (
            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Enter 6-Digit Security OTP Code (Check Brevo Inbox) *
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={e => setOtpInput(e.target.value)}
                  placeholder="e.g. 482913"
                  style={{ flex: 1, padding: '0.65rem', borderRadius: '10px', border: '2px solid #2563eb', fontSize: '1.1rem', fontWeight: 900, letterSpacing: '4px', textAlign: 'center', fontFamily: 'monospace' }}
                />
                <button
                  type="button"
                  onClick={handleVerifyOTP}
                  disabled={isVerifying || otpInput.trim().length !== 6}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', fontWeight: 900, fontSize: '0.82rem', cursor: isVerifying ? 'not-allowed' : 'pointer' }}
                >
                  {isVerifying ? 'Verifying...' : '🔒 Verify OTP'}
                </button>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#e11d48', fontWeight: 700, marginTop: '4px' }}>
                ⏱️ OTP expires in 5 minutes. Check your email inbox & spam folder.
              </div>
            </div>
          )}

          {message && (
            <div style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '0.78rem', fontWeight: 700 }}>
              {message}
            </div>
          )}

          {errorMessage && (
            <div style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.78rem', fontWeight: 700 }}>
              ❌ {errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
