import { buildUser } from '@cityborn/api';
import { createMock } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { GameRecordService } from '../../src/game-record/game-record.service';
import { PrismaClsModule } from '../../src/prisma/prisma-cls.module';
import { EMAIL_VERIFICATION_TOKEN_REPOSITORY } from '../../src/user/repositories/email-verification-token.repository';
import { PrismaEmailVerificationTokenRepository } from '../../src/user/repositories/prisma-email-verification-token.repository';
import { PrismaUserRepository } from '../../src/user/repositories/prisma-user.repository';
import { USER_REPOSITORY } from '../../src/user/repositories/user.repository';
import { UserService } from '../../src/user/user.service';
import { createTestInfrastructure } from '../support/infrastructure';

describe('UserService transaction', () => {
  const infrastructure = createTestInfrastructure();
  const { prisma } = infrastructure;
  let module: TestingModule;
  let tokenRepository: PrismaEmailVerificationTokenRepository;
  let userRepository: PrismaUserRepository;
  let userService: UserService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaClsModule],
      providers: [
        UserService,
        {
          provide: GameRecordService,
          useValue: createMock<GameRecordService>(),
        },
        {
          provide: EMAIL_VERIFICATION_TOKEN_REPOSITORY,
          useClass: PrismaEmailVerificationTokenRepository,
        },
        { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
      ],
    }).compile();
    await module.init();
    tokenRepository = module.get(EMAIL_VERIFICATION_TOKEN_REPOSITORY);
    userRepository = module.get(USER_REPOSITORY);
    userService = module.get(UserService);
  });

  afterAll(async () => {
    await module?.close();
    await infrastructure.close();
  });

  async function seedUnverifiedUser() {
    const userData = buildUser({ isVerified: false });
    const user = await userRepository.create({
      email: userData.email,
      username: userData.username,
      type: userData.type,
      isVerified: userData.isVerified,
    });
    await tokenRepository.createVerificationToken({
      userId: user.id,
      token: 'verification-token',
      expiresAt: new Date('2099-01-01'),
    });
    return user;
  }

  it('commits email verification and token cleanup together', async () => {
    const user = await seedUnverifiedUser();

    await userService.verifyEmail('verification-token');

    expect(
      await prisma.user.findUnique({ where: { id: user.id } }),
    ).toMatchObject({ isVerified: true });
    expect(
      await prisma.emailVerificationToken.count({ where: { userId: user.id } }),
    ).toBe(0);
  });

  it('keeps a user unverified and retains the token when token cleanup fails', async () => {
    const user = await seedUnverifiedUser();
    jest
      .spyOn(tokenRepository, 'deleteVerificationTokensByUserId')
      .mockRejectedValueOnce(new Error('token cleanup failed'));

    await expect(userService.verifyEmail('verification-token')).rejects.toThrow(
      'token cleanup failed',
    );

    expect(
      await prisma.user.findUnique({ where: { id: user.id } }),
    ).toMatchObject({ isVerified: false });
    expect(
      await prisma.emailVerificationToken.count({ where: { userId: user.id } }),
    ).toBe(1);
  });
});
