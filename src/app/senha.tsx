import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";

import * as authApi from "@/api/auth";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { TextField } from "@/components/ui/text-field";
import { Spacing } from "@/constants/theme";
import { ApiError } from "@/context/finance-context";
import { confirmAction, notify } from "@/utils/confirm";

const MIN_LENGTH = 6;

export default function AlterarSenhaScreen() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = !!(currentPassword && newPassword && confirmation);

  async function handleSubmit() {
    if (!canSubmit) return;
    if (newPassword.length < MIN_LENGTH) {
      setError(`A nova senha precisa ter pelo menos ${MIN_LENGTH} caracteres.`);
      return;
    }
    if (newPassword !== confirmation) {
      setError("A confirmação não confere com a nova senha.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("A nova senha deve ser diferente da atual.");
      return;
    }

    setError("");
    confirmAction(
      "Alterar senha",
      "Tem certeza que deseja alterar a sua senha?",
      "Alterar",
      changePassword,
    );
  }

  async function changePassword() {
    setSubmitting(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      notify("Senha alterada com sucesso.");
      router.back();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível alterar a senha. Tente novamente.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen contentStyle={styles.content}>
      <TextField
        label="Senha atual"
        placeholder="••••••••"
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrentPassword}
      />
      <TextField
        label="Nova senha"
        placeholder="••••••••"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextField
        label="Confirmar nova senha"
        placeholder="••••••••"
        secureTextEntry
        value={confirmation}
        onChangeText={setConfirmation}
      />

      {!!error && (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      )}

      <Button
        label={submitting ? "Salvando…" : "Alterar senha"}
        onPress={handleSubmit}
        disabled={!canSubmit || submitting}
      />
      <Button label="Cancelar" variant="danger" onPress={() => router.back()} disabled={submitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
  },
});
