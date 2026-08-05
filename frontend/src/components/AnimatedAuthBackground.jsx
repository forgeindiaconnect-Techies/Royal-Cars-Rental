import React, { useEffect, useRef, useState } from 'react';

export default function AnimatedAuthBackground({ children }) {
  const canvasRef = useRef(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  // Handle Mouse Movement for Smooth Parallax & Particle Physics
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    
    // Normalize mouse coords (-1 to +1)
    const normX = (clientX / innerWidth - 0.5) * 2;
    const normY = (clientY / innerHeight - 0.5) * 2;

    // Smooth spring parallax (subtle shift: max 12px)
    setParallax({ x: normX * 12, y: normY * 12 });
  };

  // Interactive Particle Constellation Network Canvas (Matching Attached Reference Image)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate Particles / Constellation Nodes
    const particleCount = Math.min(Math.floor((width * height) / 11000), 80);
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2.2 + 1.2,
        color: Math.random() > 0.4 ? '#3b82f6' : Math.random() > 0.5 ? '#a855f7' : '#94a3b8',
      });
    }

    let mouseX = -1000;
    let mouseY = -1000;

    const onPointerMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', onPointerMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw lines between close particles & mouse connection
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        // Update position
        p1.x += p1.vx;
        p1.y += p1.vy;

        // Bounce off canvas edges
        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        // Mouse attraction/repulsion interaction
        const dxMouse = mouseX - p1.x;
        const dyMouse = mouseY - p1.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distMouse < 140) {
          const force = (140 - distMouse) / 140;
          p1.x -= (dxMouse / distMouse) * force * 1.5;
          p1.y -= (dyMouse / distMouse) * force * 1.5;
        }

        // Draw particle point
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = p1.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p1.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Connect nearby particles with glowing lines (Constellation Net)
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const alpha = 1 - dist / 130;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(148, 163, 184, ${alpha * 0.35})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onPointerMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#070a12',
        color: '#ffffff',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* 1. FLOATING GRADIENT GLOW BLOBS */}
      <div
        style={{
          position: 'absolute',
          top: '12%',
          left: '8%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.3) 0%, rgba(37,99,235,0) 70%)',
          filter: 'blur(80px)',
          transform: `translate3d(${parallax.x * 1.4}px, ${parallax.y * 1.4}px, 0)`,
          transition: 'transform 0.4s cubic-bezier(0.1, 0.8, 0.3, 1)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '12%',
          right: '10%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.25) 0%, rgba(168,85,247,0) 70%)',
          filter: 'blur(90px)',
          transform: `translate3d(${-parallax.x * 1.2}px, ${-parallax.y * 1.2}px, 0)`,
          transition: 'transform 0.4s cubic-bezier(0.1, 0.8, 0.3, 1)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '320px',
          height: '320px',
          margin: '-160px 0 0 -160px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.18) 0%, rgba(56,189,248,0) 70%)',
          filter: 'blur(75px)',
          transform: `translate3d(${parallax.x * 0.8}px, ${parallax.y * 0.8}px, 0)`,
          transition: 'transform 0.3s ease-out',
          pointerEvents: 'none',
        }}
      />

      {/* 2. CONSTELLATION MESH CANVAS */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
          transform: `translate3d(${parallax.x * 0.5}px, ${parallax.y * 0.5}px, 0)`,
          transition: 'transform 0.2s ease-out',
        }}
      />

      {/* 3. PARALLAX CONTAINER WRAPPING AUTH CARD */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem 1rem',
          transform: `translate3d(${-parallax.x * 0.3}px, ${-parallax.y * 0.3}px, 0)`,
          transition: 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
