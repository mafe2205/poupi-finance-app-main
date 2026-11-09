import {
  router,
  Stack,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListRow } from "@/components/ui/list-row";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Screen } from "@/components/ui/screen";
import { SelectField } from "@/components/ui/select-field";
import { Surface } from "@/components/ui/surface";
import { TextField } from "@/components/ui/text-field";
import { Spacing } from "@/constants/theme";
import { ApiError, useFinance } from "@/context/finance-context";
import {
  MOCK_INVOICE_ID,
  mockCard,
  mockCategoryNames,
  mockInvoice,
  mockInvoiceTransactions,
} from "@/data/invoice-mock";
import type { Invoice, InvoicePayment, Transaction } from "@/data/types";
import { confirmAction, notify } from "@/utils/confirm";
import { formatDate, formatMonthLabel } from "@/utils/date";
import {
  formatCurrency,
  parseCurrencyInput,
  toCurrencyInput,
} from "@/utils/money";

const statusLabel = {
  aberta: "Aberta",
  fechada: "Fechada",
  paga: "Paga",
  atrasada: "Atrasada",
} as const;
const statusTone = {
  aberta: "primary",
  fechada: "warning",
  paga: "success",
  atrasada: "danger",
} as const;

const cents = (value: number) => Math.round(value * 100);

