import type { ReportSummaryDto } from './reports';

/**
 * Mock of GET /api/Reports/summary, used while the route doesn't exist (USE_MOCK_REPORTS).
 * Each scenario exercises a set of states of the Relatórios screen:
 * - normal: healthy finances, positive result, nothing over budget.
 * - alertas: spending above income, categories over the limit, overdue invoice, card near the
 *   limit, falling net worth, an inactive category with movement.
 * - vazio: a period with no transactions at all.
 * - erro: the request fails (handled in getFinancialReport).
 */
export type MockScenario = 'normal' | 'alertas' | 'vazio' | 'erro';

// Wire enum values (see src/api/enums.ts).
const ENTRADA = 0;
const SAIDA = 1;
const PM = { credito: 0, debito: 1, dinheiro: 2, pix: 3, boleto: 4 };
const STATUS = { aberta: 0, fechada: 1, paga: 2, atrasada: 3 };

// Deterministic pseudo-random, so the same period always shows the same numbers.
function seeded(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function monthsBetween(start: Date, end: Date) {
  const list: Date[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    list.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return list;
}

function iso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const EXPENSE_CATEGORIES = [
  { categoryId: 11, name: 'Mercado', weight: 0.26, limit: 120000 },
  { categoryId: 12, name: 'Moradia', weight: 0.3, limit: 180000 },
  { categoryId: 13, name: 'Transporte', weight: 0.11, limit: 50000 },
  { categoryId: 14, name: 'Restaurantes', weight: 0.12, limit: 45000 },
  { categoryId: 15, name: 'Lazer', weight: 0.08, limit: null },
  { categoryId: 16, name: 'Saúde', weight: 0.07, limit: 40000 },
  { categoryId: 17, name: 'Assinaturas', weight: 0.04, limit: 15000 },
  { categoryId: 18, name: 'Educação', weight: 0.02, limit: null },
];

const INCOME_CATEGORIES = [
  { categoryId: 21, name: 'Salário', weight: 0.85 },
  { categoryId: 22, name: 'Freelas', weight: 0.12 },
  { categoryId: 23, name: 'Rendimentos', weight: 0.03 },
];

export function buildMockReportDto(startDate: string, endDate: string, scenario: MockScenario): ReportSummaryDto {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const months = monthsBetween(start, end);
  const random = seeded(start.getFullYear() * 100 + start.getMonth() + months.length * 7);
  const alert = scenario === 'alertas';
  const empty = scenario === 'vazio';

  // Income ~R$ 6.800/mês; expense ~78% of it (normal) or ~112% (alertas).
  const monthly = months.map((m, index) => {
    if (empty) return { month: iso(m).slice(0, 7), incomeCents: 0, expenseCents: 0 };
    const isCurrent = index === months.length - 1;
    // Current month is partial: scale by how far into the month today is.
    const progress = isCurrent ? end.getDate() / new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate() : 1;
    const income = Math.round((640000 + random() * 80000) * (isCurrent ? Math.min(1, progress + 0.4) : 1));
    const ratio = alert ? 1.05 + random() * 0.15 : 0.7 + random() * 0.15;
    const expense = Math.round(income * ratio * (isCurrent ? progress : 1));
    return { month: iso(m).slice(0, 7), incomeCents: income, expenseCents: expense };
  });

  const incomeCents = monthly.reduce((s, m) => s + m.incomeCents, 0);
  const expenseCents = monthly.reduce((s, m) => s + m.expenseCents, 0);

  const daily: ReportSummaryDto['daily'] = [];
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  if (days <= 62 && !empty) {
    for (let i = 0; i < days; i++) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const dayOfMonth = date.getDate();
      // Rent and salary land early in the month; the rest is spread with noise.
      const base = expenseCents / days;
      const spike = dayOfMonth === 5 ? expenseCents * 0.22 : 0;
      daily.push({
        date: iso(date),
        incomeCents: dayOfMonth === 5 ? Math.round(incomeCents * 0.85) : dayOfMonth === 20 ? Math.round(incomeCents * 0.15) : 0,
        expenseCents: Math.max(0, Math.round(base * (0.4 + random() * 0.9) + spike - expenseCents * 0.22 / days)),
      });
    }
  }

  const categories: ReportSummaryDto['categories'] = empty
    ? []
    : [
        ...EXPENSE_CATEGORIES.map((c, i) => {
          // In "alertas", Mercado and Restaurantes go over their monthly limit.
          const boost = alert && (c.categoryId === 11 || c.categoryId === 14) ? 1.6 : 1;
          return {
            categoryId: c.categoryId,
            name: c.name,
            type: SAIDA,
            totalCents: Math.round(expenseCents * c.weight * boost * (0.9 + random() * 0.2)),
            limitValueCents: c.limit,
            transactionCount: Math.max(1, Math.round((8 - i) * months.length * (0.8 + random()))),
            active: true,
          };
        }),
        ...(alert
          ? [
              {
                categoryId: 19,
                name: 'Academia',
                type: SAIDA,
                totalCents: 12900 * months.length,
                limitValueCents: null,
                transactionCount: months.length,
                active: false,
              },
            ]
          : []),
        ...INCOME_CATEGORIES.map((c) => ({
          categoryId: c.categoryId,
          name: c.name,
          type: ENTRADA,
          totalCents: Math.round(incomeCents * c.weight),
          limitValueCents: null,
          transactionCount: months.length * (c.categoryId === 21 ? 1 : 2),
          active: true,
        })),
      ];

  const paymentMethods: ReportSummaryDto['paymentMethods'] = empty
    ? []
    : [
        { paymentMethod: PM.credito, totalCents: Math.round(expenseCents * 0.42), transactionCount: 34 * months.length },
        { paymentMethod: PM.pix, totalCents: Math.round(expenseCents * 0.27), transactionCount: 18 * months.length },
        { paymentMethod: PM.boleto, totalCents: Math.round(expenseCents * 0.18), transactionCount: 3 * months.length },
        { paymentMethod: PM.debito, totalCents: Math.round(expenseCents * 0.09), transactionCount: 9 * months.length },
        { paymentMethod: PM.dinheiro, totalCents: Math.round(expenseCents * 0.04), transactionCount: 5 * months.length },
      ];

  // Net worth: starts around R$ 18k and follows each month's result.
  let balance = alert ? 900000 : 1800000;
  const balanceHistory = months.map((m, index) => {
    balance += monthly[index].incomeCents - monthly[index].expenseCents;
    const isCurrent = index === months.length - 1;
    const date = isCurrent ? end : new Date(m.getFullYear(), m.getMonth() + 1, 0);
    return { date: iso(date), balanceCents: balance };
  });

  const cards: ReportSummaryDto['cards'] = [
    { cardId: 31, name: 'Nubank', type: 0, limitValueCents: 500000, usedCents: empty ? 0 : alert ? 468000 : 182000 },
    { cardId: 32, name: 'Inter', type: 0, limitValueCents: 300000, usedCents: empty ? 0 : alert ? 241000 : 64000 },
    { cardId: 33, name: 'Débito Itaú', type: 1, limitValueCents: 0, usedCents: 0 },
  ];

  const invoices: ReportSummaryDto['invoices'] = empty
    ? []
    : [
        { status: STATUS.paga, count: Math.max(1, months.length * 2 - 2), totalCents: Math.round(expenseCents * 0.35) },
        { status: STATUS.aberta, count: 2, totalCents: alert ? 412000 : 156000 },
        ...(months.length > 1 ? [{ status: STATUS.fechada, count: 1, totalCents: alert ? 297000 : 90000 }] : []),
        ...(alert ? [{ status: STATUS.atrasada, count: 1, totalCents: 128900 }] : []),
      ];

  const topExpenses: ReportSummaryDto['topExpenses'] = empty
    ? []
    : [
        { description: 'Aluguel', categoryId: 12, categoryName: 'Moradia', value: 165000 },
        { description: alert ? 'Notebook parcelado' : 'Supermercado Extra', categoryId: alert ? 18 : 11, categoryName: alert ? 'Educação' : 'Mercado', value: alert ? 98000 : 61230 },
        { description: 'Plano de saúde', categoryId: 16, categoryName: 'Saúde', value: 38900 },
        { description: 'Restaurante Fogo de Chão', categoryId: 14, categoryName: 'Restaurantes', value: alert ? 42700 : 21800 },
        { description: 'Posto Shell', categoryId: 13, categoryName: 'Transporte', value: 25000 },
      ].map((t, i) => ({
        transactionId: 900 + i,
        description: t.description,
        categoryId: t.categoryId,
        categoryName: t.categoryName,
        paymentValueCents: t.value,
        transactionDate: iso(new Date(end.getFullYear(), end.getMonth(), Math.max(1, end.getDate() - i * 3))),
      }));

  const previousFactor = alert ? 0.88 : 1.06;
  return {
    startDate,
    endDate,
    totals: {
      incomeCents,
      expenseCents,
      previousIncomeCents: empty ? 0 : Math.round(incomeCents * (alert ? 1.08 : 0.97)),
      previousExpenseCents: empty ? 0 : Math.round(expenseCents * previousFactor),
      transactionCount: empty ? 0 : categories.reduce((s, c) => s + c.transactionCount, 0),
    },
    monthly,
    daily,
    categories,
    paymentMethods,
    balanceHistory: empty ? balanceHistory.map((b) => ({ ...b, balanceCents: 1800000 })) : balanceHistory,
    cards,
    invoices,
    topExpenses,
  };
}
