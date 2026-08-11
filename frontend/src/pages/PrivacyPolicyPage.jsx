import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: '#0f172a', padding: '4rem 2rem', textAlign: 'center', color: '#fff', position: 'relative' }}>
        <button onClick={() => navigate('/')} style={{ position: 'absolute', top: '2rem', left: '2rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>← Back</button>
        <h1 className="page-header-title" style={{ fontSize: '3rem', fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>Privacy Policy</h1>
      </div>
      <div style={{ maxWidth: '900px', margin: '3rem auto', padding: '0 2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <section style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>Data Collection</h2>
          <p style={{ color: '#475569', lineHeight: 1.8 }}>We collect necessary information such as your name, contact details, driving license, and payment data to process bookings, verify identity, and ensure safety.</p>
        </section>
        
        <section style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>Cookies</h2>
          <p style={{ color: '#475569', lineHeight: 1.8 }}>Our platform uses cookies to enhance your browsing experience, remember your preferences, and track analytics to improve our services.</p>
        </section>
        
        <section style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>Security</h2>
          <p style={{ color: '#475569', lineHeight: 1.8 }}>We employ industry-standard encryption protocols and secure server infrastructures to protect your sensitive data from unauthorized access or breaches.</p>
        </section>

        <section style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>User Privacy</h2>
          <p style={{ color: '#475569', lineHeight: 1.8 }}>We never sell your data to third parties. Your information is only shared with verified fleet operators specifically for the fulfillment of your rental reservation.</p>
        </section>
      </div>
    </div>
  );
}
