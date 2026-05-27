import type { ReactNode } from 'react';
import { Card } from '../ui/Card';

type QuickActionCardProps = {
  label: string;
  icon: ReactNode;
  accent?: 'gold' | 'rose' | 'sky' | 'violet';
  onClick?: () => void;
};

const accentMap = {
  gold: 'text-gold-500 bg-gold-500/10 border-gold-500/20',
  rose: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  sky: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  violet: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
};

export function QuickActionCard({ label, icon, accent = 'sky', onClick }: QuickActionCardProps) {
  return (
    <Card className="flex flex-col items-center gap-3 p-4 text-center" onClick={onClick as never}>
      <div className={`grid h-12 w-12 place-items-center rounded-2xl border ${accentMap[accent]}`}>{icon}</div>
      <span className="text-sm text-stone-200">{label}</span>
    </Card>
  );
}