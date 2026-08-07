import React, { useState, useEffect } from 'react';

const LocationsManager = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    state: '',
    country: '',
    imageUrl: '',
    shortDescription: '',
    featured: false,
    displayOrder: 1,
    carsCount: 0,
    status: 'active'
  });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/locations');
      const data = await res.json();
      if (data.success) {
        setLocations(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch locations', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditClick = (loc) => {
    setFormData({
      name: loc.name,
      state: loc.state,
      country: loc.country,
      imageUrl: loc.imageUrl || '',
      shortDescription: loc.shortDescription || '',
      featured: loc.featured || false,
      displayOrder: loc.displayOrder || 1,
      carsCount: loc.carsCount || 0,
      status: loc.status || 'active'
    });
    setEditId(loc._id);
    setShowAddForm(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editId ? `/api/locations/${editId}` : '/api/locations';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        if (editId) {
          setLocations(prev => prev.map(loc => loc._id === editId ? data.data : loc).sort((a, b) => a.displayOrder - b.displayOrder));
        } else {
          setLocations(prev => [...prev, data.data].sort((a, b) => a.displayOrder - b.displayOrder));
        }
        setShowAddForm(false);
        setEditId(null);
        setFormData({
          name: '', state: '', country: '', imageUrl: '', shortDescription: '', featured: false, displayOrder: 1, status: 'active'
        });
      } else {
        alert(data.message || `Failed to ${editId ? 'update' : 'add'} location`);
      }
    } catch (error) {
      console.error(`Error ${editId ? 'updating' : 'adding'} location:`, error);
      alert(`Error ${editId ? 'updating' : 'adding'} location`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this location?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setLocations(prev => prev.filter(loc => loc._id !== id));
      }
    } catch (error) {
      console.error('Error deleting location:', error);
    }
  };

  const filteredLocations = locations.filter(loc => 
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    loc.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>📍 Popular Locations</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Search 🔍" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
          />
          <button 
            onClick={() => { setEditId(null); setFormData({ name: '', state: '', country: '', imageUrl: '', shortDescription: '', featured: false, displayOrder: 1, carsCount: 0, status: 'active' }); setShowAddForm(true); }}
            style={{ background: 'var(--accent-blue)', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
          >
            + Add Location
          </button>
        </div>
      </div>

      {showAddForm && (
        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>{editId ? '✏️ Edit Location Form' : '➕ Add Location Form'}</h3>
          <form onSubmit={handleAddSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Location Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>State *</label>
              <input type="text" name="state" value={formData.state} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Country *</label>
              <input type="text" name="country" value={formData.country} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Image URL *</label>
              <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} required placeholder="https://..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Short Description</label>
              <input type="text" name="shortDescription" value={formData.shortDescription} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" name="featured" id="featured" checked={formData.featured} onChange={handleInputChange} />
              <label htmlFor="featured" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Featured Location</label>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Active Cars Count</label>
              <input type="number" name="carsCount" value={formData.carsCount} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Display Order</label>
              <input type="number" name="displayOrder" value={formData.displayOrder} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Status</label>
              <select name="status" value={formData.status} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <option value="active">🟢 Active</option>
                <option value="inactive">🔴 Inactive</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" onClick={() => { setShowAddForm(false); setEditId(null); setFormData({ name: '', state: '', country: '', imageUrl: '', shortDescription: '', featured: false, displayOrder: 1, carsCount: 0, status: 'active' }); }} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button type="submit" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--accent-blue)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>{editId ? 'Update Location' : 'Save Location'}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading locations...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '2px solid var(--border-color)' }}>Image</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '2px solid var(--border-color)' }}>Location</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '2px solid var(--border-color)' }}>Active Cars</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '2px solid var(--border-color)' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '2px solid var(--border-color)' }}>Featured</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '2px solid var(--border-color)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocations.map(loc => (
                <tr key={loc._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>
                    <img src={loc.imageUrl || 'https://via.placeholder.com/100x60'} alt={loc.name} style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{loc.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{loc.state}, {loc.country}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--accent-blue)', padding: '0.3rem 0.75rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.8rem' }}>
                      {loc.carsCount} Cars
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {loc.status === 'active' ? (
                      <span style={{ color: '#10b981', fontWeight: 700 }}>🟢 Active</span>
                    ) : (
                      <span style={{ color: '#f43f5e', fontWeight: 700 }}>🔴 Inactive</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {loc.featured ? <span style={{ color: '#eab308', fontWeight: 700 }}>⭐ Featured</span> : '-'}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button onClick={() => handleEditClick(loc)} style={{ background: '#f1f5f9', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: 600, marginRight: '0.5rem', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleDelete(loc._id)} style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))}
              {filteredLocations.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No locations found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LocationsManager;
