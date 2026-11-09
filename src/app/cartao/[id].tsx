import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Spacing } from '@/constants/theme';
import { ApiError, useFinance } from '@/context/finance-context';
import type { Transaction } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { cardKindLabel } from '@/utils/cards';
import { confirmAction, notify } from '@/utils/confirm';
import { formatDate, formatMonthLabel } from '@/utils/date';
import { invoiceAmountLabel } from '@/utils/invoices';
import { formatCurrency } from '@/utils/money';

const invoiceTone = { aberta: 'primary', fechada: 'warning', paga: 'success', atrasada: 'danger' } as const;
const invoiceLabel = { aberta: 'Aberta', fechada: 'Fechada', paga: 'Paga', atrasada: 'Atrasada' } as const;

export default function CartaoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    findCard,
    findAccount,
    getCardTransactions,
    getCardInvoices,
    getCategory,
    refreshInactive,
    deactivateCard,
    reactivateCard,
  } = useFinance();
  const theme = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const card = findCard(Number(id));
  const account = card ? findAccount(card.accountId) : undefined;
  const inactive = card ? !card.active : false;
  const accountInactive = !account || !account.active;
  const invoices = card ? getCardInvoices(card.id) : [];

  useFocusEffect(
    useCallback(() => {
      refreshInactive().catch(() => {});
    }, [refreshInactive])
  );

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      getCardTransactions(Number(id))
        .then(setTransactions)
        .catch((err) => notify(err instanceof ApiError ? err.message : 'Não foi possível carregar as transações.'))
        .finally(() => setLoading(false));
    }, [id, getCardTransactions])
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

  if (!card) {
    return (
      <Screen>
        <ThemedText themeColor="textSecondary">{loading ? 'Carregando…' : 'Cartão não encontrado.'}</ThemedText>
      </Screen>
    );
  }

  const kindLabel = cardKindLabel(card.kind);
  const sections = [
    { key: 'credito', title: 'No crédito', items: transactions.filter((t) => t.paymentMethod === 'cartao_credito') },
    { key: 'debito', title: 'No débito', items: transactions.filter((t) => t.paymentMethod !== 'cartao_credito') },
  ].filter((section) => section.key === 'debito' || card.kind === 'credito');
  const sectionTotal = (items: Transaction[]) =>
    items.reduce((sum, t) => sum + (t.kind === 'income' ? -t.amount : t.amount), 0);

  function handleDeactivate() {
    confirmAction('Desativar cartão', `Desativar o cartão "${card!.nickname}"? O histórico continua disponível.`, 'Desativar', () =>
      run(() => deactivateCard(card!.id), 'Não foi possível desativar o cartão.')
    );
  }

  function handleReactivate() {
    run(() => reactivateCard(card!.id), 'Não foi possível reativar o cartão.');
  }

  return (
    <>
      <Stack.Screen options={{ title: card.nickname }} />
      <Screen>
        {inactive && (
          <ThemedView type="backgroundElement" style={styles.banner}>
            <ThemedText type="smallBold">Cartão desativado</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {accountInactive
                ? `Você pode consultar o histórico. Para reativar o cartão, reative primeiro a conta${account ? ` ${account.bank}` : ''}.`
                : 'Você pode consultar o histórico, mas nenhum ajuste é permitido. Reative o cartão para continuar usando.'}
            </ThemedText>
            {!accountInactive && (
              <Button label={busy ? 'Reativando…' : 'Reativar cartão'} onPress={handleReactivate} disabled={busy} />
            )}
          </ThemedView>
        )}

        <Surface>
          <ListRow title="Tipo" subtitle={kindLabel} icon={{ ios: 'creditcard', android: 'credit_card' }} />
          {account && (
            <ListRow
              title="Conta vinculada"
              subtitle={account.bank}
              icon={{ ios: 'building.columns', android: 'account_balance' }}
              showChevron
              onPress={() => router.push(`/conta/${account.id}`)}
            />
          )}
          {card.kind === 'credito' && (
            <>
              <ListRow title="Limite" subtitle={formatCurrency(card.limit)} icon={{ ios: 'gauge', android: 'speed' }} />
              <ListRow
                title="Fechamento e vencimento"
                subtitle={`Fecha dia ${card.closingDay} · vence dia ${card.dueDay}`}
                icon={{ ios: 'calendar', android: 'calendar_month' }}
              />
            </>
          )}
        </Surface>

        {invoices.length > 0 && (
          <Surface>
            <ThemedText type="smallBold">Faturas</ThemedText>
            {invoices.map((invoice) => (
              <ListRow
                key={invoice.id}
                title={`Fatura · ${formatMonthLabel(invoice.monthReference)}`}
                subtitle={invoiceAmountLabel(invoice)}
                icon={{ ios: 'doc.text', android: 'description' }}
                right={<Badge label={invoiceLabel[invoice.status]} tone={invoiceTone[invoice.status]} />}
                onPress={() => router.push(`/fatura/${invoice.id}`)}
              />
            ))}
          </Surface>
        )}

        {sections.map((section) => (
          <Surface key={section.key}>
            <ThemedText type="smallBold">{section.title}</ThemedText>
            {section.items.length > 0 && (
              <ThemedText type="small" themeColor="textSecondary">
                Total gasto: {formatCurrency(sectionTotal(section.items))}
              </ThemedText>
            )}
            {!loading && section.items.length === 0 && (
              <ThemedText type="small" themeColor="textSecondary">
                Nenhuma compra {section.key === 'credito' ? 'no crédito' : 'no débito'} neste cartão.
              </ThemedText>
            )}
            {section.items.map((transaction) => {
              const category = getCategory(transaction.categoryId);
              const parcels = transaction.parcels > 1 ? ` · ${transaction.parcels}x` : '';
              return (
                <ListRow
                  key={transaction.id}
                  title={transaction.description}
                  subtitle={`${category?.name ?? ''} · ${formatDate(transaction.date)}${parcels}`}
                  rightText={`${transaction.kind === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}`}
                  rightTextColor={(transaction.kind === 'income' ? theme.success : theme.danger) as string}
                  onPress={() => router.push(`/transacao/${transaction.id}`)}
                />
              );
            })}
          </Surface>
        ))}

        {!inactive && (
          <Button
            label={busy ? 'Desativando…' : 'Desativar cartão'}
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
  banner: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
