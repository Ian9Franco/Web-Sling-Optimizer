'use client';

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  title?: string;
  description: string;
  tip?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  className?: string;
}

const TOOLTIP_WIDTH = 288; // w-72
const TOOLTIP_GAP = 8;
const VIEWPORT_PADDING = 12;

type ResolvedPlacement = 'top' | 'bottom' | 'left' | 'right';

function resolvePlacement(
  triggerRect: DOMRect,
  tooltipHeight: number,
  preferred: ResolvedPlacement | 'auto'
): ResolvedPlacement {
  if (preferred !== 'auto') return preferred;

  const spaceTop = triggerRect.top;
  const spaceBottom = window.innerHeight - triggerRect.bottom;
  const spaceRight = window.innerWidth - triggerRect.right;
  const spaceLeft = triggerRect.left;

  if (spaceBottom >= tooltipHeight + TOOLTIP_GAP || spaceBottom >= spaceTop) {
    return 'bottom';
  }
  if (spaceTop >= tooltipHeight + TOOLTIP_GAP) {
    return 'top';
  }
  if (spaceRight >= TOOLTIP_WIDTH + TOOLTIP_GAP) {
    return 'right';
  }
  if (spaceLeft >= TOOLTIP_WIDTH + TOOLTIP_GAP) {
    return 'left';
  }
  return 'bottom';
}

function computePosition(
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  placement: ResolvedPlacement
): { top: number; left: number } {
  let top = 0;
  let left = 0;

  switch (placement) {
    case 'top':
      top = triggerRect.top - tooltipRect.height - TOOLTIP_GAP;
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      break;
    case 'bottom':
      top = triggerRect.bottom + TOOLTIP_GAP;
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      break;
    case 'left':
      top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      left = triggerRect.left - tooltipRect.width - TOOLTIP_GAP;
      break;
    case 'right':
      top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      left = triggerRect.right + TOOLTIP_GAP;
      break;
  }

  left = Math.max(
    VIEWPORT_PADDING,
    Math.min(left, window.innerWidth - tooltipRect.width - VIEWPORT_PADDING)
  );
  top = Math.max(
    VIEWPORT_PADDING,
    Math.min(top, window.innerHeight - tooltipRect.height - VIEWPORT_PADDING)
  );

  return { top, left };
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  title,
  description,
  tip,
  placement = 'auto',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [effectivePlacement, setEffectivePlacement] = useState<ResolvedPlacement>('bottom');
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoveringRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const resolved = resolvePlacement(triggerRect, tooltipRect.height, placement);
    setEffectivePlacement(resolved);
    setCoords(computePosition(triggerRect, tooltipRect, resolved));
  }, [placement]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
  }, [isOpen, description, tip, title, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleReposition = () => updatePosition();
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isOpen, updatePosition]);

  const scheduleClose = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      if (!isHoveringRef.current) setIsOpen(false);
    }, 120);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        tooltipRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const tooltipContent = isOpen && isMounted ? (
    createPortal(
      <div
        ref={tooltipRef}
        role="tooltip"
        style={{ top: coords.top, left: coords.left }}
        className="fixed z-[9999] w-72 max-w-[calc(100vw-24px)] p-3 bg-[#0c0e14]/98 border border-[#262e42] shadow-2xl shadow-black/90 rounded-xl text-left font-sans backdrop-blur-xl pointer-events-auto"
        onMouseEnter={() => {
          isHoveringRef.current = true;
          cancelClose();
        }}
        onMouseLeave={() => {
          isHoveringRef.current = false;
          scheduleClose();
        }}
        data-placement={effectivePlacement}
      >
        {title && (
          <div className="font-bold text-xs text-white mb-1.5 flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] shadow-[0_0_6px_#2563eb] flex-shrink-0" />
            <span className="leading-tight">{title}</span>
          </div>
        )}
        <p className="text-[11px] text-slate-300 leading-relaxed font-normal break-words">
          {description}
        </p>
        {tip && (
          <div className="mt-2 pt-1.5 border-t border-[#232730]/80 text-[10px] text-amber-400/95 flex items-start gap-1">
            <span className="font-bold flex-shrink-0">Tip:</span>
            <span className="leading-relaxed text-amber-300/90 break-words">{tip}</span>
          </div>
        )}
      </div>,
      document.body
    )
  ) : null;

  return (
    <div className={`relative inline-flex items-center align-middle ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        onMouseEnter={() => {
          cancelClose();
          setIsOpen(true);
        }}
        onMouseLeave={() => scheduleClose()}
        aria-label={title ? `Información sobre ${title}` : 'Información'}
        aria-expanded={isOpen}
        className="p-0.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition focus:outline-none focus-visible:ring-1 focus-visible:ring-[#2563eb]"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {tooltipContent}
    </div>
  );
};
