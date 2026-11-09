import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Screen } from "@/components/ui/screen";
import { Surface } from "@/components/ui/surface";
import { Spacing } from "@/constants/theme";
import { ApiError, useFinance } from "@/context/finance-context";
import type { InsightFeedback } from "@/data/types";
import { useTheme } from "@/hooks/use-theme";

const feedbackLabel: Record<InsightFeedback, string> = {
  util: "Útil",
  nao_util: "Não útil",
  irrelevante: "Irrelevante",
};

const typeIcon = {
  alerta_gasto: { ios: "exclamationmark.circle.fill", android: "warning" },
  sugestao: { ios: "lightbulb", android: "lightbulb" },
  padrao_detectado: { ios: "sparkles", android: "insights" },
} as const;

export default function InsightsScreen() {
  const { insights, refreshInsightsNow } = useFinance();
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState("");

  const runRefresh = useCallback(
    () =>
      refreshInsightsNow()
        .then(() => setError(""))
        .catch((err) =>
          setError(
            err instanceof ApiError
              ? err.message
              : "Não foi possível atualizar a análise agora.",
          ),
        )
        .finally(() => setRefreshing(false)),
    [refreshInsightsNow],
  );

  useEffect(() => {
    runRefresh();
  }, [runRefresh]);

  function refresh() {
    setRefreshing(true);
    runRefresh();
  }

  return (
    <Screen>
      <View style={styles.titleRow}>
        <ThemedText type="subtitle">Suas recomendações</ThemedText>
        {refreshing ? (
          <ActivityIndicator color={theme.primary as string} />
        ) : (
          <Pressable onPress={refresh} hitSlop={8} style={styles.refreshButton}>
            <IconSymbol
              ios="arrow.clockwise"
              android="refresh"
              size={16}
              color={theme.primary}
            />
            <ThemedText type="link" themeColor="primary">
              Atualizar
            </ThemedText>
          </Pressable>
        )}
      </View>
      {!!error && (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      )}

      <View style={styles.list}>
        {insights.length === 0 && !refreshing && (
          <ThemedText themeColor="textSecondary">
            Nenhuma recomendação por aqui ainda.
          </ThemedText>
        )}
        {insights.map((insight) => {
          const icon = typeIcon[insight.type];
          return (
            <Pressable
              key={insight.id}
              onPress={() => router.push(`/insights/${insight.id}`)}
            >
              <Surface>
                <View style={styles.cardHeader}>
                  <IconSymbol
                    ios={icon.ios}
                    android={icon.android}
                    size={16}
                    color={
                      insight.type === "alerta_gasto"
                        ? theme.danger
                        : theme.primary
                    }
                  />
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatType(insight.type)}
                  </ThemedText>
                </View>
                <ThemedText type="smallBold">{insight.description}</ThemedText>
                <Pressable
                  onPress={() => router.push(`/insights/${insight.id}`)}
                  style={[styles.feedbackButton, { borderColor: theme.border }]}
                >
                  <ThemedText type="small">
                    {insight.feedback
                      ? `Avaliada: ${feedbackLabel[insight.feedback]} · Alterar`
                      : "Avaliar"}
                  </ThemedText>
                </Pressable>
              </Surface>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

function formatType(type: "alerta_gasto" | "sugestao" | "padrao_detectado") {
  return {
    alerta_gasto: "Alerta de gasto",
    sugestao: "Sugestão",
    padrao_detectado: "Padrão detectado",
  }[type];
}

const styles = StyleSheet.create({
  titleRow: {
    alignItems: "flex-start",
    gap: Spacing.two,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  list: {
    gap: Spacing.three,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  feedbackButton: {
    marginTop: Spacing.one,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.one,
    alignItems: "center",
  },
});
