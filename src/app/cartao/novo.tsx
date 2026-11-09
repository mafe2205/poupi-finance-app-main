import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { Spacing } from "@/constants/theme";
import { useFinance } from "@/context/finance-context";
import { cardKindLabel } from "@/utils/cards";
import { parseCurrencyInput } from "@/utils/money";

export default function NovoCartaoScreen() {
  const { accounts, addCard } = useFinance();
  const bankAccounts = accounts.filter((account) => !account.isDefault);
  const [accountId, setAccountId] = useState(String(bankAccounts[0]?.id ?? ""));
  const [nickname, setNickname] = useState("");
  const [kind, setKind] = useState<"credito" | "debito">("credito");
  const [limit, setLimit] = useState("0,00");
  const [closingDay, setClosingDay] = useState("10");
  const [dueDay, setDueDay] = useState("17");

  async function handleSubmit() {
    if (!accountId || !nickname) return;
    await addCard({
      accountId: Number(accountId),
      nickname,
      kind,
      limit: kind === "credito" ? parseCurrencyInput(limit) : 0,
      closingDay: Number(closingDay) || 1,
      dueDay: Number(dueDay) || 1,
    });
    router.back();
  }

  return (
    <Screen contentStyle={styles.content}>
      <SelectField
        label="Conta vinculada"
        value={accountId}
        placeholder={
          bankAccounts.length
            ? "Selecione a conta"
            : "Cadastre uma conta bancária primeiro"
        }
        options={bankAccounts.map((account) => ({
          label: account.bank,
          value: String(account.id),
        }))}
        onChange={setAccountId}
      />
      <TextField
        label="Apelido"
        placeholder="Cartão principal"
        value={nickname}
        onChangeText={setNickname}
      />
      <SelectField
        label="Tipo"
        value={kind}
        options={[
          { label: cardKindLabel("credito"), value: "credito" },
          { label: "Só débito", value: "debito" },
        ]}
        onChange={(value) => setKind(value as "credito" | "debito")}
      />
      {kind === "credito" && (
        <>
          <TextField
            label="Limite"
            value={limit}
            onChangeText={setLimit}
            mask="currency"
          />
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <TextField
                label="Fechamento (dia)"
                value={closingDay}
                onChangeText={setClosingDay}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.rowItem}>
              <TextField
                label="Vencimento (dia)"
                value={dueDay}
                onChangeText={setDueDay}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </>
      )}
      <Button
        label="Salvar"
        onPress={handleSubmit}
        disabled={!accountId || !nickname}
      />
      <Button label="Cancelar" variant="danger" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.three,
  },
  rowItem: {
    flex: 1,
  },
});
