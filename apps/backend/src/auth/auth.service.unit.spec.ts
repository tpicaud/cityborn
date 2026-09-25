import type {
  AuthResponse,
  CreateUser,
  PublicUser,
  SignIn,
  SignInWithApple,
  SignInWithGoogle,
  User,
  VerifyEmailData,
} from '@cityborn/api';
import { buildUser, ErrorCode, UsernameSchema } from '@cityborn/api';
import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import type { JwtService } from '@nestjs/jwt';
import type { WideEventService } from '../common/wide-event/wide-event.service';
import type { AuthConfig, HttpConfig } from '../config/config.module';
import type { EventService } from '../event/event.service';
import type { MailService } from '../mail/mail.service';
import type { UserCredentials } from '../user/repositories/user.repository';
import type { UserService } from '../user/user.service';
import { AuthService, type GoogleIdentityClient } from './auth.service';

let mockPasswordMatches: boolean = true;
let mockAppleTokenValid: boolean = true;

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
});

function buildAuthService() {
  const userService: DeepMocked<UserService> = createMock<UserService>();
  const jwtService: DeepMocked<JwtService> = createMock<JwtService>();
  const authConfig: AuthConfig = {
    jwtAccessSecret: 'access-secret',
    jwtRefreshSecret: 'refresh-secret',
    googleClientId: 'google-client',
    appleAppId: 'cityborn-app',
    adminDashboardToken: 'admin-token',
  };
  const httpConfig: HttpConfig = {
    corsOrigins: ['https://cityborn.test'],
    frontendUrl: 'https://cityborn.test',
  };
  const eventService: DeepMocked<EventService> = createMock<EventService>();
  const mailService: DeepMocked<MailService> = createMock<MailService>();
  const wideEventService: DeepMocked<WideEventService> =
    createMock<WideEventService>();
  const googleClient: DeepMocked<GoogleIdentityClient> =
    createMock<GoogleIdentityClient>();
  const authService: AuthService = new AuthService(
    userService,
    jwtService,
    authConfig,
    httpConfig,
    eventService,
    mailService,
    wideEventService,
    googleClient,
  );

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
    const unverifiedUser: User = buildUser({ isVerified: false });
    const signUpData: CreateUser = {
      email: unverifiedUser.email,
      username: UsernameSchema.parse(unverifiedUser.username),
      password: 'plain-password',
    };
    const {
      authService,
      userService,
      jwtService,
      eventService,
      mailService,
    }: ReturnType<typeof buildAuthService> = buildAuthService();
    userService.createUser.mockResolvedValue(unverifiedUser);
    userService.createEmailVerificationToken.mockResolvedValue(
      'verification-token',
    );
    mailService.sendMail.mockResolvedValue(undefined);

    const result: AuthResponse = await authService.signUp(
      signUpData,
      'visitor-1',
    );

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
    const unverifiedUser: User = buildUser({ isVerified: false });
    const signUpData: CreateUser = {
      email: unverifiedUser.email,
      username: UsernameSchema.parse(unverifiedUser.username),
      password: 'plain-password',
    };
    const {
      authService,
      userService,
      mailService,
    }: ReturnType<typeof buildAuthService> = buildAuthService();
    userService.createUser.mockResolvedValue(unverifiedUser);
    userService.createEmailVerificationToken.mockResolvedValue(
      'verification-token',
    );
    mailService.sendMail.mockReturnValue(new Promise<void>(() => undefined));

    const signUpOutcome: AuthResponse | undefined = await Promise.race([
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
    const unverifiedUser: User = buildUser({ isVerified: false });
    const signUpData: CreateUser = {
      email: unverifiedUser.email,
      username: UsernameSchema.parse(unverifiedUser.username),
      password: 'plain-password',
    };
    const mailError: Error = new Error('Mailer unavailable');
    const {
      authService,
      userService,
      mailService,
      wideEventService,
    }: ReturnType<typeof buildAuthService> = buildAuthService();
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
    const {
      authService,
      userService,
      eventService,
    }: ReturnType<typeof buildAuthService> = buildAuthService();
    const persistedUser: User = buildUser();
    const credentials: SignIn = {
      identifier: persistedUser.email,
      password: 'plain-password',
    };
    userService.findCredentialsByIdentifier.mockResolvedValue({
      user: persistedUser,
      authVersion: 0,
      passwordHash: 'hashed-password',
    });

    const result: AuthResponse = await authService.signIn(
      credentials,
      'visitor-1',
    );

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
    const { authService, userService }: ReturnType<typeof buildAuthService> =
      buildAuthService();
    const persistedUser: User = buildUser();
    const credentials: UserCredentials | null = isOAuthAccount
      ? { user: persistedUser, authVersion: 0, passwordHash: null }
      : null;
    const signInData: SignIn = {
      identifier: 'alice',
      password: 'plain-password',
    };
    userService.findCredentialsByIdentifier.mockResolvedValue(credentials);

    await expect(authService.signIn(signInData)).rejects.toMatchObject({
      response: { code: ErrorCode.USER_INVALID_CREDENTIALS },
    });
  });

  it('rejects an invalid password', async () => {
    const { authService, userService }: ReturnType<typeof buildAuthService> =
      buildAuthService();
    const persistedUser: User = buildUser();
    const signInData: SignIn = {
      identifier: 'host',
      password: 'wrong-password',
    };
    userService.findCredentialsByIdentifier.mockResolvedValue({
      user: persistedUser,
      authVersion: 0,
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
      const { authService, userService }: ReturnType<typeof buildAuthService> =
        buildAuthService();
      const persistedUser: User = buildUser();
      userService.findByIdentifier.mockResolvedValue(persistedUser);
      const result: AuthResponse = await authService.refresh(
        persistedUser.email,
        3,
      );

      expect(result).toMatchObject({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });
    });

    it('rejects refreshing an unknown user', async () => {
      const { authService, userService }: ReturnType<typeof buildAuthService> =
        buildAuthService();
      userService.findByIdentifier.mockResolvedValue(null);

      await expect(authService.refresh('missing', 0)).rejects.toMatchObject({
        response: { code: ErrorCode.USER_REFRESH_FAILED },
      });
    });
  });

  describe('getProfile', () => {
    it('returns the authenticated profile', async () => {
      const { authService, userService }: ReturnType<typeof buildAuthService> =
        buildAuthService();
      const persistedUser: User = buildUser();
      userService.findByIdentifier.mockResolvedValue(persistedUser);

      await expect(authService.getProfile(persistedUser.id)).resolves.toEqual(
        expect.objectContaining({ id: persistedUser.id }),
      );
    });

    it('rejects a missing profile', async () => {
      const { authService, userService }: ReturnType<typeof buildAuthService> =
        buildAuthService();
      userService.findByIdentifier.mockResolvedValue(null);

      await expect(authService.getProfile('missing')).rejects.toMatchObject({
        response: { code: ErrorCode.USER_NOT_FOUND },
      });
    });
  });

  describe('deleteUser', () => {
    it('deletes the authenticated user', async () => {
      const user: User = buildUser();
      const { authService, userService }: ReturnType<typeof buildAuthService> =
        buildAuthService();

      await authService.deleteUser(user);

      expect(userService.deleteUser).toHaveBeenCalledWith(user.id);
    });

    it('rejects deleting without an authenticated user', async () => {
      const { authService }: ReturnType<typeof buildAuthService> =
        buildAuthService();

      await expect(authService.deleteUser()).rejects.toMatchObject({
        response: { code: ErrorCode.USER_NOT_FOUND },
      });
    });
  });

  describe('updatePassword', () => {
    it('rejects password creation for an OAuth account', async () => {
      const { authService, userService }: ReturnType<typeof buildAuthService> =
        buildAuthService();
      const oauthUser: User = buildUser({ type: 'google' });

      await expect(
        authService.updatePassword(oauthUser, {
          currentPassword: 'Password1',
          newPassword: 'Password2',
        }),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.USER_NOT_VANILLA_ACCOUNT },
      });
      expect(userService.updatePassword).not.toHaveBeenCalled();
    });

    it('rejects an incorrect current password', async () => {
      const { authService, userService }: ReturnType<typeof buildAuthService> =
        buildAuthService();
      const persistedUser: User = buildUser();
      userService.findCredentialsById.mockResolvedValue({
        user: persistedUser,
        authVersion: 0,
        passwordHash: 'hashed-password',
      });
      mockPasswordMatches = false;

      await expect(
        authService.updatePassword(persistedUser, {
          currentPassword: 'WrongPassword1',
          newPassword: 'Password2',
        }),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.USER_CURRENT_PASSWORD_INCORRECT },
      });
      expect(userService.updatePassword).not.toHaveBeenCalled();
    });

    it('updates the hash and issues tokens with the incremented auth version', async () => {
      const {
        authService,
        userService,
        jwtService,
      }: ReturnType<typeof buildAuthService> = buildAuthService();
      const persistedUser: User = buildUser();
      userService.findCredentialsById.mockResolvedValue({
        user: persistedUser,
        authVersion: 0,
        passwordHash: 'hashed-password',
      });
      userService.updatePassword.mockResolvedValue({
        user: persistedUser,
        authVersion: 1,
      });

      const result: AuthResponse = await authService.updatePassword(
        persistedUser,
        {
          currentPassword: 'Password1',
          newPassword: 'Password2',
        },
      );

      expect(userService.updatePassword).toHaveBeenCalledWith(
        persistedUser.id,
        'hashed-password',
      );
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ authVersion: 1 }),
        expect.objectContaining({ secret: 'access-secret' }),
      );
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ authVersion: 1 }),
        expect.objectContaining({ secret: 'refresh-secret' }),
      );
      expect(result.user).toEqual(persistedUser);
    });
  });

  describe('resendVerificationEmail', () => {
    it('does not resend verification to a verified user', async () => {
      const {
        authService,
        userService,
        mailService,
      }: ReturnType<typeof buildAuthService> = buildAuthService();
      const verifiedUser: User = buildUser({ isVerified: true });

      await authService.resendVerificationEmail(verifiedUser);

      expect(userService.createEmailVerificationToken).not.toHaveBeenCalled();
      expect(mailService.sendMail).not.toHaveBeenCalled();
    });

    it('resends verification to an unverified user', async () => {
      const {
        authService,
        userService,
        mailService,
      }: ReturnType<typeof buildAuthService> = buildAuthService();
      const unverifiedUser: User = buildUser({ isVerified: false });
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
      const unverifiedUser: User = buildUser({ isVerified: false });
      const { authService, userService }: ReturnType<typeof buildAuthService> =
        buildAuthService();
      const verificationData: VerifyEmailData = {
        verification_token: 'verification-token',
      };
      userService.verifyEmail.mockResolvedValue(unverifiedUser);

      const result: PublicUser =
        await authService.verifyEmail(verificationData);

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
    const googleUser: User = buildUser({ type: 'google' });
    const signInData: SignInWithGoogle = { idToken: 'google-token' };
    const {
      authService,
      userService,
      googleClient,
      eventService,
    }: ReturnType<typeof buildAuthService> = buildAuthService();
    const ticket: DeepMocked<GoogleIdentityTicket> =
      createMock<GoogleIdentityTicket>();
    ticket.getPayload.mockReturnValue({
      email_verified: true,
      email: 'alice@cityborn.test',
      name: 'Alice Doe',
    });
    googleClient.verifyIdToken.mockResolvedValue(ticket);
    userService.findByIdentifier.mockResolvedValue(googleUser);

    const result: AuthResponse = await authService.signInWithGoogle(
      signInData,
      'visitor-1',
    );

    expect(result.user.username).toBe(googleUser.username);
    expect(eventService.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'user_signed_in',
        visitorId: 'visitor-1',
      }),
    );
  });

  it('creates a Google user with an available generated username', async () => {
    const googleUser: User = buildUser({
      username: 'alicedoe1000',
      type: 'google',
    });
    const signInData: SignInWithGoogle = { idToken: 'google-token' };
    const {
      authService,
      userService,
      googleClient,
      eventService,
    }: ReturnType<typeof buildAuthService> = buildAuthService();
    const ticket: DeepMocked<GoogleIdentityTicket> =
      createMock<GoogleIdentityTicket>();
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

    const result: AuthResponse = await authService.signInWithGoogle(
      signInData,
      'visitor-1',
    );

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
    const { authService, googleClient }: ReturnType<typeof buildAuthService> =
      buildAuthService();
    const signInData: SignInWithGoogle = { idToken: 'google-token' };
    const ticket: DeepMocked<GoogleIdentityTicket> =
      createMock<GoogleIdentityTicket>();
    ticket.getPayload.mockReturnValue(undefined);
    googleClient.verifyIdToken.mockResolvedValue(ticket);

    await expect(
      authService.signInWithGoogle(signInData),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_INVALID_CREDENTIALS },
    });
  });

  it('rejects an unverified Google email', async () => {
    const { authService, googleClient }: ReturnType<typeof buildAuthService> =
      buildAuthService();
    const signInData: SignInWithGoogle = { idToken: 'google-token' };
    const ticket: DeepMocked<GoogleIdentityTicket> =
      createMock<GoogleIdentityTicket>();
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
    const { authService }: ReturnType<typeof buildAuthService> =
      buildAuthService();
    const signInData: SignInWithApple = {
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
    const { authService, userService }: ReturnType<typeof buildAuthService> =
      buildAuthService();
    const signInData: SignInWithApple = {
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
    const appleUser: User = buildUser({
      username: 'aliceapple1000',
      type: 'apple',
    });
    const signInData: SignInWithApple = {
      identity_token: 'apple-token',
      apple_user_id: 'apple-user-1',
      details: {
        email: 'alice@cityborn.test',
        given_name: 'Alice',
        family_name: 'Apple',
      },
    };
    const {
      authService,
      userService,
      eventService,
    }: ReturnType<typeof buildAuthService> = buildAuthService();
    userService.findByAppleId.mockResolvedValue(null);
    userService.findByIdentifier.mockResolvedValueOnce(null);
    userService.existsByUsername.mockResolvedValue(false);
    userService.createUser.mockResolvedValue(appleUser);
    jest.spyOn(Math, 'random').mockReturnValue(0);

    const result: AuthResponse = await authService.signInWithApple(
      signInData,
      'visitor-1',
    );

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
