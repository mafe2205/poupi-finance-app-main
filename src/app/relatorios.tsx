import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import {
  getFinancialReport,
  USE_MOCK_REPORTS,
  type CategoryTotal,
  type FinancialReport,
  type MockScenario,
  type ReportPeriod,
} from "@/api/reports";
import { BarChart } from "@/components/charts/bar-chart";
import { ChartLegend } from "@/components/charts/chart-legend";
import { DonutChart } from "@/components/charts/donut-chart";
import { LineChart } from "@/components/charts/line-chart";
import { OTHERS_COLOR, paletteColor } from "@/components/charts/palette";
import { ThemedText } from "@/components/themed-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ListRow } from "@/components/ui/list-row";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Screen } from "@/components/ui/screen";
import { Surface } from "@/components/ui/surface";
import { Spacing, type ThemeColor } from "@/constants/theme";
import { useFinance } from "@/context/finance-context";
import type { Account, Goal, PaymentMethod } from "@/data/types";
import { useTheme } from "@/hooks/use-theme";
import { formatDate, formatShortMonth } from "@/utils/date";
import {
  formatCompactCurrency,
  formatCurrency,
  formatPercent,
} from "@/utils/money";

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: "mes", label: "Este mês" },
  { value: "3m", label: "3 meses" },
  { value: "6m", label: "6 meses" },
  { value: "12m", label: "12 meses" },
];

const MOCK_SCENARIOS: { value: MockScenario; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "alertas", label: "Com alertas" },
  { value: "vazio", label: "Sem dados" },
  { value: "erro", label: "Erro" },
];

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  dinheiro: "Dinheiro",
  pix: "Pix",
  boleto: "Boleto",
};

const INVOICE_LABEL = {
  aberta: "Abertas",
  fechada: "Fechadas",
  paga: "Pagas",
  atrasada: "Atrasadas",
} as const;
const INVOICE_TONE = {
  aberta: "primary",
  fechada: "warning",
  paga: "success",
  atrasada: "danger",
} as const;

const CARD_NEAR_LIMIT = 0.8;
const BUDGET_WARNING = 0.8;
const EXPENSE_GROWTH_ALERT = 0.2;
const DONUT_SLICES = 6;

type Alert = { key: string; tone: "danger" | "warning"; text: string };

export default function RelatoriosScreen() {
  const { accounts, goals } = useFinance();
  const theme = useTheme();
  const [period, setPeriod] = useState<ReportPeriod>("mes");
  const [scenario, setScenario] = useState<MockScenario>("normal");
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getFinancialReport(period, scenario)
      .then((result) => {
        if (cancelled) return;
        setReport(result);
        setError("");
      })
      .catch((err) => {
        if (cancelled) return;
        setReport(null);
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar o relatório.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period, scenario, reloadKey]);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  function changePeriod(next: ReportPeriod) {
    if (next === period) return;
    setLoading(true);
    setPeriod(next);
  }

  function changeScenario(next: MockScenario) {
    if (next === scenario) return;
    setLoading(true);
    setScenario(next);
  }

  const alerts = useMemo(
    () => (report ? buildAlerts(report, accounts, goals) : []),
    [report, accounts, goals],
  );
  const isEmpty = !!report && report.totals.transactionCount === 0;

  return (
    <Screen>

      <ChipRow options={PERIODS} value={period} onChange={changePeriod} />

      {USE_MOCK_REPORTS && (
        <Surface>
          <ThemedText type="small" themeColor="textSecondary">
            Dados de demonstração: a rota de relatórios ainda não existe na API.
            Escolha um cenário para conferir os estados da tela. Contas e metas
            são os seus dados reais.
          </ThemedText>
          <ChipRow
            options={MOCK_SCENARIOS}
            value={scenario}
            onChange={changeScenario}
            small
          />
        </Surface>
      )}

      {loading && (
        <View style={styles.state}>
          <ActivityIndicator size="large" />
          <ThemedText themeColor="textSecondary">
            Montando o relatório…
          </ThemedText>
        </View>
      )}

      {!loading && error && (
        <Surface style={styles.stateBox}>
          <IconSymbol
            ios="exclamationmark.triangle"
            android="error"
            size={28}
            color={theme.danger}
          />
          <ThemedText type="smallBold">
            Não foi possível carregar o relatório
          </ThemedText>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.center}
          >
            {error}
          </ThemedText>
          <Button
            label="Tentar novamente"
            variant="secondary"
            onPress={reload}
          />
        </Surface>
      )}

      {!loading && report && (
        <>
          <AlertsSection alerts={alerts} />
          <SummarySection report={report} />
          <AccountsSection accounts={accounts} />

          {isEmpty ? (
            <Surface style={styles.stateBox}>
              <IconSymbol
                ios="chart.bar"
                android="bar_chart"
                size={28}
                color={theme.textSecondary}
              />
              <ThemedText type="smallBold">
                Nenhuma transação neste período
              </ThemedText>
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.center}
              >
                Lance entradas e saídas para ver os gráficos de evolução,
                categorias e formas de pagamento.
              </ThemedText>
              <Button
                label="Nova transação"
                variant="secondary"
                onPress={() => router.push("/transacao/novo")}
              />
            </Surface>
          ) : (
            <>
              {report.period === "mes" ? (
                <MonthPaceSection report={report} />
              ) : (
                <MonthlySection report={report} />
              )}
              <CategoriesSection report={report} />
              <BudgetSection report={report} />
              <TopExpensesSection report={report} />
            </>
          )}

          <NetWorthSection report={report} />
          <CardsSection report={report} />
          <GoalsSection goals={goals} />
          {!isEmpty && <PaymentMethodsSection report={report} />}
        </>
      )}
    </Screen>
  );
}

