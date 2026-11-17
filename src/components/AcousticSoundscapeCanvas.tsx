import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  color: string;
  pulseSpeed: number;
  pulseOffset: number;
}

interface WaveConfig {
  baseYPercent: number; // 0 to 1
  amplitude: number;
  frequency: number;
  speed: number;
  colorStart: string;
  colorEnd: string;
  lineWidth: number;
  phase: number;
}

const PARTICLE_COLORS = [
  'rgba(167, 139, 250, ', // violet
  'rgba(192, 132, 252, ', // purple
  'rgba(129, 140, 248, ', // indigo
  'rgba(232, 121, 249, ', // fuchsia
];

export const AcousticSoundscapeCanvas: React.FC = React.memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const handleResize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Mouse tracking for fluid wave ripple
    const mouse = { x: -9999, y: -9999, targetX: -9999, targetY: -9999, radius: 220 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.targetX = -9999;
      mouse.targetY = -9999;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    // Initialize 36 stardust particles
    const particleCount = 36;
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const baseAlpha = 0.25 + Math.random() * 0.45;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -0.25 - Math.random() * 0.45, // upward drift
        radius: 1.2 + Math.random() * 2.2,
        baseAlpha,
        alpha: baseAlpha,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    // Initialize 4 layered harmonic wave ribbons
    const waves: WaveConfig[] = [
      {
        baseYPercent: 0.38,
        amplitude: 42,
        frequency: 0.0018,
        speed: 0.012,
        colorStart: 'rgba(139, 92, 246, 0.45)', // Vivid violet
        colorEnd: 'rgba(99, 102, 241, 0.15)',   // Indigo
        lineWidth: 1.8,
        phase: 0,
      },
      {
        baseYPercent: 0.42,
        amplitude: 56,
        frequency: 0.0014,
        speed: 0.009,
        colorStart: 'rgba(168, 85, 247, 0.4)',  // Purple
        colorEnd: 'rgba(217, 70, 239, 0.12)',   // Fuchsia
        lineWidth: 1.5,
        phase: 1.8,
      },
      {
        baseYPercent: 0.46,
        amplitude: 38,
        frequency: 0.0022,
        speed: 0.015,
        colorStart: 'rgba(79, 70, 229, 0.35)',  // Deep Indigo
        colorEnd: 'rgba(147, 51, 234, 0.1)',    // Deep Violet
        lineWidth: 1.4,
        phase: 3.2,
      },
      {
        baseYPercent: 0.50,
        amplitude: 48,
        frequency: 0.0016,
        speed: 0.008,
        colorStart: 'rgba(192, 38, 211, 0.3)',  // Cyber magenta
        colorEnd: 'rgba(124, 58, 237, 0.08)',   // Violet
        lineWidth: 1.2,
        phase: 4.5,
      },
    ];

    let time = 0;

    const render = () => {
      // Smooth mouse lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Flowing Harmonic Wave Ribbons
      waves.forEach((wave, idx) => {
        const baseY = height * wave.baseYPercent;
        ctx.beginPath();

        const grad = ctx.createLinearGradient(0, baseY - wave.amplitude, width, baseY + wave.amplitude);
        grad.addColorStop(0, wave.colorStart);
        grad.addColorStop(0.5, idx % 2 === 0 ? 'rgba(167, 139, 250, 0.5)' : 'rgba(129, 140, 248, 0.45)');
        grad.addColorStop(1, wave.colorEnd);

        ctx.strokeStyle = grad;
        ctx.lineWidth = wave.lineWidth;
        ctx.lineCap = 'round';

        const step = 14;
        let first = true;

        for (let x = 0; x <= width + step; x += step) {
          // Double sine superposition for organic wave movement
          const sin1 = Math.sin(x * wave.frequency + time * wave.speed + wave.phase);
          const sin2 = Math.cos(x * wave.frequency * 0.65 - time * wave.speed * 0.8);
          let y = baseY + (sin1 * 0.7 + sin2 * 0.3) * wave.amplitude;

          // Interactive mouse deflection
          const distToMouse = Math.hypot(x - mouse.x, y - mouse.y);
          if (distToMouse < mouse.radius) {
            const force = (1 - distToMouse / mouse.radius);
            y += Math.sin(distToMouse * 0.05 - time * 0.05) * force * 30;
          }

          if (first) {
            ctx.moveTo(x, y);
            first = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      // 2. Draw Floating Stardust Audio Particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around screen edges
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        // Alpha twinkle pulse
        p.alpha = p.baseAlpha * (0.65 + 0.35 * Math.sin(time * p.pulseSpeed + p.pulseOffset));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha.toFixed(2)})`;
        ctx.fill();

        // Subtle outer glow around slightly larger particles
        if (p.radius > 2.0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${(p.alpha * 0.25).toFixed(2)})`;
          ctx.fill();
        }
      });

      time += 1;
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="soundscape-canvas"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    />
  );
});

AcousticSoundscapeCanvas.displayName = 'AcousticSoundscapeCanvas';
