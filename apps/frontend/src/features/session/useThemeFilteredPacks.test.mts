import '../../../../../scripts/test-rendering/dom';
import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import {
  buildCatalogSection,
  buildPack,
  buildTheme,
  type CatalogSection,
  ErrorCode,
  type Pack,
  type Theme,
} from '@cityborn/api';
import {
  type ThemeFilteredPacks,
  useThemeFilteredPacks,
} from '@cityborn/client/session';
import { act } from 'react';
import {
  type HookRender,
  renderHook,
  waitFor,
} from '../../../test/rendering/renderHook.mjs';

describe('useThemeFilteredPacks', () => {
  it('restores sections after a retry without losing the selected theme or complete catalogue', async (context: TestContext) => {
    const sport: Theme = buildTheme({ name: 'Sport' });
    const music: Theme = buildTheme({
      id: '00000000-0000-4000-8000-000000000051',
      name: 'Musique',
    });
    const tennis: Pack = buildPack({ themeId: sport.id, name: 'Tennis' });
    const rock: Pack = buildPack({
      id: 'rock',
      themeId: music.id,
      name: 'Rock',
    });
    const section: CatalogSection = buildCatalogSection({
      themeId: sport.id,
      packIds: [tennis.id],
      name: 'Tennis',
    });
    let fails: boolean = true;
    let requests: number = 0;
    const rendered: HookRender<ThemeFilteredPacks> = await renderHook({
      context,
      useHook: useThemeFilteredPacks,
      respond: (request) => {
        const path: string = new URL(request.url).pathname.replace(/\/$/, '');
        if (path === '/pack') return Response.json([tennis, rock]);
        if (path === '/theme') return Response.json([sport, music]);
        assert.equal(path, '/catalog-section');
        requests += 1;
        return fails
          ? Response.json(
              {
                code: ErrorCode.UNKNOWN_ERROR,
                statusCode: 500,
                message: 'Unavailable',
              },
              { status: 500 },
            )
          : Response.json([section]);
      },
    });
    await waitFor(
      () => !rendered.current.isLoading && rendered.current.hasSectionsError,
    );
    await act(async () => {
      rendered.current.selectTheme(sport.id);
    });
    assert.deepEqual(
      rendered.current.sections.map(({ name, packs }) => ({ name, packs })),
      [{ name: 'Tous les packs', packs: [tennis] }],
    );
    fails = false;

    await act(async () => {
      rendered.current.reloadSections();
    });
    await waitFor(
      () =>
        !rendered.current.hasSectionsError &&
        !rendered.current.isReloadingSections,
    );

    assert.equal(requests, 2);
    assert.equal(rendered.current.selectedTheme?.id, sport.id);
    assert.deepEqual(
      rendered.current.sections.map(({ name }) => name),
      ['Tennis', 'Tous les packs'],
    );
    assert.deepEqual(rendered.current.sections[1]?.packs, [tennis]);
    assert.equal(rendered.container.querySelector('[role="alert"]'), null);
  });
});
