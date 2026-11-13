import { ErrorCode } from '@cityborn/api';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { z } from 'zod';
import { AUTH_CONFIG, type AuthConfig } from '../../config/config.module';
import { type AppleIdTokenClaims, verifyAppleIdToken } from './apple-id-token';
import {
  GOOGLE_IDENTITY_CLIENT,
  type GoogleIdentityClient,
  type GoogleIdentityTicket,
} from './google-client.provider';

const GoogleIdTokenClaimsSchema = z.object({
  sub: z.string().min(1),
  email: z.string().trim().email(),
  email_verified: z.boolean(),
  name: z.string().optional(),
  hd: z.string().optional(),
});

type GoogleIdTokenClaims = z.infer<typeof GoogleIdTokenClaimsSchema>;

export type GoogleIdentity = {
  subject: string;
  email: string;
  name: string;
  isEmailAuthoritative: boolean;
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
    const ticket: GoogleIdentityTicket =
      await this.googleIdentityClient.verifyIdToken({
        idToken,
        audience: this.authConfig.googleClientId,
      });
    const claims: z.SafeParseReturnType<unknown, GoogleIdTokenClaims> =
      GoogleIdTokenClaimsSchema.safeParse(ticket.getPayload());
    if (!claims.success)
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_CREDENTIALS,
        message: 'Jeton Google incomplet ou invalide',
      });
    const payload: GoogleIdTokenClaims = claims.data;
    if (!payload.email_verified)
      throw new UnauthorizedException({
        code: ErrorCode.USER_GOOGLE_EMAIL_NOT_VERIFIED,
        message: 'Le compte Google n’est pas vérifié',
      });
    const email: string = payload.email.toLowerCase();
    return {
      subject: payload.sub,
      email,
      name: payload.name?.trim() || 'joueur',
      isEmailAuthoritative:
        email.endsWith('@gmail.com') || Boolean(payload.hd?.trim()),
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
