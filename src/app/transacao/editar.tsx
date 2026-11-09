import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { Screen } from '@/components/ui/screen';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { ApiError, useFinance } from '@/context/finance-context';
import type { Transaction } from '@/data/types';
import { formatDate, toIsoDate } from '@/utils/date';
import { toCurrencyInput, parseCurrencyInput } from '@/utils/money';

type FormKind = 'income' | 'expense' | 'goal';

const paymentMethodLabel: Record<string, string> = {
  cartao_credito: 'Cartão de crédito',
  cartao_debito: 'Cartão de débito',
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  boleto: 'Boleto',
};

export default function EditarTransacaoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTransaction, categories, goals, goalCategory, editTransaction, getCategory } = useFinance();

  const [original, setOriginal] = useState<Transaction | undefined>();
  const [loaded, setLoaded] = useState(false);
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<FormKind>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [goalId, setGoalId] = useState('');
  const [metaDirection, setMetaDirection] = useState<'deposito' | 'retirada'>('deposito');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getTransaction(Number(id))
      .then((transaction) => {
        if (!transaction) return;
        setOriginal(transaction);
        setDescription(transaction.description);
        if (transaction.goalId) {
          setKind('goal');
          setGoalId(String(transaction.goalId));
          setMetaDirection(transaction.metaDirection ?? 'deposito');
        } else {
          setKind(transaction.kind);
          setCategoryId(String(transaction.categoryId));
        }
        setAmount(toCurrencyInput(transaction.amount));
        setDate(formatDate(transaction.date.slice(0, 10)));
      })
      .finally(() => setLoaded(true));
  }, [id, getTransaction]);

  if (!loaded) return null;
  if (!original) {
    return (
      <Screen>
        <ThemedText>Transação não encontrada.</ThemedText>
      </Screen>
    );
  }

  const isGoal = kind === 'goal';
  const usesCard = original.paymentMethod === 'cartao_credito' || original.paymentMethod === 'cartao_debito';
  const current = getCategory(original.categoryId);
  const categoryOptions = [
    ...categories.filter((c) => c.kind === kind),
    ...(current && !current.isDefault && current.kind === kind && !categories.some((c) => c.id === current.id)
      ? [current]
      : []),
  ].map((c) => ({ label: c.name, value: String(c.id) }));

  const canSubmit = !!description.trim() && !!date && (isGoal ? !!goalId && !!goalCategory : !!categoryId);

  async function handleSubmit() {
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);
    try {
      await editTransaction(original!.id, {
        description: description.trim(),
        categoryId: isGoal ? goalCategory!.id : Number(categoryId),
        goalId: isGoal ? Number(goalId) : undefined,
        metaDirection: isGoal ? metaDirection : undefined,
        amount: parseCurrencyInput(amount),
        date: toIsoDate(date),
      });
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  const kindOptions = [
    { label: 'Saída', value: 'expense' },
    { label: 'Entrada', value: 'income' },
    ...(usesCard ? [] : [{ label: 'Meta (guardar ou retirar)', value: 'goal' }]),
  ];

  return (
    <Screen contentStyle={styles.content}>
      <TextField label="Descrição" value={description} onChangeText={setDescription} />
      <SelectField
        label="Tipo"
        value={kind}
        options={kindOptions}
        onChange={(value) => {
          setKind(value as FormKind);
          setCategoryId('');
          if (value === 'goal' && !goalId) setGoalId(String(goals[0]?.id ?? ''));
        }}
      />
      {isGoal ? (
        <>
          <SelectField
            label="Meta"
            placeholder="Selecione a meta"
            value={goalId}
            options={goals.map((goal) => ({ label: goal.description, value: String(goal.id) }))}
            onChange={setGoalId}
          />
          <SelectField
            label="Movimento"
            value={metaDirection}
            options={[
              { label: 'Guardar na meta (sai da conta)', value: 'deposito' },
              { label: 'Retirar da meta (volta para a conta)', value: 'retirada' },
            ]}
            onChange={(value) => setMetaDirection(value as 'deposito' | 'retirada')}
          />
        </>
      ) : (
        <SelectField
          label="Categoria"
          placeholder="Selecione a categoria"
          value={categoryId}
          options={categoryOptions}
          onChange={setCategoryId}
        />
      )}
      <TextField label="Valor" value={amount} onChangeText={setAmount} mask="currency" />
      <DateField label="Data" value={date} onChange={setDate} />

      <ThemedText type="small" themeColor="textSecondary">
        Forma de pagamento: {paymentMethodLabel[original.paymentMethod]}
        {original.parcels > 1 ? ` em ${original.parcels}x` : ''}. A forma de pagamento, a conta, o cartão e as parcelas
        não podem ser alterados.
      </ThemedText>

      {!!error && (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      )}

      <Button label={submitting ? 'Salvando…' : 'Salvar'} onPress={handleSubmit} disabled={!canSubmit || submitting} />
      <Button label="Cancelar" variant="danger" onPress={() => router.back()} disabled={submitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
  },
});
