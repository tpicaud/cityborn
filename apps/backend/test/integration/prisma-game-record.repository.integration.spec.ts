import {
  buildCreateGameRecord,
  buildUser,
  type GameRecordId,
} from '@cityborn/api';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaGameRecordRepository } from '../../src/game-record/repositories/prisma-game-record.repository';
import { PrismaClsModule } from '../../src/prisma/prisma-cls.module';
import { createTestInfrastructure } from '../support/infrastructure';

describe('PrismaGameRecordRepository', () => {
  const infrastructure = createTestInfrastructure();
  const { prisma } = infrastructure;
  let module: TestingModule;
  let gameRecordRepository: PrismaGameRecordRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaClsModule],
      providers: [PrismaGameRecordRepository],
    }).compile();
    await module.init();
    gameRecordRepository = module.get(PrismaGameRecordRepository);
  });

  afterAll(async () => {
    await module?.close();
    await infrastructure.close();
  });

  it('returns only the five newest game records of the requested user', async () => {
    const user = buildUser();
    const otherUser = buildUser({
      id: '00000000-0000-4000-8000-000000000002',
      email: 'guest@cityborn.test',
      username: 'guest',
    });
    await prisma.user.createMany({
      data: [
        {
          id: user.id,
          email: user.email,
          username: user.username,
          type: user.type,
        },
        {
          id: otherUser.id,
          email: otherUser.email,
          username: otherUser.username,
          type: otherUser.type,
        },
      ],
    });
    const recordIds: GameRecordId[] = [];
    for (let index = 0; index < 6; index++) {
      const record = await gameRecordRepository.create(
        buildCreateGameRecord(),
        [{ id: user.id }],
      );
      recordIds.push(record.id);
      await prisma.gameRecord.update({
        where: { id: record.id },
        data: { createdAt: new Date(Date.UTC(2026, 0, index + 1)) },
      });
    }

    const records = await gameRecordRepository.findRecentByUserId(user.id);
    const others = await gameRecordRepository.findRecentByUserId(otherUser.id);

    expect(records?.map(({ id }) => id)).toEqual(recordIds.slice(1).reverse());
    expect(records?.[0]?.createdAt).toBe('2026-01-06');
    expect(others).toEqual([]);
  });

  it('returns null when the requested user does not exist', async () => {
    const absentUser = buildUser();

    const records = await gameRecordRepository.findRecentByUserId(
      absentUser.id,
    );

    expect(records).toBeNull();
  });
});
