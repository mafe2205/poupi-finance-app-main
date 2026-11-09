import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';

const SECTIONS = [
  {
    title: 'Seus dados',
    body: 'O poupi guarda os dados que você informa no cadastro (nome, e-mail, telefone e data de nascimento) e os lançamentos financeiros que você registra: contas, cartões, transações, metas e comprovantes. Eles são usados apenas para o funcionamento do app.',
  },
  {
    title: 'Seus direitos (LGPD)',
    body: 'Pela Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode: confirmar se seus dados são tratados e acessá-los; corrigir dados incompletos ou desatualizados; pedir a eliminação dos dados; pedir a portabilidade para outro serviço; e revogar o consentimento a qualquer momento.',
  },
  {
    title: 'Como exercer',
    body: 'Você pode corrigir seus dados pessoais em Perfil > Editar Perfil. Para os demais pedidos, entre em contato com o administrador do aplicativo.',
  },
  {
    title: 'Segurança',
    body: 'Sua sessão é guardada de forma criptografada no aparelho e expira automaticamente. Nunca compartilhe sua senha.',
  },
];

export default function DireitosScreen() {
  return (
    <Screen>
      {SECTIONS.map((section) => (
        <Surface key={section.title}>
          <ThemedText type="smallBold">{section.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {section.body}
          </ThemedText>
        </Surface>
      ))}
    </Screen>
  );
}
