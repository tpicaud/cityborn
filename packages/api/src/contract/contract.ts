import { initContract } from '@ts-rest/core';
import { authContract } from '../auth/auth.contract';
import { categoryAdminContract } from '../category/category.admin.contract';
import { categoryContract } from '../category/category.contract';
import { guessObjectAdminContract } from '../guess-object/guess-object.admin.contract';
import { guessObjectContract } from '../guess-object/guess-object.contract';
import { healthContract } from '../health/health.contract';
import { searchAdminContract } from '../search/search.admin.contract';
import { sentenceContract } from '../sentence/sentence.contract';
import { sessionContract } from '../session/session.contract';
import { userContract } from '../user/user.contract';
import { worldLocationAdminContract } from '../world-location/world-location.admin.contract';
import { commonErrorResponses } from './errors/api-error.schema';

const c = initContract();

export const contract = c.router(
  {
    auth: authContract,
    health: healthContract,
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
  },
  { commonResponses: { ...commonErrorResponses } },
);

export type AppContract = typeof contract;
