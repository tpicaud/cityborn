import { ErrorCode } from '@cityborn/api';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AUTH_CONFIG, type AuthConfig } from '../../config/config.module';
import type { IdentityProviderAccount } from '../../user/repositories/user.repository';
import { type AppleIdTokenClaims, verifyAppleIdToken } from './apple-id-token';
import {
  GOOGLE_IDENTITY_CLIENT,
  type GoogleIdentityClient,
  type GoogleIdTokenPayload,
} from './google-client.provider';

export type ProviderIdentity = IdentityProviderAccount & {
  verifiedEmail: string | undefined;
  isEmailAuthoritative: boolean;
};

export type GoogleIdentity = ProviderIdentity & {
  verifiedEmail: string;
  name: string | undefined;
};

const appleEmailDomains: ReadonlySet<string> = new Set([
  'icloud.com',
  'me.com',
  'mac.com',
  'privaterelay.appleid.com',
]);

function emailDomain(email: string): string {
  return email.slice(email.lastIndexOf('@') + 1).toLowerCase();
}

function invalidIdentityTokenException(): UnauthorizedException {
  return new UnauthorizedException({
    code: ErrorCode.USER_INVALID_TOKEN,
    message: 'Invalid identity token',
  });
}

@Injectable()
export class IdentityTokenService {
  constructor(
    @Inject(GOOGLE_IDENTITY_CLIENT)
    private readonly googleIdentityClient: GoogleIdentityClient,
    @Inject(AUTH_CONFIG) private readonly authConfig: AuthConfig,
  ) {}

  async verifyGoogleIdToken(idToken: string): Promise<GoogleIdentity> {
    const payload: GoogleIdTokenPayload | null =
      await this.googleIdentityClient.verifyIdToken(idToken);
    if (!payload?.sub || !payload.email) throw invalidIdentityTokenException();

    if (!payload.email_verified)
      throw new UnauthorizedException({
        code: ErrorCode.USER_GOOGLE_EMAIL_NOT_VERIFIED,
        message: 'Google account not verified',
      });

    return {
      provider: 'google',
      providerUserId: payload.sub,
      verifiedEmail: payload.email,
      isEmailAuthoritative:
        emailDomain(payload.email) === 'gmail.com' || Boolean(payload.hd),
      name: payload.name,
    };
  }

  async verifyAppleIdToken(identityToken: string): Promise<ProviderIdentity> {
    const claims: AppleIdTokenClaims | null = await verifyAppleIdToken({
      idToken: identityToken,
      audience: this.authConfig.appleAppId,
    });
    if (!claims) throw invalidIdentityTokenException();

    const verifiedEmail: string | undefined = claims.email_verified
      ? claims.email
      : undefined;
    return {
      provider: 'apple',
      providerUserId: claims.sub,
      verifiedEmail,
      isEmailAuthoritative:
        verifiedEmail !== undefined &&
        appleEmailDomains.has(emailDomain(verifiedEmail)),
    };
  }
}
