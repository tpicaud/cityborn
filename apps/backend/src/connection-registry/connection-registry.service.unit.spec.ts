import { createMock } from '../../test/support/createMock';
import type { RedisService } from '../redis/redis.service';
import { ConnectionRegistryService } from './connection-registry.service';

function buildConnectionRegistryService() {
  const redisService = createMock<RedisService>();
  const connectionRegistryService = new ConnectionRegistryService(redisService);

  return { connectionRegistryService, redisService };
}

describe('ConnectionRegistryService.register', () => {
  it('stores connection information with its TTL', async () => {
    const { connectionRegistryService, redisService } =
      buildConnectionRegistryService();
    redisService.setJSON.mockResolvedValue(undefined);

    await connectionRegistryService.register(
      'socket-1',
      'player-1',
      'session-1',
      true,
    );

    expect(redisService.setJSON).toHaveBeenCalledWith(
      'connection:socket-1',
      {
        playerID: 'player-1',
        sessionID: 'session-1',
        isGuest: true,
      },
      3600,
    );
  });
});

describe('ConnectionRegistryService.getConnection', () => {
  it('returns null without extending the TTL when the connection is absent', async () => {
    const { connectionRegistryService, redisService } =
      buildConnectionRegistryService();
    redisService.getJSON.mockResolvedValue(null);

    const connection = await connectionRegistryService.getConnection('missing');

    expect(connection).toBeNull();
    expect(redisService.expire).not.toHaveBeenCalled();
  });

  it('returns the connection and extends its TTL', async () => {
    const { connectionRegistryService, redisService } =
      buildConnectionRegistryService();
    const storedConnection = {
      playerID: 'player-1',
      sessionID: 'session-1',
      isGuest: false,
    };
    redisService.getJSON.mockResolvedValue(storedConnection);
    redisService.expire.mockResolvedValue(undefined);

    const connection =
      await connectionRegistryService.getConnection('socket-1');

    expect(connection).toEqual(storedConnection);
    expect(redisService.expire).toHaveBeenCalledWith(
      'connection:socket-1',
      3600,
    );
  });
});

describe('ConnectionRegistryService.unregister', () => {
  it('deletes the connection key', async () => {
    const { connectionRegistryService, redisService } =
      buildConnectionRegistryService();
    redisService.del.mockResolvedValue(1);

    await connectionRegistryService.unregister('socket-1');

    expect(redisService.del).toHaveBeenCalledWith('connection:socket-1');
  });
});
