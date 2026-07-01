const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

const MONTH_NAMES_LONG = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const formatMonthLabel = (month, year) =>
  `${MONTH_NAMES[month - 1]} ${year}`;

export const formatMonthLabelLong = (month, year) =>
  `${MONTH_NAMES_LONG[month - 1]} ${year}`;

export const buildMonthRange = (startMonth, startYear, endMonth, endYear, maxMonths = 24) => {
  const startKey = startYear * 12 + (startMonth - 1);
  const endKey = endYear * 12 + (endMonth - 1);

  if (startKey > endKey) {
    return [];
  }

  const months = [];
  let month = startMonth;
  let year = startYear;

  while (year * 12 + (month - 1) <= endKey && months.length < maxMonths) {
    months.push({ month, year, label: formatMonthLabel(month, year) });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return months;
};

export const aggregateExpensesByMonth = (monthlyData) =>
  monthlyData.map(({ month, year, label, transactions }) => ({
    month,
    year,
    label,
    total: transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
  }));

export const aggregateExpensesByCategory = (transactions, categories = []) => {
  const colorByCategory = Object.fromEntries(
    categories.map((category) => [category.name, category.color || null]),
  );

  const palette = [
    '#D9B44A', '#38BDF8', '#34D399', '#F87171', '#A78BFA',
    '#FB923C', '#F472B6', '#2DD4BF', '#818CF8', '#FACC15',
  ];

  const totals = transactions.reduce((acc, tx) => {
    const name = tx.categoryName || 'Sin categoría';
    acc[name] = (acc[name] || 0) + Number(tx.amount || 0);
    return acc;
  }, {});

  return Object.entries(totals)
    .map(([name, value], index) => ({
      name,
      value,
      color: colorByCategory[name] || palette[index % palette.length],
    }))
    .sort((a, b) => b.value - a.value);
};
