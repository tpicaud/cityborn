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
import { WideEventService } from '../../common/wide-event/wide-event.service';
import { HTTP_CONFIG, type HttpConfig } from '../../config/config.module';
import { buildMailOptions } from '../../mail/email-templates';
import { MailService } from '../../mail/mail.service';
import { RateLimitService } from '../../rate-limit/rate-limit.service';
import {
  PASSWORD_RESET_REPOSITORY,
  type PasswordResetRepository,
  type ResetPasswordAccount,
} from '../repositories/password-reset.repository';
import { SessionRevocationService } from './session-revocation.service';

@Injectable()
export class PasswordResetService {
  constructor(
    @Inject(PASSWORD_RESET_REPOSITORY)
    private readonly passwordResetRepository: PasswordResetRepository,
    private readonly rateLimitService: RateLimitService,
    private readonly mailService: MailService,
    private readonly wideEventService: WideEventService,
    private readonly sessionRevocationService: SessionRevocationService,
    @Inject(HTTP_CONFIG) private readonly httpConfig: HttpConfig,
  ) {}

  async request(email: string, ip: string): Promise<void> {
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
    void this.sendResetEmail(email).catch(() => {
      this.wideEventService.recordOperationError(
        new Error('Password reset delivery failed'),
        {
          domain: 'auth',
          operation: 'send_password_reset_email',
        },
      );
    });
  }

  async validateToken(token: string): Promise<void> {
    const userId: UserId | null =
      await this.passwordResetRepository.findTokenUser(
        this.hash(token),
        new Date(),
      );
    if (!userId) this.rejectToken();
  }

  async reset(data: ResetPassword): Promise<void> {
    await this.validateToken(data.token);
    const passwordHash: string = await bcrypt.hash(data.password, 10);
    const account: ResetPasswordAccount = await this.completeReset(
      this.hash(data.token),
      passwordHash,
    );
    await this.sessionRevocationService
      .disconnectOlderSessions(account.user.id, account.sessionVersion)
      .catch((error: unknown) => {
        this.wideEventService.recordOperationError(error, {
          domain: 'auth',
          operation: 'disconnect_revoked_sessions',
          userId: account.user.id,
        });
      });
    void this.mailService
      .sendMail(
        buildMailOptions('password-changed', {
          email: account.user.email,
          username: account.user.username,
        }),
      )
      .catch(() => {
        this.wideEventService.recordOperationError(
          new Error('Password change confirmation delivery failed'),
          {
            domain: 'auth',
            operation: 'send_password_changed_email',
            userId: account.user.id,
          },
        );
      });
  }

  @Transactional()
  async completeReset(
    tokenHash: string,
    passwordHash: string,
  ): Promise<ResetPasswordAccount> {
    const userId: UserId | null =
      await this.passwordResetRepository.consumeToken(tokenHash, new Date());
    if (!userId) this.rejectToken();
    return this.passwordResetRepository.updatePassword(userId, passwordHash);
  }

  private async sendResetEmail(email: string): Promise<void> {
    const user: User | null =
      await this.passwordResetRepository.findEligibleUser(email);
    if (!user) return;
    const token: string = randomBytes(32).toString('hex');
    await this.passwordResetRepository.replaceToken(
      user.id,
      this.hash(token),
      new Date(Date.now() + 30 * 60 * 1000),
    );
    await this.mailService.sendMail(
      buildMailOptions('password-reset', {
        email: user.email,
        username: user.username,
        token,
        frontendUrl: this.httpConfig.frontendUrl,
      }),
    );
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private rejectToken(): never {
    throw new UnauthorizedException({
      code: ErrorCode.USER_PASSWORD_RESET_INVALID_TOKEN,
      message: 'Invalid password reset token',
    });
  }
}
