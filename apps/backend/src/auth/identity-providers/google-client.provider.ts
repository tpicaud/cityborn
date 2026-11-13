import { ErrorCode } from '@cityborn/api';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { AUTH_CONFIG, type AuthConfig } from '../../config/config.module';

export type GoogleIdentityPayload = {
  sub?: string;
  email_verified?: boolean;
  email?: string;
  name?: string;
  hd?: string;
};

export interface GoogleIdentityTicket {
  getPayload(): GoogleIdentityPayload | undefined;
}

export interface GoogleIdentityClient {
  verifyIdToken(options: {
    idToken: string;
    audience?: string;
  }): Promise<GoogleIdentityTicket>;
}

export const GOOGLE_IDENTITY_CLIENT: symbol = Symbol('GOOGLE_IDENTITY_CLIENT');

@Injectable()
export class GoogleClientProvider implements GoogleIdentityClient {
  private readonly client: OAuth2Client;

  constructor(@Inject(AUTH_CONFIG) authConfig: AuthConfig) {
    this.client = new OAuth2Client(authConfig.googleClientId);
  }

  async verifyIdToken({
    idToken,
    audience,
  }: {
    idToken: string;
    audience?: string;
  }): Promise<GoogleIdentityTicket> {
    const {
      certs,
    }: Awaited<ReturnType<OAuth2Client['getFederatedSignonCertsAsync']>> =
      await this.client.getFederatedSignonCertsAsync();
    try {
      return await this.client.verifySignedJwtWithCertsAsync(
        idToken,
        certs,
        audience,
        ['accounts.google.com', 'https://accounts.google.com'],
      );
    } catch {
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_CREDENTIALS,
        message: 'Jeton Google invalide ou expiré',
      });
    }
  }
}