export default function FaturaDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    accounts,
    getInvoice,
    getCard,
    getInvoiceTransactions,
    getCategory,
    getAccount,
    payInvoice,
    getInvoicePayments,
  } = useFinance();
  const isMock = id === MOCK_INVOICE_ID;
  const [transactions, setTransactions] = useState<Transaction[]>(
    isMock ? mockInvoiceTransactions : [],
  );
  const [payments, setPayments] = useState<InvoicePayment[]>([]);
  const [mockState, setMockState] = useState<Invoice>(mockInvoice);

  const invoice = isMock ? mockState : getInvoice(Number(id));
  const card = isMock
    ? mockCard
    : invoice
      ? getCard(invoice.cardId)
      : undefined;

  const [typedAmount, setTypedAmount] = useState<string | null>(null);
  const [chosenAccountId, setChosenAccountId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const amount =
    typedAmount ?? (invoice ? toCurrencyInput(invoice.remaining) : "");
  const accountId = chosenAccountId ?? (card ? String(card.accountId) : "");

  useFocusEffect(
    useCallback(() => {
      if (isMock) return;
      getInvoiceTransactions(Number(id)).then(setTransactions);
      getInvoicePayments(Number(id))
        .then(setPayments)
        .catch(() => setPayments([]));
    }, [id, isMock, getInvoiceTransactions, getInvoicePayments]),
  );

  if (!invoice) {
    return (
      <Screen>
        <ThemedText>Fatura não encontrada.</ThemedText>
      </Screen>
    );
  }

  const limitUsed = card && card.limit > 0 ? invoice.total / card.limit : 0;
  const value = parseCurrencyInput(amount);
  const tooMuch = cents(value) > cents(invoice.remaining);
  const canPay = value > 0 && !tooMuch && !!accountId && !paying;

  const accountOptions = isMock
    ? [
        {
          label: "Conta do cartão (exemplo)",
          value: String(mockCard.accountId),
        },
      ]
    : accounts.map((account) => ({
        label: account.bank,
        value: String(account.id),
      }));

  function confirmPay() {
    if (!canPay) return;
    const account = isMock ? undefined : getAccount(Number(accountId));
    const accountName = isMock
      ? "Conta do cartão (exemplo)"
      : (account?.bank ?? "Conta do cartão");
    const left = Math.max(0, invoice!.remaining - value);
    const lines = [
      `Fatura: ${formatMonthLabel(invoice!.monthReference)}${card ? ` · ${card.nickname}` : ""}`,
      `Valor: ${formatCurrency(value)}`,
      `Conta: ${accountName}`,
      `Data: ${new Date().toLocaleDateString("pt-BR")}`,
      cents(left) === 0
        ? "Com esse pagamento, a fatura fica paga."
        : `Depois disso, ainda falta ${formatCurrency(left)}.`,
    ];
    if (account)
      lines.push(
        `Saldo da conta depois: ${formatCurrency(account.balance - value)}`,
      );
    confirmAction(
      "Pagar fatura",
      `Tem certeza que gostaria de pagar?\n\n${lines.join("\n")}`,
      "Pagar",
      pay,
    );
  }

  async function pay() {
    if (!canPay) return;
    setPaying(true);
    try {
      if (isMock) {
        const paid = invoice!.paid + value;
        const remaining = Math.max(0, invoice!.total - paid);
        const today = new Date().toISOString().slice(0, 10);
        setMockState({
          ...invoice!,
          paid,
          remaining,
          ...(cents(remaining) === 0 && { status: "paga", paymentDate: today }),
        });
        setPayments((prev) => [
          {
            id: -Date.now(),
            invoiceId: invoice!.id,
            accountId: Number(accountId),
            amount: value,
            paymentDate: today,
          },
          ...prev,
        ]);
        setTypedAmount(null);
        return;
      }
      await payInvoice(invoice!.id, value, Number(accountId));
      setTypedAmount(null);
      setPayments(await getInvoicePayments(invoice!.id));
    } catch (err) {
      notify(
        err instanceof ApiError
          ? `Não foi possível pagar a fatura: ${err.message}`
          : "Não foi possível pagar a fatura. Tente novamente.",
      );
    } finally {
      setPaying(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `Fatura · ${formatMonthLabel(invoice.monthReference)}`,
        }}
      />
      <Screen>
        <View style={styles.header}>
          <Badge
            label={statusLabel[invoice.status]}
            tone={statusTone[invoice.status]}
          />
          <ThemedText type="title" style={styles.total}>
            {formatCurrency(invoice.total)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {invoice.status === "paga" && invoice.paymentDate
              ? `Paga em ${formatDate(invoice.paymentDate)}`
              : `Vence em ${formatDate(invoice.dueDate)}`}
          </ThemedText>
          {invoice.status !== "paga" && invoice.paid > 0 && (
            <ThemedText type="smallBold">
              Pago {formatCurrency(invoice.paid)} · Falta{" "}
              {formatCurrency(invoice.remaining)}
            </ThemedText>
          )}
          <View style={styles.progressBlock}>
            <ProgressBar
              progress={limitUsed}
              tone={limitUsed > 0.8 ? "danger" : "primary"}
            />
            <ThemedText type="small" themeColor="textSecondary">
              {Math.round(limitUsed * 100)}% do limite utilizado
            </ThemedText>
          </View>
        </View>

        {invoice.status !== "paga" && invoice.remaining > 0 && (
          <Surface style={styles.payBox}>
            <ThemedText type="smallBold">Pagar fatura</ThemedText>
            <SelectField
              label="Pagar com a conta"
              value={accountId}
              options={accountOptions}
              onChange={setChosenAccountId}
            />
            <TextField
              label="Valor"
              value={amount}
              onChangeText={setTypedAmount}
              mask="currency"
            />
            <ThemedText
              type="small"
              themeColor={tooMuch ? "danger" : "textSecondary"}
            >
              {tooMuch
                ? `O valor passa do que falta pagar (${formatCurrency(invoice.remaining)}).`
                : "Você pode pagar só uma parte. O valor sai do saldo da conta."}
            </ThemedText>
            <Button
              label={paying ? "Pagando…" : `Pagar ${formatCurrency(value)}`}
              onPress={confirmPay}
              disabled={!canPay}
            />
          </Surface>
        )}

        {payments.length > 0 && (
          <>
            <ThemedText type="smallBold">Pagamentos</ThemedText>
            <Surface>
              {payments.map((payment) => (
                <ListRow
                  key={payment.id}
                  title={formatDate(payment.paymentDate)}
                  subtitle={
                    isMock
                      ? "Conta do cartão (exemplo)"
                      : getAccount(payment.accountId)?.bank
                  }
                  rightText={formatCurrency(payment.amount)}
                />
              ))}
            </Surface>
          </>
        )}

        <ThemedText type="smallBold">Compras</ThemedText>
        <Surface>
          {transactions.map((transaction) => {
            const categoryName = isMock
              ? mockCategoryNames[transaction.categoryId]
              : getCategory(transaction.categoryId)?.name;
            const installment =
              transaction.parcels > 1 ? `${transaction.parcels}x` : "1x";
            return (
              <ListRow
                key={transaction.id}
                title={transaction.description}
                subtitle={`${categoryName ?? ""} · ${installment}`}
                rightText={formatCurrency(transaction.amount)}
                onPress={
                  isMock
                    ? undefined
                    : () => router.push(`/transacao/${transaction.id}`)
                }
              />
            );
          })}
        </Surface>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    gap: Spacing.one,
  },
  total: {
    fontSize: 34,
    lineHeight: 40,
  },
  progressBlock: {
    width: "100%",
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  payBox: {
    gap: Spacing.two,
  },
});
