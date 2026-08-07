import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const features = [
  {
    id: 1,
    title: 'AI Recommendations',
    description: 'Smart suggestions based on your budget & travel requirements.',
    icon: '🤖',
  },
  {
    id: 2,
    title: 'Live GPS Tracking',
    description: 'Real-time live location tracking for maximum security & safety.',
    icon: '📍',
  },
  {
    id: 3,
    title: 'Verified Companies',
    description: 'Trusted & verified rental partners ensuring top vehicle quality.',
    icon: '🏢',
  },
  {
    id: 4,
    title: 'Transparent Pricing',
    description: 'No hidden charges. Clear price breakdowns upfront.',
    icon: '💰',
  },
  {
    id: 5,
    title: 'Secure Payments',
    description: '100% secure payment options including UPI & Cards.',
    icon: '🔒',
  },
  {
    id: 6,
    title: '24/7 Support',
    description: 'Our dedicated team is ready to assist you anytime.',
    icon: '📞',
  },
];

export default function FeatureDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const feature = features.find(f => f.id === parseInt(id));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!feature) {
    return (
      <div style={{ padding: '6rem 2rem', textAlign: 'center', minHeight: '60vh' }}>
        <h2>Feature not found</h2>
        <button 
          onClick={() => navigate('/')}
          style={{ marginTop: '2rem', padding: '0.8rem 2rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '6rem 4%', minHeight: '70vh', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ maxWidth: '800px', width: '100%', background: '#fff', padding: '4rem', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>{feature.icon}</div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>{feature.title}</h1>
        <p style={{ fontSize: '1.25rem', color: '#475569', lineHeight: 1.6, marginBottom: '3rem' }}>
          {feature.description}
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/')}
            style={{ padding: '0.8rem 2rem', background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            Back to Home
          </button>
          <button 
            onClick={() => navigate('/cars')}
            style={{ padding: '0.8rem 2rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            Browse Cars
          </button>
        </div>
      </div>
    </div>
  );
}
