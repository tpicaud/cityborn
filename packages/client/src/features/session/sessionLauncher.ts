'use client';

import {
  type Session,
  type SessionId,
  SessionIdSchema,
  SessionMode,
} from '@cityborn/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Navigation, NavigationPath } from '../../platform/navigation';
import { useError } from '../../shared/errorContext';
import type { SessionApi } from './sessionApi';

export const JoinSessionSchema = z.object({
  code: z.string().min(1, 'Veuillez entrer un code').pipe(SessionIdSchema),
});

export type JoinSessionFormInput = z.input<typeof JoinSessionSchema>;
export type JoinSessionFormValues = z.output<typeof JoinSessionSchema>;

export type JoinSessionForm = UseFormReturn<
  JoinSessionFormInput,
  undefined,
  JoinSessionFormValues
>;

export function useJoinSessionForm(): JoinSessionForm {
  return useForm<JoinSessionFormInput, undefined, JoinSessionFormValues>({
    resolver: zodResolver(JoinSessionSchema),
    defaultValues: { code: '' },
  });
}

export const soloSessionPath: NavigationPath = '/session/solo';

const multiSessionPathPrefix = '/session/multi/';

export function multiSessionPath(sessionID: SessionId): NavigationPath {
  return `${multiSessionPathPrefix}${sessionID}`;
}

export function sessionIdFromMultiSessionPath(path: string): SessionId | null {
  if (!path.startsWith(multiSessionPathPrefix)) return null;
  const pathSegment: string = path.slice(multiSessionPathPrefix.length);
  if (pathSegment === '' || pathSegment.includes('/')) return null;
  return SessionIdSchema.parse(pathSegment);
}

export type SessionLauncherOptions = {
  sessionApi: SessionApi;
  navigation: Navigation;
};

export type SessionLauncher = {
  playSolo: () => void;
  playMulti: () => Promise<void>;
  joinSession: (code: SessionId) => Promise<void>;
};

export function useSessionLauncher({
  sessionApi,
  navigation,
}: SessionLauncherOptions): SessionLauncher {
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
