/**
 * Formato argentino: $ 1.000,50 · fechas dd/MM/yyyy
 */

/**
 * Interpreta un monto numérico o texto en formatos AR/US.
 * Evita el clásico parseFloat("19.800") === 19.8
 */
export function parseMoney(value) {
  if (value == null || value === '') return NaN;
  if (typeof value === 'number') return value;

  const raw = String(value).trim().replace(/^\$\s?/, '').replace(/\s/g, '');
  if (!raw) return NaN;

  // US miles: 19,800 o 19,800.50
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(raw)) {
    return parseFloat(raw.replace(/,/g, ''));
  }

  // AR con decimales: 19.800,50 o 19,80
  if (raw.includes(',')) {
    return parseFloat(raw.replace(/\./g, '').replace(',', '.'));
  }

  // AR solo miles: 19.800 o 1.234.567
  if (/^\d{1,3}(\.\d{3})+$/.test(raw)) {
    return parseFloat(raw.replace(/\./g, ''));
  }

  return parseFloat(raw);
}

export function formatPeso(amount, { decimals = 0 } = {}) {
  if (amount == null || amount === '') return '$0';
  const num = parseMoney(amount);
  if (Number.isNaN(num)) return '$0';
  const formatted = num.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `$${formatted}`;
}

export function formatPesoSigned(amount, type) {
  const prefix = type === 'EXPENSE' ? '- ' : type === 'INCOME' ? '+ ' : '';
  const num = parseMoney(amount);
  return `${prefix}${formatPeso(Math.abs(Number.isNaN(num) ? 0 : num))}`;
}

/** Balance con signo separado del peso: `- $600` */
export function formatPesoBalance(amount) {
  const num = parseMoney(amount);
  const safe = Number.isNaN(num) ? 0 : num;
  const sign = safe >= 0 ? '+ ' : '- ';
  return `${sign}${formatPeso(Math.abs(safe))}`;
}
