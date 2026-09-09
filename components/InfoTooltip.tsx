'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  title?: string;
  description: string;
  tip?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  title,
  description,
  tip,
  placement = 'top',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic afuera en móviles
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const placementClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div 
      ref={containerRef}
      className={`relative inline-flex items-center align-middle ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(prev => !prev);
        }}
        aria-label={title ? `Información sobre ${title}` : 'Información'}
        className="p-0.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition focus:outline-none"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div 
          className={`absolute z-40 w-64 p-3 bg-[#0d1017]/95 border border-[#232730] shadow-xl shadow-black/60 rounded-lg text-left font-sans backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 pointer-events-none sm:pointer-events-auto ${placementClasses[placement]}`}
        >
          {title && (
            <div className="font-bold text-xs text-white mb-1 flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
              <span>{title}</span>
            </div>
          )}
          <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
            {description}
          </p>
          {tip && (
            <div className="mt-2 pt-1.5 border-t border-[#232730]/80 text-[10px] text-amber-400/90 flex items-start gap-1">
              <span className="font-bold flex-shrink-0">Tip:</span>
              <span className="leading-tight">{tip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
