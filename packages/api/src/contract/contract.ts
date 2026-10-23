import { initContract } from '@ts-rest/core';
import { authContract } from '../auth/auth.contract';
import { gameRecordContract } from '../game-record/game-record.contract';
import { deprecatedUserGameRecordContract } from '../game-record/game-record.deprecated.contract';
import { guessObjectAdminContract } from '../guess-object/guess-object.admin.contract';
import { guessObjectContract } from '../guess-object/guess-object.contract';
import { healthContract } from '../health/health.contract';
import { packAdminContract } from '../pack/pack.admin.contract';
import { packContract } from '../pack/pack.contract';
import { deprecatedCategoryContract } from '../pack/pack.deprecated.contract';
import { searchAdminContract } from '../search/search.admin.contract';
import { sentenceContract } from '../sentence/sentence.contract';
import { sessionContract } from '../session/session.contract';
import { userContract } from '../user/user.contract';
import { worldLocationAdminContract } from '../world-location/world-location.admin.contract';
import type { ApiDomain } from './api-domain';
import { commonErrorResponses } from './errors/api-error.schema';

type ApiDomainPath = `/${ApiDomain}` | `/${ApiDomain}/${string}`;

type ApiDomainRouter = {
  readonly [name: string]: { readonly path: ApiDomainPath } | ApiDomainRouter;
};

type ApiDomainRouters = Readonly<Record<string, ApiDomainRouter>>;

const c = initContract();

const publicRouters = {
  auth: authContract,
  health: healthContract,
  user: { ...deprecatedUserGameRecordContract, ...userContract },
  gameRecord: gameRecordContract,
  session: sessionContract,
  category: deprecatedCategoryContract,
  pack: packContract,
  guessObjects: guessObjectContract,
  sentence: sentenceContract,
} satisfies ApiDomainRouters;

const adminRouters = {
  guessObjects: guessObjectAdminContract,
  pack: packAdminContract,
  search: searchAdminContract,
  worldLocation: worldLocationAdminContract,
} satisfies ApiDomainRouters;

export const contract = c.router(
  {
    ...publicRouters,
    admin: c.router(adminRouters, { pathPrefix: '/admin' }),
  },
  { commonResponses: { ...commonErrorResponses } },
);

export type AppContract = typeof contract;
