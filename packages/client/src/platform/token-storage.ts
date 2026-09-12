export interface TokenStorage {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(access_token: string, refresh_token: string): Promise<void>;
  clearTokens(): Promise<void>;
}
