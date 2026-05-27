import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { FiPlus, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Loader } from '../components/ui/Loader';
import { Modal } from '../components/ui/Modal';
import { categoryService } from '../services/categories';
import { transactionService } from '../services/transactions';
import type { Category, CategoryType, Transaction } from '../types/finance';

const initialDateTime = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
};

const typeOptions: Array<{ label: string; value: CategoryType }> = [
  { label: 'Ingresos', value: 'INCOME' },
  { label: 'Egresos', value: 'EXPENSE' },
];

export function TransactionsPage() {
  const [searchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | CategoryType>(() => {
    const requestedType = searchParams.get('type')?.toUpperCase();
    return requestedType === 'INCOME' || requestedType === 'EXPENSE' ? requestedType : 'ALL';
  });
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [savingTransaction, setSavingTransaction] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    title: '',
    description: '',
    amount: '',
    date: initialDateTime(),
    type: 'EXPENSE' as CategoryType,
    categoryId: '',
  });
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'EXPENSE' as CategoryType,
    icon: '',
    color: '#d6b14a',
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [categoriesData, transactionsData] = await Promise.all([
        categoryService.list(),
        transactionService.list(),
      ]);

      setCategories(categoriesData);
      setTransactions(transactionsData);
    } catch {
      setError('No pudimos cargar tus datos. Revisá que el backend esté corriendo y autenticado.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const visibleTransactions = useMemo(() => {
    if (filter === 'ALL') {
      return transactions;
    }

    return transactions.filter((transaction) => transaction.type === filter);
  }, [filter, transactions]);

  const totals = useMemo(() => {
    return transactions.reduce(
      (accumulator, transaction) => {
        const amount = Number(transaction.amount);
        if (transaction.type === 'INCOME') {
          accumulator.income += amount;
        } else {
          accumulator.expense += amount;
        }
        accumulator.balance = accumulator.income - accumulator.expense;
        return accumulator;
      },
      { income: 0, expense: 0, balance: 0 },
    );
  }, [transactions]);

  const filteredCategories = categories.filter((category) => category.type === transactionForm.type);

  useEffect(() => {
    if (filteredCategories.length > 0) {
      setTransactionForm((current) => ({
        ...current,
        categoryId: current.categoryId || String(filteredCategories[0].id),
      }));
    }
  }, [filteredCategories]);

  const handleCreateCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingCategory(true);
    setError(null);

    try {
      await categoryService.create({
        name: categoryForm.name,
        type: categoryForm.type,
        icon: categoryForm.icon || undefined,
        color: categoryForm.color || undefined,
      });
      setCategoryForm({ name: '', type: 'EXPENSE', icon: '', color: '#d6b14a' });
      setCategoryModalOpen(false);
      await loadData();
    } catch {
      setError('No pudimos crear la categoría.');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleCreateTransaction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingTransaction(true);
    setError(null);

    try {
      await transactionService.create({
        title: transactionForm.title,
        description: transactionForm.description || undefined,
        amount: Number(transactionForm.amount),
        date: new Date(transactionForm.date).toISOString(),
        type: transactionForm.type,
        categoryId: Number(transactionForm.categoryId),
      });

      setTransactionForm({
        title: '',
        description: '',
        amount: '',
        date: initialDateTime(),
        type: 'EXPENSE',
        categoryId: '',
      });
      setTransactionModalOpen(false);
      await loadData();
    } catch {
      setError('No pudimos guardar el movimiento. Verificá categoría y tipo.');
    } finally {
      setSavingTransaction(false);
    }
  };

  const handleDelete = async (transactionId: number) => {
    setUpdating(true);
    setError(null);

    try {
      await transactionService.remove(transactionId);
      await loadData();
    } catch {
      setError('No pudimos eliminar el movimiento.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-5 pb-6">
      <Card className="p-5">
        <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Movimientos</p>
        <h2 className="mt-2 text-3xl font-semibold text-stone-50">Ingresos y egresos</h2>
        <p className="mt-2 text-sm text-stone-400">Acá podés probar la conexión real con backend: categorías, altas, bajas y listado.</p>
      </Card>

      <section className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Ingresos</p>
          <p className="mt-2 text-xl font-semibold text-emerald-400">$ {totals.income.toLocaleString('es-AR')}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Egresos</p>
          <p className="mt-2 text-xl font-semibold text-rose-400">$ {totals.expense.toLocaleString('es-AR')}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Balance</p>
          <p className="mt-2 text-xl font-semibold text-gold-500">$ {totals.balance.toLocaleString('es-AR')}</p>
        </Card>
      </section>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
            {(['ALL', 'INCOME', 'EXPENSE'] as const).map((value) => (
              <button
                key={value}
                type="button"
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${filter === value ? 'bg-gold-500 text-navy-950' : 'text-stone-300 hover:bg-white/8'}`}
                onClick={() => setFilter(value)}
              >
                {value === 'ALL' ? 'Todos' : value === 'INCOME' ? 'Ingresos' : 'Egresos'}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void loadData()} disabled={loading || updating}>
              <FiRefreshCw className="mr-2" /> Refrescar
            </Button>
            <Button variant="secondary" onClick={() => setCategoryModalOpen(true)}>
              <FiPlus className="mr-2" /> Categoría
            </Button>
            <Button onClick={() => setTransactionModalOpen(true)}>
              <FiPlus className="mr-2" /> Movimiento
            </Button>
          </div>
        </div>

        {error ? <p className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p> : null}

        {loading ? (
          <div className="py-10">
            <Loader />
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {visibleTransactions.length > 0 ? (
              visibleTransactions.map((transaction) => (
                <article key={transaction.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="font-medium text-stone-100">{transaction.title}</p>
                    <p className="text-sm text-stone-400">{transaction.categoryName} · {new Date(transaction.date).toLocaleString('es-AR')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`text-sm font-semibold ${transaction.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {transaction.type === 'INCOME' ? '+' : '-'}$ {Number(transaction.amount).toLocaleString('es-AR')}
                    </p>
                    <button
                      type="button"
                      className="grid h-9 w-9 place-items-center rounded-xl bg-white/6 text-stone-300 transition hover:bg-rose-500/15 hover:text-rose-300"
                      onClick={() => void handleDelete(transaction.id)}
                      aria-label={`Eliminar ${transaction.title}`}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-stone-400">
                No hay movimientos para este filtro.
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-stone-50">Categorías</h3>
            <p className="text-sm text-stone-400">Necesarias para crear movimientos</p>
          </div>
          <span className="text-sm text-stone-400">{categories.length} activas</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.length > 0 ? categories.map((category) => (
            <span key={category.id} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-stone-200">
              {category.name} · {category.type === 'INCOME' ? 'Ingreso' : 'Egreso'}
            </span>
          )) : (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
              No tenés categorías todavía. Creá una antes de registrar movimientos.
            </div>
          )}
        </div>
      </Card>

      <Modal open={categoryModalOpen} title="Nueva categoría" onClose={() => setCategoryModalOpen(false)}>
        <form className="space-y-4" onSubmit={handleCreateCategory}>
          <Input label="Nombre" value={categoryForm.name} onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} placeholder="Alimentación" />
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-stone-400">Tipo</span>
            <select
              className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-stone-100 outline-none"
              value={categoryForm.type}
              onChange={(event) => setCategoryForm((current) => ({ ...current, type: event.target.value as CategoryType }))}
            >
              {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <Input label="Icono" value={categoryForm.icon} onChange={(event) => setCategoryForm((current) => ({ ...current, icon: event.target.value }))} placeholder="fi-..." helperText="Opcional, se usa como referencia interna." />
          <Input label="Color" value={categoryForm.color} onChange={(event) => setCategoryForm((current) => ({ ...current, color: event.target.value }))} placeholder="#d6b14a" />
          <Button fullWidth type="submit" disabled={savingCategory}>{savingCategory ? 'Guardando...' : 'Crear categoría'}</Button>
        </form>
      </Modal>

      <Modal open={transactionModalOpen} title="Nuevo movimiento" onClose={() => setTransactionModalOpen(false)}>
        <form className="space-y-4" onSubmit={handleCreateTransaction}>
          <Input label="Título" value={transactionForm.title} onChange={(event) => setTransactionForm((current) => ({ ...current, title: event.target.value }))} placeholder="Sueldo, supermercado, alquiler..." />
          <Input label="Descripción" value={transactionForm.description} onChange={(event) => setTransactionForm((current) => ({ ...current, description: event.target.value }))} placeholder="Opcional" />
          <Input label="Monto" type="number" min="0" step="0.01" value={transactionForm.amount} onChange={(event) => setTransactionForm((current) => ({ ...current, amount: event.target.value }))} placeholder="15000" />
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-stone-400">Tipo</span>
            <select
              className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-stone-100 outline-none"
              value={transactionForm.type}
              onChange={(event) => setTransactionForm((current) => ({ ...current, type: event.target.value as CategoryType, categoryId: '' }))}
            >
              {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <Input label="Fecha y hora" type="datetime-local" value={transactionForm.date} onChange={(event) => setTransactionForm((current) => ({ ...current, date: event.target.value }))} />
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-stone-400">Categoría</span>
            <select
              className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-stone-100 outline-none"
              value={transactionForm.categoryId}
              onChange={(event) => setTransactionForm((current) => ({ ...current, categoryId: event.target.value }))}
            >
              <option value="">Seleccionar</option>
              {filteredCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <Button fullWidth type="submit" disabled={savingTransaction}>{savingTransaction ? 'Guardando...' : 'Guardar movimiento'}</Button>
        </form>
      </Modal>
    </div>
  );
}