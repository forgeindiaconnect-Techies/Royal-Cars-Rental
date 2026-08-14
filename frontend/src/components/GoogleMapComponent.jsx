import React, { useState, useEffect, useRef, useId } from 'react';

/**
 * Universal Dual-Engine Map Component for RentOS Car Rental Platform
 * 
 * Features:
 * - 🚗 Custom Visual Car Icons & Badges (No generic dots or standard pin icons).
 * - 🔍 Fixed Zoom Stability (Zoom level stays locked when user zooms in/out).
 * - 🛣️ Live Route Directions & Navigation Polyline (Driver ➔ Pickup Client ➔ Dropoff).
 * - 🌐 Dual-Engine: Google Maps + Leaflet / OpenStreetMap fallback (100% visible always).
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
  showRoute = false, // Whether to draw navigation route direction line
  driverCoords = null, // { lat: number, lng: number }
  customerInfo = null, // { name: string, phone: string, avatar: string }
  className = '',
  style = {}
}) {
  const componentId = useId().replace(/:/g, '_');
  const mapCanvasId = `map-canvas-${componentId}`;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const isKeyConfigured = Boolean(apiKey && apiKey !== 'YOUR_API_KEY' && apiKey.trim() !== '');

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

  const pCoords = parseCoords(pickupCoords);
  const dCoords = parseCoords(dropoffCoords);
  const cCoords = parseCoords(center);
  const drvCoords = parseCoords(driverCoords);

  // Default Coordinates
  const defaultCenter = cCoords || drvCoords || pCoords || { lat: 12.1211, lng: 78.1582 };

  const mapContainerRef = useRef(null);
  const googleMapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const googleMarkersRef = useRef([]);
  const googlePolylineRef = useRef(null);
  const initialFitDoneRef = useRef(false);

  const [useFallback, setUseFallback] = useState(!isKeyConfigured);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);

  // SVG Data URL for realistic Car Marker Icon on Google Maps
  const createCarSvgIcon = (color = '#2563eb') => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 1 12v4c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2" fill="#0f172a" stroke="#fff" stroke-width="1.5"/>
      <circle cx="17" cy="17" r="2" fill="#0f172a" stroke="#fff" stroke-width="1.5"/>
      <path d="M5 9l1.5-3h6.5l2 3"/>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  // Global Google Maps Auth Failure listener
  useEffect(() => {
    window.gm_authFailure = () => {
      console.warn('[GoogleMapComponent] Google Maps Auth Failed. Switching to Leaflet OpenStreetMap engine.');
      setUseFallback(true);
    };
  }, []);

  // Try loading Google Maps SDK if key is configured
  useEffect(() => {
    if (!isKeyConfigured) {
      setUseFallback(true);
      return;
    }

    if (window.google && window.google.maps) {
      setGoogleLoaded(true);
      return;
    }

    const scriptId = 'google-maps-js-sdk';
    let script = document.getElementById(scriptId);

    const fallbackTimer = setTimeout(() => {
      if (!window.google || !window.google.maps) {
        console.warn('[GoogleMapComponent] Google Maps load timeout. Switching to Leaflet engine.');
        setUseFallback(true);
      }
    }, 4000);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        clearTimeout(fallbackTimer);
        setGoogleLoaded(true);
      };

      script.onerror = () => {
        clearTimeout(fallbackTimer);
        console.warn('[GoogleMapComponent] Failed to load Google Maps script. Switching to Leaflet engine.');
        setUseFallback(true);
      };

      document.head.appendChild(script);
    } else {
      script.addEventListener('load', () => {
        clearTimeout(fallbackTimer);
        setGoogleLoaded(true);
      });
    }

    return () => clearTimeout(fallbackTimer);
  }, [apiKey, isKeyConfigured]);

  // ── 1. RENDER GOOGLE MAPS ENGINE ──
  useEffect(() => {
    if (useFallback || !googleLoaded || !window.google || !mapContainerRef.current) return;

    try {
      const google = window.google;
      const initialCenter = cCoords || drvCoords || pCoords || defaultCenter;

      if (!googleMapRef.current) {
        googleMapRef.current = new google.maps.Map(mapContainerRef.current, {
          center: initialCenter,
          zoom: zoom,
          zoomControl: true,
          mapTypeControl: true,
          scaleControl: true,
          streetViewControl: false,
          rotateControl: true,
          fullscreenControl: true
        });
      }

      // Clear existing markers & polyline
      googleMarkersRef.current.forEach(m => m.setMap(null));
      googleMarkersRef.current = [];
      if (googlePolylineRef.current) {
        googlePolylineRef.current.setMap(null);
        googlePolylineRef.current = null;
      }

      const bounds = new google.maps.LatLngBounds();
      let hasValidCoords = false;

      // 🚗 Driver Marker (Vehicle Icon)
      if (drvCoords) {
        const drvMarker = new google.maps.Marker({
          position: drvCoords,
          map: googleMapRef.current,
          title: `Driver / Vehicle Location`,
          icon: {
            url: createCarSvgIcon('#2563eb'),
            scaledSize: new google.maps.Size(46, 46)
          }
        });
        googleMarkersRef.current.push(drvMarker);
        bounds.extend(drvMarker.getPosition());
        hasValidCoords = true;
      }

      // 🟢 Pickup Marker / Customer Pickup Pin
      if (pCoords) {
        const custText = customerInfo?.name ? `Customer Pickup: ${customerInfo.name} (${customerInfo.phone || ''})` : `Pickup: ${pickupLocation || 'Selected Location'}`;
        const pMarker = new google.maps.Marker({
          position: pCoords,
          map: googleMapRef.current,
          title: custText,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
            scaledSize: new google.maps.Size(42, 42)
          }
        });

        const pInfoWindow = new google.maps.InfoWindow({
          content: `<div style="padding:6px; font-family:sans-serif;">
            <strong style="color:#059669; font-size:13px;">📍 Customer Pickup Point</strong><br/>
            <span style="font-size:12px; color:#1e293b;">${customerInfo?.name || pickupLocation || 'Pickup Location'}</span>
            ${customerInfo?.phone ? `<br/><span style="font-size:11px; color:#2563eb;">📞 ${customerInfo.phone}</span>` : ''}
          </div>`
        });
        pMarker.addListener('click', () => pInfoWindow.open(googleMapRef.current, pMarker));

        googleMarkersRef.current.push(pMarker);
        bounds.extend(pMarker.getPosition());
        hasValidCoords = true;
      }

      // 🔴 Dropoff Marker
      if (dCoords) {
        const dMarker = new google.maps.Marker({
          position: dCoords,
          map: googleMapRef.current,
          title: `Drop-off: ${dropoffLocation || 'Selected Location'}`,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(42, 42)
          }
        });
        googleMarkersRef.current.push(dMarker);
        bounds.extend(dMarker.getPosition());
        hasValidCoords = true;
      }

      // 🛣️ Route Direction Path (Polyline)
      const routePoints = [];
      if (drvCoords) routePoints.push(drvCoords);
      if (pCoords) routePoints.push(pCoords);
      if (dCoords) routePoints.push(dCoords);

      if (showRoute && routePoints.length >= 2) {
        googlePolylineRef.current = new google.maps.Polyline({
          path: routePoints,
          geodesic: true,
          strokeColor: '#2563eb',
          strokeOpacity: 0.85,
          strokeWeight: 5,
          map: googleMapRef.current
        });
      }

      // 🏎️ Available Cars (Custom Car SVG Badges)
      const baseLat = initialCenter.lat || 12.1211;
      const baseLng = initialCenter.lng || 78.1582;
      const sampleCars = cars.length > 0 ? cars : [
        { id: 'c1', name: 'Mahindra Thar 4x4', price: 2999, category: 'SUV', fuel: 'Diesel', transmission: 'Manual', lat: baseLat + 0.008, lng: baseLng + 0.006, locationName: 'Gundalapatti Hub' },
        { id: 'c2', name: 'Hyundai Creta SX', price: 2499, category: 'SUV', fuel: 'Petrol', transmission: 'Automatic', lat: baseLat - 0.007, lng: baseLng - 0.008, locationName: 'City Center' },
        { id: 'c3', name: 'Maruti Swift ZXi', price: 1499, category: 'Hatchback', fuel: 'Petrol', transmission: 'Manual', lat: baseLat + 0.005, lng: baseLng - 0.009, locationName: 'Station Square' },
      ];

      sampleCars.forEach((car, idx) => {
        const carPos = parseCoords(car) || (car.lat && car.lng ? { lat: Number(car.lat), lng: Number(car.lng) } : null);
        if (!carPos) return;

        const carColor = idx % 2 === 0 ? '#10b981' : '#f59e0b';
        const cMarker = new google.maps.Marker({
          position: carPos,
          map: googleMapRef.current,
          title: `🚗 ${car.name}`,
          icon: {
            url: createCarSvgIcon(carColor),
            scaledSize: new google.maps.Size(42, 42)
          }
        });

        cMarker.addListener('click', () => setSelectedCar(car));
        googleMarkersRef.current.push(cMarker);
        bounds.extend(cMarker.getPosition());
        hasValidCoords = true;
      });

      // Fit bounds ONLY ONCE on initial render to prevent zoom snapping when zooming in
      if (!initialFitDoneRef.current && hasValidCoords && googleMarkersRef.current.length > 1) {
        googleMapRef.current.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
        initialFitDoneRef.current = true;
      }
    } catch (err) {
      console.warn('[GoogleMapComponent] Google Maps render error. Falling back to Leaflet:', err);
      setUseFallback(true);
    }
  }, [useFallback, googleLoaded, pickupCoords, dropoffCoords, driverCoords, cars, center, zoom, showRoute]);

  // ── 2. RENDER LEAFLET / OPENSTREETMAP ENGINE ──
  useEffect(() => {
    if (!useFallback) return;

    const initLeafletMap = () => {
      const container = document.getElementById(mapCanvasId);
      if (!container || !window.L) return;

      const initialCenter = cCoords || drvCoords || pCoords || defaultCenter;
      const centerArr = [initialCenter.lat, initialCenter.lng];

      if (container._leaflet_id) {
        container._leaflet_id = null;
        container.innerHTML = '';
      }

      if (leafletMapRef.current) {
        try { leafletMapRef.current.remove(); } catch (e) {}
        leafletMapRef.current = null;
      }

      try {
        const map = window.L.map(mapCanvasId, {
          center: centerArr,
          zoom: zoom,
          zoomControl: true,
          scrollWheelZoom: true
        });

        // OpenStreetMap Tile Layer
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        const markersGroup = window.L.featureGroup();

        // 🚗 Driver / Vehicle Location Marker (Realistic Car Badge)
        if (drvCoords) {
          const drvIcon = window.L.divIcon({
            className: 'custom-leaflet-driver-car-pin',
            html: `
              <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
                <div style="background:#2563eb; color:#fff; padding:5px 12px; border-radius:20px; font-weight:800; font-size:11px; box-shadow:0 4px 14px rgba(37,99,235,0.5); white-space:nowrap; border:2px solid #fff; display:flex; align-items:center; gap:4px;">
                  <span>🚗</span> Driver Live Vehicle
                </div>
                <div style="width:12px; height:12px; background:#2563eb; border-radius:50%; border:2px solid #fff; margin-top:2px; box-shadow:0 0 10px #2563eb;"></div>
              </div>
            `,
            iconSize: [160, 42],
            iconAnchor: [80, 21]
          });
          const drvMarker = window.L.marker([drvCoords.lat, drvCoords.lng], { icon: drvIcon }).bindPopup(`
            <div style="font-family:sans-serif; padding:4px;">
              <strong style="color:#2563eb;">🚗 Live Driver Location</strong><br/>
              <span style="font-size:12px; color:#475569;">Latitude: ${drvCoords.lat.toFixed(4)}, Longitude: ${drvCoords.lng.toFixed(4)}</span>
            </div>
          `);
          markersGroup.addLayer(drvMarker);
        }

        // 🟢 Pickup / Customer Location Marker (With Customer Contact info)
        if (pCoords) {
          const pIcon = window.L.divIcon({
            className: 'custom-leaflet-pickup-pin',
            html: `
              <div style="background:#10b981; color:#fff; padding:6px 12px; border-radius:20px; font-weight:800; font-size:11px; box-shadow:0 4px 14px rgba(16,185,129,0.5); white-space:nowrap; border:2px solid #fff; display:flex; align-items:center; gap:4px;">
                <span>👤</span> ${customerInfo?.name ? `Client: ${customerInfo.name}` : (pickupLocation || 'Pick-up Point')}
              </div>
            `,
            iconSize: [160, 36],
            iconAnchor: [80, 18]
          });
          const pMarker = window.L.marker([pCoords.lat, pCoords.lng], { icon: pIcon }).bindPopup(`
            <div style="font-family:sans-serif; padding:6px;">
              <strong style="color:#059669; font-size:13px;">📍 Customer Pickup Point</strong><br/>
              <span style="font-size:12px; color:#1e293b; font-weight:700;">${customerInfo?.name || pickupLocation || 'Pickup Location'}</span>
              ${customerInfo?.phone ? `<br/><span style="font-size:11px; color:#2563eb; font-weight:700;">📞 ${customerInfo.phone}</span>` : ''}
            </div>
          `);
          markersGroup.addLayer(pMarker);
        }

        // 🔴 Drop-off Location Marker
        if (dCoords) {
          const dIcon = window.L.divIcon({
            className: 'custom-leaflet-dropoff-pin',
            html: `
              <div style="background:#ef4444; color:#fff; padding:6px 12px; border-radius:20px; font-weight:800; font-size:11px; box-shadow:0 4px 14px rgba(239,68,68,0.5); white-space:nowrap; border:2px solid #fff; display:flex; align-items:center; gap:4px;">
                <span>🏁</span> ${dropoffLocation || 'Drop-off Destination'}
              </div>
            `,
            iconSize: [160, 36],
            iconAnchor: [80, 18]
          });
          const dMarker = window.L.marker([dCoords.lat, dCoords.lng], { icon: dIcon }).bindPopup(`
            <div style="font-family:sans-serif; padding:4px;">
              <strong style="color:#dc2626;">🔴 Drop-off Destination</strong><br/>
              <span style="font-size:12px; color:#475569;">${dropoffLocation || 'Selected Destination'}</span>
            </div>
          `);
          markersGroup.addLayer(dMarker);
        }

        // 🛣️ Live Route Direction Polyline (Driver ➔ Pickup Client ➔ Dropoff)
        const leafletRouteCoords = [];
        if (drvCoords) leafletRouteCoords.push([drvCoords.lat, drvCoords.lng]);
        if (pCoords) leafletRouteCoords.push([pCoords.lat, pCoords.lng]);
        if (dCoords) leafletRouteCoords.push([dCoords.lat, dCoords.lng]);

        if (showRoute && leafletRouteCoords.length >= 2) {
          const routeLine = window.L.polyline(leafletRouteCoords, {
            color: '#2563eb',
            weight: 5,
            opacity: 0.85,
            dashArray: '8, 8'
          }).addTo(map);
          markersGroup.addLayer(routeLine);
        }

        // 🏎️ Available Cars (Visual 3D Car Badges)
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

          const carIcon = window.L.divIcon({
            className: 'custom-leaflet-car-pin',
            html: `
              <div style="background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color:#fff; border:2px solid #38bdf8; padding:5px 12px; border-radius:20px; font-weight:800; font-size:11px; box-shadow:0 6px 18px rgba(0,0,0,0.3); display:flex; align-items:center; gap:6px; white-space:nowrap; cursor:pointer;">
                <span>🚗</span>
                <span style="color:#e2e8f0;">${car.name}</span>
                <span style="background:#2563eb; color:#fff; padding:1px 6px; border-radius:10px; font-size:10px;">₹${car.price}</span>
              </div>
            `,
            iconSize: [170, 36],
            iconAnchor: [85, 18]
          });

          const carMarker = window.L.marker([carPos.lat, carPos.lng], { icon: carIcon });
          carMarker.on('click', () => setSelectedCar(car));
          markersGroup.addLayer(carMarker);
        });

        markersGroup.addTo(map);

        // Fit bounds ONCE initially without overriding future manual user zooming
        if (!initialFitDoneRef.current && markersGroup.getLayers().length > 1) {
          map.fitBounds(markersGroup.getBounds(), { padding: [40, 40] });
          initialFitDoneRef.current = true;
        }

        leafletMapRef.current = map;
      } catch (err) {
        console.error('[Leaflet Fallback Error]', err);
      }
    };

    if (window.L) {
      initLeafletMap();
    } else {
      const scriptId = 'leaflet-fallback-script';
      let script = document.getElementById(scriptId);
      if (!script) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => initLeafletMap();
        document.head.appendChild(script);
      } else {
        script.addEventListener('load', () => initLeafletMap());
      }
    }
  }, [useFallback, pickupCoords, dropoffCoords, driverCoords, cars, center, zoom, showRoute, mapCanvasId]);

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
        border: '1px solid #cbd5e1',
        background: '#0f172a',
        ...style
      }}
    >
      {/* MAP CANVAS CONTAINER */}
      {!useFallback ? (
        <div 
          ref={mapContainerRef} 
          style={{ width: '100%', height: '100%', minHeight: '300px' }} 
        />
      ) : (
        <div 
          id={mapCanvasId} 
          style={{ width: '100%', height: '100%', minHeight: '300px', background: '#e2e8f0' }} 
        />
      )}

      {/* ENGINE & ROUTE BADGE */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 400,
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(8px)',
        color: '#ffffff',
        padding: '5px 12px',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        border: '1px solid rgba(255,255,255,0.2)',
        pointerEvents: 'none'
      }}>
        <span>🗺️</span>
        <span>{useFallback ? 'OpenStreetMap Live Map' : 'Google Maps Live'}</span>
        {showRoute && <span style={{ color: '#38bdf8', marginLeft: '4px' }}>• 🛣️ Route Active</span>}
      </div>

      {/* SELECTED CAR POPUP OVERLAY */}
      {selectedCar && (
        <div style={{
          position: 'absolute',
          bottom: '14px',
          left: '14px',
          right: '14px',
          background: '#ffffff',
          borderRadius: '14px',
          padding: '14px 18px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
          border: '1px solid #cbd5e1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 500,
          animation: 'fadeInUp 0.3s ease-out'
        }}>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>🚗 {selectedCar.name}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
              📍 {selectedCar.locationName || 'Available near your pickup point'} • {selectedCar.fuel || 'Petrol'} • {selectedCar.transmission || 'Manual'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontWeight: 900, color: '#2563eb', fontSize: '1.1rem' }}>₹{selectedCar.price}</span>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>/day</span>
            </div>
            <button 
              onClick={() => {
                if (onSelectCar) onSelectCar(selectedCar);
                setSelectedCar(null);
              }}
              style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37,99,235,0.35)'
              }}
            >
              Book Car
            </button>
            <button 
              onClick={() => setSelectedCar(null)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: '0 4px' }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
