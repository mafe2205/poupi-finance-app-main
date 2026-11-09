import { router } from 'expo-router';
import { StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Spacing } from '@/constants/theme';
import { useFinance } from '@/context/finance-context';
import { useAppTheme } from '@/context/theme-context';
import { useTheme } from '@/hooks/use-theme';
import { confirmAction } from '@/utils/confirm';

export default function PerfilScreen() {
  const { user, logout, unreadNotificationsCount } = useFinance();
  const theme = useTheme();
  const { colorScheme, setColorScheme } = useAppTheme();

  if (!user) return null;

  function handleLogout() {
    confirmAction('Sair', 'Tem certeza que deseja sair do aplicativo?', 'Sair', async () => {
      await logout();
      router.replace('/login');
    });
  }

  return (
    <Screen withTabInset>
      <View style={styles.header}>
        <ThemedView type="backgroundElement" style={styles.avatar}>
          <IconSymbol ios="person.crop.circle.fill" android="person" size={56} color={theme.textSecondary} />
        </ThemedView>
        <ThemedText type="subtitle">
          {user.name} {user.surname}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {user.email}
        </ThemedText>
        <Button
          label="Editar Perfil"
          variant="primary"
          onPress={() => router.push('/editar-perfil')}
          style={styles.editButton}
        />
      </View>

      <Surface style={{ backgroundColor: theme.surfaceStrong, borderColor: theme.surfaceStrong }}>
        <ListRow
          onDark
          title="Dados Pessoais"
          icon={{ ios: 'person.text.rectangle', android: 'badge' }}
          showChevron
          onPress={() => router.push('/dados-pessoais')}
        />
        <ListRow
          onDark
          title="Relatórios"
          subtitle="Gastos, categorias e evolução"
          icon={{ ios: 'chart.pie', android: 'pie_chart' }}
          showChevron
          onPress={() => router.push('/relatorios')}
        />
        <ListRow
          onDark
          title="Notificações"
          subtitle={unreadNotificationsCount > 0 ? `${unreadNotificationsCount} não lidas` : undefined}
          icon={{ ios: 'bell.fill', android: 'notifications' }}
          showChevron
          onPress={() => router.push('/notificacao')}
        />
        <ListRow
          onDark
          title="Segurança"
          subtitle="Alterar senha"
          icon={{ ios: 'lock.shield.fill', android: 'security' }}
          showChevron
          onPress={() => router.push('/senha')}
        />
        <ListRow
          onDark
          title="Ajuda e Suporte"
          icon={{ ios: 'questionmark.circle.fill', android: 'help' }}
          showChevron
          onPress={() => router.push('/ajuda')}
        />
        <ListRow
          onDark
          title="Direitos"
          icon={{ ios: 'doc.text', android: 'description' }}
          showChevron
          onPress={() => router.push('/direitos')}
        />
        <ListRow
          onDark
          title="Modo escuro"
          icon={{ ios: 'moon.fill', android: 'dark_mode' }}
          right={
            <Switch
              value={colorScheme === 'dark'}
              onValueChange={(on) => setColorScheme(on ? 'dark' : 'light')}
              trackColor={{ true: theme.primary }}
            />
          }
        />
      </Surface>

      <Button label="Sair" variant="danger" onPress={handleLogout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  editButton: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.five,
  },
});
