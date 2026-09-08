'use client';

import React, { useEffect, useRef } from 'react';

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
    const spacing = 32; // Tamaño de cada cuadro
    const radius = 220; // Radio de influencia del cursor
    const forceFactor = 28; // Profundidad de hundimiento / deformación
    const spring = 0.06; // Retorno elástico
    const friction = 0.84; // Fricción líquida orgánica

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

    // Estado del ratón
    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      isMoving: false,
      idleTimer: null as any,
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
    };

    const onMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.isMoving = true;

      clearTimeout(mouse.idleTimer);
      mouse.idleTimer = setTimeout(() => {
        mouse.isMoving = false;
      }, 3000);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
        mouse.isMoving = true;
      }
    };

    const onMouseLeave = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
      mouse.isMoving = false;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('resize', initGrid);

    initGrid();

    // Loop de renderizado y simulación física líquida
    const render = () => {
      // Suavizar posición del ratón
      mouse.x += (mouse.targetX - mouse.x) * 0.15;
      mouse.y += (mouse.targetY - mouse.y) * 0.15;

      ctx.clearRect(0, 0, width, height);

      // Actualizar física de cada punto de la malla
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const p = points[r][c];

          // Distancia al cursor
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < radius && dist > 0) {
            // Curva de deformación líquida / hundimiento por gravedad
            const normDist = dist / radius;
            const influence = Math.cos(normDist * (Math.PI / 2)); // Caída suave cosenoidal
            const angle = Math.atan2(dy, dx);

            // Vector de deformación hacia el interior (efecto hundimiento de tela / cama elástica)
            const push = influence * forceFactor;
            const targetX = p.baseX + Math.cos(angle) * push * 0.5;
            const targetY = p.baseY + Math.sin(angle) * push * 0.5;

            // Fuerza impulsora
            p.vx += (targetX - p.x) * 0.1;
            p.vy += (targetY - p.y) * 0.1;
          }

          // Fuerza elástica de retorno a la posición base
          const springX = (p.baseX - p.x) * spring;
          const springY = (p.baseY - p.y) * spring;

          p.vx += springX;
          p.vy += springY;

          // Amortiguación
          p.vx *= friction;
          p.vy *= friction;

          p.x += p.vx;
          p.y += p.vy;
        }
      }

      // Dibujar resplandor sutil donde se hunde la tela bajo el cursor
      if (mouse.x > -500 && mouse.y > -500) {
        const glow = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          radius
        );
        glow.addColorStop(0, 'rgba(37, 99, 235, 0.09)');
        glow.addColorStop(0.5, 'rgba(16, 185, 129, 0.03)');
        glow.addColorStop(1, 'rgba(9, 11, 16, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
      }

      // Dibujar líneas horizontales deformadas
      ctx.lineWidth = 1;
      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        for (let c = 0; c < cols; c++) {
          const p = points[r][c];
          if (c === 0) {
            ctx.moveTo(p.x, p.y);
          } else {
            // Curvas suaves entre nodos para aspecto líquido
            const prev = points[r][c - 1];
            const mx = (prev.x + p.x) / 2;
            const my = (prev.y + p.y) / 2;
            ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
          }
        }
        const last = points[r][cols - 1];
        ctx.lineTo(last.x, last.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.stroke();
      }

      // Dibujar líneas verticales deformadas
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
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.stroke();
      }

      // Dibujar pequeños nodos sutiles iluminados cerca del cursor
      if (mouse.x > -500 && mouse.y > -500) {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const p = points[r][c];
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < radius * 0.75) {
              const alpha = (1 - dist / (radius * 0.75)) * 0.4;
              ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`;
              ctx.beginPath();
              ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
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
