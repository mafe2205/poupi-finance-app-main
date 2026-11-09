# Poupi — App de Finanças

Aplicativo mobile de finanças pessoais feito com [Expo](https://expo.dev) (SDK 58), React Native e [Expo Router](https://docs.expo.dev/router/introduction) (rotas baseadas em arquivos).

Funcionalidades: contas, cartões e faturas, transações, categorias, entradas fixas, metas, relatórios, insights, leitura de comprovantes (câmera/galeria) e notificações.

## Pré-requisitos

- [Node.js](https://nodejs.org/) LTS (o projeto foi configurado com Node 22) e npm
- A **API do Poupi (backend)** rodando — o app não funciona sem ela (login, contas, transações etc. vêm da API)
- Para testar no celular: o app [Expo Go](https://expo.dev/go) compatível com o SDK 58, ou um [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- Opcional: Android Studio (emulador Android) ou Xcode (simulador iOS, só no macOS)

## Como rodar

### 1. Instalar as dependências

```bash
npm install
```

### 2. Configurar o endereço da API

Por padrão o app chama a API em `http://localhost:5027`. Para usar outro endereço, crie um arquivo `.env` na raiz do projeto:

```env
EXPO_PUBLIC_API_URL=http://localhost:5027
```

Qual endereço usar depende de onde o app vai rodar:

| Onde o app roda          | Valor de `EXPO_PUBLIC_API_URL`                       |
| ------------------------ | ---------------------------------------------------- |
| Navegador (web)          | `http://localhost:5027`                              |
| Simulador iOS            | `http://localhost:5027`                              |
| Emulador Android         | `http://10.0.2.2:5027`                               |
| Celular físico (Expo Go) | `http://<IP-do-seu-computador>:5027` (ex.: `http://192.168.0.10:5027`) |

> No celular físico, o computador e o celular precisam estar na mesma rede Wi-Fi, e a API precisa aceitar conexões externas (não só `localhost`).
> Sempre que alterar o `.env`, pare o servidor e rode `npx expo start --clear`.

### 3. Iniciar o app

```bash
npm start
```

No terminal aparece um QR Code e um menu. Você pode:

- escanear o QR Code com o **Expo Go** (Android) ou com a câmera (iOS)
- apertar `a` para abrir no emulador Android
- apertar `i` para abrir no simulador iOS
- apertar `w` para abrir no navegador

Atalhos equivalentes:

```bash
npm run android   # abre no emulador Android
npm run ios       # abre no simulador iOS
npm run web       # abre no navegador
```

## Scripts

| Comando                 | O que faz                                                    |
| ----------------------- | ------------------------------------------------------------ |
| `npm start`             | Inicia o servidor de desenvolvimento do Expo                 |
| `npm run android`       | Inicia e abre no Android                                     |
| `npm run ios`           | Inicia e abre no iOS                                         |
| `npm run web`           | Inicia e abre no navegador                                   |
| `npm run lint`          | Roda o ESLint                                                |
| `npm run reset-project` | ⚠️ **Não use.** Move todo o código de `src/` para `example/` e deixa o app em branco (script do template do Expo) |

## Estrutura do projeto

```
src/
  app/          telas e rotas (Expo Router) — ex.: app/(tabs)/index.tsx é a tela inicial
  api/          chamadas à API (client.ts define a URL base)
  components/   componentes reutilizáveis (UI e gráficos)
  context/      contextos React (finanças, tema)
  hooks/        hooks
  utils/        funções auxiliares (datas, máscaras, dinheiro, notificações)
  data/         tipos e dados de exemplo
assets/         ícones, splash e imagens
```

## Observações

- **Dados de exemplo:** os relatórios usam dados simulados (`USE_MOCK_REPORTS = true` em `src/api/reports.ts`) e a tela inicial tem uma "Fatura de exemplo (mock)". Para usar dados reais da API nos relatórios, troque para `false`.
- **Notificações push** não funcionam no navegador nem em simulador/emulador — só em aparelho físico. No Android, push não funciona no Expo Go; é preciso um [development build](https://docs.expo.dev/develop/development-builds/introduction/).
- As pastas `ios/` e `android/` são geradas automaticamente (estão no `.gitignore`) e não precisam ser versionadas.

## Saiba mais

- [Documentação do Expo](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction)
