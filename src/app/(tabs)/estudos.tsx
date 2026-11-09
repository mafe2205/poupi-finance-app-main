import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { AndroidSymbol } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';

const articles: { ios: SFSymbol; android: AndroidSymbol; title: string; body: string }[] = [
  {
    ios: 'banknote',
    android: 'payments',
    title: 'Reserva de emergência',
    body: 'Guarde de 3 a 6 meses dos seus gastos essenciais para imprevistos.',
  },
  {
    ios: 'chart.pie',
    android: 'pie_chart',
    title: 'Regra 50-30-20',
    body: '50% para necessidades, 30% para desejos e 20% para investimentos e metas.',
  },
  {
    ios: 'creditcard',
    android: 'credit_card',
    title: 'Cartão de crédito consciente',
    body: 'Pague sempre o valor total da fatura para evitar juros rotativos.',
  },
  {
    ios: 'chart.line.uptrend.xyaxis',
    android: 'trending_up',
    title: 'Comece a investir',
    body: 'Entenda renda fixa e variável antes de escolher onde alocar seu dinheiro.',
  },
];

const channels = [
  { name: 'Me Poupe!', description: 'Educação financeira do básico ao investimento, com Nathalia Arcuri.' },
  { name: 'O Primo Rico', description: 'Independência financeira e investimentos, com Thiago Nigro.' },
  { name: 'Nath Finanças', description: 'Organização do orçamento e primeiros passos para investir.' },
  { name: 'Bruno Perini', description: 'Investimentos explicados de forma simples e prática.' },
];

const books = [
  { title: 'Pai Rico, Pai Pobre', author: 'Robert Kiyosaki', description: 'Mentalidade sobre dinheiro, ativos e passivos.' },
  { title: 'O Homem Mais Rico da Babilônia', author: 'George S. Clason', description: 'Lições clássicas de poupança em forma de parábolas.' },
  { title: 'Os Segredos da Mente Milionária', author: 'T. Harv Eker', description: 'Como crenças sobre dinheiro moldam seus resultados.' },
  { title: 'A Psicologia Financeira', author: 'Morgan Housel', description: 'Como comportamento pesa mais que conhecimento técnico.' },
  { title: 'Casais Inteligentes Enriquecem Juntos', author: 'Gustavo Cerbasi', description: 'Planejamento financeiro a dois.' },
];

const podcasts = [
  { name: 'Primocast', description: 'Conversas sobre investimentos, carreira e empreendedorismo.' },
  { name: 'Stock Pickers', description: 'Mercado de ações e análise de empresas com gestores e analistas.' },
  { name: 'Market Makers', description: 'Economia e mercado financeiro em entrevistas longas.' },
  { name: 'Me Poupe!', description: 'Educação financeira prática para o dia a dia.' },
];

function searchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function podcastUrl(query: string) {
  return `https://open.spotify.com/search/${encodeURIComponent(`${query} podcast`)}`;
}

export default function EstudosScreen() {
  const theme = useTheme();

  return (
    <Screen withTabInset>
      <ThemedText type="subtitle">Estudos</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Conteúdos rápidos para melhorar sua relação com o dinheiro.
      </ThemedText>

      <View style={styles.list}>
        {articles.map((article) => (
          <Surface key={article.title} style={[styles.card, { backgroundColor: theme.backgroundSelected }]}>
            <View style={[styles.iconWrap, { backgroundColor: theme.backgroundElement }]}>
              <IconSymbol ios={article.ios} android={article.android} size={20} color={theme.primary} />
            </View>
            <View style={styles.cardText}>
              <ThemedText type="smallBold">{article.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {article.body}
              </ThemedText>
            </View>
          </Surface>
        ))}
      </View>

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Canais do YouTube
      </ThemedText>
      <View style={styles.list}>
        {channels.map((channel) => (
          <Pressable
            key={channel.name}
            onPress={() => Linking.openURL(searchUrl(channel.name))}
            style={({ pressed }) => pressed && styles.pressed}>
            <Surface style={[styles.card, { backgroundColor: theme.backgroundSelected }]}>
              <View style={[styles.iconWrap, { backgroundColor: theme.backgroundElement }]}>
                <IconSymbol ios="play.rectangle" android="smart_display" size={20} color={theme.primary} />
              </View>
              <View style={styles.cardText}>
                <ThemedText type="smallBold">{channel.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {channel.description}
                </ThemedText>
              </View>
            </Surface>
          </Pressable>
        ))}
      </View>

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Podcasts
      </ThemedText>
      <View style={styles.list}>
        {podcasts.map((podcast) => (
          <Pressable
            key={podcast.name}
            accessibilityRole="link"
            onPress={() => Linking.openURL(podcastUrl(podcast.name))}
            style={({ pressed }) => pressed && styles.pressed}>
            <Surface style={[styles.card, { backgroundColor: theme.backgroundSelected }]}>
              <View style={[styles.iconWrap, { backgroundColor: theme.backgroundElement }]}>
                <IconSymbol ios="headphones" android="headphones" size={20} color={theme.primary} />
              </View>
              <View style={styles.cardText}>
                <ThemedText type="smallBold">{podcast.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {podcast.description}
                </ThemedText>
              </View>
            </Surface>
          </Pressable>
        ))}
      </View>

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Livros
      </ThemedText>
      <View style={styles.list}>
        {books.map((book) => (
          <Surface key={book.title} style={[styles.card, { backgroundColor: theme.backgroundSelected }]}>
            <View style={[styles.iconWrap, { backgroundColor: theme.backgroundElement }]}>
              <IconSymbol ios="book" android="menu_book" size={20} color={theme.primary} />
            </View>
            <View style={styles.cardText}>
              <ThemedText type="smallBold">{book.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {book.author}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {book.description}
              </ThemedText>
            </View>
          </Surface>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
  card: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 28,
    marginTop: Spacing.two,
  },
});
