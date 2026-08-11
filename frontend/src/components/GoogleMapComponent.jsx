import React, { useState, useEffect, useRef } from 'react';

/**
 * Reusable Google Map Component for RentOS Car Rental Platform
 * 
 * Features:
 * - Uses VITE_GOOGLE_MAPS_API_KEY environment variable.
 * - Pickup Location & Drop-off Location markers with geocoded Lat/Lng.
 * - Car location markers with interactive InfoWindow popup cards.
 * - Responsive container (Desktop, Tablet, Mobile).
 * - Graceful fallback notice when API Key is missing or invalid (Zero crash guarantee).
 * - Extensible for live car GPS tracking data from backend.
 */
export default function GoogleMapComponent({
  pickupLocation = '',
  pickupCoords = null, // { lat: number, lng: number }
  dropoffLocation = '',
  dropoffCoords = null, // { lat: number, lng: number }
  cars = [], // [{ id, name, brand, price, category, image, lat, lng, locationName, fuel, transmission }]
  onSelectCar = null,
  height = '460px',
  zoom = 12,
  center = null, // { lat: number, lng: number }
  className = '',
  style = {}
}) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const isKeyConfigured = apiKey && apiKey !== 'YOUR_API_KEY' && apiKey.trim() !== '';

  // Helper to safely parse coordinate objects or arrays
  const parseCoords = (c) => {
    if (!c) return null;
    if (typeof c === 'object') {
      if (Array.isArray(c) && c.length >= 2) {
        const lat = Number(c[0]), lng = Number(c[1]);
        return (!isNaN(lat) && !isNaN(lng)) ? { lat, lng } : null;
      }
      const lat = Number(c.lat ?? c.latitude);
      const lng = Number(c.lng ?? c.longitude);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
    return null;
  };

  // Normalized coordinates
  const pCoords = parseCoords(pickupCoords);
  const dCoords = parseCoords(dropoffCoords);
  const cCoords = parseCoords(center);

  // Fallback / Default Coordinates (Gundalapatti, Dharmapuri, Tamil Nadu, India)
  const defaultCenter = cCoords || pCoords || { lat: 12.1211, lng: 78.1582 };

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [selectedCar, setSelectedCar] = useState(null);

  // Load Google Maps JS API Dynamically
  useEffect(() => {
    if (!isKeyConfigured) return;

    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    const scriptId = 'google-maps-js-sdk';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        setMapLoaded(true);
      };

      script.onerror = () => {
        setLoadError('Failed to load Google Maps SDK. Please verify your API key & domain restrictions.');
      };

      document.head.appendChild(script);
    } else {
      script.addEventListener('load', () => setMapLoaded(true));
    }
  }, [apiKey, isKeyConfigured]);

  // Initialize Map & Render Markers when Google Maps SDK is loaded
  useEffect(() => {
    if (!mapLoaded || !window.google || !mapContainerRef.current) return;

    try {
      const google = window.google;
      const initialCenter = pCoords || cCoords || defaultCenter;

      if (!mapRef.current) {
        mapRef.current = new google.maps.Map(mapContainerRef.current, {
          center: initialCenter,
          zoom: zoom,
          zoomControl: true,
          mapTypeControl: true,
          scaleControl: true,
          streetViewControl: false,
          rotateControl: true,
          fullscreenControl: true,
          styles: [
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'simplified' }] }
          ]
        });

        infoWindowRef.current = new google.maps.InfoWindow();
      } else {
        mapRef.current.setCenter(initialCenter);
      }

      // Clear existing markers
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];

      const bounds = new google.maps.LatLngBounds();
      let hasValidCoords = false;

      // 1. Pickup Location Marker
      if (pCoords) {
        const pickupMarker = new google.maps.Marker({
          position: pCoords,
          map: mapRef.current,
          title: `Pickup: ${pickupLocation || 'Selected Location'}`,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
            scaledSize: new google.maps.Size(42, 42)
          }
        });

        const pickupInfoWindow = new google.maps.InfoWindow({
          content: `<div style="padding: 6px 10px; font-family: sans-serif;">
            <strong style="color: #059669; font-size: 0.9rem;">📍 Pick-up Location</strong>
            <div style="font-size: 0.8rem; color: #334155; margin-top: 4px;">${pickupLocation || 'Pickup Location'}</div>
            <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">Lat: ${pCoords.lat.toFixed(4)}, Lng: ${pCoords.lng.toFixed(4)}</div>
          </div>`
        });

        pickupMarker.addListener('click', () => {
          pickupInfoWindow.open(mapRef.current, pickupMarker);
        });

        markersRef.current.push(pickupMarker);
        bounds.extend(pickupMarker.getPosition());
        hasValidCoords = true;
      }

      // 2. Drop-off Location Marker
      if (dCoords) {
        const dropoffMarker = new google.maps.Marker({
          position: dCoords,
          map: mapRef.current,
          title: `Drop-off: ${dropoffLocation || 'Selected Location'}`,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(42, 42)
          }
        });

        const dropoffInfoWindow = new google.maps.InfoWindow({
          content: `<div style="padding: 6px 10px; font-family: sans-serif;">
            <strong style="color: #dc2626; font-size: 0.9rem;">🏁 Drop-off Location</strong>
            <div style="font-size: 0.8rem; color: #334155; margin-top: 4px;">${dropoffLocation || 'Drop-off Location'}</div>
            <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">Lat: ${dCoords.lat.toFixed(4)}, Lng: ${dCoords.lng.toFixed(4)}</div>
          </div>`
        });

        dropoffMarker.addListener('click', () => {
          dropoffInfoWindow.open(mapRef.current, dropoffMarker);
        });

        markersRef.current.push(dropoffMarker);
        bounds.extend(dropoffMarker.getPosition());
        hasValidCoords = true;
      }

      // 3. Car Location Markers
      const baseLat = initialCenter.lat || 12.1211;
      const baseLng = initialCenter.lng || 78.1582;
      const sampleCars = cars.length > 0 ? cars : [
        { id: 'c1', name: 'Mahindra Thar 4x4', price: 2999, category: 'SUV', fuel: 'Diesel', transmission: 'Manual', lat: baseLat + 0.008, lng: baseLng + 0.006, locationName: 'Gundalapatti Hub' },
        { id: 'c2', name: 'Hyundai Creta SX', price: 2499, category: 'SUV', fuel: 'Petrol', transmission: 'Automatic', lat: baseLat - 0.007, lng: baseLng - 0.008, locationName: 'City Center' },
        { id: 'c3', name: 'Maruti Swift ZXi', price: 1499, category: 'Hatchback', fuel: 'Petrol', transmission: 'Manual', lat: baseLat + 0.005, lng: baseLng - 0.009, locationName: 'Station Square' },
      ];

      sampleCars.forEach(car => {
        const carPos = parseCoords(car) || (car.lat && car.lng ? { lat: Number(car.lat), lng: Number(car.lng) } : null);
        if (!carPos) return;

        const carMarker = new google.maps.Marker({
          position: carPos,
          map: mapRef.current,
          title: car.name,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
            scaledSize: new google.maps.Size(38, 38)
          }
        });

        carMarker.addListener('click', () => {
          setSelectedCar(car);

          const contentString = `
            <div style="max-width: 220px; font-family: 'Helvetica Neue', Arial, sans-serif; padding: 4px;">
              ${car.image ? `<img src="${car.image}" style="width:100%; height:100px; object-fit:cover; border-radius:6px; margin-bottom:6px;" />` : ''}
              <div style="font-weight: 700; font-size: 0.92rem; color: #0f172a; margin-bottom: 2px;">🚗 ${car.name}</div>
              <div style="font-size: 0.78rem; color: #475569; margin-bottom: 4px;">${car.category || 'Rental Car'} • ${car.fuel || 'Petrol'} • ${car.transmission || 'Manual'}</div>
              <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 8px;">📍 ${car.locationName || 'Available near location'}</div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; pt-2; padding-top: 6px;">
                <span style="font-weight: 800; color: #2563eb; font-size: 0.95rem;">₹${car.price}<small style="font-size:0.7rem; color:#64748b;">/day</small></span>
                <button id="btn-select-car-${car.id}" style="background: #2563eb; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; cursor: pointer;">
                  Select Car
                </button>
              </div>
            </div>
          `;

          infoWindowRef.current.setContent(contentString);
          infoWindowRef.current.open(mapRef.current, carMarker);

          setTimeout(() => {
            const btn = document.getElementById(`btn-select-car-${car.id}`);
            if (btn && onSelectCar) {
              btn.onclick = () => onSelectCar(car);
            }
          }, 200);
        });

        markersRef.current.push(carMarker);
        bounds.extend(carMarker.getPosition());
        hasValidCoords = true;
      });

      if (hasValidCoords && markersRef.current.length > 1) {
        mapRef.current.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
      }
    } catch (err) {
      console.error('[GoogleMapComponent Error]', err);
      setLoadError(err.message);
    }
  }, [mapLoaded, pickupCoords, dropoffCoords, cars, center, zoom, pickupLocation, dropoffLocation]);

  return (
    <div 
      className={`rentos-google-map-wrapper ${className}`}
      style={{
        width: '100%',
        height: height,
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0',
        background: '#f8fafc',
        ...style
      }}
    >
      {/* 1. Missing or Placeholder API Key Notice (Graceful Fallback) */}
      {!isKeyConfigured ? (
        <div style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          position: 'relative'
        }}>
          <div style={{
            fontSize: '2.5rem',
            marginBottom: '0.75rem',
            background: 'rgba(255,255,255,0.1)',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            🗺️
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#60a5fa' }}>
            Google Maps Integration Ready
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '420px', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
            Google Maps API Key configuration required. Please add your API key in <code style={{ color: '#fbbf24', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>frontend/.env</code> under <code style={{ color: '#38bdf8' }}>VITE_GOOGLE_MAPS_API_KEY</code>.
          </p>

          {/* Interactive Mock Coordinate Display */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px',
            padding: '0.85rem 1.25rem',
            width: '90%',
            maxWidth: '450px',
            textAlign: 'left'
          }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '6px' }}>
              📍 Location Details & Coordinates
            </div>
            <div style={{ fontSize: '0.82rem', color: '#e2e8f0', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Pick-up: <strong>{pickupLocation || 'Gundalapatti, Dharmapuri'}</strong></span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>{pickupCoords ? `${pickupCoords.lat.toFixed(4)}, ${pickupCoords.lng.toFixed(4)}` : '12.1211, 78.1582'}</span>
            </div>
            {dropoffLocation && (
              <div style={{ fontSize: '0.82rem', color: '#e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <span>Drop-off: <strong>{dropoffLocation}</strong></span>
                <span style={{ color: '#f43f5e', fontWeight: 600 }}>{dropoffCoords ? `${dropoffCoords.lat.toFixed(4)}, ${dropoffCoords.lng.toFixed(4)}` : '12.9716, 77.5946'}</span>
              </div>
            )}
          </div>
        </div>
      ) : loadError ? (
        /* 2. Load Error Fallback */
        <div style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          background: '#fff1f2',
          color: '#be123c'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Google Maps Load Error</h4>
          <p style={{ fontSize: '0.82rem', color: '#9f1239', maxWidth: '400px' }}>{loadError}</p>
        </div>
      ) : (
        /* 3. Live Google Map Canvas */
        <div 
          ref={mapContainerRef} 
          style={{ width: '100%', height: '100%', minHeight: '300px' }} 
        />
      )}

      {/* Selected Car Quick Modal Overlay (Mobile / Tablet Friendly) */}
      {selectedCar && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          right: '12px',
          background: '#ffffff',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10
        }}>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>🚗 {selectedCar.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📍 {selectedCar.locationName || 'Available near your pickup location'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800, color: '#2563eb', fontSize: '1rem' }}>₹{selectedCar.price}<small style="font-size:0.7rem; color:#64748b;">/day</small></span>
            <button 
              onClick={() => {
                if (onSelectCar) onSelectCar(selectedCar);
                setSelectedCar(null);
              }}
              style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Book Car
            </button>
            <button 
              onClick={() => setSelectedCar(null)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.1rem', cursor: 'pointer', padding: '0 4px' }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
