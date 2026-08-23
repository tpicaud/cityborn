import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getMinSupportedApiVersion,
  setMinSupportedApiVersion,
} from './minSupportedApiVersionStore';

test('getMinSupportedApiVersion returns null before any version is set', () => {
  assert.equal(getMinSupportedApiVersion(), null);
});

test('setMinSupportedApiVersion updates the value returned by getMinSupportedApiVersion', () => {
  setMinSupportedApiVersion(4);

  assert.equal(getMinSupportedApiVersion(), 4);
});

test('setMinSupportedApiVersion overwrites a previously set value', () => {
  setMinSupportedApiVersion(4);
  setMinSupportedApiVersion(5);

  assert.equal(getMinSupportedApiVersion(), 5);
});
