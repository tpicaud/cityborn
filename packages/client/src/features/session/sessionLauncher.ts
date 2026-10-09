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
import type { Navigation } from '../../platform/navigation';
import { type DomainApis, useDomainApis } from '../../shared/apiProvider';
import { useError } from '../../shared/errorContext';
import { multiSessionPath, soloSessionPath } from './sessionPath';

const JoinSessionSchema = z.object({
  code: z.string().min(1, 'Veuillez entrer un code').pipe(SessionIdSchema),
});

type JoinSessionFormInput = z.input<typeof JoinSessionSchema>;
export type JoinSessionFormValues = z.output<typeof JoinSessionSchema>;

export type JoinSessionForm = UseFormReturn<
  JoinSessionFormInput,
  undefined,
  JoinSessionFormValues
>;

export type SessionLauncherOptions = {
  navigation: Navigation;
};

export type SessionLauncher = {
  playSolo: () => void;
  playMulti: () => Promise<void>;
  joinSession: (code: SessionId) => Promise<void>;
};

export function useJoinSessionForm(): JoinSessionForm {
  return useForm<JoinSessionFormInput, undefined, JoinSessionFormValues>({
    resolver: zodResolver(JoinSessionSchema),
    defaultValues: { code: '' },
  });
}

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
