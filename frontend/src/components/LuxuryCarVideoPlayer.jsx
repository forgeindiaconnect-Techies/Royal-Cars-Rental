import React, { useState, useEffect, useRef } from 'react';

export default function LuxuryCarVideoPlayer({ onClose, onBookCar }) {
  const [activeScene, setActiveScene] = useState(1); // 1 to 7
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speedometer, setSpeedometer] = useState(0);

  // 7 Storyboard Scenes matching user specification
  const SCENES = [
    {
      id: 1,
      title: 'Scene 1 — Opening Intro',
      sub: 'Cinematic reveal & Brand Entrance',
      img: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1600&q=80',
      videoUrl: '/videos/royal-luxury-car-commercial.mp4',
      badge: '✨ WELCOME TO ROYAL RENTAL CARS',
      mainText: 'Your Journey. Our Luxury.',
      speed: 0
    },
    {
      id: 2,
      title: 'Scene 2 — Luxury Fleet & Close-Ups',
      sub: 'Sedans, SUVs, Alloys, Headlights & Interior Leather',
      img: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1600&q=80',
      videoUrl: '/videos/Video_BMW_M_Supercars.mp4',
      badge: '🏎️ ULTRA-REALISTIC LUXURY FLEET',
      mainText: 'Polished. Pristine. Unmatched Elegance.',
      speed: 125
    },
    {
      id: 3,
      title: 'Scene 3 — VIP Key Handover & Driving',
      sub: 'Professional Staff Welcome & City Drive',
      img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
      videoUrl: '/videos/vip-delivery-handover.mp4',
      badge: '🤝 PREMIUM CUSTOMER EXPERIENCE',
      mainText: 'Luxury. Comfort. Reliability. Professional Service.',
      speed: 85
    },
    {
      id: 4,
      title: 'Scene 4 — Why Royal Rental Cars?',
      sub: '5 Core Promises of Excellence',
      img: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1600&q=80',
      videoUrl: '/videos/royal-luxury-car-commercial.mp4',
      badge: '⭐ THE ROYAL ADVANTAGE',
      mainText: 'PREMIUM FLEET • EASY BOOKING • FLEXIBLE RENTALS',
      speed: 110
    },
    {
      id: 5,
      title: 'Scene 5 — Executive & Family Journeys',
      sub: 'Business Meetings, Family Travel & Airport Pickups',
      img: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1600&q=80',
      videoUrl: '/videos/bmw-m8-supercar.mp4',
      badge: '💼 TAILORED FOR EVERY TRAVEL NEED',
      mainText: 'Business Executives • Airport Transfers • Special Occasions',
      speed: 130
    },
    {
      id: 6,
      title: 'Scene 6 — Golden Hour Brand Statement',
      sub: 'Slow-Motion Coastal Highway Cruise',
      img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
      videoUrl: '/videos/range-rover-suv.mp4',
      badge: '🌅 BRAND STATEMENT',
      mainText: "MORE THAN A CAR. IT'S YOUR JOURNEY. Experience the Royal Way.",
      speed: 195
    },
    {
      id: 7,
      title: 'Scene 7 — Hero Car & Final CTA',
      sub: 'Modern Architecture Reveal & Booking Call',
      img: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1600&q=80',
      videoUrl: '/videos/royal-luxury-car-commercial.mp4',
      badge: '👑 ROYAL RENTAL CARS',
      mainText: 'BOOK YOUR RIDE TODAY — www.royalrentalcars.com',
      speed: 0
    }
  ];

  const currentSceneObj = SCENES.find(s => s.id === activeScene) || SCENES[0];

  // Auto advance scenes every 12 seconds if playing
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setActiveScene(curr => (curr >= 7 ? 1 : curr + 1));
          return 0;
        }
        return prev + 1.25;
      });
    }, 150);

    return () => clearInterval(timer);
  }, [isPlaying]);

  // Dynamic Telemetry Speedometer update
  useEffect(() => {
    if (!isPlaying) return;
    setSpeedometer(currentSceneObj.speed);

    const speedInterval = setInterval(() => {
      setSpeedometer(prev => {
        if (currentSceneObj.speed === 0) return 0;
        const delta = Math.floor(Math.random() * 7) - 3;
        const val = prev + delta;
        if (val < currentSceneObj.speed - 20) return currentSceneObj.speed - 15;
        if (val > currentSceneObj.speed + 25) return currentSceneObj.speed + 20;
        return val;
      });
    }, 300);

    return () => clearInterval(speedInterval);
  }, [activeScene, isPlaying, currentSceneObj.speed]);

  // Web Audio Synthesizer for V8 Engine Roar sound FX (100% local, no internet dependency)
  const playEngineSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(340, ctx.currentTime + 1.5);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 2.8);
      
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.8);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 2.8);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  const handleSoundToggle = () => {
    setIsMuted(!isMuted);
    if (isMuted) {
      playEngineSound();
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999999,
      background: 'rgba(10, 14, 23, 0.97)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.25rem', boxSizing: 'border-box', fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        width: '100%', maxWidth: '1040px', background: '#0c1427',
        border: '1px solid #d4a359', borderRadius: '24px',
        boxShadow: '0 35px 100px rgba(0,0,0,0.9)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', maxHeight: '94vh'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.75rem', background: '#0b0e14',
          borderBottom: '1px solid rgba(212,163,89,0.35)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #d4a359, #b87a28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', color: '#0d1117', fontWeight: 900
            }}>👑</div>
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-0.3px' }}>
                Royal Rental Cars — Official 4K Commercial
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#d4a359', fontWeight: 800, letterSpacing: '1.5px' }}>
                LUXURY • COMFORT • RELIABILITY • PROFESSIONAL SERVICE
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
              color: '#ffffff', width: '38px', height: '38px', borderRadius: '50%',
              cursor: 'pointer', fontSize: '1.15rem', display: 'flex', alignItems: 'center',
              justifyContent: 'center', transition: 'all 0.2s'
            }}
          >
            ✕
          </button>
        </div>

        {/* 7 Storyboard Scene Navigator Tabs */}
        <div style={{ padding: '0.85rem 1.75rem', background: '#080c14', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '0.6rem', overflowX: 'auto' }}>
          {SCENES.map(s => (
            <button
              key={s.id}
              onClick={() => { setActiveScene(s.id); setProgress(0); setIsPlaying(true); }}
              style={{
                padding: '0.55rem 1.15rem', borderRadius: '30px', border: 'none',
                background: activeScene === s.id ? 'linear-gradient(135deg, #d4a359, #b87a28)' : 'rgba(255,255,255,0.08)',
                color: activeScene === s.id ? '#0d1117' : '#cbd5e1',
                fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0
              }}
            >
              {s.title.split('—')[0]}
            </button>
          ))}
        </div>

        {/* 4K Video Player Display Canvas */}
        <div style={{ position: 'relative', width: '100%', background: '#000000', minHeight: '420px', maxHeight: '520px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <video
            autoPlay
            muted={isMuted}
            controls
            playsInline
            loop
            preload="auto"
            poster={currentSceneObj.img}
            style={{ width: '100%', height: '100%', maxHeight: '520px', objectFit: 'cover' }}
          >
            <source src={currentSceneObj.videoUrl} type="video/mp4" />
            <source src="https://assets.mixkit.co/videos/preview/mixkit-sports-car-driving-on-a-road-41484-large.mp4" type="video/mp4" />
          </video>

          {/* Cinematic Overlay Vignette & Lighting */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: activeScene === 1 ? 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.9) 100%)' : 'linear-gradient(180deg, rgba(10,14,23,0.3) 0%, rgba(10,14,23,0.75) 100%)'
          }} />

          {/* Live HUD Telemetry Speedometer & Scene Info */}
          <div style={{
            position: 'absolute', top: '24px', left: '24px', zIndex: 10,
            background: 'rgba(10, 14, 23, 0.85)', backdropFilter: 'blur(14px)',
            border: '1px solid rgba(212,163,89,0.45)', borderRadius: '16px',
            padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#e5b741', lineHeight: 1 }}>{speedometer}</div>
              <div style={{ fontSize: '0.65rem', color: '#cbd5e1', fontWeight: 800, letterSpacing: '1px' }}>KM/H</div>
            </div>
            <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.25)' }}></div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#d4a359', letterSpacing: '1px' }}>
                {currentSceneObj.badge}
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                {currentSceneObj.sub}
              </div>
            </div>
          </div>

          {/* Cinematic Center Text Overlay (Matching Storyboard) */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            zIndex: 10, textAlign: 'center', width: '90%', pointerEvents: 'none'
          }}>
            {activeScene === 1 && (
              <div style={{ animation: 'fadeIn 1s ease-out' }}>
                <h1 style={{ fontSize: '2.8rem', fontWeight: 900, color: '#ffffff', textShadow: '0 4px 20px rgba(0,0,0,0.8)', letterSpacing: '2px', marginBottom: '0.5rem' }}>
                  WELCOME TO ROYAL RENTAL CARS
                </h1>
                <p style={{ fontSize: '1.4rem', color: '#e5b741', fontWeight: 800, fontStyle: 'italic' }}>
                  Your Journey. Our Luxury.
                </p>
              </div>
            )}

            {activeScene === 4 && (
              <div style={{ background: 'rgba(12, 20, 39, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(212,163,89,0.5)', padding: '1.5rem 2rem', borderRadius: '20px', display: 'inline-block' }}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#e5b741', marginBottom: '0.75rem' }}>WHY ROYAL RENTAL CARS?</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'left', fontSize: '0.82rem', color: '#ffffff' }}>
                  <div><strong>🚗 PREMIUM FLEET:</strong> Wide range of luxury vehicles</div>
                  <div><strong>📋 EASY BOOKING:</strong> Simple 2-min reservation</div>
                  <div><strong>🤝 VIP SERVICE:</strong> Reliable &amp; customer-first</div>
                  <div><strong>🛡️ COMFORT &amp; SAFETY:</strong> Sanitized &amp; pristine</div>
                  <div><strong>🔑 FLEXIBLE RENTALS:</strong> Daily, weekly, monthly</div>
                  <div><strong>📍 DOORSTEP DELIVERY:</strong> Instant GPS dropoff</div>
                </div>
              </div>
            )}

            {activeScene === 6 && (
              <div style={{ animation: 'fadeIn 1s ease-out' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffffff', letterSpacing: '3px', marginBottom: '0.5rem', textShadow: '0 4px 20px rgba(0,0,0,0.9)' }}>
                  MORE THAN A CAR.
                </h2>
                <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#e5b741', letterSpacing: '4px', marginBottom: '0.8rem' }}>
                  IT'S YOUR JOURNEY.
                </h1>
                <p style={{ fontSize: '1.3rem', color: '#ffffff', fontWeight: 700 }}>
                  Experience the Royal Way.
                </p>
              </div>
            )}

            {activeScene === 7 && (
              <div style={{ background: 'rgba(10, 14, 23, 0.9)', border: '1px solid #d4a359', padding: '2rem 2.5rem', borderRadius: '24px', display: 'inline-block', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👑</div>
                <h1 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#ffffff', letterSpacing: '3px', marginBottom: '0.5rem' }}>
                  ROYAL RENTAL CARS
                </h1>
                <div style={{ fontSize: '1.05rem', color: '#e5b741', fontWeight: 800, letterSpacing: '2px', marginBottom: '1.25rem' }}>
                  Luxury • Comfort • Reliability
                </div>
                <button
                  onClick={() => { onClose(); if (onBookCar) onBookCar(); }}
                  className="rd-btn-gold"
                  style={{ padding: '0.9rem 2.5rem', fontSize: '1.05rem' }}
                >
                  BOOK YOUR RIDE TODAY ➔
                </button>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.85rem' }}>
                  www.royalrentalcars.com
                </div>
              </div>
            )}
          </div>

          {/* Bottom Video Progress Control Bar */}
          <div style={{
            position: 'absolute', bottom: '0', left: '0', right: '0', zIndex: 20,
            background: 'linear-gradient(0deg, rgba(10,14,23,0.95) 0%, rgba(10,14,23,0) 100%)',
            padding: '1.25rem 1.75rem 0.85rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem'
          }}>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #d4a359, #e5b741)', transition: 'width 0.15s linear' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                <span style={{ color: '#ffffff', cursor: 'pointer' }} onClick={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? 'PAUSE ❚❚' : 'PLAY ▶'}
                </span>
                <span style={{ color: '#64748b' }}>|</span>
                <span>Scene {activeScene} of 7 — {currentSceneObj.title}</span>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                <button
                  onClick={() => { setActiveScene(1); setProgress(0); setIsPlaying(true); }}
                  style={{
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                    color: '#ffffff', padding: '0.4rem 0.9rem', borderRadius: '16px', fontSize: '0.78rem',
                    fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  🔄 Replay Storyboard
                </button>

                <button
                  onClick={handleSoundToggle}
                  style={{
                    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
                    color: '#ffffff', padding: '0.4rem 0.9rem', borderRadius: '16px', fontSize: '0.78rem',
                    fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
                  }}
                >
                  🔊 Audio FX {isMuted ? '(Muted)' : '(Playing V8 Engine)'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Direct Action Footer inside Modal */}
        <div style={{ padding: '1.25rem 1.75rem', background: '#0b0e14', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '0.88rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ color: '#d4a359' }}>⭐</span> 4K Ultra-Realistic Commercial
            </div>
            <div style={{ fontSize: '0.88rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ color: '#d4a359' }}>🛡️</span> Full Coverage Protection
            </div>
            <div style={{ fontSize: '0.88rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ color: '#d4a359' }}>📍</span> Live GPS &amp; Doorstep Delivery
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.85rem' }}>
            <button
              onClick={() => {
                onClose();
                if (onBookCar) onBookCar();
              }}
              className="rd-btn-gold"
              style={{ padding: '0.85rem 2.2rem', fontSize: '0.98rem' }}
            >
              Book Your Ride Today ➔
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
