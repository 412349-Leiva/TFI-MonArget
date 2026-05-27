import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
};

const variants = {
  primary: 'bg-gold-500 text-navy-950 hover:bg-gold-600 shadow-glow',
  secondary: 'bg-white/8 text-stone-100 hover:bg-white/12 border border-white/10',
  ghost: 'bg-transparent text-stone-200 hover:bg-white/8',
};

export function Button({ children, className = '', variant = 'primary', fullWidth, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}