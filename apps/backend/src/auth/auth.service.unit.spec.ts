import { buildUser, ErrorCode } from '@cityborn/api';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { User as PrismaUser } from '@prisma/client';
import { createMock } from '../../test/support/createMock';
import type { EventService } from '../event/event.service';
import type { MailService } from '../mail/mail.service';
import type { UserService } from '../user/user.service';
import { AuthService, type GoogleIdentityClient } from './auth.service';

const prismaUser = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'host@cityborn.test',
  username: 'host',
  type: 'email',
  password: 'hashed-password',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  isVerified: true,
  appleId: null,
} satisfies PrismaUser;

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
  const googleClient = createMock<GoogleIdentityClient>();
  const authService = new AuthService(
    userService,
    jwtService,
    configService,
    eventService,
    mailService,
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
    googleClient,
  };
}

describe('AuthService.signUp', () => {
  it('creates an account, sends verification and returns tokens', async () => {
    const persistedUser = { ...prismaUser, isVerified: false };
    const { authService, userService, jwtService, eventService, mailService } =
      buildAuthService();
    userService.createUser.mockResolvedValue(persistedUser);
    userService.createEmailVerificationToken.mockResolvedValue(
      'verification-token',
    );
    mailService.sendMail.mockResolvedValue(undefined);

    const result = await authService.signUp(
      {
        email: persistedUser.email,
        username: persistedUser.username,
        password: 'plain-password',
      },
      'visitor-1',
    );

    expect(userService.validateIdentifiers).toHaveBeenCalledWith(
      persistedUser.username,
      persistedUser.email,
    );
    expect(userService.createUser).toHaveBeenCalledWith({
      email: persistedUser.email,
      username: persistedUser.username,
      type: 'email',
      password: 'hashed-password',
    });
    expect(mailService.sendMail).toHaveBeenCalledTimes(1);
    expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      user: { username: persistedUser.username },
    });
    expect(eventService.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'user_signed_up',
        visitorId: 'visitor-1',
      }),
    );
  });
});

describe('AuthService.signIn', () => {
  it('returns tokens for valid credentials', async () => {
    const persistedUser = prismaUser;
    const { authService, userService, eventService } = buildAuthService();
    userService.findByIdentifier.mockResolvedValue(persistedUser);

    const result = await authService.signIn(
      {
        identifier: persistedUser.email,
        password: 'plain-password',
      },
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
    ['an unknown identifier', null],
    ['an OAuth account', { ...prismaUser, password: null }],
  ])('rejects %s', async (_label, persistedUser) => {
    const { authService, userService } = buildAuthService();
    userService.findByIdentifier.mockResolvedValue(persistedUser);

    await expect(
      authService.signIn({
        identifier: 'alice',
        password: 'plain-password',
      }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_INVALID_CREDENTIALS },
    });
  });

  it('rejects an invalid password', async () => {
    const { authService, userService } = buildAuthService();
    userService.findByIdentifier.mockResolvedValue(prismaUser);
    mockPasswordMatches = false;

    await expect(
      authService.signIn({
        identifier: 'host',
        password: 'wrong-password',
      }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_INVALID_CREDENTIALS },
    });
  });
});

