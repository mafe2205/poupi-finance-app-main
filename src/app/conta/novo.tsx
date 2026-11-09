import { router } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useFinance } from '@/context/finance-context';
import { parseCurrencyInput } from '@/utils/money';
import { StyleSheet } from 'react-native';

const BANK_OPTIONS = [
  { label: 'Santander', value: 'Santander' },
  { label: 'Nubank', value: 'Nubank' },
  { label: 'Itaú', value: 'Itaú' },
  { label: 'Bradesco', value: 'Bradesco' },
  { label: 'Banco do Brasil', value: 'Banco do Brasil' },
  { label: 'Caixa', value: 'Caixa' },
];

export default function NovaContaScreen() {
  const { addAccount } = useFinance();
  const [bank, setBank] = useState('');
  const [agency, setAgency] = useState('0001');
  const [number, setNumber] = useState('');
  const [balance, setBalance] = useState('0,00');

  async function handleSubmit() {
    if (!bank) return;
    await addAccount({
      bank,
      agency,
      number,
      balance: parseCurrencyInput(balance),
    });
    router.back();
  }

  return (
    <Screen contentStyle={styles.content}>
      <SelectField label="Banco" placeholder="Selecione o banco" value={bank} options={BANK_OPTIONS} onChange={setBank} />
      <TextField label="Agência" value={agency} onChangeText={setAgency} keyboardType="number-pad" />
      <TextField label="Número da conta" placeholder="00000-0" value={number} onChangeText={setNumber} mask="account" />
      <TextField
        label="Saldo atual"
        value={balance}
        onChangeText={setBalance}
        mask="currency"
      />
      <Button label="Salvar" onPress={handleSubmit} disabled={!bank} />
      <Button label="Cancelar" variant="danger" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
  },
});
