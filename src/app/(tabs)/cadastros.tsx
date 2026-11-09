import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ListRow } from "@/components/ui/list-row";
import { Screen } from "@/components/ui/screen";
import { Surface } from "@/components/ui/surface";
import { useFinance } from "@/context/finance-context";

export default function CadastrosScreen() {
  const { categories, fixedEntries } = useFinance();

  return (
    <Screen withTabInset>
      <ThemedText type="subtitle">Cadastros</ThemedText>
      <Surface>
        <ListRow
          title="Categorias"
          subtitle={`${categories.length} cadastradas`}
          icon={{ ios: "square.grid.2x2", android: "apps" }}
          showChevron
          onPress={() => router.push("/categoria")}
        />
        <ListRow
          title="Entradas e Saídas Fixas"
          subtitle={`${fixedEntries.length} cadastradas`}
          icon={{ ios: "repeat", android: "repeat" }}
          showChevron
          onPress={() => router.push("/entrada-fixa")}
        />
      </Surface>
    </Screen>
  );
}
