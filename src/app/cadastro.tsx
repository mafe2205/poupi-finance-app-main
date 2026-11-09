import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Screen } from '@/components/ui/screen';
import { DateField } from '@/components/ui/date-field';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { ApiError, useFinance } from '@/context/finance-context';
import { useTheme } from '@/hooks/use-theme';
import { toIsoDate } from '@/utils/date';
import { onlyDigits } from '@/utils/masks';

export default function CadastroUsuarioScreen() {
  const { register } = useFinance();
  const theme = useTheme();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = !!(name && surname && email && phone && username && birthDate && password);

  async function handleSubmit() {
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);
    try {
      await register({
        name,
        surname,
        email,
        phone: onlyDigits(phone),
        username,
        birthDate: toIsoDate(birthDate),
        password,
      });
      router.replace('/');
    } catch (err) {
      console.error(err);
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar a conta. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <IconSymbol ios="chevron.left" android="arrow_back" size={20} color={theme.text} />
        </Pressable>
        <ThemedText type="subtitle">Criar conta</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.form}>
        <TextField label="Nome" placeholder="Maria" value={name} onChangeText={setName} />
        <TextField label="Sobrenome" placeholder="Fernanda" value={surname} onChangeText={setSurname} />
        <TextField
          label="E-mail"
          placeholder="voce@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label="Telefone"
          placeholder="(11) 99999-9999"
          mask="phone"
          value={phone}
          onChangeText={setPhone}
        />
        <TextField
          label="Usuário"
          placeholder="maria"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <DateField label="Data de nascimento" placeholder="10/04/1999" value={birthDate} onChange={setBirthDate} maximumDate={new Date()} />
        <TextField label="Senha" placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} />

        {!!error && (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
        )}

        <Button label={submitting ? 'Criando…' : 'Criar conta'} onPress={handleSubmit} disabled={!canSubmit || submitting} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 20,
  },
  form: {
    gap: Spacing.three,
  },
});
