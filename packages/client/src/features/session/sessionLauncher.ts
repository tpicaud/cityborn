'use client';

import { SessionMode } from '@cityborn/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Navigation } from '../../platform/navigation';
import { useError } from '../../shared/errorContext';
import type { SessionApi } from './sessionApi';

export const JoinSessionSchema = z.object({
  code: z.string().min(1, 'Veuillez entrer un code'),
});

export type JoinSessionFormValues = z.infer<typeof JoinSessionSchema>;

export function useJoinSessionForm(): UseFormReturn<JoinSessionFormValues> {
  return useForm<JoinSessionFormValues>({
    resolver: zodResolver(JoinSessionSchema),
    defaultValues: { code: '' },
  });
}

export const soloSessionPath = '/session/solo';

export function multiSessionPath(sessionID: string): string {
  return `/session/multi/${sessionID}`;
}

export interface SessionLauncherOptions {
  sessionApi: SessionApi;
  navigation: Navigation;
}

export interface SessionLauncher {
  playSolo: () => void;
  playMulti: () => Promise<void>;
  joinSession: (code: string) => Promise<void>;
}

export function useSessionLauncher({
  sessionApi,
  navigation,
}: SessionLauncherOptions): SessionLauncher {
  const { invokeError } = useError();

  return {
    playSolo: () => navigation.push(soloSessionPath),

    playMulti: async () => {
      const result = await sessionApi.createSession({
        mode: SessionMode.MULTI,
      });
      if (!result.ok) return invokeError(result.error);
      navigation.push(multiSessionPath(result.data.id));
    },

    joinSession: async (code: string) => {
      const result = await sessionApi.fetchSession(code);
      if (!result.ok) return invokeError(result.error);
      navigation.push(multiSessionPath(code));
    },
  };
}