// -------------------------------------------------------------------------------------------
// Alerts
// -------------------------------------------------------------------------------------------

function monthlyAverage(category: CategoryTotal, months: number) {
  return category.total / Math.max(1, months);
}

function buildAlerts(
  report: FinancialReport,
  accounts: Account[],
  goals: Goal[],
): Alert[] {
  const list: Alert[] = [];
  const { totals } = report;

  if (totals.result < 0) {
    list.push({
      key: "result",
      tone: "danger",
      text: `Você gastou ${formatCurrency(-totals.result)} a mais do que recebeu no período.`,
    });
  }

  if (totals.previousExpense > 0) {
    const growth = totals.expense / totals.previousExpense - 1;
    if (growth >= EXPENSE_GROWTH_ALERT) {
      list.push({
        key: "growth",
        tone: "warning",
        text: `Os gastos subiram ${formatPercent(growth)} em relação ao período anterior.`,
      });
    }
  }

  for (const category of report.expenseCategories) {
    if (!category.limit) continue;
    const average = monthlyAverage(category, report.months);
    if (average > category.limit) {
      list.push({
        key: `budget-${category.categoryId}`,
        tone: "danger",
        text: `${category.name} passou do limite: ${formatCurrency(average)} por mês, de ${formatCurrency(category.limit)}.`,
      });
    }
  }

  const overdue = report.invoices.find((i) => i.status === "atrasada");
  if (overdue && overdue.count > 0) {
    list.push({
      key: "overdue",
      tone: "danger",
      text: `${overdue.count} fatura${overdue.count > 1 ? "s" : ""} atrasada${overdue.count > 1 ? "s" : ""}, somando ${formatCurrency(overdue.total)}.`,
    });
  }

  for (const card of report.cards) {
    if (card.kind !== "credito" || card.limit <= 0) continue;
    const usage = card.used / card.limit;
    if (usage >= CARD_NEAR_LIMIT) {
      list.push({
        key: `card-${card.cardId}`,
        tone: usage >= 1 ? "danger" : "warning",
        text: `O cartão ${card.name} está com ${formatPercent(usage)} do limite usado.`,
      });
    }
  }

  for (const account of accounts) {
    if (account.balance < 0) {
      list.push({
        key: `account-${account.id}`,
        tone: "danger",
        text: `A conta ${account.bank} está com saldo negativo (${formatCurrency(account.balance)}).`,
      });
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  for (const goal of goals) {
    if (goal.endDate < today && goal.currentAmount < goal.targetAmount) {
      list.push({
        key: `goal-${goal.id}`,
        tone: "warning",
        text: `A meta "${goal.description}" passou do prazo com ${formatPercent(goal.currentAmount / Math.max(1, goal.targetAmount))} concluído.`,
      });
    }
  }

  return list;
}

function AlertsSection({ alerts }: { alerts: Alert[] }) {
  const theme = useTheme();
  return (
    <Surface>
      <SectionTitle title="Atenção" />
      {alerts.length === 0 ? (
        <View style={styles.alertRow}>
          <IconSymbol
            ios="checkmark.circle.fill"
            android="check_circle"
            size={18}
            color={theme.success}
          />
          <ThemedText type="small">Tudo em ordem neste período.</ThemedText>
        </View>
      ) : (
        alerts.map((alert) => {
          const urgent = alert.tone === "danger";
          const strong = urgent ? theme.danger : theme.warningStrong;
          return (
            <View
              key={alert.key}
              accessibilityLabel={`${urgent ? "Urgente" : "Aviso"}: ${alert.text}`}
              style={[
                styles.alertRow,
                styles.alertBox,
                {
                  backgroundColor: urgent ? theme.dangerSoft : theme.warningSoft,
                  borderColor: strong,
                },
              ]}
            >
              <IconSymbol
                ios={
                  urgent
                    ? "exclamationmark.circle.fill"
                    : "exclamationmark.triangle.fill"
                }
                android={urgent ? "error" : "warning"}
                size={18}
                color={strong}
              />
              <View style={styles.flex}>
                <ThemedText
                  type="smallBold"
                  style={{ color: (urgent ? theme.dangerText : theme.warningText) as string }}
                >
                  {urgent ? "Urgente" : "Aviso"}
                </ThemedText>
                <ThemedText type="small">{alert.text}</ThemedText>
              </View>
            </View>
          );
        })
      )}
    </Surface>
  );
}

// -------------------------------------------------------------------------------------------
// Summary
// -------------------------------------------------------------------------------------------

function SummarySection({ report }: { report: FinancialReport }) {
  const { totals } = report;
  const savingsRate = totals.income > 0 ? totals.result / totals.income : 0;

  return (
    <View style={styles.tiles}>
      <StatTile
        label="Entradas"
        value={formatCurrency(totals.income)}
        tone="success"
        delta={change(totals.income, totals.previousIncome)}
        higherIsGood
      />
      <StatTile
        label="Saídas"
        value={formatCurrency(totals.expense)}
        tone="danger"
        delta={change(totals.expense, totals.previousExpense)}
        higherIsGood={false}
      />
      <StatTile
        label="Resultado"
        value={formatCurrency(totals.result)}
        tone={totals.result >= 0 ? "success" : "danger"}
        hint="entradas − saídas"
      />
      <StatTile
        label="Taxa de poupança"
        value={totals.income > 0 ? formatPercent(savingsRate) : "—"}
        tone={
          savingsRate >= 0.2
            ? "success"
            : savingsRate >= 0
              ? "warning"
              : "danger"
        }
        hint="do que entrou, quanto sobrou"
      />
    </View>
  );
}

function change(current: number, previous: number) {
  if (previous <= 0) return undefined;
  return current / previous - 1;
}

function StatTile({
  label,
  value,
  tone,
  delta,
  higherIsGood,
  hint,
}: {
  label: string;
  value: string;
  tone: ThemeColor;
  delta?: number;
  higherIsGood?: boolean;
  hint?: string;
}) {
  const good =
    delta === undefined ? true : higherIsGood ? delta >= 0 : delta <= 0;
  return (
    <Surface style={styles.tile}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold" themeColor={tone} style={styles.tileValue}>
        {value}
      </ThemedText>
      {delta !== undefined ? (
        <ThemedText type="small" themeColor={good ? "success" : "danger"}>
          {delta >= 0 ? "▲" : "▼"} {formatPercent(Math.abs(delta))} vs. anterior
        </ThemedText>
      ) : (
        !!hint && (
          <ThemedText type="small" themeColor="textSecondary">
            {hint}
          </ThemedText>
        )
      )}
    </Surface>
  );
}

// -------------------------------------------------------------------------------------------
// Evolution
// -------------------------------------------------------------------------------------------

function MonthlySection({ report }: { report: FinancialReport }) {
  const theme = useTheme();
  const colors = [theme.success as string, theme.danger as string];
  return (
    <Surface>
      <SectionTitle title="Entradas × saídas por mês" />
      <BarChart
        data={report.monthly.map((m) => ({
          label: formatShortMonth(m.month),
          values: [m.income, m.expense],
        }))}
        colors={colors}
      />
      <ChartLegend
        items={[
          { label: "Entradas", color: colors[0] },
          { label: "Saídas", color: colors[1] },
        ]}
      />
    </Surface>
  );
}

function MonthPaceSection({ report }: { report: FinancialReport }) {
  const theme = useTheme();
  const end = new Date(`${report.endDate}T12:00:00`);
  const daysInMonth = new Date(
    end.getFullYear(),
    end.getMonth() + 1,
    0,
  ).getDate();
  const today = end.getDate();

  const cumulative: (number | null)[] = [];
  let sum = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    if (day <= today) {
      sum +=
        report.daily.find((d) => Number(d.date.slice(8, 10)) === day)
          ?.expense ?? 0;
      cumulative.push(sum);
    } else {
      cumulative.push(null);
    }
  }
  const spent = sum;
  const projected = today > 0 ? (spent / today) * daysInMonth : spent;
  const projection = cumulative.map((_, i) => {
    const day = i + 1;
    if (day < today) return null;
    return (
      spent +
      ((projected - spent) * (day - today)) / Math.max(1, daysInMonth - today)
    );
  });
  const income = report.totals.income;

  return (
    <Surface>
      <SectionTitle title="Ritmo de gastos do mês" />
      <ThemedText type="small" themeColor="textSecondary">
        No ritmo atual, o mês fecha com{" "}
        <ThemedText
          type="smallBold"
          themeColor={projected > income && income > 0 ? "danger" : "text"}
        >
          {formatCurrency(projected)}
        </ThemedText>{" "}
        de gastos
        {income > 0 ? `, contra ${formatCurrency(income)} de entradas.` : "."}
      </ThemedText>
      <LineChart
        labels={cumulative.map((_, i) => String(i + 1))}
        series={[
          {
            key: "gasto",
            color: theme.danger as string,
            points: cumulative,
            area: true,
          },
          {
            key: "projecao",
            color: theme.danger as string,
            points: projection,
            dashed: true,
          },
        ]}
        showDots={false}
      />
      <ChartLegend
        items={[
          { label: "Gasto acumulado", color: theme.danger as string },
          {
            label: "Projeção (tracejado)",
            color: theme.textSecondary as string,
          },
        ]}
      />
    </Surface>
  );
}

function NetWorthSection({ report }: { report: FinancialReport }) {
  const theme = useTheme();
  const history = report.balanceHistory;
  const last = history[history.length - 1]?.balance ?? 0;
  const first = history[0]?.balance ?? 0;
  const variation = last - first;

  return (
    <Surface>
      <SectionTitle title="Evolução do patrimônio" />
      <View style={styles.rowBetween}>
        <ThemedText type="smallBold">{formatCurrency(last)}</ThemedText>
        {history.length > 1 && (
          <ThemedText
            type="small"
            themeColor={variation >= 0 ? "success" : "danger"}
          >
            {variation >= 0 ? "+" : ""}
            {formatCurrency(variation)} no período
          </ThemedText>
        )}
      </View>
      {history.length > 1 ? (
        <LineChart
          labels={history.map((h) => formatShortMonth(h.date))}
          series={[
            {
              key: "patrimonio",
              color: theme.primary as string,
              points: history.map((h) => h.balance),
              area: true,
            },
          ]}
        />
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          Escolha um período de 3 meses ou mais para ver a evolução.
        </ThemedText>
      )}
    </Surface>
  );
}

// -------------------------------------------------------------------------------------------
// Categories and budget
// -------------------------------------------------------------------------------------------

function CategoriesSection({ report }: { report: FinancialReport }) {
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const list =
    kind === "expense" ? report.expenseCategories : report.incomeCategories;
  const total = list.reduce((s, c) => s + c.total, 0);

  const top = list.slice(0, DONUT_SLICES);
  const rest = list.slice(DONUT_SLICES);
  const restTotal = rest.reduce((s, c) => s + c.total, 0);
  const rows = [
    ...top.map((c, i) => ({
      key: String(c.categoryId),
      name: c.name,
      total: c.total,
      color: paletteColor(i),
      active: c.active,
      count: c.count,
    })),
    ...(restTotal > 0
      ? [
          {
            key: "outros",
            name: `Outras (${rest.length})`,
            total: restTotal,
            color: OTHERS_COLOR,
            active: true,
            count: rest.reduce((s, c) => s + c.count, 0),
          },
        ]
      : []),
  ];

  return (
    <Surface>
      <SectionTitle title="Por categoria" />
      <ChipRow
        options={[
          { value: "expense", label: "Saídas" },
          { value: "income", label: "Entradas" },
        ]}
        value={kind}
        onChange={setKind}
        small
      />
      {rows.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Nenhuma {kind === "expense" ? "saída" : "entrada"} no período.
        </ThemedText>
      ) : (
        <>
          <View style={styles.donutWrap}>
            <DonutChart
              segments={rows.map((r) => ({
                key: r.key,
                value: r.total,
                color: r.color,
              }))}
              centerValue={formatCompactCurrency(total)}
              centerLabel={kind === "expense" ? "em saídas" : "em entradas"}
            />
          </View>
          {rows.map((row) => (
            <View key={row.key} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: row.color }]} />
              <View style={styles.flex}>
                <View style={styles.inline}>
                  <ThemedText type="small">{row.name}</ThemedText>
                  {!row.active && <Badge label="desativada" />}
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {row.count} {row.count === 1 ? "lançamento" : "lançamentos"}
                </ThemedText>
              </View>
              <View style={styles.alignEnd}>
                <ThemedText type="smallBold">
                  {formatCurrency(row.total)}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {formatPercent(total > 0 ? row.total / total : 0)}
                </ThemedText>
              </View>
            </View>
          ))}
        </>
      )}
    </Surface>
  );
}

