import type { Provider } from '@nestjs/common';
import { type LoginTicket, OAuth2Client } from 'google-auth-library';
import { AUTH_CONFIG, type AuthConfig } from '../../config/config.module';

export type GoogleIdTokenPayload = {
  sub: string;
  email_verified?: boolean;
  email?: string;
  name?: string;
  hd?: string;
};

export interface GoogleIdentityClient {
  verifyIdToken(idToken: string): Promise<GoogleIdTokenPayload | null>;
}

export const GOOGLE_IDENTITY_CLIENT: symbol = Symbol('GOOGLE_IDENTITY_CLIENT');

const googleIssuers: string[] = [
  'accounts.google.com',
  'https://accounts.google.com',
];

export function createGoogleIdentityClient(
  authConfig: AuthConfig,
): GoogleIdentityClient {
  const client: OAuth2Client = new OAuth2Client(authConfig.googleClientId);
  return {
    async verifyIdToken(idToken: string): Promise<GoogleIdTokenPayload | null> {
      const {
        certs,
      }: Awaited<ReturnType<OAuth2Client['getFederatedSignonCertsAsync']>> =
        await client.getFederatedSignonCertsAsync();
      const ticket: LoginTicket | null = await client
        .verifySignedJwtWithCertsAsync(
          idToken,
          certs,
          authConfig.googleClientId,
          googleIssuers,
        )
        .catch(() => null);
      return ticket?.getPayload() ?? null;
    },
  };
}

export const GoogleClientProvider: Provider = {
  provide: GOOGLE_IDENTITY_CLIENT,
  inject: [AUTH_CONFIG],
  useFactory: createGoogleIdentityClient,
};
