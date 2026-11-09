import type { Invoice } from '@/data/types';
import { formatCurrency } from '@/utils/money';

export function invoiceAmountLabel(invoice: Invoice): string {
  if (invoice.status !== 'paga' && invoice.paid > 0) {
    return `${formatCurrency(invoice.total)} · falta ${formatCurrency(invoice.remaining)}`;
  }
  return formatCurrency(invoice.total);
}