function BudgetSection({ report }: { report: FinancialReport }) {
  const withLimit = report.expenseCategories.filter((c) => c.limit && c.active);
  const perMonth = report.months > 1;

  return (
    <Surface>
      <SectionTitle title="Limites das categorias" />
      <ThemedText type="small" themeColor="textSecondary">
        {perMonth
          ? "Média mensal do período comparada ao limite de cada categoria."
          : "Gasto do mês comparado ao limite de cada categoria."}
      </ThemedText>
      {withLimit.length === 0 ? (
        <View style={styles.inline}>
          <ThemedText type="small" themeColor="textSecondary">
            Nenhuma categoria com limite.
          </ThemedText>
          <Pressable onPress={() => router.push("/categoria")} hitSlop={8}>
            <ThemedText type="link" themeColor="primary">
              Definir limites
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        withLimit
          .map((c) => ({
            category: c,
            spent: monthlyAverage(c, report.months),
            limit: c.limit as number,
          }))
          .sort((a, b) => b.spent / b.limit - a.spent / a.limit)
          .map(({ category, spent, limit }) => {
            const usage = spent / limit;
            const tone: ThemeColor =
              usage >= 1
                ? "danger"
                : usage >= BUDGET_WARNING
                  ? "warning"
                  : "primary";
            return (
              <View key={category.categoryId} style={styles.barBlock}>
                <View style={styles.rowBetween}>
                  <ThemedText type="small">{category.name}</ThemedText>
                  <ThemedText
                    type="small"
                    themeColor={usage >= 1 ? "danger" : "textSecondary"}
                  >
                    {formatCurrency(spent)} de {formatCurrency(limit)} ·{" "}
                    {formatPercent(usage)}
                  </ThemedText>
                </View>
                <ProgressBar progress={usage} tone={tone} />
              </View>
            );
          })
      )}
    </Surface>
  );
}

