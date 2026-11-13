import { createHash, randomBytes, randomInt } from 'node:crypto';
import {
  ErrorCode,
  type GoogleEmailChallenge,
  UserIdSchema,
} from '@cityborn/api';
import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { z } from 'zod';
import { MailService } from '../../mail/mail.service';
import { RedisService } from '../../redis/redis.service';

const GoogleEmailProofSchema = z.object({
  subject: z.string().min(1),
  email: z.string().email(),
  name: z.string(),
  target: z
    .object({ userId: UserIdSchema, isVerified: z.boolean() })
    .nullable(),
});

export type GoogleEmailProof = z.infer<typeof GoogleEmailProofSchema>;

const StoredGoogleEmailProofSchema = GoogleEmailProofSchema.extend({
  challengeId: z.string(),
  digest: z.string(),
  sentAt: z.number(),
  attempts: z.number(),
});

type StoredGoogleEmailProof = z.infer<typeof StoredGoogleEmailProofSchema>;

const proofTtlSeconds: number = 600;
const resendCooldownMs: number = 180_000;

const renewProofScript: string = `
local current = redis.call('GET', KEYS[1])
if ARGV[2] ~= '' then
  if not current or cjson.decode(current).challengeId ~= ARGV[2] then return -1 end
end
if current and tonumber(ARGV[3]) - cjson.decode(current).sentAt < tonumber(ARGV[4]) then return 0 end
local sends = tonumber(redis.call('GET', KEYS[2]) or '0')
if sends >= 5 then return 0 end
redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[5])
redis.call('INCR', KEYS[2])
if sends == 0 then redis.call('EXPIRE', KEYS[2], 3600) end
return 1
`;

const consumeProofScript: string = `
local raw = redis.call('GET', KEYS[1])
if not raw then return nil end
local proof = cjson.decode(raw)
if proof.challengeId ~= ARGV[1] or proof.attempts <= 0 then return nil end
if proof.digest ~= ARGV[2] then
  proof.attempts = proof.attempts - 1
  redis.call('SET', KEYS[1], cjson.encode(proof), 'KEEPTTL')
  return nil
end
redis.call('DEL', KEYS[1])
return raw
`;

function invalidProof(): UnauthorizedException {
  return new UnauthorizedException({
    code: ErrorCode.USER_VERIFICATION_EMAIL_INVALID_TOKEN,
    message: 'Code invalide, expiré ou déjà utilisé. Demandez un nouveau code.',
  });
}

function proofDigest({
  challengeId,
  code,
}: {
  challengeId: string;
  code: string;
}): string {
  return createHash('sha256').update(`${challengeId}:${code}`).digest('hex');
}

@Injectable()
export class GoogleEmailProofService {
  constructor(
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
  ) {}

  async request(proof: GoogleEmailProof): Promise<GoogleEmailChallenge> {
    const addressKey: string = createHash('sha256')
      .update(proof.email.trim().toLowerCase())
      .digest('hex');
    const challengeId: string = `${addressKey}.${randomBytes(16).toString('hex')}`;
    return this.renew({ proof, challengeId });
  }

  async resend(challengeId: string): Promise<GoogleEmailChallenge> {
    const raw: string | null = await this.redisService.get(
      this.proofKey(challengeId),
    );
    if (!raw) throw invalidProof();
    const stored: StoredGoogleEmailProof = StoredGoogleEmailProofSchema.parse(
      JSON.parse(raw),
    );
    if (stored.challengeId !== challengeId) throw invalidProof();
    const renewedChallengeId: string = `${challengeId.split('.')[0]}.${randomBytes(16).toString('hex')}`;
    return this.renew({
      proof: stored,
      challengeId: renewedChallengeId,
      expectedChallengeId: challengeId,
    });
  }

  async consume({
    challengeId,
    code,
  }: {
    challengeId: string;
    code: string;
  }): Promise<GoogleEmailProof> {
    const raw: unknown = await this.redisService.redisClient.eval(
      consumeProofScript,
      1,
      this.proofKey(challengeId),
      challengeId,
      proofDigest({ challengeId, code }),
    );
    if (typeof raw !== 'string') throw invalidProof();
    return GoogleEmailProofSchema.parse(JSON.parse(raw));
  }

  private async renew({
    proof,
    challengeId,
    expectedChallengeId = '',
  }: {
    proof: GoogleEmailProof;
    challengeId: string;
    expectedChallengeId?: string;
  }): Promise<GoogleEmailChallenge> {
    const code: string = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const sentAt: number = Date.now();
    const stored: StoredGoogleEmailProof = {
      ...proof,
      challengeId,
      digest: proofDigest({ challengeId, code }),
      sentAt,
      attempts: 5,
    };
    const result: unknown = await this.redisService.redisClient.eval(
      renewProofScript,
      2,
      this.proofKey(challengeId),
      `google-email-sends:${challengeId.split('.')[0]}`,
      JSON.stringify(stored),
      expectedChallengeId,
      sentAt,
      resendCooldownMs,
      proofTtlSeconds,
    );
    if (result === -1) throw invalidProof();
    if (result !== 1)
      throw new HttpException(
        {
          code: ErrorCode.RATE_LIMIT_EXCEEDED,
          message: 'Patientez avant de demander un nouveau code.',
        },
        429,
      );
    await this.mailService.sendMail({
      to: proof.email,
      subject: 'Confirmez votre connexion Google à Cityborn',
      text: `Votre code Cityborn : ${code}\nValable dix minutes, pour une seule confirmation.\nSi vous possédez déjà un compte sous une ancienne adresse, contactez l’assistance Cityborn avant de continuer.\nSi vous n’êtes pas à l’origine de cette demande, ignorez cet email.`,
    });
    return {
      challengeId,
      email: proof.email,
      expiresInSeconds: proofTtlSeconds,
    };
  }

  private proofKey(challengeId: string): string {
    return `google-email-proof:${challengeId.split('.')[0]}`;
  }
}
