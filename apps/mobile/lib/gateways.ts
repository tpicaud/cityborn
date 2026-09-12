import type {
  AuthGateway,
  CategoryGateway,
  SessionGateway,
  UserGateway,
} from '@cityborn/client/ports';
import { getCurrentUser } from './api/auth';
import { fetchCategoryTrees } from './api/category';
import {
  createSession,
  createSoloGame,
  fetchSession,
  finalizeGame,
} from './api/session';
import { getGameRecords } from './api/user';

export const authGateway: AuthGateway = { getCurrentUser };

export const sessionGateway: SessionGateway = {
  createSession,
  fetchSession,
  createSoloGame,
  finalizeGame,
};

export const categoryGateway: CategoryGateway = { fetchCategoryTrees };

export const userGateway: UserGateway = { getGameRecords };
