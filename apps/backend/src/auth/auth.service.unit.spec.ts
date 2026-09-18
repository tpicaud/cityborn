import { buildUser, ErrorCode, UsernameSchema } from '@cityborn/api';
import { createMock } from '@golevelup/ts-jest';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { WideEventService } from '../common/wide-event/wide-event.service';
import type { EventService } from '../event/event.service';
import type { MailService } from '../mail/mail.service';
import type { UserService } from '../user/user.service';
import { AuthService, type GoogleIdentityClient } from './auth.service';

let mockPasswordMatches = true;
let mockAppleTokenValid = true;

function mockHash(): Promise<string> {
  return Promise.resolve('hashed-password');
}

function mockCompare(): Promise<boolean> {
  return Promise.resolve(mockPasswordMatches);
}

function mockVerifyAppleIdToken(): Promise<boolean> {
  return Promise.resolve(mockAppleTokenValid);
}

jest.mock('bcrypt', () => ({ hash: mockHash, compare: mockCompare }));
jest.mock('./utils', () => ({
  verifyAppleIdToken: mockVerifyAppleIdToken,
}));

beforeEach(() => {
  mockPasswordMatches = true;
  mockAppleTokenValid = true;
  process.env.APP_ID = 'cityborn-app';
});

function buildAuthService() {
  const userService = createMock<UserService>();
  const jwtService = createMock<JwtService>();
  const configService = createMock<ConfigService>();
  const eventService = createMock<EventService>();
  const mailService = createMock<MailService>();
  const wideEventService = createMock<WideEventService>();
  const googleClient = createMock<GoogleIdentityClient>();
  const authService = new AuthService(
    userService,
    jwtService,
    configService,
    eventService,
    mailService,
    wideEventService,
    googleClient,
  );

  configService.get.mockImplementation((key: string) => {
    if (key === 'JWT_ACCESS_SECRET') return 'access-secret';
    if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
    if (key === 'FRONTEND_URL') return 'https://cityborn.test';
    return undefined;
  });
  jwtService.signAsync
    .mockResolvedValueOnce('access-token')
    .mockResolvedValueOnce('refresh-token');

  return {
    authService,
    userService,
    jwtService,
    eventService,
    mailService,
    wideEventService,
    googleClient,
  };
}

describe('AuthService.signUp', () => {
  it('creates an account, sends verification and returns tokens', async () => {
    const unverifiedUser = buildUser({ isVerified: false });
    const signUpData = {
      email: unverifiedUser.email,
      username: UsernameSchema.parse(unverifiedUser.username),
      password: 'plain-password',
    };
    const { authService, userService, jwtService, eventService, mailService } =
      buildAuthService();
    userService.createUser.mockResolvedValue(unverifiedUser);
    userService.createEmailVerificationToken.mockResolvedValue(
      'verification-token',
    );
    mailService.sendMail.mockResolvedValue(undefined);

    const result = await authService.signUp(signUpData, 'visitor-1');

    expect(userService.validateIdentifiers).toHaveBeenCalledWith(
      unverifiedUser.username,
      unverifiedUser.email,
    );
    expect(userService.createUser).toHaveBeenCalledWith({
      email: unverifiedUser.email,
      username: unverifiedUser.username,
      type: 'email',
      password: 'hashed-password',
    });
    expect(mailService.sendMail).toHaveBeenCalledTimes(1);
    expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      user: { username: unverifiedUser.username },
    });
    expect(eventService.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'user_signed_up',
        visitorId: 'visitor-1',
      }),
    );
  });

  it('returns tokens without waiting for the verification email', async () => {
    const unverifiedUser = buildUser({ isVerified: false });
    const signUpData = {
      email: unverifiedUser.email,
      username: UsernameSchema.parse(unverifiedUser.username),
      password: 'plain-password',
    };
    const { authService, userService, mailService } = buildAuthService();
    userService.createUser.mockResolvedValue(unverifiedUser);
    userService.createEmailVerificationToken.mockResolvedValue(
      'verification-token',
    );
    mailService.sendMail.mockReturnValue(new Promise<void>(() => undefined));

    const signUpOutcome = await Promise.race([
      authService.signUp(signUpData),
      new Promise<undefined>((resolve) =>
        setImmediate(() => resolve(undefined)),
      ),
    ]);

    expect(signUpOutcome).toMatchObject({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    });
  });

  it('logs a verification email failure without rejecting', async () => {
    const unverifiedUser = buildUser({ isVerified: false });
    const signUpData = {
      email: unverifiedUser.email,
      username: UsernameSchema.parse(unverifiedUser.username),
      password: 'plain-password',
    };
    const mailError = new Error('Mailer unavailable');
    const { authService, userService, mailService, wideEventService } =
      buildAuthService();
    userService.createUser.mockResolvedValue(unverifiedUser);
    userService.createEmailVerificationToken.mockResolvedValue(
      'verification-token',
    );
    mailService.sendMail.mockRejectedValue(mailError);

    await expect(authService.signUp(signUpData)).resolves.toMatchObject({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    });
    expect(wideEventService.recordOperationError).toHaveBeenCalledWith(
      mailError,
      {
        domain: 'auth',
        operation: 'send_verification_email',
        userId: unverifiedUser.id,
      },
    );
  });
});

