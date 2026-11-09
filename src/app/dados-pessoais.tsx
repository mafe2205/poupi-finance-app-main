import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { useFinance } from '@/context/finance-context';
import { formatDate } from '@/utils/date';
import { maskPhone } from '@/utils/masks';

export default function DadosPessoaisScreen() {
  const { user } = useFinance();

  if (!user) return null;

  return (
    <Screen>
      <Surface>
        <ListRow title="Nome" subtitle={`${user.name} ${user.surname}`} icon={{ ios: 'person', android: 'person' }} />
        <ListRow title="E-mail" subtitle={user.email} icon={{ ios: 'envelope', android: 'mail' }} />
        <ListRow title="Telefone" subtitle={user.phone ? maskPhone(user.phone) : '—'} icon={{ ios: 'phone', android: 'call' }} />
        <ListRow
          title="Data de nascimento"
          subtitle={user.birthDate ? formatDate(user.birthDate.slice(0, 10)) : '—'}
          icon={{ ios: 'calendar', android: 'calendar_month' }}
        />
      </Surface>

      <Button label="Editar dados" variant="secondary" onPress={() => router.push('/editar-perfil')} />
    </Screen>
  );
}
