import { randomBytes } from 'node:crypto';
import {
  type ConfirmGoogleEmail,
  ErrorCode,
  type GoogleEmailChallenge,
  type RequestGoogleEmail,
  type SignInWithGoogle,
  type User,
  UsernameSchema,
} from '@cityborn/api';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthSession } from '../../common/types/auth-session';
import { UserService } from '../../user/user.service';
import { AuthenticatedSocketService } from '../../ws-handshake/authenticated-socket.service';
import {
  type GoogleIdentity,
  IdentityTokenService,
} from '../identity-providers/identity-token.service';
import {
  type GoogleEmailProof,
  GoogleEmailProofService,
} from './google-email-proof.service';

export type GoogleAuthentication = {
  session: AuthSession;
  isNewAccount: boolean;
};

@Injectable()
export class GoogleAuthService {
  constructor(
    private readonly identityTokenService: IdentityTokenService,
    private readonly userService: UserService,
    private readonly proofService: GoogleEmailProofService,
    private readonly authenticatedSocketService: AuthenticatedSocketService,
  ) {}

  async signIn({ idToken }: SignInWithGoogle): Promise<GoogleAuthentication> {
    const identity: GoogleIdentity =
      await this.identityTokenService.verifyGoogleIdToken(idToken);
    const session: AuthSession | null =
      await this.userService.findByGoogleSubject(identity.subject);
    if (session) return { session, isNewAccount: false };
    const owner: User | null = await this.userService.findGoogleEmailOwner(
      identity.email,
    );
    if (owner || !identity.isEmailAuthoritative)
      throw new UnauthorizedException({
        code: ErrorCode.USER_GOOGLE_EMAIL_PROOF_REQUIRED,
        message:
          'Confirmez votre adresse Cityborn par code email avant de continuer. Si votre ancien compte utilise une autre adresse, contactez l’assistance Cityborn.',
      });
    return this.createAccount(identity);
  }

  async requestEmail({
    idToken,
    accountEmail,
  }: RequestGoogleEmail): Promise<GoogleEmailChallenge> {
    const identity: GoogleIdentity =
      await this.identityTokenService.verifyGoogleIdToken(idToken);
    const session: AuthSession | null =
      await this.userService.findByGoogleSubject(identity.subject);
    if (session) throw this.accountConflict();
    const owner: User | null = await this.userService.findGoogleEmailOwner(
      accountEmail?.trim().toLowerCase() ?? identity.email,
    );
    if (accountEmail !== undefined && !owner) throw this.accountConflict();
    return this.proofService.request({
      subject: identity.subject,
      email: owner?.email ?? identity.email,
      name: identity.name,
      target: owner ? { userId: owner.id, isVerified: owner.isVerified } : null,
    });
  }

  async confirmEmail(
    confirmation: ConfirmGoogleEmail,
  ): Promise<GoogleAuthentication> {
    const proof: GoogleEmailProof =
      await this.proofService.consume(confirmation);
    if (proof.target === null) {
      const owner: User | null = await this.userService.findGoogleEmailOwner(
        proof.email,
      );
      if (owner) throw this.accountConflict();
      return this.createAccount(proof);
    }
    const session: AuthSession = await this.userService.associateGoogleAccount({
      userId: proof.target.userId,
      email: proof.email,
      isVerified: proof.target.isVerified,
      subject: proof.subject,
    });
    if (!proof.target.isVerified)
      this.authenticatedSocketService.disconnectOlderSessions(
        session.user.id,
        session.authVersion,
      );
    return { session, isNewAccount: false };
  }

  private async createAccount({
    subject,
    email,
    name,
  }: {
    subject: string;
    email: string;
    name: string;
  }): Promise<GoogleAuthentication> {
    const base: string =
      name
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase()
        .slice(0, 8) || 'joueur';
    const user: User = await this.userService.createUser({
      email,
      username: UsernameSchema.parse(
        `${base}${randomBytes(6).toString('hex')}`,
      ),
      type: 'google',
      googleSubject: subject,
      isVerified: true,
    });
    return { session: { user, authVersion: 0 }, isNewAccount: true };
  }

  private accountConflict(): ConflictException {
    return new ConflictException({
      code: ErrorCode.USER_GOOGLE_ACCOUNT_CONFLICT,
      message:
        'Le compte a changé ou possède déjà une identité Google. Recommencez ou contactez l’assistance Cityborn.',
    });
  }
}
