import type { TokenStorage } from '@cityborn/client';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

export class WebTokenStorage implements TokenStorage {
  constructor(private cookieStore: ReadonlyRequestCookies) {}

  async getAccessToken(): Promise<string | null> {
    return this.cookieStore.get('access_token')?.value ?? null;
  }

  async getRefreshToken(): Promise<string | null> {
    return this.cookieStore.get('refresh_token')?.value ?? null;
  }

  async setTokens(access_token: string, refresh_token: string): Promise<void> {
    this.cookieStore.set({
      name: 'access_token',
      value: access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 6,
      path: '/',
      domain: `.${process.env.DOMAIN_NAME}`,
    });

    this.cookieStore.set({
      name: 'refresh_token',
      value: refresh_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return;
  }
  async clearTokens(): Promise<void> {
    this.cookieStore.set({
      name: 'access_token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      domain: `.${process.env.DOMAIN_NAME}`,
    });

    this.cookieStore.set({
      name: 'refresh_token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });
  }
}
