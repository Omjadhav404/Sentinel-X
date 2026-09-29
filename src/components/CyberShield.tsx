'use client';

import React, { useEffect, useRef, useState } from 'react';
import { RiskLevel, SecurityGrade } from '@/lib/scanner/types';

interface CyberShieldProps {
  mode: 'idle' | 'scanning' | 'complete';
  score?: number;
  grade?: SecurityGrade;
  riskLevel?: RiskLevel;
  className?: string;
  size?: number;
}

export const CyberShield: React.FC<CyberShieldProps> = ({
  mode = 'idle',
  score = 88,
  grade = 'A',
  riskLevel = 'Low',
  className = '',
  size = 380,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;
    let scanBeamY = 0;
    let scanBeamDir = 1;
    let pulseScale = 1;

    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // High DPI scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;

    // Particle nodes in 3D orbit
    const particles: Array<{ x: number; y: number; z: number; speed: number; size: number }> = [];
    const particleCount = 28;
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const radius = 100 + Math.random() * 50;
      particles.push({
        x: Math.cos(theta) * radius,
        y: (Math.random() - 0.5) * 120,
        z: Math.sin(theta) * radius,
        speed: (Math.random() * 0.015 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
        size: Math.random() * 2.5 + 1.2,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      // Mouse parallax tilt
      const targetTiltX = (mousePos.x / (window.innerWidth || 1) - 0.5) * 0.4;
      const targetTiltY = (mousePos.y / (window.innerHeight || 1) - 0.5) * 0.4;

      if (!prefersReducedMotion) {
        angle += mode === 'scanning' ? 0.04 : 0.015;
      }

      // Color scheme based on state
      let primaryGlow = 'rgba(0, 242, 254, 0.4)';
      let primaryStroke = '#00f2fe';
      let secondaryStroke = '#3b82f6';
      let coreBg = 'rgba(12, 20, 36, 0.85)';

      if (mode === 'complete') {
        if (riskLevel === 'Low') {
          primaryGlow = 'rgba(16, 185, 129, 0.45)';
          primaryStroke = '#10b981';
          secondaryStroke = '#059669';
          coreBg = 'rgba(6, 30, 22, 0.9)';
        } else if (riskLevel === 'Medium') {
          primaryGlow = 'rgba(245, 158, 11, 0.45)';
          primaryStroke = '#f59e0b';
          secondaryStroke = '#d97706';
          coreBg = 'rgba(34, 24, 7, 0.9)';
        } else {
          primaryGlow = 'rgba(239, 68, 68, 0.55)';
          primaryStroke = '#ef4444';
          secondaryStroke = '#dc2626';
          coreBg = 'rgba(38, 10, 10, 0.9)';
        }
      } else if (mode === 'scanning') {
        primaryGlow = 'rgba(0, 242, 254, 0.65)';
        primaryStroke = '#00f2fe';
        secondaryStroke = '#8b5cf6';
      }

      // 1. Ambient Background Glow
      const glowGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, size * 0.45);
      glowGrad.addColorStop(0, primaryGlow);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // 2. Outer Rotating Telemetry Rings
      ctx.save();
      ctx.translate(centerX, centerY);

      // Ring 1 (Clockwise)
      ctx.save();
      ctx.rotate(angle + targetTiltX);
      ctx.beginPath();
      ctx.arc(0, 0, 145, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Segmented ticks
      ctx.beginPath();
      ctx.arc(0, 0, 145, 0, Math.PI * 0.4);
      ctx.strokeStyle = primaryStroke;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 145, Math.PI, Math.PI * 1.35);
      ctx.strokeStyle = secondaryStroke;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      // Ring 2 (Counter-Clockwise Dashed)
      ctx.save();
      ctx.rotate(-angle * 1.3 - targetTiltY);
      ctx.beginPath();
      ctx.setLineDash([4, 12]);
      ctx.arc(0, 0, 125, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // 3. Orbiting Particles / Network Nodes
      for (const p of particles) {
        if (!prefersReducedMotion) {
          const cosSpeed = Math.cos(p.speed);
          const sinSpeed = Math.sin(p.speed);
          const px = p.x * cosSpeed - p.z * sinSpeed;
          const pz = p.z * cosSpeed + p.x * sinSpeed;
          p.x = px;
          p.z = pz;
        }

        const scale = 250 / (250 + p.z);
        const screenX = p.x * scale;
        const screenY = p.y * scale;

        ctx.fillStyle = p.z > 0 ? primaryStroke : 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(screenX, screenY, Math.max(0.8, p.size * scale), 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby nodes
        if (p.z > 20 && Math.abs(screenX) < 110) {
          ctx.beginPath();
          ctx.moveTo(screenX, screenY);
          ctx.lineTo(0, 0);
          ctx.strokeStyle = 'rgba(0, 242, 254, 0.08)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // 4. Central 3D Cyber Shield Geometry
      ctx.save();
      if (mode === 'scanning') {
        pulseScale = 1 + Math.sin(Date.now() * 0.006) * 0.04;
        ctx.scale(pulseScale, pulseScale);
      }

      // Draw Shield Path
      const drawShieldPath = (w: number, h: number) => {
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.85);
        ctx.lineTo(w * 0.85, -h * 0.7);
        ctx.bezierCurveTo(w * 0.9, -h * 0.1, w * 0.75, h * 0.5, 0, h * 0.95);
        ctx.bezierCurveTo(-w * 0.75, h * 0.5, -w * 0.9, -h * 0.1, -w * 0.85, -h * 0.7);
        ctx.closePath();
      };

      // Outer Shield Shadow / Backing
      ctx.fillStyle = coreBg;
      drawShieldPath(92, 92);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = primaryStroke;
      ctx.shadowColor = primaryStroke;
      ctx.shadowBlur = mode === 'scanning' ? 22 : 12;
      ctx.stroke();

      // Inner Shield Layer
      ctx.shadowBlur = 0;
      drawShieldPath(78, 78);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Scanning Beam Effect
      if (mode === 'scanning') {
        scanBeamY += 2.5 * scanBeamDir;
        if (scanBeamY > 70) scanBeamDir = -1;
        if (scanBeamY < -70) scanBeamDir = 1;

        ctx.save();
        ctx.beginPath();
        drawShieldPath(90, 90);
        ctx.clip();

        const beamGrad = ctx.createLinearGradient(0, scanBeamY - 14, 0, scanBeamY + 14);
        beamGrad.addColorStop(0, 'transparent');
        beamGrad.addColorStop(0.5, 'rgba(0, 242, 254, 0.85)');
        beamGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = beamGrad;
        ctx.fillRect(-95, scanBeamY - 14, 190, 28);
        ctx.restore();
      }

      ctx.restore(); // end shield scale

      ctx.restore(); // end translate center

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mode, score, grade, riskLevel, size, mousePos]);

  return (
    <div
      className={`relative flex items-center justify-center select-none max-w-full ${className}`}
      style={{ width: size, height: size, maxWidth: '100%' }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', maxWidth: size, maxHeight: size }}
        className="block transition-transform duration-300"
      />

      {/* Center Holographic Core Information */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
        {mode === 'idle' && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-12 h-12 rounded-full border border-cyan-400/40 flex items-center justify-center bg-cyan-950/40 backdrop-blur-md mb-2 shadow-[0_0_15px_rgba(0,242,254,0.3)]">
              <svg className="w-6 h-6 text-cyan-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-xs uppercase tracking-widest text-cyan-300/80 font-mono font-semibold">
              Sentinel Active
            </span>
            <span className="text-[10px] text-slate-400">Ready to Inspect</span>
          </div>
        )}

        {mode === 'scanning' && (
          <div className="flex flex-col items-center animate-pulse">
            <span className="text-2xl font-mono font-extrabold text-cyan-400 tracking-wider">
              ANALYZING
            </span>
            <span className="text-[11px] text-cyan-200/90 font-mono tracking-widest uppercase mt-1">
              Passive Probes...
            </span>
          </div>
        )}

        {mode === 'complete' && (
          <div className="flex flex-col items-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-extrabold tracking-tight text-white font-mono drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                {score}
              </span>
              <span className="text-sm font-semibold text-slate-400">/100</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                riskLevel === 'Low'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : riskLevel === 'Medium'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}>
                {riskLevel} Risk
              </span>
              <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800/80 px-1.5 py-0.5 rounded border border-white/10">
                Grade {grade}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
