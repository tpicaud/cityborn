import type { ApiFetcherArgs } from '@ts-rest/core';
import { ApiErrors } from './api-errors.js';
import { ErrorCode } from './errors/error-codes.js';
import type { ApiError } from './schemas/api-error.schema.js';
import { AuthResponseSchema } from './schemas/user.schema.js';
import type { TokenStorage } from './types/token-storage.js';

export class AuthFetch {
  private isRefreshing = false;
  private refreshQueue: ((token: string | null) => void)[] = [];
  private readonly baseURL: string;
  private readonly tokenStorage: TokenStorage;

  constructor(baseURL: string, tokenStorage: TokenStorage) {
    this.baseURL = baseURL.replace(/\/+$/, '');
    this.tokenStorage = tokenStorage;
  }

  buildApiFunction() {
    return (args: ApiFetcherArgs) => this.tsRestFetch(args);
  }

  private async tsRestFetch(
    args: ApiFetcherArgs,
  ): Promise<{ status: number; body: unknown; headers: Headers }> {
    const result = await this.fetchOnce(args);

    if (
      result.status === 401 &&
      result.body !== null &&
      typeof result.body === 'object' &&
      (result.body as Record<string, unknown>).code === ErrorCode.TOKEN_EXPIRED
    ) {
      return this.handle401(args);
    }

    return result;
  }

  private async fetchOnce(
    args: ApiFetcherArgs,
  ): Promise<{ status: number; body: unknown; headers: Headers }> {
    const token = await this.tokenStorage.getAccessToken();

    const headers: Record<string, string> = { ...args.headers };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await this.timeoutFetch(args.path, {
      method: args.method,
      headers,
      body: args.body,
      credentials: 'include',
    });

    const body = await this.parseBody(response);
    return { status: response.status, body, headers: response.headers };
  }

  private async handle401(
    args: ApiFetcherArgs,
  ): Promise<{ status: number; body: unknown; headers: Headers }> {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.refreshQueue.push(async (newToken) => {
          if (!newToken) {
            reject(ApiErrors.refreshFailed());
            return;
          }
          try {
            resolve(await this.fetchOnce(args));
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
      return await this.fetchOnce(args);
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
      throw ApiErrors.noRefreshToken();
    }

    const response = await this.timeoutFetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      };
    }

    const raw = await response.json();
    const parsed = AuthResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw {
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Unexpected error',
        statusCode: response.status,
      } satisfies ApiError;
    }
    const { access_token, refresh_token } = parsed.data;
    await this.tokenStorage.setTokens(access_token, refresh_token);
    return access_token;
  }

  private processQueue(token: string | null) {
    this.refreshQueue.forEach((cb) => {
      cb(token);
    });
    this.refreshQueue = [];
  }

  private async parseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get('Content-Type') ?? '';
    if (contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch {
        return null;
      }
    }
    if (contentType.includes('text/')) {
      try {
        return await response.text();
      } catch {
        return null;
      }
    }
    return null;
  }

  private async timeoutFetch(
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
}
