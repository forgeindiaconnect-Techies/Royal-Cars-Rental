import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AboutUsPage() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: '#0f172a', padding: '4rem 2rem', textAlign: 'center', color: '#fff', position: 'relative' }}>
        <button onClick={() => navigate('/')} style={{ position: 'absolute', top: '2rem', left: '2rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>← Back</button>
        <h1 className="page-header-title" style={{ fontSize: '3rem', fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>About Us</h1>
      </div>
      <div style={{ maxWidth: '900px', margin: '3rem auto', padding: '0 2rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        <section style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>Company Story</h2>
          <p style={{ color: '#475569', lineHeight: 1.8 }}>Royal Rental Cars began with a simple idea: to make luxury and everyday car rentals seamless, transparent, and driven by technology. What started as a small fleet has grown into a nationwide network of premium vehicles, powered by our advanced AI recommendation engine.</p>
        </section>
        
        <section style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>Mission & Vision</h2>
          <p style={{ color: '#475569', lineHeight: 1.8, marginBottom: '1rem' }}><strong>Our Mission:</strong> To provide the most reliable, secure, and user-friendly car rental experience by leveraging cutting-edge technology and exceptional customer service.</p>
          <p style={{ color: '#475569', lineHeight: 1.8 }}><strong>Our Vision:</strong> To revolutionize the mobility sector by making self-drive and chauffeur-driven cars accessible to everyone, anywhere, anytime.</p>
        </section>
        
        <section style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>Why Choose Us</h2>
          <ul style={{ color: '#475569', lineHeight: 1.8, paddingLeft: '1.5rem' }}>
            <li>AI-powered car recommendations tailored to your trip.</li>
            <li>Real-time GPS tracking for maximum security.</li>
            <li>100% transparent pricing with no hidden charges.</li>
            <li>24/7 dedicated customer support.</li>
          </ul>
        </section>
        
        <section style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>Team</h2>
          <p style={{ color: '#475569', lineHeight: 1.8 }}>Our team consists of passionate technologists, automotive experts, and customer success champions who work around the clock to ensure your journey is smooth and memorable.</p>
        </section>
      </div>
    </div>
  );
}
