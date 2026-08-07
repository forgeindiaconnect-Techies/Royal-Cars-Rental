import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TermsConditionsPage() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: '#0f172a', padding: '4rem 2rem', textAlign: 'center', color: '#fff', position: 'relative' }}>
        <button onClick={() => navigate('/')} style={{ position: 'absolute', top: '2rem', left: '2rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>← Back</button>
        <h1 style={{ fontSize: '3rem', fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>Terms & Conditions</h1>
      </div>
      <div style={{ maxWidth: '900px', margin: '3rem auto', padding: '0 2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <section style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>Rental Agreement</h2>
          <p style={{ color: '#475569', lineHeight: 1.8 }}>By booking a vehicle through Royal Rental Cars, you agree to the terms outlined in the rental agreement, establishing a contract between the user and the fleet operator.</p>
        </section>
        
        <section style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>User Responsibilities</h2>
          <ul style={{ color: '#475569', lineHeight: 1.8, paddingLeft: '1.5rem' }}>
            <li>You must hold a valid driver's license to rent and drive.</li>
            <li>The renter is responsible for all toll taxes, parking fees, and traffic violations during the trip.</li>
            <li>Identity verification must be completed before pickup.</li>
          </ul>
        </section>
        
        <section style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>Vehicle Usage Rules</h2>
          <p style={{ color: '#475569', lineHeight: 1.8 }}>Vehicles must not be used for racing, towing, illegal activities, or commercial passenger transport. Smoking and pets are strictly prohibited inside the vehicles unless specified.</p>
        </section>

        <section style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>Payment Terms</h2>
          <p style={{ color: '#475569', lineHeight: 1.8 }}>All payments must be made via our secure payment gateway. Cash payments are not accepted at pickup. A refundable security deposit may be required based on the vehicle category.</p>
        </section>
      </div>
    </div>
  );
}
