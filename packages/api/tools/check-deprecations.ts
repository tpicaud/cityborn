import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type DeprecationStatus,
  findDeprecatedItems,
  resolveDeprecationStatus,
} from './compat/find-deprecations';
import { loadManifest, loadPolicy } from './compat/run-compat-check';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = join(__dirname, '..');

function formatStatus(status: DeprecationStatus): string {
  if (status.kind === 'not-shipped') return '  status: ❓ not yet released';
  if (status.kind === 'eligible') {
    return `  status: ✅ eligible for removal (shipped in ${status.originVersion.file})`;
  }

  const extra: string =
    status.versionsStillNeeded > 0
      ? `, needs ${status.versionsStillNeeded} more version(s) released`
      : '';
  return `  status: ⏳ not yet eligible (shipped in ${status.originVersion.file}) — day window expires ${status.dayWindowExpiresAt}${extra}`;
}

function main() {
  const manifest = loadManifest(
    join(apiRoot, 'openapi/versions/versions-manifest.json'),
  );
  const policy = loadPolicy(join(apiRoot, 'openapi/compat-policy.json'));
  const items = findDeprecatedItems(join(apiRoot, 'src'));

  if (items.length === 0) {
    console.log('No @deprecated / @deprecatedSince markers found.');
    return;
  }

  const now = new Date();

  items.forEach((item) => {
    const status: DeprecationStatus = resolveDeprecationStatus(
      item.deprecatedSince,
      manifest,
      policy,
      now,
    );
    const location = `${relative(apiRoot, item.file)}:${item.line}`;

    console.log(`\n${item.symbol}  (${location})`);
    console.log(`  deprecated since: ${item.deprecatedSince}`);
    console.log(`  reason: ${item.reason}`);
    console.log(formatStatus(status));
  });
}

main();
