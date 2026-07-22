/**
 * Utilidades de fecha/hora para el cliente.
 * Visualización: DD/MM/AAAA HH:mm (Argentina)
 * Backend: ISO 8601 compatible con LocalDateTime de Java
 */

const pad = (value) => String(value).padStart(2, '0');

export const captureDeviceDateTime = () => new Date();

export const formatArgentineDate = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export const toIsoLocalDateTime = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const toDatetimeLocalValue = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Más reciente primero: fecha DESC, y a igual fecha el último cargado (id mayor). */
export const sortTransactionsByDateDesc = (list = []) =>
  [...list].sort((a, b) => {
    const aTime = new Date(a?.date).getTime() || 0;
    const bTime = new Date(b?.date).getTime() || 0;
    if (bTime !== aTime) return bTime - aTime;
    return (Number(b?.id) || 0) - (Number(a?.id) || 0);
  });