// -------------------------------------------------------------------------------------------
// Payment methods, cards, accounts, goals, top expenses
// -------------------------------------------------------------------------------------------

function PaymentMethodsSection({ report }: { report: FinancialReport }) {
  const total = report.paymentMethods.reduce((s, p) => s + p.total, 0);
  return (
    <Surface>
      <SectionTitle title="Formas de pagamento" />
      {report.paymentMethods.map((p, i) => (
        <View key={p.method} style={styles.barBlock}>
          <View style={styles.rowBetween}>
            <ThemedText type="small">{PAYMENT_LABEL[p.method]}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatCurrency(p.total)} ·{" "}
              {formatPercent(total > 0 ? p.total / total : 0)}
            </ThemedText>
          </View>
          <HorizontalBar
            progress={total > 0 ? p.total / total : 0}
            color={paletteColor(i)}
          />
        </View>
      ))}
    </Surface>
  );
}

function CardsSection({ report }: { report: FinancialReport }) {
  const credit = report.cards.filter(
    (c) => c.kind === "credito" && c.limit > 0,
  );
  const totalLimit = credit.reduce((s, c) => s + c.limit, 0);
  const totalUsed = credit.reduce((s, c) => s + c.used, 0);

  return (
    <Surface>
      <SectionTitle title="Cartões e faturas" />
      {credit.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Nenhum cartão de crédito com limite cadastrado.
        </ThemedText>
      ) : (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            {formatCurrency(totalUsed)} usados de {formatCurrency(totalLimit)}{" "}
            de limite total
          </ThemedText>
          {credit.map((card) => {
            const usage = card.used / card.limit;
            const tone: ThemeColor =
              usage >= 1
                ? "danger"
                : usage >= CARD_NEAR_LIMIT
                  ? "warning"
                  : "primary";
            return (
              <View key={card.cardId} style={styles.barBlock}>
                <View style={styles.rowBetween}>
                  <ThemedText type="small">{card.name}</ThemedText>
                  <ThemedText
                    type="small"
                    themeColor={
                      usage >= CARD_NEAR_LIMIT ? tone : "textSecondary"
                    }
                  >
                    {formatCurrency(card.used)} · {formatPercent(usage)}
                  </ThemedText>
                </View>
                <ProgressBar progress={usage} tone={tone} />
              </View>
            );
          })}
        </>
      )}
      {report.invoices.length > 0 && (
        <View style={styles.badges}>
          {(["atrasada", "aberta", "fechada", "paga"] as const).map(
            (status) => {
              const item = report.invoices.find((i) => i.status === status);
              if (!item || item.count === 0) return null;
              return (
                <View key={status} style={styles.invoiceStat}>
                  <Badge
                    label={`${item.count} ${INVOICE_LABEL[status].toLowerCase()}`}
                    tone={INVOICE_TONE[status]}
                  />
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatCurrency(item.total)}
                  </ThemedText>
                </View>
              );
            },
          )}
        </View>
      )}
    </Surface>
  );
}

