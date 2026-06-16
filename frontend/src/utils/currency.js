/**
 * Formateo de montos en estilo argentino (miles con punto, decimales con coma).
 * Internamente trabajamos con "centavos" (solo dígitos) para evitar errores de parsing.
 */

export function sanitizeAmountDigits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

export function formatAmountFromDigits(digits) {
  if (!digits) return '';
  const cents = parseInt(digits, 10);
  if (Number.isNaN(cents)) return '';
  const value = cents / 100;
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function digitsFromNumericAmount(amount) {
  if (amount == null || amount === '') return '';
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(',', '.'));
  if (Number.isNaN(num)) return '';
  return String(Math.round(num * 100));
}

export function parseAmountDigits(digits) {
  if (!digits) return NaN;
  const cents = parseInt(digits, 10);
  if (Number.isNaN(cents)) return NaN;
  return cents / 100;
}
