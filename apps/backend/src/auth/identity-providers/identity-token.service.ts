import { ErrorCode } from '@cityborn/api';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AUTH_CONFIG, type AuthConfig } from '../../config/config.module';
import { type AppleIdTokenClaims, verifyAppleIdToken } from './apple-id-token';
import {
  GOOGLE_IDENTITY_CLIENT,
  type GoogleIdentityClient,
  type GoogleIdentityPayload,
} from './google-client.provider';

export type GoogleIdentity = {
  email: string;
  name: string;
};

export type AppleIdentity = {
  appleUserId: string;
  verifiedEmail: string | undefined;
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

  async verifyAppleIdToken(identityToken: string): Promise<AppleIdentity> {
    const claims: AppleIdTokenClaims | null = await verifyAppleIdToken({
      idToken: identityToken,
      audience: this.authConfig.appleAppId,
    });
    if (!claims)
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_TOKEN,
        message: 'Invalid Apple identity token claims',
      });

    return {
      appleUserId: claims.sub,
      verifiedEmail: claims.email_verified ? claims.email : undefined,
    };
  }
}
