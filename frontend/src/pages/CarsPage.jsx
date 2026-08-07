import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Mock utility functions similar to LandingPage
const getCompanyLogoForVehicle = (v) => {
  if (v.company?.logoUrl) return v.company.logoUrl;
  return 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop';
};

const getValidImageUrl = (url, type) => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&h=300&fit=crop';
  }
  return url;
};

const handleImageError = (e, type) => {
  e.target.src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&h=300&fit=crop';
};

const CarsPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchVehicles = async () => {
      try {
        const res = await fetch('/api/vehicles');
        const data = await res.json();
        let allCars = [];
        if (data?.success && Array.isArray(data.data)) {
          allCars = data.data;
        } else if (Array.isArray(data)) {
          allCars = data;
        }
        
        // Filter only available cars
        const available = allCars.filter(v => v.status === 'available');
        setVehicles(available);
      } catch (err) {
        console.error('Failed to load cars', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  const filteredVehicles = vehicles.filter(v => 
    (v.make + ' ' + v.model).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ background: '#fafafa', minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* Header */}
      <div style={{ background: '#1c1917', padding: '3rem 4%', color: '#fff' }}>
        <button 
          onClick={() => navigate('/')} 
          style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          ← Back to Home
        </button>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Explore Our Fleet</h1>
        <p style={{ color: '#a8a29e', fontSize: '1.1rem' }}>Find the perfect luxury or comfort car for your next journey.</p>
        
        <div style={{ marginTop: '2rem', maxWidth: '600px' }}>
          <input 
            type="text" 
            placeholder="Search by make, model or city... 🔍" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '1rem 1.5rem', borderRadius: '12px', border: 'none', fontSize: '1.05rem', outline: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
          />
        </div>
      </div>

      <div style={{ padding: '3rem 4%' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem', color: '#1c1917' }}>
          {filteredVehicles.length} Cars Available
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#78716c', fontSize: '1.2rem' }}>Loading cars...</div>
        ) : filteredVehicles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '16px', border: '1px solid #e7e5e4' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🏎️</span>
            <h3 style={{ fontSize: '1.5rem', color: '#1c1917', marginBottom: '0.5rem' }}>No cars found</h3>
            <p style={{ color: '#78716c' }}>Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="fleet-v2-car-grid">
            {filteredVehicles.map((v, idx) => (
              <div key={v._id || idx} className="fleet-v2-car-card">
                <div style={{ position: 'relative' }}>
                  <img src={getValidImageUrl(v.imageUrl, 'vehicle')} onError={e => handleImageError(e, 'vehicle')} alt={v.model} className="fleet-v2-car-img" />
                </div>
                <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div className="fleet-v2-car-title">{v.make} {v.model}</div>
                  <div className="fleet-v2-car-specs">
                    <span>💺 {v.seats || 5} Seats</span>
                    <span>⛽ {v.fuelType || 'Petrol'}</span>
                    <span>⚙️ {v.transmission || 'Automatic'}</span>
                  </div>
                  <div style={{ background: '#faf8f5', border: '1px solid #f2eadf', padding: '0.45rem 0.75rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <img
                        src={getCompanyLogoForVehicle(v)}
                        alt="Operator Logo"
                        style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'cover' }}
                      />
                      <span style={{ color: '#1f140b', fontWeight: 700 }}>{v.companyName || v.company?.name || 'Verified Fleet'}</span>
                    </div>
                  </div>
                  <div className="fleet-v2-car-price-row" style={{ marginTop: 'auto' }}>
                    <div>
                      <span className="fleet-v2-price">₹{v.pricePerDay}</span>
                      <span style={{ fontSize: '0.78rem', color: '#6b5a4b' }}> / day</span>
                    </div>
                    <div className="fleet-v2-rating">⭐ 4.8 ({120 + idx * 7})</div>
                  </div>
                  <div style={{ marginTop: '0.85rem' }}>
                    <button 
                      onClick={() => navigate('/')} 
                      className="fleet-v2-btn-solid" 
                      style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CarsPage;