function AccountsSection({ accounts }: { accounts: Account[] }) {
  const positive = accounts.filter((a) => a.balance > 0);
  const total = positive.reduce((s, a) => s + a.balance, 0);
  const sorted = [...accounts].sort((a, b) => b.balance - a.balance);

  return (
    <Surface>
      <SectionTitle title="Onde está o dinheiro" />
      {accounts.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Nenhuma conta cadastrada.
        </ThemedText>
      ) : (
        sorted.map((account, i) => (
          <View key={account.id} style={styles.barBlock}>
            <View style={styles.rowBetween}>
              <ThemedText type="small">{account.bank}</ThemedText>
              <ThemedText
                type="small"
                themeColor={account.balance < 0 ? "danger" : "textSecondary"}
              >
                {formatCurrency(account.balance)}
                {account.balance > 0 && total > 0
                  ? ` · ${formatPercent(account.balance / total)}`
                  : ""}
              </ThemedText>
            </View>
            <HorizontalBar
              progress={total > 0 ? Math.max(0, account.balance) / total : 0}
              color={paletteColor(i)}
            />
          </View>
        ))
      )}
    </Surface>
  );
}

function goalStatus(
  goal: Goal,
  today: string,
): { label: string; tone: "success" | "danger" | "primary" } {
  if (goal.currentAmount >= goal.targetAmount)
    return { label: "Concluída", tone: "success" };
  if (goal.endDate < today) return { label: "Prazo vencido", tone: "danger" };
  return { label: "Em andamento", tone: "primary" };
}

