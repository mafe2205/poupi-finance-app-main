const MAX_CURRENCY_DIGITS = 13; // até 99.999.999.999,99, sem perder precisão no Number

const currencyDigitsFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Máscara de dinheiro estilo caixa eletrônico: os dígitos entram pela direita e a vírgula fica
 * sempre antes dos dois últimos. "5" → "0,05", "1500" → "15,00", "123456" → "1.234,56".
 */
export function maskCurrency(text: string): string {
  const digits = text.replace(/\D/g, '').replace(/^0+/, '').slice(0, MAX_CURRENCY_DIGITS);
  if (!digits) return '';
  const formatted = currencyDigitsFormatter.format(Number(digits) / 100);
  return text.trim().startsWith('-') ? `-${formatted}` : formatted;
}

/**
 * Máscara de número de conta: o último caractere é o dígito verificador, separado por hífen.
 * "123456" → "12345-6". Aceita "X" como dígito (usado por alguns bancos, como o Banco do Brasil).
 */
export function maskAccountNumber(text: string): string {
  const chars = text.toUpperCase().replace(/[^\dX]/g, '');
  // "X" só faz sentido como dígito verificador, no fim.
  const body = chars.slice(0, -1).replace(/X/g, '');
  const digit = chars.slice(-1);
  const value = (body + digit).slice(0, 13);
  if (value.length < 2) return value;
  return `${value.slice(0, -1)}-${value.slice(-1)}`;
}

/**
 * Máscara de telefone brasileiro com DDD: "(11) 91234-5678" (celular) ou "(11) 1234-5678" (fixo).
 * Não deixa separador sobrando no fim, para o apagar funcionar normalmente.
 */
export function maskPhone(text: string): string {
  const digits = onlyDigits(text).slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  // Com 9 dígitos depois do DDD é celular (5 + 4); com até 8, fixo (4 + 4).
  const split = rest.length === 9 ? 5 : 4;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

export function onlyDigits(text: string): string {
  return text.replace(/\D/g, '');
}

export type InputMask = 'currency' | 'account' | 'phone';

export const masks: Record<InputMask, (text: string) => string> = {
  currency: maskCurrency,
  account: maskAccountNumber,
  phone: maskPhone,
};
