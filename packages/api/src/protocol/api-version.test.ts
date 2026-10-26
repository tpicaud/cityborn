import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import manifest from '../../openapi/versions/versions-manifest.json';
import { CLIENT_API_VERSION, parseClientApiVersion } from './api-version';

describe('parseClientApiVersion', () => {
  it('accepts positive safe version numbers including future versions', () => {
    [1, 6, 7, 999, '6', '7', '999'].forEach((version) => {
      assert.equal(parseClientApiVersion(version), Number(version));
    });
  });

  it('treats absent and malformed versions as legacy metadata', () => {
    [
      undefined,
      null,
      '',
      ' 7 ',
      '7.0',
      '07',
      '7e0',
      'Infinity',
      'NaN',
      -1,
      0,
      7.5,
      Number.MAX_SAFE_INTEGER + 1,
      [],
      {},
      ['7'],
      true,
    ].forEach((version) => {
      assert.equal(parseClientApiVersion(version), undefined);
    });
  });
});

describe('CLIENT_API_VERSION', () => {
  it('embeds the latest version of the build snapshot', () => {
    assert.ok(CLIENT_API_VERSION >= 7);
    assert.equal(
      CLIENT_API_VERSION,
      Math.max(...manifest.versions.map(({ versionNumber }) => versionNumber)),
    );
  });
});
