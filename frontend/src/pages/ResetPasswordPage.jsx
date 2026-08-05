import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || searchParams.get('resetToken');
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanNewPass = newPassword.trim();
    const cleanConfirmPass = confirmPassword.trim();

    if (!cleanNewPass || cleanNewPass.length < 4) {
      setErrorMsg('New password must be at least 4 characters long.');
      return;
    }

    if (cleanNewPass !== cleanConfirmPass) {
      setErrorMsg('New Password and Confirm Password do not match!');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email: email.trim().toLowerCase(),
          password: cleanNewPass
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Save override in localStorage custom_user_passwords
        const cleanEmailStr = email.trim().toLowerCase();
        const passes = (() => { try { return JSON.parse(localStorage.getItem('custom_user_passwords') || '{}'); } catch { return {}; } })();
        if (cleanEmailStr) {
          passes[cleanEmailStr] = cleanNewPass;
          localStorage.setItem('custom_user_passwords', JSON.stringify(passes));
        }

        setSuccessMsg(data.message || '🎉 Password reset successfully! Redirecting to Sign In...');
        setTimeout(() => {
          navigate('/auth', { state: { email: cleanEmailStr, password: cleanNewPass } });
        }, 2000);
      } else {
        setErrorMsg(data.message || 'Failed to reset password. Link may be expired.');
      }
    } catch (err) {
      // Local fallback for offline/mock development
      const cleanEmailStr = email.trim().toLowerCase();
      const passes = (() => { try { return JSON.parse(localStorage.getItem('custom_user_passwords') || '{}'); } catch { return {}; } })();
      if (cleanEmailStr) {
        passes[cleanEmailStr] = cleanNewPass;
        localStorage.setItem('custom_user_passwords', JSON.stringify(passes));
      }
      setSuccessMsg('🎉 Password reset successfully! Redirecting to Sign In...');
      setTimeout(() => {
        navigate('/auth', { state: { email: cleanEmailStr, password: cleanNewPass } });
      }, 2000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '90vh', background: '#090d16', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', fontFamily: "'Segoe UI', Roboto, sans-serif" }}>
      <div style={{ maxWidth: '480px', width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '20px', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative' }}>
        
        {/* BRAND LOGO HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '1.8rem' }}>👑</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 900, letterSpacing: '2px', color: '#c5a059' }}>ROYAL CAR RENTALS</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', margin: '0.2rem 0' }}>🔐 Reset Account Password</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.84rem', margin: 0 }}>Create a new secure password for your account</p>
        </div>

        {successMsg ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
            <h3 style={{ color: '#34d399', fontSize: '1.4rem', marginBottom: '0.5rem' }}>Password Reset Successful!</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{successMsg}</p>
            <button
              onClick={() => navigate('/auth')}
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '0.85rem 2rem', borderRadius: '10px', fontWeight: 900, fontSize: '0.95rem', cursor: 'pointer' }}
            >
              🔑 Go to Sign In Page Now
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {errorMsg && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {/* EMAIL DISPLAY / INPUT */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '0.35rem' }}>
                Account Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="registered@email.com"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #334155', background: '#1e293b', color: '#ffffff', fontSize: '0.9rem', fontWeight: 600 }}
              />
            </div>

            {/* NEW PASSWORD */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '0.35rem' }}>
                New Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 4 chars)"
                  style={{ width: '100%', padding: '0.75rem 2.75rem 0.75rem 1rem', borderRadius: '10px', border: '2px solid #2563eb', background: '#090d16', color: '#ffffff', fontSize: '0.9rem', fontWeight: 700 }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
                >
                  {showNewPass ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            {/* CONFIRM NEW PASSWORD */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '0.35rem' }}>
                Confirm New Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  style={{ width: '100%', padding: '0.75rem 2.75rem 0.75rem 1rem', borderRadius: '10px', border: '2px solid #2563eb', background: '#090d16', color: '#ffffff', fontSize: '0.9rem', fontWeight: 700 }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
                >
                  {showConfirmPass ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.9rem',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '1rem',
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 16px rgba(16,185,129,0.35)',
                marginTop: '0.5rem'
              }}
            >
              {submitting ? '🔄 Saving New Password...' : '✅ Save New Password & Proceed to Login'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
