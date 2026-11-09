import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ListRow } from "@/components/ui/list-row";
import { Screen } from "@/components/ui/screen";
import { Surface } from "@/components/ui/surface";
import { Spacing } from "@/constants/theme";
import { useFinance } from "@/context/finance-context";
import { useTheme } from "@/hooks/use-theme";
import { cardKindLabel } from "@/utils/cards";
import { formatMonthLabel } from "@/utils/date";
import { invoiceAmountLabel } from "@/utils/invoices";
import { formatCurrency } from "@/utils/money";
import type { AndroidSymbol } from "expo-symbols";
import type { SFSymbol } from "sf-symbols-typescript";

type Segment = "contas" | "cartoes" | "faturas";

const invoiceTone = {
  aberta: "primary",
  fechada: "warning",
  paga: "success",
  atrasada: "danger",
} as const;
const invoiceLabel = {
  aberta: "Aberta",
  fechada: "Fechada",
  paga: "Paga",
  atrasada: "Atrasada",
} as const;

export default function InicioScreen() {
  const { user, accounts, cards, invoices, getCard, totalPatrimonio } =
    useFinance();
  const theme = useTheme();
  const [segment, setSegment] = useState<Segment>("contas");

  if (!user) return null;

  return (
    <Screen withTabInset>
      <View style={styles.headerRow}>
        <ThemedText type="subtitle">Olá, {user.name}</ThemedText>
      </View>

      <View>
        <ThemedText type="small" themeColor="textSecondary">
          Patrimônio total
        </ThemedText>
        <ThemedText type="title" style={styles.total}>
          {formatCurrency(totalPatrimonio())}
        </ThemedText>
      </View>

      <View style={styles.quickActions}>
        <QuickAction
          ios="plus.circle"
          android="add_circle"
          label="Nova transação"
          onPress={() => router.push("/transacao/novo")}
        />
        <QuickAction
          ios="doc.text.viewfinder"
          android="document_scanner"
          label="Comprovante"
          onPress={() => router.push("/comprovante/novo")}
        />
        <QuickAction
          ios="lightbulb"
          android="lightbulb"
          label="Recomendações"
          onPress={() => router.push("/insights")}
        />
      </View>

      <View style={styles.segmentRow}>
        {(["contas", "cartoes", "faturas"] as const).map((item) => (
          <Pressable
            key={item}
            onPress={() => setSegment(item)}
            accessibilityRole="tab"
            accessibilityState={{ selected: segment === item }}
            style={[
              styles.segmentButton,
              segment === item
                ? { backgroundColor: theme.primary, borderColor: theme.primary }
                : {
                    backgroundColor: theme.surfaceMuted,
                    borderColor: theme.border,
                  },
            ]}
          >
            <ThemedText
              type="smallBold"
              style={{ color: segment === item ? theme.onPrimary : theme.text }}
            >
              {
                { contas: "Contas", cartoes: "Cartões", faturas: "Faturas" }[
                  item
                ]
              }
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {segment === "contas" && (
        <Surface style={{ backgroundColor: theme.surfaceSubtle }}>
          <ThemedText type="smallBold" style={styles.boxTitle}>
            Suas contas
          </ThemedText>
          {accounts.map((account) => (
            <ListRow
              key={account.id}
              title={account.bank}
              // A Carteira (conta padrão criada no cadastro) não tem agência nem número.
              subtitle={
                account.isDefault
                  ? undefined
                  : `Ag. ${account.agency} · Conta ${account.number}`
              }
              icon={
                account.isDefault
                  ? { ios: "wallet.bifold", android: "account_balance_wallet" }
                  : { ios: "building.columns", android: "account_balance" }
              }
              rightText={formatCurrency(account.balance)}
              onPress={() => router.push(`/conta/${account.id}`)}
            />
          ))}
          <Pressable
            onPress={() => router.push("/conta/novo")}
            style={[
              styles.addRow,
              { backgroundColor: theme.backgroundSelected },
            ]}
          >
            <IconSymbol
              ios="plus"
              android="add"
              size={16}
              color={theme.primary}
            />
            <ThemedText type="link" themeColor="primary">
              Nova conta bancária
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => router.push("/desativados")}
            style={[styles.addRow, { backgroundColor: theme.surfaceMuted }]}
          >
            <IconSymbol
              ios="archivebox"
              android="inventory_2"
              size={16}
              color={theme.textSecondary}
            />
            <ThemedText type="small" themeColor="textSecondary">
              Ver contas desativadas
            </ThemedText>
          </Pressable>
        </Surface>
      )}

      {segment === "cartoes" && (
        <Surface style={{ backgroundColor: theme.surfaceSubtle }}>
          <ThemedText type="smallBold" style={styles.boxTitle}>
            Seus cartões
          </ThemedText>
          {cards.map((card) => (
            <ListRow
              key={card.id}
              title={card.nickname}
              subtitle={
                card.kind === "credito"
                  ? `${cardKindLabel(card.kind)} · limite ${formatCurrency(card.limit)}`
                  : cardKindLabel(card.kind)
              }
              icon={{ ios: "creditcard", android: "credit_card" }}
              showChevron
              onPress={() => router.push(`/cartao/${card.id}`)}
            />
          ))}
          <Pressable
            onPress={() => router.push("/cartao/novo")}
            style={[
              styles.addRow,
              { backgroundColor: theme.backgroundSelected },
            ]}
          >
            <IconSymbol
              ios="plus"
              android="add"
              size={16}
              color={theme.primary}
            />
            <ThemedText type="link" themeColor="primary">
              Novo cartão
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => router.push("/desativados")}
            style={[styles.addRow, { backgroundColor: theme.surfaceMuted }]}
          >
            <IconSymbol
              ios="archivebox"
              android="inventory_2"
              size={16}
              color={theme.textSecondary}
            />
            <ThemedText type="small" themeColor="textSecondary">
              Ver cartões desativados
            </ThemedText>
          </Pressable>
        </Surface>
      )}

      {segment === "faturas" && (
        <Surface style={{ backgroundColor: theme.surfaceSubtle }}>
          <ThemedText type="smallBold" style={styles.boxTitle}>
            Suas faturas
          </ThemedText>
          {invoices.map((invoice) => {
            const card = getCard(invoice.cardId);
            return (
              <ListRow
                key={invoice.id}
                title={`Fatura · ${formatMonthLabel(invoice.monthReference)}`}
                subtitle={[card?.nickname, invoiceAmountLabel(invoice)]
                  .filter(Boolean)
                  .join(" · ")}
                icon={{ ios: "doc.text", android: "description" }}
                right={
                  <Badge
                    label={invoiceLabel[invoice.status]}
                    tone={invoiceTone[invoice.status]}
                  />
                }
                onPress={() => router.push(`/fatura/${invoice.id}`)}
              />
            );
          })}
          {invoices.length === 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              Nenhuma fatura por aqui ainda.
            </ThemedText>
          )}
          {__DEV__ && (
            <ListRow
              title="Fatura de exemplo (mock)"
              subtitle="Só em desenvolvimento"
              icon={{ ios: "doc.text", android: "description" }}
              right={<Badge label="Aberta" tone="primary" />}
              onPress={() => router.push("/fatura/mock")}
            />
          )}
        </Surface>
      )}
    </Screen>
  );
}

function QuickAction({
  ios,
  android,
  label,
  onPress,
}: {
  ios: SFSymbol;
  android: AndroidSymbol;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickActionButton,
        { backgroundColor: theme.backgroundSelected },
        pressed && styles.quickActionPressed,
      ]}
    >
      <View
        style={[
          styles.quickActionIcon,
          { backgroundColor: theme.backgroundElement },
        ]}
      >
        <IconSymbol
          ios={ios}
          android={android}
          size={20}
          color={theme.primary}
        />
      </View>
      <ThemedText type="small" style={styles.quickActionLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  total: {
    fontSize: 34,
    lineHeight: 40,
  },
  boxTitle: {
    fontSize: 20,
    lineHeight: 26,
    marginBottom: Spacing.one,
  },
  segmentRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    borderWidth: 1,
    alignItems: "center",
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    marginTop: Spacing.one,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  quickActionButton: {
    alignItems: "center",
    gap: Spacing.one,
    flex: 1,
    borderRadius: Spacing.four,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.one,
  },
  quickActionPressed: {
    opacity: 0.7,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    textAlign: "center",
  },
});
