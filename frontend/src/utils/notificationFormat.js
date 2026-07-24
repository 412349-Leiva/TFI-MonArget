import { formatPeso, parseMoney } from './format';

/**
 * Formatea montos $… dentro del texto de una notificación al estilo de la app.
 * El backend puede mandar $19800, $19.800, $19.800,50 o (por locale) $19,800.
 */
export function formatNotificationMessage(message) {
  if (!message) return message;
  return message.replace(
    /\$\s?(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?)/g,
    (_, amount) => {
      const num = parseMoney(amount);
      if (Number.isNaN(num)) return `$${amount}`;

      const hasDecimals =
        /,\d{1,2}$/.test(amount)
        || /^\d+\.\d{1,2}$/.test(amount)
        || /^\d{1,3}(\.\d{3})+,\d+$/.test(amount)
        || /^\d{1,3}(,\d{3})+\.\d+$/.test(amount);

      // Miles sin decimales: 19.800 / 19,800 → enteros
      const onlyThousands =
        /^\d{1,3}(\.\d{3})+$/.test(amount)
        || /^\d{1,3}(,\d{3})+$/.test(amount);

      return formatPeso(num, { decimals: hasDecimals && !onlyThousands ? 2 : 0 });
    },
  );
}
