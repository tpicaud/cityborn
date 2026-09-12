import assert from 'node:assert/strict';
import test from 'node:test';
import type { CategoryId, PlayerId, UserId, Username } from './common.schema';
import {
  CategoryIdSchema,
  PlayerIdSchema,
  UserIdSchema,
  UsernameSchema,
} from './common.schema';

type IsAssignable<From, To> = From extends To ? true : false;
type AssertFalse<Value extends false> = Value;
type AssertTrue<Value extends true> = Value;

const brandedIdentifierAssignability: [
  AssertFalse<IsAssignable<UserId, CategoryId>>,
  AssertFalse<IsAssignable<CategoryId, UserId>>,
  AssertTrue<IsAssignable<Username, PlayerId>>,
  AssertFalse<IsAssignable<PlayerId, Username>>,
] = [false, false, true, false];

test('ID brands preserve intended assignability', () => {
  assert.deepEqual(brandedIdentifierAssignability, [false, false, true, false]);
});

test('ID schemas preserve their wire values', () => {
  assert.equal(UserIdSchema.parse('user-1'), 'user-1');
  assert.equal(CategoryIdSchema.parse('category-1'), 'category-1');
  assert.equal(UsernameSchema.parse('alice'), 'alice');
  assert.equal(PlayerIdSchema.parse('alice'), 'alice');
});
