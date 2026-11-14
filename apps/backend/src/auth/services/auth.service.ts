import {
  type AuthResponse,
  type CreateUser,
  ErrorCode,
  type PublicUser,
  type SignIn,
  type SignInWithApple,
  type SignInWithGoogle,
  type UpdateEmail,
  type UpdatePassword,
  type User,
  type UserId,
  UserIdSchema,
  type Username,
  UsernameSchema,
  VerifyEmailData,
} from '@cityborn/api';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthSession, AuthVersion } from '../../common/types/auth-session';
import { WideEventService } from '../../common/wide-event/wide-event.service';
import { HTTP_CONFIG, type HttpConfig } from '../../config/config.module';
import { EventService } from '../../event/event.service';
import { createEvent } from '../../event/event.types';
import { buildMailOptions } from '../../mail/email-templates';
import { MailService } from '../../mail/mail.service';
import { RateLimitService } from '../../rate-limit/rate-limit.service';
import type {
  IdentityProviderAccount,
  UnverifiedAccountReclaim,
  UserCredentials,
} from '../../user/repositories/user.repository';
import { UserService } from '../../user/user.service';
import { AuthenticatedSocketService } from '../../ws-handshake/authenticated-socket.service';
import {
  type GoogleIdentity,
  IdentityTokenService,
  type ProviderIdentity,
} from '../identity-providers/identity-token.service';
import { hashPassword, verifyPassword } from '../password-hashing';
import { type AuthTokenPair, AuthTokenService } from './auth-token.service';

const verificationEmailCooldown = 3 * 60 * 1000;

type IdentityProviderSessionRequest = {
  user: User;
} & Omit<UnverifiedAccountReclaim, 'userId'>;

