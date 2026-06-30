import { formatPeso } from './format';

/** Formatea montos $1234 o $1234.56 dentro del texto de una notificación. */
export function formatNotificationMessage(message) {
  if (!message) return message;
  return message.replace(/\$\s?(\d+(?:[.,]\d+)?)/g, (_, amount) => {
    const normalized = amount.replace(',', '.');
    const num = parseFloat(normalized);
    if (Number.isNaN(num)) return `$${amount}`;
    const decimals = normalized.includes('.') && !normalized.endsWith('.0') ? 2 : 0;
    return formatPeso(num, { decimals });
  });
}
