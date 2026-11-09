import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getTransactionOcrItems } from '@/api/documents';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Spacing } from '@/constants/theme';
import { useFinance } from '@/context/finance-context';
import { useTheme } from '@/hooks/use-theme';
import type { OcrItem, Transaction } from '@/data/types';
import { formatDate } from '@/utils/date';
import { formatCurrency } from '@/utils/money';

const paymentMethodLabel: Record<string, string> = {
  cartao_credito: 'Cartão de crédito',
  cartao_debito: 'Cartão de débito',
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  boleto: 'Boleto',
};

export default function TransacaoDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, getTransaction, getCategory, goals } = useFinance();
  const theme = useTheme();
  const [transaction, setTransaction] = useState<Transaction | undefined>(undefined);
  const [items, setItems] = useState<OcrItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const userId = user?.id;

  useFocusEffect(
    useCallback(() => {
      getTransaction(Number(id))
        .then(setTransaction)
        .finally(() => setLoaded(true));
      if (userId) {
        getTransactionOcrItems(userId, Number(id))
          .then(setItems)
          .catch(() => setItems([]));
      }
    }, [id, userId, getTransaction])
  );

  if (!loaded) return null;

  if (!transaction) {
    return (
      <Screen>
        <ThemedText>Transação não encontrada.</ThemedText>
      </Screen>
    );
  }

  const category = getCategory(transaction.categoryId);
  const goal = transaction.goalId ? goals.find((g) => g.id === transaction.goalId) : undefined;
  const amountColor = (transaction.kind === 'income' ? theme.success : theme.danger) as string;

  return (
    <>
      <Stack.Screen options={{ title: 'Transação' }} />
      <Screen>
        <View style={styles.header}>
          <ThemedText type="smallBold" style={styles.title}>
            {transaction.description}
          </ThemedText>
          <ThemedText type="title" style={[styles.amount, { color: amountColor }]}>
            {transaction.kind === 'income' ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </ThemedText>
        </View>

        <Surface>
          <DetailRow label="Categoria" value={category?.name ?? '—'} />
          {transaction.goalId && (
            <DetailRow
              label="Meta"
              value={`${goal?.description ?? 'Meta'} · ${transaction.metaDirection === 'retirada' ? 'retirada' : 'depósito'}`}
            />
          )}
          <DetailRow label="Forma de pagamento" value={paymentMethodLabel[transaction.paymentMethod]} />
          <DetailRow label="Data" value={formatDate(transaction.date.slice(0, 10))} />
          <DetailRow
            label="Origem"
            value={transaction.source === 'ocr' || items.length > 0 ? 'OCR · comprovante' : 'Manual'}
          />
          {transaction.parcels > 1 && <DetailRow label="Parcelas" value={`${transaction.parcels}x`} />}
        </Surface>

        {items.length > 0 && (
          <Surface>
            <ThemedText type="smallBold">Itens da nota</ThemedText>
            {items.map((item, index) => (
              <View
                key={item.suggestedItemId ?? index}
                style={[
                  styles.itemRow,
                  index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
                ]}>
                <View style={styles.itemText}>
                  <ThemedText type="default">{item.description}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatQuantity(item.quantity)}
                    {item.unit ? ` ${item.unit}` : ''} × {formatCurrency(item.unitPrice)}
                  </ThemedText>
                </View>
                <ThemedText type="smallBold">{formatCurrency(item.total)}</ThemedText>
              </View>
            ))}
            <View style={[styles.itemRow, { borderTopWidth: 1, borderTopColor: theme.border }]}>
              <ThemedText type="smallBold" style={styles.itemText}>
                Total dos itens
              </ThemedText>
              <ThemedText type="smallBold">
                {formatCurrency(items.reduce((sum, item) => sum + item.total, 0))}
              </ThemedText>
            </View>
          </Surface>
        )}

        <Button
          label="Editar"
          variant="ghost"
          onPress={() => router.push({ pathname: '/transacao/editar', params: { id: transaction.id } })}
        />
      </Screen>
    </>
  );
}

function formatQuantity(quantity: number) {
  return quantity.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="default">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
  },
  amount: {
    fontSize: 28,
    lineHeight: 34,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  itemText: {
    flex: 1,
    gap: 2,
  },
  detailRow: {
    gap: 2,
    paddingVertical: Spacing.one,
  },
});
