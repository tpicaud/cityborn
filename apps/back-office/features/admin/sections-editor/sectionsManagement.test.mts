import '../../../../../scripts/test-rendering/dom';
import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import {
  buildAdminTheme,
  buildCatalogSection,
  buildPack,
  type CatalogSection,
  CatalogSectionMoveDirection,
  ErrorCode,
} from '@cityborn/api';
import {
  type SectionsManagement,
  useSectionsManagement,
} from '@cityborn/client/admin';
import { act } from 'react';
import {
  type HookRender,
  renderHook,
  waitFor,
} from '../../../test/rendering/renderHook.mjs';

const section: CatalogSection = buildCatalogSection({
  packIds: [buildPack().id],
});
const second: CatalogSection = buildCatalogSection({
  id: '00000000-0000-4000-8000-000000000081',
  name: 'Événements',
});
const sections: CatalogSection[] = [section, second];
function readResponse(request: Request): Response {
  const path: string = new URL(request.url).pathname.replace(/\/$/, '');
  if (path === '/admin/catalog-section') return Response.json(sections);
  if (path === '/admin/theme') return Response.json([buildAdminTheme()]);
  if (path === '/admin/pack') return Response.json([buildPack()]);
  throw new Error(`Unexpected request: ${request.method} ${path}`);
}
describe('useSectionsManagement', () => {
  const failures: {
    name: string;
    act: (editor: SectionsManagement) => Promise<boolean>;
  }[] = [
    {
      name: 'creation',
      act: (editor) =>
        editor.createSection({ name: 'Classiques', themeId: null }),
    },
    {
      name: 'rename',
      act: (editor) =>
        editor.renameSection({ id: section.id, name: 'Classiques' }),
    },
    {
      name: 'section move',
      act: (editor) =>
        editor.moveSection({
          id: section.id,
          direction: CatalogSectionMoveDirection.DOWN,
        }),
    },
    { name: 'deletion', act: (editor) => editor.deleteSection(section.id) },
    {
      name: 'pack addition',
      act: (editor) =>
        editor.addPack({ id: section.id, packId: buildPack().id }),
    },
    {
      name: 'pack removal',
      act: (editor) =>
        editor.removePack({ id: section.id, packId: buildPack().id }),
    },
    {
      name: 'pack move',
      act: (editor) =>
        editor.movePack({
          id: section.id,
          packId: buildPack().id,
          direction: CatalogSectionMoveDirection.UP,
        }),
    },
  ];
  failures.forEach(({ name, act: write }) => {
    it(`keeps the cache and reports the error after a rejected ${name}`, async (context: TestContext) => {
      const rendered: HookRender<SectionsManagement> = await renderHook({
        context,
        useHook: useSectionsManagement,
        respond: (request) =>
          request.method === 'GET'
            ? readResponse(request)
            : Response.json(
                {
                  code: ErrorCode.CATALOG_SECTION_NAME_ALREADY_EXISTS,
                  statusCode: 409,
                  message: 'Conflict',
                },
                { status: 409 },
              ),
      });
      await waitFor(() => !rendered.current.isLoading);
      const previousSections: CatalogSection[] | undefined =
        rendered.current.groups[0]?.sections;
      let success: boolean | undefined;

      await act(async () => {
        success = await write(rendered.current);
      });

      assert.equal(success, false);
      assert.deepEqual(rendered.current.groups[0]?.sections, previousSections);
      assert.deepEqual(rendered.current.groups[0]?.sections, sections);
      assert.equal(rendered.current.isBusy, false);
      assert.match(
        rendered.container.querySelector('[role="alert"]')?.textContent ?? '',
        /Une section porte déjà ce nom/,
      );
    });
  });
  it('keeps the previous data until the save succeeds and prevents concurrent writes', async (context: TestContext) => {
    const renamed: CatalogSection = { ...section, name: 'Classiques' };
    let finish: ((response: Response) => void) | undefined;
    let writes: number = 0;
    const response: Promise<Response> = new Promise((resolve) => {
      finish = resolve;
    });
    const rendered: HookRender<SectionsManagement> = await renderHook({
      context,
      useHook: useSectionsManagement,
      respond: (request) => {
        if (request.method === 'GET') return readResponse(request);
        writes += 1;
        return response;
      },
    });
    await waitFor(() => !rendered.current.isLoading);
    let pending: Promise<boolean> | undefined;

    await act(async () => {
      pending = rendered.current.renameSection({
        id: section.id,
        name: renamed.name,
      });
    });
    assert.equal(rendered.current.isBusy, true);
    assert.deepEqual(rendered.current.groups[0]?.sections, sections);
    assert.equal(await rendered.current.deleteSection(section.id), false);
    assert.equal(writes, 1);
    await act(async () => {
      assert.ok(finish);
      finish(Response.json(renamed));
      await pending;
    });

    assert.deepEqual(rendered.current.groups[0]?.sections, [renamed, second]);
    assert.equal(rendered.current.isBusy, false);
    assert.equal(rendered.container.querySelector('[role="alert"]'), null);
  });
});
