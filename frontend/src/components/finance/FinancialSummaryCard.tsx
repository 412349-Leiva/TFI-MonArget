import { Card } from '../ui/Card';

type FinancialSummaryCardProps = {
  title: string;
  value: string;
  note: string;
};

export function FinancialSummaryCard({ title, value, note }: FinancialSummaryCardProps) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-stone-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-stone-100">{value}</p>
      <p className="mt-1 text-sm text-stone-500">{note}</p>
    </Card>
  );
}