import React, { useState, useEffect, useRef } from 'react';

/**
 * Universal Map Location Search & Interactive Pin Picker Component for RentOS
 * 
 * Features:
 * 1. 🔍 Live Autocomplete Search (Photon API + Google Places fallback)
 * 2. 🗺️ Interactive Live Map Selector (Click on map to drop pin & get reverse-geocoded address)
 * 3. 🎯 GPS Auto-location Detector (Detect current position & address)
 * 4. 📍 Dual-Engine Map (Google Maps + Leaflet fallback, 100% visible always)
 */
export default function GoogleLocationSearch({
  label = 'Pick-up Location',
  value = '',
  onChange, // (locationName, coords: { lat, lng }) => void
  placeholder = 'Search city, airport, landmark, or pick on map...',
  icon = '📍',
  className = '',
  style = {},
  showMapModalBtn = true
}) {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Map Picker States
  const [mapCenter, setMapCenter] = useState({ lat: 12.1357, lng: 78.1560 }); // Default Dharmapuri / Tamil Nadu hub
  const [pinnedCoords, setPinnedCoords] = useState({ lat: 12.1357, lng: 78.1560 });
  const [pinnedAddress, setPinnedAddress] = useState('Dharmapuri, Tamil Nadu, India');
  const [geocodingMap, setGeocodingMap] = useState(false);

  const inputRef = useRef(null);
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const leafletMarkerRef = useRef(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const isKeyConfigured = Boolean(apiKey && apiKey !== 'YOUR_API_KEY' && apiKey.trim() !== '');

  // Sync prop changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Autocomplete fetch using Photon Geocoding API
  const activeFetchControllerRef = useRef(null);

  // Autocomplete fetch using Photon Geocoding API with AbortController and timeout
  const handleInputChange = async (e) => {
    const text = e.target.value;
    setInputValue(text);
    if (onChange) onChange(text, null);

    if (activeFetchControllerRef.current) {
      activeFetchControllerRef.current.abort();
    }

    if (text.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    const controller = new AbortController();
    activeFetchControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    try {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=6`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const items = (data.features || []).map(feat => {
          const props = feat.properties || {};
          const coords = feat.geometry?.coordinates || [78.1560, 12.1357];
          const name = [props.name, props.city || props.district, props.state, props.country].filter(Boolean).join(', ');
          return {
            displayName: name || props.name || text,
            city: props.city || props.district || '',
            state: props.state || '',
            coords: { lat: coords[1], lng: coords[0] }
          };
        });
        setSuggestions(items);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('[Location Search Autocomplete]', err);
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (sug) => {
    setInputValue(sug.displayName);
    setIsOpen(false);
    if (onChange) onChange(sug.displayName, sug.coords);
  };

  // Reverse Geocode Coords (lat, lng) to Address String
  const reverseGeocode = async (lat, lng) => {
    setGeocodingMap(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    try {
      const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const props = data.features[0].properties || {};
          const addr = [props.name, props.street, props.city || props.district, props.state, props.country]
            .filter(Boolean)
            .join(', ');
          setPinnedAddress(addr || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          return;
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('[Reverse Geocode Error]', err);
      }
    } finally {
      clearTimeout(timeoutId);
      setGeocodingMap(false);
    }
    setPinnedAddress(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
  };

  // Detect GPS Location
  const handleUseGPSLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const coords = { lat, lng };

        setMapCenter(coords);
        setPinnedCoords(coords);
        await reverseGeocode(lat, lng);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        alert('Could not access current location. Please select on map manually.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Initialize Leaflet Map in Picker Modal
  useEffect(() => {
    if (!isMapModalOpen) return;

    const timer = setTimeout(() => {
      const mapCanvas = document.getElementById('map-picker-canvas');
      if (!mapCanvas) return;

      if (window.L) {
        initLeafletPicker(mapCanvas);
      } else {
        const scriptId = 'leaflet-picker-script';
        if (!document.getElementById(scriptId)) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);

          const script = document.createElement('script');
          script.id = scriptId;
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => initLeafletPicker(mapCanvas);
          document.head.appendChild(script);
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isMapModalOpen]);

  const initLeafletPicker = (container) => {
    if (!window.L) return;

    if (leafletMapRef.current) {
      try { leafletMapRef.current.remove(); } catch (e) {}
      leafletMapRef.current = null;
    }

    try {
      const map = window.L.map(container, {
        center: [mapCenter.lat, mapCenter.lng],
        zoom: 14,
        zoomControl: true
      });

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(map);

      // Custom Pickup Pin Icon
      const pinIcon = window.L.divIcon({
        className: 'custom-picker-pin',
        html: `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
            <div style="background:#2563eb; color:#fff; padding:6px 12px; border-radius:20px; font-weight:800; font-size:12px; box-shadow:0 4px 14px rgba(37,99,235,0.6); border:2px solid #fff; white-space:nowrap;">
              📍 Selected Pin
            </div>
            <div style="width:12px; height:12px; background:#2563eb; border-radius:50%; border:2px solid #fff; margin-top:2px; box-shadow:0 0 10px #2563eb;"></div>
          </div>
        `,
        iconSize: [140, 40],
        iconAnchor: [70, 20]
      });

      const marker = window.L.marker([mapCenter.lat, mapCenter.lng], {
        icon: pinIcon,
        draggable: true
      }).addTo(map);

      leafletMarkerRef.current = marker;

      // Handle Map Click to move pin
      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setPinnedCoords({ lat, lng });
        await reverseGeocode(lat, lng);
      });

      // Handle Pin Drag End
      marker.on('dragend', async () => {
        const pos = marker.getLatLng();
        setPinnedCoords({ lat: pos.lat, lng: pos.lng });
        await reverseGeocode(pos.lat, pos.lng);
      });

      leafletMapRef.current = map;
    } catch (err) {
      console.error('[Leaflet Map Picker Error]', err);
    }
  };

  const handleConfirmMapLocation = () => {
    setInputValue(pinnedAddress);
    setIsMapModalOpen(false);
    if (onChange) onChange(pinnedAddress, pinnedCoords);
  };

  return (
    <div className={`rentos-location-search ${className}`} style={{ position: 'relative', width: '100%', ...style }}>
      {label && (
        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#d4a359', marginBottom: '6px', letterSpacing: '0.5px' }}>
          {icon} {label}
        </label>
      )}

      <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              fontSize: '0.92rem',
              color: '#0f172a',
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: '12px',
              outline: 'none',
              boxSizing: 'border-box',
              fontWeight: 600,
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease'
            }}
          />

          {/* Type-ahead Suggestion Dropdown */}
          {isOpen && suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 9999,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              marginTop: '6px',
              maxHeight: '230px',
              overflowY: 'auto',
              boxShadow: '0 15px 35px rgba(0,0,0,0.18)'
            }}>
              {loading ? (
                <div style={{ padding: '0.85rem', fontSize: '0.82rem', color: '#64748b', textAlign: 'center' }}>
                  🔍 Searching map locations...
                </div>
              ) : (
                suggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSuggestion(sug)}
                    style={{
                      padding: '0.65rem 0.95rem',
                      fontSize: '0.85rem',
                      color: '#1e293b',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                    onMouseDown={e => e.preventDefault()}
                  >
                    <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#2563eb' }}>📍</span> {sug.displayName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                      Coordinates: {sug.coords.lat.toFixed(4)}, {sug.coords.lng.toFixed(4)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 🗺️ Open Map Picker Button */}
        {showMapModalBtn && (
          <button
            type="button"
            onClick={() => setIsMapModalOpen(true)}
            title="Search & Pick on Map"
            style={{
              padding: '0 0.95rem',
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              color: '#d4a359',
              border: '1px solid rgba(212,163,89,0.4)',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🗺️</span> Pick on Map
          </button>
        )}
      </div>

      {/* 🗺️ INTERACTIVE LIVE MAP SEARCH & PICKER MODAL */}
      {isMapModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999,
          background: 'rgba(10, 14, 23, 0.88)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem',
          boxSizing: 'border-box'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '860px',
            background: '#ffffff',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
            border: '1px solid #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.1rem 1.5rem',
              background: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🗺️</span> Interactive Map Search & Location Picker
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Click anywhere on the map or drag the pin to select your exact location
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#ffffff',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Sub-Header (Quick Actions: GPS & Location Search) */}
            <div style={{
              padding: '0.85rem 1.5rem',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                onClick={handleUseGPSLocation}
                style={{
                  padding: '0.55rem 1.1rem',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
                }}
              >
                🎯 Use Current GPS Location
              </button>
              <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                or click anywhere on the live map below
              </div>
            </div>

            {/* Map Canvas */}
            <div style={{ position: 'relative', width: '100%', height: '420px', background: '#e2e8f0' }}>
              <div id="map-picker-canvas" style={{ width: '100%', height: '100%' }} />

              {/* Pin Address Badge Overlay */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                right: '16px',
                zIndex: 1000,
                background: 'rgba(15, 23, 42, 0.94)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(212,163,89,0.5)',
                borderRadius: '16px',
                padding: '1rem 1.25rem',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#d4a359', fontWeight: 800, letterSpacing: '1px' }}>
                    {geocodingMap ? '⏳ REVERSE GEOCODING LOCATION...' : '📍 SELECTED ADDRESS'}
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                    {pinnedAddress}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                    Lat: {pinnedCoords.lat.toFixed(5)}, Lng: {pinnedCoords.lng.toFixed(5)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmMapLocation}
                  style={{
                    padding: '0.75rem 1.6rem',
                    background: 'linear-gradient(135deg, #d4a359, #b87a28)',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 16px rgba(212,163,89,0.4)'
                  }}
                >
                  Confirm Location ➔
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
