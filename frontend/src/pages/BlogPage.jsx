import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BlogPage() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const blogCategories = [
    { title: 'Latest News', icon: '📰', count: 12 },
    { title: 'Travel Tips', icon: '✈️', count: 8 },
    { title: 'Car Rental Guides', icon: '🚙', count: 15 },
    { title: 'Driving & Safety Tips', icon: '🛡️', count: 9 },
    { title: 'Company Updates', icon: '🏢', count: 5 },
    { title: 'New Features & Announcements', icon: '✨', count: 7 },
  ];

  const featuredPosts = [
    {
      id: 1,
      category: 'Travel Tips',
      title: 'Top 10 Weekend Getaways from Chennai',
      excerpt: 'Discover the best scenic routes and destinations for your next road trip in a luxury SUV.',
      date: 'Aug 15, 2026',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 2,
      category: 'Car Rental Guides',
      title: 'How to Choose the Right Car for a Family Trip',
      excerpt: 'Sedan vs SUV: What you need to know before booking a car for a family vacation of 5 or more.',
      date: 'Aug 12, 2026',
      readTime: '4 min read',
      image: 'https://images.unsplash.com/photo-1612544448445-b8232cff3b6c?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 3,
      category: 'New Features & Announcements',
      title: 'Introducing AI-Powered Smart Pricing',
      excerpt: 'Our new AI algorithm guarantees the best rental rates by analyzing real-time fleet availability.',
      date: 'Aug 10, 2026',
      readTime: '3 min read',
      image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&q=80&w=800'
    }
  ];

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#0f172a', padding: '4rem 2rem', textAlign: 'center', color: '#fff' }}>
        <button 
          onClick={() => navigate('/')} 
          style={{ position: 'absolute', top: '2rem', left: '2rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          ← Back to Home
        </button>
        <h1 className="page-header-title" style={{ fontSize: '3rem', fontFamily: "'Outfit', sans-serif", fontWeight: 800, marginBottom: '1rem' }}>
          Royal Rent Cars <span style={{ color: '#b48555' }}>Blog</span>
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>
          Insights, tips, and the latest updates from the world of premium car rentals.
        </p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '4rem' }}>
          
          {/* Sidebar Categories */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: '#0f172a' }}>Categories</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {blogCategories.map((cat, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#fff', borderRadius: '8px', cursor: 'pointer', border: '1px solid #e2e8f0', transition: 'all 0.2s hover:border-blue-500 hover:shadow' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, color: '#334155' }}>
                    <span>{cat.icon}</span> {cat.title}
                  </div>
                  <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '12px', color: '#64748b' }}>{cat.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main Feed */}
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '2rem' }}>Latest Posts</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {featuredPosts.map((post) => (
                <div key={post.id} style={{ display: 'flex', background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                  <img src={post.image} alt={post.title} style={{ width: '300px', objectFit: 'cover' }} />
                  <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>{post.category}</span>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>{post.title}</h3>
                    <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '1.5rem', flex: 1 }}>{post.excerpt}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{post.date} • {post.readTime}</span>
                      <button style={{ background: 'transparent', color: '#2563eb', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Read More →</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
