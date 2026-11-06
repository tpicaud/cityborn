import { createRequire, registerHooks } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const requireFromPackage: NodeJS.Require = createRequire(
  resolve(process.cwd(), 'package.json'),
);
const reactModules: Map<string, string> = new Map(
  [
    'react',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    'react-dom',
    'react-dom/client',
    'react-dom/test-utils',
  ].map((specifier: string): [string, string] => [
    specifier,
    pathToFileURL(requireFromPackage.resolve(specifier)).href,
  ]),
);

registerHooks({
  resolve(specifier, context, nextResolve) {
    const target: string | undefined = reactModules.get(specifier);
    return nextResolve(target ?? specifier, context);
  },
});
