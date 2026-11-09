import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { ListRow } from '@/components/ui/list-row';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { SelectField } from '@/components/ui/select-field';
import { Surface } from '@/components/ui/surface';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useFinance } from '@/context/finance-context';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/date';
import { formatCurrency, parseCurrencyInput } from '@/utils/money';

export default function MetaHistoricoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { goals, accounts, getGoalTransactions, depositToGoal, withdrawFromGoal } = useFinance();
  const theme = useTheme();
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(String(accounts[0]?.id ?? ''));
  const [submitting, setSubmitting] = useState(false);

  const goal = goals.find((item) => item.id === Number(id));
  const history = getGoalTransactions(Number(id));

  if (!goal) {
    return (
      <Screen>
        <ThemedText>Meta não encontrada.</ThemedText>
      </Screen>
    );
  }

  const progress = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
  const value = parseCurrencyInput(amount);

  async function submit(direction: 'deposit' | 'withdraw') {
    if (value <= 0 || !accountId) return;
    setSubmitting(true);
    try {
      if (direction === 'deposit') await depositToGoal(goal!.id, Number(accountId), value);
      else await withdrawFromGoal(goal!.id, Number(accountId), value);
      setAmount('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: goal.description }} />
      <Screen contentStyle={styles.content}>
        <Surface>
          <View style={styles.header}>
            <ThemedText type="smallBold">
              {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {Math.round(progress * 100)}%
            </ThemedText>
          </View>
          <ProgressBar progress={progress} />
          <ThemedText type="small" themeColor="textSecondary">
            {formatDate(goal.startDate)} — {formatDate(goal.endDate)}
          </ThemedText>
        </Surface>

        <SelectField
          label="Conta"
          value={accountId}
          options={accounts.map((account) => ({ label: account.bank, value: String(account.id) }))}
          onChange={setAccountId}
        />
        <TextField label="Valor" placeholder="0,00" value={amount} onChangeText={setAmount} mask="currency" />
        <View style={styles.actions}>
          <Button
            label="Depositar"
            onPress={() => submit('deposit')}
            disabled={value <= 0 || !accountId || submitting}
            style={styles.action}
          />
          <Button
            label="Retirar"
            variant="secondary"
            onPress={() => submit('withdraw')}
            disabled={value <= 0 || !accountId || submitting}
            style={styles.action}
          />
        </View>

        <ThemedText type="smallBold">Histórico de transações</ThemedText>
        <Surface>
          {history.map((item) => (
            <ListRow
              key={item.id}
              title={item.metaDirection === 'retirada' ? 'Retirada' : 'Depósito'}
              subtitle={formatDate(item.date)}
              rightText={`${item.metaDirection === 'retirada' ? '-' : '+'}${formatCurrency(item.amount)}`}
              rightTextColor={(item.metaDirection === 'retirada' ? theme.danger : theme.success) as string}
            />
          ))}
          <ListRow
            title="Valor inicial"
            subtitle={formatDate(goal.startDate)}
            rightText={`+${formatCurrency(goal.initialAmount)}`}
            rightTextColor={theme.success as string}
          />
        </Surface>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  action: {
    flex: 1,
  },
});
