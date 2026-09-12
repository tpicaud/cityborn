import type { SessionApi } from '@cityborn/client/session';
import {
  createSession,
  createSoloGame,
  fetchSession,
  finalizeGame,
} from '@/server/use-server/session';

export const sessionApi: SessionApi = {
  createSession,
  fetchSession,
  createSoloGame,
  finalizeGame,
};
