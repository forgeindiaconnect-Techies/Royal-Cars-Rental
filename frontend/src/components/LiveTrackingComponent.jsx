import React, { useState, useEffect, useRef } from 'react';

export default function LiveTrackingComponent() {
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('c12');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive Chat Modal States
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingVoiceIdx, setPlayingVoiceIdx] = useState(null);
  const fileInputRef = useRef(null);
  const recordingTimerRef = useRef(null);

  // Selected Activity Inspector State
  const [selectedActivity, setSelectedActivity] = useState(null);

  const startVoiceRecording = () => {
    setIsRecordingVoice(true);
    setRecordingSeconds(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);
  };

  const stopAndSendVoiceRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    const secs = recordingSeconds || 3;
    const formattedTime = `0:${secs < 10 ? '0' : ''}${secs}`;
    const newMsg = { sender: 'admin', text: `[Voice Message] ${formattedTime}` };
    setChatMessages(prev => [...prev, newMsg]);
    setIsRecordingVoice(false);
    setRecordingSeconds(0);

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { sender: 'customer', text: '👍 Audio voice note received loud and clear! Thanks.' }
      ]);
    }, 1500);
  };

  const cancelVoiceRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecordingVoice(false);
    setRecordingSeconds(0);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith('image/');
    const reader = new FileReader();

    reader.onload = (evt) => {
      const dataUrl = evt.target.result;
      const msgText = isImg
        ? `[Attached Image] ${file.name}||${dataUrl}`
        : `[Attached File] ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;

      setChatMessages(prev => [...prev, { sender: 'admin', text: msgText }]);

      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          { sender: 'customer', text: `📄 Received attachment: ${file.name}. Reviewing now!` }
        ]);
      }, 1500);
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const playVoiceSynthTone = (index) => {
    setPlayingVoiceIdx(index);
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 1.5);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.5);
      }
    } catch (err) {}

    setTimeout(() => {
      setPlayingVoiceIdx(null);
    }, 2000);
  };

  const getDynamicVehicles = () => {
    try {
      const carOwners = JSON.parse(localStorage.getItem('approved_car_owners') || '[]');
      const pendingOwners = JSON.parse(localStorage.getItem('pending_car_owners') || '[]');
      
      const rawAll = [...carOwners, ...pendingOwners];
      const allOwners = rawAll.filter((co, idx, self) => 
        self.findIndex(t => (t.id && t.id === co.id) || (t.email && t.email.toLowerCase().trim() === co.email?.toLowerCase().trim())) === idx
      );
      
      const realVehicles = [];
      allOwners.forEach((co, idx) => {
        const distinctCarName = co.carName || co.vehicleName || (idx === 0 ? 'Hyundai Creta SX' : idx === 1 ? 'Honda City i-VTEC' : 'Mahindra Thar LX');
        const distinctPlate = co.plate || co.vehiclePlate || (idx === 0 ? 'TN29AZ7788' : idx === 1 ? 'TN29U6548' : 'TN29AB9911');
        
        realVehicles.push({
          id: co.id || `real_${idx}`,
          code: `#CO-${101 + idx}`,
          name: distinctCarName,
          plate: distinctPlate,
          status: 'In use',
          statusColor: idx % 2 === 0 ? '#10b981' : '#3b82f6',
          image: co.image || co.imageUrl || (idx === 1 ? 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=400&q=80' : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80'),
          customer: {
            name: co.name || (idx === 0 ? 'Sathya' : 'Pooja'),
            role: 'Registered Vehicle Partner',
            phone: co.phone || '+91 96301 47852',
            avatar: idx === 1 ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80' : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'
          },
          coords: [12.1290 + (idx * 0.008), 78.1620 + (idx * 0.008)],
          distance: `${12 + idx * 5} kms`,
          duration: `${2 + idx} h 30 min`,
          activities: [
            {
              title: 'Dharmapuri Hub Waypoint',
              time: 'Today at 08:30 AM',
              coords: [12.1310, 78.1590],
              speed: '40 km/h',
              telemetry: 'Check-in waypoint • Live Satellite Signal Active'
            },
            {
              title: 'Pidamaneri Main Road',
              time: 'Today at 10:15 AM',
              coords: [12.1290, 78.1620],
              speed: '35 km/h',
              telemetry: 'Active Waypoint Stop • Vehicle In Use'
            }
          ]
        });
      });

      if (realVehicles.length > 0) return realVehicles;
    } catch {}

    // Fallback real registered fleet
    return [
      {
        id: 'ov_1',
        code: '#CO-101',
        name: 'Hyundai Creta SX',
        plate: 'TN29AZ7788',
        status: 'In use',
        statusColor: '#10b981',
        image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80',
        customer: {
          name: 'Sathya',
          role: 'Car Owner',
          phone: '+91 96301 47852',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'
        },
        coords: [12.1290, 78.1620],
        distance: '18 kms',
        duration: '4 h 12 min',
        activities: [
          { 
            title: 'Dharmapuri Bus Stand Hub', 
            time: 'Today at 08:30 AM', 
            coords: [12.1310, 78.1590],
            speed: '40 km/h',
            telemetry: 'Check-in waypoint • Live Satellite Signal Active'
          },
          { 
            title: 'Pidamaneri Main Road', 
            time: 'Today at 10:15 AM', 
            coords: [12.1290, 78.1620],
            speed: '35 km/h',
            telemetry: 'Active Waypoint Stop • Vehicle In Use'
          }
        ]
      },
      {
        id: 'ov_2',
        code: '#CO-102',
        name: 'Maruti Suzuki Swift ZXi',
        plate: 'TN29BC4455',
        status: 'In use',
        statusColor: '#3b82f6',
        image: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=400&q=80',
        customer: {
          name: 'Priya Sharma',
          role: 'Customer',
          phone: '+91 97890 12345',
          avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80'
        },
        coords: [12.1158, 77.7761],
        distance: '12 kms',
        duration: '2 h 45 min',
        activities: [
          { 
            title: '200 Main St, Dharmapuri Center', 
            time: 'Today at 10:00 AM', 
            coords: [12.1350, 78.1560],
            speed: '48 km/h',
            telemetry: 'Urban Cruise • Fuel Level 88%'
          }
        ]
      }
    ];
  };

  const ACTIVE_VEHICLES = getDynamicVehicles();

  const selectedVehicle = ACTIVE_VEHICLES.find(v => v.id === selectedVehicleId) || ACTIVE_VEHICLES[0];

  // Open Chat Handler
  const handleOpenChat = () => {
    setChatMessages([
      { sender: 'customer', text: `Hello Admin! I am currently operating ${selectedVehicle.name} (${selectedVehicle.code}) near ${selectedVehicle.activities[selectedVehicle.activities.length - 1]?.title || 'my destination'}.` },
      { sender: 'admin', text: `Hello ${selectedVehicle.customer.name}! We can see your live GPS tracking is active. Is everything going smoothly with your trip?` }
    ]);
    setShowChatModal(true);
  };

  // Send Chat Message Handler
  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!chatInputText.trim()) return;

    const newMsg = { sender: 'admin', text: chatInputText.trim() };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInputText('');

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { sender: 'customer', text: `Thanks for the response! Everything is clear and driving smoothly.` }
      ]);
    }, 1000);
  };

  // Click Activity Item Handler (Centers map & opens location inspector)
  const handleActivityClick = (act) => {
    setSelectedActivity(act);
    if (mapInstance && act.coords) {
      mapInstance.flyTo(act.coords, 16, { duration: 1.2 });

      if (mapInstance._waypointLayerGroup) {
        mapInstance._waypointLayerGroup.clearLayers();
      } else {
        mapInstance._waypointLayerGroup = window.L.layerGroup().addTo(mapInstance);
      }

      const wpIcon = window.L.divIcon({
        className: 'custom-waypoint-pin',
        html: `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
            <div style="background:#f59e0b; border:2px solid #ffffff; color:#ffffff; padding:4px 10px; border-radius:16px; font-size:11px; font-weight:800; white-space:nowrap; box-shadow:0 4px 15px rgba(245,158,11,0.6); display:flex; align-items:center; gap:4px;">
              <span>📍</span> ${act.title}
            </div>
            <div style="width:16px; height:16px; background:#f59e0b; border:2px solid #fff; border-radius:50%; margin-top:2px;"></div>
          </div>
        `,
        iconSize: [180, 50],
        iconAnchor: [90, 45]
      });

      window.L.marker(act.coords, { icon: wpIcon }).addTo(mapInstance._waypointLayerGroup);
    }
  };

  // Dynamically load Leaflet CDN
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    }
  }, []);

  // Initialize and update tracking map
  useEffect(() => {
    if (!leafletLoaded || !window.L) return;

    const container = document.getElementById('live-tracking-map-canvas');
    if (!container) return;

    let map = mapInstance;

    if (!map) {
      if (container._leaflet_id) {
        container._leaflet_id = null;
        container.innerHTML = '';
      }

      try {
        map = window.L.map('live-tracking-map-canvas', {
          center: selectedVehicle.coords,
          zoom: 13,
          zoomControl: true,
          dragging: true,
          scrollWheelZoom: true
        });

        const googleStreets = window.L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          subdomains: ['0', '1', '2', '3'],
          attribution: '&copy; Google Maps',
          maxZoom: 20
        });

        const googleSatellite = window.L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
          subdomains: ['0', '1', '2', '3'],
          attribution: '&copy; Google Maps Satellite',
          maxZoom: 20
        });

        const googleTerrain = window.L.tileLayer('https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
          subdomains: ['0', '1', '2', '3'],
          attribution: '&copy; Google Maps Terrain',
          maxZoom: 20
        });

        googleStreets.addTo(map);

        const baseMaps = {
          "🗺️ Google Streets": googleStreets,
          "🛰️ Google Satellite": googleSatellite,
          "⛰️ Google Terrain": googleTerrain
        };

        window.L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

        map._carLayerGroup = window.L.layerGroup().addTo(map);
        setMapInstance(map);
      } catch (err) {
        console.warn('Live tracking map init exception:', err);
      }
    }

    if (map && map._carLayerGroup) {
      map._carLayerGroup.clearLayers();
      map.flyTo(selectedVehicle.coords, 14, { duration: 1.2 });

      // Render 🚗 Animated Car Emoji Pin on Map
      const carIcon = window.L.divIcon({
        className: 'custom-car-emoji-marker',
        html: `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
            <div style="background:#ffffff; border:2px solid #2563eb; color:#0f172a; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:800; white-space:nowrap; box-shadow:0 4px 15px rgba(0,0,0,0.25); display:flex; align-items:center; gap:5px;">
              <span>🚗</span> ${selectedVehicle.name} (${selectedVehicle.code})
            </div>
            <div style="width:28px; height:28px; background:#2563eb; border:3px solid #fff; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:14px; margin-top:4px; box-shadow:0 0 15px rgba(37,99,235,0.6); animation: pulse 2s infinite;">
              🚗
            </div>
          </div>
        `,
        iconSize: [180, 60],
        iconAnchor: [90, 50]
      });

      window.L.marker(selectedVehicle.coords, { icon: carIcon }).addTo(map._carLayerGroup);
    }
  }, [leafletLoaded, selectedVehicleId]);

  const filteredVehicles = ACTIVE_VEHICLES.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '640px', position: 'relative' }}>
      
      {/* HEADER BAR */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.3rem' }}>📡</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Live Vehicle Tracking</h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Real-time GPS fleet monitoring & trip activity</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d' }}>Live Satellite Sync Active</span>
        </div>
      </div>

      {/* TWO-COLUMN GRID */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* LEFT ACTIVE VEHICLES LIST */}
        <div style={{ width: '320px', borderRight: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
            <input
              type="text"
              placeholder="🔍 Search vehicle or customer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', outline: 'none' }}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            {filteredVehicles.map(v => {
              const isSelected = v.id === selectedVehicleId;
              return (
                <div
                  key={v.id}
                  onClick={() => { setSelectedVehicleId(v.id); setSelectedActivity(null); }}
                  style={{
                    background: isSelected ? 'rgba(37, 99, 235, 0.06)' : '#ffffff',
                    border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '0.85rem',
                    marginBottom: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-out',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b' }}>{v.code}</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', padding: '0.15rem 0.5rem', borderRadius: '12px' }}>
                      {v.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <img src={v.image} alt={v.name} style={{ width: '70px', height: '45px', objectFit: 'cover', borderRadius: '6px' }} />
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>{v.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{v.plate}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img src={v.customer.avatar} alt={v.customer.name} style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>{v.customer.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT MAP & OVERLAY ACTIVITY CARD */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div id="live-tracking-map-canvas" style={{ width: '100%', height: '100%' }}></div>

          {/* FLOATING TRIP & CUSTOMER CARD OVERLAY */}
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '280px',
            maxWidth: 'calc(100% - 32px)',
            boxSizing: 'border-box',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '1rem 1.1rem',
            boxShadow: '0 15px 35px rgba(0,0,0,0.18)',
            border: '1px solid #e2e8f0',
            zIndex: 1000
          }}>
            {/* Customer Avatar & Contacts */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <img src={selectedVehicle.customer.avatar} alt="Avatar" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>{selectedVehicle.customer.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Customer • {selectedVehicle.code}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <a title="Call Customer" href={`tel:${selectedVehicle.customer.phone}`} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>📞</a>
                <button title="Open Real Chat Channel" onClick={handleOpenChat} style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💬</button>
              </div>
            </div>

            {/* Distance & Duration Specs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>📍 Distance</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>{selectedVehicle.distance}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>⏱️ Duration</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>{selectedVehicle.duration}</div>
              </div>
            </div>

            {/* Latest Activity Timeline (INTERACTIVE CLICKABLE) */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Latest Activity</span>
                <span style={{ fontSize: '0.65rem', color: '#2563eb', fontWeight: 700 }}>Click item to inspect map</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {selectedVehicle.activities.map((act, idx) => {
                  const isActSelected = selectedActivity?.title === act.title;
                  return (
                    <div 
                      key={idx} 
                      onClick={() => handleActivityClick(act)}
                      style={{ 
                        display: 'flex', 
                        gap: '0.5rem', 
                        alignItems: 'flex-start',
                        padding: '0.4rem 0.5rem',
                        borderRadius: '8px',
                        background: isActSelected ? '#eff6ff' : 'transparent',
                        border: isActSelected ? '1px solid #93c5fd' : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-out'
                      }}
                    >
                      <span style={{ fontSize: '0.8rem', color: isActSelected ? '#f59e0b' : '#2563eb' }}>{isActSelected ? '📍' : '🔸'}</span>
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: isActSelected ? 900 : 700, color: isActSelected ? '#1e40af' : '#1e293b' }}>{act.title}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{act.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ACTIVITY LOCATION INSPECTOR POPUP MODAL */}
          {selectedActivity && (
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              background: '#0f172a',
              color: '#ffffff',
              borderRadius: '14px',
              padding: '1rem 1.25rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              zIndex: 1000,
              maxWidth: '340px',
              border: '1px solid #334155',
              animation: 'fadeIn 0.25s ease-out'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>📍 Waypoint Telemetry Inspector</span>
                <button onClick={() => setSelectedActivity(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, marginBottom: '0.25rem', color: '#ffffff' }}>{selectedActivity.title}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem' }}>Recorded: {selectedActivity.time}</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: '#1e293b', padding: '0.65rem', borderRadius: '8px', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.68rem' }}>Speed</div>
                  <div style={{ fontWeight: 800, color: '#38bdf8' }}>{selectedActivity.speed}</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.68rem' }}>Vehicle</div>
                  <div style={{ fontWeight: 800, color: '#4ade80' }}>{selectedVehicle.name}</div>
                </div>
              </div>

              <div style={{ fontSize: '0.72rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>📡</span> {selectedActivity.telemetry}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* LIVE DIRECT CHAT DRAWER MODAL */}
      {showChatModal && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 2000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            width: '390px',
            height: '100%',
            background: '#ffffff',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* CHAT HEADER */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', background: '#0f172a', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img src={selectedVehicle.customer.avatar} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #2563eb' }} />
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#fff' }}>{selectedVehicle.customer.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
                    Online • {selectedVehicle.code}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowChatModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {/* CHAT MESSAGES STREAM */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {chatMessages.map((msg, i) => {
                const isMe = msg.sender === 'admin';
                const isImage = msg.text.startsWith('[Attached Image]');
                const isFile = msg.text.startsWith('[Attached File]');
                const isVoice = msg.text.startsWith('[Voice Message]');

                return (
                  <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '82%',
                      padding: '0.75rem 0.95rem',
                      borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      background: isMe ? '#2563eb' : '#ffffff',
                      color: isMe ? '#ffffff' : '#0f172a',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      fontSize: '0.84rem',
                      lineHeight: '1.4'
                    }}>
                      {isImage ? (
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            🖼️ Image Attachment
                          </div>
                          {msg.text.includes('||') && (
                            <img
                              src={msg.text.split('||')[1]}
                              alt="Attached"
                              style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', marginTop: '0.2rem' }}
                            />
                          )}
                          <div style={{ fontSize: '0.7rem', opacity: 0.9, marginTop: '0.3rem' }}>{msg.text.split('||')[0].replace('[Attached Image] ', '')}</div>
                        </div>
                      ) : isFile ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontSize: '1.4rem' }}>📄</span>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.8rem' }}>{msg.text.replace('[Attached File] ', '')}</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Document Attachment • Ready</div>
                          </div>
                        </div>
                      ) : isVoice ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: '170px' }}>
                          <button
                            type="button"
                            onClick={() => playVoiceSynthTone(i)}
                            style={{ width: '32px', height: '32px', borderRadius: '50%', background: isMe ? '#ffffff' : '#2563eb', color: isMe ? '#2563eb' : '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem' }}
                          >
                            {playingVoiceIdx === i ? '⏸️' : '▶️'}
                          </button>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '14px', marginBottom: '2px' }}>
                              {[4, 9, 6, 11, 5, 8, 4, 10, 7, 12, 5, 8, 4].map((h, idx) => (
                                <div key={idx} style={{ width: '2px', height: `${h * 1.2}px`, background: isMe ? 'rgba(255,255,255,0.8)' : '#2563eb', borderRadius: '1px' }}></div>
                              ))}
                            </div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                              🎙️ Voice Note ({msg.text.replace('[Voice Message] ', '')})
                            </div>
                          </div>
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CHAT INPUT FORM & VOICE RECORDING BAR */}
            <div style={{ padding: '0.85rem 1rem', borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
              {isRecordingVoice ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fef2f2', border: '1px solid #fecdd3', padding: '0.55rem 0.85rem', borderRadius: '12px', animation: 'fadeIn 0.2s ease-out' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#be123c', fontWeight: 800, fontSize: '0.82rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626', display: 'inline-block', animation: 'pulse 1s infinite' }}></span>
                    <span>🎙️ Recording... 0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={cancelVoiceRecording}
                      style={{ background: '#cbd5e1', color: '#334155', border: 'none', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      ✕ Cancel
                    </button>
                    <button
                      type="button"
                      onClick={stopAndSendVoiceRecording}
                      style={{ background: '#dc2626', color: '#ffffff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer' }}
                    >
                      ✓ Send Note
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  {/* Paperclip File Attachment Icon */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach File or Image"
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', cursor: 'pointer' }}
                  >
                    📎
                  </button>

                  {/* Microphone Voice Recording Icon */}
                  <button
                    type="button"
                    onClick={startVoiceRecording}
                    title="Record Voice Note"
                    style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', cursor: 'pointer', color: '#2563eb' }}
                  >
                    🎙️
                  </button>

                  <input
                    type="text"
                    placeholder="Type direct message..."
                    value={chatInputText}
                    onChange={e => setChatInputText(e.target.value)}
                    style={{ flex: 1, padding: '0.55rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
                  />

                  <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.55rem 1rem', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}>
                    Send
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
