import { TokenStorage, User } from '@cityborn/types';
import { AuthFetch } from './auth-fetch.js';

export class ApiClient {
  private authFetch: AuthFetch;

  constructor(baseURL: string, tokenStorage: TokenStorage) {
    this.authFetch = new AuthFetch(baseURL, tokenStorage);
  }

  async getCurrentUser() {
    return await this.authFetch.get<null | User>('/auth/me', {
      method: 'GET',
      cache: 'no-store',
    });
  }
}
