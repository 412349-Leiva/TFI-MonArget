import React from 'react';
import { Link } from 'react-router-dom';

const AuthLayout = ({
  title,
  subtitle,
  backTo,
  backLabel,
  onBackClick,
  children,
  footer,
  icon,
}) => (
  <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center px-4 py-12 antialiased">
    <div className="fixed inset-0 z-0 opacity-20">
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px]" />
    </div>

    <div className="relative z-10 w-full max-w-md">
      {backTo && (
        onBackClick ? (
          <button
            type="button"
            onClick={onBackClick}
            className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary mb-6 transition-colors"
          >
            {backLabel}
          </button>
        ) : (
          <Link
            to={backTo}
            className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary mb-6 transition-colors"
          >
            {backLabel}
          </Link>
        )
      )}

      <div className="text-center mb-8">
        {icon && <div className="mb-4 flex justify-center">{icon}</div>}
        <h1 className="font-title-md text-title-md text-primary tracking-tight mb-2">{title}</h1>
        {subtitle && (
          <p className="font-label-sm text-label-sm text-on-surface-variant">{subtitle}</p>
        )}
      </div>

      <div className="glass-card rounded-xl p-8 shadow-2xl space-y-6">{children}</div>

      {footer && <div className="mt-8 text-center">{footer}</div>}
    </div>
  </div>
);

export default AuthLayout;