describe('AuthService.signIn', () => {
  it('returns tokens for valid credentials', async () => {
    const { authService, userService, eventService } = buildAuthService();
    const persistedUser = buildUser();
    const credentials = {
      identifier: persistedUser.email,
      password: 'plain-password',
    };
    userService.findCredentialsByIdentifier.mockResolvedValue({
      user: persistedUser,
      passwordHash: 'hashed-password',
    });

    const result = await authService.signIn(credentials, 'visitor-1');

    expect(result.access_token).toBe('access-token');
    expect(result.refresh_token).toBe('refresh-token');
    expect(eventService.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'user_signed_in',
        visitorId: 'visitor-1',
      }),
    );
  });

  it.each([
    ['an unknown identifier', false],
    ['an OAuth account', true],
  ])('rejects %s', async (_label, isOAuthAccount) => {
    const { authService, userService } = buildAuthService();
    const persistedUser = buildUser();
    const credentials = isOAuthAccount
      ? { user: persistedUser, passwordHash: null }
      : null;
    const signInData = {
      identifier: 'alice',
      password: 'plain-password',
    };
    userService.findCredentialsByIdentifier.mockResolvedValue(credentials);

    await expect(authService.signIn(signInData)).rejects.toMatchObject({
      response: { code: ErrorCode.USER_INVALID_CREDENTIALS },
    });
  });

  it('rejects an invalid password', async () => {
    const { authService, userService } = buildAuthService();
    const persistedUser = buildUser();
    const signInData = {
      identifier: 'host',
      password: 'wrong-password',
    };
    userService.findCredentialsByIdentifier.mockResolvedValue({
      user: persistedUser,
      passwordHash: 'hashed-password',
    });
    mockPasswordMatches = false;

    await expect(authService.signIn(signInData)).rejects.toMatchObject({
      response: { code: ErrorCode.USER_INVALID_CREDENTIALS },
    });
  });
});

