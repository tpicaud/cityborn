import { createHash } from 'node:crypto';
import {
  buildUser,
  ErrorCode,
  type ResetPassword,
  type User,
} from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import type { WideEventService } from '../../common/wide-event/wide-event.service';
import type { MailService } from '../../mail/mail.service';
import type { SendMailOptions } from '../../mail/providers/mail.provider';
import type { RateLimitService } from '../../rate-limit/rate-limit.service';
import type { UserService } from '../../user/user.service';
import type { AuthenticatedSocketService } from '../../ws-handshake/authenticated-socket.service';
import type { PasswordResetRepository } from '../repositories/password-reset.repository';
import { PasswordResetService } from './password-reset.service';

jest.mock('@nestjs-cls/transactional', () => ({
  Transactional:
    () =>
    (_target: object, _key: string | symbol, descriptor: PropertyDescriptor) =>
      descriptor,
}));

function createPasswordResetService() {
  const passwordResetRepository: DeepMocked<PasswordResetRepository> =
    createMock<PasswordResetRepository>();
  const rateLimitService: DeepMocked<RateLimitService> =
    createMock<RateLimitService>();
  const mailService: DeepMocked<MailService> = createMock<MailService>();
  const userService: DeepMocked<UserService> = createMock<UserService>();
  const wideEventService: DeepMocked<WideEventService> =
    createMock<WideEventService>();
  const authenticatedSocketService: DeepMocked<AuthenticatedSocketService> =
    createMock<AuthenticatedSocketService>();
  const passwordResetService: PasswordResetService = new PasswordResetService(
    passwordResetRepository,
    rateLimitService,
    mailService,
    wideEventService,
    authenticatedSocketService,
    userService,
    {
      frontendUrl: 'https://cityborn.test',
      corsOrigins: ['https://cityborn.test'],
      backOfficeOrigin: 'https://admin.cityborn.test',
    },
  );
  return {
    passwordResetRepository,
    rateLimitService,
    mailService,
    userService,
    wideEventService,
    authenticatedSocketService,
    passwordResetService,
  };
}

describe('PasswordResetService.request', () => {
  it('stores a random token hash for thirty minutes and sends the token only in the email', async () => {
    const {
      passwordResetService,
      passwordResetRepository,
      rateLimitService,
      mailService,
      userService,
    }: ReturnType<typeof createPasswordResetService> =
      createPasswordResetService();
    const user: User = buildUser({ isVerified: false });
    rateLimitService.reservePasswordResetEmail.mockResolvedValue(true);
    userService.findPasswordResetUser.mockResolvedValue(user);
    const sent: Promise<SendMailOptions> = new Promise((resolve) =>
      mailService.sendMail.mockImplementation(async (options) => {
        resolve(options);
      }),
    );
    const beforeRequest: number = Date.now();

    await passwordResetService.request({ email: user.email, ip: 'client-ip' });
    const mail: SendMailOptions = await sent;

    const link: string = mail.text?.match(/https?:\/\/[^\s]+/)?.[0] ?? '';
    const token: string =
      new URLSearchParams(new URL(link).hash.slice(1)).get('token') ?? '';
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(passwordResetRepository.replaceToken).toHaveBeenCalledWith({
      userId: user.id,
      tokenHash: createHash('sha256').update(token).digest('hex'),
      expiresAt: expect.any(Date),
    });
    expect(
      passwordResetRepository.replaceToken.mock.calls[0]?.[0].expiresAt.getTime(),
    ).toBeGreaterThanOrEqual(beforeRequest + 30 * 60 * 1000);
    expect(rateLimitService.consumePasswordReset).toHaveBeenCalledWith(
      'client-ip',
    );
  });

  it('leaves an existing token untouched when the email quota is exhausted', async () => {
    const {
      passwordResetService,
      passwordResetRepository,
      rateLimitService,
      userService,
    }: ReturnType<typeof createPasswordResetService> =
      createPasswordResetService();
    rateLimitService.reservePasswordResetEmail.mockResolvedValue(false);

    await passwordResetService.request({
      email: 'user@cityborn.test',
      ip: 'client-ip',
    });

    expect(userService.findPasswordResetUser).not.toHaveBeenCalled();
    expect(passwordResetRepository.replaceToken).not.toHaveBeenCalled();
  });

  it('does not send an email for an unknown or ineligible account', async () => {
    const {
      passwordResetService,
      passwordResetRepository,
      rateLimitService,
      userService,
      mailService,
    }: ReturnType<typeof createPasswordResetService> =
      createPasswordResetService();
    rateLimitService.reservePasswordResetEmail.mockResolvedValue(true);
    userService.findPasswordResetUser.mockResolvedValue(null);

    await passwordResetService.request({
      email: 'missing@cityborn.test',
      ip: 'client-ip',
    });

    expect(passwordResetRepository.replaceToken).not.toHaveBeenCalled();
    expect(mailService.sendMail).not.toHaveBeenCalled();
  });
});

describe('PasswordResetService.reset', () => {
  const resetPassword: ResetPassword = {
    token: 'token',
    password: 'NewPass1',
    confirmPassword: 'NewPass1',
  };

  it('rejects a missing, expired or consumed token without changing the password', async () => {
    const {
      passwordResetService,
      passwordResetRepository,
      userService,
    }: ReturnType<typeof createPasswordResetService> =
      createPasswordResetService();
    passwordResetRepository.consumeToken.mockResolvedValue(null);

    await expect(
      passwordResetService.reset(resetPassword),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_INVALID_TOKEN },
    });

    expect(userService.updatePassword).not.toHaveBeenCalled();
  });

  it('rejects an account that no longer has a password', async () => {
    const {
      passwordResetService,
      passwordResetRepository,
      userService,
    }: ReturnType<typeof createPasswordResetService> =
      createPasswordResetService();
    const user: User = buildUser();
    passwordResetRepository.consumeToken.mockResolvedValue(user.id);
    userService.findCredentialsById.mockResolvedValue({
      authSession: { user, authVersion: 0 },
      passwordHash: null,
    });

    await expect(
      passwordResetService.reset(resetPassword),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_INVALID_TOKEN },
    });

    expect(userService.updatePassword).not.toHaveBeenCalled();
  });

  it('still revokes sockets and sends confirmation when clearing the sign-in lock fails', async () => {
    const {
      passwordResetService,
      passwordResetRepository,
      userService,
      rateLimitService,
      authenticatedSocketService,
      mailService,
      wideEventService,
    }: ReturnType<typeof createPasswordResetService> =
      createPasswordResetService();
    const user: User = buildUser();
    passwordResetRepository.consumeToken.mockResolvedValue(user.id);
    userService.findCredentialsById.mockResolvedValue({
      authSession: { user, authVersion: 0 },
      passwordHash: 'old-hash',
    });
    userService.updatePassword.mockResolvedValue(1);
    rateLimitService.clearFailedSignIns.mockRejectedValue(
      new Error(`Redis failure containing ${resetPassword.token}`),
    );
    mailService.sendMail.mockResolvedValue(undefined);

    await passwordResetService.reset(resetPassword);

    expect(
      authenticatedSocketService.disconnectOlderSessions,
    ).toHaveBeenCalledWith(user.id, 1);
    expect(mailService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Votre mot de passe Cityborn a été modifié',
      }),
    );
    expect(wideEventService.recordOperationError).toHaveBeenCalledWith(
      new Error('Password reset background operation failed'),
      {
        domain: 'auth',
        operation: 'clear_password_reset_failed_sign_ins',
        userId: user.id,
      },
    );
  });
});
