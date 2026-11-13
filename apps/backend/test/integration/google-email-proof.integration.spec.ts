import { ErrorCode, type GoogleEmailChallenge } from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import {
  type GoogleEmailProof,
  GoogleEmailProofService,
} from '../../src/auth/services/google-email-proof.service';
import type { WideEventService } from '../../src/common/wide-event/wide-event.service';
import type { MailService } from '../../src/mail/mail.service';
import { RedisService } from '../../src/redis/redis.service';
import { createTestInfrastructure } from '../support/infrastructure';

const infrastructure: ReturnType<typeof createTestInfrastructure> =
  createTestInfrastructure();
const mailService: DeepMocked<MailService> = createMock<MailService>();
const service: GoogleEmailProofService = new GoogleEmailProofService(
  new RedisService(infrastructure.redis, createMock<WideEventService>()),
  mailService,
);
const proof: GoogleEmailProof = {
  subject: 'google-subject',
  email: 'alice@example.com',
  name: 'Alice',
  target: null,
};
let now: number;

beforeEach(() => {
  now = Date.now();
  jest.spyOn(Date, 'now').mockImplementation(() => now);
  mailService.sendMail.mockReset().mockResolvedValue(undefined);
});
afterEach(() => jest.restoreAllMocks());
afterAll(async () => {
  await infrastructure.close();
});

function mailedCode(): string {
  const text: string | undefined = mailService.sendMail.mock.lastCall?.[0].text;
  const code: string | undefined = text?.match(/\b\d{6}\b/)?.[0];
  if (!code) throw new Error('No emailed code');
  return code;
}
function key(challengeId: string): string {
  return `google-email-proof:${challengeId.split('.')[0]}`;
}

async function exhaustAttempts(
  challengeId: string,
  count: number,
): Promise<void> {
  if (count === 0) return;
  const wrongCode: string = mailedCode() === '000000' ? '111111' : '000000';
  await expect(
    service.consume({ challengeId, code: wrongCode }),
  ).rejects.toMatchObject({ status: 401 });
  await exhaustAttempts(challengeId, count - 1);
}

describe('GoogleEmailProofService.consume', () => {
  it('returns the bound operation once without keeping the email code in Redis', async () => {
    const challenge: GoogleEmailChallenge = await service.request(proof);
    const code: string = mailedCode();
    const stored: string | null = await infrastructure.redis.get(
      key(challenge.challengeId),
    );

    const consumed: GoogleEmailProof = await service.consume({
      challengeId: challenge.challengeId,
      code,
    });

    expect(consumed).toEqual(proof);
    expect(JSON.parse(stored ?? '{}')).not.toHaveProperty('code');
    expect(
      await infrastructure.redis.get(key(challenge.challengeId)),
    ).toBeNull();
    await expect(
      service.consume({ challengeId: challenge.challengeId, code }),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('rejects an expired code', async () => {
    const challenge: GoogleEmailChallenge = await service.request(proof);
    expect(
      await infrastructure.redis.ttl(key(challenge.challengeId)),
    ).toBeGreaterThan(590);
    await infrastructure.redis.expire(key(challenge.challengeId), 0);

    await expect(
      service.consume({
        challengeId: challenge.challengeId,
        code: mailedCode(),
      }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_VERIFICATION_EMAIL_INVALID_TOKEN },
    });
  });

  it('permits only one concurrent confirmation', async () => {
    const challenge: GoogleEmailChallenge = await service.request(proof);
    const code: string = mailedCode();

    const outcomes: PromiseSettledResult<GoogleEmailProof>[] =
      await Promise.allSettled(
        Array.from({ length: 2 }, () =>
          service.consume({ challengeId: challenge.challengeId, code }),
        ),
      );

    expect(
      outcomes.filter((outcome) => outcome.status === 'fulfilled'),
    ).toHaveLength(1);
  });

  it('limits code guesses and restores five attempts after an atomic resend', async () => {
    const challenge: GoogleEmailChallenge = await service.request(proof);
    await exhaustAttempts(challenge.challengeId, 5);
    await expect(
      service.consume({
        challengeId: challenge.challengeId,
        code: mailedCode(),
      }),
    ).rejects.toMatchObject({ status: 401 });
    now += 180_000;

    const renewed: GoogleEmailChallenge = await service.resend(
      challenge.challengeId,
    );
    const newCode: string = mailedCode();
    await exhaustAttempts(renewed.challengeId, 4);
    const consumed: GoogleEmailProof = await service.consume({
      challengeId: renewed.challengeId,
      code: newCode,
    });

    expect(consumed).toEqual(proof);
    await expect(
      service.consume({ challengeId: challenge.challengeId, code: newCode }),
    ).rejects.toMatchObject({ status: 401 });
  });
});

describe('GoogleEmailProofService.request', () => {
  it('limits sends by normalized address across Google subjects and concurrent requests', async () => {
    const outcomes: PromiseSettledResult<GoogleEmailChallenge>[] =
      await Promise.allSettled([
        service.request(proof),
        service.request({
          ...proof,
          email: 'ALICE@example.com',
          subject: 'other-subject',
        }),
      ]);

    expect(
      outcomes.filter((outcome) => outcome.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(mailService.sendMail).toHaveBeenCalledTimes(1);
  });

  it('limits an address to five sends per hour', async () => {
    async function send(remaining: number): Promise<void> {
      if (remaining === 0) return;
      await service.request(proof);
      now += 180_000;
      await send(remaining - 1);
    }
    await send(5);

    await expect(service.request(proof)).rejects.toMatchObject({ status: 429 });

    expect(mailService.sendMail).toHaveBeenCalledTimes(5);
  });
});

describe('GoogleEmailProofService.resend', () => {
  it('limits concurrent resends and invalidates the former challenge', async () => {
    const challenge: GoogleEmailChallenge = await service.request(proof);
    now += 180_000;

    const outcomes: PromiseSettledResult<GoogleEmailChallenge>[] =
      await Promise.allSettled(
        Array.from({ length: 2 }, () => service.resend(challenge.challengeId)),
      );

    expect(
      outcomes.filter((outcome) => outcome.status === 'fulfilled'),
    ).toHaveLength(1);
    await expect(
      service.consume({
        challengeId: challenge.challengeId,
        code: mailedCode(),
      }),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('does not recreate a consumed challenge', async () => {
    const challenge: GoogleEmailChallenge = await service.request(proof);
    await service.consume({
      challengeId: challenge.challengeId,
      code: mailedCode(),
    });
    now += 180_000;

    await expect(service.resend(challenge.challengeId)).rejects.toMatchObject({
      status: 401,
    });
  });
});
