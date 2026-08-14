import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleMapComponent from '../components/GoogleMapComponent';

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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'
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
        
        let carOwnerVehicles = [];
        try {
          const approvedList = JSON.parse(localStorage.getItem('approved_car_owners') || '[]');
          carOwnerVehicles = approvedList
            .filter(co => co.published !== false && (co.status === 'ACTIVE' || co.status === 'APPROVED' || co.status === 'Approved'))
            .map((co, idx) => ({
              _id: co.id || co._id || `co_v_${idx}`,
              make: co.make || (co.carName || 'Hyundai').split(' ')[0],
              model: co.model || co.carName || 'Creta SX',
              plate: co.plate || co.vehiclePlate || 'TN-29-2024',
              location: co.location || 'Dharmapuri',
              pricePerDay: co.pricePerDay || 1500,
              imageUrl: co.image || co.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&h=300&fit=crop',
              status: 'available',
              seats: 5,
              fuelType: 'Petrol',
              transmission: 'Manual',
              ownerName: co.name || 'Vehicle Partner'
            }));
        } catch {}

        const availableApi = allCars.filter(v => v.status === 'available' || v.status === 'Active');
        
        // Default fleet if API returns empty
        const defaultFleet = availableApi.length === 0 && carOwnerVehicles.length === 0 ? [
          { _id: 'v_101', make: 'Hyundai', model: 'Creta SX', location: 'Dharmapuri', pricePerDay: 1500, imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&h=300&fit=crop', status: 'available', seats: 5, fuelType: 'Petrol', transmission: 'Manual' },
          { _id: 'v_102', make: 'Honda', model: 'City i-VTEC', location: 'Dharmapuri', pricePerDay: 1800, imageUrl: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=400&h=300&fit=crop', status: 'available', seats: 5, fuelType: 'Petrol', transmission: 'Automatic' },
          { _id: 'v_103', make: 'Mahindra', model: 'Thar LX 4x4', location: 'Dharmapuri', pricePerDay: 2500, imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop', status: 'available', seats: 4, fuelType: 'Diesel', transmission: 'Manual' }
        ] : [];

        setVehicles([...availableApi, ...carOwnerVehicles, ...defaultFleet]);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#1c1917' }}>
            {filteredVehicles.length} Cars Available
          </h2>

          {/* View Mode Toggle (Grid vs Google Map) */}
          <div style={{ display: 'flex', background: '#e7e5e4', padding: '4px', borderRadius: '10px', gap: '4px' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'grid' ? '#ffffff' : 'transparent',
                color: viewMode === 'grid' ? '#1c1917' : '#78716c',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'grid' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              📱 Grid View
            </button>
            <button
              onClick={() => setViewMode('map')}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'map' ? '#ffffff' : 'transparent',
                color: viewMode === 'map' ? '#2563eb' : '#78716c',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'map' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              🗺️ Google Map View
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#78716c', fontSize: '1.2rem' }}>Loading cars...</div>
        ) : filteredVehicles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '16px', border: '1px solid #e7e5e4' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🏎️</span>
            <h3 style={{ fontSize: '1.5rem', color: '#1c1917', marginBottom: '0.5rem' }}>No cars found</h3>
            <p style={{ color: '#78716c' }}>Try adjusting your search criteria.</p>
          </div>
        ) : viewMode === 'map' ? (
          <GoogleMapComponent
            height="560px"
            zoom={12}
            center={{ lat: 12.1211, lng: 78.1582 }}
            cars={filteredVehicles.map((v, i) => ({
              id: v._id || `v_${i}`,
              name: `${v.make || ''} ${v.model || 'Car'}`,
              price: v.pricePerDay || 2499,
              category: v.type || v.category || 'Rental Car',
              fuel: v.fuelType || 'Petrol',
              transmission: v.transmission || 'Automatic',
              image: getValidImageUrl(v.imageUrl, 'vehicle'),
              locationName: v.companyName || v.city || 'Rental Hub',
              lat: 12.1211 + (i % 2 === 0 ? (i + 1) * 0.006 : -(i + 1) * 0.007),
              lng: 78.1582 + (i % 3 === 0 ? (i + 1) * 0.008 : -(i + 1) * 0.006)
            }))}
            onSelectCar={(car) => navigate('/')}
          />
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
