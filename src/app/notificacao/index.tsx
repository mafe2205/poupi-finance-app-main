import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Spacing } from '@/constants/theme';
import { useFinance } from '@/context/finance-context';
import { useTheme } from '@/hooks/use-theme';

const typeIcon = {
  insight_generated: { ios: 'lightbulb', android: 'lightbulb' },
  invoice_due: { ios: 'doc.text', android: 'description' },
  goal_reached: { ios: 'target', android: 'track_changes' },
} as const;

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function NotificacoesScreen() {
  const { notifications, markNotificationRead } = useFinance();
  const theme = useTheme();

  return (
    <Screen>
      <Surface>
        {notifications.length === 0 && (
          <ThemedText themeColor="textSecondary">Nenhuma notificação por aqui ainda.</ThemedText>
        )}
        {notifications.map((notification, index) => {
          const icon = typeIcon[notification.type];
          const unread = !notification.readAt;
          return (
            <Pressable
              key={notification.id}
              accessibilityRole="button"
              accessibilityLabel={`${unread ? 'Não lida. ' : ''}${notification.title}`}
              onPress={() => unread && markNotificationRead(notification.id)}
              style={({ pressed }) => [
                styles.item,
                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
                pressed && styles.pressed,
              ]}>
              <View style={styles.titleRow}>
                <IconSymbol ios={icon.ios} android={icon.android} size={18} color={theme.text} />
                <ThemedText type="smallBold" style={styles.title}>
                  {notification.title}
                </ThemedText>
                {unread && <View style={[styles.dot, { backgroundColor: theme.primary }]} />}
              </View>
              <ThemedText type="small">{notification.message}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatDateTime(notification.createdAt)}
              </ThemedText>
            </Pressable>
          );
        })}
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: {
    gap: Spacing.one,
    paddingVertical: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pressed: {
    opacity: 0.6,
  },
});
