import React, { useState, useEffect, useRef } from 'react';

const Icons = {
  Send: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>,
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Chat: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>,
  Car: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H9.3a2 2 0 0 0-1.6.8L5 11l-5.16.86a1 1 0 0 0-.84.99V16h3m10 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm-14 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/></svg>,
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
};

export default function AIChatbot({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! I am the Royal AI Assistant. How can I help you with your car rental today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const colors = {
    brown: '#7B4F2C',
    darkBrown: '#4A2F1A',
    lightCream: '#F9F6F0',
    creamAccent: '#EFE7DF',
    white: '#FFFFFF',
    textDark: '#2C1C13',
    textMuted: '#6D5443'
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMsg = inputValue.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI processing and response
    setTimeout(() => {
      let aiResponse = "I'm the Royal AI Assistant! I can help you with bookings, policies, and support. Could you provide a bit more detail?";
      const lower = userMsg.toLowerCase();
      
      if (lower.includes('admin') || lower.includes('superadmin') || lower.includes('employee') || lower.includes('dashboard')) {
        aiResponse = "I am a customer support assistant! For internal admin, driver, or employee dashboard access, please refer to the internal employee portal or contact the IT department.";
      } else if (lower.includes('register') && (lower.includes('car') || lower.includes('host'))) {
        aiResponse = "To register your car and become a host, please navigate to the 'Car Owner Dashboard'. From there, you can upload your vehicle details and documents for verification to start earning!";
      } else if (lower.includes('register') || lower.includes('sign up') || lower.includes('login') || lower.includes('account')) {
        aiResponse = "To register as a user, click the 'Sign In' or 'Register' button at the top of the page. You can securely create an account using your email or phone number.";
      } else if (lower.includes('driver') && (lower.includes('identify') || lower.includes('know') || lower.includes('who') || lower.includes('contact'))) {
        aiResponse = "Once your booking is confirmed, your assigned driver's exact details (including their name, photo, and contact number) will be securely shared with you via SMS and will be visible in your active bookings dashboard.";
      } else if (lower.includes('contact') || lower.includes('call') || lower.includes('support') || lower.includes('help')) {
        aiResponse = "You can contact our 24/7 support team via email at support@royal.com or call us directly at +91 98765 43210. We're always here to help you!";
      } else if (lower.includes('book') || lower.includes('rent')) {
        aiResponse = "To book a car, simply navigate to our homepage, select your preferred dates and location, choose a vehicle, and complete the secure payment. Your booking will be instantly confirmed!";
      } else if (lower.includes('document') || lower.includes('id') || lower.includes('license')) {
        aiResponse = "You will need to provide a valid Driving License and a Government-issued Photo ID (such as an Aadhaar card or Passport) at the time of pickup.";
      } else if (lower.includes('cancel') || lower.includes('refund')) {
        aiResponse = "You can cancel your booking for free up to 24 hours before your scheduled pickup. Refunds are processed securely within 5-7 business days directly to your original payment method.";
      } else if (lower.includes('price') || lower.includes('cost') || lower.includes('pay')) {
        aiResponse = "Our pricing is transparent with no hidden fees! We accept UPI, Credit/Debit cards, and Net Banking. Costs vary based on the vehicle type and rental duration.";
      } else if (lower.includes('hello') || lower.includes('hi')) {
        aiResponse = "Hello there! Ready to hit the road? Ask me anything about our rental services!";
      } else if (lower.includes('confuse') || lower.includes('explain') || lower.includes('how')) {
        aiResponse = "Don't worry, I'm here to explain exactly how it works! \n\n1. Browse: Browse our wide range of premium and luxury cars on the homepage.\n2. Select Dates: Choose when and where you want to pick up the car.\n3. Book & Pay: Complete a secure payment using UPI or Cards.\n4. Drive: Upload your license/ID, pick up your keys, and enjoy the ride!\n\nIt's fully digital, seamless, and completely secure. Let me know if you have questions about any specific step!";
      }

      setMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '380px',
      height: '600px',
      backgroundColor: '#fff',
      borderRadius: '24px',
      boxShadow: '0 20px 60px rgba(123, 79, 44, 0.25)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 9999,
      fontFamily: "'Inter', sans-serif",
      animation: 'slideUp 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)'
    }}>
      <style>
        {`
          @keyframes slideUp {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .chat-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .chat-scrollbar::-webkit-scrollbar-track {
            background: ${colors.lightCream};
          }
          .chat-scrollbar::-webkit-scrollbar-thumb {
            background: ${colors.creamAccent};
            border-radius: 10px;
          }
          .typing-dot {
            width: 6px;
            height: 6px;
            background: ${colors.brown};
            border-radius: 50%;
            display: inline-block;
            animation: bounce 1.4s infinite ease-in-out both;
            margin-right: 4px;
          }
          .typing-dot:nth-child(1) { animation-delay: -0.32s; }
          .typing-dot:nth-child(2) { animation-delay: -0.16s; }
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
          }
        `}
      </style>

      {/* Header */}
      <div style={{
        background: colors.brown,
        color: '#fff',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${colors.darkBrown}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '50%' }}>
            <Icons.Car />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Royal AI</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>Online and ready to help</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.8, padding: '5px' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
        >
          <Icons.X />
        </button>
      </div>

      {/* Chat Area */}
      <div className="chat-scrollbar" style={{
        flex: 1,
        padding: '1.5rem',
        background: colors.lightCream,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.2rem'
      }}>
        {messages.map((msg, idx) => {
          const isAi = msg.sender === 'ai';
          return (
            <div key={idx} style={{
              display: 'flex',
              flexDirection: isAi ? 'row' : 'row-reverse',
              gap: '10px',
              alignItems: 'flex-end'
            }}>
              {isAi && (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: colors.creamAccent, color: colors.brown, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icons.Chat />
                </div>
              )}
              <div style={{
                maxWidth: '75%',
                padding: '12px 16px',
                borderRadius: isAi ? '20px 20px 20px 4px' : '20px 20px 4px 20px',
                background: isAi ? '#fff' : colors.brown,
                color: isAi ? colors.textDark : '#fff',
                fontSize: '0.95rem',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
              }}>
                {msg.text}
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: colors.creamAccent, color: colors.brown, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.Chat />
            </div>
            <div style={{ padding: '16px', borderRadius: '20px 20px 20px 4px', background: '#fff', display: 'flex', alignItems: 'center' }}>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '1.5rem',
        background: '#fff',
        borderTop: `1px solid ${colors.creamAccent}`,
        display: 'flex',
        gap: '10px'
      }}>
        <input 
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask me anything..."
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '12px',
            border: `1.5px solid ${colors.creamAccent}`,
            outline: 'none',
            fontSize: '0.95rem',
            color: colors.textDark,
            transition: 'border-color 0.3s'
          }}
          onFocus={(e) => e.target.style.borderColor = colors.brown}
          onBlur={(e) => e.target.style.borderColor = colors.creamAccent}
        />
        <button 
          onClick={handleSend}
          style={{
            background: colors.brown,
            color: '#fff',
            border: 'none',
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s, background 0.3s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = colors.darkBrown; e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = colors.brown; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <Icons.Send />
        </button>
      </div>
    </div>
  );
}
