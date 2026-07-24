import { initContract } from '@ts-rest/core';
import { authContract } from './auth.contract';
import { categoryAdminContract } from './category.admin.contract';
import { categoryContract } from './category.contract';
import { guessObjectAdminContract } from './guess-object.admin.contract';
import { guessObjectContract } from './guess-object.contract';
import { searchAdminContract } from './search.admin.contract';
import { sentenceContract } from './sentence.contract';
import { sessionContract } from './session.contract';
import { userContract } from './user.contract';
import { worldLocationAdminContract } from './world-location.admin.contract';

const c = initContract();

export const contract = c.router({
  auth: authContract,
  user: userContract,
  session: sessionContract,
  category: categoryContract,
  guessObjects: guessObjectContract,
  sentence: sentenceContract,
  admin: c.router(
    {
      category: categoryAdminContract,
      guessObjects: guessObjectAdminContract,
      search: searchAdminContract,
      worldLocation: worldLocationAdminContract,
    },
    { pathPrefix: '/admin' },
  ),
});

export type AppContract = typeof contract;
