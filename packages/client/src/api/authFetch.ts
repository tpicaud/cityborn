import { ApiResponseError, ErrorCode, parseApiError } from '@cityborn/api';
import type { ApiFetcherArgs, AppRouteMutation } from '@ts-rest/core';
import type {
  AuthRouteResponse,
  AuthTransport,
  SendAuthRequest,
} from './authTransport';

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
  private refreshQueue: ((refreshed: boolean) => void)[] = [];
  private readonly baseURL: string;
  private readonly authTransport: AuthTransport;
  private readonly onResponseHeaders?: (headers: Headers) => void;
  private readonly baseHeaders: Record<string, string>;
  private readonly getVisitorId?: () => string | null | Promise<string | null>;

  constructor(
    baseURL: string,
    authTransport: AuthTransport,
    options: AuthFetchOptions = {},
  ) {
    this.baseURL = baseURL.replace(/\/+$/, '');
    this.authTransport = authTransport;
    this.onResponseHeaders = options.onResponseHeaders;
    this.baseHeaders = buildClientHeaders(options.client);
    this.getVisitorId = options.getVisitorId;
  }

  private async buildHeaders(
    extra: Record<string, string>,
    bearerToken: string | null,
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      ...this.baseHeaders,
      ...extra,
    };

    const visitorId = await this.getVisitorId?.();
    if (visitorId) {
      headers['x-visitor-id'] = visitorId;
    }

    if (bearerToken) {
      headers.Authorization = `Bearer ${bearerToken}`;
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
      parseApiError(result.status, result.body).code === ErrorCode.TOKEN_EXPIRED
    ) {
      return this.handle401(args);
    }

    return result;
  }

  private async fetchOnce(
    args: ApiFetcherArgs,
  ): Promise<{ status: number; body: unknown; headers: Headers }> {
    const headers: Record<string, string> = await this.buildHeaders(
      args.headers ?? {},
      await this.authTransport.readAccessToken(),
    );

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
        this.refreshQueue.push(async (refreshed) => {
          if (!refreshed) {
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
      await this.authTransport.refreshAuthentication(this.sendAuthRequest);
      this.processQueue(true);
      return await this.fetchOnce(args);
    } catch (err) {
      this.processQueue(false);
      await this.authTransport.clearAuthentication(this.sendAuthRequest);
      throw err;
    } finally {
      this.isRefreshing = false;
    }
  }

  private readonly sendAuthRequest: SendAuthRequest = async (
    route: AppRouteMutation,
    bearerToken: string | null,
  ): Promise<AuthRouteResponse> => {
    const response: Response = await this.timeoutFetch(
      `${this.baseURL}${route.path}`,
      {
        method: route.method,
        headers: await this.buildHeaders(
          { 'Content-Type': 'application/json' },
          bearerToken,
        ),
        body: '{}',
        credentials: 'include',
      },
    );

    if (this.onResponseHeaders) {
      this.onResponseHeaders(response.headers);
    }

    return { status: response.status, body: await this.parseBody(response) };
  };

  private processQueue(refreshed: boolean): void {
    this.refreshQueue.forEach((cb) => {
      cb(refreshed);
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