describe('AuthService account operations', () => {
  it('refreshes both tokens for an existing user', async () => {
    const persistedUser = prismaUser;
    const { authService, userService } = buildAuthService();
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

  it('returns the authenticated profile', async () => {
    const persistedUser = prismaUser;
    const { authService, userService } = buildAuthService();
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

  it('does not resend verification to a verified user', async () => {
    const { authService, userService, mailService } = buildAuthService();

    await authService.resendVerificationEmail(buildUser({ isVerified: true }));

    expect(userService.createEmailVerificationToken).not.toHaveBeenCalled();
    expect(mailService.sendMail).not.toHaveBeenCalled();
  });

  it('resends verification to an unverified user', async () => {
    const { authService, userService, mailService } = buildAuthService();
    userService.createEmailVerificationToken.mockResolvedValue(
      'verification-token',
    );
    mailService.sendMail.mockResolvedValue(undefined);

    await authService.resendVerificationEmail(buildUser({ isVerified: false }));

    expect(userService.createEmailVerificationToken).toHaveBeenCalledWith(
      '00000000-0000-4000-8000-000000000001',
      180000,
    );
    expect(mailService.sendMail).toHaveBeenCalledTimes(1);
  });

  it('verifies an email and returns the public user', async () => {
    const persistedUser = { ...prismaUser, isVerified: false };
    const { authService, userService } = buildAuthService();
    userService.verifyEmail.mockResolvedValue(persistedUser);

    const result = await authService.verifyEmail({
      verification_token: 'verification-token',
    });

    expect(result).toEqual({
      id: persistedUser.id,
      username: persistedUser.username,
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
    const persistedUser = { ...prismaUser, type: 'google', password: null };
    const { authService, userService, googleClient, eventService } =
      buildAuthService();
    const ticket = createMock<GoogleIdentityTicket>();
    ticket.getPayload.mockReturnValue({
      email_verified: true,
      email: 'alice@cityborn.test',
      name: 'Alice Doe',
    });
    googleClient.verifyIdToken.mockResolvedValue(ticket);
    userService.findByIdentifier.mockResolvedValue(persistedUser);

    const result = await authService.signInWithGoogle(
      { idToken: 'google-token' },
      'visitor-1',
    );

    expect(result.user.username).toBe(persistedUser.username);
    expect(eventService.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'user_signed_in',
        visitorId: 'visitor-1',
      }),
    );
  });

  it('creates a Google user with an available generated username', async () => {
    const persistedUser = {
      ...prismaUser,
      username: 'alicedoe1000',
      type: 'google',
      password: null,
    };
    const { authService, userService, googleClient, eventService } =
      buildAuthService();
    const ticket = createMock<GoogleIdentityTicket>();
    ticket.getPayload.mockReturnValue({
      email_verified: true,
      email: 'alice@cityborn.test',
      name: 'Alice Doe',
    });
    googleClient.verifyIdToken.mockResolvedValue(ticket);
    userService.findByIdentifier
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    userService.createUser.mockResolvedValue(persistedUser);
    jest.spyOn(Math, 'random').mockReturnValue(0);

    const result = await authService.signInWithGoogle(
      { idToken: 'google-token' },
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
    const { authService, googleClient } = buildAuthService();
    const ticket = createMock<GoogleIdentityTicket>();
    ticket.getPayload.mockReturnValue(undefined);
    googleClient.verifyIdToken.mockResolvedValue(ticket);

    await expect(
      authService.signInWithGoogle({ idToken: 'google-token' }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_INVALID_CREDENTIALS },
    });
  });

  it('rejects an unverified Google email', async () => {
    const { authService, googleClient } = buildAuthService();
    const ticket = createMock<GoogleIdentityTicket>();
    ticket.getPayload.mockReturnValue({
      email_verified: false,
      email: 'alice@cityborn.test',
      name: 'Alice Doe',
    });
    googleClient.verifyIdToken.mockResolvedValue(ticket);

    await expect(
      authService.signInWithGoogle({ idToken: 'google-token' }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_GOOGLE_EMAIL_NOT_VERIFIED },
    });
  });
});

describe('AuthService.signInWithApple', () => {
  it('rejects an invalid Apple identity token', async () => {
    const { authService } = buildAuthService();
    mockAppleTokenValid = false;

    await expect(
      authService.signInWithApple({
        identity_token: 'invalid-token',
        apple_user_id: 'apple-user-1',
      }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.BAD_REQUEST },
    });
  });

  it('requires account details for a first Apple connection', async () => {
    const { authService, userService } = buildAuthService();
    userService.findByAppleId.mockResolvedValue(null);

    await expect(
      authService.signInWithApple({
        identity_token: 'apple-token',
        apple_user_id: 'apple-user-1',
      }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_INVALID_CREDENTIALS },
    });
  });

  it('creates a user during the first Apple connection', async () => {
    const persistedUser = {
      ...prismaUser,
      username: 'aliceapple1000',
      type: 'apple',
      password: null,
      appleId: 'apple-user-1',
    };
    const { authService, userService, eventService } = buildAuthService();
    userService.findByAppleId.mockResolvedValue(null);
    userService.findByIdentifier
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    userService.createUser.mockResolvedValue(persistedUser);
    jest.spyOn(Math, 'random').mockReturnValue(0);

    const result = await authService.signInWithApple(
      {
        identity_token: 'apple-token',
        apple_user_id: 'apple-user-1',
        details: {
          email: 'alice@cityborn.test',
          given_name: 'Alice',
          family_name: 'Apple',
        },
      },
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
