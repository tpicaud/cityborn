import type { User, UserId, Username } from '@cityborn/api';
import {
  buildUser,
  ErrorCode,
  UserIdSchema,
  UsernameSchema,
} from '@cityborn/api';
import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import type {
  EmailVerificationToken,
  EmailVerificationTokenRepository,
} from './repositories/email-verification-token.repository';
import type {
  CreateUserData,
  UserRepository,
} from './repositories/user.repository';
import { UserService } from './user.service';

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

const userId: (value: string) => UserId = (value: string) =>
  UserIdSchema.parse(value);
const username: (value: string) => Username = (value: string) =>
  UsernameSchema.parse(value);

function buildUserService() {
  const userRepository: DeepMocked<UserRepository> =
    createMock<UserRepository>();
  const emailVerificationTokenRepository: DeepMocked<EmailVerificationTokenRepository> =
    createMock<EmailVerificationTokenRepository>();
  const userService: UserService = new UserService(
    userRepository,
    emailVerificationTokenRepository,
  );

  return {
    emailVerificationTokenRepository,
    userRepository,
    userService,
  };
}

describe('UserService persistence', () => {
  describe('createUser', () => {
    it('delegates creation', async () => {
      const {
        userRepository,
        userService,
      }: ReturnType<typeof buildUserService> = buildUserService();
      const user: User = buildUser();
      const createData: CreateUserData = {
        email: user.email,
        username: user.username,
        type: user.type,
      };
      userRepository.create.mockResolvedValue(user);

      await expect(userService.createUser(createData)).resolves.toEqual(user);
      expect(userRepository.create).toHaveBeenCalledWith({
        email: user.email,
        username: user.username,
        type: user.type,
      });
    });
  });

  describe('findByIdentifier', () => {
    it('delegates lookup', async () => {
      const {
        userRepository,
        userService,
      }: ReturnType<typeof buildUserService> = buildUserService();
      const user: User = buildUser();
      userRepository.findByIdentifier.mockResolvedValue(user);

      await expect(userService.findByIdentifier(user.email)).resolves.toEqual(
        user,
      );
    });
  });

  describe('deleteUser', () => {
    it('delegates deletion', async () => {
      const {
        userRepository,
        userService,
      }: ReturnType<typeof buildUserService> = buildUserService();
      const user: User = buildUser();

      await userService.deleteUser(user.id);

      expect(userRepository.delete).toHaveBeenCalledWith(user.id);
    });
  });
});

describe('UserService.updateUsername', () => {
  it('keeps the user when the username is unchanged', async () => {
    const { userRepository, userService }: ReturnType<typeof buildUserService> =
      buildUserService();
    const user: User = buildUser();

    await expect(
      userService.updateUsername(user, user.username),
    ).resolves.toEqual(user);
    expect(userRepository.existsByUsername).not.toHaveBeenCalled();
    expect(userRepository.updateUsername).not.toHaveBeenCalled();
  });

  it('rejects an existing username', async () => {
    const { userRepository, userService }: ReturnType<typeof buildUserService> =
      buildUserService();
    const user: User = buildUser();
    userRepository.existsByUsername.mockResolvedValue(true);

    await expect(
      userService.updateUsername(user, username('citizen')),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_USERNAME_ALREADY_EXISTS },
    });
    expect(userRepository.updateUsername).not.toHaveBeenCalled();
  });

  it('persists an available username', async () => {
    const { userRepository, userService }: ReturnType<typeof buildUserService> =
      buildUserService();
    const user: User = buildUser();
    const updatedUser: User = buildUser({ username: 'citizen' });
    userRepository.existsByUsername.mockResolvedValue(false);
    userRepository.updateUsername.mockResolvedValue(updatedUser);

    await expect(
      userService.updateUsername(user, updatedUser.username),
    ).resolves.toEqual(updatedUser);
    expect(userRepository.updateUsername).toHaveBeenCalledWith(
      user.id,
      updatedUser.username,
    );
  });
});

