export type EntryKind = 'income' | 'expense';

export type User = {
  id: number;
  name: string;
  surname: string;
  email: string;
  birthDate: string;
  phone: string;
};

export type Account = {
  id: number;
  bank: string;
  agency: string;
  number: string;
  balance: number;
  isDefault: boolean;
  active: boolean;
};

export type Card = {
  id: number;
  accountId: number;
  nickname: string;
  kind: 'credito' | 'debito';
  limit: number;
  closingDay: number;
  dueDay: number;
  active: boolean;
};

export type Category = {
  id: number;
  name: string;
  kind: EntryKind;
  limit: number;
  isDefault: boolean;
};

export type PaymentMethod = 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'pix' | 'boleto';

export type GoalContributionDirection = 'deposito' | 'retirada';

export type Transaction = {
  id: number;
  accountId?: number;
  cardId?: number;
  goalId?: number;
  metaDirection?: GoalContributionDirection;
  description: string;
  categoryId: number;
  kind: EntryKind;
  paymentMethod: PaymentMethod;
  amount: number;
  date: string;
  parcels: number;
  recorrent: boolean;
  recorrentMonths?: number;
  recorrentSerialId?: number;
  invoiceId?: number;
  source: 'manual' | 'ocr';
};

export type RawTransaction = Omit<Transaction, 'kind'>;

export type InvoiceStatus = 'aberta' | 'fechada' | 'paga' | 'atrasada';

export type Invoice = {
  id: number;
  cardId: number;
  monthReference: string;
  status: InvoiceStatus;
  closingDate: string;
  dueDate: string;
  paymentDate?: string;
  total: number;
  paid: number;
  remaining: number;
};

export type InvoicePayment = {
  id: number;
  invoiceId: number;
  accountId: number;
  amount: number;
  paymentDate: string;
};

export type Goal = {
  id: number;
  description: string;
  initialAmount: number;
  targetAmount: number;
  currentAmount: number;
  startDate: string;
  endDate: string;
};

export type InsightFeedback = 'util' | 'nao_util' | 'irrelevante';

export type Insight = {
  id: number;
  type: 'alerta_gasto' | 'sugestao' | 'padrao_detectado';
  categoryId?: number;
  description: string;
  referenceDate: string;
  feedback?: InsightFeedback;
};

export type Notification = {
  id: number;
  type: 'insight_generated' | 'invoice_due' | 'goal_reached';
  title: string;
  message: string;
  relatedEntityId?: number;
  readAt?: string;
  createdAt: string;
};

export type OcrReviewReason =
  | 'falha_no_ocr'
  | 'texto_ilegivel'
  | 'baixa_confianca'
  | 'baixa_confianca_valor'
  | 'valor_nao_encontrado'
  | 'divergencia_itens_total'
  | 'categoria_requer_confirmacao'
  | 'estabelecimento_nao_encontrado';

export type OcrItem = {
  suggestedItemId?: number;
  code?: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  total: number;
};

export type OcrDraft = {
  description: string;
  categoryId?: number;
  categoryRequiresConfirmation: boolean;
  amount: number;
  date: string;
  confidence: number;
  reviewReasons: OcrReviewReason[];
  items: OcrItem[];
  itemsTotal?: number;
};
