import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AIChatbot from '../components/AIChatbot';

const SvgIcon = ({ path, size = 24, strokeWidth = 2, className }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const Icons = {
  Users: (props) => <SvgIcon path={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} {...props} />,
  Handshake: (props) => <SvgIcon path={<><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-7.38 7.38a4 4 0 1 0 5.66 5.66l1.9-1.9"/><path d="M11 17l-1-1"/><path d="m14 14-1.5-1.5"/></>} {...props} />,
  Car: (props) => <SvgIcon path={<><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H9.3a2 2 0 0 0-1.6.8L5 11l-5.16.86a1 1 0 0 0-.84.99V16h3m10 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm-14 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/></>} {...props} />,
  Clock: (props) => <SvgIcon path={<><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>} {...props} />,
  FileText: (props) => <SvgIcon path={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></>} {...props} />,
  Shield: (props) => <SvgIcon path={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>} {...props} />,
  Headphones: (props) => <SvgIcon path={<><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></>} {...props} />,
  Mail: (props) => <SvgIcon path={<><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></>} {...props} />,
  Phone: (props) => <SvgIcon path={<><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></>} {...props} />,
  MapPin: (props) => <SvgIcon path={<><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>} {...props} />,
  XCircle: (props) => <SvgIcon path={<><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></>} {...props} />,
  Banknote: (props) => <SvgIcon path={<><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></>} {...props} />,
  Check: (props) => <SvgIcon path={<><path d="M20 6 9 17l-5-5"/></>} {...props} />,
  ChevronRight: (props) => <SvgIcon path={<><path d="m9 18 6-6-6-6"/></>} {...props} />,
  Plus: (props) => <SvgIcon path={<><path d="M5 12h14"/><path d="M12 5v14"/></>} {...props} />,
  Minus: (props) => <SvgIcon path={<><path d="M5 12h14"/></>} {...props} />,
  X: (props) => <SvgIcon path={<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>} {...props} />,
  CheckCircle: (props) => <SvgIcon path={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></>} {...props} />,
  ShieldCheckFilled: (props) => (
    <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" />
      <path d="m9 12 2 2 4-4" stroke="#7B4F2C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Lock: (props) => <SvgIcon path={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>} {...props} />,
  FileCheck: (props) => <SvgIcon path={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/></>} {...props} />,
};

export default function AboutSupportPage() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [openFaq, setOpenFaq] = useState(0);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [policyModal, setPolicyModal] = useState(null); // 'cancellation' | 'refund' | null

  // FAQ Data exactly as requested
  const faqs = [
    { q: "How do I book a car?", a: "You can book a car by selecting your pickup and drop-off locations, choosing your preferred vehicle, selecting the rental dates, and completing the booking through our secure payment system. Once your booking is confirmed, you'll receive the booking details via email and SMS." },
    { q: "What documents are required to rent a car?", a: "To rent a car, you must provide a valid Driving License, a government-issued Photo ID (Aadhaar, Passport, or Voter ID), and any additional documents required by the rental company. Some rentals may also require a refundable security deposit." },
    { q: "What payment methods do you accept?", a: "We accept UPI, Credit Cards, Debit Cards, Net Banking, and other secure online payment methods. All transactions are encrypted to ensure your payment information remains safe and secure." },
    { q: "Can I cancel or modify my booking?", a: "Yes. You can cancel or modify your booking before the scheduled pickup time. Cancellation charges and refund eligibility depend on the rental company's cancellation policy." },
    { q: "Is there a mileage limit on rentals?", a: "Mileage limits vary depending on the rental company and the selected vehicle. Some cars include unlimited kilometers, while others have a daily mileage limit. Please check the vehicle details before booking." },
    { q: "Do you offer airport pickup and drop?", a: "Yes. Many of our verified rental partners provide airport pickup and drop-off services. Availability depends on your selected location and rental company." },
    { q: "What if I return the car late?", a: "Returning the vehicle later than the agreed time may result in additional charges based on the rental company's policy. If you expect a delay, please contact the rental provider as soon as possible to avoid unnecessary penalties." },
    { q: "Is a security deposit required?", a: "Some rental companies require a refundable security deposit before handing over the vehicle. The amount varies depending on the vehicle type and rental policy." },
    { q: "Are all rental companies verified?", a: "Yes. Every rental partner on Royal Rental Cars is verified to ensure reliable service, quality vehicles, and a safe rental experience." }
  ];

  const colors = {
    brown: '#7B4F2C',
    darkBrown: '#4A2F1A',
    lightCream: '#F9F6F0',
    creamAccent: '#EFE7DF',
    white: '#FFFFFF',
    textDark: '#2C1C13',
    textMuted: '#6D5443'
  };

  const IconWrapper = ({ children }) => (
    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: colors.creamAccent, color: colors.brown, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
      {children}
    </div>
  );

  return (
    <div style={{ background: colors.lightCream, minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: colors.textDark, paddingBottom: '4rem' }}>
      <style>
        {`
          .premium-card {
            background: #FFFFFF;
            border-radius: 24px;
            padding: 2.5rem;
            box-shadow: 0 10px 40px rgba(123, 79, 44, 0.05);
            transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), box-shadow 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          .premium-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 50px rgba(123, 79, 44, 0.12);
          }
          .premium-btn {
            background: ${colors.brown};
            color: #FFFFFF;
            border: none;
            padding: 0.8rem 1.8rem;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            margin-top: auto;
            width: fit-content;
          }
          .premium-btn:hover {
            background: ${colors.darkBrown};
            transform: scale(1.03);
          }
          .faq-item {
            background: #FFFFFF;
            border: 1.5px solid #EAE0D5;
            border-radius: 16px;
            margin-bottom: 1rem;
            overflow: hidden;
            transition: all 0.3s ease;
          }
          .faq-item.active {
            border-color: ${colors.brown};
            box-shadow: 0 10px 30px rgba(123, 79, 44, 0.08);
          }
          .list-item {
            display: flex;
            gap: 0.8rem;
            align-items: flex-start;
            margin-bottom: 1rem;
            color: ${colors.textMuted};
            font-size: 0.95rem;
            line-height: 1.6;
          }
          .list-icon {
            color: ${colors.brown};
            margin-top: 3px;
          }
        `}
      </style>

      {/* Back Button */}
      <div style={{ padding: '2rem 5% 0' }}>
        <button 
          onClick={() => navigate('/')} 
          style={{ 
            background: '#FFFFFF', 
            border: `1px solid ${colors.creamAccent}`, 
            color: colors.brown, 
            padding: '0.6rem 1.5rem', 
            borderRadius: '12px', 
            cursor: 'pointer', 
            fontWeight: 700, 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(123, 79, 44, 0.05)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(123, 79, 44, 0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(123, 79, 44, 0.05)'; }}
        >
          <span>←</span> Back to Home
        </button>
      </div>

      {/* HERO SECTION 50/50 */}
      <section style={{ display: 'flex', gap: '4rem', padding: '3rem 5% 5rem', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ background: colors.brown, color: '#fff', padding: '0.5rem 1.2rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, display: 'inline-block', marginBottom: '1.5rem', letterSpacing: '1px' }}>
            ABOUT US
          </div>
          <h1 style={{ fontSize: '4rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', color: colors.textDark, letterSpacing: '-1px' }}>
            Drive Better.<br/>Rent Smarter.
          </h1>
          <p style={{ fontSize: '1.15rem', color: colors.textMuted, lineHeight: 1.7, marginBottom: '3rem', maxWidth: '480px' }}>
            Royal Rental Cars is your trusted travel partner. We make car rentals simple, safe, and affordable for everyone. Experience luxury on your terms.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ color: colors.brown }}><Icons.Users size={36} strokeWidth={1.5} /></div>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: colors.textDark }}>10K+</div>
                <div style={{ fontSize: '0.85rem', color: colors.textMuted, fontWeight: 600 }}>Happy Customers</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ color: colors.brown }}><Icons.Handshake size={36} strokeWidth={1.5} /></div>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: colors.textDark }}>500+</div>
                <div style={{ fontSize: '0.85rem', color: colors.textMuted, fontWeight: 600 }}>Rental Partners</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ color: colors.brown }}><Icons.Car size={36} strokeWidth={1.5} /></div>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: colors.textDark }}>20K+</div>
                <div style={{ fontSize: '0.85rem', color: colors.textMuted, fontWeight: 600 }}>Cars Available</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ color: colors.brown }}><Icons.Clock size={36} strokeWidth={1.5} /></div>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: colors.textDark }}>24/7</div>
                <div style={{ fontSize: '0.85rem', color: colors.textMuted, fontWeight: 600 }}>Customer Support</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(123, 79, 44, 0.15)', position: 'relative' }}>
          <img src="/About-us.png" alt="Luxury Car" style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
      </section>

      {/* POLICY SECTION (INTERLOCKING DESIGN) */}
      <section style={{ padding: '0 5% 4rem', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', background: '#FFFFFF', borderRadius: '24px', boxShadow: '0 15px 50px rgba(123, 79, 44, 0.06)', position: 'relative', overflow: 'hidden' }}>
          
          {/* Left Card */}
          <div style={{ padding: '4rem', paddingRight: '5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: colors.brown, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icons.FileCheck size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.3rem', color: colors.textDark }}>TERMS & CONDITIONS</h3>
                <p style={{ color: colors.brown, fontWeight: 600, fontSize: '0.85rem' }}>Please read carefully</p>
              </div>
            </div>
            <div style={{ width: '80px', height: '2px', background: colors.creamAccent, marginBottom: '2rem', marginLeft: '88px' }}></div>
            
            <p style={{ color: colors.textMuted, lineHeight: 1.7, marginBottom: '2.5rem', fontSize: '1rem' }}>
              By using our platform, you agree to our terms and conditions. These terms outline your responsibilities and our policies to ensure a seamless experience.
            </p>
            <div style={{ marginBottom: '3rem', flex: 1 }}>
              <div className="list-item"><Icons.CheckCircle size={20} className="list-icon" /> <span>You must be at least 21 years old.</span></div>
              <div className="list-item"><Icons.CheckCircle size={20} className="list-icon" /> <span>A valid driving license is mandatory.</span></div>
              <div className="list-item"><Icons.CheckCircle size={20} className="list-icon" /> <span>Follow all traffic laws and regulations.</span></div>
              <div className="list-item"><Icons.CheckCircle size={20} className="list-icon" /> <span>Vehicle must be returned on time.</span></div>
              <div className="list-item"><Icons.CheckCircle size={20} className="list-icon" /> <span>Pay for any damages caused.</span></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button className="premium-btn">Read Full Terms & Conditions <Icons.ChevronRight size={18} /></button>
            </div>
          </div>

          {/* Right Card */}
          <div style={{ padding: '4rem', paddingLeft: '5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: colors.brown, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icons.Lock size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.3rem', color: colors.textDark }}>PRIVACY POLICY</h3>
                <p style={{ color: colors.brown, fontWeight: 600, fontSize: '0.85rem' }}>Your privacy matters</p>
              </div>
            </div>
            <div style={{ width: '80px', height: '2px', background: colors.creamAccent, marginBottom: '2rem', marginLeft: '88px' }}></div>

            <p style={{ color: colors.textMuted, lineHeight: 1.7, marginBottom: '2.5rem', fontSize: '1rem' }}>
              We are committed to protecting your personal information. Our privacy policy explains how we collect, use, and safeguard your data.
            </p>
            <div style={{ marginBottom: '3rem', flex: 1 }}>
              <div className="list-item"><Icons.CheckCircle size={20} className="list-icon" /> <span>We collect only necessary information.</span></div>
              <div className="list-item"><Icons.CheckCircle size={20} className="list-icon" /> <span>Your data is secure and never shared.</span></div>
              <div className="list-item"><Icons.CheckCircle size={20} className="list-icon" /> <span>We use cookies to improve experience.</span></div>
              <div className="list-item"><Icons.CheckCircle size={20} className="list-icon" /> <span>You can request data deletion anytime.</span></div>
              <div className="list-item"><Icons.CheckCircle size={20} className="list-icon" /> <span>Payment details are fully encrypted.</span></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button className="premium-btn">Read Full Privacy Policy <Icons.ChevronRight size={18} /></button>
            </div>
          </div>
        </div>

        {/* The Interlocking Divider Line */}
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: '4rem',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '12px',
          background: colors.creamAccent,
          zIndex: 5
        }}></div>

        {/* The Interlocking Shield Badge */}
        <div style={{ 
          position: 'absolute', 
          top: 'calc(50% - 2rem)', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          width: '90px', 
          height: '90px', 
          background: colors.brown, 
          color: '#fff', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 10, 
          border: `12px solid ${colors.creamAccent}`
        }}>
          <Icons.ShieldCheckFilled size={40} />
        </div>
      </section>

      {/* SUPPORT SECTION (4 CARDS) */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', padding: '0 5% 5rem' }}>
        <div className="premium-card">
          <IconWrapper><Icons.Headphones size={28} /></IconWrapper>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.2rem' }}>HELP CENTER</h3>
          <p style={{ color: colors.brown, fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase' }}>How can we help?</p>
          <p style={{ color: colors.textMuted, fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>Find answers to common questions and learn more about our services.</p>
          <div style={{ marginBottom: '2rem' }}>
            <div className="list-item" style={{ marginBottom: '0.6rem' }}><Icons.ChevronRight size={16} className="list-icon" /> <span>How to book a car?</span></div>
            <div className="list-item" style={{ marginBottom: '0.6rem' }}><Icons.ChevronRight size={16} className="list-icon" /> <span>Required documents</span></div>
            <div className="list-item" style={{ marginBottom: '0.6rem' }}><Icons.ChevronRight size={16} className="list-icon" /> <span>Payment methods</span></div>
          </div>
          <button onClick={() => setIsChatbotOpen(true)} className="premium-btn" style={{ padding: '0.7rem 1.4rem', fontSize: '0.9rem', width: '100%', justifyContent: 'center' }}>View Help Center</button>
        </div>

        <div className="premium-card">
          <IconWrapper><Icons.Mail size={28} /></IconWrapper>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.2rem' }}>CONTACT SUPPORT</h3>
          <p style={{ color: colors.brown, fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase' }}>We're here to help</p>
          <p style={{ color: colors.textMuted, fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>Our support team is available 24/7 to assist you with any issues.</p>
          <div style={{ marginBottom: '2rem' }}>
            <div className="list-item" style={{ marginBottom: '0.6rem' }}><Icons.Phone size={16} className="list-icon" /> <span>+91 98765 43210</span></div>
            <div className="list-item" style={{ marginBottom: '0.6rem' }}><Icons.Mail size={16} className="list-icon" /> <span>support@royal.com</span></div>
            <div className="list-item" style={{ marginBottom: '0.6rem' }}><Icons.MapPin size={16} className="list-icon" /> <span>123 Royal St, Chennai</span></div>
          </div>
          <button className="premium-btn" style={{ padding: '0.7rem 1.4rem', fontSize: '0.9rem', width: '100%', justifyContent: 'center' }}>Contact Us</button>
        </div>

        <div className="premium-card">
          <IconWrapper><Icons.XCircle size={28} /></IconWrapper>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.2rem' }}>CANCELLATION</h3>
          <p style={{ color: colors.brown, fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase' }}>Cancellation made easy</p>
          <p style={{ color: colors.textMuted, fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>Cancel your booking within the allowed time frame to get a refund.</p>
          <div style={{ marginBottom: '2rem' }}>
            <div className="list-item" style={{ marginBottom: '0.6rem' }}><Icons.Check size={16} className="list-icon" /> <span>Free cancel up to 24h</span></div>
            <div className="list-item" style={{ marginBottom: '0.6rem' }}><Icons.Check size={16} className="list-icon" /> <span>50% refund within 24h</span></div>
            <div className="list-item" style={{ marginBottom: '0.6rem' }}><Icons.Check size={16} className="list-icon" /> <span>No refund within 2h</span></div>
          </div>
          <button onClick={() => setPolicyModal('cancellation')} className="premium-btn" style={{ padding: '0.7rem 1.4rem', fontSize: '0.9rem', width: '100%', justifyContent: 'center' }}>View Policy</button>
        </div>

        <div className="premium-card">
          <IconWrapper><Icons.Banknote size={28} /></IconWrapper>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.2rem' }}>REFUND POLICY</h3>
          <p style={{ color: colors.brown, fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase' }}>Refunds made simple</p>
          <p style={{ color: colors.textMuted, fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>We process refunds quickly and transparently as per our policy.</p>
          <div style={{ marginBottom: '2rem' }}>
            <div className="list-item" style={{ marginBottom: '0.6rem' }}><Icons.Check size={16} className="list-icon" /> <span>Processed in 5-7 days</span></div>
            <div className="list-item" style={{ marginBottom: '0.6rem' }}><Icons.Check size={16} className="list-icon" /> <span>Refund to original</span></div>
            <div className="list-item" style={{ marginBottom: '0.6rem' }}><Icons.Check size={16} className="list-icon" /> <span>No refund for fuel</span></div>
          </div>
          <button onClick={() => setPolicyModal('refund')} className="premium-btn" style={{ padding: '0.7rem 1.4rem', fontSize: '0.9rem', width: '100%', justifyContent: 'center' }}>View Policy</button>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section style={{ display: 'flex', gap: '5rem', padding: '2rem 5% 5rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ background: colors.brown, color: '#fff', padding: '0.5rem 1.2rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, display: 'inline-block', marginBottom: '1.5rem', letterSpacing: '1px' }}>
            FAQS
          </div>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', color: colors.textDark, letterSpacing: '-1px' }}>
            Frequently Asked<br/>Questions
          </h2>
          <div style={{ width: '60px', height: '5px', background: colors.brown, marginBottom: '2rem', borderRadius: '4px' }}></div>
          <p style={{ fontSize: '1.15rem', color: colors.textMuted, lineHeight: 1.7, marginBottom: '3rem' }}>
            Find answers to the most common questions about our services. If you can't find what you're looking for, feel free to contact our support team anytime.
          </p>
          <div style={{ 
            borderRadius: '24px', 
            overflow: 'hidden', 
            background: colors.creamAccent, 
            height: '280px',
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            boxShadow: '0 15px 40px rgba(123, 79, 44, 0.08)' 
          }}>
            {/* Vector City Skyline Silhouette */}
            <div style={{ 
              position: 'absolute', 
              bottom: '0', 
              width: '100%', 
              height: '55%',
              display: 'flex',
              alignItems: 'flex-end',
              opacity: 0.07,
              gap: '6px',
              padding: '0 8%'
            }}>
              {[40, 70, 50, 90, 60, 100, 45, 80, 55, 30].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, background: colors.darkBrown, borderRadius: '8px 8px 0 0' }}></div>
              ))}
            </div>
            
            <img 
              src="/FAQ.png" 
              alt="FAQ Car" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
            />
          </div>
        </div>

        <div style={{ flex: 1.2, paddingTop: '1rem' }}>
          {faqs.map((faq, idx) => {
            const isActive = openFaq === idx;
            return (
              <div 
                key={idx} 
                className={`faq-item ${isActive ? 'active' : ''}`}
                onClick={() => setOpenFaq(isActive ? -1 : idx)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isActive ? '1.5rem 1.8rem 0.8rem' : '1.5rem 1.8rem', cursor: 'pointer' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 700, color: isActive ? colors.brown : colors.textDark }}>
                    {faq.q}
                  </span>
                  <span style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    background: isActive ? colors.brown : colors.lightCream, 
                    color: isActive ? '#fff' : colors.brown, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    transition: 'all 0.3s ease',
                    flexShrink: 0
                  }}>
                    {isActive ? <Icons.Minus size={18} strokeWidth={3} /> : <Icons.Plus size={18} strokeWidth={3} />}
                  </span>
                </div>
                <div style={{ 
                  maxHeight: isActive ? '300px' : '0', 
                  opacity: isActive ? 1 : 0, 
                  overflow: 'hidden', 
                  transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
                  padding: isActive ? '0 1.8rem 1.8rem' : '0 1.8rem'
                }}>
                  <p style={{ margin: 0, color: colors.textMuted, lineHeight: 1.7, fontSize: '1.05rem' }}>
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Policy Modal Overlay */}
      {policyModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '2rem',
            width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative'
          }}>
            <button onClick={() => setPolicyModal(null)} style={{
              position: 'absolute', top: '20px', right: '20px', background: 'transparent',
              border: 'none', cursor: 'pointer', color: 'var(--text-dark)'
            }}>
              <Icons.X size={24} />
            </button>
            
            {policyModal === 'cancellation' && (
              <div style={{ color: 'var(--text-dark)' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--primary-brown)' }}>❌ Cancellation Policy</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Last Updated: August 2026</p>
                
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>1. Before Pickup</h4>
                <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>Cancel up to 24 hours before pickup for a full refund.<br/>Free cancellation if eligible.</p>
                
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>2. Within 24 Hours</h4>
                <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>A small cancellation fee may apply.</p>
                
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>3. After Pickup</h4>
                <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>Once the vehicle is picked up, cancellation is not allowed.</p>
                
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>4. No Show</h4>
                <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>If you don't arrive at the pickup location, the booking may be cancelled automatically without a refund.</p>
                
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>5. Company Policy</h4>
                <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>Cancellation charges may vary depending on the rental company.</p>
                
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>6. Need Help?</h4>
                <p style={{ marginBottom: '2rem', lineHeight: 1.6 }}>📞 Contact our support team for assistance.</p>
              </div>
            )}

            {policyModal === 'refund' && (
              <div style={{ color: 'var(--text-dark)' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--primary-brown)' }}>💰 Refund Policy</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Last Updated: August 2026</p>
                
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>1. Eligible Refunds</h4>
                <ul style={{ marginBottom: '1rem', lineHeight: 1.6, paddingLeft: '20px' }}>
                  <li>Booking cancelled within the free cancellation period.</li>
                  <li>Duplicate payments.</li>
                  <li>Booking cancelled by the rental company.</li>
                </ul>
                
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>2. Processing Time</h4>
                <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>Refunds are processed within 5–7 business days.<br/>The amount is credited to the original payment method.</p>
                
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>3. Non-Refundable Cases</h4>
                <ul style={{ marginBottom: '1rem', lineHeight: 1.6, paddingLeft: '20px' }}>
                  <li>Late cancellations.</li>
                  <li>No-show bookings.</li>
                  <li>Policy violations.</li>
                </ul>
                
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>4. Partial Refund</h4>
                <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>Partial refunds may apply based on the rental company's policy.</p>
                
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>5. Need Help?</h4>
                <p style={{ marginBottom: '2rem', lineHeight: 1.6 }}>📧 Contact Support for refund-related questions.</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
              <button onClick={() => setPolicyModal(null)} className="btn-secondary" style={{ flex: 1, padding: '0.8rem', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', background: '#f5f5f5', border: 'none', fontWeight: 600 }}>Close</button>
              <button onClick={() => { setPolicyModal(null); setIsChatbotOpen(true); }} className="premium-btn" style={{ flex: 1, padding: '0.8rem', textAlign: 'center', justifyContent: 'center' }}>Contact Support</button>
            </div>
          </div>
        </div>
      )}

      <AIChatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
    </div>
  );
}
