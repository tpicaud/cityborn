import { ApiError, ErrorCode, type ErrorPayload } from '@cityborn/errors';
import type { TokenStorage } from './types/token-storage.js';

type RequestInitWithAuth = RequestInit & { includeAuth?: boolean };

export class AuthFetch {
  private isRefreshing = false;
  private refreshQueue: ((token: string | null) => void)[] = [];
  private baseURL: string;
  tokenStorage: TokenStorage;

  constructor(baseURL: string, tokenStorage: TokenStorage) {
    this.baseURL = baseURL.replace(/\/+$/, '');
    this.tokenStorage = tokenStorage;
  }

  private async authFetch<T>(
    method: string,
    url: string,
    body?: any,
    options: RequestInitWithAuth = {},
  ): Promise<T> {
    options.includeAuth = options.includeAuth ?? true;

    const token = await this.tokenStorage.getAccessToken();

    const headers: Record<string, any> = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token && options.includeAuth) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await this.timeoutFetch(`${this.baseURL}${url}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      ...options,
    });

    // -----------------------
    // Parse JSON safely
    // -----------------------
    let data: any = null;

    const contentType = response.headers.get('Content-Type') ?? '';

    if (response.status !== 204 && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        // Don't throw — treat as no JSON response
        data = null;
      }
    }

    if (response.ok) {
      return (data ?? {}) as T;
    }

    if (
      response.status === 401 &&
      data &&
      data.code === ErrorCode.TOKEN_EXPIRED &&
      options.includeAuth
    ) {
      return await this.handle401<T>(method, url, body, options);
    }

    if (data && data.code) {
      throw new ApiError(
        data.code,
        data.message,
        data.statusCode ?? response.status,
      );
    }

    throw new ApiError(
      ErrorCode.UNKNOWN_ERROR,
      'Unexpected server response',
      response.status,
    );
  }

  // ------- Handle refresh -------
  private async handle401<T>(
    method: string,
    url: string,
    body?: any,
    options?: RequestInit,
  ): Promise<T> {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.refreshQueue.push(async (newToken) => {
          if (!newToken) {
            reject(
              new ApiError(
                ErrorCode.USER_REFRESH_FAILED,
                'Refresh failed',
                500,
              ),
            );
            return;
          }
          try {
            const res = await this.authFetch<T>(method, url, body, options);
            resolve(res);
          } catch (err) {
            reject(err);
          }
        });
      });
    }

    this.isRefreshing = true;

    try {
      const newToken = await this.refreshToken();
      this.processQueue(newToken);
      return this.authFetch<T>(method, url, body, options);
    } catch (err) {
      this.processQueue(null);
      await this.tokenStorage.clearTokens();
      throw err;
    } finally {
      this.isRefreshing = false;
    }
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = await this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new ApiError(
        ErrorCode.USER_REFRESH_FAILED,
        'No refresh token available',
        401,
      );
    }

    const response = await this.timeoutFetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    if (!response.ok) {
      const error: ErrorPayload = await response.json();
      throw new ApiError(error.code, error.message, error.statusCode);
    }

    const data = await response.json();
    const { access_token, refresh_token } = data;
    await this.tokenStorage.setTokens(access_token, refresh_token);
    return access_token;
  }

  private processQueue(token: string | null) {
    this.refreshQueue.forEach((cb) => cb(token));
    this.refreshQueue = [];
  }

  private async timeoutFetch<T>(
    input: RequestInfo,
    init: RequestInit,
    timeoutMs = 10_000,
  ): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  }

  // ------- HTTP methods -------
  async get<T>(url: string, options?: RequestInitWithAuth): Promise<T> {
    return await this.authFetch<T>('GET', url, undefined, options);
  }

  async post<T>(
    url: string,
    body?: any,
    options?: RequestInitWithAuth,
  ): Promise<T> {
    return await this.authFetch<T>('POST', url, body, options);
  }

  async put<T>(
    url: string,
    body?: any,
    options?: RequestInitWithAuth,
  ): Promise<T> {
    return await this.authFetch<T>('PUT', url, body, options);
  }

  async patch<T>(
    url: string,
    body?: any,
    options?: RequestInitWithAuth,
  ): Promise<T> {
    return await this.authFetch<T>('PATCH', url, body, options);
  }

  async delete<T>(url: string, options?: RequestInitWithAuth): Promise<T> {
    return await this.authFetch<T>('DELETE', url, undefined, options);
  }
}
