import type { Invoice, InvoicePayment } from '@/data/types';
import { api } from './client';
import { BankStatementsStatus } from './enums';
import { centsToReais, reaisToCents } from './money';
import { listTransactions } from './transactions';

type BankStatementDto = {
  id: number;
  cardId: number;
  monthReference: string;
  closingDate: string;
  dueDate: string;
  paymentDate: string | null;
  status: number;
  totalCents?: number;
  paidCents?: number;
  remainingCents?: number;
};

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function invoiceStatus(stored: Invoice['status'], closingDate: string, dueDate: string): Invoice['status'] {
  if (stored === 'paga') return 'paga';
  const today = todayIso();
  if (today > dueDate.slice(0, 10)) return 'atrasada';
  if (today > closingDate.slice(0, 10)) return 'fechada';
  return 'aberta';
}

function toInvoice(dto: BankStatementDto, fallbackTotal = 0): Invoice {
  const status = invoiceStatus(BankStatementsStatus.fromWire(dto.status), dto.closingDate, dto.dueDate);
  const total = dto.totalCents != null ? centsToReais(dto.totalCents) : fallbackTotal;
  const paid = centsToReais(dto.paidCents ?? 0);
  const remaining =
    dto.remainingCents != null ? centsToReais(dto.remainingCents) : status === 'paga' ? 0 : Math.max(0, total - paid);
  return {
    id: dto.id,
    cardId: dto.cardId,
    monthReference: dto.monthReference,
    status,
    closingDate: dto.closingDate,
    dueDate: dto.dueDate,
    paymentDate: dto.paymentDate ?? undefined,
    total,
    paid,
    remaining,
  };
}

export async function getInvoice(id: number, fallbackTotal?: number): Promise<Invoice> {
  return toInvoice(await api.get<BankStatementDto>(`/api/BankStatements/${id}`), fallbackTotal);
}

export async function listInvoicesForCard(cardId: number): Promise<Invoice[]> {
  const transactions = await listTransactions({ cardId });
  const totals = new Map<number, number>();
  for (const t of transactions) {
    if (t.invoiceId != null) totals.set(t.invoiceId, (totals.get(t.invoiceId) ?? 0) + t.amount);
  }
  const invoices = await Promise.all([...totals.keys()].map((id) => getInvoice(id, totals.get(id))));
  return invoices.sort((a, b) => (a.monthReference < b.monthReference ? 1 : -1));
}

type BankStatementPaymentDto = {
  id: number;
  bankStatementId: number;
  bankAccountId: number;
  amountCents: number;
  paymentDate: string;
  createdAt: string;
};

function toPayment(dto: BankStatementPaymentDto): InvoicePayment {
  return {
    id: dto.id,
    invoiceId: dto.bankStatementId,
    accountId: dto.bankAccountId,
    amount: centsToReais(dto.amountCents),
    paymentDate: dto.paymentDate,
  };
}

export async function payInvoice(invoiceId: number, amount: number, accountId?: number): Promise<InvoicePayment> {
  const dto = await api.post<BankStatementPaymentDto>(`/api/BankStatements/${invoiceId}/payments`, {
    bankAccountId: accountId ?? null,
    amountCents: reaisToCents(amount),
    paymentDate: todayIso(),
  });
  return toPayment(dto);
}

export async function listInvoicePayments(invoiceId: number): Promise<InvoicePayment[]> {
  const dtos = await api.get<BankStatementPaymentDto[]>(`/api/BankStatements/${invoiceId}/payments`);
  return dtos.map(toPayment);
}
