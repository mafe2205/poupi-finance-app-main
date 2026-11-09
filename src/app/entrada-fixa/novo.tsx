import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useFinance } from '@/context/finance-context';
import type { PaymentMethod } from '@/data/types';
import { confirmDelete } from '@/utils/confirm';
import { cardAccepts } from '@/utils/cards';
import { formatDate } from '@/utils/date';
import { formatCurrency, parseCurrencyInput } from '@/utils/money';

const PAYMENT_METHOD_OPTIONS: { label: string; value: PaymentMethod }[] = [
  { label: 'Cartão de crédito', value: 'cartao_credito' },
  { label: 'Cartão de débito', value: 'cartao_debito' },
  { label: 'Dinheiro', value: 'dinheiro' },
  { label: 'Pix', value: 'pix' },
  { label: 'Boleto', value: 'boleto' },
];

export default function NovaEntradaFixaScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { categories, cards, accounts, fixedEntries, getCategory, addFixedEntry, cancelFixedEntry } = useFinance();
  const existing = id ? fixedEntries.find((entry) => entry.id === Number(id)) : undefined;

  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [accountId, setAccountId] = useState(String(accounts[0]?.id ?? ''));
  const [cardId, setCardId] = useState('');
  const [amount, setAmount] = useState('0,00');
  const [day, setDay] = useState('5');
  const [months, setMonths] = useState('12');
  const [submitting, setSubmitting] = useState(false);

  if (existing) {
    const category = getCategory(existing.categoryId);
    const kindLabel = existing.kind === 'income' ? 'entrada' : 'saída';
    return (
      <Screen contentStyle={styles.content}>
        <ThemedText type="subtitle">{existing.description}</ThemedText>
        <ThemedText themeColor="textSecondary">{category?.name}</ThemedText>
        <ThemedText type="title">{formatCurrency(existing.amount)}</ThemedText>
        <ThemedText themeColor="textSecondary">Próxima ocorrência: {formatDate(existing.date)}</ThemedText>
        <Button
          label={`Cancelar ${kindLabel} fixa`}
          variant="danger"
          onPress={() =>
            confirmDelete(`Cancelar as próximas ocorrências dessa ${kindLabel} fixa?`, async () => {
              await cancelFixedEntry(existing.id);
              router.back();
            })
          }
        />
      </Screen>
    );
  }

  const usesCard = paymentMethod === 'cartao_credito' || paymentMethod === 'cartao_debito';
  const cardOptions = cards
    .filter((card) => cardAccepts(card, paymentMethod))
    .map((card) => ({ label: card.nickname, value: String(card.id) }));
  const categoryOptions = categories
    .filter((category) => category.kind === kind)
    .map((category) => ({ label: category.name, value: String(category.id) }));

  const canSubmit = !!description && !!categoryId && (usesCard ? !!cardId : !!accountId);

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await addFixedEntry({
        description,
        categoryId: Number(categoryId),
        kind,
        amount: parseCurrencyInput(amount),
        day: Number(day) || 1,
        months: Number(months) || 1,
        paymentMethod,
        accountId: usesCard ? undefined : Number(accountId),
        cardId: usesCard ? Number(cardId) : undefined,
      });
      router.back();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen contentStyle={styles.content}>
      <TextField label="Descrição" placeholder="Ex.: Aluguel" value={description} onChangeText={setDescription} />
      <SelectField
        label="Tipo"
        value={kind}
        options={[
          { label: 'Saída', value: 'expense' },
          { label: 'Entrada', value: 'income' },
        ]}
        onChange={(value) => {
          setKind(value as 'income' | 'expense');
          setCategoryId('');
        }}
      />
      <SelectField
        label="Categoria"
        placeholder="Selecione a categoria"
        value={categoryId}
        options={categoryOptions}
        onChange={setCategoryId}
      />
      <SelectField
        label="Forma de Pagamento"
        value={paymentMethod}
        options={PAYMENT_METHOD_OPTIONS}
        onChange={(value) => {
          setPaymentMethod(value as PaymentMethod);
          setCardId('');
        }}
      />
      {usesCard ? (
        <SelectField
          label="Cartão"
          placeholder="Selecione o cartão"
          value={cardId}
          options={cardOptions}
          onChange={setCardId}
        />
      ) : (
        <SelectField
          label="Conta"
          value={accountId}
          options={accounts.map((account) => ({ label: account.bank, value: String(account.id) }))}
          onChange={setAccountId}
        />
      )}
      <TextField label="Valor" value={amount} onChangeText={setAmount} mask="currency" />
      <TextField label="Dia do mês" value={day} onChangeText={setDay} keyboardType="number-pad" />
      <TextField
        label="Gerar quantos meses"
        value={months}
        onChangeText={setMonths}
        keyboardType="number-pad"
      />
      <Button label={submitting ? 'Salvando…' : 'Salvar'} onPress={handleSubmit} disabled={!canSubmit || submitting} />
      <Button label="Cancelar" variant="danger" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
  },
});
