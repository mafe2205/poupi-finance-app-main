import type { Account } from '@/data/types';
import { api } from './client';
import { centsToReais, reaisToCents } from './money';

type BankAccountResultDto = {
  id: number;
  bankName: string;
  agency: string;
  accountNumber: string;
  isDefault: boolean;
  balanceCents: number;
  active: boolean;
};

function toAccount(dto: BankAccountResultDto): Account {
  return {
    id: dto.id,
    bank: dto.bankName,
    agency: dto.agency,
    number: dto.accountNumber,
    isDefault: dto.isDefault,
    balance: centsToReais(dto.balanceCents),
    active: dto.active ?? true,
  };
}

export async function listInactiveAccounts(userId: number): Promise<Account[]> {
  const dtos = await api.get<BankAccountResultDto[]>(`/api/BankAccounts/user/${userId}/inactive`);
  return dtos.map(toAccount);
}

export async function reactivateAccount(id: number): Promise<Account> {
  return toAccount(await api.patch<BankAccountResultDto>(`/api/BankAccounts/${id}/reactivate`));
}

export async function listAccounts(userId: number): Promise<Account[]> {
  const dtos = await api.get<BankAccountResultDto[]>(`/api/BankAccounts/user/${userId}`);
  return dtos.map(toAccount);
}

export type CreateAccountInput = {
  userId: number;
  bank: string;
  agency: string;
  number: string;
  isDefault?: boolean;
  balance?: number;
};

export async function createAccount(input: CreateAccountInput): Promise<Account> {
  const dto = await api.post<BankAccountResultDto>('/api/BankAccounts', {
    userId: input.userId,
    bankName: input.bank,
    agency: input.agency,
    accountNumber: input.number,
    isDefault: input.isDefault ?? false,
    balanceCents: reaisToCents(input.balance ?? 0),
  });
  return toAccount(dto);
}

export async function updateAccount(
  id: number,
  input: { bank: string; agency: string; number: string }
): Promise<Account> {
  const dto = await api.put<BankAccountResultDto>('/api/BankAccounts', {
    id,
    bankName: input.bank,
    agency: input.agency,
    accountNumber: input.number,
  });
  return toAccount(dto);
}

export async function setAccountBalance(id: number, balanceReais: number): Promise<Account> {
  const dto = await api.patch<BankAccountResultDto>(
    `/api/BankAccounts/${id}/balance`,
    reaisToCents(balanceReais)
  );
  return toAccount(dto);
}

export async function deleteAccount(id: number): Promise<Account> {
  return toAccount(await api.delete<BankAccountResultDto>(`/api/BankAccounts/${id}`));
}
