import type { InputHTMLAttributes, ReactNode } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helperText?: string;
  icon?: ReactNode;
};

export function Input({ label, helperText, icon, className = '', ...props }: InputProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-stone-400">{label}</span>
      <div className="relative">
        {icon ? <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-500">{icon}</span> : null}
        <input
          className={`w-full rounded-2xl border border-white/10 bg-white/8 py-3 text-sm text-stone-100 placeholder:text-stone-500 outline-none transition focus:border-gold-500/60 focus:ring-2 focus:ring-gold-500/20 ${icon ? 'pl-11 pr-4' : 'px-4'} ${className}`}
          {...props}
        />
      </div>
      {helperText ? <span className="mt-2 block text-xs text-stone-500">{helperText}</span> : null}
    </label>
  );
}