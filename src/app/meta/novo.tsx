import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { DateField } from '@/components/ui/date-field';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useFinance } from '@/context/finance-context';
import { toIsoDate } from '@/utils/date';
import { parseCurrencyInput } from '@/utils/money';

export default function NovaMetaScreen() {
  const { addGoal } = useFinance();
  const [description, setDescription] = useState('');
  const [initialAmount, setInitialAmount] = useState('0,00');
  const [targetAmount, setTargetAmount] = useState('0,00');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  async function handleSubmit() {
    if (!description || !targetAmount) return;
    await addGoal({
      description,
      initialAmount: parseCurrencyInput(initialAmount),
      targetAmount: parseCurrencyInput(targetAmount),
      startDate: toIsoDate(startDate) || new Date().toISOString().slice(0, 10),
      endDate: toIsoDate(endDate) || new Date().toISOString().slice(0, 10),
    });
    router.back();
  }

  return (
    <Screen contentStyle={styles.content}>
      <TextField label="Descrição" placeholder="Viagem Europa" value={description} onChangeText={setDescription} />
      <TextField label="Valor inicial" value={initialAmount} onChangeText={setInitialAmount} mask="currency" />
      <TextField label="Valor da meta" value={targetAmount} onChangeText={setTargetAmount} mask="currency" />
      <DateField label="Data inicial" value={startDate} onChange={setStartDate} />
      <DateField label="Data final" value={endDate} onChange={setEndDate} />
      <Button label="Salvar meta" onPress={handleSubmit} disabled={!description} />
      <Button label="Cancelar" variant="danger" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
  },
});
