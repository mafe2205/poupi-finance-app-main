import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import * as accountsApi from '@/api/accounts';
import * as authApi from '@/api/auth';
import * as bankStatementsApi from '@/api/bankStatements';
import * as cardsApi from '@/api/cards';
import * as categoriesApi from '@/api/categories';
import { ApiError, onUnauthorized } from '@/api/client';
import * as goalsApi from '@/api/goals';
import * as insightsApi from '@/api/insights';
import * as notificationsApi from '@/api/notifications';
import { clearSession, getSession } from '@/api/session';
import * as transactionsApi from '@/api/transactions';
import * as userApi from '@/api/user';
import {
  addPushTokenRefreshListener,
  notificationTarget,
  registerForPushNotifications,
  unregisterPushNotifications,
} from '@/utils/push-notifications';
import type {
  Account,
  Card,
  Category,
  EntryKind,
  Goal,
  GoalContributionDirection,
  Insight,
  InsightFeedback,
  Invoice,
  InvoicePayment,
  Notification,
  OcrItem,
  PaymentMethod,
  RawTransaction,
  Transaction,
  User,
} from '@/data/types';

type FinanceState = {
  ready: boolean;
  isAuthenticated: boolean;
  user: User | null;
  accounts: Account[];
  cards: Card[];
  inactiveAccounts: Account[];
  inactiveCards: Card[];
  inactiveCategories: Category[];
  categories: Category[];
  goals: Goal[];
  invoices: Invoice[];
  insights: Insight[];
  notifications: Notification[];
  unreadNotificationsCount: number;
};

export type AddTransactionInput = {
  description: string;
  categoryId: number;
  paymentMethod: PaymentMethod;
  amount: number;
  date: string;
  accountId?: number;
  cardId?: number;
  parcels?: number;
  goalId?: number;
  metaDirection?: GoalContributionDirection;
  recorrent?: boolean;
  recorrentMonths?: number;
};

export type EditTransactionInput = {
  description: string;
  categoryId: number;
  amount: number;
  /** yyyy-mm-dd */
  date: string;
  goalId?: number;
  metaDirection?: GoalContributionDirection;
};

type FinanceActions = {
  login: (identifier: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    surname: string;
    email: string;
    birthDate: string;
    phone: string;
    username: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: userApi.UpdateUserInput) => Promise<void>;

  addAccount: (input: { bank: string; agency: string; number: string; balance: number }) => Promise<Account>;
  addCard: (input: {
    accountId: number;
    nickname: string;
    kind: 'credito' | 'debito';
    limit: number;
    closingDay: number;
    dueDay: number;
  }) => Promise<Card>;
  refreshInactive: () => Promise<void>;
  deactivateAccount: (id: number) => Promise<void>;
  reactivateAccount: (id: number) => Promise<void>;
  deactivateCard: (id: number) => Promise<void>;
  reactivateCard: (id: number) => Promise<void>;
  reactivateCategory: (id: number) => Promise<void>;
  findAccount: (accountId: number) => Account | undefined;
  findCard: (cardId: number) => Card | undefined;

  addCategory: (input: { name: string; kind: EntryKind; limit?: number }) => Promise<Category>;
  updateCategory: (id: number, input: { name: string; kind: EntryKind; limit?: number }) => Promise<void>;
  deleteCategory: (id: number) => Promise<boolean>;

  addTransaction: (input: AddTransactionInput) => Promise<Transaction>;
  editTransaction: (id: number, input: EditTransactionInput) => Promise<void>;
  goalCategory: Category | undefined;
  confirmDocumentTransaction: (documentId: number, input: AddTransactionInput, items?: OcrItem[]) => Promise<Transaction>;
  getTransaction: (id: number) => Promise<Transaction | undefined>;
  getAccountTransactions: (accountId: number) => Promise<Transaction[]>;
  getCardTransactions: (cardId: number) => Promise<Transaction[]>;
  getInvoiceTransactions: (invoiceId: number) => Promise<Transaction[]>;

  fixedEntries: Transaction[];
  refreshFixedEntries: () => Promise<void>;
  addFixedEntry: (input: {
    description: string;
    categoryId: number;
    kind: EntryKind;
    amount: number;
    day: number;
    months: number;
    paymentMethod: PaymentMethod;
    accountId?: number;
    cardId?: number;
  }) => Promise<void>;
  cancelFixedEntry: (transactionId: number) => Promise<void>;

  addGoal: (input: {
    description: string;
    initialAmount: number;
    targetAmount: number;
    startDate: string;
    endDate: string;
  }) => Promise<Goal>;
  depositToGoal: (goalId: number, accountId: number, amount: number) => Promise<void>;
  withdrawFromGoal: (goalId: number, accountId: number, amount: number) => Promise<void>;
  getGoalTransactions: (goalId: number) => Transaction[];

  payInvoice: (invoiceId: number, amount: number, accountId?: number) => Promise<void>;
  getInvoicePayments: (invoiceId: number) => Promise<InvoicePayment[]>;
  getAccountInvoicePayments: (accountId: number) => Promise<InvoicePayment[]>;
  submitInsightFeedback: (insightId: number, feedback: InsightFeedback) => Promise<void>;
  refreshInsightsNow: () => Promise<void>;
  markNotificationRead: (id: number) => Promise<void>;

  getAccount: (accountId: number) => Account | undefined;
  getCard: (cardId: number | undefined) => Card | undefined;
  getCategory: (categoryId: number | undefined) => Category | undefined;
  getInvoice: (invoiceId: number) => Invoice | undefined;
  getCardInvoices: (cardId: number) => Invoice[];
  categoriesByKind: (kind: EntryKind) => Category[];
  totalPatrimonio: () => number;
};

