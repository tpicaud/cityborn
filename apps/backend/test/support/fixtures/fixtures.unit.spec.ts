import {
  GameSchema,
  OnlinePlayerSchema,
  SessionSchema,
  UserSchema,
} from '@cityborn/api';
import { buildGame, buildSession, buildUser, player } from '.';

describe('Entity fixtures', () => {
  it('builds valid API entities', () => {
    expect(() => GameSchema.parse(buildGame())).not.toThrow();
    expect(() => SessionSchema.parse(buildSession())).not.toThrow();
    expect(() => UserSchema.parse(buildUser())).not.toThrow();
    expect(() => OnlinePlayerSchema.parse(player())).not.toThrow();
  });

  it('isolates mutable state across fixtures and caller overrides', () => {
    const game = buildGame();
    const session = buildSession({ currentGame: game });
    session.currentGame?.state.guessObjectsIds.push('object-1');
    session.gameConfig.categories.push({
      id: 'category-1',
      name: 'Test',
      isPublished: true,
    });
    session.players.pop();

    expect(game.state.guessObjectsIds).toEqual([]);
    expect(buildSession().players).toHaveLength(2);
    expect(buildSession().gameConfig.categories).toEqual([]);
    expect(buildGame().config.categories).toEqual([]);
  });

  it('applies entity overrides', () => {
    const user = buildUser({ username: 'alice', isVerified: false });
    expect(user).toMatchObject({ username: 'alice', isVerified: false });
    expect(player(user.username, false, { id: user.id })).toMatchObject({
      username: 'alice',
      connected: false,
      id: user.id,
    });
  });
});
