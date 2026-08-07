import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const faqs = [
  { category: 'Booking', question: 'How do I book a car?', answer: 'Simply search for your location and dates on the home page, browse available cars, and click Book Now to proceed to payment.' },
  { category: 'Booking', question: 'Do I need to pay a deposit?', answer: 'A refundable security deposit of ₹1,000 is required for most vehicles. It is refunded within 24 hours of dropping off the car.' },
  { category: 'Requirements', question: 'What documents are required?', answer: 'You need a valid Driving License, Aadhar Card (or Passport for international users), and a credit/debit card in your name.' },
  { category: 'Requirements', question: 'What is the minimum age to rent?', answer: 'The minimum age to rent a self-drive car is 21 years with at least 1 year of driving experience.' },
  { category: 'Support', question: 'What happens if the car breaks down?', answer: 'We offer 24/7 roadside assistance. Contact our support team via the app, and we will send help or provide a replacement vehicle.' },
  { category: 'Support', question: 'Can I extend my trip?', answer: 'Yes, you can extend your trip from your dashboard, subject to vehicle availability. Additional charges will apply.' }
];

export default function FAQPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const categories = ['All', 'Booking', 'Requirements', 'Support'];

  const filteredFaqs = faqs.filter(faq => 
    (activeCat === 'All' || faq.category === activeCat) &&
    faq.question.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: '#0f172a', padding: '4rem 2rem', textAlign: 'center', color: '#fff', position: 'relative' }}>
        <button onClick={() => navigate('/')} style={{ position: 'absolute', top: '2rem', left: '2rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>← Back</button>
        <h1 style={{ fontSize: '3rem', fontFamily: "'Outfit', sans-serif", fontWeight: 800, marginBottom: '1rem' }}>Frequently Asked Questions</h1>
        
        {/* Search Box */}
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <input 
            type="text" 
            placeholder="Search questions..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: 'none', fontSize: '1rem', outline: 'none' }}
          />
        </div>
      </div>
      
      <div style={{ maxWidth: '900px', margin: '3rem auto', padding: '0 2rem' }}>
        {/* Categories */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '3rem' }}>
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCat(cat)}
              style={{ 
                padding: '0.6rem 1.5rem', borderRadius: '30px', fontWeight: 600, cursor: 'pointer', border: 'none',
                background: activeCat === cat ? '#2563eb' : '#e2e8f0',
                color: activeCat === cat ? '#fff' : '#475569'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredFaqs.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b' }}>No questions found.</p>
          ) : (
            filteredFaqs.map((faq, idx) => (
              <div key={idx} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                <button 
                  onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                  style={{ width: '100%', padding: '1.5rem', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  {faq.question}
                  <span style={{ fontSize: '1.5rem', color: '#2563eb' }}>{expandedIndex === idx ? '-' : '+'}</span>
                </button>
                {expandedIndex === idx && (
                  <div style={{ padding: '0 1.5rem 1.5rem', color: '#475569', lineHeight: 1.6 }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
