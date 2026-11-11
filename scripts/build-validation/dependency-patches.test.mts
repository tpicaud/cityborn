import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import type { RouteTypesManifest } from 'next/dist/server/lib/router-utils/route-types-utils.js';
import {
  generateValidatorFile,
  generateValidatorFileStrict,
} from 'next/dist/server/lib/router-utils/typegen.js';

const require: NodeJS.Require = createRequire(import.meta.url);
const {
  pruneFlattenedImports,
}: {
  pruneFlattenedImports: (input: {
    original: string;
    compiled: string;
  }) => string;
} = require(
  join(
    dirname(require.resolve('@tamagui/cli/package.json')),
    'dist/pruneFlattenedImports.cjs',
  ),
);

describe('pruneFlattenedImports', () => {
  it('removes flattened aliases and preserves type and surviving JSX references', () => {
    const original: string = `import { View as Box, Text, type Props } from 'ui';
export const Screen = (props: Props) => <Box><Text>{props.label}</Text></Box>;`;
    const compiled: string = original.replaceAll('Box>', 'div>');

    const result: string = pruneFlattenedImports({ original, compiled });

    assert.doesNotMatch(result, /View as Box/);
    assert.match(result, /Text, type Props/);
    assert.match(result, /<Text>/);
  });

  it('preserves initially unused imports and bindings shadowed inside functions', () => {
    const original: string = `import { View, AlreadyUnused } from 'ui';
export const Shadow = (View: string) => View;
export const Screen = () => <View />;`;
    const compiled: string = original.replace('<View />', '<div />');

    const result: string = pruneFlattenedImports({ original, compiled });

    assert.match(result, /import \{\s*AlreadyUnused\s*\}/);
    assert.match(result, /\(View: string\) => View/);
  });

  it('preserves module evaluation when removing the last default or namespace binding', () => {
    const cases: string[] = [
      `import Box from 'ui'; export const Screen = () => <Box />;`,
      `import * as UI from 'ui'; export const Screen = () => <UI.Box />;`,
      `import { 'Box-view' as Box } from 'ui'; export const Screen = () => <Box />;`,
    ];

    cases.forEach((original) => {
      const compiled: string = original.replace(/<(?:UI\.)?Box \/>/, '<div />');
      const result: string = pruneFlattenedImports({ original, compiled });

      assert.match(result, /import "ui";/);
      assert.doesNotMatch(result, /import (Box|\*)/);
    });
  });
});

describe('generateValidatorFile', () => {
  const manifest: RouteTypesManifest = {
    appRoutes: {},
    pageRoutes: {},
    layoutRoutes: {},
    appRouteHandlerRoutes: {
      '/favicon.ico': { path: './favicon.ico', groups: {} },
    },
    redirectRoutes: {},
    rewriteRoutes: {},
    appPagePaths: new Set(),
    pagesRouterPagePaths: new Set(),
    layoutPaths: new Set(),
    appRouteHandlers: new Set(['./favicon.ico']),
    pageApiRoutes: new Set(),
    filePathToRoute: new Map(),
    rootParams: new Map(),
  };

  it('omits route handler imports for metadata-only or JavaScript-only routes', () => {
    [generateValidatorFile, generateValidatorFileStrict].forEach((generate) => {
      [new Set(['./favicon.ico']), new Set(['./route.js'])].forEach((paths) => {
        const validator: string = generate({
          ...manifest,
          appRouteHandlers: paths,
        });

        assert.doesNotMatch(validator, /import.*AppRouteHandlerRoutes/);
        assert.doesNotMatch(validator, /import.*NextRequest/);
      });
    });
  });

  it('retains imports and validation for TypeScript route handlers and custom extensions', () => {
    [generateValidatorFile, generateValidatorFileStrict].forEach((generate) => {
      ['./route.ts', './route.api.ts'].forEach((path) => {
        const validator: string = generate({
          ...manifest,
          appRouteHandlers: new Set([path]),
        });

        assert.match(validator, /import.*AppRouteHandlerRoutes/);
        assert.match(validator, /import.*NextRequest/);
        assert.match(validator, /type RouteHandlerConfig/);
        assert.match(validator, /typeof import\("\.\/route(?:\.api)?\.js"\)/);
      });
    });
  });
});
