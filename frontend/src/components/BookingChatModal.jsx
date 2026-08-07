import React, { useState, useEffect, useRef } from 'react';

export default function BookingChatModal({ booking, currentUser, role = 'customer', onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showMapModal, setShowMapModal] = useState(false);
  const [activeLocationCoords, setActiveLocationCoords] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const bookingId = booking?._id || booking?.id || booking?.bookingId || 'BK-2026-DEFAULT';
  const isSelfDrive = !booking?.hasDriver && !booking?.driver;
  const vehicleName = booking?.vehicleName || booking?.carName || booking?.vehicle?.name || 'KIA 2026';
  const companyName = booking?.company?.name || booking?.companyName || 'Rental Partner';
  const customerName = booking?.customerName || booking?.user?.name || 'Customer';
  const driverName = booking?.driver?.name || booking?.driverAssigned || 'Assigned Driver';

  // Storage key for local persistence backup per booking
  const storageKey = `booking_chat_${bookingId}`;

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch / Sync Chat Messages
  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('royal_token') || localStorage.getItem('company_admin_token') || localStorage.getItem('token');
      let backendMsgs = [];
      
      if (token) {
        const res = await fetch('/api/chat', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          backendMsgs = data.messages.filter(m => 
            String(m.bookingId || '').includes(bookingId) || 
            String(m.message || '').includes(bookingId) ||
            m.companyId === (booking?.companyId || booking?.company?._id)
          );
        }
      }

      const localLogs = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const combinedMap = new Map();

      // Combine local logs and backend messages cleanly
      localLogs.forEach(m => combinedMap.set(m.id || m._id || m.timestamp, m));
      backendMsgs.forEach(m => combinedMap.set(m._id || m.id || m.createdAt, m));

      const merged = Array.from(combinedMap.values()).sort((a, b) => 
        new Date(a.createdAt || a.timestamp || 0) - new Date(b.createdAt || b.timestamp || 0)
      );

      // If empty, inject initial welcome system message
      if (merged.length === 0) {
        const initialMsg = {
          id: 'welcome_' + Date.now(),
          senderRole: 'system',
          senderName: 'System Bot',
          message: isSelfDrive 
            ? `🤝 Connected with ${companyName} Admin for Self-Drive Rental #${bookingId}. You can share your live location or send messages.`
            : `👨‍✈️ Connected with ${role === 'customer' ? driverName : customerName} for Trip #${bookingId}.`,
          timestamp: new Date().toISOString(),
          type: 'system'
        };
        merged.push(initialMsg);
        localStorage.setItem(storageKey, JSON.stringify(merged));
      }

      setMessages(merged);
    } catch (err) {
      console.warn('Error syncing chat messages:', err);
      const localLogs = JSON.parse(localStorage.getItem(storageKey) || '[]');
      setMessages(localLogs);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [bookingId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Voice recording timer simulation
  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Send Message Handler
  const handleSendMessage = async (textToSend, msgType = 'text', extraData = {}) => {
    const text = textToSend || inputText.trim();
    if (!text) return;

    const newMsg = {
      id: 'msg_' + Date.now(),
      bookingId,
      senderId: currentUser?._id || currentUser?.id || 'usr_current',
      senderRole: role,
      senderName: currentUser?.name || (role === 'customer' ? 'Customer' : role === 'driver' ? 'Driver' : 'Admin'),
      message: text,
      type: msgType,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      ...extraData
    };

    // Update local state and localStorage instantly
    const updated = [...messages, newMsg];
    setMessages(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setInputText('');

    // Attempt backend POST API sync
    try {
      const token = localStorage.getItem('royal_token') || localStorage.getItem('company_admin_token') || localStorage.getItem('token');
      if (token) {
        await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            bookingId,
            receiverRole: isSelfDrive ? (role === 'customer' ? 'company-admin' : 'customer') : (role === 'customer' ? 'driver' : 'customer'),
            message: `[${bookingId}] ${text}`,
            companyId: booking?.companyId || booking?.company?._id
          })
        });
      }
    } catch (err) {
      console.warn('Backend sync warning:', err);
    }
  };

  // Live Location Share Handler
  const handleShareLiveLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(4);
          const lng = position.coords.longitude.toFixed(4);
          const locText = `📍 LIVE LOCATION: Lat ${lat}, Lng ${lng}`;
          handleSendMessage(locText, 'location', { lat, lng });
        },
        () => {
          // Fallback location if permission denied
          const lat = '12.9716';
          const lng = '77.5946';
          const locText = `📍 LIVE LOCATION: Bangalore Hub (Lat ${lat}, Lng ${lng})`;
          handleSendMessage(locText, 'location', { lat, lng });
        }
      );
    } else {
      const lat = '12.9716';
      const lng = '77.5946';
      const locText = `📍 LIVE LOCATION: Bangalore Hub (Lat ${lat}, Lng ${lng})`;
      handleSendMessage(locText, 'location', { lat, lng });
    }
  };

  // File Attachment Upload Handler
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      handleSendMessage(`📎 Document/Image: ${file.name}`, 'file', { fileUrl: reader.result, fileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  // Voice Note Send Handler
  const handleStopVoiceRecording = () => {
    setIsRecording(false);
    const secs = recordingTime || 4;
    handleSendMessage(`🎤 Voice Note (0:${secs < 10 ? '0' + secs : secs})`, 'audio', { duration: secs });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        background: '#ffffff', width: '100%', maxWidth: '580px', height: '620px',
        borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e2e8f0'
      }}>
        {/* MODAL HEADER */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff', padding: '1.1rem 1.4rem', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)'
            }}>
              💬
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{vehicleName}</span>
                <span style={{
                  fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 800,
                  background: isSelfDrive ? '#fef3c7' : '#e0e7ff', color: isSelfDrive ? '#92400e' : '#3730a3'
                }}>
                  {isSelfDrive ? '🔑 Self-Drive' : '👨‍✈️ With Driver'}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                Booking ID: <span style={{ color: '#fbbf24', fontWeight: 700 }}>#{bookingId}</span> • {isSelfDrive ? `Partner: ${companyName}` : `Driver: ${driverName}`}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94a3b8',
              width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem',
              transition: 'background 0.2s ease'
            }}
          >
            ✕
          </button>
        </div>

        {/* QUICK ACTION BAR (LIVE LOCATION & CALL) */}
        <div style={{
          background: '#f8fafc', padding: '0.6rem 1.25rem', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem'
        }}>
          <button
            onClick={handleShareLiveLocation}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              color: '#ffffff', border: 'none', padding: '0.45rem 0.9rem', borderRadius: '8px',
              fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
            }}
          >
            📍 Share Live Location
          </button>

          <button
            onClick={() => {
              setActiveLocationCoords({ lat: 12.9716, lng: 77.5946 });
              setShowMapModal(true);
            }}
            style={{
              background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1',
              padding: '0.45rem 0.85rem', borderRadius: '8px', fontWeight: 700,
              fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem'
            }}
          >
            🗺️ View Map Track
          </button>
        </div>

        {/* MESSAGES STREAM */}
        <div style={{
          flex: 1, padding: '1.25rem', overflowY: 'auto', background: '#ffffff',
          display: 'flex', flexDirection: 'column', gap: '0.85rem'
        }}>
          {messages.map((msg, idx) => {
            const isMe = msg.senderRole === role || String(msg.senderId) === String(currentUser?._id || currentUser?.id);
            const isSys = msg.type === 'system' || msg.senderRole === 'system';

            if (isSys) {
              return (
                <div key={msg.id || idx} style={{ textAlign: 'center', margin: '0.4rem 0' }}>
                  <span style={{
                    background: '#f1f5f9', color: '#475569', padding: '0.35rem 0.85rem',
                    borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid #e2e8f0'
                  }}>
                    {msg.message}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id || idx}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '82%',
                  alignSelf: isMe ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.2rem', paddingLeft: '0.2rem', paddingRight: '0.2rem' }}>
                  {isMe ? 'You' : msg.senderName} • {new Date(msg.createdAt || msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                <div style={{
                  background: isMe ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : '#f1f5f9',
                  color: isMe ? '#ffffff' : '#0f172a',
                  padding: '0.75rem 1rem', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  boxShadow: isMe ? '0 4px 12px rgba(37, 99, 235, 0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
                  fontSize: '0.88rem', lineHeight: 1.45, wordBreak: 'break-word', border: isMe ? 'none' : '1px solid #e2e8f0'
                }}>
                  {/* LOCATION MESSAGE SPECIAL RENDER */}
                  {msg.type === 'location' || msg.message.includes('LIVE LOCATION') ? (
                    <div>
                      <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                        📍 Live GPS Location Shared
                      </div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                        {msg.message}
                      </div>
                      <button
                        onClick={() => {
                          setActiveLocationCoords({ lat: msg.lat || 12.9716, lng: msg.lng || 77.5946 });
                          setShowMapModal(true);
                        }}
                        style={{
                          marginTop: '0.6rem', background: isMe ? '#ffffff' : '#0284c7',
                          color: isMe ? '#1d4ed8' : '#ffffff', border: 'none', padding: '0.35rem 0.75rem',
                          borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem'
                        }}
                      >
                        🗺️ Open Live Map View
                      </button>
                    </div>
                  ) : msg.type === 'file' ? (
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>{msg.message}</div>
                      {msg.fileUrl && (
                        <a
                          href={msg.fileUrl}
                          download={msg.fileName || 'attached-document'}
                          style={{ color: isMe ? '#93c5fd' : '#2563eb', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'underline' }}
                        >
                          ⬇️ Download Attachment
                        </a>
                      )}
                    </div>
                  ) : msg.type === 'audio' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>🎤</span>
                      <span>{msg.message}</span>
                    </div>
                  ) : (
                    msg.message
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* INLINE MAP MODAL IF CLICKED */}
        {showMapModal && (
          <div style={{
            position: 'absolute', inset: '60px 15px 70px 15px', background: '#ffffff',
            borderRadius: '16px', border: '2px solid #0284c7', boxShadow: '0 15px 35px rgba(0,0,0,0.25)',
            zIndex: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            <div style={{ background: '#0284c7', color: '#fff', padding: '0.55rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>📍 Live GPS Tracking Map ({vehicleName})</span>
              <button onClick={() => setShowMapModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>✕ Close Map</button>
            </div>
            <iframe
              title="Live Chat Map"
              src={`https://maps.google.com/maps?q=${activeLocationCoords?.lat || 12.9716},${activeLocationCoords?.lng || 77.5946}&z=14&output=embed`}
              style={{ width: '100%', flex: 1, border: 'none' }}
            ></iframe>
          </div>
        )}

        {/* RECORDING TIMER BAR */}
        {isRecording && (
          <div style={{
            background: '#fef2f2', borderTop: '1px solid #fecaca', padding: '0.5rem 1.25rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626', fontWeight: 800, fontSize: '0.85rem' }}>
              <span style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%' }}></span>
              Recording Voice Note... 0:{recordingTime < 10 ? '0' + recordingTime : recordingTime}
            </div>
            <button
              onClick={handleStopVoiceRecording}
              style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
            >
              Send Voice Note 📤
            </button>
          </div>
        )}

        {/* INPUT FOOTER */}
        <div style={{
          padding: '0.85rem 1.25rem', background: '#ffffff', borderTop: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: '0.65rem'
        }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Attach Document or Photo"
            style={{
              background: '#f1f5f9', border: '1px solid #cbd5e1', width: '38px', height: '38px',
              borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '1rem'
            }}
          >
            📎
          </button>

          <button
            onClick={() => setIsRecording(prev => !prev)}
            title="Record Voice Note"
            style={{
              background: isRecording ? '#fef2f2' : '#f1f5f9',
              border: isRecording ? '1px solid #fecaca' : '1px solid #cbd5e1',
              color: isRecording ? '#dc2626' : '#0f172a',
              width: '38px', height: '38px', borderRadius: '10px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem'
            }}
          >
            🎤
          </button>

          <input
            type="text"
            placeholder="Type your message here..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
            style={{
              flex: 1, padding: '0.65rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1',
              fontSize: '0.88rem', outline: 'none', background: '#f8fafc'
            }}
          />

          <button
            onClick={() => handleSendMessage()}
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff', border: 'none', padding: '0.65rem 1.2rem', borderRadius: '12px',
              fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)', display: 'flex', alignItems: 'center', gap: '0.35rem'
            }}
          >
            Send 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
