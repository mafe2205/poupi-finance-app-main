import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { ApiError, useFinance } from '@/context/finance-context';
import type { InsightFeedback } from '@/data/types';
import { notify } from '@/utils/confirm';

export default function InsightFeedbackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { insights, submitInsightFeedback } = useFinance();
  const [sending, setSending] = useState(false);

  const insight = insights.find((item) => item.id === Number(id));
  if (!insight) {
    return (
      <Screen>
        <ThemedText>Recomendação não encontrada.</ThemedText>
      </Screen>
    );
  }

  async function handleFeedback(feedback: InsightFeedback) {
    setSending(true);
    try {
      await submitInsightFeedback(insight!.id, feedback);
      router.back();
    } catch (err) {
      notify(
        err instanceof ApiError
          ? `Não foi possível salvar sua avaliação: ${err.message}`
          : 'Não foi possível salvar sua avaliação. Tente novamente.'
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen contentStyle={styles.content}>
      <ThemedText type="subtitle">Essa recomendação ajudou?</ThemedText>
      <ThemedText type="default" themeColor="textSecondary">
        {insight.description}
      </ThemedText>

      <View style={styles.buttons}>
        <Button label="Sim, foi útil" onPress={() => handleFeedback('util')} disabled={sending} />
        <Button label="Não foi útil" variant="ghost" onPress={() => handleFeedback('nao_util')} disabled={sending} />
        <Button label="Irrelevante" variant="ghost" onPress={() => handleFeedback('irrelevante')} disabled={sending} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
  },
  buttons: {
    gap: Spacing.two,
  },
});
