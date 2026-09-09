'use client';

import React, { useEffect, useRef } from 'react';

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  strength: number;
  speed: number;
  alpha: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  color: 'blue' | 'crimson' | 'cyan';
}

export const LiquidGridBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Configuración de la cuadrícula y física elástica líquida
    const spacing = 34; // Espacio entre puntos de la cuadrícula
    const radius = 240; // Radio de influencia del cursor
    const forceFactor = 32; // Profundidad de hundimiento / deformación
    const spring = 0.055; // Retorno elástico
    const friction = 0.86; // Fricción líquida fluida

    interface Point {
      baseX: number;
      baseY: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
    }

    let cols = 0;
    let rows = 0;
    let points: Point[][] = [];
    const ripples: Ripple[] = [];
    const particles: Particle[] = [];
    const PARTICLE_COUNT = 36;

    // Estado del ratón y tiempo
    let time = 0;
    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      isMoving: false,
      speed: 0,
      prevX: -1000,
      prevY: -1000,
      idleTimer: null as ReturnType<typeof setTimeout> | null,
    };

    const initGrid = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      cols = Math.ceil(width / spacing) + 2;
      rows = Math.ceil(height / spacing) + 2;
      points = [];

      for (let r = 0; r < rows; r++) {
        const row: Point[] = [];
        for (let c = 0; c < cols; c++) {
          const baseX = c * spacing - spacing / 2;
          const baseY = r * spacing - spacing / 2;
          row.push({
            baseX,
            baseY,
            x: baseX,
            y: baseY,
            vx: 0,
            vy: 0,
          });
        }
        points.push(row);
      }

      // Inicializar micro-partículas luminosas
      particles.length = 0;
      const colors: ('blue' | 'crimson' | 'cyan')[] = ['blue', 'cyan', 'crimson', 'blue'];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4 - 0.2, // ligera tendencia ascendente
          size: Math.random() * 1.8 + 0.8,
          alpha: Math.random() * 0.4 + 0.15,
          baseAlpha: Math.random() * 0.35 + 0.15,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const triggerRipple = (x: number, y: number, strength = 45) => {
      if (ripples.length > 5) ripples.shift();
      ripples.push({
        x,
        y,
        radius: 10,
        maxRadius: Math.max(width, height) * 0.45,
        strength,
        speed: 5.5,
        alpha: 1,
      });
    };

    const onMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.isMoving = true;

      if (mouse.idleTimer) clearTimeout(mouse.idleTimer);
      mouse.idleTimer = setTimeout(() => {
        mouse.isMoving = false;
      }, 2500);
    };

    const onMouseDown = (e: MouseEvent) => {
      triggerRipple(e.clientX, e.clientY, 55);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
        mouse.isMoving = true;
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        mouse.targetX = touch.clientX;
        mouse.targetY = touch.clientY;
        triggerRipple(touch.clientX, touch.clientY, 50);
      }
    };

    const onMouseLeave = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
      mouse.isMoving = false;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('resize', initGrid);

    initGrid();

    // Loop principal de renderizado y simulación física líquida
    const render = () => {
      time += 0.016;

      // Calcular velocidad de movimiento del ratón
      if (mouse.prevX > -500) {
        const mdx = mouse.targetX - mouse.prevX;
        const mdy = mouse.targetY - mouse.prevY;
        mouse.speed = Math.sqrt(mdx * mdx + mdy * mdy);
      }
      mouse.prevX = mouse.targetX;
      mouse.prevY = mouse.targetY;

      // Suavizar posición del ratón (interpolación elástica)
      mouse.x += (mouse.targetX - mouse.x) * 0.14;
      mouse.y += (mouse.targetY - mouse.y) * 0.14;

      ctx.clearRect(0, 0, width, height);

      // Actualizar ondas de choque (ripples)
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.radius += rip.speed;
        rip.alpha = Math.max(0, 1 - rip.radius / rip.maxRadius);
        if (rip.radius >= rip.maxRadius || rip.alpha <= 0) {
          ripples.splice(i, 1);
        }
      }

      // Ondulación armónica sutil en reposo (efecto respiración líquida)
      const waveFreq1 = 0.006;
      const waveFreq2 = 0.008;
      const waveTime = time * 1.5;

      // Actualizar física de cada nodo de la malla
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const p = points[r][c];

          // 1. Oscilación suave idle (oleaje orgánico)
          const idleWaveX = Math.sin(waveTime + p.baseY * waveFreq1) * 3.5;
          const idleWaveY = Math.cos(waveTime + p.baseX * waveFreq2) * 3.5;
          const targetBaseX = p.baseX + idleWaveX;
          const targetBaseY = p.baseY + idleWaveY;

          // 2. Interacción con el cursor (hundimiento y arrastre magnético)
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < radius && dist > 0) {
            const normDist = dist / radius;
            const influence = Math.cos(normDist * (Math.PI / 2)); // Caída suave cosenoidal
            const angle = Math.atan2(dy, dx);

            // Deformación hacia el interior + leve arrastre dinámico
            const push = influence * forceFactor;
            const targetX = targetBaseX + Math.cos(angle) * push * 0.6;
            const targetY = targetBaseY + Math.sin(angle) * push * 0.6;

            p.vx += (targetX - p.x) * 0.12;
            p.vy += (targetY - p.y) * 0.12;
          }

          // 3. Interacción con ondas de choque por clic (Ripples)
          for (let i = 0; i < ripples.length; i++) {
            const rip = ripples[i];
            const rdx = p.x - rip.x;
            const rdy = p.y - rip.y;
            const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
            const waveDist = Math.abs(rdist - rip.radius);

            if (waveDist < 60 && rdist > 0) {
              const wavePower = (1 - waveDist / 60) * rip.alpha * rip.strength * 0.08;
              const angle = Math.atan2(rdy, rdx);
              p.vx += Math.cos(angle) * wavePower;
              p.vy += Math.sin(angle) * wavePower;
            }
          }

          // 4. Fuerza elástica restauradora
          const springX = (targetBaseX - p.x) * spring;
          const springY = (targetBaseY - p.y) * spring;

          p.vx += springX;
          p.vy += springY;

          // 5. Amortiguación líquida
          p.vx *= friction;
          p.vy *= friction;

          p.x += p.vx;
          p.y += p.vy;
        }
      }

      // Resplandor de energía de fondo en el cursor
      if (mouse.x > -500 && mouse.y > -500) {
        // Halo primario Cyber Blue
        const glowRadius = radius * 1.3;
        const glow = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          glowRadius
        );
        glow.addColorStop(0, 'rgba(37, 99, 235, 0.14)');
        glow.addColorStop(0.35, 'rgba(147, 51, 234, 0.06)');
        glow.addColorStop(0.7, 'rgba(239, 68, 68, 0.03)');
        glow.addColorStop(1, 'rgba(9, 11, 16, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);

        // Halo secundario de pulso
        const pulse = (Math.sin(time * 3) + 1) * 0.5;
        const innerGlow = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          80 + pulse * 20
        );
        innerGlow.addColorStop(0, 'rgba(56, 189, 248, 0.20)');
        innerGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = innerGlow;
        ctx.fillRect(0, 0, width, height);
      }

      // Dibujar anillos sutiles de ripples en el lienzo
      for (let i = 0; i < ripples.length; i++) {
        const rip = ripples[i];
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(59, 130, 246, ${rip.alpha * 0.22})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Dibujar líneas horizontales de la malla con gradiente fluido
      ctx.lineWidth = 1;
      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        for (let c = 0; c < cols; c++) {
          const p = points[r][c];
          if (c === 0) {
            ctx.moveTo(p.x, p.y);
          } else {
            const prev = points[r][c - 1];
            const mx = (prev.x + p.x) / 2;
            const my = (prev.y + p.y) / 2;
            ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
          }
        }
        const last = points[r][cols - 1];
        ctx.lineTo(last.x, last.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.065)';
        ctx.stroke();
      }

      // Dibujar líneas verticales de la malla
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        for (let r = 0; r < rows; r++) {
          const p = points[r][c];
          if (r === 0) {
            ctx.moveTo(p.x, p.y);
          } else {
            const prev = points[r - 1][c];
            const mx = (prev.x + p.x) / 2;
            const my = (prev.y + p.y) / 2;
            ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
          }
        }
        const last = points[rows - 1][c];
        ctx.lineTo(last.x, last.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.065)';
        ctx.stroke();
      }

      // Dibujar líneas de tensión cromática (resaltan cerca del cursor con gradiente dinámico)
      if (mouse.x > -500 && mouse.y > -500) {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const p = points[r][c];
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Nodos luminosos reactivos
            if (dist < radius * 0.85) {
              const factor = 1 - dist / (radius * 0.85);
              const nodeAlpha = factor * 0.65;

              // Alternar color entre cian/azul y carmesí eléctrico cerca del centro
              if (dist < radius * 0.35) {
                ctx.fillStyle = `rgba(244, 63, 94, ${nodeAlpha * 0.9})`; // Spider-Red highlight
              } else {
                ctx.fillStyle = `rgba(56, 189, 248, ${nodeAlpha * 0.8})`; // Cyan/Blue
              }

              ctx.beginPath();
              ctx.arc(p.x, p.y, 1.4 + factor * 1.2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // Renderizar y actualizar micro-partículas flotantes (Stardust / Embers)
      for (let i = 0; i < particles.length; i++) {
        const pt = particles[i];

        // Deriva de la partícula
        pt.x += pt.vx;
        pt.y += pt.vy;

        // Repeler suavemente por el ratón si está cerca
        if (mouse.x > -500 && mouse.y > -500) {
          const pdx = pt.x - mouse.x;
          const pdy = pt.y - mouse.y;
          const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
          if (pdist < 140 && pdist > 0) {
            const force = (1 - pdist / 140) * 1.8;
            pt.x += (pdx / pdist) * force;
            pt.y += (pdy / pdist) * force;
          }
        }

        // Loop en los bordes de la pantalla
        if (pt.x < 0) pt.x = width;
        if (pt.x > width) pt.x = 0;
        if (pt.y < 0) pt.y = height;
        if (pt.y > height) pt.y = 0;

        // Parpadeo suave
        const twinkle = Math.sin(time * 2 + i) * 0.15;
        const currentAlpha = Math.max(0.05, Math.min(0.8, pt.baseAlpha + twinkle));

        if (pt.color === 'blue') {
          ctx.fillStyle = `rgba(59, 130, 246, ${currentAlpha})`;
        } else if (pt.color === 'cyan') {
          ctx.fillStyle = `rgba(34, 211, 238, ${currentAlpha})`;
        } else {
          ctx.fillStyle = `rgba(244, 63, 94, ${currentAlpha * 0.85})`;
        }

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('resize', initGrid);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
    />
  );
};

