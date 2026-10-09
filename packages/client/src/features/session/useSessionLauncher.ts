'use client';

import { type Session, type SessionId, SessionMode } from '@cityborn/api';
import type { Navigation } from '../../platform/navigation';
import { type DomainApis, useDomainApis } from '../../shared/apiProvider';
import { useError } from '../../shared/errorContext';
import { multiSessionPath, soloSessionPath } from './sessionPath';

export type SessionLauncherOptions = {
  navigation: Navigation;
};

export type SessionLauncher = {
  playSolo: () => void;
  playMulti: () => Promise<void>;
  joinSession: (code: SessionId) => Promise<void>;
};

export function useSessionLauncher({
  navigation,
}: SessionLauncherOptions): SessionLauncher {
  const { sessionApi }: DomainApis = useDomainApis();
  const { invokeError } = useError();

  return {
    playSolo: () => navigation.push(soloSessionPath),

    playMulti: async () => {
      try {
        const session: Session = await sessionApi.createSession({
          mode: SessionMode.MULTI,
        });
        navigation.push(multiSessionPath(session.id));
      } catch (error: unknown) {
        invokeError(error);
      }
    },

    joinSession: async (code: SessionId) => {
      try {
        await sessionApi.fetchSession(code);
        navigation.push(multiSessionPath(code));
      } catch (error: unknown) {
        invokeError(error);
      }
    },
  };
}
