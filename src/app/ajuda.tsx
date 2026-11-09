import { ThemedText } from '@/components/themed-text';
import { Collapsible } from '@/components/ui/collapsible';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';

const FAQ = [
  {
    question: 'Como lanço uma nova transação?',
    answer: 'Na tela Início, toque em "Nova transação". Escolha o tipo, a categoria, a forma de pagamento, o valor e a data, e toque em Salvar.',
  },
  {
    question: 'Posso cadastrar um gasto pela foto do comprovante?',
    answer: 'Sim. Na tela Início, toque em "Comprovante" e use a câmera ou a galeria. O app lê a nota e mostra os dados para você revisar antes de salvar.',
  },
  {
    question: 'Como funcionam as entradas e saídas fixas?',
    answer: 'São lançamentos que se repetem todo mês: entradas, como o salário, e saídas, como aluguel ou assinaturas. Cadastre-os na aba Cadastros > Entradas e Saídas Fixas, escolhendo o tipo, o dia do mês e por quantos meses gerar.',
  },
  {
    question: 'Desativei uma conta ou cartão. Consigo recuperar?',
    answer: 'Sim. Em Início, toque em "Ver contas desativadas" ou "Ver cartões desativados" e use o botão Reativar.',
  },
  {
    question: 'Esqueci minha senha. E agora?',
    answer: 'Entre em contato com o administrador do aplicativo para redefinir a senha. Se você lembra da senha atual, pode trocá-la em Perfil > Segurança.',
  },
  {
    question: 'O que são as recomendações?',
    answer: 'São observações geradas a partir dos seus lançamentos, como gastos acima do habitual em uma categoria. Você pode marcar cada recomendação como útil ou não útil para melhorar as próximas.',
  },
];

export default function AjudaScreen() {
  return (
    <Screen>
      <ThemedText type="small" themeColor="textSecondary">
        Perguntas frequentes sobre o uso do app.
      </ThemedText>

      <Surface>
        {FAQ.map((item) => (
          <Collapsible key={item.question} title={item.question}>
            <ThemedText type="small" themeColor="textSecondary">
              {item.answer}
            </ThemedText>
          </Collapsible>
        ))}
      </Surface>

      <Surface>
        <ThemedText type="smallBold">Ainda precisa de ajuda?</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Fale com o administrador do aplicativo e descreva o que aconteceu, em qual tela e, se possível, envie um print.
        </ThemedText>
      </Surface>
    </Screen>
  );
}
