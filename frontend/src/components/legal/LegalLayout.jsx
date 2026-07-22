import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../brand/BrandLogo';

const LegalLayout = ({ title, children }) => (
  <div className="min-h-[100dvh] bg-[#080f1a] text-slate-100 antialiased font-body">
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[320px] bg-amber-500/[0.05] rounded-full blur-[100px]" />
    </div>

    <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-8">
        <Link to="/login" className="inline-block">
          <BrandLogo size="md" showTagline />
        </Link>
      </div>

      <article className="rounded-2xl border border-[#1e3352]/80 bg-[#0c1a2e]/90 backdrop-blur-md p-6 sm:p-10 shadow-[0_24px_64px_rgba(0,0,0,0.45)]">
        <h1 className="font-display text-2xl sm:text-3xl text-white tracking-tight mb-6 pb-4 border-b border-[#243a5c]">
          {title}
        </h1>
        <div className="prose-legal space-y-5 text-sm sm:text-[15px] text-slate-300 leading-relaxed">
          {children}
        </div>
      </article>

      <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-slate-500">
        <Link to="/terminos" className="hover:text-amber-400 transition-colors">Términos de servicio</Link>
        <span aria-hidden>·</span>
        <Link to="/privacidad" className="hover:text-amber-400 transition-colors">Privacidad y seguridad</Link>
        <span aria-hidden>·</span>
        <Link to="/login" className="hover:text-amber-400 transition-colors">Volver al inicio</Link>
      </div>

      <p className="text-center text-[11px] text-slate-600 mt-4">
        Última actualización: julio de 2026
      </p>
    </div>
  </div>
);

export default LegalLayout;
