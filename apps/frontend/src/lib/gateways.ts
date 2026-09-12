import type {
  AuthGateway,
  SessionGateway,
  UserGateway,
} from '@cityborn/client/ports';
import { getCurrentUser } from '@/server/use-server/auth';
import {
  createSession,
  createSoloGame,
  fetchSession,
  finalizeGame,
} from '@/server/use-server/session';
import { getGameRecords } from '@/server/use-server/user';

export const authGateway: AuthGateway = { getCurrentUser };

export const sessionGateway: SessionGateway = {
  createSession,
  fetchSession,
  createSoloGame,
  finalizeGame,
};

export const userGateway: UserGateway = { getGameRecords };