type IdentityProviderUser = {
  user: User;
  isNewUser: boolean;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly authTokenService: AuthTokenService,
    @Inject(HTTP_CONFIG) private readonly httpConfig: HttpConfig,
    private readonly eventService: EventService,
    private readonly mailService: MailService,
    private readonly wideEventService: WideEventService,
    private readonly authenticatedSocketService: AuthenticatedSocketService,
    private readonly identityTokenService: IdentityTokenService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async signUp(dto: CreateUser, visitorId?: string): Promise<AuthResponse> {
    const { email, username, password } = dto;

    await this.userService.validateIdentifiers(username, email);

    const hash: string = await hashPassword(password);

    const user: User = await this.userService.createUser({
      email,
      username,
      type: 'email',
      password: hash,
    });

    void this.sendVerificationEmail(user).catch((error: unknown) => {
      this.wideEventService.recordOperationError(error, {
        domain: 'auth',
        operation: 'send_verification_email',
        userId: user.id,
      });
    });

    if (visitorId) {
      await this.eventService.trackEvent(
        createEvent({
          name: 'user_signed_up',
          visitorId,
          properties: {
            method: 'email',
          },
        }),
      );
    }

    const authSession: AuthSession = { user, authVersion: 0 };
    return this.createAuthResponse(authSession);
  }

  async signIn(dto: SignIn, visitorId?: string): Promise<AuthResponse> {
    const { identifier, password } = dto;

    const credentials: UserCredentials | null =
      await this.userService.findCredentialsByIdentifier(identifier);
    if (!credentials?.passwordHash)
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_CREDENTIALS,
        message: `Invalid credentials`,
      });

    const userId: UserId = credentials.authSession.user.id;
    await this.rateLimitService.assertSignInAllowed(userId);
    const isPasswordValid: boolean = await verifyPassword({
      password,
      passwordHash: credentials.passwordHash,
    });
    if (!isPasswordValid) {
      await this.rateLimitService.recordFailedSignIn(userId);
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_CREDENTIALS,
        message: `Invalid credentials`,
      });
    }
    await this.rateLimitService.clearFailedSignIns(userId);

    if (visitorId) {
      await this.eventService.trackEvent(
        createEvent({
          name: 'user_signed_in',
          visitorId,
          properties: {
            method: 'email',
          },
        }),
      );
    }

    return this.createAuthResponse(credentials.authSession);
  }

  async signInWithGoogle(
    dto: SignInWithGoogle,
    visitorId?: string,
  ): Promise<AuthResponse> {
    const { name, ...identity }: GoogleIdentity =
      await this.identityTokenService.verifyGoogleIdToken(dto.idToken);

    return this.signInWithIdentityProvider({ identity, name, visitorId });
  }

  async signInWithApple(
    dto: SignInWithApple,
    visitorId?: string,
  ): Promise<AuthResponse> {
    const { identity_token, details } = dto;

    const identity: ProviderIdentity =
      await this.identityTokenService.verifyAppleIdToken(identity_token);

    return this.signInWithIdentityProvider({
      identity,
      name: details && `${details.given_name}${details.family_name}`,
      visitorId,
    });
  }

  async refresh(authSession: AuthSession): Promise<AuthResponse> {
    return this.createAuthResponse(authSession);
  }

  async getProfile(identifier: string): Promise<User> {
    const user = await this.userService.findByIdentifier(identifier);
    if (!user)
      throw new NotFoundException({
        code: ErrorCode.USER_NOT_FOUND,
        message: `User not found`,
      });

    return user;
  }

  async deleteUser(user?: User): Promise<void> {
    if (!user)
      throw new NotFoundException({
        code: ErrorCode.USER_NOT_FOUND,
        message: `User not found`,
      });
    await this.userService.deleteUser(user.id);
  }

  async updatePassword(
    user: User,
    data: UpdatePassword,
  ): Promise<AuthResponse> {
    const credentials: UserCredentials | null =
      await this.userService.findCredentialsById(user.id);
    if (!credentials?.passwordHash)
      throw new ForbiddenException({
        code: ErrorCode.USER_NOT_VANILLA_ACCOUNT,
        message: 'Password update is only available for email accounts',
      });

    const isCurrentPasswordValid: boolean = await verifyPassword({
      password: data.currentPassword,
      passwordHash: credentials.passwordHash,
    });
    if (!isCurrentPasswordValid)
      throw new UnauthorizedException({
        code: ErrorCode.USER_CURRENT_PASSWORD_INCORRECT,
        message: 'Current password is incorrect',
      });

    const passwordHash: string = await hashPassword(data.newPassword);
    const authVersion: AuthVersion = await this.userService.updatePassword(
      user.id,
      passwordHash,
    );
    this.authenticatedSocketService.disconnectOlderSessions(
      user.id,
      authVersion,
    );

    const authSession: AuthSession = { user, authVersion };
    return this.createAuthResponse(authSession);
  }

  async resendVerificationEmail(user: User): Promise<void> {
    if (user.isVerified) return;
    await this.sendVerificationEmail(user, verificationEmailCooldown);
  }

  async renewVerificationEmail({
    verification_token,
  }: VerifyEmailData): Promise<void> {
    const user: User =
      await this.userService.findVerificationTokenOwner(verification_token);
    if (user.isVerified) return;
    await this.sendVerificationEmail(user, verificationEmailCooldown);
  }

  async updateEmail({
    user,
    email,
  }: UpdateEmail & { user: User }): Promise<User> {
    await this.rateLimitService.consumeEmailChange(user.id);
    const updatedUser: User = await this.userService.updateEmail({
      user,
      email,
    });
    if (updatedUser.email !== user.email) {
      void this.sendVerificationEmail(updatedUser).catch((error: unknown) => {
        this.wideEventService.recordOperationError(error, {
          domain: 'auth',
          operation: 'send_verification_email',
          userId: updatedUser.id,
        });
      });
    }
    return updatedUser;
  }

  async verifyEmail(verifyEmailData: VerifyEmailData): Promise<PublicUser> {
    const user = await this.userService.verifyEmail(
      verifyEmailData.verification_token,
    );

    return { id: user.id, username: user.username };
  }

  private async sendVerificationEmail(
    user: {
      id: string;
      email: string;
      username: string;
    },
    resendCooldownMs?: number,
  ): Promise<void> {
    const verificationToken =
      await this.userService.createEmailVerificationToken({
        userId: UserIdSchema.parse(user.id),
        email: user.email,
        cooldownMs: resendCooldownMs,
      });
    await this.mailService.sendMail(
      buildMailOptions('verification-email', {
        email: user.email,
        frontendUrl: this.httpConfig.frontendUrl,
        verificationToken,
        username: user.username,
      }),
    );
  }

  private async createAuthResponse(
    authSession: AuthSession,
  ): Promise<AuthResponse> {
    const authTokenPair: AuthTokenPair =
      await this.authTokenService.issueTokenPair(authSession);
    return { ...authTokenPair, user: authSession.user };
  }

  private async signInWithIdentityProvider({
    identity,
    name,
    visitorId,
  }: {
    identity: ProviderIdentity;
    name: string | undefined;
    visitorId: string | undefined;
  }): Promise<AuthResponse> {
    const { user, isNewUser }: IdentityProviderUser =
      await this.resolveIdentityProviderUser({ identity, name });

    if (visitorId) {
      await this.eventService.trackEvent(
        createEvent({
          name: isNewUser ? 'user_signed_up' : 'user_signed_in',
          visitorId,
          properties: {
            method: identity.provider,
          },
        }),
      );
    }

    const authSession: AuthSession = await this.openIdentityProviderSession({
      user,
      type: identity.provider,
    });
    return this.createAuthResponse(authSession);
  }

  private async resolveIdentityProviderUser({
    identity,
    name,
  }: {
    identity: ProviderIdentity;
    name: string | undefined;
  }): Promise<IdentityProviderUser> {
    const {
      provider,
      providerUserId,
      verifiedEmail,
      isEmailAuthoritative,
    }: ProviderIdentity = identity;
    const account: IdentityProviderAccount = { provider, providerUserId };

    const linkedUser: User | null =
      await this.userService.findByIdentityProviderAccount(account);
    if (linkedUser) return { user: linkedUser, isNewUser: false };

    if (!verifiedEmail)
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_CREDENTIALS,
        message: 'Invalid credentials',
      });

    const emailOwner: User | null =
      await this.userService.findByEmail(verifiedEmail);
    if (emailOwner) {
      const canLink: boolean =
        isEmailAuthoritative || emailOwner.type === provider;
      const user: User | null = canLink
        ? await this.userService.linkIdentityProviderAccount({
            userId: emailOwner.id,
            ...account,
          })
        : null;
      if (!user)
        throw new ConflictException({
          code: ErrorCode.USER_IDENTITY_PROVIDER_LINK_REFUSED,
          message: 'An account already exists with this email',
        });
      return { user, isNewUser: false };
    }

    const username: Username = await this.generateUniqueUsername(
      name?.trim() || verifiedEmail.slice(0, verifiedEmail.lastIndexOf('@')),
    );
    const user: User = await this.userService.createUser({
      email: verifiedEmail,
      username,
      type: provider,
      isVerified: true,
      identityProviderAccount: account,
    });
    return { user, isNewUser: true };
  }

  private async openIdentityProviderSession({
    user,
    ...reclaim
  }: IdentityProviderSessionRequest): Promise<AuthSession> {
    if (user.isVerified) return this.requireAuthSession(user.id);

    const authSession: AuthSession =
      await this.userService.reclaimUnverifiedAccount({
        userId: user.id,
        ...reclaim,
      });
    this.authenticatedSocketService.disconnectOlderSessions(
      user.id,
      authSession.authVersion,
    );
    return authSession;
  }

  private async requireAuthSession(userId: UserId): Promise<AuthSession> {
    const authSession: AuthSession | null =
      await this.userService.findAuthSessionById(userId);
    if (authSession) return authSession;

    throw new UnauthorizedException({
      code: ErrorCode.USER_NOT_FOUND,
      message: 'User not found',
    });
  }

  private async generateUniqueUsername(base: string): Promise<Username> {
    const sanitized = base.replace(/\s+/g, '').toLowerCase();

    let username: string = sanitized;
    let exists = true;

    while (exists) {
      const suffix = Math.floor(1000 + Math.random() * 9000);
      username = `${sanitized}${suffix}`;

      exists = await this.userService.existsByUsername(username);
    }

    return UsernameSchema.parse(username);
  }
}
