import { createHash } from 'node:crypto';
import { UserIdSchema } from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { GoogleEmailVerificationService } from '../../src/auth/identity-providers/google-email-verification.service';
import type { WideEventService } from '../../src/common/wide-event/wide-event.service';
import type { MailService } from '../../src/mail/mail.service';
import type { SendMailOptions } from '../../src/mail/providers/mail.provider';
import { RedisService } from '../../src/redis/redis.service';
import { createTestInfrastructure } from '../support/infrastructure';

const infrastructure: ReturnType<typeof createTestInfrastructure> =
  createTestInfrastructure();
const redis: RedisService = new RedisService(
  infrastructure.redis,
  createMock<WideEventService>(),
);
const mail: DeepMocked<MailService> = createMock<MailService>();
const ownership: Parameters<GoogleEmailVerificationService['request']>[0] = {
  googleId: 'google-1',
  email: 'alice@external.test',
  userId: UserIdSchema.parse('user-1'),
};
let code: string;

const service: GoogleEmailVerificationService =
  new GoogleEmailVerificationService(redis, mail);

beforeEach(() => {
  mail.sendMail.mockReset();
  mail.sendMail.mockImplementation(
    async (options: SendMailOptions): Promise<void> => {
      const match: RegExpMatchArray | null =
        options.text?.match(/\b\d{8}\b/) ?? null;
      if (!match) throw new Error('Missing email code');
      code = match[0];
    },
  );
});

afterAll(async () => {
  await infrastructure.close();
});

describe('GoogleEmailVerificationService.request', () => {
  it('renews the attempt budget when resending after exhausted attempts', async () => {
    await service.request(ownership);
    await Promise.allSettled(
      Array.from({ length: 5 }, () =>
        service.verify({ ownership, code: '00000000' }),
      ),
    );
    await expect(service.verify({ ownership, code })).rejects.toMatchObject({
      status: 401,
    });
    const cooldownKey: string = `auth:google:email-cooldown:${createHash('sha256').update(ownership.email.toLowerCase()).digest('hex')}`;
    await redis.del(cooldownKey);

    await service.request(ownership);

    expect(mail.sendMail).toHaveBeenCalledTimes(2);
    await Promise.allSettled(
      Array.from({ length: 4 }, () =>
        service.verify({ ownership, code: '00000000' }),
      ),
    );
    await expect(service.verify({ ownership, code })).resolves.toBeUndefined();
  });

  it('limits email delivery and stores only a hashed code', async () => {
    await service.request(ownership);
    await service.request(ownership);

    expect(mail.sendMail).toHaveBeenCalledTimes(1);
    const key: string = `auth:google:email:${createHash('sha256').update(JSON.stringify(ownership)).digest('hex')}`;
    expect(await redis.get(key)).toBe(
      createHash('sha256').update(code).digest('hex'),
    );
    expect(await redis.redisClient.ttl(key)).toBeGreaterThan(0);
    expect(await redis.redisClient.ttl(key)).toBeLessThanOrEqual(600);
  });
});

describe('GoogleEmailVerificationService.verify', () => {
  it('allows exactly one concurrent use', async () => {
    await service.request(ownership);

    const attempts: PromiseSettledResult<void>[] = await Promise.allSettled([
      service.verify({ ownership, code }),
      service.verify({ ownership, code }),
    ]);

    expect(
      attempts.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      attempts.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);
  });

  it.each([
    { googleId: 'google-2' },
    { email: 'other@external.test' },
    { userId: UserIdSchema.parse('user-2') },
  ])('binds proof to the identity and account: %j', async (changes) => {
    await service.request(ownership);

    await expect(
      service.verify({ ownership: { ...ownership, ...changes }, code }),
    ).rejects.toMatchObject({ status: 401 });
    await expect(service.verify({ ownership, code })).resolves.toBeUndefined();
  });

  it('invalidates a code after five failed attempts', async () => {
    await service.request(ownership);
    await Promise.allSettled(
      Array.from({ length: 5 }, () =>
        service.verify({ ownership, code: '00000000' }),
      ),
    );

    await expect(service.verify({ ownership, code })).rejects.toMatchObject({
      status: 401,
    });
  });

  it('rejects expired and absent codes', async () => {
    await service.request(ownership);
    const key: string = `auth:google:email:${createHash('sha256').update(JSON.stringify(ownership)).digest('hex')}`;
    await redis.del(key);

    await expect(service.verify({ ownership, code })).rejects.toMatchObject({
      status: 401,
    });
    await expect(
      service.verify({ ownership, code: undefined }),
    ).rejects.toMatchObject({ status: 401 });
  });
});
