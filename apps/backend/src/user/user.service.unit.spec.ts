import type { CreateGameRecord, User, UserId, Username } from '@cityborn/api';
import {
  buildCreateGameRecord,
  buildUser,
  ErrorCode,
  SessionMode,
  UserIdSchema,
  UsernameSchema,
} from '@cityborn/api';
import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import type { GameRecordService } from '../game-record/game-record.service';
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
  const gameRecordService: DeepMocked<GameRecordService> =
    createMock<GameRecordService>();
  const userService: UserService = new UserService(
    userRepository,
    emailVerificationTokenRepository,
    gameRecordService,
  );

  return {
    emailVerificationTokenRepository,
    gameRecordService,
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
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(),
      };
      emailVerificationTokenRepository.findLatestVerificationToken.mockResolvedValue(
        verificationToken,
      );

      await expect(
        userService.createEmailVerificationToken(userId('user-1'), 60_000),
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

      const token: string = await userService.createEmailVerificationToken(
        userId('user-1'),
        60_000,
      );

      expect(token).toMatch(/^[a-f0-9]{64}$/);
      expect(
        emailVerificationTokenRepository.deleteVerificationTokensByUserId,
      ).toHaveBeenCalledWith(userId('user-1'));
      expect(
        emailVerificationTokenRepository.createVerificationToken,
      ).toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('deletes and rejects an expired token', async () => {
      const {
        emailVerificationTokenRepository,
        userService,
      }: ReturnType<typeof buildUserService> = buildUserService();
      const expiredToken: EmailVerificationToken = {
        id: 'token-id',
        userId: userId('user-1'),
        expiresAt: new Date(Date.now() - 1),
        createdAt: new Date(),
      };
      emailVerificationTokenRepository.findVerificationToken.mockResolvedValue(
        expiredToken,
      );

      await expect(userService.verifyEmail('expired')).rejects.toMatchObject({
        response: { code: ErrorCode.USER_VERIFICATION_EMAIL_INVALID_TOKEN },
      });
      expect(
        emailVerificationTokenRepository.deleteVerificationToken,
      ).toHaveBeenCalledWith('token-id');
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
        userId: userId('user-1'),
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(),
      };
      emailVerificationTokenRepository.findVerificationToken.mockResolvedValue(
        verificationToken,
      );
      userRepository.markEmailVerified.mockResolvedValue(user);

      await expect(
        userService.verifyEmail('verification-token'),
      ).resolves.toEqual(user);
      expect(
        emailVerificationTokenRepository.deleteVerificationTokensByUserId,
      ).toHaveBeenCalledWith(verificationToken.userId);
    });
  });
});

describe('UserService game records', () => {
  describe('getGameRecords', () => {
    it('rejects an unknown user', async () => {
      const {
        gameRecordService,
        userService,
      }: ReturnType<typeof buildUserService> = buildUserService();
      gameRecordService.findRecentByUserId.mockResolvedValue(null);

      await expect(
        userService.getGameRecords(userId('missing')),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.USER_INVALID_CREDENTIALS },
      });
    });
  });

  describe('saveSoloGameRecord', () => {
    it('persists a solo record for the user', async () => {
      const {
        gameRecordService,
        userService,
      }: ReturnType<typeof buildUserService> = buildUserService();
      const record: CreateGameRecord = buildCreateGameRecord();

      await userService.saveSoloGameRecord(userId('user-1'), record);

      expect(gameRecordService.create).toHaveBeenCalledWith(record, [
        { id: userId('user-1') },
      ]);
    });

    it('rejects a multiplayer record', async () => {
      const { userService }: ReturnType<typeof buildUserService> =
        buildUserService();
      const record: CreateGameRecord = buildCreateGameRecord({
        mode: SessionMode.MULTI,
      });

      await expect(
        userService.saveSoloGameRecord(userId('user-1'), record),
      ).rejects.toMatchObject({ response: { code: ErrorCode.BAD_REQUEST } });
    });
  });
});
