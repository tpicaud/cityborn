import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  type HttpAction,
  type HttpActionRoute,
  httpActionRoutes,
  resolveHttpAction,
  resolveWsAction,
  type WsAction,
  type WsLifecycleAction,
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

describe('httpActionRoutes', () => {
  it('lists the action of every contract route', () => {
    const actions: string[] = httpActionRoutes
      .map(({ action }: HttpActionRoute): string => action)
      .sort();

    assert.deepEqual(actions, [
      'admin.guess-object.createGuessObject',
      'admin.guess-object.deleteGuessObject',
      'admin.guess-object.getFullGuessObject',
      'admin.guess-object.getFullGuessObjects',
      'admin.guess-object.getGuessObject',
      'admin.guess-object.getGuessObjects',
      'admin.guess-object.updateGuessObject',
      'admin.pack.createPack',
      'admin.pack.deletePack',
      'admin.pack.getAllPacks',
      'admin.pack.getFullPack',
      'admin.pack.getPack',
      'admin.pack.getPackTrees',
      'admin.pack.updatePack',
      'admin.search.searchGuessObject',
      'admin.search.searchWorldLocation',
      'admin.theme.createTheme',
      'admin.theme.deleteTheme',
      'admin.theme.getThemes',
      'admin.theme.updateTheme',
      'admin.world-location.createWorldLocation',
      'auth.cookie.refresh',
      'auth.cookie.signIn',
      'auth.cookie.signInWithApple',
      'auth.cookie.signInWithGoogle',
      'auth.cookie.signUp',
      'auth.cookie.updatePassword',
      'auth.deleteUser',
      'auth.me',
      'auth.refresh',
      'auth.requestPasswordReset',
      'auth.resendVerificationEmail',
      'auth.resetPassword',
      'auth.signIn',
      'auth.signInWithApple',
      'auth.signInWithGoogle',
      'auth.signOut',
      'auth.signUp',
      'auth.updatePassword',
      'auth.verifyEmail',
      'category.getCategories',
      'category.getCategory',
      'category.getCategoryTrees',
      'game-record.getGameRecords',
      'game-record.saveSoloGameRecord',
      'guess-object.getGuessObject',
      'guess-object.getGuessObjects',
      'health.check',
      'pack.getPack',
      'pack.getPackTrees',
      'pack.getPacks',
      'sentence.getSentence',
      'session.createGame',
      'session.createSession',
      'session.endSoloGame',
      'session.finalizeGame',
      'session.getSession',
      'user.getGameRecords',
      'user.saveSoloGameRecord',
      'user.updateUsername',
    ]);
  });

  it('has unique actions', () => {
    const actions: string[] = httpActionRoutes.map(
      ({ action }: HttpActionRoute): string => action,
    );

    assert.equal(new Set(actions).size, actions.length);
  });

  it('has unique method and path pairs', () => {
    const pairs: string[] = httpActionRoutes.map(
      ({ method, path }: HttpActionRoute): string => `${method} ${path}`,
    );

    assert.equal(new Set(pairs).size, pairs.length);
  });

  it('has no earlier route that shadows a later route', () => {
    const shadowedRoutes: string[] = httpActionRoutes
      .filter((route: HttpActionRoute, index: number): boolean => {
        const representativePath: string = route.path.replace(
          /:[^/]+/g,
          'value',
        );
        return httpActionRoutes
          .slice(0, index)
          .some(
            (earlier: HttpActionRoute): boolean =>
              earlier.method === route.method &&
              matchesRoute(earlier.path, representativePath),
          );
      })
      .map(({ method, path }: HttpActionRoute): string => `${method} ${path}`);

    assert.deepEqual(shadowedRoutes, []);
  });
});

describe('resolveHttpAction', () => {
  it('resolves the action of every contract route', () => {
    const resolvedActions: (HttpAction | undefined)[] = httpActionRoutes.map(
      ({ method, path }: HttpActionRoute): HttpAction | undefined =>
        resolveHttpAction(method, path),
    );

    assert.deepEqual(
      resolvedActions,
      httpActionRoutes.map(({ action }: HttpActionRoute): string => action),
    );
  });

  it('resolves a path with the trailing slash that Nest normalizes', () => {
    const action: HttpAction | undefined = resolveHttpAction(
      'POST',
      '/session/',
    );

    assert.equal(action, 'session.createSession');
  });

  it('resolves a static path that a parameterized route could match', () => {
    const action: HttpAction | undefined = resolveHttpAction(
      'GET',
      '/admin/pack/tree',
    );

    assert.equal(action, 'admin.pack.getPackTrees');
  });

  it('prefixes nested router keys below the domain', () => {
    const action: HttpAction | undefined = resolveHttpAction(
      'POST',
      '/auth/cookie/sign-in',
    );

    assert.equal(action, 'auth.cookie.signIn');
  });

  it('resolves no action for a path outside the contract', () => {
    const action: HttpAction | undefined = resolveHttpAction('GET', '/');

    assert.equal(action, undefined);
  });
});

describe('resolveWsAction', () => {
  it('resolves the client and lifecycle events of every channel', () => {
    const eventNames: string[] = Object.values(wsChannels).flatMap(
      (channel): string[] => [
        ...Object.keys(channel.clientToServer).map(
          (event: string): string => `${channel.domain}:${event}`,
        ),
        wsLifecycleEventName(channel, 'connect'),
        wsLifecycleEventName(channel, 'disconnect'),
      ],
    );

    const actions: (WsAction | WsLifecycleAction | undefined)[] =
      eventNames.map(resolveWsAction);

    assert.deepEqual(actions, [
      'session.join',
      'session.reconnect',
      'session.updateHost',
      'session.updateGameConfig',
      'session.startGame',
      'session.guess',
      'session.submitGuess',
      'session.nextRound',
      'session.playAgain',
      'session.connect',
      'session.disconnect',
    ]);
  });

  it('resolves no action for an event outside the channels', () => {
    const action: WsAction | WsLifecycleAction | undefined =
      resolveWsAction('session:unknown');

    assert.equal(action, undefined);
  });
});
