import { Card } from '../ui/Card';

type BalanceCardProps = {
  balance: string;
  income: string;
  expenses: string;
};

export function BalanceCard({ balance, income, expenses }: BalanceCardProps) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-gold-500/10 blur-2xl" />
      <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Saldo disponible</p>
      <div className="mt-3 text-4xl font-semibold text-stone-50 md:text-5xl">{balance}</div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/5 p-3">
          <p className="text-xs text-stone-400">Ingresos</p>
          <p className="mt-1 text-lg font-semibold text-stone-100">{income}</p>
        </div>
        <div className="rounded-2xl bg-white/5 p-3">
          <p className="text-xs text-stone-400">Gastos</p>
          <p className="mt-1 text-lg font-semibold text-stone-100">{expenses}</p>
        </div>
      </div>
    </Card>
  );
}