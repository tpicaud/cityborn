import type { Provider } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { AUTH_CONFIG, type AuthConfig } from '../../config/config.module';

export type GoogleIdentityPayload = {
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
    return new OAuth2Client(authConfig.googleClientId);
  },
};
