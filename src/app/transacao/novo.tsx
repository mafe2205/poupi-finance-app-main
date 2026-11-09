import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { suggestCategory } from "@/api/categories";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { SelectField } from "@/components/ui/select-field";
import { DateField } from "@/components/ui/date-field";
import { TextField } from "@/components/ui/text-field";
import { Spacing } from "@/constants/theme";
import { useFinance } from "@/context/finance-context";
import type { Category, PaymentMethod } from "@/data/types";
import { useTheme } from "@/hooks/use-theme";
import { cardAccepts } from "@/utils/cards";
import { toIsoDate } from "@/utils/date";
import { parseCurrencyInput } from "@/utils/money";

function todayBr() {
  const [year, month, day] = new Date().toISOString().slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

const PAYMENT_METHOD_OPTIONS: { label: string; value: PaymentMethod }[] = [
  { label: "Cartão de crédito", value: "cartao_credito" },
  { label: "Cartão de débito", value: "cartao_debito" },
  { label: "Dinheiro", value: "dinheiro" },
  { label: "Pix", value: "pix" },
  { label: "Boleto", value: "boleto" },
];

const SUGGEST_DELAY_MS = 500;
const SUGGEST_MIN_LENGTH = 3;

type FormKind = "income" | "expense" | "goal";

export default function NovaTransacaoScreen() {
  const params = useLocalSearchParams<{ accountId?: string }>();
  const { accounts, cards, categories, goals, goalCategory, addTransaction } =
    useFinance();
  const theme = useTheme();

  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<FormKind>("expense");
  const [categoryId, setCategoryId] = useState("");
  const [goalId, setGoalId] = useState(String(goals[0]?.id ?? ""));
  const [metaDirection, setMetaDirection] = useState<"deposito" | "retirada">(
    "deposito",
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("dinheiro");
  const [accountId, setAccountId] = useState(
    params.accountId ?? String(accounts[0]?.id ?? ""),
  );
  const [cardId, setCardId] = useState("");
  const [parcels, setParcels] = useState("1");
  const [amount, setAmount] = useState("0,00");
  const [date, setDate] = useState(todayBr());
  const [submitting, setSubmitting] = useState(false);

  const [categoryTouched, setCategoryTouched] = useState(false);
  const [kindTouched, setKindTouched] = useState(false);
  const [suggestedId, setSuggestedId] = useState<number | null>(null);
  const [suggestionCandidates, setCandidates] = useState<{
    text: string;
    list: Category[];
  }>({ text: "", list: [] });
  const candidates =
    !categoryTouched && suggestionCandidates.text === description.trim()
      ? suggestionCandidates.list
      : [];

  useEffect(() => {
    const text = description.trim();
    if (categoryTouched || kind === "goal" || text.length < SUGGEST_MIN_LENGTH)
      return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const suggestion = await suggestCategory(text);
        if (cancelled) return;
        const usable = (category: Category | undefined): category is Category =>
          !!category && (!kindTouched || category.kind === kind);

        const suggested = categories.find(
          (c) => c.id === suggestion.categoryId,
        );
        if (usable(suggested)) {
          setKind(suggested.kind);
          setCategoryId(String(suggested.id));
          setSuggestedId(suggested.id);
          setCandidates({ text, list: [] });
          return;
        }
        setCandidates({
          text,
          list: suggestion.candidateCategoryIds
            .map((id) => categories.find((c) => c.id === id))
            .filter(usable),
        });
      } catch {}
    }, SUGGEST_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [description, categoryTouched, kindTouched, kind, categories]);

  function pickCategory(category: Category) {
    setKind(category.kind);
    setCategoryId(String(category.id));
    setCategoryTouched(true);
  }

  const isGoal = kind === "goal";
  const usesCard =
    paymentMethod === "cartao_credito" || paymentMethod === "cartao_debito";
  const cardOptions = cards
    .filter((card) => cardAccepts(card, paymentMethod))
    .map((card) => ({ label: card.nickname, value: String(card.id) }));

  const categoryOptions = categories
    .filter((category) => category.kind === kind)
    .map((category) => ({ label: category.name, value: String(category.id) }));

  const paymentOptions = isGoal
    ? PAYMENT_METHOD_OPTIONS.filter(
        (option) =>
          option.value !== "cartao_credito" && option.value !== "cartao_debito",
      )
    : PAYMENT_METHOD_OPTIONS;

  const canSubmit = isGoal
    ? !!description && !!goalId && !!goalCategory && !!accountId
    : !!description && !!categoryId && (usesCard ? !!cardId : !!accountId);

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await addTransaction({
        description,
        categoryId: isGoal ? goalCategory!.id : Number(categoryId),
        goalId: isGoal ? Number(goalId) : undefined,
        metaDirection: isGoal ? metaDirection : undefined,
        paymentMethod,
        amount: parseCurrencyInput(amount),
        date: toIsoDate(date),
        accountId: usesCard ? undefined : Number(accountId),
        cardId: usesCard ? Number(cardId) : undefined,
        parcels:
          paymentMethod === "cartao_credito" ? Number(parcels) || 1 : undefined,
      });
      router.back();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen contentStyle={styles.content}>
      <TextField
        label="Descrição"
        placeholder="Ex.: Supermercado"
        value={description}
        onChangeText={setDescription}
      />
      <SelectField
        label="Tipo"
        value={kind}
        options={[
          { label: "Saída", value: "expense" },
          { label: "Entrada", value: "income" },
          { label: "Meta (guardar ou retirar)", value: "goal" },
        ]}
        onChange={(value) => {
          const next = value as FormKind;
          setKind(next);
          setKindTouched(true);
          setCategoryId("");
          setSuggestedId(null);
          if (next === "goal" && usesCard) {
            setPaymentMethod("pix");
            setCardId("");
          }
        }}
      />
      {isGoal ? (
        <>
          <SelectField
            label="Meta"
            placeholder={
              goals.length ? "Selecione a meta" : "Cadastre uma meta primeiro"
            }
            value={goalId}
            options={goals.map((goal) => ({
              label: goal.description,
              value: String(goal.id),
            }))}
            onChange={setGoalId}
          />
          <SelectField
            label="Movimento"
            value={metaDirection}
            options={[
              { label: "Guardar na meta (sai da conta)", value: "deposito" },
              {
                label: "Retirar da meta (volta para a conta)",
                value: "retirada",
              },
            ]}
            onChange={(value) =>
              setMetaDirection(value as "deposito" | "retirada")
            }
          />
        </>
      ) : (
        <View style={styles.categoryBlock}>
          <SelectField
            label="Categoria"
            placeholder="Selecione a categoria"
            value={categoryId}
            options={categoryOptions}
            onChange={(value) => {
              setCategoryId(value);
              setCategoryTouched(true);
            }}
          />
          {!categoryTouched &&
            suggestedId != null &&
            categoryId === String(suggestedId) && (
              <ThemedText type="small" themeColor="textSecondary">
                Sugerida pela descrição. Você pode trocar se quiser.
              </ThemedText>
            )}
          {candidates.length > 0 && (
            <View style={styles.candidates}>
              <ThemedText type="small" themeColor="textSecondary">
                Pode ser:
              </ThemedText>
              {candidates.map((category) => (
                <Pressable
                  key={category.id}
                  onPress={() => pickCategory(category)}
                  style={[styles.candidateChip, { borderColor: theme.border }]}
                >
                  <ThemedText type="small">{category.name}</ThemedText>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}
      <SelectField
        label="Forma de Pagamento"
        value={paymentMethod}
        options={paymentOptions}
        onChange={(value) => {
          setPaymentMethod(value as PaymentMethod);
          setCardId("");
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
          options={accounts.map((account) => ({
            label: account.bank,
            value: String(account.id),
          }))}
          onChange={setAccountId}
        />
      )}
      {paymentMethod === "cartao_credito" && (
        <TextField
          label="Parcelas"
          value={parcels}
          onChangeText={setParcels}
          keyboardType="number-pad"
        />
      )}
      <TextField
        label="Valor"
        value={amount}
        onChangeText={setAmount}
        mask="currency"
      />
      <DateField label="Data" value={date} onChange={setDate} />
      <Button
        label={submitting ? "Salvando…" : "Salvar"}
        onPress={handleSubmit}
        disabled={!canSubmit || submitting}
      />
      <Button label="Cancelar" variant="danger" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
  },
  categoryBlock: {
    gap: Spacing.one,
  },
  candidates: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: Spacing.one,
  },
  candidateChip: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
});