function monthsUntil(endDate: string) {
  const now = new Date();
  const end = new Date(`${endDate}T12:00:00`);
  return Math.max(
    1,
    (end.getFullYear() - now.getFullYear()) * 12 +
      end.getMonth() -
      now.getMonth(),
  );
}

function GoalsSection({ goals }: { goals: Goal[] }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <Surface>
      <SectionTitle title="Metas" />
      {goals.length === 0 ? (
        <View style={styles.inline}>
          <ThemedText type="small" themeColor="textSecondary">
            Nenhuma meta criada.
          </ThemedText>
          <Pressable onPress={() => router.push("/meta/novo")} hitSlop={8}>
            <ThemedText type="link" themeColor="primary">
              Criar meta
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        goals.map((goal) => {
          const progress =
            goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
          const status = goalStatus(goal, today);
          const missing = Math.max(0, goal.targetAmount - goal.currentAmount);
          return (
            <Pressable
              key={goal.id}
              onPress={() =>
                router.push({ pathname: "/meta/[id]", params: { id: goal.id } })
              }
              style={styles.barBlock}
            >
              <View style={styles.rowBetween}>
                <ThemedText type="small">{goal.description}</ThemedText>
                <Badge label={status.label} tone={status.tone} />
              </View>
              <ProgressBar
                progress={progress}
                tone={
                  status.tone === "danger"
                    ? "danger"
                    : status.tone === "success"
                      ? "success"
                      : "primary"
                }
              />
              <ThemedText type="small" themeColor="textSecondary">
                {formatCurrency(goal.currentAmount)} de{" "}
                {formatCurrency(goal.targetAmount)} · {formatPercent(progress)}
                {status.tone === "primary" && missing > 0
                  ? ` · guardar ${formatCurrency(missing / monthsUntil(goal.endDate))}/mês até ${formatDate(goal.endDate)}`
                  : ""}
              </ThemedText>
            </Pressable>
          );
        })
      )}
    </Surface>
  );
}

