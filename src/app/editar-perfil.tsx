import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { ApiError, useFinance } from '@/context/finance-context';
import { formatDate, toIsoDate } from '@/utils/date';
import { notify } from '@/utils/confirm';
import { maskPhone, onlyDigits } from '@/utils/masks';

export default function EditarPerfilScreen() {
  const { user, updateProfile } = useFinance();
  const [name, setName] = useState(user?.name ?? '');
  const [surname, setSurname] = useState(user?.surname ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(maskPhone(user?.phone ?? ''));
  const [birthDate, setBirthDate] = useState(user?.birthDate ? formatDate(user.birthDate.slice(0, 10)) : '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const canSubmit = !!(name.trim() && surname.trim() && email.trim() && birthDate);

  async function handleSubmit() {
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);
    try {
      await updateProfile({
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim(),
        phone: onlyDigits(phone),
        birthDate: toIsoDate(birthDate),
      });
      notify('Perfil atualizado.');
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen contentStyle={styles.content}>
      <TextField label="Nome" value={name} onChangeText={setName} />
      <TextField label="Sobrenome" value={surname} onChangeText={setSurname} />
      <TextField
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextField label="Telefone" placeholder="(11) 99999-9999" value={phone} onChangeText={setPhone} mask="phone" />
      <DateField label="Data de nascimento" value={birthDate} onChange={setBirthDate} maximumDate={new Date()} />

      {!!error && (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      )}

      <Button
        label={submitting ? 'Salvando…' : 'Salvar'}
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
