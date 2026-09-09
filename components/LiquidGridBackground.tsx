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
  color: 'blue' | 'cyan' | 'red';
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

    // Configuración de la cuadrícula fluida
    const spacing = 32; // Cuadrícula detallada
    const radius = 260; // Radio de influencia de la estela
    const forceFactor = 36; // Deformación líquida orgánica
    const spring = 0.045; // Retorno elástico suave
    const friction = 0.88; // Fricción sedosa fluida

    interface Point {
      baseX: number;
      baseY: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
      phase: number;
    }

    let cols = 0;
    let rows = 0;
    let points: Point[][] = [];
    const ripples: Ripple[] = [];
    const particles: Particle[] = [];
    const PARTICLE_COUNT = 45;

    let time = 0;
    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      vx: 0,
      vy: 0,
      prevX: -1000,
      prevY: -1000,
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
            phase: Math.random() * Math.PI * 2,
          });
        }
        points.push(row);
      }

      // Inicializar partículas flotantes (estrellas/micro-energía de fondo)
      particles.length = 0;
      const palette: ('blue' | 'cyan' | 'red')[] = ['blue', 'cyan', 'blue', 'cyan', 'red'];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.4 - 0.15,
          size: Math.random() * 1.8 + 0.7,
          alpha: Math.random() * 0.35 + 0.15,
          baseAlpha: Math.random() * 0.35 + 0.15,
          color: palette[Math.floor(Math.random() * palette.length)],
        });
      }
    };

    const triggerRipple = (x: number, y: number, strength = 60) => {
      if (ripples.length > 6) ripples.shift();
      ripples.push({
        x,
        y,
        radius: 8,
        maxRadius: Math.max(width, height) * 0.55,
        strength,
        speed: 6.5,
        alpha: 1,
      });
    };

    const onMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    const onMouseDown = (e: MouseEvent) => {
      triggerRipple(e.clientX, e.clientY, 70);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        mouse.targetX = touch.clientX;
        mouse.targetY = touch.clientY;
        triggerRipple(touch.clientX, touch.clientY, 60);
      }
    };

    const onMouseLeave = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('resize', initGrid);

    initGrid();

    // Loop de renderizado y simulación física líquida
    const render = () => {
      time += 0.02;

      // Calcular velocidad de arrastre del cursor para crear estela líquida (wake)
      if (mouse.prevX > -500) {
        mouse.vx = (mouse.targetX - mouse.prevX) * 0.35;
        mouse.vy = (mouse.targetY - mouse.prevY) * 0.35;
      }
      mouse.prevX = mouse.targetX;
      mouse.prevY = mouse.targetY;

      // Interpolación suave del cursor
      mouse.x += (mouse.targetX - mouse.x) * 0.18;
      mouse.y += (mouse.targetY - mouse.y) * 0.18;

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

      // Parámetros de oleaje fluido multicapa en reposo (fondos vivos y orgánicos)
      const t1 = time * 1.2;
      const t2 = time * 0.8;
      const t3 = time * 0.4;

      // 1. Actualizar física de la cuadrícula
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const p = points[r][c];

          // Ondas armónicas multidireccionales orgánicas
          const waveX =
            Math.sin(t1 + p.baseY * 0.008 + p.baseX * 0.004) * 6.5 +
            Math.cos(t2 - p.baseY * 0.005) * 3.5;
          const waveY =
            Math.cos(t1 + p.baseX * 0.008 - p.baseY * 0.004) * 6.5 +
            Math.sin(t3 + p.baseX * 0.006) * 4.0;

          const targetBaseX = p.baseX + waveX;
          const targetBaseY = p.baseY + waveY;

          // Interacción con el cursor (estela / fluido al deslizar, sin foco)
          if (mouse.x > -500 && mouse.y > -500) {
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < radius && dist > 0) {
              const normDist = dist / radius;
              const influence = Math.cos(normDist * (Math.PI / 2)); // Caída cosenoidal
              const angle = Math.atan2(dy, dx);

              // Hundimiento elástico + arrastre por la velocidad del cursor (estela de agua)
              const push = influence * forceFactor;
              const dragX = mouse.vx * influence * 1.2;
              const dragY = mouse.vy * influence * 1.2;

              const targetX = targetBaseX + Math.cos(angle) * push * 0.5 + dragX;
              const targetY = targetBaseY + Math.sin(angle) * push * 0.5 + dragY;

              p.vx += (targetX - p.x) * 0.12;
              p.vy += (targetY - p.y) * 0.12;
            }
          }

          // Interacción con ondas de choque (Ripples)
          for (let i = 0; i < ripples.length; i++) {
            const rip = ripples[i];
            const rdx = p.x - rip.x;
            const rdy = p.y - rip.y;
            const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
            const waveDist = Math.abs(rdist - rip.radius);

            if (waveDist < 70 && rdist > 0) {
              const wavePower = (1 - waveDist / 70) * rip.alpha * rip.strength * 0.1;
              const angle = Math.atan2(rdy, rdx);
              p.vx += Math.cos(angle) * wavePower;
              p.vy += Math.sin(angle) * wavePower;
            }
          }

          // Fuerza elástica de retorno
          p.vx += (targetBaseX - p.x) * spring;
          p.vy += (targetBaseY - p.y) * spring;

          // Amortiguación líquida
          p.vx *= friction;
          p.vy *= friction;

          p.x += p.vx;
          p.y += p.vy;
        }
      }

      // 2. Dibujar líneas horizontales de la tela líquida con curvatura suave
      ctx.lineWidth = 1;
      for (let r = 0; r < rows; r++) {
        // Pulso de brillo que viaja sutilmente por las líneas del fondo
        const rowPulse = (Math.sin(time * 1.5 + r * 0.35) + 1) * 0.5;
        const alpha = 0.05 + rowPulse * 0.035;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;

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
        ctx.stroke();
      }

      // 3. Dibujar líneas verticales de la tela líquida
      for (let c = 0; c < cols; c++) {
        const colPulse = (Math.cos(time * 1.2 + c * 0.3) + 1) * 0.5;
        const alpha = 0.05 + colPulse * 0.035;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;

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
        ctx.stroke();
      }

      // 4. Dibujar ondas de choque sutiles que se propagan
      for (let i = 0; i < ripples.length; i++) {
        const rip = ripples[i];
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${rip.alpha * 0.25})`;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      // 5. Dibujar partículas / estelas de polvo de estrellas en segundo plano
      for (let i = 0; i < particles.length; i++) {
        const pt = particles[i];

        // Movimiento con corriente líquida
        pt.x += pt.vx;
        pt.y += pt.vy;

        // Repeler sutilmente por el cursor sin foco de luz
        if (mouse.x > -500 && mouse.y > -500) {
          const pdx = pt.x - mouse.x;
          const pdy = pt.y - mouse.y;
          const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
          if (pdist < 120 && pdist > 0) {
            const force = (1 - pdist / 120) * 1.5;
            pt.x += (pdx / pdist) * force;
            pt.y += (pdy / pdist) * force;
          }
        }

        // Loop continuo en los bordes
        if (pt.x < 0) pt.x = width;
        if (pt.x > width) pt.x = 0;
        if (pt.y < 0) pt.y = height;
        if (pt.y > height) pt.y = 0;

        // Titilación sutil
        const twinkle = Math.sin(time * 2.5 + i * 1.3) * 0.12;
        const currentAlpha = Math.max(0.06, Math.min(0.65, pt.baseAlpha + twinkle));

        if (pt.color === 'blue') {
          ctx.fillStyle = `rgba(59, 130, 246, ${currentAlpha})`;
        } else if (pt.color === 'cyan') {
          ctx.fillStyle = `rgba(34, 211, 238, ${currentAlpha})`;
        } else {
          ctx.fillStyle = `rgba(239, 68, 68, ${currentAlpha * 0.75})`;
        }

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. Viñeta atmosférica de profundidad 3D (hunde el fondo y separa visualmente las tarjetas flotantes)
      const depthVignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.25,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8
      );
      depthVignette.addColorStop(0, 'rgba(9, 11, 16, 0)');
      depthVignette.addColorStop(0.65, 'rgba(7, 9, 14, 0.45)');
      depthVignette.addColorStop(1, 'rgba(3, 4, 7, 0.82)');
      ctx.fillStyle = depthVignette;
      ctx.fillRect(0, 0, width, height);

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


