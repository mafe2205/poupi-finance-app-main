import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { ListRow } from "@/components/ui/list-row";
import { Screen } from "@/components/ui/screen";
import { Surface } from "@/components/ui/surface";
import { Spacing } from "@/constants/theme";
import { ApiError, useFinance } from "@/context/finance-context";
import type { InvoicePayment, Transaction } from "@/data/types";
import { useTheme } from "@/hooks/use-theme";
import { confirmAction, notify } from "@/utils/confirm";
import { formatDate, formatMonthLabel } from "@/utils/date";
import { cardKindLabel } from "@/utils/cards";
import { formatCurrency } from "@/utils/money";

type HistoryItem =
  | { kind: "transaction"; date: string; transaction: Transaction }
  | { kind: "invoicePayment"; date: string; payment: InvoicePayment };

const paymentMethodLabel: Record<string, string> = {
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  dinheiro: "Dinheiro",
  pix: "Pix",
  boleto: "Boleto",
};

export default function ContaTransacoesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    cards,
    inactiveCards,
    findAccount,
    getAccountTransactions,
    getAccountInvoicePayments,
    getCategory,
    getInvoice,
    getCard,
    refreshInactive,
    deactivateAccount,
    reactivateAccount,
    deactivateCard,
  } = useFinance();
  const theme = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoicePayments, setInvoicePayments] = useState<InvoicePayment[]>([]);
  const [busy, setBusy] = useState(false);

  const account = findAccount(Number(id));
  const readOnly = !account?.active;
  const accountCards = [...cards, ...inactiveCards].filter((card) => card.accountId === account?.id);

  useFocusEffect(
    useCallback(() => {
      refreshInactive().catch(() => {});
    }, [refreshInactive]),
  );

  async function run(action: () => Promise<void>, fallback: string) {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : fallback);
    } finally {
      setBusy(false);
    }
  }

  function handleDeactivate() {
    if (!account) return;
    confirmAction(
      "Desativar conta",
      `Desativar a conta "${account.bank}"? Os cartões dela também serão desativados. O histórico continua disponível em "Desativados".`,
      "Desativar",
      () =>
        run(
          () => deactivateAccount(account.id),
          "Não foi possível desativar a conta.",
        ),
    );
  }

  function handleReactivate() {
    if (!account) return;
    run(
      () => reactivateAccount(account.id),
      "Não foi possível reativar a conta.",
    );
  }

  function handleDeactivateCard(cardId: number, nickname: string) {
    confirmAction(
      "Desativar cartão",
      `Desativar o cartão "${nickname}"?`,
      "Desativar",
      () =>
        run(
          () => deactivateCard(cardId),
          "Não foi possível desativar o cartão.",
        ),
    );
  }

  const load = useCallback(() => {
    if (!id) return;
    getAccountTransactions(Number(id)).then(setTransactions);
    getAccountInvoicePayments(Number(id))
      .then(setInvoicePayments)
      .catch(() => setInvoicePayments([]));
  }, [id, getAccountTransactions, getAccountInvoicePayments]);

  useFocusEffect(load);

  const income = transactions
    .filter((t) => t.kind === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense =
    transactions.filter((t) => t.kind === "expense").reduce((sum, t) => sum + t.amount, 0) +
    invoicePayments.reduce((sum, p) => sum + p.amount, 0);

  const history: HistoryItem[] = [
    ...transactions.map((transaction) => ({ kind: "transaction" as const, date: transaction.date, transaction })),
    ...invoicePayments.map((payment) => ({ kind: "invoicePayment" as const, date: payment.paymentDate, payment })),
  ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  if (!account) {
    return (
      <Screen>
        <ThemedText>Conta não encontrada.</ThemedText>
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: account.bank }} />
      <Screen>
        {readOnly && (
          <ThemedView type="backgroundElement" style={styles.inactiveBanner}>
            <ThemedText type="smallBold">Conta desativada</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Você pode consultar o histórico, mas nenhum ajuste é permitido.
              Reative a conta para continuar usando.
            </ThemedText>
            <Button
              label={busy ? "Reativando…" : "Reativar conta"}
              onPress={handleReactivate}
              disabled={busy}
            />
          </ThemedView>
        )}

        <View style={styles.balanceBlock}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Saldo disponível
          </ThemedText>
          <ThemedText
            type="title"
            style={[
              styles.balance,
              account.balance < 0 && { color: theme.danger as string },
            ]}
          >
            {formatCurrency(account.balance)}
          </ThemedText>
          <View style={styles.totalsRow}>
            <ThemedText type="small" style={{ color: theme.success as string }}>
              Entradas +{formatCurrency(income)}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.danger as string }}>
              Saídas -{formatCurrency(expense)}
            </ThemedText>
          </View>
        </View>

        {!readOnly && (
          <Pressable
            style={[
              styles.newTransactionButton,
              { backgroundColor: theme.primary },
            ]}
            onPress={() =>
              router.push({
                pathname: "/transacao/novo",
                params: { accountId: account.id },
              })
            }
          >
            <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
              + Nova Transação
            </ThemedText>
          </Pressable>
        )}

        {accountCards.length > 0 && (
          <Surface>
            <ThemedText type="smallBold">Cartões desta conta</ThemedText>
            {accountCards.map((card) => (
              <ListRow
                key={card.id}
                title={card.nickname}
                subtitle={`${cardKindLabel(card.kind)}${!card.active ? " · desativado" : card.kind === "credito" ? ` · limite ${formatCurrency(card.limit)}` : ""}`}
                icon={{ ios: "creditcard", android: "credit_card" }}
                onPress={() => router.push(`/cartao/${card.id}`)}
                right={
                  !readOnly && card.active ? (
                    <Pressable
                      onPress={() => handleDeactivateCard(card.id, card.nickname)}
                      disabled={busy}
                      hitSlop={8}
                    >
                      <ThemedText type="small" themeColor="danger">
                        Desativar
                      </ThemedText>
                    </Pressable>
                  ) : undefined
                }
                showChevron
              />
            ))}
          </Surface>
        )}

        <Surface>
          {history.length === 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              Nenhuma transação por aqui ainda.
            </ThemedText>
          )}
          {history.map((item) => {
            if (item.kind === "invoicePayment") {
              const { payment } = item;
              const invoice = getInvoice(payment.invoiceId);
              const card = invoice ? getCard(invoice.cardId) : undefined;
              return (
                <ListRow
                  key={`payment-${payment.id}`}
                  title={`Pagamento da fatura${invoice ? ` · ${formatMonthLabel(invoice.monthReference)}` : ""}`}
                  subtitle={[card?.nickname, formatDate(payment.paymentDate)].filter(Boolean).join(" · ")}
                  rightText={`-${formatCurrency(payment.amount)}`}
                  rightTextColor={theme.danger as string}
                  onPress={() => router.push(`/fatura/${payment.invoiceId}`)}
                />
              );
            }
            const { transaction } = item;
            const category = getCategory(transaction.categoryId);
            return (
              <ListRow
                key={transaction.id}
                title={transaction.description}
                subtitle={`${category?.name ?? ""} · ${paymentMethodLabel[transaction.paymentMethod]} · ${formatDate(transaction.date)}`}
                rightText={`${transaction.kind === "income" ? "+" : "-"}${formatCurrency(transaction.amount)}`}
                rightTextColor={
                  (transaction.kind === "income"
                    ? theme.success
                    : theme.danger) as string
                }
                onPress={() => router.push(`/transacao/${transaction.id}`)}
              />
            );
          })}
        </Surface>

        {!readOnly && !account.isDefault && (
          <Button
            label={busy ? "Desativando…" : "Desativar conta"}
            variant="danger"
            onPress={handleDeactivate}
            disabled={busy}
          />
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  inactiveBanner: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  balanceBlock: {
    alignItems: "center",
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  balance: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: "700",
  },
  totalsRow: {
    flexDirection: "row",
    gap: Spacing.four,
    marginTop: Spacing.one,
  },
  newTransactionButton: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: "center",
  },
});
