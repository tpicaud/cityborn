import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  findDeprecatedItems,
  resolveDeprecationStatus,
} from '../openapi/compat/find-deprecations';
import { loadManifest, loadPolicy } from '../openapi/compat/run-compat-check';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = join(__dirname, '..');

function main() {
  const manifest = loadManifest(
    join(apiRoot, 'openapi/versions/versions-manifest.json'),
  );
  const policy = loadPolicy(join(apiRoot, 'openapi/compat-policy.yaml'));
  const items = findDeprecatedItems(join(apiRoot, 'src'));

  if (items.length === 0) {
    console.log('No @deprecated / @deprecatedSince markers found.');
    return;
  }

  const now = new Date();

  for (const item of items) {
    const status = resolveDeprecationStatus(
      item.deprecatedSince,
      manifest,
      policy,
      now,
    );
    const location = `${relative(apiRoot, item.file)}:${item.line}`;

    console.log(`\n${item.symbol}  (${location})`);
    console.log(`  deprecated since: ${item.deprecatedSince}`);
    console.log(`  reason: ${item.reason}`);

    if (status.kind === 'not-shipped') {
      console.log('  status: ❓ not yet released');
    } else if (status.kind === 'eligible') {
      console.log(
        `  status: ✅ eligible for removal (shipped in ${status.originVersion.file})`,
      );
    } else {
      const extra =
        status.versionsStillNeeded > 0
          ? `, needs ${status.versionsStillNeeded} more version(s) released`
          : '';
      console.log(
        `  status: ⏳ not yet eligible (shipped in ${status.originVersion.file}) — day window expires ${status.dayWindowExpiresAt}${extra}`,
      );
    }
  }
}

main();
