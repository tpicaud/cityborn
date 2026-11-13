import { ErrorCode } from '@cityborn/api';
import type { Provider } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { AUTH_CONFIG, type AuthConfig } from '../../config/config.module';

export type GoogleIdentityPayload = {
  sub?: string;
  hd?: string;
  exp?: number;
  email_verified?: boolean;
  email?: string;
  name?: string;
};

interface GoogleIdentityTicket {
  getPayload(): GoogleIdentityPayload | undefined;
}

export interface GoogleIdentityClient {
  verifyIdToken(options: {
    idToken: string;
    audience?: string;
  }): Promise<GoogleIdentityTicket>;
}

export const GOOGLE_IDENTITY_CLIENT: symbol = Symbol('GOOGLE_IDENTITY_CLIENT');

export const GoogleClientProvider: Provider = {
  provide: GOOGLE_IDENTITY_CLIENT,
  inject: [AUTH_CONFIG],
  useFactory: (authConfig: AuthConfig): GoogleIdentityClient => {
    const client: OAuth2Client = new OAuth2Client(authConfig.googleClientId);
    return {
      async verifyIdToken({ idToken, audience }) {
        const { certs } = await client.getFederatedSignonCertsAsync();
        try {
          return await client.verifySignedJwtWithCertsAsync(
            idToken,
            certs,
            audience,
            ['accounts.google.com', 'https://accounts.google.com'],
          );
        } catch {
          throw new UnauthorizedException({
            code: ErrorCode.USER_INVALID_TOKEN,
            message: 'Invalid Google identity token',
          });
        }
      },
    };
  },
};
