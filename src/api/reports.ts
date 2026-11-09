import type { EntryKind, PaymentMethod } from '@/data/types';
import { api } from './client';
import type { BankStatementsStatusValue } from './enums';
import { BankStatementsStatus, CardsType, CategoriesType, PaymentMethod as PaymentMethodEnum } from './enums';
import { centsToReais } from './money';
import { buildMockReportDto, type MockScenario } from './reports-mock';

export const USE_MOCK_REPORTS = true;

export type ReportSummaryDto = {
  startDate: string;
  endDate: string;
  totals: {
    incomeCents: number;
    expenseCents: number;
    previousIncomeCents: number;
    previousExpenseCents: number;
    transactionCount: number;
  };
  monthly: { month: string; incomeCents: number; expenseCents: number }[];
  daily: { date: string; incomeCents: number; expenseCents: number }[];
  categories: {
    categoryId: number;
    name: string;
    type: number;
    totalCents: number;
    limitValueCents: number | null;
    transactionCount: number;
    active: boolean;
  }[];
  paymentMethods: { paymentMethod: number; totalCents: number; transactionCount: number }[];
  balanceHistory: { date: string; balanceCents: number }[];
  cards: { cardId: number; name: string; type: number; limitValueCents: number; usedCents: number }[];
  invoices: { status: number; count: number; totalCents: number }[];
  topExpenses: {
    transactionId: number;
    description: string;
    categoryId: number;
    categoryName: string;
    paymentValueCents: number;
    transactionDate: string;
  }[];
};

// ---------------------------------------------------------------------------------------------
// App format
// ---------------------------------------------------------------------------------------------

export type ReportPeriod = 'mes' | '3m' | '6m' | '12m';

export type CategoryTotal = {
  categoryId: number;
  name: string;
  kind: EntryKind;
  total: number;
  limit?: number;
  count: number;
  active: boolean;
};

export type FinancialReport = {
  period: ReportPeriod;
  startDate: string;
  endDate: string;
  months: number;
  totals: {
    income: number;
    expense: number;
    result: number;
    previousIncome: number;
    previousExpense: number;
    transactionCount: number;
  };
  monthly: { month: string; income: number; expense: number }[];
  daily: { date: string; income: number; expense: number }[];
  expenseCategories: CategoryTotal[];
  incomeCategories: CategoryTotal[];
  paymentMethods: { method: PaymentMethod; total: number; count: number }[];
  balanceHistory: { date: string; balance: number }[];
  cards: { cardId: number; name: string; kind: 'credito' | 'debito'; limit: number; used: number }[];
  invoices: { status: BankStatementsStatusValue; count: number; total: number }[];
  topExpenses: {
    transactionId: number;
    description: string;
    categoryName: string;
    amount: number;
    date: string;
  }[];
};

function isoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function periodRange(period: ReportPeriod, today = new Date()) {
  const monthsBack = { mes: 0, '3m': 2, '6m': 5, '12m': 11 }[period];
  const start = new Date(today.getFullYear(), today.getMonth() - monthsBack, 1);
  return { startDate: isoDate(start), endDate: isoDate(today), months: monthsBack + 1 };
}

function toReport(dto: ReportSummaryDto, period: ReportPeriod, months: number): FinancialReport {
  const categories = dto.categories.map<CategoryTotal>((c) => ({
    categoryId: c.categoryId,
    name: c.name,
    kind: CategoriesType.fromWire(c.type),
    total: centsToReais(c.totalCents),
    limit: c.limitValueCents ? centsToReais(c.limitValueCents) : undefined,
    count: c.transactionCount,
    active: c.active,
  }));
  const byTotal = (a: CategoryTotal, b: CategoryTotal) => b.total - a.total;
  const income = centsToReais(dto.totals.incomeCents);
  const expense = centsToReais(dto.totals.expenseCents);

  return {
    period,
    startDate: dto.startDate,
    endDate: dto.endDate,
    months,
    totals: {
      income,
      expense,
      result: income - expense,
      previousIncome: centsToReais(dto.totals.previousIncomeCents),
      previousExpense: centsToReais(dto.totals.previousExpenseCents),
      transactionCount: dto.totals.transactionCount,
    },
    monthly: dto.monthly.map((m) => ({
      month: m.month,
      income: centsToReais(m.incomeCents),
      expense: centsToReais(m.expenseCents),
    })),
    daily: dto.daily.map((d) => ({
      date: d.date,
      income: centsToReais(d.incomeCents),
      expense: centsToReais(d.expenseCents),
    })),
    expenseCategories: categories.filter((c) => c.kind === 'expense').sort(byTotal),
    incomeCategories: categories.filter((c) => c.kind === 'income').sort(byTotal),
    paymentMethods: dto.paymentMethods
      .map((p) => ({
        method: PaymentMethodEnum.fromWire(p.paymentMethod),
        total: centsToReais(p.totalCents),
        count: p.transactionCount,
      }))
      .sort((a, b) => b.total - a.total),
    balanceHistory: dto.balanceHistory.map((b) => ({ date: b.date, balance: centsToReais(b.balanceCents) })),
    cards: dto.cards.map((c) => ({
      cardId: c.cardId,
      name: c.name,
      kind: CardsType.fromWire(c.type),
      limit: centsToReais(c.limitValueCents),
      used: centsToReais(c.usedCents),
    })),
    invoices: dto.invoices.map((i) => ({
      status: BankStatementsStatus.fromWire(i.status),
      count: i.count,
      total: centsToReais(i.totalCents),
    })),
    topExpenses: dto.topExpenses.map((t) => ({
      transactionId: t.transactionId,
      description: t.description,
      categoryName: t.categoryName,
      amount: centsToReais(t.paymentValueCents),
      date: t.transactionDate,
    })),
  };
}

export async function getFinancialReport(
  period: ReportPeriod,
  mockScenario: MockScenario = 'normal'
): Promise<FinancialReport> {
  const { startDate, endDate, months } = periodRange(period);

  if (USE_MOCK_REPORTS) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (mockScenario === 'erro') throw new Error('Falha simulada ao carregar o relatório.');
    return toReport(buildMockReportDto(startDate, endDate, mockScenario), period, months);
  }

  const dto = await api.get<ReportSummaryDto>(
    `/api/Reports/summary?startDate=${startDate}&endDate=${endDate}`
  );
  return toReport(dto, period, months);
}

export type { MockScenario };
