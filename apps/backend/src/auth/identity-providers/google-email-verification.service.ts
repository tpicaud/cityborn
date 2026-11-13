import { createHash, randomInt } from 'node:crypto';
import { ErrorCode, type UserId } from '@cityborn/api';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { MailService } from '../../mail/mail.service';
import { RedisService } from '../../redis/redis.service';

type GoogleEmailOwnership = {
  googleId: string;
  email: string;
  userId: UserId | null;
};

function ownershipKey(ownership: GoogleEmailOwnership): string {
  return `auth:google:email:${createHash('sha256').update(JSON.stringify(ownership)).digest('hex')}`;
}

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

@Injectable()
export class GoogleEmailVerificationService {
  constructor(
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
  ) {}

  async request(ownership: GoogleEmailOwnership): Promise<void> {
    const key: string = ownershipKey(ownership);
    const cooldownKey: string = `auth:google:email-cooldown:${createHash('sha256').update(ownership.email.toLowerCase()).digest('hex')}`;
    const reserved: boolean = await this.redisService.setIfAbsent({
      key: cooldownKey,
      value: '1',
      ttlSeconds: 180,
    });
    if (!reserved) return;
    const code: string = randomInt(10000000, 100000000).toString();
    await this.redisService.set(key, hashCode(code), 600);
    try {
      await this.mailService.sendMail({
        to: ownership.email,
        subject: 'Confirmez votre connexion Google à Cityborn',
        text: `Votre code Cityborn : ${code}\n\nSaisissez ce code dans Cityborn pour confirmer votre adresse et associer votre compte Google. Votre progression sera conservée.\n\nCe code est valable 10 minutes, pour une seule utilisation. Ne le partagez pas. Si vous n’avez pas demandé cette connexion, ignorez cet e-mail.`,
      });
    } catch (error: unknown) {
      await Promise.all([
        this.redisService.del(key),
        this.redisService.del(cooldownKey),
      ]);
      throw error;
    }
  }

  async verify({
    ownership,
    code,
  }: {
    ownership: GoogleEmailOwnership;
    code: string | undefined;
  }): Promise<void> {
    if (!code)
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_CREDENTIALS,
        message: 'Email ownership proof required',
      });
    const key: string = ownershipKey(ownership);
    const consumed: unknown = await this.redisService.redisClient.eval(
      `
      local expected = redis.call('GET', KEYS[1])
      if not expected then return 0 end
      local attempts = redis.call('INCR', KEYS[2])
      if attempts == 1 then redis.call('EXPIRE', KEYS[2], 600) end
      if attempts > 5 then redis.call('DEL', KEYS[1]); return 0 end
      if expected ~= ARGV[1] then return 0 end
      redis.call('DEL', KEYS[1])
      return 1
    `,
      2,
      key,
      `${key}:attempts`,
      hashCode(code),
    );
    if (consumed !== 1)
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_TOKEN,
        message: 'Invalid or expired Google email verification code',
      });
  }
}
