import { createHash } from 'node:crypto';
import {
  buildUser,
  ErrorCode,
  type ResetPassword,
  type User,
} from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { compare } from 'bcrypt';
import {
  type ErrorDiagnostic,
  normalizeException,
} from '../../common/errors/exception-to-api-error';
import type { WideEventService } from '../../common/wide-event/wide-event.service';
import type { HttpConfig } from '../../config/config.module';
import type { MailService } from '../../mail/mail.service';
import {
  MailDeliveryError,
  type SendMailOptions,
} from '../../mail/providers/mail.provider';
import type { RateLimitService } from '../../rate-limit/rate-limit.service';
import type { UserCredentials } from '../../user/repositories/user.repository';
import type { UserService } from '../../user/user.service';
import type { AuthenticatedSocketService } from '../../ws-handshake/authenticated-socket.service';
import type { PasswordResetRepository } from '../repositories/password-reset.repository';
import { PasswordResetService } from './password-reset.service';

jest.mock('@nestjs-cls/transactional', () => ({
  Transactional:
    () =>
    (
      _target: object,
      _propertyKey: string | symbol,
      descriptor: PropertyDescriptor,
    ) =>
      descriptor,
}));

function createPasswordResetService() {
  const passwordResetRepository: DeepMocked<PasswordResetRepository> =
    createMock<PasswordResetRepository>();
  const rateLimitService: DeepMocked<RateLimitService> =
    createMock<RateLimitService>();
  const mailService: DeepMocked<MailService> = createMock<MailService>();
  const wideEventService: DeepMocked<WideEventService> =
    createMock<WideEventService>();
  const authenticatedSocketService: DeepMocked<AuthenticatedSocketService> =
    createMock<AuthenticatedSocketService>();
  const userService: DeepMocked<UserService> = createMock<UserService>();
  const httpConfig: HttpConfig = {
    frontendUrl: 'https://cityborn.test',
    backOfficeOrigin: 'https://admin.cityborn.test',
    corsOrigins: [],
  };
  const passwordResetService: PasswordResetService = new PasswordResetService(
    passwordResetRepository,
    rateLimitService,
    mailService,
    wideEventService,
    authenticatedSocketService,
    userService,
    httpConfig,
  );
  rateLimitService.reservePasswordResetEmail.mockResolvedValue(true);
  rateLimitService.clearFailedSignIns.mockResolvedValue(undefined);
  passwordResetRepository.replaceToken.mockResolvedValue(undefined);
  mailService.sendMail.mockResolvedValue(undefined);
  authenticatedSocketService.disconnectOlderSessions.mockReturnValue(undefined);
  return {
    passwordResetService,
    passwordResetRepository,
    rateLimitService,
    mailService,
    wideEventService,
    authenticatedSocketService,
    userService,
  };
}

async function flushBackgroundWork(): Promise<void> {
  await new Promise<void>((resolve) => setImmediate(resolve));
}