describe('UserService.updateEmail', () => {
  it('rejects a verified account', async () => {
    const { userRepository, userService }: ReturnType<typeof buildUserService> =
      buildUserService();
    const user: User = buildUser({ isVerified: true });

    await expect(
      userService.updateEmail({ user, email: 'other@cityborn.test' }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_EMAIL_ALREADY_VERIFIED },
    });
    expect(userRepository.updateEmail).not.toHaveBeenCalled();
  });

  it('rejects an address used by another account', async () => {
    const { userRepository, userService }: ReturnType<typeof buildUserService> =
      buildUserService();
    const user: User = buildUser({ isVerified: false });
    userRepository.findByEmail.mockResolvedValue(
      buildUser({ email: 'other@cityborn.test' }),
    );

    await expect(
      userService.updateEmail({ user, email: 'other@cityborn.test' }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_EMAIL_ALREADY_TAKEN },
    });
    expect(userRepository.updateEmail).not.toHaveBeenCalled();
  });

  it('keeps the user when the email is unchanged', async () => {
    const { userRepository, userService }: ReturnType<typeof buildUserService> =
      buildUserService();
    const user: User = buildUser({ isVerified: false });

    await expect(
      userService.updateEmail({ user, email: user.email }),
    ).resolves.toBe(user);
    expect(userRepository.updateEmail).not.toHaveBeenCalled();
  });

  it('persists the new address and invalidates verification and reset links', async () => {
    const {
      emailVerificationTokenRepository,
      userRepository,
      userService,
    }: ReturnType<typeof buildUserService> = buildUserService();
    const user: User = buildUser({ isVerified: false });
    const updatedUser: User = buildUser({
      isVerified: false,
      email: 'fixed@cityborn.test',
    });
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.updateEmail.mockResolvedValue(updatedUser);

    await expect(
      userService.updateEmail({ user, email: 'fixed@cityborn.test' }),
    ).resolves.toEqual(updatedUser);
    expect(userRepository.updateEmail).toHaveBeenCalledWith({
      userId: user.id,
      email: 'fixed@cityborn.test',
    });
    expect(
      emailVerificationTokenRepository.deleteVerificationTokensByUserId,
    ).toHaveBeenCalledWith(user.id);
    expect(
      userRepository.deletePasswordResetTokensByUserId,
    ).toHaveBeenCalledWith(user.id);
  });

  it('rejects an address change after concurrent verification', async () => {
    const { userRepository, userService }: ReturnType<typeof buildUserService> =
      buildUserService();
    const user: User = buildUser({ isVerified: false });
    userRepository.updateEmail.mockResolvedValue(null);
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      userService.updateEmail({ user, email: 'fixed@cityborn.test' }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_EMAIL_ALREADY_VERIFIED },
    });
    expect(
      userRepository.deletePasswordResetTokensByUserId,
    ).not.toHaveBeenCalled();
  });
});

describe('UserService.updatePassword', () => {
  it('persists the hash and returns the incremented auth version', async () => {
    const { userRepository, userService }: ReturnType<typeof buildUserService> =
      buildUserService();
    const user: User = buildUser();
    userRepository.incrementAuthVersion.mockResolvedValue(1);

    await expect(userService.updatePassword(user.id, 'new-hash')).resolves.toBe(
      1,
    );
    expect(userRepository.updatePassword).toHaveBeenCalledWith(
      user.id,
      'new-hash',
    );
    expect(userRepository.incrementAuthVersion).toHaveBeenCalledWith(user.id);
  });
});

describe('UserService.validateIdentifiers', () => {
  it('accepts unused identifiers', async () => {
    const { userRepository, userService }: ReturnType<typeof buildUserService> =
      buildUserService();
    userRepository.findByIdentifiers.mockResolvedValue(null);

    await expect(
      userService.validateIdentifiers(username('alice'), 'alice@cityborn.test'),
    ).resolves.toBeUndefined();
  });

  it('rejects an existing username', async () => {
    const { userRepository, userService }: ReturnType<typeof buildUserService> =
      buildUserService();
    userRepository.findByIdentifiers.mockResolvedValue({
      username: username('alice'),
      email: 'other@cityborn.test',
    });

    await expect(
      userService.validateIdentifiers(username('alice'), 'new@cityborn.test'),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_USERNAME_ALREADY_EXISTS },
    });
  });

  it('rejects an existing email', async () => {
    const { userRepository, userService }: ReturnType<typeof buildUserService> =
      buildUserService();
    userRepository.findByIdentifiers.mockResolvedValue({
      username: username('other'),
      email: 'alice@cityborn.test',
    });

    await expect(
      userService.validateIdentifiers(username('alice'), 'alice@cityborn.test'),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_EMAIL_ALREADY_TAKEN },
    });
  });
});

