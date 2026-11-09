import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { getDocument, type DocumentState } from '@/api/documents';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { SelectField } from '@/components/ui/select-field';
import { Surface } from '@/components/ui/surface';
import { DateField } from '@/components/ui/date-field';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { ApiError, useFinance } from '@/context/finance-context';
import type { OcrItem, OcrReviewReason, PaymentMethod } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { toIsoDate, formatDate } from '@/utils/date';
import { formatCurrency, parseCurrencyInput, toCurrencyInput } from '@/utils/money';

function todayBr() {
  const [year, month, day] = new Date().toISOString().slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

const REVIEW_REASON_LABEL: Record<OcrReviewReason, string> = {
  falha_no_ocr: 'Não foi possível ler o comprovante.',
  texto_ilegivel: 'O texto do comprovante ficou ilegível.',
  baixa_confianca: 'A leitura da imagem ficou com pouca confiança.',
  baixa_confianca_valor: 'Algum dígito do valor pode ter sido lido errado.',
  valor_nao_encontrado: 'O valor não foi encontrado: preencha o valor.',
  divergencia_itens_total: 'A soma dos itens não bate com o total do comprovante.',
  categoria_requer_confirmacao: 'Não deu para ter certeza da categoria: escolha a categoria.',
  estabelecimento_nao_encontrado: 'O nome do estabelecimento não foi encontrado: confira a descrição.',
};

type ItemForm = {
  key: string;
  suggestedItemId?: number;
  code?: string;
  unit?: string;
  description: string;
  quantity: string;
  total: string;
};

let nextKey = 0;
function toItemForm(item: OcrItem): ItemForm {
  return {
    key: `item-${nextKey++}`,
    suggestedItemId: item.suggestedItemId,
    code: item.code,
    unit: item.unit,
    description: item.description,
    quantity: String(item.quantity).replace('.', ','),
    total: toCurrencyInput(item.total),
  };
}

function parseQuantity(text: string) {
  const value = Number(text.replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

function toOcrItem(form: ItemForm): OcrItem {
  const quantity = parseQuantity(form.quantity);
  const total = parseCurrencyInput(form.total);
  return {
    suggestedItemId: form.suggestedItemId,
    code: form.code,
    unit: form.unit,
    description: form.description.trim(),
    quantity,
    total,
    unitPrice: quantity > 0 ? Math.round((total / quantity) * 100) / 100 : 0,
  };
}

export default function RevisaoOcrScreen() {
  const { documentId } = useLocalSearchParams<{ documentId: string }>();
  const { accounts, categories, confirmDocumentTransaction } = useFinance();
  const theme = useTheme();

  const [document, setDocument] = useState<DocumentState | null>(null);
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('0,00');
  const [date, setDate] = useState(todayBr());
  const [accountId, setAccountId] = useState(String(accounts[0]?.id ?? ''));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [items, setItems] = useState<ItemForm[]>([]);
  const [itemsReviewed, setItemsReviewed] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function poll() {
      const state = await getDocument(Number(documentId));
      setDocument(state);
      if (state.status !== 'pendente') {
        if (pollTimer.current) clearInterval(pollTimer.current);
        if (state.draft) {
          setDescription(state.draft.description);
          setCategoryId(state.draft.categoryId != null ? String(state.draft.categoryId) : '');
          setAmount(toCurrencyInput(state.draft.amount));
          setDate(formatDate(state.draft.date));
          setItems(state.draft.items.map(toItemForm));
          setItemsReviewed(state.draft.items.length > 0);
        }
      }
    }
    poll();
    pollTimer.current = setInterval(poll, 3000);
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [documentId]);

  function updateItem(key: string, patch: Partial<ItemForm>) {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((item) => item.key !== key));
    setItemsReviewed(true);
  }

  function addItem() {
    setItems((prev) => [...prev, toItemForm({ description: '', quantity: 1, unitPrice: 0, total: 0 })]);
    setItemsReviewed(true);
  }

  const confirmedItems = items.map(toOcrItem);
  const invalidItem = confirmedItems.some((item) => !item.description || item.quantity <= 0 || item.total < 0);
  const itemsSum = confirmedItems.reduce((sum, item) => sum + item.total, 0);
  const totalAmount = parseCurrencyInput(amount);
  const itemsDiverge = confirmedItems.length > 0 && Math.abs(itemsSum - totalAmount) >= 0.01;

  async function handleConfirm() {
    if (!accountId || !categoryId) return;
    if (itemsReviewed && invalidItem) {
      setError('Todo item precisa de descrição e quantidade maior que zero.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await confirmDocumentTransaction(
        Number(documentId),
        {
          description,
          categoryId: Number(categoryId),
          paymentMethod,
          amount: totalAmount,
          date: toIsoDate(date),
          accountId:
            paymentMethod === 'cartao_credito' || paymentMethod === 'cartao_debito' ? undefined : Number(accountId),
        },
        itemsReviewed ? confirmedItems : undefined
      );
      router.dismissTo('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar a transação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!document || document.status === 'pendente') {
    return (
      <Screen contentStyle={styles.loading}>
        <ActivityIndicator size="large" />
        <ThemedText themeColor="textSecondary">Lendo o comprovante…</ThemedText>
      </Screen>
    );
  }

  if (document.status === 'erro' || !document.draft) {
    return (
      <Screen contentStyle={styles.loading}>
        <ThemedText>Não foi possível ler esse comprovante. Tente novamente com outra foto.</ThemedText>
        <Button label="Voltar" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  const { draft } = document;
  const needsCategory = draft.categoryRequiresConfirmation && !categoryId;

  return (
    <Screen contentStyle={styles.content}>
      <ThemedText type="subtitle">Confira os dados lidos</ThemedText>
      <Badge
        label={`Confiança ${draft.confidence >= 0.8 ? 'alta' : 'baixa'} · ${Math.round(draft.confidence * 100)}%`}
        tone={draft.confidence >= 0.8 ? 'success' : 'warning'}
      />

      {draft.reviewReasons.length > 0 && (
        <ThemedView type="backgroundElement" style={styles.reasons}>
          <ThemedText type="smallBold">Confira antes de confirmar</ThemedText>
          {draft.reviewReasons.map((reason) => (
            <ThemedText key={reason} type="small" themeColor="textSecondary">
              • {REVIEW_REASON_LABEL[reason] ?? reason}
            </ThemedText>
          ))}
        </ThemedView>
      )}

      <TextField label="Descrição" value={description} onChangeText={setDescription} />
      <View style={styles.fieldBlock}>
        <SelectField
          label="Categoria"
          placeholder="Selecione a categoria"
          value={categoryId}
          options={categories
            .filter((category) => category.kind === 'expense')
            .map((category) => ({ label: category.name, value: String(category.id) }))}
          onChange={setCategoryId}
        />
        {needsCategory && (
          <ThemedText type="small" themeColor="danger">
            A categoria não foi identificada com segurança. Escolha uma para continuar.
          </ThemedText>
        )}
      </View>
      <SelectField
        label="Forma de pagamento"
        value={paymentMethod}
        options={[
          { label: 'Dinheiro', value: 'dinheiro' },
          { label: 'Pix', value: 'pix' },
          { label: 'Boleto', value: 'boleto' },
        ]}
        onChange={(value) => setPaymentMethod(value as PaymentMethod)}
      />
      <SelectField
        label="Conta"
        value={accountId}
        options={accounts.map((account) => ({ label: account.bank, value: String(account.id) }))}
        onChange={setAccountId}
      />
      <TextField label="Valor" value={amount} onChangeText={setAmount} mask="currency" />
      <DateField label="Data" value={date} onChange={setDate} />

      <Surface>
        <View style={styles.itemsHeader}>
          <ThemedText type="smallBold">Itens da nota</ThemedText>
          {confirmedItems.length > 0 && (
            <ThemedText type="small" themeColor={itemsDiverge ? 'danger' : 'textSecondary'}>
              Soma {formatCurrency(itemsSum)}
            </ThemedText>
          )}
        </View>
        {items.length === 0 && (
          <ThemedText type="small" themeColor="textSecondary">
            Nenhum item foi lido nesse comprovante.
          </ThemedText>
        )}
        {itemsDiverge && (
          <ThemedText type="small" themeColor="danger">
            A soma dos itens é diferente do valor ({formatCurrency(totalAmount)}). Confira os itens ou o valor.
          </ThemedText>
        )}
        {items.map((item) => (
          <View key={item.key} style={[styles.item, { borderColor: theme.border }]}>
            <TextField
              label="Item"
              value={item.description}
              onChangeText={(text) => updateItem(item.key, { description: text })}
            />
            <View style={styles.itemRow}>
              <View style={styles.itemQuantity}>
                <TextField
                  label={item.unit ? `Qtd (${item.unit})` : 'Qtd'}
                  value={item.quantity}
                  onChangeText={(text) => updateItem(item.key, { quantity: text })}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.itemTotal}>
                <TextField
                  label="Total"
                  value={item.total}
                  onChangeText={(text) => updateItem(item.key, { total: text })}
                  mask="currency"
                />
              </View>
            </View>
            <Pressable onPress={() => removeItem(item.key)} hitSlop={8} style={styles.removeItem}>
              <ThemedText type="small" themeColor="danger">
                Remover item
              </ThemedText>
            </Pressable>
          </View>
        ))}
        <Pressable onPress={addItem} hitSlop={8}>
          <ThemedText type="link" themeColor="primary">
            + Adicionar item
          </ThemedText>
        </Pressable>
      </Surface>

      {!!error && (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      )}

      <Button
        label={submitting ? 'Salvando…' : 'Confirmar e criar transação'}
        onPress={handleConfirm}
        disabled={submitting || !accountId || !categoryId}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
  },
  loading: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  reasons: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  fieldBlock: {
    gap: Spacing.one,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  item: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  itemRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  itemQuantity: {
    flex: 1,
  },
  itemTotal: {
    flex: 2,
  },
  removeItem: {
    alignSelf: 'flex-end',
  },
});
