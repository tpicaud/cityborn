import {
  buildCreateGameRecord,
  buildUser,
  ErrorCode,
  SessionMode,
  UserIdSchema,
  UsernameSchema,
} from '@cityborn/api';
import { createMock } from '@golevelup/ts-jest';
import type { GameRecordService } from '../game-record/game-record.service';
import type { EmailVerificationTokenRepository } from './repositories/email-verification-token.repository';
import type { UserRepository } from './repositories/user.repository';
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

const userId = (value: string) => UserIdSchema.parse(value);
const username = (value: string) => UsernameSchema.parse(value);

function buildUserService() {
  const userRepository = createMock<UserRepository>();
  const emailVerificationTokenRepository =
    createMock<EmailVerificationTokenRepository>();
  const gameRecordService = createMock<GameRecordService>();
  const userService = new UserService(
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
  it('delegates creation, lookup and deletion', async () => {
    const { userRepository, userService } = buildUserService();
    const user = buildUser();
    userRepository.create.mockResolvedValue(user);
    userRepository.findByIdentifier.mockResolvedValue(user);

    await expect(
      userService.createUser({
        email: user.email,
        username: user.username,
        type: user.type,
      }),
    ).resolves.toEqual(user);
    await expect(userService.findByIdentifier(user.email)).resolves.toEqual(
      user,
    );
    await userService.deleteUser(user.id);

    expect(userRepository.delete).toHaveBeenCalledWith(user.id);
  });
});

describe('UserService.validateIdentifiers', () => {
  it('accepts unused identifiers', async () => {
    const { userRepository, userService } = buildUserService();
    userRepository.findByIdentifiers.mockResolvedValue(null);

    await expect(
      userService.validateIdentifiers(username('alice'), 'alice@cityborn.test'),
    ).resolves.toBeUndefined();
  });

  it('rejects an existing username', async () => {
    const { userRepository, userService } = buildUserService();
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
    const { userRepository, userService } = buildUserService();
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
  const verificationToken = {
    id: 'token-id',
    userId: userId('user-1'),
    expiresAt: new Date(Date.now() + 60_000),
    createdAt: new Date(),
  };

  it('rejects a request during the cooldown', async () => {
    const { emailVerificationTokenRepository, userService } =
      buildUserService();
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
    const { emailVerificationTokenRepository, userService } =
      buildUserService();
    emailVerificationTokenRepository.findLatestVerificationToken.mockResolvedValue(
      null,
    );

    const token = await userService.createEmailVerificationToken(
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

  it('deletes and rejects an expired token', async () => {
    const { emailVerificationTokenRepository, userService } =
      buildUserService();
    emailVerificationTokenRepository.findVerificationToken.mockResolvedValue({
      ...verificationToken,
      expiresAt: new Date(Date.now() - 1),
    });

    await expect(userService.verifyEmail('expired')).rejects.toMatchObject({
      response: { code: ErrorCode.USER_VERIFICATION_EMAIL_INVALID_TOKEN },
    });
    expect(
      emailVerificationTokenRepository.deleteVerificationToken,
    ).toHaveBeenCalledWith('token-id');
  });

  it('verifies the user and removes its tokens', async () => {
    const { emailVerificationTokenRepository, userRepository, userService } =
      buildUserService();
    const user = buildUser();
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

describe('UserService game records', () => {
  it('rejects an unknown user', async () => {
    const { gameRecordService, userService } = buildUserService();
    gameRecordService.findRecentByUserId.mockResolvedValue(null);

    await expect(
      userService.getGameRecords(userId('missing')),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_INVALID_CREDENTIALS },
    });
  });

  it('persists a solo record for the user', async () => {
    const { gameRecordService, userService } = buildUserService();
    const record = buildCreateGameRecord();

    await userService.saveSoloGameRecord(userId('user-1'), record);

    expect(gameRecordService.create).toHaveBeenCalledWith(record, [
      { id: userId('user-1') },
    ]);
  });

  it('rejects a multiplayer record', async () => {
    const { userService } = buildUserService();

    await expect(
      userService.saveSoloGameRecord(
        userId('user-1'),
        buildCreateGameRecord({ mode: SessionMode.MULTI }),
      ),
    ).rejects.toMatchObject({ response: { code: ErrorCode.BAD_REQUEST } });
  });
});
