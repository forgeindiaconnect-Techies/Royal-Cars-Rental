import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HelpCenterPage() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: '#0f172a', padding: '4rem 2rem', textAlign: 'center', color: '#fff', position: 'relative' }}>
        <button onClick={() => navigate('/')} style={{ position: 'absolute', top: '2rem', left: '2rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>← Back</button>
        <h1 className="page-header-title" style={{ fontSize: '3rem', fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>Help Center</h1>
      </div>
      <div style={{ maxWidth: '900px', margin: '3rem auto', padding: '0 2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <section style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>General Help</h2>
          <p style={{ color: '#475569', lineHeight: 1.8 }}>Find answers to basic questions about account creation, identity verification, and how our platform works.</p>
        </section>
        
        <section style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>Booking Help</h2>
          <p style={{ color: '#475569', lineHeight: 1.8 }}>Need help with an ongoing or upcoming booking? Learn how to extend your trip, change locations, or modify details.</p>
        </section>
        
        <section style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>Rental Guide</h2>
          <p style={{ color: '#475569', lineHeight: 1.8 }}>Everything you need to know before you drive: fuel policies, mileage limits, tolls, and driving safely.</p>
        </section>
        
        <section style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>Support Information</h2>
          <p style={{ color: '#475569', lineHeight: 1.8 }}>Our support team is available 24/7. Use our AI chatbot, call us directly, or send an email through the Contact page.</p>
        </section>
      </div>
    </div>
  );
}
