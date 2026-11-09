import { clearSession, getSession } from './session';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5027';

let unauthorizedHandler: (() => void) | null = null;
export function onUnauthorized(handler: () => void) {
  unauthorizedHandler = handler;
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.error === 'string') return body.error;
    if (typeof body?.title === 'string') return body.title;
    if (body?.errors) {
      const firstField = Object.values(body.errors)[0];
      if (Array.isArray(firstField) && typeof firstField[0] === 'string') return firstField[0];
    }
  } catch {
  }
  return response.statusText || `Erro ${response.status}`;
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; isFormData?: boolean; auth?: boolean } = {}
): Promise<T> {
  const { method = 'GET', body, isFormData = false, auth = true } = options;
  const headers: Record<string, string> = {};

  if (auth) {
    const session = await getSession();
    if (session) headers.Authorization = `Bearer ${session.token}`;
  }
  if (!isFormData && body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && auth) {
    await clearSession();
    unauthorizedHandler?.();
    throw new ApiError(401, 'Sessão expirada. Faça login novamente.');
  }
  if (!response.ok) {
    throw new ApiError(response.status, await extractErrorMessage(response));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  postForm: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: 'POST', body: formData, isFormData: true }),
  postAnonymous: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body, auth: false }),
};
