import { createHash, randomBytes } from 'node:crypto';
import {
  ErrorCode,
  type ResetPassword,
  type User,
  type UserId,
} from '@cityborn/api';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import type { AuthSession, AuthVersion } from '../../common/types/auth-session';
import { WideEventService } from '../../common/wide-event/wide-event.service';
import { HTTP_CONFIG, type HttpConfig } from '../../config/config.module';
import { buildMailOptions } from '../../mail/email-templates';
import { MailService } from '../../mail/mail.service';
import { RateLimitService } from '../../rate-limit/rate-limit.service';
import type { UserCredentials } from '../../user/repositories/user.repository';
import { UserService } from '../../user/user.service';
import { AuthenticatedSocketService } from '../../ws-handshake/authenticated-socket.service';
import { hashPassword } from '../password-hashing';
import {
  PASSWORD_RESET_REPOSITORY,
  type PasswordResetRepository,
} from '../repositories/password-reset.repository';

const PASSWORD_RESET_TOKEN_VALIDITY_MINUTES: number = 30;

type PasswordResetFailureStage =
  | 'account_lookup'
  | 'token_persistence'
  | 'email_delivery'
  | 'sign_in_cleanup';

@Injectable()
export class PasswordResetService {
  constructor(
    @Inject(PASSWORD_RESET_REPOSITORY)
    private readonly passwordResetRepository: PasswordResetRepository,
    private readonly rateLimitService: RateLimitService,
    private readonly mailService: MailService,
    private readonly wideEventService: WideEventService,
    private readonly authenticatedSocketService: AuthenticatedSocketService,
    private readonly userService: UserService,
    @Inject(HTTP_CONFIG) private readonly httpConfig: HttpConfig,
  ) {}

  async request({ email, ip }: { email: string; ip: string }): Promise<void> {
    await this.rateLimitService.consumePasswordReset(ip);
    const accepted: boolean =
      await this.rateLimitService.reservePasswordResetEmail(
        this.hash(email.toLowerCase()),
      );
    if (!accepted) return;
    void this.sendResetEmail(email);
  }

  async reset(resetPassword: ResetPassword): Promise<void> {
    const passwordHash: string = await hashPassword(resetPassword.password);
    const authSession: AuthSession = await this.completeReset({
      tokenHash: this.hash(resetPassword.token),
      passwordHash,
    });
    try {
      await this.rateLimitService.clearFailedSignIns(authSession.user.id);
    } catch {
      this.recordBackgroundFailure({
        operation: 'clear_password_reset_failed_sign_ins',
        stage: 'sign_in_cleanup',
        userId: authSession.user.id,
      });
    }
    this.authenticatedSocketService.disconnectOlderSessions(
      authSession.user.id,
      authSession.authVersion,
    );
    void this.mailService
      .sendMail(
        buildMailOptions('password-changed', {
          email: authSession.user.email,
          username: authSession.user.username,
        }),
      )
      .catch(() => {
        this.recordBackgroundFailure({
          operation: 'send_password_changed_email',
          stage: 'email_delivery',
          userId: authSession.user.id,
        });
      });
  }

  @Transactional()
  private async completeReset({
    tokenHash,
    passwordHash,
  }: {
    tokenHash: string;
    passwordHash: string;
  }): Promise<AuthSession> {
    const userId: UserId | null =
      await this.passwordResetRepository.consumeToken({
        tokenHash,
        now: new Date(),
      });
    if (!userId) this.rejectToken();
    const credentials: UserCredentials | null =
      await this.userService.findCredentialsById(userId);
    if (!credentials?.passwordHash) this.rejectToken();
    const authVersion: AuthVersion = await this.userService.updatePassword(
      userId,
      passwordHash,
    );
    const user: User = credentials.authSession.user.isVerified
      ? credentials.authSession.user
      : ((await this.userService.verifyEmailOwnership({
          userId,
          email: credentials.authSession.user.email,
        })) ?? this.rejectToken());
    return { user, authVersion };
  }

  private async sendResetEmail(email: string): Promise<void> {
    let stage: PasswordResetFailureStage = 'account_lookup';
    try {
      const authSession: AuthSession | null =
        await this.userService.findPasswordResetAuthSession(email);
      if (!authSession) return;
      stage = 'token_persistence';
      const token: string = randomBytes(32).toString('hex');
      const stored: boolean = await this.passwordResetRepository.replaceToken({
        userId: authSession.user.id,
        email: authSession.user.email,
        authVersion: authSession.authVersion,
        tokenHash: this.hash(token),
        expiresAt: new Date(
          Date.now() + PASSWORD_RESET_TOKEN_VALIDITY_MINUTES * 60 * 1000,
        ),
      });
      if (!stored) return;
      stage = 'email_delivery';
      await this.mailService.sendMail(
        buildMailOptions('password-reset', {
          email: authSession.user.email,
          username: authSession.user.username,
          token,
          frontendUrl: this.httpConfig.frontendUrl,
          validityDurationMinutes: PASSWORD_RESET_TOKEN_VALIDITY_MINUTES,
        }),
      );
    } catch {
      this.recordBackgroundFailure({
        operation: 'send_password_reset_email',
        stage,
      });
    }
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private recordBackgroundFailure({
    operation,
    stage,
    userId,
  }: {
    operation:
      | 'send_password_reset_email'
      | 'send_password_changed_email'
      | 'clear_password_reset_failed_sign_ins';
    stage: PasswordResetFailureStage;
    userId?: UserId;
  }): void {
    this.wideEventService.recordOperationError(
      new Error(`Password reset background operation failed: ${stage}`),
      { domain: 'auth', operation, ...(userId ? { userId } : {}) },
    );
  }

  private rejectToken(): never {
    throw new UnauthorizedException({
      code: ErrorCode.USER_INVALID_TOKEN,
      message: 'Invalid password reset token',
    });
  }
}
