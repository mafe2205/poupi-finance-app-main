import { api } from './client';
import type { User } from '@/data/types';

type UserResultDto = {
  id: number;
  name: string;
  surname: string;
  birthDate: string;
  email: string;
  phone: string;
};

function toUser(dto: UserResultDto): User {
  return {
    id: dto.id,
    name: dto.name,
    surname: dto.surname,
    birthDate: dto.birthDate,
    email: dto.email,
    phone: dto.phone,
  };
}

export type RegisterInput = {
  name: string;
  surname: string;
  birthDate: string;
  email: string;
  phone: string;
  username: string;
  password: string;
};

export async function registerUser(input: RegisterInput): Promise<User> {
  const dto = await api.postAnonymous<UserResultDto>('/api/User', {
    name: input.name,
    surname: input.surname,
    birthDate: input.birthDate,
    email: input.email,
    phone: input.phone,
    user: input.username,
    password: input.password,
    createdAt: new Date().toISOString(),
  });
  return toUser(dto);
}

export async function getUser(id: number): Promise<User> {
  return toUser(await api.get<UserResultDto>(`/api/User/${id}`));
}

export type UpdateUserInput = {
  name: string;
  surname: string;
  birthDate: string;
  email: string;
  phone: string;
};

export async function updateUser(id: number, input: UpdateUserInput): Promise<User> {
  return toUser(await api.put<UserResultDto>(`/api/User/${id}`, input));
}