const FinanceContext = createContext<(FinanceState & FinanceActions) | null>(null);

export function FinanceProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [inactiveAccounts, setInactiveAccounts] = useState<Account[]>([]);
  const [inactiveCards, setInactiveCards] = useState<Card[]>([]);
  const [inactiveCategories, setInactiveCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalHistories, setGoalHistories] = useState<Record<number, Transaction[]>>({});
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [fixedEntries, setFixedEntries] = useState<Transaction[]>([]);

  const categories = useMemo(() => allCategories.filter((c) => !c.isDefault), [allCategories]);
  const goalCategory = useMemo(() => allCategories.find((c) => c.isDefault), [allCategories]);

  const getCategory = useCallback(
    (categoryId: number | undefined) =>
      allCategories.find((c) => c.id === categoryId) ?? inactiveCategories.find((c) => c.id === categoryId),
    [allCategories, inactiveCategories]
  );

  const withKind = useCallback(
    (raw: RawTransaction): Transaction => ({
      ...raw,
      kind: raw.metaDirection
        ? raw.metaDirection === 'retirada'
          ? 'income'
          : 'expense'
        : (getCategory(raw.categoryId)?.kind ?? 'expense'),
    }),
    [getCategory]
  );

  const clearAllState = useCallback(() => {
    setIsAuthenticated(false);
    setUserId(null);
    setUser(null);
    setAccounts([]);
    setCards([]);
    setInactiveAccounts([]);
    setInactiveCards([]);
    setInactiveCategories([]);
    setAllCategories([]);
    setGoals([]);
    setGoalHistories({});
    setInvoices([]);
    setInsights([]);
    setNotifications([]);
    setFixedEntries([]);
  }, []);

  useEffect(() => {
    onUnauthorized(() => clearAllState());
  }, [clearAllState]);

  const refreshAccounts = useCallback(async (uid: number) => {
    const list = await accountsApi.listAccounts(uid);
    setAccounts(list);
    return list;
  }, []);

  const refreshCards = useCallback(async (accountList: Account[]) => {
    const lists = await Promise.all(accountList.map((a) => cardsApi.listCardsByAccount(a.id)));
    const flat = lists.flat();
    setCards(flat);
    return flat;
  }, []);

  const refreshCategories = useCallback(async (uid: number) => {
    const [list, inactive] = await Promise.all([
      categoriesApi.listCategories(uid),
      categoriesApi.listInactiveCategories(uid).catch(() => [] as Category[]),
    ]);
    setAllCategories(list);
    setInactiveCategories(inactive);
    return list;
  }, []);

  const refreshInvoices = useCallback(async (cardList: Card[]) => {
    const lists = await Promise.all(cardList.map((c) => bankStatementsApi.listInvoicesForCard(c.id)));
    setInvoices(lists.flat());
  }, []);

  const refreshInsights = useCallback(async (uid: number) => {
    setInsights(await insightsApi.listInsights(uid));
  }, []);

  const refreshNotifications = useCallback(async (uid: number) => {
    setNotifications(await notificationsApi.listNotifications(uid));
  }, []);

  const refreshFixedEntries = useCallback(async () => {
    const all = await transactionsApi.listTransactions({ pageSize: 200 });
    const recurring = all.filter((t) => t.recorrent);
    const latestBySeries = new Map<number, RawTransaction>();
    for (const t of recurring) {
      const key = t.recorrentSerialId ?? t.id;
      const current = latestBySeries.get(key);
      if (!current || t.date > current.date) latestBySeries.set(key, t);
    }
    setFixedEntries([...latestBySeries.values()].map(withKind));
  }, [withKind]);

  const refreshGoals = useCallback(
    async (uid: number) => {
      const list = await goalsApi.listGoals(uid);
      const histories: Record<number, Transaction[]> = {};
      const withCurrentAmount = await Promise.all(
        list.map(async (goal) => {
          const history = await goalsApi.getGoalHistory(goal.id);
          const transactions = history.map(withKind).sort((a, b) => (a.date < b.date ? 1 : -1));
          histories[goal.id] = transactions;
          const delta = transactions.reduce(
            (sum, t) => sum + (t.metaDirection === 'retirada' ? -t.amount : t.amount),
            0
          );
          return { ...goal, currentAmount: Math.max(0, goal.initialAmount + delta) };
        })
      );
      setGoals(withCurrentAmount);
      setGoalHistories(histories);
    },
    [withKind]
  );

  const loadEverything = useCallback(async (uid: number) => {
    const [profile, accountList] = await Promise.all([
      userApi.getUser(uid),
      refreshAccounts(uid),
      refreshCategories(uid),
    ]);
    setUser(profile);
    const cardList = await refreshCards(accountList);
    await Promise.all([
      refreshInvoices(cardList),
      refreshGoals(uid),
      refreshInsights(uid),
      refreshNotifications(uid),
    ]);
  }, [refreshAccounts, refreshCards, refreshCategories, refreshInvoices, refreshGoals, refreshInsights, refreshNotifications]);

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (session) {
        setUserId(session.userId);
        setIsAuthenticated(true);
        try {
          await loadEverything(session.userId);
          await refreshFixedEntries();
        } catch {
          await clearSession();
          clearAllState();
        }
      }
      setReady(true);
    })();
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const session = await authApi.login(identifier, password);
      setUserId(session.userId);
      setIsAuthenticated(true);
      await loadEverything(session.userId);
      await refreshFixedEntries();
    },
    [loadEverything, refreshFixedEntries]
  );

  const register = useCallback(
    async (input: {
      name: string;
      surname: string;
      email: string;
      birthDate: string;
      phone: string;
      username: string;
      password: string;
    }) => {
      await userApi.registerUser(input);
      await login(input.username, input.password);
    },
    [login]
  );

  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    registerForPushNotifications();
    const removeTokenListener = addPushTokenRefreshListener();
    const received = Notifications.addNotificationReceivedListener(() => {
      Promise.all([refreshInsights(userId), refreshNotifications(userId)]).catch(() => {});
    });
    return () => {
      removeTokenListener();
      received.remove();
    };
  }, [isAuthenticated, userId, refreshInsights, refreshNotifications]);

  const logout = useCallback(async () => {
    await unregisterPushNotifications();
    await clearSession();
    clearAllState();
  }, [clearAllState]);

  const requireUserId = useCallback(() => {
    if (!userId) throw new Error('Não autenticado.');
    return userId;
  }, [userId]);

  const updateProfile = useCallback(
    async (input: userApi.UpdateUserInput) => {
      setUser(await userApi.updateUser(requireUserId(), input));
    },
    [requireUserId]
  );

  const addAccount = useCallback(
    async (input: { bank: string; agency: string; number: string; balance: number }) => {
      const uid = requireUserId();
      const account = await accountsApi.createAccount({ userId: uid, ...input });
      setAccounts((prev) => [...prev, account]);
      return account;
    },
    [requireUserId]
  );

  const addCard = useCallback(
    async (input: {
      accountId: number;
      nickname: string;
      kind: 'credito' | 'debito';
      limit: number;
      closingDay: number;
      dueDay: number;
    }) => {
      const card = await cardsApi.createCard(input);
      setCards((prev) => [...prev, card]);
      return card;
    },
    []
  );

  const refreshInactive = useCallback(async () => {
    const uid = requireUserId();
    const [accountList, cardList, categoryList] = await Promise.all([
      accountsApi.listInactiveAccounts(uid),
      cardsApi.listInactiveCards(uid),
      categoriesApi.listInactiveCategories(uid).catch(() => [] as Category[]),
    ]);
    setInactiveAccounts(accountList);
    setInactiveCards(cardList);
    setInactiveCategories(categoryList);
  }, [requireUserId]);

  const reloadAccountsAndCards = useCallback(async () => {
    const uid = requireUserId();
    const accountList = await refreshAccounts(uid);
    const cardList = await refreshCards(accountList);
    await Promise.all([refreshInvoices(cardList), refreshInactive()]);
  }, [requireUserId, refreshAccounts, refreshCards, refreshInvoices, refreshInactive]);

  const deactivateAccount = useCallback(
    async (id: number) => {
      await accountsApi.deleteAccount(id);
      await reloadAccountsAndCards();
    },
    [reloadAccountsAndCards]
  );

  const reactivateAccount = useCallback(
    async (id: number) => {
      await accountsApi.reactivateAccount(id);
      await reloadAccountsAndCards();
    },
    [reloadAccountsAndCards]
  );

  const deactivateCard = useCallback(
    async (id: number) => {
      await cardsApi.deleteCard(id);
      await reloadAccountsAndCards();
    },
    [reloadAccountsAndCards]
  );

  const reactivateCard = useCallback(
    async (id: number) => {
      await cardsApi.reactivateCard(id);
      await reloadAccountsAndCards();
    },
    [reloadAccountsAndCards]
  );

  const reactivateCategory = useCallback(
    async (id: number) => {
      const category = await categoriesApi.reactivateCategory(id);
      setAllCategories((prev) => [...prev.filter((c) => c.id !== id), category]);
      setInactiveCategories((prev) => prev.filter((c) => c.id !== id));
    },
    []
  );

  const findAccount = useCallback(
    (accountId: number) =>
      accounts.find((a) => a.id === accountId) ?? inactiveAccounts.find((a) => a.id === accountId),
    [accounts, inactiveAccounts]
  );

  const addCategory = useCallback(
    async (input: { name: string; kind: EntryKind; limit?: number }) => {
      const uid = requireUserId();
      const category = await categoriesApi.createCategory(uid, input);
      setAllCategories((prev) => [...prev, category]);
      return category;
    },
    [requireUserId]
  );

  const updateCategory = useCallback(
    async (id: number, input: { name: string; kind: EntryKind; limit?: number }) => {
      await categoriesApi.updateCategory(id, input);
      setAllCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: input.name, kind: input.kind, limit: input.limit ?? 0 } : c))
      );
    },
    []
  );

  const deleteCategory = useCallback(async (id: number) => {
    const deleted = await categoriesApi.deleteCategory(id);
    if (deleted) {
      setAllCategories((prev) => {
        const removed = prev.find((c) => c.id === id);
        if (removed) setInactiveCategories((inactive) => [...inactive.filter((c) => c.id !== id), removed]);
        return prev.filter((c) => c.id !== id);
      });
    }
    return deleted;
  }, []);

  const addTransaction = useCallback(
    async (input: AddTransactionInput) => {
      const raw = await transactionsApi.createTransaction(input);
      const transaction = withKind(raw);
      const uid = requireUserId();
      if (input.paymentMethod !== 'cartao_credito') await refreshAccounts(uid);
      if (input.cardId) await refreshInvoices(cards);
      if (input.goalId) await refreshGoals(uid);
      return transaction;
    },
    [withKind, requireUserId, refreshAccounts, refreshInvoices, refreshGoals, cards]
  );

  const editTransaction = useCallback(
    async (id: number, input: EditTransactionInput) => {
      await transactionsApi.updateTransaction(id, input);
      const uid = requireUserId();
      await Promise.all([refreshAccounts(uid), refreshInvoices(cards), refreshGoals(uid)]);
    },
    [requireUserId, refreshAccounts, refreshInvoices, refreshGoals, cards]
  );

  const confirmDocumentTransaction = useCallback(
    async (documentId: number, input: AddTransactionInput, items?: OcrItem[]) => {
      const raw = await transactionsApi.createTransactionFromDocument(documentId, input, items);
      const transaction = withKind(raw);
      const uid = requireUserId();
      if (input.paymentMethod !== 'cartao_credito') await refreshAccounts(uid);
      if (input.cardId) await refreshInvoices(cards);
      return transaction;
    },
    [withKind, requireUserId, refreshAccounts, refreshInvoices, cards]
  );

  const getTransaction = useCallback(
    async (id: number) => withKind(await transactionsApi.getTransaction(id)),
    [withKind]
  );

  const findCard = useCallback(
    (cardId: number) => cards.find((c) => c.id === cardId) ?? inactiveCards.find((c) => c.id === cardId),
    [cards, inactiveCards]
  );

  const getCardTransactions = useCallback(
    async (cardId: number) => {
      const raw = await transactionsApi.listTransactions({ cardId, pageSize: 200 });
      return raw.map(withKind).sort((a, b) => (a.date < b.date ? 1 : -1));
    },
    [withKind]
  );

  const getAccountTransactions = useCallback(
    async (accountId: number) => {
      const cardIds = [...cards, ...inactiveCards]
        .filter((card) => card.accountId === accountId)
        .map((card) => card.id);
      const [direct, ...byCard] = await Promise.all([
        transactionsApi.listTransactions({ bankAccountId: accountId, pageSize: 200 }),
        ...cardIds.map((cardId) => transactionsApi.listTransactions({ cardId, pageSize: 200 })),
      ]);
      const debit = byCard.flat().filter((t) => t.paymentMethod === 'cartao_debito');
      const unique = new Map([...direct, ...debit].map((t) => [t.id, t]));
      return [...unique.values()].map(withKind).sort((a, b) => (a.date < b.date ? 1 : -1));
    },
    [withKind, cards, inactiveCards]
  );

  const getInvoiceTransactions = useCallback(
    async (invoiceId: number) => {
      const invoice = invoices.find((i) => i.id === invoiceId);
      if (!invoice) return [];
      const raw = await transactionsApi.listTransactions({ cardId: invoice.cardId, pageSize: 200 });
      return raw.filter((t) => t.invoiceId === invoiceId).map(withKind);
    },
    [invoices, withKind]
  );

  const addFixedEntry = useCallback(
    async (input: {
      description: string;
      categoryId: number;
      kind: EntryKind;
      amount: number;
      day: number;
      months: number;
      paymentMethod: PaymentMethod;
      accountId?: number;
      cardId?: number;
    }) => {
      const today = new Date();
      let firstDate = new Date(today.getFullYear(), today.getMonth(), input.day);
      if (firstDate < today) firstDate = new Date(today.getFullYear(), today.getMonth() + 1, input.day);
      const isoDate = firstDate.toISOString().slice(0, 10);

      await addTransaction({
        description: input.description,
        categoryId: input.categoryId,
        paymentMethod: input.paymentMethod,
        amount: input.amount,
        date: isoDate,
        accountId: input.accountId,
        cardId: input.cardId,
        recorrent: true,
        recorrentMonths: input.months,
      });
      await refreshFixedEntries();
    },
    [addTransaction, refreshFixedEntries]
  );

  const cancelFixedEntry = useCallback(
    async (transactionId: number) => {
      await transactionsApi.cancelRecurrentSeries(transactionId);
      await refreshFixedEntries();
    },
    [refreshFixedEntries]
  );

  const addGoal = useCallback(
    async (input: { description: string; initialAmount: number; targetAmount: number; startDate: string; endDate: string }) => {
      const uid = requireUserId();
      const created = await goalsApi.createGoal({ userId: uid, ...input });
      const goal: Goal = { ...created, currentAmount: input.initialAmount };
      setGoals((prev) => [...prev, goal]);
      setGoalHistories((prev) => ({ ...prev, [goal.id]: [] }));
      return goal;
    },
    [requireUserId]
  );

  const contributeToGoal = useCallback(
    async (goalId: number, accountId: number, amount: number, direction: GoalContributionDirection) => {
      const metas = allCategories.find((c) => c.isDefault);
      if (!metas) throw new Error('Categoria Metas não encontrada.');

      await addTransaction({
        description: direction === 'deposito' ? 'Depósito em meta' : 'Retirada de meta',
        categoryId: metas.id,
        paymentMethod: 'dinheiro',
        amount,
        date: new Date().toISOString().slice(0, 10),
        accountId,
        goalId,
        metaDirection: direction,
      });

      await refreshGoals(requireUserId());
    },
    [allCategories, addTransaction, requireUserId, refreshGoals]
  );

  const depositToGoal = useCallback(
    (goalId: number, accountId: number, amount: number) => contributeToGoal(goalId, accountId, amount, 'deposito'),
    [contributeToGoal]
  );
  const withdrawFromGoal = useCallback(
    (goalId: number, accountId: number, amount: number) => contributeToGoal(goalId, accountId, amount, 'retirada'),
    [contributeToGoal]
  );

  const getGoalTransactions = useCallback((goalId: number) => goalHistories[goalId] ?? [], [goalHistories]);

  const payInvoice = useCallback(
    async (invoiceId: number, amount: number, accountId?: number) => {
      const uid = requireUserId();
      await bankStatementsApi.payInvoice(invoiceId, amount, accountId);
      const [updated] = await Promise.all([bankStatementsApi.getInvoice(invoiceId), refreshAccounts(uid)]);
      setInvoices((prev) => prev.map((i) => (i.id === invoiceId ? updated : i)));
    },
    [requireUserId, refreshAccounts]
  );

  const getInvoicePayments = useCallback(
    (invoiceId: number) => bankStatementsApi.listInvoicePayments(invoiceId),
    []
  );

  const getAccountInvoicePayments = useCallback(
    async (accountId: number) => {
      const withPayments = invoices.filter((i) => i.paid > 0);
      const lists = await Promise.all(
        withPayments.map((i) => bankStatementsApi.listInvoicePayments(i.id).catch(() => [] as InvoicePayment[]))
      );
      return lists.flat().filter((p) => p.accountId === accountId);
    },
    [invoices]
  );

  const submitInsightFeedback = useCallback(async (insightId: number, feedback: InsightFeedback) => {
    await insightsApi.submitInsightFeedback(insightId, feedback);
    setInsights((prev) => prev.map((i) => (i.id === insightId ? { ...i, feedback } : i)));
  }, []);

  const refreshInsightsNow = useCallback(async () => {
    const uid = requireUserId();
    await insightsApi.refreshInsights();
    await Promise.all([refreshInsights(uid), refreshNotifications(uid)]);
  }, [requireUserId, refreshInsights, refreshNotifications]);

  const markNotificationRead = useCallback(async (id: number) => {
    await notificationsApi.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' || !ready || !isAuthenticated || !userId) return;
    const uid = userId;

    async function openFromNotification(response: Notifications.NotificationResponse) {
      const data = response.notification.request.content.data;
      await Promise.all([refreshInsights(uid), refreshNotifications(uid)]).catch(() => {});
      const notificationId = Number(data?.notificationId);
      if (notificationId) markNotificationRead(notificationId).catch(() => {});
      router.push(notificationTarget(data));
    }

    Notifications.getLastNotificationResponseAsync().then(async (response) => {
      if (!response) return;
      await Notifications.clearLastNotificationResponseAsync();
      openFromNotification(response);
    });
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      Notifications.clearLastNotificationResponseAsync();
      openFromNotification(response);
    });
    return () => subscription.remove();
  }, [ready, isAuthenticated, userId, refreshInsights, refreshNotifications, markNotificationRead]);

  const getAccount = useCallback((accountId: number) => accounts.find((a) => a.id === accountId), [accounts]);
  const getCard = useCallback((cardId: number | undefined) => cards.find((c) => c.id === cardId), [cards]);
  const getInvoice = useCallback((invoiceId: number) => invoices.find((i) => i.id === invoiceId), [invoices]);
  const getCardInvoices = useCallback(
    (cardId: number) => invoices.filter((i) => i.cardId === cardId),
    [invoices]
  );
  const categoriesByKind = useCallback((kind: EntryKind) => categories.filter((c) => c.kind === kind), [categories]);
  const totalPatrimonio = useCallback(() => accounts.reduce((sum, a) => sum + a.balance, 0), [accounts]);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.readAt).length,
    [notifications]
  );

  const value = useMemo<FinanceState & FinanceActions>(
    () => ({
      ready,
      isAuthenticated,
      user,
      accounts,
      cards,
      inactiveAccounts,
      inactiveCategories,
      inactiveCards,
      categories,
      goals,
      invoices,
      insights,
      notifications,
      unreadNotificationsCount,
      fixedEntries,
      login,
      register,
      logout,
      updateProfile,
      addAccount,
      addCard,
      refreshInactive,
      deactivateAccount,
      reactivateAccount,
      deactivateCard,
      reactivateCard,
      reactivateCategory,
      findAccount,
      findCard,
      addCategory,
      updateCategory,
      deleteCategory,
      addTransaction,
      editTransaction,
      goalCategory,
      confirmDocumentTransaction,
      getTransaction,
      getAccountTransactions,
      getCardTransactions,
      getInvoiceTransactions,
      refreshFixedEntries,
      addFixedEntry,
      cancelFixedEntry,
      addGoal,
      depositToGoal,
      withdrawFromGoal,
      getGoalTransactions,
      payInvoice,
      getInvoicePayments,
      getAccountInvoicePayments,
      submitInsightFeedback,
      refreshInsightsNow,
      markNotificationRead,
      getAccount,
      getCard,
      getCategory,
      getInvoice,
      getCardInvoices,
      categoriesByKind,
      totalPatrimonio,
    }),
    [
      inactiveAccounts,
      inactiveCategories,
      inactiveCards,
      refreshInactive,
      deactivateAccount,
      reactivateAccount,
      deactivateCard,
      reactivateCard,
      reactivateCategory,
      findAccount,
      findCard,
      ready,
      isAuthenticated,
      user,
      accounts,
      cards,
      categories,
      goals,
      invoices,
      insights,
      notifications,
      unreadNotificationsCount,
      fixedEntries,
      login,
      register,
      logout,
      updateProfile,
      addAccount,
      addCard,
      addCategory,
      updateCategory,
      deleteCategory,
      addTransaction,
      editTransaction,
      goalCategory,
      confirmDocumentTransaction,
      getTransaction,
      getAccountTransactions,
      getCardTransactions,
      getInvoiceTransactions,
      refreshFixedEntries,
      addFixedEntry,
      cancelFixedEntry,
      addGoal,
      depositToGoal,
      withdrawFromGoal,
      getGoalTransactions,
      payInvoice,
      getInvoicePayments,
      getAccountInvoicePayments,
      submitInsightFeedback,
      refreshInsightsNow,
      markNotificationRead,
      getAccount,
      getCard,
      getCategory,
      getInvoice,
      getCardInvoices,
      categoriesByKind,
      totalPatrimonio,
    ]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}

export { ApiError };
