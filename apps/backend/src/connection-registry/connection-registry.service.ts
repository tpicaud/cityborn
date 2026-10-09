import { PlayerIdSchema, SessionIdSchema } from '@cityborn/api';
import {
  Inject,
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import type { ChainableCommander, Redis } from 'ioredis';
import { z } from 'zod';
import { WideEventService } from '../common/wide-event/wide-event.service';
import {
  CONNECTION_REGISTRY_TIMING,
  type ConnectionRegistryTiming,
} from './connection-registry-timing';

const PlayerPresenceSchema = z.object({
  playerID: PlayerIdSchema,
  sessionID: SessionIdSchema,
});

const ConnectionInfoSchema = PlayerPresenceSchema.extend({
  isGuest: z.boolean(),
});

const ClaimedPresenceChecksSchema = z.array(z.string());

export type PlayerPresence = z.infer<typeof PlayerPresenceSchema>;

export type ConnectionInfo = z.infer<typeof ConnectionInfoSchema>;

type PresenceExpiryHandler = (presence: PlayerPresence) => Promise<void>;

const PRESENCE_CHECKS_KEY = 'connection-presence-checks';
const PRESENCE_CHECK_BATCH_SIZE = 100;

const CLAIM_DUE_PRESENCE_CHECKS_SCRIPT = `
local dueChecks = redis.call('ZRANGEBYSCORE', KEYS[1], '-inf', ARGV[1], 'LIMIT', 0, ARGV[3])
for _, dueCheck in ipairs(dueChecks) do
  redis.call('ZADD', KEYS[1], ARGV[2], dueCheck)
end
return dueChecks
`;

const COMPLETE_CLAIMED_PRESENCE_CHECK_SCRIPT = `
if redis.call('ZSCORE', KEYS[1], ARGV[1]) ~= ARGV[2] then
  return 0
end
local latestLease = redis.call('ZRANGE', KEYS[2], -1, -1, 'WITHSCORES')
if latestLease[2] and tonumber(latestLease[2]) > tonumber(ARGV[3]) then
  return redis.call('ZADD', KEYS[1], latestLease[2], ARGV[1])
end
return redis.call('ZREM', KEYS[1], ARGV[1])
`;

@Injectable()
export class ConnectionRegistryService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly localConnections: Map<string, ConnectionInfo> = new Map();
  private readonly scheduledTimers: Set<NodeJS.Timeout> = new Set();
  private readonly runningTasks: Set<Promise<void>> = new Set();
  private presenceExpiryHandler: PresenceExpiryHandler | null = null;
  private stopped: boolean = false;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    @Inject(CONNECTION_REGISTRY_TIMING)
    private readonly timing: ConnectionRegistryTiming,
    private readonly wideEventService: WideEventService,
  ) {}

  onModuleInit(): void {
    this.stopped = false;
    this.repeat({
      operation: 'connection-registry.heartbeat',
      intervalMs: this.timing.heartbeatIntervalMs,
      task: () => this.renewLocalConnections(),
    });
    this.repeat({
      operation: 'connection-registry.presence-check',
      intervalMs: this.timing.presenceCheckIntervalMs,
      task: () => this.checkDuePresences(),
    });
  }

  async onModuleDestroy(): Promise<void> {
    this.stopped = true;
    this.scheduledTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.scheduledTimers.clear();
    await Promise.all(this.runningTasks);
    await Promise.all(
      [...this.localConnections.keys()].map((socketID) =>
        this.runObserved({
          operation: 'connection-registry.shutdown-release',
          task: () => this.release(socketID),
        }),
      ),
    );
  }

  onPresenceExpired(presenceExpiryHandler: PresenceExpiryHandler): void {
    this.presenceExpiryHandler = presenceExpiryHandler;
  }

  async register({
    socketID,
    connection,
  }: {
    socketID: string;
    connection: ConnectionInfo;
  }): Promise<void> {
    const leaseDeadline: number = Date.now() + this.timing.leaseMs;
    const presenceKey: string = this.getPresenceKey(connection);
    const registration: ChainableCommander = this.redisClient.multi();
    const previousConnection: ConnectionInfo | undefined =
      this.localConnections.get(socketID);
    if (previousConnection) {
      this.queuePresenceRelease({
        commands: registration,
        socketID,
        connection: previousConnection,
      });
    }
    registration
      .set(
        this.getConnectionKey(socketID),
        JSON.stringify(connection),
        'PX',
        this.timing.leaseMs,
      )
      .zadd(presenceKey, leaseDeadline, socketID)
      .pexpire(presenceKey, this.timing.leaseMs)
      .zadd(
        PRESENCE_CHECKS_KEY,
        'GT',
        leaseDeadline,
        this.getPresenceCheck(connection),
      );

    this.assertExecuted(await registration.exec());
    this.localConnections.set(socketID, connection);
  }

  async getConnection(socketID: string): Promise<ConnectionInfo | null> {
    const storedConnection: string | null = await this.redisClient.get(
      this.getConnectionKey(socketID),
    );
    if (!storedConnection) return null;

    return ConnectionInfoSchema.parse(JSON.parse(storedConnection));
  }

  async hasLiveConnection(presence: PlayerPresence): Promise<boolean> {
    const liveConnectionCount: number = await this.redisClient.zcount(
      this.getPresenceKey(presence),
      `(${Date.now()}`,
      '+inf',
    );
    return liveConnectionCount > 0;
  }

  async release(socketID: string): Promise<ConnectionInfo | null> {
    const connection: ConnectionInfo | undefined =
      this.localConnections.get(socketID);
    if (!connection) return null;

    this.localConnections.delete(socketID);
    const release: ChainableCommander = this.redisClient
      .multi()
      .del(this.getConnectionKey(socketID));
    this.queuePresenceRelease({ commands: release, socketID, connection });

    this.assertExecuted(await release.exec());
    return connection;
  }

  async unregister(socketID: string): Promise<void> {
    this.localConnections.delete(socketID);
    const connection: ConnectionInfo | null =
      await this.getConnection(socketID);
    if (!connection) return;

    this.assertExecuted(
      await this.redisClient
        .multi()
        .del(this.getConnectionKey(socketID))
        .zrem(this.getPresenceKey(connection), socketID)
        .exec(),
    );
  }

  private queuePresenceRelease({
    commands,
    socketID,
    connection,
  }: {
    commands: ChainableCommander;
    socketID: string;
    connection: ConnectionInfo;
  }): void {
    commands
      .zrem(this.getPresenceKey(connection), socketID)
      .zadd(
        PRESENCE_CHECKS_KEY,
        Date.now() + this.timing.disconnectGracePeriodMs,
        this.getPresenceCheck(connection),
      );
  }

  private async renewLocalConnections(): Promise<void> {
    const localConnectionEntries: [string, ConnectionInfo][] = [
      ...this.localConnections.entries(),
    ];
    if (localConnectionEntries.length === 0) return;

    const connectionRenewal: ChainableCommander = this.redisClient.pipeline();
    localConnectionEntries.forEach(([socketID]) => {
      connectionRenewal.pexpire(
        this.getConnectionKey(socketID),
        this.timing.leaseMs,
      );
    });
    const renewalResults: unknown[] = this.assertExecuted(
      await connectionRenewal.exec(),
    );

    const leaseDeadline: number = Date.now() + this.timing.leaseMs;
    const presenceRenewal: ChainableCommander = this.redisClient.pipeline();
    localConnectionEntries.forEach(([socketID, connection], index) => {
      if (renewalResults[index] !== 1) {
        this.localConnections.delete(socketID);
        return;
      }
      const presenceKey: string = this.getPresenceKey(connection);
      presenceRenewal
        .zadd(presenceKey, 'XX', leaseDeadline, socketID)
        .pexpire(presenceKey, this.timing.leaseMs)
        .zadd(
          PRESENCE_CHECKS_KEY,
          'GT',
          leaseDeadline,
          this.getPresenceCheck(connection),
        );
    });
    this.assertExecuted(await presenceRenewal.exec());
  }

  private async checkDuePresences(): Promise<void> {
    const presenceExpiryHandler: PresenceExpiryHandler | null =
      this.presenceExpiryHandler;
    if (!presenceExpiryHandler) return;

    const now: number = Date.now();
    const claimedUntil: number = now + this.timing.presenceCheckClaimMs;
    const claimedPresenceChecks: string[] = ClaimedPresenceChecksSchema.parse(
      await this.redisClient.eval(
        CLAIM_DUE_PRESENCE_CHECKS_SCRIPT,
        1,
        PRESENCE_CHECKS_KEY,
        now,
        claimedUntil,
        PRESENCE_CHECK_BATCH_SIZE,
      ),
    );

    await this.expireClaimedPresences({
      presenceChecks: claimedPresenceChecks,
      claimedUntil,
      presenceExpiryHandler,
    });
  }

  private async expireClaimedPresences({
    presenceChecks: [presenceCheck, ...remainingPresenceChecks],
    claimedUntil,
    presenceExpiryHandler,
  }: {
    presenceChecks: string[];
    claimedUntil: number;
    presenceExpiryHandler: PresenceExpiryHandler;
  }): Promise<void> {
    if (presenceCheck === undefined) return;

    await this.runObserved({
      operation: 'connection-registry.presence-expiry',
      task: async () => {
        const presence: PlayerPresence = PlayerPresenceSchema.parse(
          JSON.parse(presenceCheck),
        );
        await presenceExpiryHandler(presence);
        await this.redisClient.eval(
          COMPLETE_CLAIMED_PRESENCE_CHECK_SCRIPT,
          2,
          PRESENCE_CHECKS_KEY,
          this.getPresenceKey(presence),
          presenceCheck,
          String(claimedUntil),
          Date.now(),
        );
      },
    });
    await this.expireClaimedPresences({
      presenceChecks: remainingPresenceChecks,
      claimedUntil,
      presenceExpiryHandler,
    });
  }

  private repeat({
    operation,
    intervalMs,
    task,
  }: {
    operation: string;
    intervalMs: number;
    task: () => Promise<unknown>;
  }): void {
    if (this.stopped) return;

    const timer: NodeJS.Timeout = setTimeout(() => {
      this.scheduledTimers.delete(timer);
      const runningTask: Promise<void> = this.runObserved({
        operation,
        task,
      }).finally(() => {
        this.runningTasks.delete(runningTask);
        this.repeat({ operation, intervalMs, task });
      });
      this.runningTasks.add(runningTask);
    }, intervalMs);
    this.scheduledTimers.add(timer);
  }

  private async runObserved({
    operation,
    task,
  }: {
    operation: string;
    task: () => Promise<unknown>;
  }): Promise<void> {
    try {
      await task();
    } catch (error: unknown) {
      this.wideEventService.recordOperationError(error, {
        domain: 'session',
        operation,
      });
    }
  }

  private assertExecuted(results: [Error | null, unknown][] | null): unknown[] {
    if (!results) throw new Error('Redis transaction was aborted');

    const failedCommand: [Error | null, unknown] | undefined = results.find(
      ([error]) => error !== null,
    );
    if (failedCommand?.[0]) throw failedCommand[0];

    return results.map(([, result]) => result);
  }

  private getConnectionKey(socketID: string): string {
    return `connection:${socketID}`;
  }

  private getPresenceKey({ sessionID, playerID }: PlayerPresence): string {
    return `connection-presence:${sessionID}:${playerID}`;
  }

  private getPresenceCheck({ sessionID, playerID }: PlayerPresence): string {
    return JSON.stringify({ sessionID, playerID });
  }
}