describe('AuthService account operations', () => {
  describe('refresh', () => {
    it('refreshes both tokens for an existing user', async () => {
      const { authService, userService } = buildAuthService();
      const persistedUser = buildUser();
      userService.findByIdentifier.mockResolvedValue(persistedUser);

      const result = await authService.refresh(persistedUser.email);

      expect(result).toMatchObject({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });
    });

    it('rejects refreshing an unknown user', async () => {
      const { authService, userService } = buildAuthService();
      userService.findByIdentifier.mockResolvedValue(null);

      await expect(authService.refresh('missing')).rejects.toMatchObject({
        response: { code: ErrorCode.USER_REFRESH_FAILED },
      });
    });
  });

  describe('getProfile', () => {
    it('returns the authenticated profile', async () => {
      const { authService, userService } = buildAuthService();
      const persistedUser = buildUser();
      userService.findByIdentifier.mockResolvedValue(persistedUser);

      await expect(authService.getProfile(persistedUser.id)).resolves.toEqual(
        expect.objectContaining({ id: persistedUser.id }),
      );
    });

    it('rejects a missing profile', async () => {
      const { authService, userService } = buildAuthService();
      userService.findByIdentifier.mockResolvedValue(null);

      await expect(authService.getProfile('missing')).rejects.toMatchObject({
        response: { code: ErrorCode.USER_NOT_FOUND },
      });
    });
  });

  describe('deleteUser', () => {
    it('deletes the authenticated user', async () => {
      const user = buildUser();
      const { authService, userService } = buildAuthService();

      await authService.deleteUser(user);

      expect(userService.deleteUser).toHaveBeenCalledWith(user.id);
    });

    it('rejects deleting without an authenticated user', async () => {
      const { authService } = buildAuthService();

      await expect(authService.deleteUser()).rejects.toMatchObject({
        response: { code: ErrorCode.USER_NOT_FOUND },
      });
    });
  });

  describe('resendVerificationEmail', () => {
    it('does not resend verification to a verified user', async () => {
      const { authService, userService, mailService } = buildAuthService();
      const verifiedUser = buildUser({ isVerified: true });

      await authService.resendVerificationEmail(verifiedUser);

      expect(userService.createEmailVerificationToken).not.toHaveBeenCalled();
      expect(mailService.sendMail).not.toHaveBeenCalled();
    });

    it('resends verification to an unverified user', async () => {
      const { authService, userService, mailService } = buildAuthService();
      const unverifiedUser = buildUser({ isVerified: false });
      userService.createEmailVerificationToken.mockResolvedValue(
        'verification-token',
      );
      mailService.sendMail.mockResolvedValue(undefined);

      await authService.resendVerificationEmail(unverifiedUser);

      expect(userService.createEmailVerificationToken).toHaveBeenCalledWith(
        '00000000-0000-4000-8000-000000000001',
        180000,
      );
      expect(mailService.sendMail).toHaveBeenCalledTimes(1);
    });
  });

  describe('verifyEmail', () => {
    it('verifies an email and returns the public user', async () => {
      const unverifiedUser = buildUser({ isVerified: false });
      const { authService, userService } = buildAuthService();
      const verificationData = {
        verification_token: 'verification-token',
      };
      userService.verifyEmail.mockResolvedValue(unverifiedUser);

      const result = await authService.verifyEmail(verificationData);

      expect(result).toEqual({
        id: unverifiedUser.id,
        username: unverifiedUser.username,
      });
    });
  });
});
type GoogleIdentityTicket = Awaited<
  ReturnType<GoogleIdentityClient['verifyIdToken']>
>;

