import type { HTMLAttributes } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = '', ...props }: CardProps) {
  return <div className={`rounded-[28px] border border-white/10 bg-white/6 shadow-soft ${className}`} {...props} />;
}