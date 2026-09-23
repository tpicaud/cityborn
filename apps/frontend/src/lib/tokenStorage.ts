import type { TokenStorage } from '@cityborn/client/platform';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { getFrontendServerConfig } from '@/config/server';

export class WebTokenStorage implements TokenStorage {
  constructor(private cookieStore: ReadonlyRequestCookies) {}

  async getAccessToken(): Promise<string | null> {
    return this.cookieStore.get('access_token')?.value ?? null;
  }

  async getRefreshToken(): Promise<string | null> {
    return this.cookieStore.get('refresh_token')?.value ?? null;
  }

  async setTokens(access_token: string, refresh_token: string): Promise<void> {
    const frontendServerConfig = getFrontendServerConfig();
    this.cookieStore.set({
      name: 'access_token',
      value: access_token,
      httpOnly: true,
      secure: frontendServerConfig.nodeEnvironment === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 6,
      path: '/',
      domain: `.${frontendServerConfig.domainName}`,
    });

    this.cookieStore.set({
      name: 'refresh_token',
      value: refresh_token,
      httpOnly: true,
      secure: frontendServerConfig.nodeEnvironment === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return;
  }
  async clearTokens(): Promise<void> {
    const frontendServerConfig = getFrontendServerConfig();
    this.cookieStore.set({
      name: 'access_token',
      value: '',
      httpOnly: true,
      secure: frontendServerConfig.nodeEnvironment === 'production',
      sameSite: 'lax',
      maxAge: 0,
      domain: `.${frontendServerConfig.domainName}`,
    });

    this.cookieStore.set({
      name: 'refresh_token',
      value: '',
      httpOnly: true,
      secure: frontendServerConfig.nodeEnvironment === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });
  }
}
