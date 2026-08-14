import React, { useState, useEffect, useRef } from 'react';

/**
 * Reusable Google Places Location Search Input for RentOS
 * 
 * Converts selected location into:
 * 1. Location Name String (city, area, state)
 * 2. Latitude & Longitude Coordinates ({ lat, lng })
 * 
 * Supports Google Places Autocomplete API with fallback geocoding search.
 */
export default function GoogleLocationSearch({
  label = 'Location',
  value = '',
  onChange, // (locationName, coords: { lat, lng }) => void
  placeholder = 'Search city, airport, landmark...',
  icon = '📍',
  className = '',
  style = {}
}) {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const isKeyConfigured = apiKey && apiKey !== 'YOUR_API_KEY' && apiKey.trim() !== '';

  // Sync internal input value when external prop changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Google Places Autocomplete Initialization
  useEffect(() => {
    if (!isKeyConfigured || !inputRef.current) return;

    const initAutocomplete = () => {
      if (!window.google || !window.google.maps || !window.google.maps.places) return;

      try {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['geocode', 'establishment'],
          componentRestrictions: { country: 'in' } // Default India focus
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (place && place.geometry && place.geometry.location) {
            const formattedName = place.formatted_address || place.name || inputValue;
            const coords = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            };

            setInputValue(formattedName);
            setIsOpen(false);
            if (onChange) onChange(formattedName, coords);
          }
        });
      } catch (err) {
        console.warn('[GoogleLocationSearch Autocomplete Notice]', err.message);
      }
    };

    if (window.google && window.google.maps && window.google.maps.places) {
      initAutocomplete();
    } else {
      const timer = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          initAutocomplete();
          clearInterval(timer);
        }
      }, 500);
      return () => clearInterval(timer);
    }
  }, [isKeyConfigured, onChange, inputValue]);

  // Search places via Photon Geocoding API if Google Places is loading or fallback mode
  const handleInputChange = async (e) => {
    const text = e.target.value;
    setInputValue(text);
    if (onChange) onChange(text, null);

    if (text.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    try {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=6&countrycode=in`);
      if (res.ok) {
        const data = await res.json();
        const items = (data.features || []).map(feat => {
          const props = feat.properties || {};
          const coords = feat.geometry?.coordinates || [78.1582, 12.1211];
          const name = [props.name, props.city || props.district, props.state].filter(Boolean).join(', ');
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
      console.warn('[Location Search Fallback]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (sug) => {
    setInputValue(sug.displayName);
    setIsOpen(false);
    if (onChange) onChange(sug.displayName, sug.coords);
  };

  return (
    <div className={`rentos-location-search ${className}`} style={{ position: 'relative', width: '100%', ...style }}>
      {label && (
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
          {icon} {label}
        </label>
      )}
      
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '0.65rem 0.9rem',
            fontSize: '0.9rem',
            color: '#0f172a',
            background: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: '10px',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#2563eb';
            e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#cbd5e1';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Suggestion Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 9999,
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          marginTop: '4px',
          maxHeight: '220px',
          overflowY: 'auto',
          boxShadow: '0 10px 25px rgba(0,0,0,0.12)'
        }}>
          {loading ? (
            <div style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>Searching locations...</div>
          ) : (
            suggestions.map((sug, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectSuggestion(sug)}
                style={{
                  padding: '0.6rem 0.85rem',
                  fontSize: '0.83rem',
                  color: '#1e293b',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f1f5f9',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                onMouseDown={e => e.preventDefault()}
              >
                <div style={{ fontWeight: 600, color: '#0f172a' }}>📍 {sug.displayName}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                  Lat: {sug.coords.lat.toFixed(4)}, Lng: {sug.coords.lng.toFixed(4)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
