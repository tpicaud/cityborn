import {
  ApiResponseError,
  AuthResponseSchema,
  ErrorCode,
  parseApiError,
} from '@cityborn/api';
import type { ApiFetcherArgs } from '@ts-rest/core';
import type { TokenStorage } from '../types/token-storage';

export type ClientName = 'web' | 'mobile' | 'back-office';

export interface ClientInfo {
  name: ClientName;
  version?: string;
}

export interface AuthFetchOptions {
  onResponseHeaders?: (headers: Headers) => void;
  client?: ClientInfo;
  getVisitorId?: () => string | null | Promise<string | null>;
}

function buildClientHeaders(
  client: ClientInfo | undefined,
): Record<string, string> {
  if (!client) {
    return {};
  }
  const headers: Record<string, string> = { 'X-Client-Name': client.name };
  if (client.version) {
    headers['X-Client-Version'] = client.version;
  }
  return headers;
}

export class AuthFetch {
  private isRefreshing = false;
  private refreshQueue: ((token: string | null) => void)[] = [];
  private readonly baseURL: string;
  private readonly tokenStorage: TokenStorage;
  private readonly onResponseHeaders?: (headers: Headers) => void;
  private readonly baseHeaders: Record<string, string>;
  private readonly getVisitorId?: () => string | null | Promise<string | null>;

  constructor(
    baseURL: string,
    tokenStorage: TokenStorage,
    options: AuthFetchOptions = {},
  ) {
    this.baseURL = baseURL.replace(/\/+$/, '');
    this.tokenStorage = tokenStorage;
    this.onResponseHeaders = options.onResponseHeaders;
    this.baseHeaders = buildClientHeaders(options.client);
    this.getVisitorId = options.getVisitorId;
  }

  private async buildHeaders(
    extra: Record<string, string>,
    auth: { kind: 'access' } | { kind: 'bearer'; token: string },
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      ...this.baseHeaders,
      ...extra,
    };

    const visitorId = await this.getVisitorId?.();
    if (visitorId) {
      headers['x-visitor-id'] = visitorId;
    }

    const token =
      auth.kind === 'bearer'
        ? auth.token
        : await this.tokenStorage.getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
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
    const headers = await this.buildHeaders(args.headers ?? {}, {
      kind: 'access',
    });

    const response = await this.timeoutFetch(args.path, {
      method: args.method,
      headers,
      body: args.body,
      credentials: 'include',
    });

    if (this.onResponseHeaders) {
      this.onResponseHeaders(response.headers);
    }

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
            reject(
              new ApiResponseError({
                code: ErrorCode.USER_REFRESH_FAILED,
                message: 'Refresh failed',
                statusCode: 401,
              }),
            );
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
      throw new ApiResponseError({
        code: ErrorCode.USER_REFRESH_FAILED,
        message: 'No refresh token available',
        statusCode: 401,
      });
    }

    const response = await this.timeoutFetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: await this.buildHeaders(
        { 'Content-Type': 'application/json' },
        { kind: 'bearer', token: refreshToken },
      ),
    });

    if (this.onResponseHeaders) {
      this.onResponseHeaders(response.headers);
    }

    if (!response.ok) {
      throw new ApiResponseError(
        parseApiError(response.status, await response.json()),
      );
    }

    const raw = await response.json();
    const parsed = AuthResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiResponseError({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Unexpected error',
        statusCode: response.status,
      });
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
