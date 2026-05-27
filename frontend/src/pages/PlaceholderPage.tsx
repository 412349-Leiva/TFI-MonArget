import { Card } from '../components/ui/Card';

type PlaceholderPageProps = {
  title: string;
  subtitle: string;
};

export function PlaceholderPage({ title, subtitle }: PlaceholderPageProps) {
  return (
    <Card className="p-5">
      <h2 className="text-xl font-semibold text-stone-50">{title}</h2>
      <p className="mt-2 text-sm text-stone-400">{subtitle}</p>
    </Card>
  );
}