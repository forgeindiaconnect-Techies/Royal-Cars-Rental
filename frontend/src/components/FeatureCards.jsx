import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FeatureCards.css';

const features = [
  {
    id: 1,
    title: 'AI Recommendations',
    description: 'Smart suggestions based on your budget & travel requirements.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v4" />
        <line x1="8" y1="16" x2="8" y2="16" />
        <line x1="16" y1="16" x2="16" y2="16" />
      </svg>
    ),
    color: '#7c3aed', // Purple
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    shadow: '0 10px 25px -5px rgba(124, 58, 237, 0.4)',
    iconBgLight: '#f3e8ff',
    iconColorLight: '#7c3aed'
  },
  {
    id: 2,
    title: 'Live GPS Tracking',
    description: 'Real-time live location tracking for maximum security & safety.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    color: '#2563eb', // Blue
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    shadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)',
    iconBgLight: '#dbeafe',
    iconColorLight: '#2563eb'
  },
  {
    id: 3,
    title: 'Verified Companies',
    description: 'Trusted & verified rental partners ensuring top vehicle quality.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01" />
        <path d="M16 6h.01" />
        <path d="M12 6h.01" />
        <path d="M12 10h.01" />
        <path d="M12 14h.01" />
        <path d="M16 10h.01" />
        <path d="M16 14h.01" />
        <path d="M8 10h.01" />
        <path d="M8 14h.01" />
      </svg>
    ),
    color: '#10b981', // Green
    gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
    shadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
    iconBgLight: '#d1fae5',
    iconColorLight: '#10b981'
  },
  {
    id: 4,
    title: 'Transparent Pricing',
    description: 'No hidden charges. Clear price breakdowns upfront.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
    color: '#f59e0b', // Orange
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    shadow: '0 10px 25px -5px rgba(245, 158, 11, 0.4)',
    iconBgLight: '#fef3c7',
    iconColorLight: '#f59e0b'
  },
  {
    id: 5,
    title: 'Secure Payments',
    description: '100% secure payment options including UPI & Cards.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    color: '#ec4899', // Pink
    gradient: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
    shadow: '0 10px 25px -5px rgba(236, 72, 153, 0.4)',
    iconBgLight: '#fce7f3',
    iconColorLight: '#ec4899'
  },
  {
    id: 6,
    title: '24/7 Support',
    description: 'Our dedicated team is ready to assist you anytime.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </svg>
    ),
    color: '#ef4444', // Red
    gradient: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
    shadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)',
    iconBgLight: '#fee2e2',
    iconColorLight: '#ef4444'
  }
];

export default function FeatureCards() {
  const [selectedId, setSelectedId] = useState(1);
  const navigate = useNavigate();

  return (
    <section className="fleet-v2-section feature-cards-section">
      <div className="feature-cards-container">
        <div className="feature-cards-header" style={{ marginBottom: '3.5rem', textAlign: 'center' }}>
          <h2 className="fleet-v2-section-title">Why Choose Royal Rental Cars?</h2>
          <p className="fleet-v2-section-subtitle">We make car rental smarter, safer, and easier.</p>
        </div>

        <div className="feature-cards-grid">
          {features.map((feature) => {
            const isSelected = selectedId === feature.id;

            return (
              <div
                key={feature.id}
                className={`feature-card ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedId(feature.id);
                }}
                style={
                  isSelected
                    ? {
                        background: feature.gradient,
                        boxShadow: feature.shadow,
                      }
                    : {}
                }
              >
                <div className="feature-card-content">
                  <div
                    className="feature-icon-wrapper"
                    style={{
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : feature.iconBgLight,
                      color: isSelected ? '#ffffff' : feature.iconColorLight,
                    }}
                  >
                    {feature.icon}
                  </div>
                  {isSelected && (
                    <div className="feature-selected-check">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                  <h3 style={{ color: isSelected ? '#ffffff' : '#0f172a' }}>{feature.title}</h3>
                  <p style={{ color: isSelected ? 'rgba(255,255,255,0.9)' : '#64748b' }}>
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
