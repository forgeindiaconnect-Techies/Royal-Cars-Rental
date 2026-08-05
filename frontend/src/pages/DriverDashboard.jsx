import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import FaceScanModal from '../components/FaceScanModal';
import { getValidImageUrl, handleImageError } from '../utils/imageUtils';

export default function DriverDashboard() {
  const { token, logout, user } = useAuth();
  const [logoHasError, setLogoHasError] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [notice, setNotice] = useState('');
  const showNotification = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

  // Driver Specific Local Storage Key (email-wise isolation)
  const driverEmailKey = user?.email ? user.email.trim().toLowerCase().replace(/[^a-z0-9]/gi, '_') : 'guest_driver';

  // Attendance & Duty States — synchronized per driver
  const [isCheckedIn, setIsCheckedIn] = useState(() => {
    return localStorage.getItem(`driver_checked_in_${driverEmailKey}`) === 'true';
  });

  const [isOnDuty, setIsOnDuty] = useState(() => {
    return localStorage.getItem(`driver_on_duty_${driverEmailKey}`) === 'true';
  });

  const [isGpsSharing, setIsGpsSharing] = useState(() => {
    return localStorage.getItem(`driver_gps_sharing_${driverEmailKey}`) === 'true';
  });

  const [attendanceLogs, setAttendanceLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(`driver_attendance_logs_${driverEmailKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}

    // For brand new drivers (e.g. lokee@gmail.com), start with clean empty array []
    return [];
  });

  useEffect(() => {
    localStorage.setItem(`driver_attendance_logs_${driverEmailKey}`, JSON.stringify(attendanceLogs));
  }, [attendanceLogs, driverEmailKey]);
  // GPS & Map Telemetry States & Refs
  const [gpsCoords, setGpsCoords] = useState({ lat: 13.0827, lng: 80.2707 });
  const [gpsPermissionStatus, setGpsPermissionStatus] = useState('prompt');
  const [gpsLog, setGpsLog] = useState([
    `[${new Date().toLocaleTimeString()}] GPS Tracker initialized. Telemetry system ready.`
  ]);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [faceScanProgress, setFaceScanProgress] = useState(0);
  const [isScanningFace, setIsScanningFace] = useState(false);
  const [punchActionType, setPunchActionType] = useState('in'); // 'in' | 'out'

  // Driver Face Profile Photo State & Upload Handlers
  const [driverFacePhoto, setDriverFacePhoto] = useState(() => {
    return getValidImageUrl(localStorage.getItem('driver_face_photo') || user?.driverFaceUrl || user?.avatar, 'driver');
  });
  const [isDriverFaceModalOpen, setIsDriverFaceModalOpen] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const handleDriverFaceUpload = (dataUrl) => {
    if (!dataUrl) return;
    setDriverFacePhoto(dataUrl);
    localStorage.setItem('driver_face_photo', dataUrl);
    showNotification('✓ Driver Face Photo updated & saved successfully!');

    try {
      const registry = JSON.parse(localStorage.getItem('company_drivers_registry') || '[]');
      const updated = registry.map(d => {
        if (d.name === driverProfile?.name || d.phone === driverProfile?.phone || d.email === user?.email) {
          return { ...d, driverFaceUrl: dataUrl, avatar: dataUrl, faceVerified: true };
        }
        return d;
      });
      localStorage.setItem('company_drivers_registry', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleFaceFileInput = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      handleDriverFaceUpload(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    localStorage.setItem('driver_checked_in', isCheckedIn ? 'true' : 'false');
  }, [isCheckedIn]);

  const requestGpsPermission = () => {
    if (!navigator.geolocation) {
      setGpsPermissionStatus('denied');
      showNotification("⚠️ Geolocation is not supported by your browser.");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setGpsCoords({ lat, lng });
        setGpsPermissionStatus('granted');
        showNotification("🟢 GPS Permission Granted successfully!");
        setGpsLog(prev => [`[${new Date().toLocaleTimeString()}] GPS permission granted. Initialized at coords: ${lat.toFixed(5)}, ${lng.toFixed(5)}`, ...prev]);
      },
      (error) => {
        console.warn("GPS Permission error:", error);
        setGpsPermissionStatus('denied');
        showNotification("⚠️ GPS Permission Denied. Live tracking will use simulated coords.");
      }
    );
  };

  useEffect(() => {
    requestGpsPermission();
  }, []);

  // Map Initialization & Update Hooks
  useEffect(() => {
    if (activeNav === 'gps') {
      const timer = setTimeout(() => {
        const mapEl = document.getElementById('driver-live-map-canvas');
        if (mapEl && !mapRef.current && window.L) {
          const map = window.L.map('driver-live-map-canvas').setView([gpsCoords.lat, gpsCoords.lng], 15);
          
          window.L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            attribution: '&copy; Google Maps',
            maxZoom: 20
          }).addTo(map);
          
          mapRef.current = map;

          const carIcon = window.L.divIcon({
            className: 'custom-driver-marker',
            html: `
              <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="background: ${isOnDuty ? '#2563eb' : '#dc2626'}; color: #fff; padding: 3px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.15); margin-bottom: 2px;">
                  🚗 Current Location (${isOnDuty ? 'ON DUTY' : 'OFF DUTY'})
                </div>
                <div style="width: 12px; height: 12px; background: ${isOnDuty ? '#2563eb' : '#dc2626'}; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 8px ${isOnDuty ? '#2563eb' : '#dc2626'};"></div>
              </div>
            `,
            iconSize: [80, 40],
            iconAnchor: [40, 40]
          });

          markerRef.current = window.L.marker([gpsCoords.lat, gpsCoords.lng], { icon: carIcon }).addTo(map);
        }
      }, 200);

      return () => {
        clearTimeout(timer);
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
          markerRef.current = null;
        }
      };
    }
  }, [activeNav]);

  useEffect(() => {
    if (mapRef.current && window.L) {
      const { lat, lng } = gpsCoords;
      mapRef.current.setView([lat, lng]);

      const carIcon = window.L.divIcon({
        className: 'custom-driver-marker',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="background: ${isOnDuty ? '#2563eb' : '#dc2626'}; color: #fff; padding: 3px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.15); margin-bottom: 2px;">
              🚗 Current Location (${isOnDuty ? 'ON DUTY' : 'OFF DUTY'})
            </div>
            <div style="width: 12px; height: 12px; background: ${isOnDuty ? '#2563eb' : '#dc2626'}; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 8px ${isOnDuty ? '#2563eb' : '#dc2626'};"></div>
          </div>
        `,
        iconSize: [80, 40],
        iconAnchor: [40, 40]
      });

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        markerRef.current.setIcon(carIcon);
      } else {
        markerRef.current = window.L.marker([lat, lng], { icon: carIcon }).addTo(mapRef.current);
      }
    }
  }, [gpsCoords, isOnDuty]);

  const sendTelemetryUpdate = async (lat, lng, speedVal, status) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      headers['x-mock-role'] = 'driver';
      headers['x-company-name'] = localStorage.getItem('company_name') || user?.company?.name || user?.companyName || 'DriveX Rentals';

      await fetch('/api/company-admin/driver-location', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          speed: speedVal,
          heading: Math.floor(Math.random() * 360),
          dutyStatus: status || (isOnDuty ? 'ON DUTY' : 'OFF DUTY'),
          address: `Chennai Transit Route (Live: ${lat.toFixed(5)}, ${lng.toFixed(5)})`
        })
      });
    } catch (err) {
      console.error('[GPS Sync Error] Telemetry write failed:', err.message);
    }
  };

  useEffect(() => {
    if (!isGpsSharing || !isOnDuty) return;

    const interval = setInterval(() => {
      let speedVal = Math.floor(Math.random() * 20 + 35);
      if (navigator.geolocation && gpsPermissionStatus === 'granted') {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const baseLat = position.coords.latitude;
            const baseLng = position.coords.longitude;
            const randomOffsetLat = (Math.random() - 0.5) * 0.0006;
            const randomOffsetLng = (Math.random() - 0.5) * 0.0006;
            const newLat = Number((baseLat + randomOffsetLat).toFixed(5));
            const newLng = Number((baseLng + randomOffsetLng).toFixed(5));
            
            setGpsCoords({ lat: newLat, lng: newLng });
            const timestamp = new Date().toLocaleTimeString();
            setGpsLog(prev => [`[${timestamp}] GPS Live: ${newLat}° N, ${newLng}° E sent to operations.`, ...prev.slice(0, 19)]);
            sendTelemetryUpdate(newLat, newLng, speedVal, 'ON DUTY');
          },
          (err) => {
            const randomOffsetLat = (Math.random() - 0.5) * 0.0006;
            const randomOffsetLng = (Math.random() - 0.5) * 0.0006;
            setGpsCoords(prev => {
              const newLat = Number((prev.lat + randomOffsetLat).toFixed(5));
              const newLng = Number((prev.lng + randomOffsetLng).toFixed(5));
              const timestamp = new Date().toLocaleTimeString();
              setGpsLog(l => [`[${timestamp}] GPS Sim: ${newLat}° N, ${newLng}° E sent to operations.`, ...l.slice(0, 19)]);
              sendTelemetryUpdate(newLat, newLng, speedVal, 'ON DUTY');
              return { lat: newLat, lng: newLng };
            });
          }
        );
      } else {
        const randomOffsetLat = (Math.random() - 0.5) * 0.0006;
        const randomOffsetLng = (Math.random() - 0.5) * 0.0006;
        setGpsCoords(prev => {
          const newLat = Number((prev.lat + randomOffsetLat).toFixed(5));
          const newLng = Number((prev.lng + randomOffsetLng).toFixed(5));
          const timestamp = new Date().toLocaleTimeString();
          setGpsLog(l => [`[${timestamp}] GPS Sim: ${newLat}° N, ${newLng}° E sent to operations.`, ...l.slice(0, 19)]);
          sendTelemetryUpdate(newLat, newLng, speedVal, 'ON DUTY');
          return { lat: newLat, lng: newLng };
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isGpsSharing, isOnDuty, gpsPermissionStatus, token, user, gpsCoords]);

  const handleToggleDutyStatus = () => {
    if (!isOnDuty) {
      if (gpsPermissionStatus !== 'granted') {
        requestGpsPermission();
      }
      setIsOnDuty(true);
      setIsCheckedIn(true);
      setIsGpsSharing(true);
      localStorage.setItem('driver_checked_in', 'true');
      localStorage.setItem('driver_on_duty', 'true');
      localStorage.setItem('driver_gps_sharing', 'true');
      showNotification(`Duty status set to ON DUTY 🟢. GPS Tracking START.`);
      sendTelemetryUpdate(gpsCoords.lat, gpsCoords.lng, 45, 'ON DUTY');
    } else {
      setIsOnDuty(false);
      setIsCheckedIn(false);
      setIsGpsSharing(false);
      localStorage.setItem('driver_checked_in', 'false');
      localStorage.setItem('driver_on_duty', 'false');
      localStorage.setItem('driver_gps_sharing', 'false');
      showNotification(`Duty status set to OFF DUTY 🔴. GPS Tracking STOP.`);
      sendTelemetryUpdate(gpsCoords.lat, gpsCoords.lng, 0, 'OFF DUTY');
    }
  };

  const handleDriverLogout = async () => {
    setIsOnDuty(false);
    setIsGpsSharing(false);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      headers['x-mock-role'] = 'driver';
      headers['x-company-name'] = localStorage.getItem('company_name') || user?.company?.name || user?.companyName || 'DriveX Rentals';

      await fetch('/api/company-admin/driver-location', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          latitude: gpsCoords.lat,
          longitude: gpsCoords.lng,
          speed: 0,
          heading: 0,
          dutyStatus: 'OFF DUTY',
          address: `Driver logged out (OFF DUTY)`
        })
      });
    } catch (err) {
      console.error('Error sending final logout telemetry:', err);
    }
    logout();
  };

  const handleStartAttendanceScan = (action) => {
    setPunchActionType(action);
    setIsFaceModalOpen(true);
  };

  const handleFaceScanSuccess = (capturedFaceDataUrl) => {
    setIsFaceModalOpen(false);
    const todayDate = new Date().toISOString().split('T')[0];
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const realDriverName = user?.name || localStorage.getItem('driver_name') || 'Karthik S. (Senior Chauffeur)';
    const realDriverPhoto = capturedFaceDataUrl || user?.driverFaceUrl || localStorage.getItem('driver_face_url') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100';

    if (punchActionType === 'in') {
      setIsCheckedIn(true);
      setIsOnDuty(true);
      setIsGpsSharing(true);
      localStorage.setItem(`driver_checked_in_${driverEmailKey}`, 'true');
      localStorage.setItem(`driver_on_duty_${driverEmailKey}`, 'true');
      localStorage.setItem(`driver_gps_sharing_${driverEmailKey}`, 'true');
      if (gpsPermissionStatus !== 'granted') {
        requestGpsPermission();
      }
      sendTelemetryUpdate(gpsCoords.lat, gpsCoords.lng, 45, 'ON DUTY');

      const newLog = {
        _id: 'att_' + Date.now(),
        id: 'att_' + Date.now(),
        driverName: realDriverName,
        driverPhoto: realDriverPhoto,
        name: realDriverName.replace(/\(.*\)/g, '').trim(),
        avatar: realDriverPhoto,
        email: user?.email || 'driver@company.com',
        date: todayDate,
        clockIn: timeString,
        clockOut: '--',
        duration: '0.1 hrs',
        method: '🤳 Face Auth',
        status: 'Checked In',
        type: 'driver'
      };
      setAttendanceLogs(prev => [newLog, ...prev]);

      try {
        const companyLogs = JSON.parse(localStorage.getItem('company_attendance_logs') || '[]');
        localStorage.setItem('company_attendance_logs', JSON.stringify([newLog, ...companyLogs.filter(l => l.email !== newLog.email && l.name !== newLog.name)]));
        const driverLogs = JSON.parse(localStorage.getItem(`driver_attendance_logs_${driverEmailKey}`) || '[]');
        localStorage.setItem(`driver_attendance_logs_${driverEmailKey}`, JSON.stringify([newLog, ...driverLogs]));
      } catch (e) {}

      showNotification('🟢 Attendance Marked & ON DUTY GPS Active!');
    } else {
      setIsCheckedIn(false);
      setIsOnDuty(false);
      setIsGpsSharing(false);
      localStorage.setItem(`driver_checked_in_${driverEmailKey}`, 'false');
      localStorage.setItem(`driver_on_duty_${driverEmailKey}`, 'false');
      localStorage.setItem(`driver_gps_sharing_${driverEmailKey}`, 'false');
      sendTelemetryUpdate(gpsCoords.lat, gpsCoords.lng, 0, 'OFF DUTY');

      setAttendanceLogs(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[0].clockOut = timeString;
          updated[0].status = 'Checked Out';
          updated[0].duration = '8.5 hrs';
        }
        return updated;
      });

      try {
        const companyLogs = JSON.parse(localStorage.getItem('company_attendance_logs') || '[]');
        if (companyLogs.length > 0) {
          const idx = companyLogs.findIndex(l => l.email === user?.email || l.name === realDriverName);
          if (idx !== -1) {
            companyLogs[idx].clockOut = timeString;
            companyLogs[idx].status = 'Checked Out';
            companyLogs[idx].duration = '8.5 hrs';
            localStorage.setItem('company_attendance_logs', JSON.stringify(companyLogs));
          }
        }
      } catch (e) {}

      showNotification('🔴 Attendance Clock Out completed & GPS map turned off.');
    }
  };

  // Chat states & Multi-Channel Selector
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [driverChatChannel, setDriverChatChannel] = useState('company-admin');

  const fetchChatMessages = async () => {
    let localLogs = [];
    try {
      localLogs = JSON.parse(localStorage.getItem('company_support_chats') || '[]');
    } catch (e) {}

    try {
      const headers = {
        'x-mock-role': 'driver',
        'x-company-name': localStorage.getItem('company_name') || user?.companyName || 'DriveX Rentals'
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch('/api/chat', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          const map = new Map();
          [...data.messages, ...localLogs].forEach(m => {
            const key = m._id || `${m.senderEmail || m.senderId}_${m.createdAt}_${(m.message || '').slice(0, 15)}`;
            map.set(key, m);
          });
          const merged = Array.from(map.values());
          setChatMessages(merged);
          return;
        }
      }
    } catch (err) {
      console.warn('Error fetching chat messages from API, using local storage:', err);
    }
    setChatMessages(localLogs);
  };

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (activeNav === 'chat') {
      fetchChatMessages();
      const interval = setInterval(fetchChatMessages, 4000);
      return () => clearInterval(interval);
    }
  }, [activeNav, token]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      sendDirectChatMessage(`[Attached File] ${file.name}`);
    }
  };

  const startVoiceRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const cancelVoiceRecording = () => {
    clearInterval(recordingIntervalRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const sendVoiceRecording = () => {
    clearInterval(recordingIntervalRef.current);
    const secs = recordingSeconds;
    const formatSecs = secs < 10 ? `0${secs}` : secs;
    sendDirectChatMessage(`[Voice Message] 0:${formatSecs}`);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const sendDirectChatMessage = async (text) => {
    if (!text || !text.trim()) return;

    const messageText = text.trim();
    const newMsg = {
      _id: 'chat_' + Date.now(),
      senderId: user?._id || user?.id || 'drv_' + (user?.email || 'driver').replace(/[^a-z0-9]/gi, '_'),
      senderName: user?.name || 'Driver',
      senderEmail: user?.email || 'driver@company.com',
      senderRole: 'driver',
      receiverId: driverChatChannel,
      receiverRole: driverChatChannel,
      receiverName: driverChatChannel === 'super-admin' ? 'Super Admin Support' : driverChatChannel === 'customer' ? 'Assigned Passenger' : 'Company Manager',
      message: messageText,
      createdAt: new Date().toISOString(),
      status: 'sent'
    };

    try {
      const currentLogs = JSON.parse(localStorage.getItem('company_support_chats') || '[]');
      const updated = [...currentLogs, newMsg];
      localStorage.setItem('company_support_chats', JSON.stringify(updated));
      setChatMessages(updated);
    } catch (e) {}

    setChatInput('');

    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-mock-role': 'driver',
        'x-company-name': localStorage.getItem('company_name') || user?.companyName || 'DriveX Rentals'
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          receiverId: driverChatChannel,
          receiverRole: driverChatChannel,
          message: messageText
        })
      });
    } catch (err) {
      console.warn('Backend chat sync warning:', err);
    }
  };

  const handleSendChatMessage = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!chatInput.trim()) return;
    sendDirectChatMessage(chatInput);
  };

  const [playingVoiceId, setPlayingVoiceId] = useState(null);

  const handlePlayVoiceAudioMsg = (msgId, messageText) => {
    if (playingVoiceId === msgId) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setPlayingVoiceId(null);
      return;
    }
    setPlayingVoiceId(msgId);

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      }
    } catch (e) {}

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const durationStr = messageText ? messageText.replace('[Voice Message]', '').trim() : '0:05';
      const utterance = new SpeechSynthesisUtterance(`Playing voice message recording, duration ${durationStr}. Operations update.`);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setPlayingVoiceId(null);
      utterance.onerror = () => setPlayingVoiceId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setPlayingVoiceId(null), 3000);
    }
  };

  const handleDownloadChatDoc = (messageText, fileDataUrl) => {
    const fileName = (messageText || 'Invoice_Doc.pdf').replace('[Attached File] ', '').trim();
    if (fileDataUrl && fileDataUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = fileDataUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const content = `==============================================\nRENTAL OS OFFICIAL ATTACHMENT DOCUMENT\n==============================================\nFile Name: ${fileName}\nDownloaded: ${new Date().toLocaleString()}\nStatus: Verified Document\nDocument ID: #INV-${Math.floor(100000 + Math.random() * 900000)}\n==============================================`;
    const blob = new Blob([content], { type: fileName.endsWith('.pdf') ? 'application/pdf' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      // Since driver dashboard login is mock/client-side, pass headers to authorize via mock bypass:
      headers['x-mock-role'] = 'driver';
      headers['x-company-name'] = localStorage.getItem('company_name') || user?.companyName || 'DriveX Rentals';

      const res = await fetch('/api/notifications', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          const lastReadCount = Number(localStorage.getItem(`last_read_notif_count_driver`) || 0);
          setUnreadCount(Math.max(0, (data.notifications || []).length - lastReadCount));
        }
      }
    } catch (err) {
      console.warn('Notifications fetch error:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Sample Assigned Chauffeur Trips
  const [assignedTrips, setAssignedTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  const DEFAULT_DRIVER_TRIPS = [
    {
      id: 'TRIP-10892',
      customerName: 'Deepu R.',
      customerPhone: '+91 98765 43210',
      vehicleName: 'Toyota Innova Crysta (TN 01 AB 1234)',
      pickupLocation: 'Dharmapuri Bus Stand / Main Town Center',
      dropLocation: 'Chennai Airport Hub Terminal 1',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      pickupTime: '10:00 AM',
      status: 'Assigned',
      allowance: 1200,
      totalFare: 5000,
      customerRating: 5.0,
      notes: 'Customer requested driver pickup at Dharmapuri Town center.'
    },
    {
      id: 'TRIP-10904',
      customerName: 'Anand Kumar',
      customerPhone: '+91 98765 88888',
      vehicleName: 'Mahindra XUV700 (TN 02 CD 5678)',
      pickupLocation: 'Chennai Central Railway Station',
      dropLocation: 'Pondicherry Rock Beach',
      startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
      pickupTime: '08:30 AM',
      status: 'Confirmed',
      allowance: 1500,
      totalFare: 9600,
      customerRating: 4.8,
      notes: 'Outstation trip to Pondicherry.'
    }
  ];

  const fetchAssignedTrips = async () => {
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      headers['x-mock-role'] = 'driver';
      headers['x-company-name'] = localStorage.getItem('company_name') || user?.company?.name || 'DriveX Rentals';

      // Load locally assigned bookings from Company Admin Dashboard
      const localAssigned = JSON.parse(localStorage.getItem('company_assigned_bookings') || '[]');
      const formattedLocal = localAssigned.map(b => ({
        id: b._id || b.id || 'TRIP-LOCAL',
        customerName: b.customerName || (typeof b.customerId === 'object' ? b.customerId?.name : 'Renter User'),
        customerPhone: b.customerPhone || (typeof b.customerId === 'object' ? b.customerId?.mobile || b.customerId?.email : '+91 98765 43210'),
        vehicleName: b.vehicleName || (typeof b.vehicleId === 'object' ? `${b.vehicleId?.make} ${b.vehicleId?.model}` : 'Rental Vehicle'),
        pickupLocation: b.pickupLocation || b.location || 'Dharmapuri Bus Stand / Main Town Center',
        dropLocation: b.dropLocation || 'Customer Destination',
        startDate: b.startDate ? (b.startDate.includes('T') ? b.startDate.split('T')[0] : b.startDate) : new Date().toISOString().split('T')[0],
        endDate: b.endDate ? (b.endDate.includes('T') ? b.endDate.split('T')[0] : b.endDate) : new Date(Date.now() + 86400000).toISOString().split('T')[0],
        pickupTime: b.pickupTime || '10:00 AM',
        status: b.status || 'Assigned',
        allowance: b.allowance || 1200,
        totalFare: b.totalPrice || b.totalAmount || 5000,
        customerRating: 4.9,
        notes: b.notes || 'Company assigned trip task.'
      }));

      let apiTrips = [];
      try {
        const res = await fetch('/api/company-admin/driver/trips', { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.trips && data.trips.length > 0) {
            apiTrips = data.trips.map(t => {
              const cust = t.customerId || {};
              const veh = t.vehicleId || {};
              return {
                id: t._id,
                customerName: cust.name || t.customerName || 'Renter User',
                customerPhone: cust.mobile || t.customerPhone || '+91 98765 43210',
                vehicleName: veh.make ? `${veh.make} ${veh.model} (${veh.regNumber || 'N/A'})` : t.vehicleName || 'Rental Vehicle',
                pickupLocation: t.pickupLocation || veh.location || 'Dharmapuri City Center',
                dropLocation: t.dropLocation || 'Customer Destination',
                startDate: t.startDate ? (t.startDate.includes('T') ? t.startDate.split('T')[0] : t.startDate) : new Date().toISOString().split('T')[0],
                endDate: t.endDate ? (t.endDate.includes('T') ? t.endDate.split('T')[0] : t.endDate) : new Date(Date.now() + 86400000).toISOString().split('T')[0],
                pickupTime: t.pickupTime || '10:00 AM',
                status: t.status || 'Assigned',
                allowance: 1200,
                totalFare: t.totalAmount || 5000,
                customerRating: 4.9,
                notes: t.checkOutNotes || 'Chauffeur driven trip.'
              };
            });
          }
        }
      } catch (err) {
        console.warn('API trip fetch warning:', err);
      }

      // Combine API trips + local assigned trips (deduplicated)
      const combined = [...apiTrips, ...formattedLocal];
      if (combined.length === 0) {
        // If driver is a demo driver (oviii@gmail.com / oviya@gmail.com), show default trips, else start empty []
        if (user?.email === 'oviii@gmail.com' || user?.email === 'oviya@gmail.com' || !user?.email) {
          setAssignedTrips(DEFAULT_DRIVER_TRIPS);
        } else {
          setAssignedTrips([]);
        }
      } else {
        // Unique by ID
        const unique = [];
        const seen = new Set();
        for (const trip of combined) {
          if (!seen.has(String(trip.id))) {
            seen.add(String(trip.id));
            unique.push(trip);
          }
        }
        setAssignedTrips(unique);
      }
    } catch (err) {
      console.error('Error fetching driver trips:', err);
      if (user?.email === 'oviii@gmail.com' || user?.email === 'oviya@gmail.com' || !user?.email) {
        setAssignedTrips(DEFAULT_DRIVER_TRIPS);
      } else {
        setAssignedTrips([]);
      }
    } finally {
      setLoadingTrips(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAssignedTrips();
      const interval = setInterval(fetchAssignedTrips, 8000);
      return () => clearInterval(interval);
    }
  }, [token]);



  const handleUpdateTripStatus = async (tripId, newStatus) => {
    // 1. Update local state immediately for instant UI feedback
    setAssignedTrips(prev => prev.map(trip => String(trip.id) === String(tripId) ? { ...trip, status: newStatus } : trip));

    // 2. Persist to company_assigned_bookings in localStorage
    const localAssigned = JSON.parse(localStorage.getItem('company_assigned_bookings') || '[]');
    const updatedLocal = localAssigned.map(b => String(b._id || b.id) === String(tripId) ? { ...b, status: newStatus } : b);
    localStorage.setItem('company_assigned_bookings', JSON.stringify(updatedLocal));

    showNotification(`✓ Trip status updated to: ${newStatus.replace('_', ' ').toUpperCase()}`);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      headers['x-mock-role'] = 'driver';
      headers['x-company-name'] = localStorage.getItem('company_name') || user?.company?.name || 'DriveX Rentals';

      await fetch(`/api/company-admin/driver/trips/${tripId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.warn('Error syncing trip status to backend:', err);
    }
  };

  const driverProfile = {
    name: user?.name || 'Karthik S. (Senior Chauffeur)',
    phone: user?.phone || '+91 98765 11111',
    companyName: user?.company?.name || localStorage.getItem('company_name') || 'DriveX Rentals',
    licenseNumber: 'TN-01202000456',
    experience: '6 Years Professional Driving',
    rating: 4.9,
    completedTrips: 142,
    docStatus: 'Verified & Approved',
    badge: '★ Elite Chauffeur'
  };

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'attendance', label: 'Attendance Logs' },
    { id: 'gps', label: 'GPS Tracking Sync' },
    { id: 'my-bookings', label: 'My Bookings' },
    { id: 'assigned-trips', label: 'Assigned Trips' },
    { id: 'pickup-details', label: 'Pickup Details' },
    { id: 'customer-details', label: 'Customer Details' },
    { id: 'earnings', label: 'Earnings' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'chat', label: 'Support Chat' },
    { id: 'profile', label: 'My Profile' },
  ];

  const getSimulatedStatus = (msg) => {
    if (msg.status === 'read') return 'read';
    if (msg.status === 'delivered') return 'delivered';

    const elapsed = Date.now() - new Date(msg.createdAt).getTime();
    if (elapsed < 2000) {
      return 'sent';
    } else if (elapsed < 4000) {
      return 'delivered';
    } else {
      return 'read';
    }
  };

  const renderStatusTicks = (msg) => {
    const status = getSimulatedStatus(msg);
    if (status === 'read') {
      return <span style={{ color: '#53bdeb', fontSize: '0.85rem', fontWeight: 'bold', marginLeft: '4px' }} title="Read">✓✓</span>;
    } else if (status === 'delivered') {
      return <span style={{ color: '#8696a0', fontSize: '0.85rem', fontWeight: 'bold', marginLeft: '4px' }} title="Delivered">✓✓</span>;
    } else {
      return <span style={{ color: '#8696a0', fontSize: '0.85rem', fontWeight: 'bold', marginLeft: '4px' }} title="Sent">✓</span>;
    }
  };

  const sanitizeLogoUrl = (url) => {
    let trimmed = (url || '').trim();
    if (!trimmed) return '';

    try {
      if (trimmed.includes('?')) {
        const urlObj = new URL(trimmed);
        const imageKeys = ['imgurl', 'imageurl', 'image', 'url', 'src', 'pic', 'img'];
        for (const key of imageKeys) {
          const val = urlObj.searchParams.get(key);
          if (val && (val.startsWith('http://') || val.startsWith('https://'))) {
            return val;
          }
        }
      }
    } catch (e) {
      try {
        const searchPart = trimmed.substring(trimmed.indexOf('?'));
        const params = new URLSearchParams(searchPart);
        const imageKeys = ['imgurl', 'imageurl', 'image', 'url', 'src', 'pic', 'img'];
        for (const key of imageKeys) {
          const val = params.get(key);
          if (val && (val.startsWith('http://') || val.startsWith('https://'))) {
            return decodeURIComponent(val);
          }
        }
      } catch (err) {}
    }

    const cleanUrl = trimmed.replace(/\/+$/, '');
    if (
      cleanUrl === 'https://www.forgeindiaconnect.com' ||
      cleanUrl === 'http://www.forgeindiaconnect.com' ||
      cleanUrl === 'https://forgeindiaconnect.com' ||
      cleanUrl === 'http://forgeindiaconnect.com'
    ) {
      return 'https://www.forgeindiaconnect.com/logo.jpg';
    }
    return trimmed;
  };

  const renderCompanyLogo = (size = 32, borderRadius = '8px') => {
    const logoUrl = sanitizeLogoUrl(user?.company?.logoUrl || localStorage.getItem('company_logo') || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=100');
    const companyName = driverProfile.companyName || localStorage.getItem('company_name') || 'Company';
    const firstLetter = companyName.charAt(0).toUpperCase();

    if (logoHasError || !logoUrl) {
      return (
        <div style={{
          width: `${size}px`, height: `${size}px`, borderRadius,
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 'bold', fontSize: `${size * 0.45}px`, border: '1px solid rgba(0,0,0,0.05)',
          textShadow: '0 1px 2px rgba(0,0,0,0.1)', flexShrink: 0
        }}>
          {firstLetter}
        </div>
      );
    }

    return (
      <img
        src={logoUrl}
        alt="Company Logo"
        onError={() => setLogoHasError(true)}
        style={{ width: `${size}px`, height: `${size}px`, borderRadius, objectFit: 'cover', border: '1px solid #bae6fd', flexShrink: 0 }}
      />
    );
  };

  if (user?.status === 'Rejected' || user?.status === 'rejected') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc', padding: '2rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ background: '#ffffff', borderRadius: '24px', padding: '3rem 2.5rem', maxWidth: '580px', width: '100%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.06)', border: '1px solid #fecdd3' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#ffe4e6', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.8rem', margin: '0 auto 1.5rem auto' }}>❌</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Driver Profile Application Rejected</h2>
          <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            Your chauffeur driver application was reviewed by Super Admin and rejected due to unverified Driving Licence or Selfie Photo documents.
          </p>
          <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c', padding: '0.85rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, marginBottom: '1.5rem' }}>
            🔴 Reason: Licence & Background Check Unverified. Please re-submit valid document proofs.
          </div>
          <button onClick={() => { logout(); window.location.href = '/'; }} style={{ background: '#059669', color: '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}>
            🔄 Re-submit Application
          </button>
        </div>
      </div>
    );
  }

  if (user?.status === 'Pending Approval' || user?.status === 'pending_approval') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc', padding: '2rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ background: '#ffffff', borderRadius: '24px', padding: '3rem 2.5rem', maxWidth: '580px', width: '100%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.8rem', margin: '0 auto 1.5rem auto' }}>⏳</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Awaiting Super Admin Approval</h2>
          <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            Thank you for registering as a <strong>Chauffeur Driver</strong>! Super Admin is currently reviewing your Driving Licence, Face selfie, and Aadhaar documents. Your Driver Console will unlock automatically once approved.
          </p>
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#b45309', padding: '0.85rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, marginBottom: '1.5rem' }}>
            🟡 Driver Status: Pending Verification
          </div>
          <button onClick={logout} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}>
            Back to Home Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#f8fafc' }}>
      
      {/* HEADER */}
      <header style={{
        height: '62px', background: '#ffffff', borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.75rem', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          {renderCompanyLogo(32, '8px')}
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.2rem', color: '#1e3a8a' }}>
            Driver Console
          </div>
          <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#059669', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 700, border: '1px solid #a7f3d0' }}>
            🏢 {driverProfile.companyName || localStorage.getItem('company_name') || 'Company'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Duty Status Toggle */}
          <button 
            onClick={handleToggleDutyStatus}
            style={{
              padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800,
              cursor: 'pointer', border: 'none',
              background: isOnDuty ? 'rgba(34,197,94,0.12)' : 'rgba(244,63,94,0.12)',
              color: isOnDuty ? '#16a34a' : '#dc2626'
            }}
          >
            {isOnDuty ? '🟢 ON DUTY (Available)' : '🔴 OFF DUTY'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#eff6ff', padding: '0.35rem 0.85rem', borderRadius: '20px', border: '1px solid #bfdbfe' }}>
            {renderCompanyLogo(20, '50%')}
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e40af' }}>
              {driverProfile.name} ({driverProfile.badge})
            </span>
          </div>

          {/* Notification Bell Dropdown */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => {
              setShowNotificationsDropdown(!showNotificationsDropdown);
              if (!showNotificationsDropdown) {
                localStorage.setItem(`last_read_notif_count_driver`, notifications.length);
                setUnreadCount(0);
              }
            }} style={{
              background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem', padding: '0.4rem', position: 'relative', display: 'flex', alignItems: 'center'
            }}>
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '0px', right: '0px', background: '#f43f5e', color: '#fff', fontSize: '0.65rem', fontWeight: 700, borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotificationsDropdown && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, width: '320px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', zIndex: 1000, marginTop: '0.5rem', padding: '0.5rem 0'
              }}>
                <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Notification History</span>
                  <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.75rem' }}>({notifications.length})</span>
                </div>
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n._id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #eff6ff', fontSize: '0.78rem', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 700, color: '#1e293b' }}>{n.title}</span>
                          <span style={{ color: '#64748b', fontSize: '0.68rem' }}>{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div style={{ color: '#475569', lineHeight: '1.3' }}>{n.message}</div>
                        <div style={{ fontSize: '0.65rem', color: '#2563eb', marginTop: '0.25rem', fontWeight: 600 }}>
                          Sender: {n.senderRole === 'super-admin' ? 'Platform Admin' : 'Company Manager'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={handleDriverLogout} className="btn" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', background: 'rgba(244,63,94,0.08)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '6px', fontWeight: 700 }}>
            Sign Out
          </button>
        </div>
      </header>

      {/* NOTIFICATION NOTICE TOAST */}
      {notice && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#ffffff',
            padding: '1.75rem 2.25rem',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔔</div>
            <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '1.05rem', marginBottom: '1.25rem', lineHeight: '1.4' }}>
              {notice}
            </div>
            <button 
              onClick={() => setNotice('')}
              className="btn btn-primary"
              style={{
                background: 'var(--accent-blue)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 2rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
              }}
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* SIDEBAR NAVIGATION */}
        <aside style={{ width: '230px', background: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <nav style={{ flex: 1, padding: '0.75rem 0', overflowY: 'auto' }}>
            {NAV_ITEMS.map(item => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '0.75rem 1.25rem', border: 'none',
                    background: isActive ? '#eff6ff' : 'transparent',
                    color: isActive ? '#2563eb' : '#475569',
                    borderLeft: isActive ? '4px solid #2563eb' : '4px solid transparent',
                    fontWeight: isActive ? 800 : 500, fontSize: '0.88rem', cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* CONTENT AREA */}
        <main style={{ flex: 1, padding: '1.75rem', overflowY: 'auto' }}>

          {/* ATTENDANCE & AUTOMATIC GPS STATUS BANNER */}
          {!isCheckedIn ? (
            <div style={{ padding: '1rem 1.25rem', background: '#fffbeb', borderLeft: '5px solid #f59e0b', color: '#b45309', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderRadius: '8px', border: '1px solid #fde68a', boxShadow: '0 2px 8px rgba(245,158,11,0.1)' }}>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>⚠️ ATTENDANCE REQUIRED FIRST</div>
                <div style={{ fontSize: '0.8rem', color: '#92400e', marginTop: '2px' }}>
                  Please mark your attendance first. Once attendance is verified, GPS map tracking will turn ON automatically until logout.
                </div>
              </div>
              <button 
                className="btn btn-warning" 
                style={{ fontSize: '0.82rem', background: '#f59e0b', borderColor: '#d97706', color: '#fff', padding: '0.5rem 1rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }} 
                onClick={() => handleStartAttendanceScan('in')}
              >
                🤳 Mark Attendance First
              </button>
            </div>
          ) : (
            <div style={{ padding: '1rem 1.25rem', background: '#f0fdf4', borderLeft: '5px solid #16a34a', color: '#15803d', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderRadius: '8px', border: '1px solid #bbf7d0', boxShadow: '0 2px 8px rgba(22,163,74,0.1)' }}>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>✓ ATTENDANCE MARKED & SHIFT ACTIVE</div>
                <div style={{ fontSize: '0.8rem', color: '#166534', marginTop: '2px' }}>
                  📡 Live GPS Map Tracking is AUTOMATICALLY ONLINE. (Will turn OFF upon logout).
                </div>
              </div>
              <span style={{ fontSize: '0.78rem', background: '#dcfce7', color: '#15803d', padding: '0.35rem 0.75rem', borderRadius: '20px', fontWeight: 800, border: '1px solid #86efac' }}>
                ● GPS Live Map Active
              </span>
            </div>
          )}

          {/* GPS Permission Prompt & Notice Banner */}
          {gpsPermissionStatus === 'prompt' && (
            <div style={{ padding: '1rem', background: '#fef3c7', borderLeft: '4px solid #f59e0b', color: '#b45309', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderRadius: '6px', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                GPS Location permission is required for real-time fleet operations. Please grant permission for accurate driver routing.
              </div>
              <button className="btn" style={{ fontSize: '0.78rem', background: '#d97706', border: 'none', color: '#fff', padding: '0.35rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }} onClick={requestGpsPermission}>
                Grant GPS Permission
              </button>
            </div>
          )}
          {gpsPermissionStatus === 'denied' && (
            <div style={{ padding: '1rem', background: '#fee2e2', borderLeft: '4px solid #ef4444', color: '#b91c1c', marginBottom: '1.5rem', borderRadius: '6px', border: '1px solid #fca5a5', fontSize: '0.85rem', fontWeight: 600 }}>
              🔴 GPS Permission was denied. Real-time updates will use high-accuracy simulation coordinates. You can reset permission in your browser settings.
            </div>
          )}

          {/* TOP STAT CARDS DISPLAYED IN ALL TABS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #2563eb' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Assigned Trips Today</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1e3a8a' }}>{assignedTrips.length}</div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Completed Lifetime Trips</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669' }}>{driverProfile.completedTrips}</div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #7c3aed' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Driver Allowance Earnings</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#7c3aed' }}>₹6,000</div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #eab308' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Customer Feedback Rating</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ca8a04' }}>★ {driverProfile.rating}</div>
            </div>
          </div>

          {/* 1. DASHBOARD OVERVIEW */}
          {activeNav === 'dashboard' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>Driver Overview Dashboard</h2>
                <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Welcome back, {driverProfile.name}. Here is your operational status today:</p>
              </div>

              {/* NEXT ASSIGNED TRIP HIGHLIGHT */}
              <div className="card" style={{ padding: '1.5rem', background: '#ffffff', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <h4 style={{ fontSize: '1.1rem', margin: 0, fontFamily: 'var(--font-heading)', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span 
                      onClick={() => setShowLocationModal(true)} 
                      style={{ cursor: 'pointer', background: '#eff6ff', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid #bfdbfe', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s', fontWeight: 800 }}
                      title="Click drive icon to view live location"
                    >
                      🚗 Live Drive Location (Click Here)
                    </span>
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => setShowLocationModal(true)}
                    style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.25)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    📍 Where Am I? (Show Live GPS)
                  </button>
                </div>
                {assignedTrips.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', fontSize: '0.85rem' }}>
                    <div>
                      <div style={{ marginBottom: '0.4rem' }}><strong>Vehicle:</strong> {assignedTrips[0].vehicleName}</div>
                      <div style={{ marginBottom: '0.4rem' }}><strong>Renter Customer:</strong> {assignedTrips[0].customerName} ({assignedTrips[0].customerPhone})</div>
                      <div style={{ marginBottom: '0.4rem' }}><strong>Pickup Time:</strong> {assignedTrips[0].pickupTime} ({assignedTrips[0].startDate})</div>
                      <div><strong>Allowance:</strong> ₹{assignedTrips[0].allowance}</div>
                    </div>
                    <div>
                      <div style={{ marginBottom: '0.4rem' }}><strong>Pickup Location:</strong> {assignedTrips[0].pickupLocation}</div>
                      <div style={{ marginBottom: '0.4rem' }}><strong>Destination:</strong> {assignedTrips[0].dropLocation}</div>
                      <div><strong>Status:</strong> <span style={{ background: '#fef3c7', color: '#d97706', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>{assignedTrips[0].status}</span></div>
                    </div>
                  </div>
                ) : (
                  <div>No upcoming trips scheduled at the moment.</div>
                )}
              </div>
            </div>
          )}

          {/* ATTENDANCE logs PANEL */}
          {activeNav === 'attendance' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>📋 Driver Attendance Desk</h2>
                <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Clock in daily shifts and verify your biometrics securely.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem' }}>
                {/* Clock Card & Action */}
                <div className="card" style={{ padding: '1.5rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e3a8a' }}>Daily shift tracker</span>
                    <span style={{
                      padding: '0.3rem 0.75rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 'bold',
                      background: isCheckedIn ? '#dcfce7' : '#fee2e2',
                      color: isCheckedIn ? '#166534' : '#991b1b'
                    }}>
                      {isCheckedIn ? '🟢 Active Shift' : '🔴 Off duty'}
                    </span>
                  </div>

                  <div style={{ textAlign: 'center', padding: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e3a8a', letterSpacing: '1px' }}>
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                      {new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      className="btn"
                      disabled={isCheckedIn}
                      style={{
                        flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: isCheckedIn ? 'not-allowed' : 'pointer',
                        background: isCheckedIn ? '#cbd5e1' : '#2563eb',
                        color: '#fff'
                      }}
                      onClick={() => handleStartAttendanceScan('in')}
                    >
                      Clock In ⚡
                    </button>
                    <button
                      className="btn"
                      disabled={!isCheckedIn}
                      style={{
                        flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: !isCheckedIn ? 'not-allowed' : 'pointer',
                        background: !isCheckedIn ? '#cbd5e1' : '#f43f5e',
                        color: '#fff'
                      }}
                      onClick={() => handleStartAttendanceScan('out')}
                    >
                      Clock Out 🛑
                    </button>
                  </div>

                  <div style={{ marginTop: '1.25rem', padding: '0.75rem', borderLeft: '4px solid #10b981', background: '#ecfdf5', borderRadius: '0 8px 8px 0', fontSize: '0.75rem', color: '#065f46' }}>
                    <strong>💡 Face Match Biometric:</strong> Daily punch actions require face verification matching with corporate driver registry logs to avoid proxy punch.
                  </div>
                </div>

                {/* Logs History Table */}
                <div className="card" style={{ padding: '1.5rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '1rem', fontFamily: 'var(--font-heading)', color: '#1e3a8a', marginBottom: '1rem' }}>
                    🗓️ Attendance Shift Log History
                  </h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="custom-table" style={{ width: '100%', fontSize: '0.8rem' }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Clock In</th>
                          <th>Clock Out</th>
                          <th>Working Hours</th>
                          <th>Verification</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceLogs.map((log, index) => (
                          <tr key={index}>
                            <td style={{ fontWeight: 700 }}>{log.date}</td>
                            <td style={{ color: '#16a34a', fontWeight: 'bold' }}>{log.clockIn}</td>
                            <td style={{ color: log.clockOut === '--' ? '#64748b' : '#dc2626', fontWeight: 'bold' }}>{log.clockOut}</td>
                            <td>{log.duration}</td>
                            <td>
                              <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#047857', padding: '0.15rem 0.45rem', borderRadius: '6px', fontWeight: 'bold' }}>
                                {log.method}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GPS TRACKING SYNC PANEL */}
          {activeNav === 'gps' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>Live GPS Telemetry Sync</h2>
                <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Control real-time location updates shared with your Company Operations Manager.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem' }}>
                {/* Status Card & Controls */}
                <div className="card" style={{ padding: '1.5rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e3a8a' }}>GPS Sharing Status</span>
                    <button
                      onClick={handleToggleDutyStatus}
                      style={{
                        padding: '0.5rem 1rem', borderRadius: '20px', border: 'none', fontWeight: 'bold', cursor: 'pointer',
                        background: isOnDuty ? '#dcfce7' : '#fee2e2',
                        color: isOnDuty ? '#15803d' : '#b91c1c'
                      }}
                    >
                      {isOnDuty ? '🟢 ACTIVE (ON DUTY)' : '🔴 PAUSED (OFF DUTY)'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Latitude:</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#0f172a' }}>{gpsCoords.lat.toFixed(5)}° N</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Longitude:</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#0f172a' }}>{gpsCoords.lng.toFixed(5)}° E</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>GPS Permission:</span>
                      <span style={{
                        fontSize: '0.8rem', fontWeight: 'bold',
                        color: gpsPermissionStatus === 'granted' ? '#15803d' : gpsPermissionStatus === 'denied' ? '#b91c1c' : '#d97706'
                      }}>
                        {gpsPermissionStatus.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Simulated Speed:</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#15803d' }}>{isOnDuty ? '45 km/h' : '0 km/h (Stopped)'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>GPS Address:</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#1e3a8a', textAlign: 'right', maxWidth: '180px' }}>Chennai Central Station Hub</span>
                    </div>
                  </div>

                  <div style={{ padding: '0.8rem', borderLeft: '4px solid #3b82f6', background: '#eff6ff', borderRadius: '0 8px 8px 0', fontSize: '0.78rem', color: '#1d4ed8' }}>
                    <strong>💡 Live Update Indicator:</strong> Coordinates shift dynamically to simulate active driving along highway routes. The Operations Desk uses this coordinates path for real-time customer support.
                  </div>
                </div>

                {/* Live GPS Map */}
                <div className="card" style={{ padding: '1.5rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: '360px' }}>
                  <h4 style={{ fontSize: '1rem', fontFamily: 'var(--font-heading)', color: '#1e3a8a', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>📍 Live Location Map</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal' }}>Updates dynamically</span>
                  </h4>

                  <div style={{ flex: 1, position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                    <div id="driver-live-map-canvas" style={{ width: '100%', height: '100%', minHeight: '250px' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. MY BOOKINGS */}
          {activeNav === 'my-bookings' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>My Rental Booking History</h2>
                  <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Complete history of your assigned rental vehicle bookings and completed journeys</p>
                </div>
                <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800 }}>
                  Total Bookings: {assignedTrips.length}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ padding: '1.15rem', borderLeft: '4px solid #2563eb', background: '#fff' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>COMPLETED TRIPS</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1d4ed8', marginTop: 2 }}>{driverProfile.completedTrips}</div>
                  <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: 2 }}>★ Rating {driverProfile.rating} / 5.0</div>
                </div>
                <div className="card" style={{ padding: '1.15rem', borderLeft: '4px solid #10b981', background: '#fff' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>ACTIVE ASSIGNED TRIPS</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#059669', marginTop: 2 }}>
                    {assignedTrips.filter(t => t.status !== 'Completed' && t.status !== 'trip_finished').length}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: 2 }}>✓ Ready for dispatch</div>
                </div>
                <div className="card" style={{ padding: '1.15rem', borderLeft: '4px solid #d97706', background: '#fff' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>TOTAL ALLOWANCE EARNED</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#b45309', marginTop: 2 }}>
                    ₹{assignedTrips.reduce((sum, t) => sum + (Number(t.allowance) || 1200), 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#d97706', marginTop: 2 }}>₹1,200 / day rate</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {assignedTrips.map(trip => (
                  <div key={trip.id} className="card" style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800 }}>BOOKING ID #{trip.id}</div>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>🚗 {trip.vehicleName}</div>
                      </div>
                      <span className={`badge ${trip.status === 'Completed' || trip.status === 'trip_finished' ? 'badge-success' : 'badge-info'}`} style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', fontWeight: 800 }}>
                        {trip.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.82rem', color: '#334155', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ color: '#64748b', fontSize: '0.72rem' }}>CUSTOMER DETAILS</div>
                        <div style={{ fontWeight: 800, color: '#0f172a', marginTop: 2 }}>👤 {trip.customerName}</div>
                        <div style={{ color: '#2563eb', fontWeight: 700 }}>📞 {trip.customerPhone}</div>
                      </div>
                      <div>
                        <div style={{ color: '#64748b', fontSize: '0.72rem' }}>TRIP SCHEDULE</div>
                        <div style={{ fontWeight: 700, marginTop: 2 }}>📅 {trip.startDate} to {trip.endDate}</div>
                        <div style={{ color: '#059669', fontWeight: 700 }}>⏰ Pickup: {trip.pickupTime}</div>
                      </div>
                      <div>
                        <div style={{ color: '#64748b', fontSize: '0.72rem' }}>DRIVER ALLOWANCE</div>
                        <div style={{ fontWeight: 900, fontSize: '1rem', color: '#b45309', marginTop: 2 }}>₹{trip.allowance}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Paid by Company</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                      <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem' }} onClick={() => setActiveNav('assigned-trips')}>
                        ▶️ Manage Trip Status
                      </button>
                      <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem' }} onClick={() => setActiveNav('pickup-details')}>
                        📍 View Pickup Route
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. ASSIGNED TRIPS */}
          {activeNav === 'assigned-trips' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>Assigned Chauffeur Trips</h2>
                  <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Live dispatch console: Accept trip, start journey & update arrival status</p>
                </div>
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800 }}>
                  ● Active Dispatch Connected
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {assignedTrips.map(trip => (
                  <div key={trip.id} className="card" style={{ padding: '1.5rem', borderLeft: '5px solid #2563eb', background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1e3a8a' }}>TRIP ORDER #{trip.id}</span>
                        <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', color: '#475569', fontWeight: 700 }}>🚗 {trip.vehicleName}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', background: trip.status === 'Completed' || trip.status === 'trip_finished' ? '#dcfce7' : '#fef3c7', color: trip.status === 'Completed' || trip.status === 'trip_finished' ? '#166534' : '#b45309', padding: '0.3rem 0.75rem', borderRadius: '6px', fontWeight: 800 }}>
                        STATUS: {trip.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', fontSize: '0.84rem', marginBottom: '1rem', color: '#334155' }}>
                      <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 800, color: '#1e3a8a', marginBottom: '0.4rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>👤 Renter Customer Contact</div>
                        <div>Name: <strong>{trip.customerName}</strong></div>
                        <div>Phone: <strong>{trip.customerPhone}</strong></div>
                        <div>Dates: <strong>{trip.startDate} to {trip.endDate}</strong></div>
                        <div>Reporting Time: <strong>{trip.pickupTime}</strong></div>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 800, color: '#1e3a8a', marginBottom: '0.4rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>📍 Route & Allowance</div>
                        <div>Pickup Spot: <strong>{trip.pickupLocation}</strong></div>
                        <div>Destination: <strong>{trip.dropLocation}</strong></div>
                        <div>Driver Allowance: <strong style={{ color: '#b45309' }}>₹{trip.allowance}</strong></div>
                        <div>Dispatch Note: <em>{trip.notes}</em></div>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem', alignItems: 'center' }}>
                      {(trip.status === 'approved' || trip.status === 'confirmed' || trip.status === 'Assigned') && (
                        <button className="btn btn-success" style={{ fontSize: '0.8rem', padding: '0.45rem 1rem', fontWeight: 800 }} onClick={() => handleUpdateTripStatus(trip.id, 'trip_accepted')}>
                          ✓ Accept Trip Assignment
                        </button>
                      )}

                      {(trip.status === 'trip_accepted' || trip.status === 'Accepted') && (
                        <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.45rem 1rem', background: '#2563eb', fontWeight: 800 }} onClick={() => handleUpdateTripStatus(trip.id, 'in_progress')}>
                          ▶️ Start Journey Drive
                        </button>
                      )}

                      {(trip.status === 'in_progress' || trip.status === 'Trip Started') && (
                        <button className="btn btn-success" style={{ fontSize: '0.8rem', padding: '0.45rem 1rem', background: '#10b981', fontWeight: 800 }} onClick={() => handleUpdateTripStatus(trip.id, 'trip_finished')}>
                          🏁 Complete Trip & Vehicle Return
                        </button>
                      )}

                      {(trip.status === 'trip_finished' || trip.status === 'Trip Completed' || trip.status === 'Completed') && (
                        <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 800, background: '#dcfce7', padding: '0.35rem 0.75rem', borderRadius: '6px' }}>
                          ✓ Trip Completed Successfully!
                        </span>
                      )}

                      <a href={`tel:${trip.customerPhone}`} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.45rem 1rem', textDecoration: 'none', fontWeight: 700 }}>
                        📞 Call Customer
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. PICKUP DETAILS */}
          {activeNav === 'pickup-details' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>Pickup & Navigation Details</h2>
                  <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Exact pickup spot, Google Maps route navigation link & customer pickup notes</p>
                </div>
                <span style={{ background: '#eff6ff', color: '#2563eb', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800 }}>
                  🗺️ Google Maps Navigation Active
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
                {assignedTrips.map(trip => (
                  <div key={trip.id} className="card" style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e3a8a' }}>📍 TRIP #{trip.id} PICKUP SPOT</span>
                      <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{trip.pickupTime}</span>
                    </div>

                    <div style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#334155', marginBottom: '1.25rem' }}>
                      <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '0.85rem' }}>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800 }}>EXACT PICKUP LOCATION</div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginTop: 2 }}>{trip.pickupLocation}</div>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '0.85rem' }}>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800 }}>DESTINATION / DROP LOCATION</div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginTop: 2 }}>{trip.dropLocation}</div>
                      </div>

                      <div>👤 <strong>Renter Name:</strong> {trip.customerName}</div>
                      <div>📞 <strong>Phone Number:</strong> {trip.customerPhone}</div>
                      <div>🚗 <strong>Assigned Car:</strong> {trip.vehicleName}</div>
                      <div>📝 <strong>Pickup Instructions:</strong> <em>{trip.notes}</em></div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(trip.pickupLocation)}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn btn-primary" 
                        style={{ width: '100%', padding: '0.55rem', fontSize: '0.82rem', fontWeight: 800, textAlign: 'center', textDecoration: 'none', background: '#2563eb' }}
                      >
                        🗺️ Open Navigation Route in Google Maps
                      </a>
                      <a 
                        href={`tel:${trip.customerPhone}`} 
                        className="btn btn-secondary" 
                        style={{ width: '100%', padding: '0.55rem', fontSize: '0.82rem', fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}
                      >
                        📞 Call Customer for Pickup Confirmation
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. CUSTOMER DETAILS */}
          {activeNav === 'customer-details' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>Customer Profile & Contact Information</h2>
                  <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Verified renter credentials, emergency contacts & customer ratings</p>
                </div>
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800 }}>
                  ✓ KYC Compliance Verified
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {assignedTrips.map(trip => (
                  <div key={trip.id} className="card" style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem' }}>
                        {trip.customerName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{trip.customerName}</div>
                        <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#15803d', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
                          ✓ Verified Renter (KYC Approved)
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.84rem', lineHeight: '1.7', color: '#334155', marginBottom: '1.25rem' }}>
                      <div>📞 <strong>Mobile Phone:</strong> {trip.customerPhone}</div>
                      <div>✉️ <strong>Email Address:</strong> customer.renter@gmail.com</div>
                      <div>📍 <strong>Address:</strong> {trip.pickupLocation}</div>
                      <div>🚨 <strong>Emergency Contact:</strong> +91 98765 00000</div>
                      <div>⭐ <strong>Renter Rating:</strong> <span style={{ color: '#d97706', fontWeight: 800 }}>★ {trip.customerRating} / 5.0</span></div>
                      <div>🚘 <strong>Booked Trip:</strong> #{trip.id} ({trip.vehicleName})</div>
                    </div>

                    <a 
                      href={`tel:${trip.customerPhone}`} 
                      className="btn btn-primary" 
                      style={{ width: '100%', padding: '0.55rem', textDecoration: 'none', textAlign: 'center', fontSize: '0.82rem', fontWeight: 800, background: '#2563eb' }}
                    >
                      📞 Call Customer Direct
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. EARNINGS */}
          {activeNav === 'earnings' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>Driver Allowance & Earnings Log</h2>
                <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Daily allowances (₹1,200/day) & completed trip payouts</p>
              </div>

              <div className="card" style={{ padding: '1.5rem', maxWidth: '750px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Total Chauffeur Allowance Earned</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669' }}>₹6,000</div>
                  </div>
                  <span className="badge badge-success">PAYOUT STATUS: SETTLED</span>
                </div>

                <table className="custom-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Trip ID</th><th>Duration</th><th>Daily Rate</th><th>Total Allowance</th><th>Payout Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>#TRIP-7001</td><td>3 Days</td><td>₹1,200 / day</td><td style={{ fontWeight: 800, color: '#059669' }}>₹3,600</td><td><span style={{ color: '#059669', fontWeight: 700 }}>✓ Paid</span></td>
                    </tr>
                    <tr>
                      <td>#TRIP-7002</td><td>2 Days</td><td>₹1,200 / day</td><td style={{ fontWeight: 800, color: '#059669' }}>₹2,400</td><td><span style={{ color: '#d97706', fontWeight: 700 }}>⏳ Processing</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. NOTIFICATIONS */}
          {activeNav === 'notifications' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>Company Driver Notifications</h2>
                <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Broadcast messages sent by your rental company admin</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '650px' }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <p>No notifications received from your company yet.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n._id} className="card" style={{ padding: '1.25rem', borderLeft: `4px solid ${n.senderRole === 'super-admin' ? '#f43f5e' : '#2563eb'}`, textAlign: 'left' }}>
                      <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.95rem' }}>{n.title}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '2px 0 0.5rem 0' }}>
                        Sent by: {n.senderRole === 'super-admin' ? 'Platform Admin' : 'Company Manager'} • {new Date(n.createdAt).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: '1.4' }}>
                        {n.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 7.5. SUPPORT CHAT MODULE */}
          {activeNav === 'chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>💬 Driver Support Chat Room</h2>
                <p style={{ color: '#64748b', fontSize: '0.88rem' }}>WhatsApp-style direct messaging channel with Company Manager, Super Admin, and Customers</p>
              </div>

              <div className="card" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 0, overflow: 'hidden', height: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                {/* Chat header & Channel Selector */}
                <div style={{ background: '#f8fafc', padding: '0.75rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', border: '1px solid #bae6fd' }}>
                      {driverChatChannel === 'super-admin' ? '👑' : driverChatChannel === 'customer' ? '👤' : '🏢'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e3a8a' }}>
                        {driverChatChannel === 'super-admin' ? 'Super Admin Support Desk' : driverChatChannel === 'customer' ? 'Assigned Passenger / Renter' : 'Company Operations Manager'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }}></span> Connected & Online
                      </div>
                    </div>
                  </div>

                  {/* Channel Switcher Buttons */}
                  <div style={{ display: 'flex', gap: '0.35rem', background: '#e2e8f0', padding: '0.2rem', borderRadius: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setDriverChatChannel('company-admin')}
                      style={{ background: driverChatChannel === 'company-admin' ? '#2563eb' : 'transparent', color: driverChatChannel === 'company-admin' ? '#fff' : '#475569', border: 'none', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      🏢 Company Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => setDriverChatChannel('super-admin')}
                      style={{ background: driverChatChannel === 'super-admin' ? '#7c3aed' : 'transparent', color: driverChatChannel === 'super-admin' ? '#fff' : '#475569', border: 'none', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      👑 Super Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => setDriverChatChannel('customer')}
                      style={{ background: driverChatChannel === 'customer' ? '#059669' : 'transparent', color: driverChatChannel === 'customer' ? '#fff' : '#475569', border: 'none', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      👤 Customer
                    </button>
                  </div>
                </div>

                {/* Messages stream */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#efeae2' }}>
                  {(() => {
                    const filtered = chatMessages.filter(msg => {
                      if (driverChatChannel === 'super-admin') {
                        return msg.receiverRole === 'super-admin' || msg.senderRole === 'super-admin';
                      }
                      if (driverChatChannel === 'customer') {
                        return msg.receiverRole === 'customer' || msg.senderRole === 'customer';
                      }
                      return msg.receiverRole === 'company-admin' || msg.senderRole === 'company-admin' || msg.senderRole === 'driver';
                    });

                    if (filtered.length === 0) {
                      return (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#667781', gap: '0.5rem', padding: '3rem 1rem' }}>
                          <span style={{ fontSize: '2.5rem' }}>💬</span>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                            No messages with {driverChatChannel === 'super-admin' ? 'Super Admin' : driverChatChannel === 'customer' ? 'Customer' : 'Company Manager'} yet.
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Type your support message below and click Send 🚀.
                          </div>
                        </div>
                      );
                    }

                    return filtered.map((msg) => {
                      const myEmail = user?.email ? user.email.trim().toLowerCase() : '';
                      const isMe = msg.senderRole === 'driver' || (msg.senderEmail && msg.senderEmail.trim().toLowerCase() === myEmail) || String(msg.senderId).includes('drv') || String(msg.senderId) === 'd1';

                      return (
                        <div 
                          key={msg._id || msg.id} 
                          style={{ 
                            display: 'flex', 
                            justifyContent: isMe ? 'flex-end' : 'flex-start',
                            width: '100%'
                          }}
                        >
                          <div style={{
                            maxWidth: '75%',
                            background: isMe ? '#d9fdd3' : '#ffffff',
                            color: '#111b21',
                            padding: '0.6rem 0.85rem',
                            borderRadius: isMe ? '8px 0px 8px 8px' : '0px 8px 8px 8px',
                            boxShadow: '0 1px 1.5px rgba(11,20,26,.13)',
                            border: 'none',
                            position: 'relative'
                          }}>
                            {!isMe && (
                              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#00a884', marginBottom: '0.15rem' }}>
                                {msg.senderName || (driverChatChannel === 'super-admin' ? '👑 Super Admin' : driverChatChannel === 'customer' ? '👤 Customer' : '🏢 Company Operations Desk')}
                              </div>
                            )}
                            <div style={{ fontSize: '0.85rem', lineHeight: '1.4', wordBreak: 'break-word' }}>
                              {msg.message.startsWith('[Attached File]') ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(0,0,0,0.03)', padding: '0.5rem', borderRadius: '6px', marginTop: '0.25rem', minWidth: '180px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.5rem' }}>📄</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#111b21', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{msg.message.replace('[Attached File] ', '')}</div>
                                      <div style={{ fontSize: '0.65rem', color: '#667781' }}>{msg.message.toLowerCase().includes('jpg') || msg.message.toLowerCase().includes('png') || msg.message.toLowerCase().includes('gif') ? 'Image Preview' : 'Document'} • 1.2 MB</div>
                                    </div>
                                  </div>
                                  {(msg.message.toLowerCase().includes('jpg') || msg.message.toLowerCase().includes('png') || msg.message.toLowerCase().includes('jpeg') || msg.message.toLowerCase().includes('webp')) && (
                                    <img src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=200" alt="Attachment" style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '4px' }} />
                                  )}
                                  <button type="button" onClick={(e) => { e.preventDefault(); handleDownloadChatDoc(msg.message, msg.fileUrl); }} style={{ fontSize: '0.72rem', color: '#00a884', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    📥 Download File
                                  </button>
                                </div>
                              ) : msg.message.startsWith('[Voice Message]') ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.25rem 0', minWidth: '180px' }}>
                                  <button type="button" onClick={() => handlePlayVoiceAudioMsg(msg._id, msg.message)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: playingVoiceId === msg._id ? '#dc2626' : '#00a884', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 2px 5px rgba(0,0,0,0.15)' }}>
                                    {playingVoiceId === msg._id ? '⏸️' : '▶️'}
                                  </button>
                                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '14px' }}>
                                      {[3, 8, 5, 9, 4, 7, 3, 8, 6, 9, 4, 7, 5, 8, 3, 6, 4, 8].map((h, i) => (
                                        <div key={i} style={{ width: '2px', height: `${h * 1.5}px`, background: playingVoiceId === msg._id ? '#2563eb' : '#8696a0', borderRadius: '1px', transition: 'height 0.2s ease' }}></div>
                                      ))}
                                    </div>
                                    <div style={{ fontSize: '0.68rem', color: playingVoiceId === msg._id ? '#2563eb' : '#667781', fontWeight: playingVoiceId === msg._id ? 800 : 400 }}>
                                      {playingVoiceId === msg._id ? '🔊 Playing Voice Note...' : `🎙️ Voice Message (${msg.message.replace('[Voice Message] ', '')})`}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                msg.message
                              )}
                            </div>
                            <div style={{ fontSize: '0.62rem', color: '#667781', textAlign: 'right', marginTop: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {isMe && renderStatusTicks(msg)}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* WhatsApp Style Chat Input Panel */}
                {!isRecording ? (
                  <form onSubmit={handleSendChatMessage} style={{ padding: '0.75rem 1rem', borderTop: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Attach File"
                    >
                      📎
                    </button>
                    
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Record Voice"
                    >
                      🎙️
                    </button>

                    <input 
                      type="text" 
                      placeholder="Type support message to Operations Manager..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      style={{ flex: 1, padding: '0.6rem 0.85rem', borderRadius: '24px', border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' }}
                    />
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ 
                        padding: '0.5rem 1.25rem', borderRadius: '24px', background: '#2563eb', border: 'none', color: '#ffffff', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.25rem' 
                      }}
                    >
                      Send 🚀
                    </button>
                  </form>
                ) : (
                  <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#dc2626', fontWeight: 600, fontSize: '0.85rem' }}>
                      <span style={{
                        display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626',
                        animation: 'pulseGlow 1s infinite alternate'
                      }}></span>
                      <span>🎙️ Recording Voice Message... {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60) < 10 ? '0' : ''}{recordingSeconds % 60}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <button
                        type="button"
                        onClick={cancelVoiceRecording}
                        style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        ❌ Cancel
                      </button>
                      <button
                        type="button"
                        onClick={sendVoiceRecording}
                        style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', background: '#dcfce7', border: '1px solid #bbf7d0', color: '#16a34a', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        ✔️ Send Message
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 8. MY PROFILE */}
          {activeNav === 'profile' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>Driver Credentials & Profile</h2>
                <p style={{ color: '#64748b', fontSize: '0.88rem' }}>License details, company affiliation & driver badge</p>
              </div>

              <div className="card" style={{ padding: '1.75rem', maxWidth: '600px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.25rem' }}>
                  <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #2563eb', background: '#f1f5f9', flexShrink: 0 }}>
                    {driverFacePhoto ? (
                      <img src={driverFacePhoto} alt="Driver Face" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', fontWeight: 800 }}>
                        👨‍✈️
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{driverProfile.name}</h3>
                    <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 700 }}>{driverProfile.badge}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{driverProfile.companyName}</div>
                  </div>
                </div>

                {/* DRIVER FACE PHOTO WEBCAM CAPTURE & FILE UPLOAD BUTTONS */}
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '0.5rem' }}>
                    🤳 Biometric Face Registration & Photo Upload
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.85rem' }}>
                    Capture live webcam face scan or upload photo for biometric verification.
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setIsDriverFaceModalOpen(true)}
                      style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      🤳 Scan Face via Webcam
                    </button>
                    <label style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      📁 Upload Face Photo
                      <input type="file" accept="image/*" onChange={handleFaceFileInput} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem', color: '#334155' }}>
                  <div>🪪 <strong>Driving License No:</strong> {driverProfile.licenseNumber}</div>
                  <div>📞 <strong>Contact Phone:</strong> {driverProfile.phone}</div>
                  <div>🏅 <strong>Experience:</strong> {driverProfile.experience}</div>
                  <div>⭐ <strong>Chauffeur Rating:</strong> ★ {driverProfile.rating} / 5.0</div>
                  <div>✅ <strong>Document Status:</strong> <span style={{ color: '#059669', fontWeight: 700 }}>{driverProfile.docStatus}</span></div>
                </div>
              </div>
            </div>
          )}
          {/* ATTENDANCE FACE SCAN VERIFICATION MODAL */}
          <FaceScanModal
            isOpen={isFaceModalOpen}
            actionType={punchActionType}
            personName={driverProfile.name}
            onSuccess={handleFaceScanSuccess}
            onClose={() => setIsFaceModalOpen(false)}
          />

          {/* DRIVER PROFILE FACE REGISTRATION WEBCAM MODAL */}
          <FaceScanModal
            isOpen={isDriverFaceModalOpen}
            actionType="register"
            personName={driverProfile.name}
            onSuccess={(capturedDataUrl) => {
              setIsDriverFaceModalOpen(false);
              if (capturedDataUrl) {
                handleDriverFaceUpload(capturedDataUrl);
              }
            }}
            onClose={() => setIsDriverFaceModalOpen(false)}
          />

          {/* 📍 LIVE DRIVER GPS LOCATION POPUP MODAL */}
          {showLocationModal && (
            <div onClick={() => setShowLocationModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, animation: 'fadeIn 0.2s ease-out' }}>
              <div onClick={e => e.stopPropagation()} style={{ background: '#ffffff', width: '92%', maxWidth: '620px', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.8rem' }}>🚗</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e3a8a', fontWeight: 900 }}>Live Driver GPS Location & Route Telemetry</h3>
                      <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>● GPS Live Sync Active • {isOnDuty ? '🟢 ON DUTY (Live Tracking Active)' : '🔴 OFF DUTY'}</div>
                    </div>
                  </div>
                  <button onClick={() => setShowLocationModal(false)} style={{ background: '#f1f5f9', border: 'none', fontSize: '1.2rem', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 800, color: '#64748b' }}>×</button>
                </div>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>CURRENT LIVE ADDRESS & COORDINATES</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', marginTop: '0.25rem' }}>
                    📍 Guindy Industrial Estate, Mount Road, Chennai, Tamil Nadu - 600032
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 700, marginTop: '0.35rem' }}>
                    GPS Coordinates: {gpsCoords.lat.toFixed(5)}° N, {gpsCoords.lng.toFixed(5)}° E • Speed: {isOnDuty ? '42 km/h' : '0 km/h'} • Accuracy: ±3.2m
                  </div>
                </div>

                <div style={{ position: 'relative', height: '270px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1', marginBottom: '1.25rem' }}>
                  <iframe 
                    title="Live Driver Location Map Modal" 
                    src={`https://maps.google.com/maps?q=${gpsCoords.lat},${gpsCoords.lng}&z=15&output=embed`} 
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  ></iframe>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    onClick={() => { setShowLocationModal(false); setActiveNav('gps'); }} 
                    style={{ flex: 1, background: '#2563eb', color: '#fff', border: 'none', padding: '0.7rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    📍 Open Full Interactive GPS Telemetry Map Tab
                  </button>
                  <button 
                    onClick={() => setShowLocationModal(false)} 
                    style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '0.7rem 1.25rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
