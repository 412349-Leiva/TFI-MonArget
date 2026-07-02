/** Paletas inspiradas en gráficos 3D glossy (referencia TFI). */

export const PIE_3D_PALETTE = [
  '#22C55E',
  '#3B82F6',
  '#A855F7',
  '#EF4444',
  '#F97316',
  '#EAB308',
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