describe('PasswordResetService', () => {
  describe('request', () => {
    it.each([true, false])(
      'sends a hashed expiring token for an eligible account with verification %s',
      async (isVerified: boolean) => {
        const user: User = buildUser({ isVerified });
        const {
          passwordResetService,
          passwordResetRepository,
          mailService,
          userService,
        }: ReturnType<typeof createPasswordResetService> =
          createPasswordResetService();
        passwordResetRepository.findEligibleUser.mockResolvedValue(user);
        const before: number = Date.now();

        await passwordResetService.request({
          email: user.email,
          ip: '127.0.0.1',
        });
        await flushBackgroundWork();

        const mail: SendMailOptions | undefined =
          mailService.sendMail.mock.calls[0]?.[0];
        const link: string | undefined =
          mail?.text?.match(/https:\/\/[^\s]+/)?.[0];
        expect(link).toBeDefined();
        const token: string =
          new URLSearchParams(new URL(link ?? '').hash.slice(1)).get('token') ??
          '';
        expect(token).toMatch(/^[a-f0-9]{64}$/);
        expect(passwordResetRepository.replaceToken).toHaveBeenCalledWith({
          userId: user.id,
          tokenHash: createHash('sha256').update(token).digest('hex'),
          expiresAt: expect.any(Date),
        });
        const expiresAt: Date | undefined =
          passwordResetRepository.replaceToken.mock.calls[0]?.[0].expiresAt;
        expect(expiresAt?.getTime()).toBeGreaterThanOrEqual(
          before + 30 * 60 * 1000,
        );
        expect(expiresAt?.getTime()).toBeLessThanOrEqual(
          Date.now() + 30 * 60 * 1000,
        );
        expect(userService.updatePassword).not.toHaveBeenCalled();
      },
    );

    it('responds without waiting for account lookup or email delivery', async () => {
      const {
        passwordResetService,
        passwordResetRepository,
      }: ReturnType<typeof createPasswordResetService> =
        createPasswordResetService();
      passwordResetRepository.findEligibleUser.mockReturnValue(
        new Promise<User | null>(() => undefined),
      );

      await expect(
        passwordResetService.request({
          email: 'unknown@cityborn.test',
          ip: 'ip',
        }),
      ).resolves.toBeUndefined();
    });

    it('does not send mail for an unknown or ineligible address', async () => {
      const {
        passwordResetService,
        passwordResetRepository,
        mailService,
      }: ReturnType<typeof createPasswordResetService> =
        createPasswordResetService();
      passwordResetRepository.findEligibleUser.mockResolvedValue(null);

      await passwordResetService.request({
        email: 'unknown@cityborn.test',
        ip: 'ip',
      });
      await flushBackgroundWork();

      expect(mailService.sendMail).not.toHaveBeenCalled();
      expect(passwordResetRepository.replaceToken).not.toHaveBeenCalled();
    });

    it('preserves the existing link when the address is limited', async () => {
      const {
        passwordResetService,
        passwordResetRepository,
        rateLimitService,
      }: ReturnType<typeof createPasswordResetService> =
        createPasswordResetService();
      rateLimitService.reservePasswordResetEmail.mockResolvedValue(false);

      await passwordResetService.request({
        email: 'host@cityborn.test',
        ip: 'ip',
      });

      expect(passwordResetRepository.findEligibleUser).not.toHaveBeenCalled();
      expect(passwordResetRepository.replaceToken).not.toHaveBeenCalled();
    });

    it('records delivery failures without including the token or changing the response', async () => {
      const user: User = buildUser();
      const {
        passwordResetService,
        passwordResetRepository,
        mailService,
        wideEventService,
      }: ReturnType<typeof createPasswordResetService> =
        createPasswordResetService();
      passwordResetRepository.findEligibleUser.mockResolvedValue(user);
      mailService.sendMail.mockRejectedValue(
        new MailDeliveryError({
          category: 'http',
          provider: 'brevo',
          statusCode: 503,
        }),
      );

      await expect(
        passwordResetService.request({ email: user.email, ip: 'ip' }),
      ).resolves.toBeUndefined();
      await flushBackgroundWork();

      expect(wideEventService.recordOperationError).toHaveBeenCalledWith(
        expect.any(Error),
        { domain: 'auth', operation: 'send_password_reset_email' },
      );
      const diagnostic: ErrorDiagnostic = normalizeException(
        wideEventService.recordOperationError.mock.calls[0]?.[0],
      ).diagnostic;
      expect(diagnostic.causes).toEqual([
        expect.objectContaining({
          message:
            'Mail delivery failed (category=http; provider=brevo; status=503)',
        }),
      ]);
      expect(JSON.stringify(diagnostic)).not.toContain(user.email);
    });
  });

  describe('request persistence failures', () => {
    it('records a database code without leaking token hashes or changing the public response', async () => {
      const user: User = buildUser();
      const {
        passwordResetService,
        passwordResetRepository,
        mailService,
        wideEventService,
      }: ReturnType<typeof createPasswordResetService> =
        createPasswordResetService();
      passwordResetRepository.findEligibleUser.mockResolvedValue(user);
      passwordResetRepository.replaceToken.mockRejectedValue(
        Object.assign(
          new Error('Prisma query tokenHash=secret-hash email=secret-email'),
          { code: 'P2024', meta: { tokenHash: 'secret-hash' } },
        ),
      );

      await expect(
        passwordResetService.request({ email: user.email, ip: 'ip' }),
      ).resolves.toBeUndefined();
      await flushBackgroundWork();

      expect(mailService.sendMail).not.toHaveBeenCalled();
      const diagnostic: ErrorDiagnostic = normalizeException(
        wideEventService.recordOperationError.mock.calls[0]?.[0],
      ).diagnostic;
      expect(diagnostic.causes).toEqual([
        expect.objectContaining({
          message: 'Password reset failure (category=database; code=P2024)',
        }),
      ]);
      expect(JSON.stringify(diagnostic)).not.toContain('secret-hash');
      expect(JSON.stringify(diagnostic)).not.toContain('secret-email');
    });
  });

  describe('validateToken', () => {
    it('rejects an invalid, consumed or expired token', async () => {
      const {
        passwordResetService,
        passwordResetRepository,
      }: ReturnType<typeof createPasswordResetService> =
        createPasswordResetService();
      passwordResetRepository.findTokenUser.mockResolvedValue(null);

      await expect(
        passwordResetService.validateToken('missing'),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.USER_PASSWORD_RESET_INVALID_TOKEN },
      });
    });

    it('does not consume a valid token when opening the link', async () => {
      const user: User = buildUser();
      const {
        passwordResetService,
        passwordResetRepository,
      }: ReturnType<typeof createPasswordResetService> =
        createPasswordResetService();
      passwordResetRepository.findTokenUser.mockResolvedValue(user.id);

      await passwordResetService.validateToken('token');

      expect(passwordResetRepository.consumeToken).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('does not clear failures, disconnect sessions or send confirmation when the transaction fails', async () => {
      const user: User = buildUser();
      const {
        passwordResetService,
        passwordResetRepository,
        authenticatedSocketService,
        mailService,
        rateLimitService,
        userService,
      }: ReturnType<typeof createPasswordResetService> =
        createPasswordResetService();
      const credentials: UserCredentials = {
        authSession: { user, authVersion: 2 },
        passwordHash: 'old-hash',
      };
      passwordResetRepository.findTokenUser.mockResolvedValue(user.id);
      passwordResetRepository.consumeToken.mockResolvedValue(user.id);
      userService.findCredentialsById.mockResolvedValue(credentials);
      userService.updatePassword.mockRejectedValue(new Error('write failed'));
      const resetPassword: ResetPassword = {
        token: 'token',
        password: 'NewPass1',
        confirmPassword: 'NewPass1',
      };

      await expect(passwordResetService.reset(resetPassword)).rejects.toThrow(
        'write failed',
      );

      expect(rateLimitService.clearFailedSignIns).not.toHaveBeenCalled();
      expect(
        authenticatedSocketService.disconnectOlderSessions,
      ).not.toHaveBeenCalled();
      expect(mailService.sendMail).not.toHaveBeenCalled();
    });

    it('rejects a token consumed after validation without updating the password', async () => {
      const user: User = buildUser();
      const {
        passwordResetService,
        passwordResetRepository,
        userService,
        rateLimitService,
      }: ReturnType<typeof createPasswordResetService> =
        createPasswordResetService();
      passwordResetRepository.findTokenUser.mockResolvedValue(user.id);
      passwordResetRepository.consumeToken.mockResolvedValue(null);
      const resetPassword: ResetPassword = {
        token: 'token',
        password: 'NewPass1',
        confirmPassword: 'NewPass1',
      };

      await expect(
        passwordResetService.reset(resetPassword),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.USER_PASSWORD_RESET_INVALID_TOKEN },
      });

      expect(userService.updatePassword).not.toHaveBeenCalled();
      expect(rateLimitService.clearFailedSignIns).not.toHaveBeenCalled();
    });

    it.each([null, { passwordHash: null }])(
      'rejects when eligible credentials no longer exist: %s',
      async (missingCredentials: { passwordHash: null } | null) => {
        const user: User = buildUser();
        const {
          passwordResetService,
          passwordResetRepository,
          userService,
        }: ReturnType<typeof createPasswordResetService> =
          createPasswordResetService();
        const credentials: UserCredentials | null = missingCredentials
          ? { authSession: { user, authVersion: 2 }, passwordHash: null }
          : null;
        passwordResetRepository.findTokenUser.mockResolvedValue(user.id);
        passwordResetRepository.consumeToken.mockResolvedValue(user.id);
        userService.findCredentialsById.mockResolvedValue(credentials);
        const resetPassword: ResetPassword = {
          token: 'token',
          password: 'NewPass1',
          confirmPassword: 'NewPass1',
        };

        await expect(
          passwordResetService.reset(resetPassword),
        ).rejects.toMatchObject({
          response: { code: ErrorCode.USER_PASSWORD_RESET_INVALID_TOKEN },
        });

        expect(userService.updatePassword).not.toHaveBeenCalled();
      },
    );

    it('hashes the password, clears failed sign-ins, revokes sockets and sends confirmation without returning a session', async () => {
      const user: User = buildUser();
      const {
        passwordResetService,
        passwordResetRepository,
        authenticatedSocketService,
        mailService,
        rateLimitService,
        userService,
      }: ReturnType<typeof createPasswordResetService> =
        createPasswordResetService();
      const credentials: UserCredentials = {
        authSession: { user, authVersion: 2 },
        passwordHash: 'old-hash',
      };
      const resetPassword: ResetPassword = {
        token: 'token',
        password: 'NewPass1',
        confirmPassword: 'NewPass1',
      };
      passwordResetRepository.findTokenUser.mockResolvedValue(user.id);
      passwordResetRepository.consumeToken.mockResolvedValue(user.id);
      userService.findCredentialsById.mockResolvedValue(credentials);
      userService.updatePassword.mockResolvedValue(3);

      await expect(
        passwordResetService.reset(resetPassword),
      ).resolves.toBeUndefined();

      expect(passwordResetRepository.consumeToken).toHaveBeenCalledWith({
        tokenHash: createHash('sha256')
          .update(resetPassword.token)
          .digest('hex'),
        now: expect.any(Date),
      });
      const passwordHash: string =
        userService.updatePassword.mock.calls[0]?.[1] ?? '';
      expect(await compare(resetPassword.password, passwordHash)).toBe(true);
      expect(rateLimitService.clearFailedSignIns).toHaveBeenCalledWith(user.id);
      expect(
        authenticatedSocketService.disconnectOlderSessions,
      ).toHaveBeenCalledWith(user.id, 3);
      expect(mailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: user.email,
          subject: 'Votre mot de passe Cityborn a été modifié',
        }),
      );
      expect(mailService.sendMail.mock.calls[0]?.[0].text).not.toContain(
        resetPassword.password,
      );
    });

    it('preserves reset success, socket revocation and confirmation when clearing failed sign-ins fails', async () => {
      const user: User = buildUser();
      const {
        passwordResetService,
        passwordResetRepository,
        authenticatedSocketService,
        mailService,
        rateLimitService,
        userService,
        wideEventService,
      }: ReturnType<typeof createPasswordResetService> =
        createPasswordResetService();
      const credentials: UserCredentials = {
        authSession: { user, authVersion: 2 },
        passwordHash: 'old-hash',
      };
      const resetPassword: ResetPassword = {
        token: 'secret-token',
        password: 'NewPass1',
        confirmPassword: 'NewPass1',
      };
      passwordResetRepository.findTokenUser.mockResolvedValue(user.id);
      passwordResetRepository.consumeToken.mockResolvedValue(user.id);
      userService.findCredentialsById.mockResolvedValue(credentials);
      userService.updatePassword.mockResolvedValue(3);
      rateLimitService.clearFailedSignIns.mockRejectedValue(
        Object.assign(new Error('redis://secret-password@host'), {
          code: 'ECONNREFUSED',
        }),
      );

      await expect(
        passwordResetService.reset(resetPassword),
      ).resolves.toBeUndefined();

      expect(
        authenticatedSocketService.disconnectOlderSessions,
      ).toHaveBeenCalledWith(user.id, 3);
      expect(mailService.sendMail).toHaveBeenCalled();
      expect(wideEventService.recordOperationError).toHaveBeenCalledWith(
        expect.any(Error),
        {
          domain: 'auth',
          operation: 'clear_password_reset_failed_sign_ins',
          userId: user.id,
        },
      );
      const diagnostic: ErrorDiagnostic = normalizeException(
        wideEventService.recordOperationError.mock.calls[0]?.[0],
      ).diagnostic;
      expect(diagnostic.causes).toEqual([
        expect.objectContaining({
          message:
            'Password reset failure (category=network; code=ECONNREFUSED)',
        }),
      ]);
      expect(JSON.stringify(diagnostic)).not.toContain('secret-password');
    });

    it('preserves reset success and records a safe confirmation failure', async () => {
      const user: User = buildUser();
      const {
        passwordResetService,
        passwordResetRepository,
        authenticatedSocketService,
        mailService,
        userService,
        wideEventService,
      }: ReturnType<typeof createPasswordResetService> =
        createPasswordResetService();
      const credentials: UserCredentials = {
        authSession: { user, authVersion: 2 },
        passwordHash: 'old-hash',
      };
      const resetPassword: ResetPassword = {
        token: 'secret-token',
        password: 'NewPass1',
        confirmPassword: 'NewPass1',
      };
      passwordResetRepository.findTokenUser.mockResolvedValue(user.id);
      passwordResetRepository.consumeToken.mockResolvedValue(user.id);
      userService.findCredentialsById.mockResolvedValue(credentials);
      userService.updatePassword.mockResolvedValue(3);
      mailService.sendMail.mockRejectedValue(
        new MailDeliveryError({
          category: 'network',
          provider: 'brevo',
          cause: Object.assign(new Error('provider echoed secret-token'), {
            code: 'ETIMEDOUT',
          }),
        }),
      );

      await expect(
        passwordResetService.reset(resetPassword),
      ).resolves.toBeUndefined();
      await flushBackgroundWork();

      expect(
        authenticatedSocketService.disconnectOlderSessions,
      ).toHaveBeenCalledWith(user.id, 3);
      expect(wideEventService.recordOperationError).toHaveBeenCalledWith(
        expect.any(Error),
        {
          domain: 'auth',
          operation: 'send_password_changed_email',
          userId: user.id,
        },
      );
      const diagnostic: ErrorDiagnostic = normalizeException(
        wideEventService.recordOperationError.mock.calls[0]?.[0],
      ).diagnostic;
      expect(diagnostic.causes).toEqual([
        expect.objectContaining({
          message:
            'Mail delivery failed (category=network; provider=brevo; status=unknown)',
        }),
        expect.objectContaining({
          message: 'Mail delivery cause (code=ETIMEDOUT)',
        }),
      ]);
      expect(JSON.stringify(diagnostic)).not.toContain(resetPassword.token);
      expect(JSON.stringify(diagnostic)).not.toContain(resetPassword.password);
    });
  });
});
