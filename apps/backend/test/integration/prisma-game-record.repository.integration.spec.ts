import type { CreateGameRecord, GameRecord, User } from '@cityborn/api';
import {
  buildCreateGameRecord,
  buildUser,
  type GameRecordId,
} from '@cityborn/api';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Prisma } from '@prisma/client';
import { PrismaGameRecordRepository } from '../../src/game-record/repositories/prisma-game-record.repository';
import { PrismaClsModule } from '../../src/prisma/prisma-cls.module';
import { createTestInfrastructure } from '../support/infrastructure';

describe('PrismaGameRecordRepository', () => {
  const infrastructure: ReturnType<typeof createTestInfrastructure> =
    createTestInfrastructure();
  const { prisma }: typeof infrastructure = infrastructure;
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

  describe('create', () => {
    it('persists a game record linked to its users', async () => {
      const firstUser: User = buildUser();
      const secondUser: User = buildUser({
        id: '00000000-0000-4000-8000-000000000002',
        email: 'guest@cityborn.test',
        username: 'guest',
      });
      const recordData: CreateGameRecord = buildCreateGameRecord();
      await prisma.user.createMany({
        data: [
          {
            id: firstUser.id,
            email: firstUser.email,
            username: firstUser.username,
            type: firstUser.type,
          },
          {
            id: secondUser.id,
            email: secondUser.email,
            username: secondUser.username,
            type: secondUser.type,
          },
        ],
      });

      const record: Pick<GameRecord, 'id'> = await gameRecordRepository.create(
        recordData,
        [{ id: firstUser.id }, { id: secondUser.id }],
      );

      const persisted: Prisma.GameRecordGetPayload<{
        include: { users: true };
      }> | null = await prisma.gameRecord.findUnique({
        where: { id: record.id },
        include: { users: true },
      });

      expect(persisted).toMatchObject({
        mode: 'solo',
        gameConfig: { categories: [], timer: 25, nbOfObjects: 6 },
      });
      expect(persisted?.users.map(({ id }) => id).sort()).toEqual([
        '00000000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000002',
      ]);
    });
  });

  describe('findRecentByUserId', () => {
    it('returns only the five newest game records of the requested user', async () => {
      const user: User = buildUser();
      const otherUser: User = buildUser({
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
      for (let index: number = 0; index < 6; index++) {
        const recordData: CreateGameRecord = buildCreateGameRecord();
        const record: Pick<GameRecord, 'id'> =
          await gameRecordRepository.create(recordData, [{ id: user.id }]);
        recordIds.push(record.id);
        await prisma.gameRecord.update({
          where: { id: record.id },
          data: { createdAt: new Date(Date.UTC(2026, 0, index + 1)) },
        });
      }

      const records: GameRecord[] | null =
        await gameRecordRepository.findRecentByUserId(user.id);
      const others: GameRecord[] | null =
        await gameRecordRepository.findRecentByUserId(otherUser.id);

      expect(records?.map(({ id }) => id)).toEqual(
        recordIds.slice(1).reverse(),
      );
      expect(records?.[0]?.createdAt).toBe('2026-01-06');
      expect(others).toEqual([]);
    });

    it('returns null when the requested user does not exist', async () => {
      const absentUser: User = buildUser();

      const records: GameRecord[] | null =
        await gameRecordRepository.findRecentByUserId(absentUser.id);

      expect(records).toBeNull();
    });
  });
});
