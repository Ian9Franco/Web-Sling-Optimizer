'use client';

import React from 'react';
import { Globe, Github, Instagram } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#232730] py-6 mt-12 bg-[#090b10]/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-slate-400">
        <div>
          Desarrollado por <span className="text-slate-200 font-bold">Ian Franco</span> &bull; Proyecto personal de uso libre 🚀
        </div>
        <div className="flex items-center gap-4">
          <a 
            href="https://ian-pontorno-portfolio.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-slate-400 hover:text-[#e62429] transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span>Portafolio</span>
          </a>
          <a 
            href="https://github.com/Ian9Franco" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>GitHub</span>
          </a>
          <a 
            href="https://www.instagram.com/ian.franco._/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-slate-400 hover:text-pink-500 transition-colors"
          >
            <Instagram className="w-4 h-4" />
            <span>Instagram</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