describe('UserService verification tokens', () => {
  describe('createEmailVerificationToken', () => {
    it('rejects a request during the cooldown', async () => {
      const {
        emailVerificationTokenRepository,
        userService,
      }: ReturnType<typeof buildUserService> = buildUserService();
      const verificationToken: EmailVerificationToken = {
        id: 'token-id',
        userId: userId('user-1'),
        email: 'alice@cityborn.test',
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(),
      };
      emailVerificationTokenRepository.findLatestVerificationToken.mockResolvedValue(
        verificationToken,
      );

      await expect(
        userService.createEmailVerificationToken({
          userId: userId('user-1'),
          email: 'alice@cityborn.test',
          cooldownMs: 60_000,
        }),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.USER_VERIFICATION_EMAIL_RESEND_TOO_SOON },
      });
    });

    it('replaces previous tokens and returns a fresh token', async () => {
      const {
        emailVerificationTokenRepository,
        userService,
      }: ReturnType<typeof buildUserService> = buildUserService();
      emailVerificationTokenRepository.findLatestVerificationToken.mockResolvedValue(
        null,
      );

      const token: string = await userService.createEmailVerificationToken({
        userId: userId('user-1'),
        email: 'alice@cityborn.test',
        cooldownMs: 60_000,
      });

      expect(token).toMatch(/^[a-f0-9]{64}$/);
      expect(
        emailVerificationTokenRepository.deleteVerificationTokensByUserId,
      ).toHaveBeenCalledWith(userId('user-1'));
      expect(
        emailVerificationTokenRepository.createVerificationToken,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'alice@cityborn.test' }),
      );
    });
  });

  describe('verifyEmail', () => {
    it('retains and rejects an expired token so its owner can request another link', async () => {
      const {
        emailVerificationTokenRepository,
        userRepository,
        userService,
      }: ReturnType<typeof buildUserService> = buildUserService();
      const expiredToken: EmailVerificationToken = {
        id: 'token-id',
        userId: userId('user-1'),
        email: 'alice@cityborn.test',
        expiresAt: new Date(Date.now() - 1),
        createdAt: new Date(),
      };
      emailVerificationTokenRepository.findVerificationToken.mockResolvedValue(
        expiredToken,
      );
      userRepository.lockById.mockResolvedValue(
        buildUser({ id: expiredToken.userId, email: expiredToken.email }),
      );

      await expect(userService.verifyEmail('expired')).rejects.toMatchObject({
        response: { code: ErrorCode.USER_VERIFICATION_EMAIL_EXPIRED_TOKEN },
      });
      expect(
        emailVerificationTokenRepository.deleteVerificationTokensByUserId,
      ).not.toHaveBeenCalled();
    });

    it('verifies the user and removes its tokens', async () => {
      const {
        emailVerificationTokenRepository,
        userRepository,
        userService,
      }: ReturnType<typeof buildUserService> = buildUserService();
      const user: User = buildUser();
      const verificationToken: EmailVerificationToken = {
        id: 'token-id',
        userId: user.id,
        email: user.email,
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(),
      };
      emailVerificationTokenRepository.findVerificationToken.mockResolvedValue(
        verificationToken,
      );
      userRepository.lockById.mockResolvedValue(user);
      userRepository.markEmailVerified.mockResolvedValue(user);

      await expect(
        userService.verifyEmail('verification-token'),
      ).resolves.toEqual(user);
      expect(
        emailVerificationTokenRepository.deleteVerificationTokensByUserId,
      ).toHaveBeenCalledWith(verificationToken.userId);
    });

    it('rejects a token removed during an address change', async () => {
      const {
        emailVerificationTokenRepository,
        userRepository,
        userService,
      }: ReturnType<typeof buildUserService> = buildUserService();
      const user: User = buildUser({
        isVerified: false,
        email: 'fixed@cityborn.test',
      });
      const token: EmailVerificationToken = {
        id: 'token-id',
        userId: user.id,
        email: 'old@cityborn.test',
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(),
      };
      emailVerificationTokenRepository.findVerificationToken
        .mockResolvedValueOnce(token)
        .mockResolvedValueOnce(null);
      userRepository.lockById.mockResolvedValue(user);

      await expect(userService.verifyEmail('old-token')).rejects.toMatchObject({
        response: { code: ErrorCode.USER_VERIFICATION_EMAIL_INVALID_TOKEN },
      });

      expect(userRepository.markEmailVerified).not.toHaveBeenCalled();
    });

    it('rejects a token bound to a different address', async () => {
      const {
        emailVerificationTokenRepository,
        userRepository,
        userService,
      }: ReturnType<typeof buildUserService> = buildUserService();
      const user: User = buildUser({ email: 'fixed@cityborn.test' });
      const token: EmailVerificationToken = {
        id: 'token-id',
        userId: user.id,
        email: 'old@cityborn.test',
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(),
      };
      emailVerificationTokenRepository.findVerificationToken.mockResolvedValue(
        token,
      );
      userRepository.lockById.mockResolvedValue(user);

      await expect(userService.verifyEmail('old-token')).rejects.toMatchObject({
        response: { code: ErrorCode.USER_VERIFICATION_EMAIL_INVALID_TOKEN },
      });

      expect(userRepository.markEmailVerified).not.toHaveBeenCalled();
    });
  });
});

describe('UserService.findPasswordResetAuthSession', () => {
  it('accepts an unverified account with a password', async () => {
    const { userRepository, userService }: ReturnType<typeof buildUserService> =
      buildUserService();
    const user: User = buildUser({ isVerified: false });
    userRepository.findCredentialsByEmail.mockResolvedValue({
      authSession: { user, authVersion: 0 },
      passwordHash: 'hash',
    });

    await expect(
      userService.findPasswordResetAuthSession(user.email),
    ).resolves.toEqual({ user, authVersion: 0 });

    expect(userRepository.findCredentialsByEmail).toHaveBeenCalledWith(
      user.email,
    );
  });

  it.each([null, { passwordHash: null }])(
    'excludes an unknown or passwordless account',
    async (credentials) => {
      const {
        userRepository,
        userService,
      }: ReturnType<typeof buildUserService> = buildUserService();
      userRepository.findCredentialsByEmail.mockResolvedValue(
        credentials
          ? {
              authSession: { user: buildUser(), authVersion: 0 },
              passwordHash: null,
            }
          : null,
      );

      await expect(
        userService.findPasswordResetAuthSession('unknown@cityborn.test'),
      ).resolves.toBeNull();
    },
  );
});
