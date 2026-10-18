import {
  buildGame,
  buildPlayer,
  buildSession,
  buildUser,
  contract,
  type Session,
  SessionMode,
  type User,
} from '@cityborn/api';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createAccessToken } from '../support/createAccessToken';
import { createTestApp } from '../support/createTestApp';

type RecordedGameUsers = { users: { id: string }[] };

describe('POST /session/finalize-game', () => {
  let app: NestExpressApplication;
  let prismaService: PrismaService;
  const targetedUser: User = buildUser({
    id: '00000000-0000-4000-8000-000000000002',
    username: 'target',
    email: 'target@cityborn.test',
  });
  const finalizedSession: Session = buildSession({
    mode: SessionMode.SOLO,
    hostID: 'target',
    players: [
      buildPlayer({ username: 'target', isGuest: false, id: targetedUser.id }),
    ],
    currentGame: buildGame({
      state: { guessObjectsIds: [], results: { target: { results: [] } } },
    }),
  });

  beforeAll(async () => {
    app = await createTestApp();
    prismaService = app.get(PrismaService);
  });

  afterAll(async () => {
    await app?.close();
  });

  async function persistUser(user: User): Promise<void> {
    await prismaService.user.create({
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        type: user.type,
        isVerified: user.isVerified,
      },
    });
  }

  async function findRecordedGameUsers(): Promise<RecordedGameUsers[]> {
    return await prismaService.gameRecord.findMany({
      select: { users: { select: { id: true } } },
    });
  }

  it('records the game for the authenticated account instead of the account sent in the body', async () => {
    const authenticatedUser: User = buildUser({ username: 'alice' });
    await persistUser(authenticatedUser);
    await persistUser(targetedUser);
    const accessToken: string = await createAccessToken(
      app,
      authenticatedUser.id,
    );

    await request(app.getHttpServer())
      .post(contract.session.finalizeGame.path)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(finalizedSession)
      .expect(200);

    const recordedGameUsers: RecordedGameUsers[] =
      await findRecordedGameUsers();
    expect(recordedGameUsers).toEqual([
      { users: [{ id: authenticatedUser.id }] },
    ]);
  });

  it('records an anonymous game without attaching it to any account', async () => {
    await persistUser(targetedUser);

    await request(app.getHttpServer())
      .post(contract.session.finalizeGame.path)
      .send(finalizedSession)
      .expect(200);

    const recordedGameUsers: RecordedGameUsers[] =
      await findRecordedGameUsers();
    expect(recordedGameUsers).toEqual([{ users: [] }]);
  });
});
