import { ApiError, ErrorPayload } from '@cityborn/errors';
import { User } from '@cityborn/types';
import { AuthFetch } from './auth-fetch';

export interface TokenStorage {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(access_token: string, refresh_token: string): Promise<void>;
  clearTokens(): Promise<void>;
}

export class ApiClient {
  private authFetch: AuthFetch;

  constructor(baseURL: string, tokenStorage: TokenStorage) {
    this.authFetch = new AuthFetch(baseURL, tokenStorage);
  }

  async getCurrentUser() {
    return await this.authFetch.get<null | User>('/auth/me');
  }
}
