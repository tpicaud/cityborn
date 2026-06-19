import { ErrorCode } from '@cityborn/api';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import type Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject('REDIS_CLIENT') readonly redisClient: Redis) {}

  async onModuleInit() {
    this.redisClient.on('error', (err) => {
      this.logger.error('Redis Client Error:', err);
    });
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    try {
      if (ttlSeconds) {
        await this.redisClient.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.redisClient.set(key, value);
      }
    } catch (error) {
      throw new InternalServerErrorException({
        code: ErrorCode.REDIS_SET_FAILED,
        message: `Error setting resource ${key}: ${error.message}`,
      });
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.redisClient.get(key);
    } catch (error) {
      throw new InternalServerErrorException({
        code: ErrorCode.REDIS_GET_FAILED,
        message: `Error getting resource ${key}: ${error.message}`,
      });
    }
  }

  async setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.set(key, serialized, ttlSeconds);
    } catch (error) {
      throw new InternalServerErrorException({
        code: ErrorCode.REDIS_SET_FAILED,
        message: `Error setting resource ${key}: ${error.message}`,
      });
    }
  }

  async getJSON<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (error) {
      throw new InternalServerErrorException({
        code: ErrorCode.REDIS_GET_FAILED,
        message: `Error getting resource ${key}: ${error.message}`,
      });
    }
  }

  async del(key: string): Promise<number> {
    try {
      return this.redisClient.del(key);
    } catch (error) {
      throw new InternalServerErrorException({
        code: ErrorCode.REDIS_DELETE_FAILED,
        message: `Error deleting resource ${key}: ${error.message}`,
      });
    }
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }
}
