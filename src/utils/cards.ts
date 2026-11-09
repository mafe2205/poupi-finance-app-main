import type { Card, PaymentMethod } from '@/data/types';

export function cardKindLabel(kind: Card['kind']): string {
  return kind === 'credito' ? 'Crédito e débito' : 'Débito';
}

export function cardAccepts(card: Card, paymentMethod: PaymentMethod): boolean {
  if (paymentMethod === 'cartao_credito') return card.kind === 'credito';
  if (paymentMethod === 'cartao_debito') return true;
  return false;
}
