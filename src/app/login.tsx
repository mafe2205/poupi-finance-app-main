import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PoupiLogo } from '@/components/poupi-logo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { ApiError, useFinance } from '@/context/finance-context';
import { useTheme } from '@/hooks/use-theme';
import { notify } from '@/utils/confirm';

export default function LoginScreen() {
  const { login } = useFinance();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!email || !password) return;
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace('/');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('E-mail/usuário ou senha incorretos.');
      } else {
        console.log(err);
        setError(err instanceof ApiError ? err.message : 'Não foi possível entrar. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen contentStyle={styles.centered}>
      <View style={styles.hero}>
        <ThemedView type="backgroundElement" style={styles.avatar}>
          <PoupiLogo size={130} color={theme.text} />
        </ThemedView>
        <ThemedText type="title" themeColor="primary" style={[styles.appName, styles.appNameSpacing]}>
          poupi
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary">
          Bem-vindo de volta
        </ThemedText>
      </View>

      <View style={styles.form}>
        <TextField
          label="E-mail ou usuário"
          placeholder="voce@email.com ou usuário"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label="Senha"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Pressable
          style={styles.forgotLink}
          onPress={() => notify('Entre em contato com o administrador do aplicativo para redefinir sua senha.')}>
          <ThemedText type="link" themeColor="primary">
            Esqueci a senha
          </ThemedText>
        </Pressable>

        {!!error && (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
        )}

        <Button label={submitting ? 'Entrando…' : 'Entrar'} onPress={handleSubmit} disabled={submitting} />

        <View style={styles.footerRow}>
          <ThemedText type="small" themeColor="textSecondary">
            Não tem conta?
          </ThemedText>
          <Pressable onPress={() => router.push('/cadastro')}>
            <ThemedText type="link" themeColor="primary">
              {' '}
              Cadastre-se
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: Spacing.six,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.half,
    marginBottom: Spacing.two,
  },
  avatar: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    textTransform: 'lowercase',
  },
  appNameSpacing: {
    marginTop: -Spacing.five,
  },
  form: {
    gap: Spacing.three,
  },
  forgotLink: {
    alignSelf: 'flex-end',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
