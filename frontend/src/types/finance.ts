export type CategoryType = 'INCOME' | 'EXPENSE';

export type Category = {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  type: CategoryType;
};

export type Transaction = {
  id: number;
  title: string;
  description?: string | null;
  amount: string;
  date: string;
  type: CategoryType;
  categoryId: number;
  categoryName: string;
};