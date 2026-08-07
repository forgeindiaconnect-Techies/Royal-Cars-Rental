import React, { useState, useEffect, useRef } from 'react';

const Icons = {
  X: (props) => <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  Bot: (props) => <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>,
  User: (props) => <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Car: (props) => <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H9.3a2 2 0 0 0-1.6.8L5 11l-5.16.86a1 1 0 0 0-.84.99V16h3m10 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm-14 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/></svg>,
  Check: (props) => <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
};

export default function AIFinderModal({ isOpen, onClose }) {
  const [step, setStep] = useState('choose_method'); // choose_method, manual, manual_results, ai_chat
  const [selectedMethod, setSelectedMethod] = useState(''); // 'ai' or 'manual'

  // AI Chat States
  const [chatMessages, setChatMessages] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [aiAnswers, setAiAnswers] = useState({});
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [thinkingStage, setThinkingStage] = useState('');
  
  const chatEndRef = useRef(null);

  const colors = {
    brown: '#7B4F2C',
    lightBrown: '#F9F6F0',
    purple: '#7C3AED',
    lightPurple: '#F5F3FF',
    textDark: '#2C1C13',
    textMuted: '#6D5443'
  };

  const AI_QUESTIONS = [
    { key: 'budget', text: "Hi! I'll help you find the best car. First, what's your budget per day?", options: ['₹1000', '₹2000', '₹3000', 'Custom'] },
    { key: 'passengers', text: "Great! How many passengers will be traveling?", options: ['2', '4', '5', '7+'] },
    { key: 'purpose', text: "What is the purpose of your trip?", options: ['Business', 'Family', 'Vacation', 'Wedding', 'Airport', 'Outstation'] },
    { key: 'transmission', text: "Do you prefer Automatic or Manual transmission?", options: ['Automatic', 'Manual', 'No Preference'] },
    { key: 'fuel', text: "What fuel type do you prefer?", options: ['Petrol', 'Diesel', 'Electric', 'Any'] },
    { key: 'driver', text: "Will you need a chauffeur (Driver)?", options: ['Yes', 'No'] },
    { key: 'luxury', text: "Are you looking for a Luxury Car experience?", options: ['Yes', 'No'] }
  ];

  const resetModal = () => {
    setStep('choose_method');
    setSelectedMethod('');
    setChatMessages([]);
    setCurrentQuestionIdx(0);
    setAiAnswers({});
    setIsAiThinking(false);
  };

  useEffect(() => {
    if (isOpen) resetModal();
  }, [isOpen]);

  useEffect(() => {
    if (step === 'ai_chat' && currentQuestionIdx === 0 && chatMessages.length === 0) {
      setChatMessages([{ sender: 'ai', text: AI_QUESTIONS[0].text, options: AI_QUESTIONS[0].options }]);
    }
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [step, currentQuestionIdx, chatMessages]);

  const handleAiOptionSelect = (option) => {
    const currentQ = AI_QUESTIONS[currentQuestionIdx];
    
    // Add user response to chat
    setChatMessages(prev => [
      ...prev.map(m => ({ ...m, options: null })), // Remove options from previous message
      { sender: 'user', text: option }
    ]);
    
    setAiAnswers(prev => ({ ...prev, [currentQ.key]: option }));

    const nextIdx = currentQuestionIdx + 1;
    if (nextIdx < AI_QUESTIONS.length) {
      setCurrentQuestionIdx(nextIdx);
      setTimeout(() => {
        setChatMessages(prev => [...prev, { sender: 'ai', text: AI_QUESTIONS[nextIdx].text, options: AI_QUESTIONS[nextIdx].options }]);
      }, 600);
    } else {
      // All questions answered, start thinking
      setIsAiThinking(true);
      startAiThinkingProcess();
    }
  };

  const startAiThinkingProcess = () => {
    const stages = [
      "Analyzing...",
      "Searching nearby rental companies...",
      "Checking your budget...",
      "Comparing prices...",
      "Finding best offers..."
    ];
    
    let i = 0;
    setThinkingStage(stages[0]);
    
    const interval = setInterval(() => {
      i++;
      if (i < stages.length) {
        setThinkingStage(stages[i]);
      } else {
        clearInterval(interval);
        setIsAiThinking(false);
        showFinalRecommendation();
      }
    }, 1200);
  };

  const showFinalRecommendation = () => {
    const passengers = aiAnswers.passengers || '5';
    const budget = aiAnswers.budget || '₹2500';
    
    const introMsg = `I noticed you're traveling with ${passengers} passengers. The Toyota Innova is the most comfortable option within your ${budget} budget.`;
    
    setChatMessages(prev => [
      ...prev,
      { sender: 'ai', text: introMsg, isFinalResult: true }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', zIndex: 999999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: "'Inter', sans-serif"
    }}>
      <style>
        {`
          .ai-modal-content {
            background: #fff;
            border-radius: 24px;
            width: 100%;
            max-width: 500px;
            max-height: 85vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            animation: modalSlideUp 0.3s ease-out;
            position: relative;
          }
          @keyframes modalSlideUp {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .option-card {
            border: 2px solid #EAE0D5;
            border-radius: 16px;
            padding: 1.5rem;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          .option-card:hover {
            border-color: ${colors.brown};
            background: ${colors.lightBrown};
          }
          .option-card.selected {
            border-color: ${colors.brown};
            background: ${colors.lightBrown};
            box-shadow: 0 4px 12px rgba(123,79,44,0.1);
          }
          .ai-bubble {
            background: ${colors.lightBrown};
            color: ${colors.textDark};
            padding: 1rem 1.2rem;
            border-radius: 16px 16px 16px 4px;
            max-width: 85%;
            margin-bottom: 1rem;
            font-size: 0.95rem;
            line-height: 1.5;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }
          .user-bubble {
            background: ${colors.brown};
            color: #fff;
            padding: 0.8rem 1.2rem;
            border-radius: 16px 16px 4px 16px;
            max-width: 85%;
            margin-bottom: 1rem;
            align-self: flex-end;
            font-size: 0.95rem;
          }
          .chat-option-btn {
            background: #fff;
            border: 1px solid ${colors.brown};
            color: ${colors.brown};
            padding: 0.6rem 1rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            margin-right: 0.5rem;
            margin-bottom: 0.5rem;
          }
          .chat-option-btn:hover {
            background: ${colors.brown};
            color: #fff;
          }
          .thinking-dots {
            display: flex;
            gap: 4px;
            padding: 0.5rem 0;
          }
          .dot {
            width: 8px;
            height: 8px;
            background: ${colors.brown};
            border-radius: 50%;
            animation: bounce 1.4s infinite ease-in-out both;
          }
          .dot:nth-child(1) { animation-delay: -0.32s; }
          .dot:nth-child(2) { animation-delay: -0.16s; }
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
          }
          .form-group label {
            display: block; font-size: 0.85rem; font-weight: 600; color: ${colors.textMuted}; margin-bottom: 0.4rem;
          }
          .form-group select, .form-group input {
            width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px; font-size: 0.95rem; outline: none;
          }
          .form-group select:focus, .form-group input:focus {
            border-color: ${colors.brown};
          }
          /* Custom Scrollbar */
          .modal-scroll::-webkit-scrollbar { width: 6px; }
          .modal-scroll::-webkit-scrollbar-track { background: transparent; }
          .modal-scroll::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }
        `}
      </style>

      <div className="ai-modal-content">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 1.5rem', borderBottom: '1px solid #f0f0f0' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {step === 'choose_method' ? '🚗 Choose Booking Method' : 
             step === 'manual' || step === 'manual_results' ? '👤 Manual Search' : 
             '🤖 AI Rental Assistant'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
            <Icons.X />
          </button>
        </div>

        {/* Content Area */}
        <div className="modal-scroll" style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          
          {/* STEP 1: CHOOSE METHOD */}
          {step === 'choose_method' && (
            <div>
              <p style={{ color: colors.textMuted, marginBottom: '2rem' }}>Select how you want to find your perfect car.</p>
              
              <div 
                className={`option-card ${selectedMethod === 'ai' ? 'selected' : ''}`}
                onClick={() => setSelectedMethod('ai')}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: colors.lightPurple, color: colors.purple, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.Bot size={24} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>🤖 AI Recommendation</h4>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: colors.textMuted }}>Let our smart AI find the perfect car based on your trip details.</p>
                </div>
              </div>

              <div 
                className={`option-card ${selectedMethod === 'manual' ? 'selected' : ''}`}
                onClick={() => setSelectedMethod('manual')}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.User size={24} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>👤 Manual Search</h4>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: colors.textMuted }}>Filter and search for a car manually using detailed options.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2A: MANUAL SEARCH FORM */}
          {step === 'manual' && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Budget Range</label>
                  <select><option>Any</option><option>Below ₹2000</option><option>₹2000 - ₹5000</option><option>Above ₹5000</option></select>
                </div>
                <div className="form-group">
                  <label>Car Type</label>
                  <select><option>SUV</option><option>Sedan</option><option>Hatchback</option></select>
                </div>
                <div className="form-group">
                  <label>Transmission</label>
                  <select><option>Automatic</option><option>Manual</option></select>
                </div>
                <div className="form-group">
                  <label>Fuel</label>
                  <select><option>Petrol</option><option>Diesel</option><option>Electric</option></select>
                </div>
                <div className="form-group">
                  <label>Passengers</label>
                  <select><option>5 Seats</option><option>7 Seats</option></select>
                </div>
                <div className="form-group">
                  <label>Rental Company</label>
                  <select><option>Any Verified</option><option>DriveX</option><option>Zoomcar</option></select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2A: MANUAL SEARCH RESULTS */}
          {step === 'manual_results' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0 }}>Result: 50 Cars Found</h4>
                <button onClick={() => setStep('manual')} style={{ border: 'none', background: 'none', color: colors.brown, cursor: 'pointer', fontWeight: 600 }}>Modify Search</button>
              </div>
              {['Toyota Innova', 'Maruti Swift', 'Hyundai Creta'].map((car, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid #eee', borderRadius: '12px', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '60px', height: '40px', background: '#f5f5f5', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Car size={20} /></div>
                    <div><h5 style={{ margin: 0, fontSize: '1rem' }}>{car}</h5><span style={{ fontSize: '0.8rem', color: '#888' }}>₹{idx === 0 ? 2500 : idx === 1 ? 900 : 1800}/day</span></div>
                  </div>
                  <button style={{ background: colors.brown, color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>Book</button>
                </div>
              ))}
            </div>
          )}

          {/* STEP 2B: AI CHAT FLOW */}
          {step === 'ai_chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {chatMessages.map((msg, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
                  {msg.sender === 'ai' && !msg.isFinalResult && (
                    <div className="ai-bubble">
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <Icons.Bot size={18} />
                        <div>{msg.text}</div>
                      </div>
                    </div>
                  )}

                  {msg.sender === 'user' && (
                    <div className="user-bubble">
                      {msg.text}
                    </div>
                  )}

                  {msg.options && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '1rem', paddingLeft: '26px' }}>
                      {msg.options.map((opt, oIdx) => (
                        <button key={oIdx} className="chat-option-btn" onClick={() => handleAiOptionSelect(opt)}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {msg.isFinalResult && (
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ background: colors.lightPurple, color: colors.purple, padding: '8px', borderRadius: '50%' }}><Icons.Bot size={18} /></div>
                        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '16px 16px 16px 4px', fontSize: '0.95rem', lineHeight: 1.5, color: '#334155' }}>
                          🎉 {msg.text}
                        </div>
                      </div>

                      {/* Final Recommendation Card */}
                      <div style={{ border: `2px solid ${colors.brown}`, borderRadius: '16px', padding: '1.5rem', background: '#fff', boxShadow: '0 10px 25px rgba(123,79,44,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div>
                            <div style={{ background: colors.brown, color: '#fff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', display: 'inline-block', marginBottom: '4px', fontWeight: 800 }}>BEST MATCH</div>
                            <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Toyota Innova</h3>
                            <div style={{ color: '#F59E0B', fontSize: '0.9rem', marginTop: '4px' }}>⭐⭐⭐⭐⭐</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: colors.brown }}>₹2200</div>
                            <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>/day</div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}><Icons.Check size={14} color="green"/> 7 Seats</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}><Icons.Check size={14} color="green"/> Automatic</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}><Icons.Check size={14} color="green"/> GPS & AC</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}><Icons.Check size={14} color="green"/> 2 km Away</div>
                        </div>

                        <button style={{ width: '100%', background: colors.brown, color: '#fff', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
                          Book Now
                        </button>
                      </div>

                      <div style={{ marginTop: '2rem' }}>
                        <h5 style={{ color: colors.textMuted, marginBottom: '1rem' }}>Alternatives</h5>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', border: '1px solid #eee', borderRadius: '12px', marginBottom: '0.8rem' }}>
                          <span style={{ fontWeight: 600 }}>Hyundai Creta</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontWeight: 800 }}>₹1900</span>
                            <button style={{ background: '#f5f5f5', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Book</button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', border: '1px solid #eee', borderRadius: '12px' }}>
                          <span style={{ fontWeight: 600 }}>Maruti Swift</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontWeight: 800 }}>₹900</span>
                            <button style={{ background: '#f5f5f5', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Book</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isAiThinking && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#F8FAFC', padding: '1rem', borderRadius: '16px', maxWidth: '85%' }}>
                  <div style={{ background: colors.lightPurple, color: colors.purple, padding: '8px', borderRadius: '50%' }}><Icons.Bot size={18} /></div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>{thinkingStage}</div>
                    <div className="thinking-dots">
                      <div className="dot"></div><div className="dot"></div><div className="dot"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {(step === 'choose_method' || step === 'manual') && (
          <div style={{ padding: '1.2rem 1.5rem', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#fafafa' }}>
            {step === 'manual' && (
              <button onClick={() => setStep('choose_method')} style={{ padding: '0.8rem 1.5rem', border: '1px solid #ddd', background: '#fff', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>
                Back
              </button>
            )}
            
            <button 
              onClick={() => {
                if (step === 'choose_method') {
                  if (selectedMethod === 'ai') setStep('ai_chat');
                  else if (selectedMethod === 'manual') setStep('manual');
                } else if (step === 'manual') {
                  setStep('manual_results');
                }
              }}
              disabled={step === 'choose_method' && !selectedMethod}
              style={{ 
                padding: '0.8rem 2rem', 
                background: (step === 'choose_method' && !selectedMethod) ? '#ccc' : colors.brown, 
                color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: (step === 'choose_method' && !selectedMethod) ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
            >
              {step === 'choose_method' ? 'Continue' : 'Search Cars'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
