/** Paletas inspiradas en gráficos 3D isométricos (referencia TFI). */

export const PIE_3D_PALETTE = [
  '#E91E8C',
  '#00BCD4',
  '#3F51B5',
  '#7B1FA2',
  '#FF9800',
  '#4CAF50',
];

export const BAR_3D_PALETTE = [
  '#94A3B8',
  '#14B8A6',
  '#3B82F6',
  '#EC4899',
  '#F59E0B',
];

export function pickChartColor(index, palette, customColor) {
  return customColor || palette[index % palette.length];
}

export function darkenHexColor(hex, factor = 0.62) {
  if (!hex || !hex.startsWith('#')) return hex;
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return hex;
  const num = parseInt(raw, 16);
  const r = Math.round(((num >> 16) & 0xff) * factor);
  const g = Math.round(((num >> 8) & 0xff) * factor);
  const b = Math.round((num & 0xff) * factor);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
