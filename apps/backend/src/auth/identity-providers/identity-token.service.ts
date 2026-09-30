import { ErrorCode } from '@cityborn/api';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AUTH_CONFIG, type AuthConfig } from '../../config/config.module';
import { verifyAppleIdToken } from './apple-id-token';
import {
  GOOGLE_IDENTITY_CLIENT,
  type GoogleIdentityClient,
  type GoogleIdentityPayload,
} from './google-client.provider';

export type GoogleIdentity = {
  email: string;
  name: string;
};

@Injectable()
export class IdentityTokenService {
  constructor(
    @Inject(GOOGLE_IDENTITY_CLIENT)
    private readonly googleIdentityClient: GoogleIdentityClient,
    @Inject(AUTH_CONFIG) private readonly authConfig: AuthConfig,
  ) {}

  async verifyGoogleIdToken(idToken: string): Promise<GoogleIdentity> {
    const payload: GoogleIdentityPayload | undefined = (
      await this.googleIdentityClient.verifyIdToken({
        idToken,
        audience: this.authConfig.googleClientId,
      })
    ).getPayload();
    if (!payload)
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_CREDENTIALS,
        message: 'Invalid credentials',
      });

    if (!payload.email_verified)
      throw new UnauthorizedException({
        code: ErrorCode.USER_GOOGLE_EMAIL_NOT_VERIFIED,
        message: 'Google account not verified',
      });

    if (!payload.email || !payload.name)
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_CREDENTIALS,
        message: 'Missing name or email',
      });

    return {
      email: payload.email,
      name: payload.name,
    };
  }

  async isAppleIdTokenValid(identityToken: string): Promise<boolean> {
    return Boolean(
      await verifyAppleIdToken(identityToken, this.authConfig.appleAppId),
    );
  }
}
