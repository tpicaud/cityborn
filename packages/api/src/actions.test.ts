import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  httpActionRoutes,
  resolveHttpAction,
  resolveWsAction,
  wsLifecycleEventName,
} from './actions';
import { wsChannels } from './ws/registry';

function matchesRoute(pattern: string, path: string): boolean {
  const patternSegments: string[] = pattern.split('/').filter(Boolean);
  const pathSegments: string[] = path.split('/').filter(Boolean);
  if (patternSegments.length !== pathSegments.length) {
    return false;
  }
  return patternSegments.every(
    (segment: string, index: number): boolean =>
      segment.startsWith(':') || segment === pathSegments[index],
  );
}

describe('resolveHttpAction', () => {
  it('resolves every contract route after Nest slash normalization', () => {
    assert.equal(httpActionRoutes.length, 43);
    for (const route of httpActionRoutes) {
      assert.equal(resolveHttpAction(route.method, route.path), route.action);
    }
    assert.equal(
      resolveHttpAction('POST', '/session/'),
      'session.createSession',
    );
    assert.equal(
      resolveHttpAction('GET', '/admin/category/tree'),
      'admin.category.getCategoryTrees',
    );
    assert.equal(resolveHttpAction('GET', '/'), undefined);
  });

  it('has unique method and path pairs', () => {
    const pairs: string[] = httpActionRoutes.map(
      ({ method, path }) => `${method} ${path}`,
    );

    assert.equal(new Set(pairs).size, pairs.length);
  });

  it('has no earlier route that shadows a later route', () => {
    for (const [index, route] of httpActionRoutes.entries()) {
      const representativePath: string = route.path.replace(/:[^/]+/g, 'value');
      const earlierMatch = httpActionRoutes
        .slice(0, index)
        .find(
          (earlier) =>
            earlier.method === route.method &&
            matchesRoute(earlier.path, representativePath),
        );
      assert.equal(earlierMatch, undefined, `${route.method} ${route.path}`);
    }
  });
});

describe('resolveWsAction', () => {
  it('resolves every client event and lifecycle event from the channels', () => {
    for (const channel of Object.values(wsChannels)) {
      for (const event of Object.keys(channel.clientToServer)) {
        assert.equal(
          resolveWsAction(`${channel.domain}:${event}`),
          `${channel.domain}.${event}`,
        );
      }
      assert.equal(
        resolveWsAction(wsLifecycleEventName(channel, 'connect')),
        `${channel.domain}.connect`,
      );
      assert.equal(
        resolveWsAction(wsLifecycleEventName(channel, 'disconnect')),
        `${channel.domain}.disconnect`,
      );
    }
    assert.equal(resolveWsAction('session:unknown'), undefined);
  });
});

describe('contract actions', () => {
  it('keeps the action vocabulary visible when contract keys change', () => {
    const actions: string[] = [
      ...httpActionRoutes.map(({ action }) => action),
      ...Object.values(wsChannels).flatMap((channel) => [
        ...Object.keys(channel.clientToServer).map(
          (event: string) => `${channel.domain}.${event}`,
        ),
        `${channel.domain}.connect`,
        `${channel.domain}.disconnect`,
      ]),
    ].sort();

    assert.deepEqual(actions, [
      'admin.category.createCategory',
      'admin.category.deleteCategory',
      'admin.category.getAllCategories',
      'admin.category.getCategory',
      'admin.category.getCategoryTrees',
      'admin.category.getFullCategory',
      'admin.category.updateCategory',
      'admin.guess-object.createGuessObject',
      'admin.guess-object.deleteGuessObject',
      'admin.guess-object.getFullGuessObject',
      'admin.guess-object.getFullGuessObjects',
      'admin.guess-object.getGuessObject',
      'admin.guess-object.getGuessObjects',
      'admin.guess-object.updateGuessObject',
      'admin.search.searchGuessObject',
      'admin.search.searchWorldLocation',
      'admin.world-location.createWorldLocation',
      'auth.deleteUser',
      'auth.me',
      'auth.refresh',
      'auth.requestPasswordReset',
      'auth.resendVerificationEmail',
      'auth.resetPassword',
      'auth.signIn',
      'auth.signInWithApple',
      'auth.signInWithGoogle',
      'auth.signUp',
      'auth.validatePasswordResetToken',
      'auth.verifyEmail',
      'category.getCategories',
      'category.getCategory',
      'category.getCategoryTrees',
      'guess-object.getGuessObject',
      'guess-object.getGuessObjects',
      'health.check',
      'sentence.getSentence',
      'session.connect',
      'session.createGame',
      'session.createSession',
      'session.disconnect',
      'session.endSoloGame',
      'session.finalizeGame',
      'session.getSession',
      'session.guess',
      'session.join',
      'session.kickPlayer',
      'session.nextRound',
      'session.playAgain',
      'session.reconnect',
      'session.startGame',
      'session.updateGameConfig',
      'session.updateHost',
      'user.getGameRecords',
      'user.saveSoloGameRecord',
    ]);
  });
});
