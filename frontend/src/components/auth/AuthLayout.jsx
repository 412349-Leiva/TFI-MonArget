import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../brand/BrandLogo';

const AuthLayout = ({
  title,
  subtitle,
  showBrand = false,
  backTo,
  backLabel = '← Volver',
  onBackClick,
  children,
  footer,
  icon,
}) => (
  <div className="min-h-screen min-h-[100dvh] bg-[#080f1a] text-slate-100 flex flex-col items-center justify-start sm:justify-center px-4 pt-5 pb-6 sm:py-14 antialiased font-body relative overflow-x-hidden overflow-y-auto">
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[320px] bg-amber-500/[0.05] rounded-full blur-[100px]" />
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#080f1a] to-transparent" />
    </div>

    <div className="relative z-10 w-full max-w-[420px] flex flex-col pt-[env(safe-area-inset-top,0px)]">
      <div className={`text-center ${showBrand ? 'mb-4 sm:mb-5' : 'mb-8 sm:mb-10'}`}>
        {showBrand ? (
          <BrandLogo size="lg" showTagline />
        ) : (
          <>
            {icon && <div className="mb-4 flex justify-center">{icon}</div>}
            <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight mb-2">
              {title}
            </h1>
            {subtitle && <p className="text-tagline">{subtitle}</p>}
          </>
        )}
      </div>

      <div className="rounded-2xl border border-[#1e3352]/80 bg-[#0c1a2e]/90 backdrop-blur-md p-6 sm:p-8 shadow-[0_24px_64px_rgba(0,0,0,0.45)]">
        {children}
      </div>

      {footer && (
        <div className="mt-6 text-center text-xs text-slate-500 leading-relaxed px-2">
          {footer}
        </div>
      )}

      {(backTo || onBackClick) && (
        <div className="mt-5 text-center">
          {onBackClick ? (
            <button
              type="button"
              onClick={onBackClick}
              className="text-sm text-slate-400 hover:text-amber-400 transition-colors"
            >
              {backLabel}
            </button>
          ) : (
            <Link
              to={backTo}
              className="text-sm text-slate-400 hover:text-amber-400 transition-colors"
            >
              {backLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  </div>
);

export default AuthLayout;
