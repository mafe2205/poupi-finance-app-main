import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { HeaderCloseButton } from '@/components/ui/header-close-button';
import { Colors } from '@/constants/theme';
import { FinanceProvider } from '@/context/finance-context';
import { AppThemeProvider } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

SplashScreen.preventAutoHideAsync();

function modal(title: string) {
  return {
    title,
    presentation: 'modal' as const,
    headerLeft: () => <HeaderCloseButton />,
  };
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootStack />
    </AppThemeProvider>
  );
}

function RootStack() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <FinanceProvider>
        <AnimatedSplashOverlay />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.text,
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
            contentStyle: { backgroundColor: theme.background },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="cadastro" options={{ headerShown: false }} />

          <Stack.Screen name="conta/novo" options={modal('Nova conta bancária')} />
          <Stack.Screen name="conta/[id]" options={{ title: 'Transações' }} />
          <Stack.Screen name="cartao/novo" options={modal('Novo cartão')} />
          <Stack.Screen name="cartao/[id]" options={{ title: 'Cartão' }} />
          <Stack.Screen name="categoria/index" options={{ title: 'Categorias' }} />
          <Stack.Screen name="categoria/novo" options={modal('Categoria')} />
          <Stack.Screen name="entrada-fixa/index" options={{ title: 'Entradas e Saídas Fixas' }} />
          <Stack.Screen name="entrada-fixa/novo" options={modal('Entrada ou Saída Fixa')} />
          <Stack.Screen name="transacao/novo" options={modal('Cadastro de Transações')} />
          <Stack.Screen name="transacao/[id]" options={{ title: 'Transação' }} />
          <Stack.Screen name="transacao/editar" options={modal('Editar transação')} />
          <Stack.Screen name="fatura/[id]" options={{ title: 'Fatura' }} />
          <Stack.Screen name="comprovante/novo" options={modal('Novo comprovante')} />
          <Stack.Screen name="comprovante/revisao" options={{ title: 'Revisão do OCR' }} />
          <Stack.Screen name="insights/index" options={{ title: 'Recomendações' }} />
          <Stack.Screen name="insights/[id]" options={{ title: 'Avaliar recomendação' }} />
          <Stack.Screen name="meta/[id]" options={{ title: 'Meta' }} />
          <Stack.Screen name="meta/novo" options={modal('Nova meta')} />
          <Stack.Screen name="notificacao/index" options={{ title: 'Notificações' }} />
          <Stack.Screen name="senha" options={modal('Alterar senha')} />
          <Stack.Screen name="desativados" options={{ title: 'Desativados' }} />
          <Stack.Screen name="relatorios" options={{ title: 'Relatórios' }} />
          <Stack.Screen name="dados-pessoais" options={{ title: 'Dados Pessoais' }} />
          <Stack.Screen name="editar-perfil" options={modal('Editar Perfil')} />
          <Stack.Screen name="ajuda" options={{ title: 'Ajuda e Suporte' }} />
          <Stack.Screen name="direitos" options={{ title: 'Direitos' }} />
        </Stack>
      </FinanceProvider>
    </ThemeProvider>
  );
}
