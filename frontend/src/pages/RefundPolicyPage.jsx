import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RefundPolicyPage() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: '#0f172a', padding: '4rem 2rem', textAlign: 'center', color: '#fff', position: 'relative' }}>
        <button onClick={() => navigate('/')} style={{ position: 'absolute', top: '2rem', left: '2rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>← Back</button>
        <h1 style={{ fontSize: '3rem', fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>Refund Policy</h1>
      </div>
      <div style={{ maxWidth: '900px', margin: '3rem auto', padding: '0 2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <section style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>Refund Process</h2>
          <p style={{ color: '#475569', lineHeight: 1.8 }}>Refunds for cancellations or security deposits are initiated automatically to the original source of payment once the trip is completed or cancelled successfully.</p>
        </section>
        
        <section style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>Refund Timeline</h2>
          <ul style={{ color: '#475569', lineHeight: 1.8, paddingLeft: '1.5rem' }}>
            <li><strong>UPI & Wallets:</strong> 2-4 business days.</li>
            <li><strong>Credit/Debit Cards:</strong> 5-7 business days depending on your bank.</li>
            <li><strong>Security Deposit:</strong> Initiated within 24 hours of successful car drop-off.</li>
          </ul>
        </section>
        
        <section style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>Eligible Cases</h2>
          <p style={{ color: '#475569', lineHeight: 1.8 }}>You are eligible for a refund in cases of valid cancellations, excess payments, security deposits (if no damage occurs), or if Royal Rental Cars fails to provide a vehicle at the promised time.</p>
        </section>
      </div>
    </div>
  );
}
