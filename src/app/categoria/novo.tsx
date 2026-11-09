import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button } from '@/components/ui/button';
import { CheckboxRow } from '@/components/ui/checkbox-row';
import { Screen } from '@/components/ui/screen';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useFinance } from '@/context/finance-context';
import { confirmAction, notify } from '@/utils/confirm';
import { parseCurrencyInput, toCurrencyInput } from '@/utils/money';

export default function NovaCategoriaScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { addCategory, updateCategory, deleteCategory, getCategory } = useFinance();
  const existing = id ? getCategory(Number(id)) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [kind, setKind] = useState<'expense' | 'income'>(existing?.kind ?? 'expense');
  const [limit, setLimit] = useState(existing?.limit ? toCurrencyInput(existing.limit) : '');
  const [hideFromMenu, setHideFromMenu] = useState(false);

  async function handleSubmit() {
    if (!name) return;
    const parsedLimit = parseCurrencyInput(limit);
    const data = {
      name,
      kind,
      limit: parsedLimit > 0 ? parsedLimit : undefined,
    };
    if (existing) await updateCategory(existing.id, data);
    else await addCategory(data);
    router.back();
  }

  function handleDeactivate() {
    if (!existing) return;
    confirmAction(
      'Desativar categoria',
      `Desativar a categoria "${existing.name}"? Ela some dos lançamentos novos, mas as transações que já usam ela continuam no histórico. Você pode reativar em Desativados.`,
      'Desativar',
      async () => {
        if (await deleteCategory(existing.id)) router.back();
        else notify('Não foi possível desativar essa categoria. Tente novamente.');
      }
    );
  }

  return (
    <Screen contentStyle={styles.content}>
      <TextField label="Nome" placeholder="Ex.: Lazer" value={name} onChangeText={setName} />
      <SelectField
        label="Tipo"
        value={kind}
        options={[
          { label: 'Saída', value: 'expense' },
          { label: 'Entrada', value: 'income' },
        ]}
        onChange={(value) => setKind(value as 'expense' | 'income')}
      />
      <TextField
        label="Limite mensal (opcional)"
        placeholder="0,00"
        value={limit}
        onChangeText={setLimit}
        mask="currency"
      />
      {!existing && (
        <CheckboxRow
          label="Ocultar do menu rápido"
          helperText="Marque se não quiser ver essa categoria com destaque ao cadastrar transações."
          checked={hideFromMenu}
          onToggle={setHideFromMenu}
        />
      )}
      <Button label="Salvar" onPress={handleSubmit} disabled={!name} />
      {existing && <Button label="Desativar categoria" variant="danger" onPress={handleDeactivate} />}
      <Button label="Cancelar" variant="danger" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
  },
});
