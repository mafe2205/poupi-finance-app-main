const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const oneDecimal = (n: number) => n.toFixed(1).replace('.', ',').replace(',0', '');
  if (abs >= 1_000_000) return `${sign}R$ ${oneDecimal(abs / 1_000_000)} mi`;
  if (abs >= 1_000) return `${sign}R$ ${oneDecimal(abs / 1_000)} mil`;
  return `${sign}R$ ${Math.round(abs)}`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function toCurrencyInput(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseCurrencyInput(value: string): number {
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