describe('AuthService.signInWithGoogle', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('signs in an existing Google user', async () => {
    const googleUser = buildUser({ type: 'google' });
    const signInData = { idToken: 'google-token' };
    const { authService, userService, googleClient, eventService } =
      buildAuthService();
    const ticket = createMock<GoogleIdentityTicket>();
    ticket.getPayload.mockReturnValue({
      email_verified: true,
      email: 'alice@cityborn.test',
      name: 'Alice Doe',
    });
    googleClient.verifyIdToken.mockResolvedValue(ticket);
    userService.findByIdentifier.mockResolvedValue(googleUser);

    const result = await authService.signInWithGoogle(signInData, 'visitor-1');

    expect(result.user.username).toBe(googleUser.username);
    expect(eventService.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'user_signed_in',
        visitorId: 'visitor-1',
      }),
    );
  });

  it('creates a Google user with an available generated username', async () => {
    const googleUser = buildUser({
      username: 'alicedoe1000',
      type: 'google',
    });
    const signInData = { idToken: 'google-token' };
    const { authService, userService, googleClient, eventService } =
      buildAuthService();
    const ticket = createMock<GoogleIdentityTicket>();
    ticket.getPayload.mockReturnValue({
      email_verified: true,
      email: 'alice@cityborn.test',
      name: 'Alice Doe',
    });
    googleClient.verifyIdToken.mockResolvedValue(ticket);
    userService.findByIdentifier.mockResolvedValueOnce(null);
    userService.existsByUsername.mockResolvedValue(false);
    userService.createUser.mockResolvedValue(googleUser);
    jest.spyOn(Math, 'random').mockReturnValue(0);

    const result = await authService.signInWithGoogle(signInData, 'visitor-1');

    expect(userService.createUser).toHaveBeenCalledWith({
      email: 'alice@cityborn.test',
      username: 'alicedoe1000',
      type: 'google',
      isVerified: true,
    });
    expect(result.user.username).toBe('alicedoe1000');
    expect(eventService.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'user_signed_up' }),
    );
  });

  it('rejects a Google token without payload', async () => {
    const { authService, googleClient } = buildAuthService();
    const signInData = { idToken: 'google-token' };
    const ticket = createMock<GoogleIdentityTicket>();
    ticket.getPayload.mockReturnValue(undefined);
    googleClient.verifyIdToken.mockResolvedValue(ticket);

    await expect(
      authService.signInWithGoogle(signInData),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_INVALID_CREDENTIALS },
    });
  });

  it('rejects an unverified Google email', async () => {
    const { authService, googleClient } = buildAuthService();
    const signInData = { idToken: 'google-token' };
    const ticket = createMock<GoogleIdentityTicket>();
    ticket.getPayload.mockReturnValue({
      email_verified: false,
      email: 'alice@cityborn.test',
      name: 'Alice Doe',
    });
    googleClient.verifyIdToken.mockResolvedValue(ticket);

    await expect(
      authService.signInWithGoogle(signInData),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_GOOGLE_EMAIL_NOT_VERIFIED },
    });
  });
});

describe('AuthService.signInWithApple', () => {
  it('rejects an invalid Apple identity token', async () => {
    const { authService } = buildAuthService();
    const signInData = {
      identity_token: 'invalid-token',
      apple_user_id: 'apple-user-1',
    };
    mockAppleTokenValid = false;

    await expect(authService.signInWithApple(signInData)).rejects.toMatchObject(
      {
        response: { code: ErrorCode.BAD_REQUEST },
      },
    );
  });

  it('requires account details for a first Apple connection', async () => {
    const { authService, userService } = buildAuthService();
    const signInData = {
      identity_token: 'apple-token',
      apple_user_id: 'apple-user-1',
    };
    userService.findByAppleId.mockResolvedValue(null);

    await expect(authService.signInWithApple(signInData)).rejects.toMatchObject(
      {
        response: { code: ErrorCode.USER_INVALID_CREDENTIALS },
      },
    );
  });

  it('creates a user during the first Apple connection', async () => {
    const appleUser = buildUser({
      username: 'aliceapple1000',
      type: 'apple',
    });
    const signInData = {
      identity_token: 'apple-token',
      apple_user_id: 'apple-user-1',
      details: {
        email: 'alice@cityborn.test',
        given_name: 'Alice',
        family_name: 'Apple',
      },
    };
    const { authService, userService, eventService } = buildAuthService();
    userService.findByAppleId.mockResolvedValue(null);
    userService.findByIdentifier.mockResolvedValueOnce(null);
    userService.existsByUsername.mockResolvedValue(false);
    userService.createUser.mockResolvedValue(appleUser);
    jest.spyOn(Math, 'random').mockReturnValue(0);

    const result = await authService.signInWithApple(signInData, 'visitor-1');

    expect(userService.createUser).toHaveBeenCalledWith({
      email: 'alice@cityborn.test',
      username: 'aliceapple1000',
      type: 'apple',
      appleId: 'apple-user-1',
      isVerified: true,
    });
    expect(result.user.username).toBe('aliceapple1000');
    expect(eventService.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'user_signed_up' }),
    );
  });
});
