import type { AuthResponse } from './types';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

let accessToken: string | null = null;
let refreshPromise: Promise<AuthResponse> | null = null;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getApiUrl(): string {
  return API_URL;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function extractMessage(body: unknown): string | null {
  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(message)) {
      return message.filter((item) => typeof item === 'string').join('. ');
    }
  }

  return null;
}

async function requestRefresh(): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });

  const body = await parseBody(response);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      extractMessage(body) ?? 'No se pudo renovar la sesión',
      body,
    );
  }

  const auth = body as AuthResponse;
  setAccessToken(auth.accessToken);
  return auth;
}

export function refreshSession(): Promise<AuthResponse> {
  if (!refreshPromise) {
    refreshPromise = requestRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (
    response.status === 401 &&
    retry &&
    path !== '/auth/refresh' &&
    path !== '/auth/login' &&
    path !== '/auth/logout'
  ) {
    try {
      await refreshSession();
      return apiFetch<T>(path, init, false);
    } catch {
      setAccessToken(null);
    }
  }

  if (!response.ok) {
    const body = await parseBody(response);
    throw new ApiError(
      response.status,
      extractMessage(body) ?? `Error ${response.status}`,
      body,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await parseBody(response)) as T;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Ocurrió un error inesperado';
}
