import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ListRow } from "@/components/ui/list-row";
import { Screen } from "@/components/ui/screen";
import { Surface } from "@/components/ui/surface";
import { ApiError, useFinance } from "@/context/finance-context";
import { useTheme } from "@/hooks/use-theme";
import { confirmAction, notify } from "@/utils/confirm";
import { cardKindLabel } from "@/utils/cards";
import { formatCurrency } from "@/utils/money";

export default function DesativadosScreen() {
  const {
    inactiveAccounts,
    inactiveCards,
    inactiveCategories,
    refreshInactive,
    reactivateAccount,
    reactivateCard,
    reactivateCategory,
    findAccount,
  } = useFinance();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      refreshInactive()
        .catch((err) =>
          notify(
            err instanceof ApiError
              ? err.message
              : "Não foi possível carregar os desativados.",
          ),
        )
        .finally(() => setLoading(false));
    }, [refreshInactive]),
  );

  async function run(key: string, action: () => Promise<void>) {
    setBusyId(key);
    try {
      await action();
    } catch (err) {
      notify(
        err instanceof ApiError
          ? err.message
          : "Não foi possível reativar. Tente novamente.",
      );
    } finally {
      setBusyId(null);
    }
  }

  function handleReactivateAccount(id: number, bank: string) {
    confirmAction(
      "Reativar conta",
      `Reativar a conta "${bank}"? Os cartões desativados junto com ela também voltam.`,
      "Reativar",
      () => run(`account-${id}`, () => reactivateAccount(id)),
    );
  }

  function handleReactivateCard(id: number, nickname: string) {
    confirmAction(
      "Reativar cartão",
      `Reativar o cartão "${nickname}"?`,
      "Reativar",
      () => run(`card-${id}`, () => reactivateCard(id)),
    );
  }

  function handleReactivateCategory(id: number, name: string) {
    confirmAction(
      "Reativar categoria",
      `Reativar a categoria "${name}"? Ela volta a aparecer nos lançamentos.`,
      "Reativar",
      () => run(`category-${id}`, () => reactivateCategory(id)),
    );
  }

  function reactivateButton(
    key: string,
    onPress: () => void,
    disabled = false,
  ) {
    if (busyId === key)
      return <ActivityIndicator color={theme.primary as string} />;
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || busyId !== null}
        hitSlop={8}
      >
        <ThemedText
          type="link"
          themeColor={disabled ? "textSecondary" : "primary"}
        >
          Reativar
        </ThemedText>
      </Pressable>
    );
  }

  if (
    loading &&
    inactiveAccounts.length === 0 &&
    inactiveCards.length === 0 &&
    inactiveCategories.length === 0
  ) {
    return (
      <Screen contentStyle={styles.centered}>
        <ActivityIndicator color={theme.primary as string} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ThemedText type="small" themeColor="textSecondary">
        Contas, cartões e categorias desativados ficam só para consulta. Para
        fazer qualquer ajuste, reative primeiro.
      </ThemedText>

      <Surface>
        <ThemedText type="smallBold">Contas desativadas</ThemedText>
        {inactiveAccounts.length === 0 && (
          <ThemedText type="small" themeColor="textSecondary">
            Nenhuma conta desativada.
          </ThemedText>
        )}
        {inactiveAccounts.map((account) => (
          <ListRow
            key={account.id}
            title={account.bank}
            subtitle={`Ag. ${account.agency} · Conta ${account.number} · ${formatCurrency(account.balance)}`}
            icon={{ ios: "building.columns", android: "account_balance" }}
            right={reactivateButton(`account-${account.id}`, () =>
              handleReactivateAccount(account.id, account.bank),
            )}
            onPress={() => router.push(`/conta/${account.id}`)}
          />
        ))}
      </Surface>

      <Surface>
        <ThemedText type="smallBold">Cartões desativados</ThemedText>
        {inactiveCards.length === 0 && (
          <ThemedText type="small" themeColor="textSecondary">
            Nenhum cartão desativado.
          </ThemedText>
        )}
        {inactiveCards.map((card) => {
          const account = findAccount(card.accountId);
          const accountInactive = !account || !account.active;
          const kind = cardKindLabel(card.kind);
          return (
            <ListRow
              key={card.id}
              title={card.nickname}
              subtitle={
                !account || !account.active
                  ? `${kind} · reative a conta${account ? ` ${account.bank}` : ""} primeiro`
                  : `${kind} · ${account.bank} · limite ${formatCurrency(card.limit)}`
              }
              icon={{ ios: "creditcard", android: "credit_card" }}
              right={reactivateButton(
                `card-${card.id}`,
                () => handleReactivateCard(card.id, card.nickname),
                accountInactive,
              )}
              onPress={() => router.push(`/cartao/${card.id}`)}
            />
          );
        })}
      </Surface>

      <Surface>
        <ThemedText type="smallBold">Categorias desativadas</ThemedText>
        {inactiveCategories.length === 0 && (
          <ThemedText type="small" themeColor="textSecondary">
            Nenhuma categoria desativada.
          </ThemedText>
        )}
        {inactiveCategories.map((category) => (
          <ListRow
            key={category.id}
            title={category.name}
            subtitle={category.kind === "income" ? "Entrada" : "Saída"}
            icon={{ ios: "square.grid.2x2", android: "apps" }}
            right={reactivateButton(`category-${category.id}`, () =>
              handleReactivateCategory(category.id, category.name),
            )}
          />
        ))}
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
