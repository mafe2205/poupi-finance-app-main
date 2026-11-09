import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { useFinance } from '@/context/finance-context';
import type { Category } from '@/data/types';
import { formatCurrency } from '@/utils/money';

const SECTIONS = [
  { kind: 'income' as const, title: 'Categorias de entrada', empty: 'Nenhuma categoria de entrada cadastrada.' },
  { kind: 'expense' as const, title: 'Categorias de saída', empty: 'Nenhuma categoria de saída cadastrada.' },
];

export default function CategoriasScreen() {
  const { categories } = useFinance();

  function renderRow(category: Category) {
    return (
      <ListRow
        key={category.id}
        title={category.name}
        subtitle={category.limit ? `Limite ${formatCurrency(category.limit)}` : undefined}
        icon={{ ios: 'square.grid.2x2', android: 'apps' }}
        showChevron
        onPress={() => router.push({ pathname: '/categoria/novo', params: { id: category.id } })}
      />
    );
  }

  return (
    <Screen>
      {SECTIONS.map((section) => {
        const items = categories.filter((category) => category.kind === section.kind);
        return (
          <Surface key={section.kind}>
            <ThemedText type="smallBold">{section.title}</ThemedText>
            {items.length === 0 && (
              <ThemedText type="small" themeColor="textSecondary">
                {section.empty}
              </ThemedText>
            )}
            {items.map(renderRow)}
          </Surface>
        );
      })}
      <Button label="Nova categoria" onPress={() => router.push('/categoria/novo')} />
      <Button label="Ver categorias desativadas" variant="ghost" onPress={() => router.push('/desativados')} />
    </Screen>
  );
}
