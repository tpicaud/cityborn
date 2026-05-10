import type { TokenStorage } from '@cityborn/api';
import * as SecureStore from 'expo-secure-store';

export class MobileTokenStorage implements TokenStorage {
  async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('access_token', {
      keychainService: 'auth',
    });
  }

  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('refresh_token', {
      keychainService: 'auth',
    });
  }

  async setTokens(access_token: string, refresh_token: string): Promise<void> {
    await SecureStore.setItemAsync('access_token', access_token, {
      keychainService: 'auth',
    });

    await SecureStore.setItemAsync('refresh_token', refresh_token, {
      keychainService: 'auth',
    });
  }

  async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync('access_token', {
      keychainService: 'auth',
    });
    await SecureStore.deleteItemAsync('refresh_token', {
      keychainService: 'auth',
    });
  }
}

export const tokenStorage = new MobileTokenStorage();
