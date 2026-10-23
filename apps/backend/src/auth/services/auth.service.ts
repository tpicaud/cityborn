import {
  type AuthResponse,
  type CreateUser,
  ErrorCode,
  type PublicUser,
  type RequestPasswordReset,
  type ResetPassword,
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
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { AuthSession, AuthVersion } from '../../common/types/auth-session';
import { WideEventService } from '../../common/wide-event/wide-event.service';
import { HTTP_CONFIG, type HttpConfig } from '../../config/config.module';
import { EventService } from '../../event/event.service';
import { createEvent } from '../../event/event.types';
import { buildMailOptions } from '../../mail/email-templates';
import { MailService } from '../../mail/mail.service';
import type { SendMailOptions } from '../../mail/providers/mail.provider';
import { RateLimitService } from '../../rate-limit/rate-limit.service';
import type {
  UnverifiedAccountReclaim,
  UserCredentials,
} from '../../user/repositories/user.repository';
import { type PasswordResetGrant, UserService } from '../../user/user.service';
import { AuthenticatedSocketService } from '../../ws-handshake/authenticated-socket.service';
import {
  type AppleIdentity,
  type GoogleIdentity,
  IdentityTokenService,
} from '../identity-providers/identity-token.service';
import { type AuthTokenPair, AuthTokenService } from './auth-token.service';

const verificationEmailCooldown = 3 * 60 * 1000;

type IdentityProviderSessionRequest = {
  user: User;
} & Omit<UnverifiedAccountReclaim, 'userId'>;

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

    const user: User = await this.createEmailAccount({
      email,
      username,
      passwordHash: await bcrypt.hash(password, 10),
      visitorId,
    });

    const authSession: AuthSession = { user, authVersion: 0 };
    return this.createAuthResponse(authSession);
  }

  async register({
    registration,
    visitorId,
    clientIp,
  }: {
    registration: CreateUser;
    visitorId?: string;
    clientIp: string;
  }): Promise<void> {
    const { email, username, password }: CreateUser = registration;

    await this.rateLimitService.consumeAccountEmail({ email, clientIp });
    await this.userService.assertUsernameAvailable(username);
    const passwordHash: string = await bcrypt.hash(password, 10);

    const existingUser: User | null = await this.userService.findByEmail(email);
    if (existingUser) {
      this.sendMailInBackground({
        operation: 'send_existing_account_email',
        userId: existingUser.id,
        mailOptions: buildMailOptions('existing-account-email', {
          email: existingUser.email,
          frontendUrl: this.httpConfig.frontendUrl,
          username: existingUser.username,
        }),
      });
      return;
    }

    await this.createEmailAccount({ email, username, passwordHash, visitorId });
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
    const isPasswordValid = await bcrypt.compare(
      password,
      credentials.passwordHash,
    );
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
    const { idToken } = dto;

    const { email, name }: GoogleIdentity =
      await this.identityTokenService.verifyGoogleIdToken(idToken);

    let user = await this.userService.findByIdentifier(email);

    if (user && visitorId) {
      await this.eventService.trackEvent(
        createEvent({
          name: 'user_signed_in',
          visitorId,
          properties: {
            method: 'google',
          },
        }),
      );
    }

    if (!user) {
      const uniqueUsername = await this.generateUniqueUsername(name);

      user = await this.userService.createUser({
        email,
        username: uniqueUsername,
        type: 'google',
        isVerified: true,
      });

      if (visitorId) {
        await this.eventService.trackEvent(
          createEvent({
            name: 'user_signed_up',
            visitorId,
            properties: {
              method: 'google',
            },
          }),
        );
      }
    }

    const authSession: AuthSession = await this.openIdentityProviderSession({
      user,
      type: 'google',
    });
    return this.createAuthResponse(authSession);
  }

  async signInWithApple(
    dto: SignInWithApple,
    visitorId?: string,
  ): Promise<AuthResponse> {
    const { identity_token, details } = dto;

    const { appleUserId, verifiedEmail }: AppleIdentity =
      await this.identityTokenService.verifyAppleIdToken(identity_token);

    let user = await this.userService.findByAppleId(appleUserId);

    if (user && visitorId) {
      await this.eventService.trackEvent(
        createEvent({
          name: 'user_signed_in',
          visitorId,
          properties: {
            method: 'apple',
          },
        }),
      );
    }

    if (!user) {
      if (!details || !verifiedEmail) {
        throw new UnauthorizedException({
          code: ErrorCode.USER_INVALID_CREDENTIALS,
          message: `Invalid credentials`,
        });
      }

      user = await this.userService.findByIdentifier(verifiedEmail);
      if (!user) {
        const uniqueUsername = await this.generateUniqueUsername(
          `${details.given_name}${details.family_name}`,
        );

        user = await this.userService.createUser({
          email: verifiedEmail,
          username: uniqueUsername,
          type: 'apple',
          appleId: appleUserId,
          isVerified: true,
        });

        if (visitorId) {
          await this.eventService.trackEvent(
            createEvent({
              name: 'user_signed_up',
              visitorId,
              properties: {
                method: 'apple',
              },
            }),
          );
        }
      }
    }

    const authSession: AuthSession = await this.openIdentityProviderSession({
      user,
      type: 'apple',
      appleId: appleUserId,
    });
    return this.createAuthResponse(authSession);
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

    const isCurrentPasswordValid: boolean = await bcrypt.compare(
      data.currentPassword,
      credentials.passwordHash,
    );
    if (!isCurrentPasswordValid)
      throw new UnauthorizedException({
        code: ErrorCode.USER_CURRENT_PASSWORD_INCORRECT,
        message: 'Current password is incorrect',
      });

    const passwordHash: string = await bcrypt.hash(data.newPassword, 10);
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

  async requestPasswordReset({
    email,
    clientIp,
  }: RequestPasswordReset & { clientIp: string }): Promise<void> {
    await this.rateLimitService.consumeAccountEmail({ email, clientIp });

    const user: User | null = await this.userService.findByEmail(email);
    if (!user) return;

    const { passwordResetToken, validityMinutes }: PasswordResetGrant =
      await this.userService.createPasswordResetToken(user.id);
    this.sendMailInBackground({
      operation: 'send_password_reset_email',
      userId: user.id,
      mailOptions: buildMailOptions('password-reset-email', {
        email: user.email,
        frontendUrl: this.httpConfig.frontendUrl,
        passwordResetToken,
        username: user.username,
        validityMinutes,
      }),
    });
  }

  async resetPassword({
    passwordResetToken,
    newPassword,
  }: ResetPassword): Promise<void> {
    const passwordHash: string = await bcrypt.hash(newPassword, 10);
    const { user, authVersion }: AuthSession =
      await this.userService.resetPassword({
        passwordResetToken,
        passwordHash,
      });

    this.authenticatedSocketService.disconnectOlderSessions(
      user.id,
      authVersion,
    );
    await this.rateLimitService.clearFailedSignIns(user.id);
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
      this.sendVerificationEmailInBackground(updatedUser);
    }
    return updatedUser;
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

  async verifyEmail(verifyEmailData: VerifyEmailData): Promise<PublicUser> {
    const user = await this.userService.verifyEmail(
      verifyEmailData.verification_token,
    );

    return { id: user.id, username: user.username };
  }

  private async createEmailAccount({
    email,
    username,
    passwordHash,
    visitorId,
  }: {
    email: string;
    username: Username;
    passwordHash: string;
    visitorId?: string;
  }): Promise<User> {
    const user: User = await this.userService.createUser({
      email,
      username,
      type: 'email',
      password: passwordHash,
    });

    this.sendVerificationEmailInBackground(user);

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

    return user;
  }

  private sendVerificationEmailInBackground(user: User): void {
    void this.sendVerificationEmail(user).catch((error: unknown) => {
      this.wideEventService.recordOperationError(error, {
        domain: 'auth',
        operation: 'send_verification_email',
        userId: user.id,
      });
    });
  }

  private sendMailInBackground({
    operation,
    userId,
    mailOptions,
  }: {
    operation: string;
    userId: UserId;
    mailOptions: SendMailOptions;
  }): void {
    void this.mailService.sendMail(mailOptions).catch((error: unknown) => {
      this.wideEventService.recordOperationError(error, {
        domain: 'auth',
        operation,
        userId,
      });
    });
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
      await this.userService.createEmailVerificationToken(
        UserIdSchema.parse(user.id),
        resendCooldownMs,
      );
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
