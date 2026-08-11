import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ContactPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', phone: '', message: '' });
    }, 3000);
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#0f172a', padding: '4rem 2rem', textAlign: 'center', color: '#fff', position: 'relative' }}>
        <button 
          onClick={() => navigate('/')} 
          style={{ position: 'absolute', top: '2rem', left: '2rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          ← Back to Home
        </button>
        <h1 className="page-header-title" style={{ fontSize: '3rem', fontFamily: "'Outfit', sans-serif", fontWeight: 800, marginBottom: '1rem' }}>
          Get in <span style={{ color: '#2563eb' }}>Touch</span>
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>
          Have a question or need assistance? Our dedicated team is ready to help you 24/7.
        </p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '-3rem auto 4rem', padding: '0 2rem', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          {/* Contact Information & Action Buttons */}
          <div style={{ background: '#fff', borderRadius: '24px', padding: '3rem', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '2rem', fontFamily: "'Outfit', sans-serif" }}>Contact Information</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', background: '#eff6ff', color: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.2rem' }}>🏢</div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem', color: '#0f172a', fontSize: '1rem', fontWeight: 700 }}>Company Address</h4>
                  <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: 1.5 }}>Royal Rent Cars Hub,<br/>Gundalapatti Bypass, Dharmapuri,<br/>Tamil Nadu, India</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', background: '#eff6ff', color: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.2rem' }}>📞</div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem', color: '#0f172a', fontSize: '1rem', fontWeight: 700 }}>Phone Number</h4>
                  <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: 1.5 }}>+91 95173 68420<br/>+91 80000 12345 (Support)</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', background: '#eff6ff', color: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.2rem' }}>✉️</div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem', color: '#0f172a', fontSize: '1rem', fontWeight: 700 }}>Email Address</h4>
                  <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>support@royalrentcars.com<br/>bookings@royalrentcars.com</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', background: '#eff6ff', color: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.2rem' }}>🕒</div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem', color: '#0f172a', fontSize: '1rem', fontWeight: 700 }}>Business Hours</h4>
                  <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>Monday - Sunday: 24/7<br/>(Support Team always available)</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
              <a href="https://wa.me/919517368420" target="_blank" rel="noreferrer" style={{ flex: 1, background: '#25D366', color: '#fff', textDecoration: 'none', padding: '0.85rem', borderRadius: '8px', fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(37,211,102,0.3)', transition: 'all 0.2s' }}>
                <span style={{ fontSize: '1.2rem' }}>💬</span> WhatsApp
              </a>
              <a href="tel:+919517368420" style={{ flex: 1, background: '#2563eb', color: '#fff', textDecoration: 'none', padding: '0.85rem', borderRadius: '8px', fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(37,99,235,0.3)', transition: 'all 0.2s' }}>
                <span style={{ fontSize: '1.2rem' }}>📞</span> Call Now
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div style={{ background: '#fff', borderRadius: '24px', padding: '3rem', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', fontFamily: "'Outfit', sans-serif" }}>Send us a Message</h2>
            
            {submitted ? (
              <div style={{ padding: '2rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', textAlign: 'center', color: '#166534' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem', fontWeight: 700 }}>Message Sent!</h3>
                <p style={{ margin: 0 }}>Thank you for reaching out. Our team will get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Full Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="John Doe" style={{ padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.95rem', outline: 'none' }} />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Email Address</label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" style={{ padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.95rem', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Phone Number</label>
                    <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91 98765 43210" style={{ padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.95rem', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Your Message</label>
                  <textarea required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} placeholder="How can we help you?" rows={5} style={{ padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.95rem', outline: 'none', resize: 'vertical' }} />
                </div>

                <button type="submit" style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '1rem', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem', transition: 'background 0.2s' }}>
                  Send Message
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Google Maps Location */}
        <div style={{ marginTop: '4rem', background: '#fff', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', fontFamily: "'Outfit', sans-serif" }}>Find Us Here</h2>
          <div style={{ width: '100%', height: '400px', borderRadius: '16px', overflow: 'hidden', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Embedded Google Map - using an iframe for demo purpose */}
            <iframe 
              title="Google Maps Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15632.185671197775!2d78.1491741!3d12.1328639!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bac16c0268a7605%3A0xc3b8686e0c60edef!2sDharmapuri%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1715000000000!5m2!1sen!2sin" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}