function TopExpensesSection({ report }: { report: FinancialReport }) {
  const theme = useTheme();
  if (report.topExpenses.length === 0) return null;
  return (
    <Surface>
      <SectionTitle title="Maiores gastos" />
      {report.topExpenses.map((t) => (
        <ListRow
          key={t.transactionId}
          title={t.description}
          subtitle={`${t.categoryName} · ${formatDate(t.date)}`}
          rightText={`-${formatCurrency(t.amount)}`}
          rightTextColor={theme.danger as string}
          onPress={
            USE_MOCK_REPORTS
              ? undefined
              : () => router.push(`/transacao/${t.transactionId}`)
          }
        />
      ))}
    </Surface>
  );
}

// -------------------------------------------------------------------------------------------
// Small building blocks
// -------------------------------------------------------------------------------------------

function SectionTitle({ title }: { title: string }) {
  return <ThemedText type="smallBold">{title}</ThemedText>;
}

function HorizontalBar({
  progress,
  color,
}: {
  progress: number;
  color: string;
}) {
  const theme = useTheme();
  const clamped = Math.min(Math.max(progress, 0), 1);
  return (
    <View
      style={[styles.hTrack, { backgroundColor: theme.backgroundSelected }]}
    >
      <View
        style={[
          styles.hFill,
          { width: `${clamped * 100}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
}

function ChipRow<T extends string>({
  options,
  value,
  onChange,
  small,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  small?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.chips}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              small ? styles.chipSmall : styles.chip,
              {
                backgroundColor: selected
                  ? theme.primary
                  : theme.backgroundSelected,
              },
            ]}
          >
            <ThemedText
              type="small"
              style={{ color: selected ? theme.onPrimary : theme.text }}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: "center" },
  state: {
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.five,
  },
  stateBox: {
    alignItems: "center",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  chipSmall: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.three,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.two,
  },
  alertBox: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  tiles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  tile: {
    flexBasis: "47%",
    flexGrow: 1,
    gap: Spacing.half,
  },
  tileValue: {
    fontSize: 18,
    lineHeight: 24,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.two,
  },
  inline: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  donutWrap: {
    alignItems: "center",
    paddingVertical: Spacing.two,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  alignEnd: {
    alignItems: "flex-end",
  },
  barBlock: {
    gap: Spacing.one,
  },
  hTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  hFill: {
    height: "100%",
    borderRadius: 4,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  invoiceStat: {
    gap: Spacing.half,
  },
});
