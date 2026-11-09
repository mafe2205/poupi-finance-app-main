import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { useFinance } from '@/context/finance-context';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/money';

export default function EntradasFixasScreen() {
  const { fixedEntries, getCategory } = useFinance();
  const theme = useTheme();

  const sections = [
    { kind: 'income' as const, title: 'Entradas fixas', empty: 'Nenhuma entrada fixa cadastrada.', color: theme.success },
    { kind: 'expense' as const, title: 'Saídas fixas', empty: 'Nenhuma saída fixa cadastrada.', color: theme.danger },
  ];

  return (
    <Screen>
      {sections.map((section) => {
        const entries = fixedEntries.filter((entry) => entry.kind === section.kind);
        return (
          <Surface key={section.kind}>
            <ThemedText type="smallBold">{section.title}</ThemedText>
            {entries.length === 0 && (
              <ThemedText type="small" themeColor="textSecondary">
                {section.empty}
              </ThemedText>
            )}
            {entries.map((entry) => (
              <ListRow
                key={entry.id}
                title={entry.description}
                subtitle={`${getCategory(entry.categoryId)?.name ?? ''} · todo dia ${new Date(entry.date).getDate()}`}
                rightText={formatCurrency(entry.amount)}
                rightTextColor={section.color as string}
                showChevron
                onPress={() => router.push({ pathname: '/entrada-fixa/novo', params: { id: entry.id } })}
              />
            ))}
          </Surface>
        );
      })}
      <Button label="Nova entrada ou saída fixa" onPress={() => router.push('/entrada-fixa/novo')} />
    </Screen>
  );
}
