function makeEnum<T extends string>(values: readonly T[]) {
  const toWire = (value: T): number => values.indexOf(value);
  const fromWire = (value: number): T => {
    const found = values[value];
    if (found === undefined) throw new Error(`Unknown enum value: ${value}`);
    return found;
  };
  return { toWire, fromWire };
}

export const BankStatementsStatus = makeEnum(['aberta', 'fechada', 'paga', 'atrasada'] as const);
export type BankStatementsStatusValue = 'aberta' | 'fechada' | 'paga' | 'atrasada';

export const BehavioralInsightType = makeEnum([
  'alerta_gasto',
  'sugestao',
  'padrao_detectado',
] as const);
export type BehavioralInsightTypeValue = 'alerta_gasto' | 'sugestao' | 'padrao_detectado';

export const CardsType = makeEnum(['credito', 'debito'] as const);
export type CardsTypeValue = 'credito' | 'debito';

export const CategoriesType = makeEnum(['income', 'expense'] as const);
export type CategoriesTypeValue = 'income' | 'expense';

export const Feedback = makeEnum(['util', 'nao_util', 'irrelevante'] as const);
export type FeedbackValue = 'util' | 'nao_util' | 'irrelevante';

export const NotificationType = makeEnum([
  'insight_generated',
  'invoice_due',
  'goal_reached',
] as const);
export type NotificationTypeValue = 'insight_generated' | 'invoice_due' | 'goal_reached';

export const PaymentMethod = makeEnum([
  'cartao_credito',
  'cartao_debito',
  'dinheiro',
  'pix',
  'boleto',
] as const);
export type PaymentMethodValue = 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'pix' | 'boleto';

export const StatusOCR = makeEnum(['pendente', 'processado', 'erro'] as const);
export type StatusOCRValue = 'pendente' | 'processado' | 'erro';

export const DevicePlatform = makeEnum(['android', 'ios'] as const);
export type DevicePlatformValue = 'android' | 'ios';

export const GoalContributionDirection = makeEnum(['deposito', 'retirada'] as const);
export type GoalContributionDirectionValue = 'deposito' | 'retirada';
