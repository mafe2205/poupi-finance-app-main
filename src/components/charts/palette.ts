export const CHART_PALETTE = [
  '#3c87f7',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#64748b',
] as const;

export const OTHERS_COLOR = '#94a3b8';

export function paletteColor(index: number) {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}
