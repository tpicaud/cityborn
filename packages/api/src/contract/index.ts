import { initContract } from '@ts-rest/core';
import { authContract } from './auth.contract.js';
import { categoryContract } from './category.contract.js';
import { categoryAdminContract } from './category-admin.contract.js';
import { eventContract } from './event.contract.js';
import { guessObjectContract } from './guess-object.contract.js';
import { guessObjectAdminContract } from './guess-object-admin.contract.js';
import { searchAdminContract } from './search-admin.contract.js';
import { sentenceContract } from './sentence.contract.js';
import { sessionContract } from './session.contract.js';
import { userContract } from './user.contract.js';

const c = initContract();

export const contract = c.router({
  auth: authContract,
  user: userContract,
  session: sessionContract,
  category: categoryContract,
  guessObjects: guessObjectContract,
  sentence: sentenceContract,
  event: eventContract,
  admin: c.router(
    {
      category: categoryAdminContract,
      guessObjects: guessObjectAdminContract,
      search: searchAdminContract,
    },
    { pathPrefix: '/admin' },
  ),
});

export type AppContract = typeof contract;
