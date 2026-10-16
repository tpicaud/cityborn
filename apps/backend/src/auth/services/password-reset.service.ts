import { createHash, randomBytes } from 'node:crypto';
import {
  ErrorCode,
  type ResetPassword,
  type User,
  type UserId,
} from '@cityborn/api';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import * as bcrypt from 'bcrypt';
import type { RateLimiterRes } from 'rate-limiter-flexible';
import type { AuthSession, AuthVersion } from '../../common/types/auth-session';
import { WideEventService } from '../../common/wide-event/wide-event.service';
import { HTTP_CONFIG, type HttpConfig } from '../../config/config.module';
import { buildMailOptions } from '../../mail/email-templates';
import { MailService } from '../../mail/mail.service';
import { MailDeliveryError } from '../../mail/providers/mail.provider';
import { RateLimitService } from '../../rate-limit/rate-limit.service';
import type { UserCredentials } from '../../user/repositories/user.repository';
import { UserService } from '../../user/user.service';
import { AuthenticatedSocketService } from '../../ws-handshake/authenticated-socket.service';
import {
  PASSWORD_RESET_REPOSITORY,
  type PasswordResetRepository,
} from '../repositories/password-reset.repository';

const PASSWORD_RESET_TOKEN_VALIDITY_MINUTES: number = 30;

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
    this.wideEventService.enrichRateLimit({
      rateLimitBucket: 'rl:password-reset:ip',
      rateLimitStatus: 'pending',
    });
    const limit: RateLimiterRes =
      await this.rateLimitService.consumePasswordReset(ip);
    this.wideEventService.enrichRateLimit({
      rateLimitBucket: 'rl:password-reset:ip',
      rateLimitStatus: 'allowed',
      rateLimitRemaining: limit.remainingPoints,
    });
    const accepted: boolean =
      await this.rateLimitService.reservePasswordResetEmail(
        this.hash(email.toLowerCase()),
      );
    if (!accepted) return;
    void this.sendResetEmail(email).catch((error: unknown) => {
      this.recordBackgroundFailure({
        error,
        operation: 'send_password_reset_email',
      });
    });
  }

  async validateToken(token: string): Promise<void> {
    const userId: UserId | null =
      await this.passwordResetRepository.findTokenUser({
        tokenHash: this.hash(token),
        now: new Date(),
      });
    if (!userId) this.rejectToken();
  }

  async reset(resetPassword: ResetPassword): Promise<void> {
    await this.validateToken(resetPassword.token);
    const passwordHash: string = await bcrypt.hash(resetPassword.password, 10);
    const authSession: AuthSession = await this.completeReset({
      tokenHash: this.hash(resetPassword.token),
      passwordHash,
    });
    try {
      await this.rateLimitService.clearFailedSignIns(authSession.user.id);
    } catch (error: unknown) {
      this.recordBackgroundFailure({
        error,
        operation: 'clear_password_reset_failed_sign_ins',
        userId: authSession.user.id,
      });
    }
    this.authenticatedSocketService.disconnectOlderSessions(
      authSession.user.id,
      authSession.authVersion,
    );
    void this.mailService
      .sendMail(
        buildMailOptions({
          templateName: 'password-changed',
          templateParams: {
            email: authSession.user.email,
            username: authSession.user.username,
          },
        }),
      )
      .catch((error: unknown) => {
        this.recordBackgroundFailure({
          error,
          operation: 'send_password_changed_email',
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
    return { user: credentials.authSession.user, authVersion };
  }

  private async sendResetEmail(email: string): Promise<void> {
    const user: User | null =
      await this.passwordResetRepository.findEligibleUser(email);
    if (!user) return;
    const token: string = randomBytes(32).toString('hex');
    await this.passwordResetRepository.replaceToken({
      userId: user.id,
      tokenHash: this.hash(token),
      expiresAt: new Date(
        Date.now() + PASSWORD_RESET_TOKEN_VALIDITY_MINUTES * 60 * 1000,
      ),
    });
    await this.mailService.sendMail(
      buildMailOptions({
        templateName: 'password-reset',
        templateParams: {
          email: user.email,
          username: user.username,
          token,
          frontendUrl: this.httpConfig.frontendUrl,
          validityDurationMinutes: PASSWORD_RESET_TOKEN_VALIDITY_MINUTES,
        },
      }),
    );
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private recordBackgroundFailure({
    error,
    operation,
    userId,
  }: {
    error: unknown;
    operation:
      | 'send_password_reset_email'
      | 'send_password_changed_email'
      | 'clear_password_reset_failed_sign_ins';
    userId?: UserId;
  }): void {
    const cause: Error =
      error instanceof MailDeliveryError
        ? error
        : this.safeFailureCause({ error, remainingDepth: 3 });
    this.wideEventService.recordOperationError(
      new Error('Password reset background operation failed', { cause }),
      { domain: 'auth', operation, ...(userId ? { userId } : {}) },
    );
  }

  private safeFailureCause({
    error,
    remainingDepth,
  }: {
    error: unknown;
    remainingDepth: number;
  }): Error {
    if (typeof error !== 'object' || error === null || remainingDepth === 0) {
      return new Error('Password reset failure (category=unexpected)');
    }
    const code: unknown = 'code' in error ? error.code : undefined;
    if (typeof code === 'string' && /^P\d{4}$/.test(code)) {
      return new Error(
        `Password reset failure (category=database; code=${code})`,
      );
    }
    const networkCodes: string[] = [
      'ECONNREFUSED',
      'ECONNRESET',
      'ENOTFOUND',
      'EAI_AGAIN',
      'ETIMEDOUT',
    ];
    if (typeof code === 'string' && networkCodes.includes(code)) {
      return new Error(
        `Password reset failure (category=network; code=${code})`,
      );
    }
    return this.safeFailureCause({
      error: 'cause' in error ? error.cause : undefined,
      remainingDepth: remainingDepth - 1,
    });
  }

  private rejectToken(): never {
    throw new UnauthorizedException({
      code: ErrorCode.USER_PASSWORD_RESET_INVALID_TOKEN,
      message: 'Invalid password reset token',
    });
  }
}
