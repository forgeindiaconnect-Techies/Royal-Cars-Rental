import React, { useState, useEffect, useRef } from 'react';

const Icons = {
  Send: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>,
  X: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Plus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Chat: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>,
  Robot: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>,
  Phone: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>,
  WhatsApp: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
};

export default function AIChatbot({ isOpen, onClose }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! 👋 Welcome to Royal Rent Cars! I am your AI Assistant. How can I help you book or explore car rentals today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const [supportPhone, setSupportPhone] = useState(() => localStorage.getItem('platform_support_phone') || '+91 95173 68420');
  const [supportWhatsapp, setSupportWhatsapp] = useState(() => localStorage.getItem('platform_whatsapp_phone') || '919517368420');
  const [whatsappMsg, setWhatsappMsg] = useState(() => localStorage.getItem('platform_whatsapp_msg') || 'Hello Royal Drive! I want to inquire about car rental.');

  useEffect(() => {
    const syncContactNumbers = () => {
      setSupportPhone(localStorage.getItem('platform_support_phone') || '+91 95173 68420');
      setSupportWhatsapp(localStorage.getItem('platform_whatsapp_phone') || '919517368420');
      setWhatsappMsg(localStorage.getItem('platform_whatsapp_msg') || 'Hello Royal Drive! I want to inquire about car rental.');
    };
    window.addEventListener('storage', syncContactNumbers);
    window.addEventListener('platform_contact_updated', syncContactNumbers);
    return () => {
      window.removeEventListener('storage', syncContactNumbers);
      window.removeEventListener('platform_contact_updated', syncContactNumbers);
    };
  }, []);

  const colors = {
    espresso: '#4E311B',
    darkEspresso: '#3C2414',
    cream: '#FAF4EE',
    lightCream: '#F6EDE4',
    badge: '#EFE4D6',
    border: '#EADCCF',
    textDark: '#3C2415',
    textMuted: '#7C6959',
    gold: '#D49B4B'
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, isTyping]);

  if (!isOpen) return null;

  // Minimized Floating Pill State
  if (isMinimized) {
    return (
      <div 
        onClick={() => setIsMinimized(false)}
        title="Royal Rent Cars AI Concierge"
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          zIndex: 99999,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: colors.espresso,
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 12px 32px rgba(78, 49, 27, 0.5)',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.165, 0.84, 0.44, 1)',
          border: '2px solid rgba(255, 255, 255, 0.25)'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <Icons.Plus />
      </div>
    );
  }

  const handleSend = (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text: text.trim() }]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      let aiResponse = "";
      const lower = text.toLowerCase().trim();

      if (lower.includes('book') || lower.includes('booking') || lower.includes('how to') || lower.includes('process') || lower.includes('reserve')) {
        aiResponse = "🚗 How to Book a Car on Royal Rent Cars:\n\n1️⃣ Select Pickup & Drop-off Location & Dates on the homepage.\n2️⃣ Browse available cars (Hatchback, Sedan, SUV, Luxury).\n3️⃣ Click 'Book Now' and enter your driver details.\n4️⃣ Pay securely online via UPI/Card or choose Pay at Pickup.\n5️⃣ Get instant booking confirmation & live GPS car tracking!";
      } else if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey') || lower.includes('namaste')) {
        aiResponse = "Hello! 👋 Welcome to Royal Rent Cars! I am your AI assistant. How can I help you with car availability, pricing, or doorstep delivery today?";
      } else if (lower.includes('price') || lower.includes('rate') || lower.includes('cost') || lower.includes('charge') || lower.includes('how much') || lower.includes('fee')) {
        aiResponse = "💰 Transparent Pricing at Royal Rent Cars:\n\n• Economy Hatchbacks: starting at ₹1,200/day\n• Executive Sedans: starting at ₹1,500/day\n• Premium SUVs (Creta/Thar): starting at ₹1,800/day\n• Luxury Vehicles (BMW/Audi): starting at ₹3,500/day\n\nAll rates include zero hidden fees, GST breakdown, and complimentary insurance coverage!";
      } else if (lower.includes('doc') || lower.includes('license') || lower.includes('licence') || lower.includes('aadhaar') || lower.includes('id') || lower.includes('proof')) {
        aiResponse = "🪪 Documents Required for Car Rental:\n\n1. Original Driving Licence (minimum 1 year valid)\n2. Aadhaar Card or Passport (Photo & Address ID proof)\n\nQuick 2-minute verification during vehicle pickup!";
      } else if (lower.includes('cancel') || lower.includes('refund') || lower.includes('policy')) {
        aiResponse = "🛡️ Cancellation & Refund Policy:\n\n• 100% Full Refund if cancelled 24+ hours before pickup.\n• 50% Refund if cancelled within 12-24 hours.\n• Refunds credited back to your bank account within 24 hours!";
      } else if (lower.includes('owner') || lower.includes('partner') || lower.includes('list') || lower.includes('500') || lower.includes('earn')) {
        aiResponse = "🤝 Vehicle Partner Earnings Program:\n\nEarn a fixed ₹500 PER ACTIVE DAY for registering your vehicle on RentOS! Earnings are guaranteed whether your car is booked or unbooked.\n\nClick 'Register / Partner' at the top of the page to apply today!";
      } else if (lower.includes('locat') || lower.includes('pickup') || lower.includes('delivery') || lower.includes('dharmapuri') || lower.includes('bangalore') || lower.includes('doorstep')) {
        aiResponse = "📍 Doorstep Delivery & Locations:\n\nWe provide 24/7 doorstep car delivery and drop-off service across Dharmapuri, Krishnagiri, Salem, Hosur, Bangalore, and major Tamil Nadu districts!";
      } else if (lower.includes('driver') || lower.includes('chauffeur') || lower.includes('self')) {
        aiResponse = "👨‍✈️ Driver & Self-Drive Options:\n\nYou can choose Self-Drive or opt for a Verified Professional Chauffeur (+₹500/day) during checkout!";
      } else if (lower.includes('deposit') || lower.includes('security') || lower.includes('advance')) {
        aiResponse = "🔒 Refundable Security Deposit:\n\nA small security deposit (₹2,000 to ₹5,000 depending on car category) is held during rental and 100% refunded immediately upon vehicle return.";
      } else if (lower.includes('suv')) {
        aiResponse = "Great choice! We have top SUVs like Hyundai Creta SX, Mahindra Thar 4x4, and Toyota Fortuner ready for instant booking!";
      } else if (lower.includes('budget')) {
        aiResponse = "Looking for budget cars? Check out Maruti Swift ZXi and Hyundai i20 starting at just ₹1,200/day!";
      } else if (lower.includes('luxury')) {
        aiResponse = "Indulge in luxury! We offer BMW 3 Series, Mercedes C-Class, and Audi A6 with complimentary doorstep delivery.";
      } else {
        aiResponse = `I'm happy to help! You can ask me how to book a car, check rental rates, required documents, cancellation policies, or vehicle owner partner programs. You can also call our 24x7 helpline at 📞 +91 1800 200 9988!`;
      }

      setMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '380px',
      height: '620px',
      backgroundColor: '#fff',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(78, 49, 27, 0.25)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 9999,
      fontFamily: "'Inter', sans-serif",
      border: `1.5px solid ${colors.border}`,
      animation: 'slideUp 0.35s cubic-bezier(0.165, 0.84, 0.44, 1)'
    }}>
      <style>
        {`
          @keyframes slideUp {
            from { transform: translateY(80px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .chat-scrollbar::-webkit-scrollbar { width: 5px; }
          .chat-scrollbar::-webkit-scrollbar-track { background: ${colors.cream}; }
          .chat-scrollbar::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 10px; }
        `}
      </style>

      {/* Header Bar */}
      <div style={{
        background: colors.espresso,
        color: '#fff',
        padding: '1.1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: colors.badge, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.espresso, fontWeight: 800, fontSize: '0.9rem' }}>
            AI
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>Royal Rent Cars AI</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: colors.badge, opacity: 0.9 }}>Your Car Rental Assistant</p>
          </div>
        </div>

        {/* Top Control Buttons (Minimize + & Close X) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            onClick={() => setIsMinimized(true)}
            title="Minimize"
            style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.18)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
          >
            <Icons.Plus />
          </button>
          <button 
            onClick={onClose}
            title="Close"
            style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.18)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
          >
            <Icons.X />
          </button>
        </div>
      </div>

      {/* Chat Conversation Area */}
      <div className="chat-scrollbar" style={{
        flex: 1,
        padding: '1.25rem',
        background: '#FAF6F0',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Bot Greeting Header */}
        <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '16px', border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '2rem' }}>🤖</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: colors.textDark }}>Hello! 👋</div>
            <div style={{ fontSize: '0.8rem', color: colors.textMuted }}>I'm your AI assistant. How can I help you today?</div>
          </div>
        </div>

        {messages.map((msg, idx) => {
          const isAi = msg.sender === 'ai';
          return (
            <div key={idx} style={{
              display: 'flex',
              flexDirection: isAi ? 'row' : 'row-reverse',
              gap: '8px',
              alignItems: 'flex-start'
            }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isAi ? colors.badge : colors.espresso, color: isAi ? colors.espresso : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.75rem', fontWeight: 800, marginTop: '4px' }}>
                {isAi ? '🤖' : '👤'}
              </div>
              <div style={{
                maxWidth: '78%',
                padding: '0.75rem 1rem',
                borderRadius: isAi ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                background: isAi ? '#FFFFFF' : colors.cream,
                border: `1px solid ${colors.border}`,
                color: colors.textDark,
                fontSize: '0.85rem',
                lineHeight: 1.45,
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}>
                {msg.text}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: colors.badge, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>🤖</div>
            <div style={{ padding: '0.6rem 1rem', borderRadius: '16px', background: '#fff', border: `1px solid ${colors.border}`, fontSize: '0.8rem', color: colors.textMuted }}>AI is typing...</div>
          </div>
        )}

        {/* Quick Suggestion Chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          {['🚗 How to Book?', '💰 Rates & Pricing', '🪪 Required Docs', '🛡️ Cancel Policy', '🤝 Owner Partner (₹500/day)'].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              style={{
                background: '#FFFFFF',
                border: `1px solid ${colors.border}`,
                color: colors.textDark,
                padding: '0.45rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.espresso; e.currentTarget.style.background = colors.cream; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.background = '#FFFFFF'; }}
            >
              {chip}
            </button>
          ))}
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <div style={{ padding: '0.75rem 1rem', background: '#FFFFFF', borderTop: `1px solid ${colors.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FAF6F0', padding: '0.35rem 0.4rem 0.35rem 1rem', borderRadius: '30px', border: `1px solid ${colors.border}` }}>
          <input 
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', color: colors.textDark }}
          />
          <button 
            onClick={() => handleSend()}
            style={{ width: '34px', height: '34px', borderRadius: '50%', background: colors.espresso, color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Icons.Send />
          </button>
        </div>
      </div>

      {/* Bottom Quick Contact Footer Bar */}
      <div style={{ padding: '0.6rem 1rem', background: colors.cream, borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', gap: '6px' }}>
        <a 
          href={`https://wa.me/${supportWhatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMsg)}`} 
          target="_blank" 
          rel="noreferrer"
          style={{ flex: 1, textDecoration: 'none', background: '#FFFFFF', border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '0.4rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 700, color: '#16a34a' }}
        >
          <Icons.WhatsApp />
          <span>WhatsApp</span>
        </a>
        <a 
          href={`tel:${supportPhone.replace(/\s+/g, '')}`} 
          style={{ flex: 1, textDecoration: 'none', background: '#FFFFFF', border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '0.4rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 700, color: colors.espresso }}
        >
          <Icons.Phone />
          <span>Call Us</span>
        </a>
        <button 
          onClick={onClose}
          style={{ flex: 1, background: colors.espresso, border: 'none', borderRadius: '10px', padding: '0.4rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}
        >
          <Icons.X />
          <span>Close</span>
        </button>
      </div>
    </div>
  );
}
