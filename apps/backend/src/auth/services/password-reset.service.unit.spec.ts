import { createHash } from 'node:crypto';
import {
  buildUser,
  ErrorCode,
  type ResetPassword,
  type User,
} from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import type { WideEventService } from '../../common/wide-event/wide-event.service';
import type { HttpConfig } from '../../config/config.module';
import type { MailService } from '../../mail/mail.service';
import type { SendMailOptions } from '../../mail/providers/mail.provider';
import type { RateLimitService } from '../../rate-limit/rate-limit.service';
import type { UserService } from '../../user/user.service';
import type { AuthenticatedSocketService } from '../../ws-handshake/authenticated-socket.service';
import type { PasswordResetRepository } from '../repositories/password-reset.repository';
import { PasswordResetService } from './password-reset.service';

function createService() {
  const repository: DeepMocked<PasswordResetRepository> =
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
    corsOrigins: [],
  };
  const passwordResetService: PasswordResetService = new PasswordResetService(
    repository,
    rateLimitService,
    mailService,
    wideEventService,
    authenticatedSocketService,
    userService,
    httpConfig,
  );
  rateLimitService.reservePasswordResetEmail.mockResolvedValue(true);
  repository.replaceToken.mockResolvedValue(undefined);
  mailService.sendMail.mockResolvedValue(undefined);
  authenticatedSocketService.disconnectOlderSessions.mockReturnValue(undefined);
  return {
    passwordResetService,
    repository,
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
          repository,
          mailService,
          userService,
        }: ReturnType<typeof createService> = createService();
        repository.findEligibleUser.mockResolvedValue(user);
        const before: number = Date.now();

        await passwordResetService.request(user.email, '127.0.0.1');
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
        expect(repository.replaceToken).toHaveBeenCalledWith(
          user.id,
          createHash('sha256').update(token).digest('hex'),
          expect.any(Date),
        );
        const expiresAt: Date | undefined =
          repository.replaceToken.mock.calls[0]?.[2];
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
        repository,
      }: ReturnType<typeof createService> = createService();
      repository.findEligibleUser.mockReturnValue(
        new Promise<User | null>(() => undefined),
      );

      await expect(
        passwordResetService.request('unknown@cityborn.test', 'ip'),
      ).resolves.toBeUndefined();
    });

    it('does not send mail for an unknown or ineligible address', async () => {
      const {
        passwordResetService,
        repository,
        mailService,
      }: ReturnType<typeof createService> = createService();
      repository.findEligibleUser.mockResolvedValue(null);

      await passwordResetService.request('unknown@cityborn.test', 'ip');
      await flushBackgroundWork();

      expect(mailService.sendMail).not.toHaveBeenCalled();
      expect(repository.replaceToken).not.toHaveBeenCalled();
    });

    it('preserves the existing link when the address is limited', async () => {
      const {
        passwordResetService,
        repository,
        rateLimitService,
      }: ReturnType<typeof createService> = createService();
      rateLimitService.reservePasswordResetEmail.mockResolvedValue(false);

      await passwordResetService.request('host@cityborn.test', 'ip');

      expect(repository.findEligibleUser).not.toHaveBeenCalled();
      expect(repository.replaceToken).not.toHaveBeenCalled();
    });

    it('records delivery failures without including the token or changing the response', async () => {
      const user: User = buildUser();
      const {
        passwordResetService,
        repository,
        mailService,
        wideEventService,
      }: ReturnType<typeof createService> = createService();
      repository.findEligibleUser.mockResolvedValue(user);
      mailService.sendMail.mockRejectedValue(
        new Error('provider echoed secret-token'),
      );

      await expect(
        passwordResetService.request(user.email, 'ip'),
      ).resolves.toBeUndefined();
      await flushBackgroundWork();

      expect(wideEventService.recordOperationError).toHaveBeenCalledWith(
        new Error('Password reset delivery failed'),
        { domain: 'auth', operation: 'send_password_reset_email' },
      );
    });
  });

  describe('validateToken', () => {
    it('rejects an invalid, consumed or expired token', async () => {
      const {
        passwordResetService,
        repository,
      }: ReturnType<typeof createService> = createService();
      repository.findTokenUser.mockResolvedValue(null);

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
        repository,
      }: ReturnType<typeof createService> = createService();
      repository.findTokenUser.mockResolvedValue(user.id);

      await passwordResetService.validateToken('token');

      expect(repository.consumeToken).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('does not disconnect sessions or send confirmation when the transaction fails', async () => {
      const user: User = buildUser();
      const {
        passwordResetService,
        repository,
        authenticatedSocketService,
        mailService,
      }: ReturnType<typeof createService> = createService();
      repository.findTokenUser.mockResolvedValue(user.id);
      jest
        .spyOn(passwordResetService, 'completeReset')
        .mockRejectedValue(new Error('write failed'));

      await expect(
        passwordResetService.reset({
          token: 'token',
          password: 'NewPass1',
          confirmPassword: 'NewPass1',
        }),
      ).rejects.toThrow('write failed');

      expect(
        authenticatedSocketService.disconnectOlderSessions,
      ).not.toHaveBeenCalled();
      expect(mailService.sendMail).not.toHaveBeenCalled();
    });

    it('revokes sockets and sends confirmation without returning a session', async () => {
      const user: User = buildUser();
      const {
        passwordResetService,
        repository,
        authenticatedSocketService,
        mailService,
      }: ReturnType<typeof createService> = createService();
      const data: ResetPassword = {
        token: 'token',
        password: 'NewPass1',
        confirmPassword: 'NewPass1',
      };
      repository.findTokenUser.mockResolvedValue(user.id);
      jest
        .spyOn(passwordResetService, 'completeReset')
        .mockResolvedValue({ user, authVersion: 3 });

      await expect(passwordResetService.reset(data)).resolves.toBeUndefined();

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
        data.password,
      );
    });
  });
});
