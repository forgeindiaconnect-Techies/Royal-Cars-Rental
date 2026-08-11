import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CancellationPolicyPage() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: '#0f172a', padding: '4rem 2rem', textAlign: 'center', color: '#fff', position: 'relative' }}>
        <button onClick={() => navigate('/')} style={{ position: 'absolute', top: '2rem', left: '2rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>← Back</button>
        <h1 className="page-header-title" style={{ fontSize: '3rem', fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>Cancellation Policy</h1>
      </div>
      <div style={{ maxWidth: '900px', margin: '3rem auto', padding: '0 2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <section style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>Cancellation Rules</h2>
          <p style={{ color: '#475569', lineHeight: 1.8 }}>We understand that plans can change. You can cancel your booking through your dashboard. Cancellations are subject to charges based on when they are made relative to the pickup time.</p>
        </section>
        
        <section style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>Time Limits</h2>
          <ul style={{ color: '#475569', lineHeight: 1.8, paddingLeft: '1.5rem' }}>
            <li>More than 24 hours before pickup: Free Cancellation</li>
            <li>Between 12 and 24 hours before pickup: 20% cancellation fee</li>
            <li>Less than 12 hours before pickup: 50% cancellation fee</li>
            <li>After trip start time (No Show): No refund</li>
          </ul>
        </section>
        
        <section style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>Charges</h2>
          <p style={{ color: '#475569', lineHeight: 1.8 }}>Cancellation charges are calculated based on the base rental fare. The security deposit (if paid) and any additional add-ons are fully refunded in all cancellation scenarios prior to pickup.</p>
        </section>
      </div>
    </div>
  );
}
