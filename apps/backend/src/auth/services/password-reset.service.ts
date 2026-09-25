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
import { RateLimitService } from '../../rate-limit/rate-limit.service';
import type { UserCredentials } from '../../user/repositories/user.repository';
import { UserService } from '../../user/user.service';
import { AuthenticatedSocketService } from '../../ws-handshake/authenticated-socket.service';
import {
  PASSWORD_RESET_REPOSITORY,
  type PasswordResetRepository,
} from '../repositories/password-reset.repository';

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
    const authSession: AuthSession = await this.completeReset(
      this.hash(data.token),
      passwordHash,
    );
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
        this.wideEventService.recordOperationError(
          new Error('Password change confirmation delivery failed'),
          {
            domain: 'auth',
            operation: 'send_password_changed_email',
            userId: authSession.user.id,
          },
        );
      });
  }

  @Transactional()
  async completeReset(
    tokenHash: string,
    passwordHash: string,
  ): Promise<AuthSession> {
    const userId: UserId | null =
      await this.passwordResetRepository.consumeToken(tokenHash, new Date());
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
