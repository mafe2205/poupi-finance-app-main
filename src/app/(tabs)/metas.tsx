import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Spacing } from '@/constants/theme';
import { useFinance } from '@/context/finance-context';
import { formatCurrency } from '@/utils/money';
import { formatDate } from '@/utils/date';

export default function MetasScreen() {
  const { goals } = useFinance();
  const totalAcumulado = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);

  return (
    <Screen withTabInset>
      <View>
        <ThemedText type="small" themeColor="textSecondary">
          Saldo Acumulado
        </ThemedText>
        <ThemedText type="title" style={styles.total}>
          {formatCurrency(totalAcumulado)}
        </ThemedText>
      </View>

      <Button label="+ Criar Meta" onPress={() => router.push('/meta/novo')} />

      <View style={styles.list}>
        {goals.map((goal) => {
          const progress = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
          return (
            <Pressable
              key={goal.id}
              onPress={() => router.push({ pathname: '/meta/[id]', params: { id: goal.id } })}
              style={({ pressed }) => pressed && styles.pressed}>
            <Surface>
              <View style={styles.goalHeader}>
                <ThemedText type="smallBold">{goal.description}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {Math.round(progress * 100)}%
                </ThemedText>
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
              </ThemedText>
              <ProgressBar progress={progress} />
              <ThemedText type="small" themeColor="textSecondary">
                {formatDate(goal.startDate)} — {formatDate(goal.endDate)}
              </ThemedText>
            </Surface>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  total: {
    fontSize: 34,
    lineHeight: 40,
  },
  list: {
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
