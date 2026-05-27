import { FiArrowDownLeft, FiArrowUpRight } from 'react-icons/fi';

export type TransactionItemData = {
  id: number;
  title: string;
  category: string;
  date: string;
  amount: string;
  type: 'INCOME' | 'EXPENSE';
};

type TransactionItemProps = {
  transaction: TransactionItemData;
  onDelete?: () => void;
};

export function TransactionItem({ transaction, onDelete }: TransactionItemProps) {
  const isIncome = transaction.type === 'INCOME';

  return (
    <article className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className={`grid h-11 w-11 place-items-center rounded-2xl ${isIncome ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'}`}>
          {isIncome ? <FiArrowDownLeft /> : <FiArrowUpRight />}
        </div>
        <div>
          <h4 className="font-medium text-stone-100">{transaction.title}</h4>
          <p className="text-sm text-stone-400">{transaction.category} · {transaction.date}</p>
        </div>
      </div>
      <p className={`text-sm font-semibold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>{transaction.amount}</p>
      {onDelete ? (
        <button type="button" className="ml-3 grid h-9 w-9 place-items-center rounded-xl bg-white/6 text-stone-300 transition hover:bg-rose-500/15 hover:text-rose-300" onClick={onDelete} aria-label={`Eliminar ${transaction.title}`}>
          <FiArrowUpRight className="rotate-45" />
        </button>
      ) : null}
    </article>
  );
}