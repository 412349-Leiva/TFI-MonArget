/**
 * Formato argentino: $ 1.000,50 · fechas dd/MM/yyyy
 */

export function formatPeso(amount, { decimals = 0 } = {}) {
  if (amount == null || amount === '') return '$0';
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(',', '.'));
  if (Number.isNaN(num)) return '$0';
  const formatted = num.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `$${formatted}`;
}

export function formatPesoSigned(amount, type) {
  const prefix = type === 'EXPENSE' ? '- ' : type === 'INCOME' ? '+ ' : '';
  return `${prefix}${formatPeso(Math.abs(Number(amount) || 0))}`;
}

/** Balance con signo separado del peso: `- $600` */
export function formatPesoBalance(amount) {
  const num = Number(amount) || 0;
  const sign = num >= 0 ? '+ ' : '- ';
  return `${sign}${formatPeso(Math.abs(num))}`;
}
