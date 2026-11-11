'use client';

import {
  type CreateSession,
  type Pack,
  type PackId,
  type Session,
  SessionIdSchema,
  SessionMode,
} from '@cityborn/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { z } from 'zod';
import { type DomainApis, useDomainApis } from '../../domains/apiProvider';
import { sessionQueryOptions } from '../../domains/session/sessionQueries';
import type { Navigation } from '../../platform/navigation';
import {
  type ErrorReporter,
  useErrorReporter,
} from '../../shared/errorReporter';
import type { FormSubmitHandler } from '../../shared/formSubmitHandler';
import {
  joinableSessionPath,
  packLaunchSessionPath,
  sessionPath,
} from './sessionPath';

const sessionCodeLength: number = 6;
const sessionCodePattern: RegExp = new RegExp(`^\\d{${sessionCodeLength}}$`);

const JoinSessionSchema = z.object({
  code: z
    .string()
    .min(1, 'Veuillez entrer un code')
    .regex(
      sessionCodePattern,
      `Le code doit contenir ${sessionCodeLength} chiffres`,
    )
    .pipe(SessionIdSchema),
});

export function formatSessionCodeInput(sessionCodeInput: string): string {
  return sessionCodeInput.replace(/\D/g, '').slice(0, sessionCodeLength);
}

type JoinSessionFormInput = z.input<typeof JoinSessionSchema>;
type JoinSessionFormValues = z.output<typeof JoinSessionSchema>;

type JoinSessionForm = UseFormReturn<
  JoinSessionFormInput,
  undefined,
  JoinSessionFormValues
>;

export type SessionLauncherOptions = {
  navigation: Navigation;
};

export type SessionLauncher = {
  joinSessionForm: JoinSessionForm;
  playSolo: (pack: Pack) => Promise<void>;
  launchQuickPlay: () => Promise<void>;
  playMulti: () => Promise<void>;
  joinSession: FormSubmitHandler;
};

const joinSessionFormDefaultValues: JoinSessionFormInput = { code: '' };

export function useSessionLauncher({
  navigation,
}: SessionLauncherOptions): SessionLauncher {
  const { sessionApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();
  const { reportError }: ErrorReporter = useErrorReporter();
  const joinSessionForm: JoinSessionForm = useForm<
    JoinSessionFormInput,
    undefined,
    JoinSessionFormValues
  >({
    resolver: zodResolver(JoinSessionSchema),
    defaultValues: joinSessionFormDefaultValues,
  });

  const openNewSession: ({
    createSession,
    launchedPackId,
  }: {
    createSession: CreateSession;
    launchedPackId?: PackId;
  }) => Promise<void> = async ({ createSession, launchedPackId }) => {
    try {
      const session: Session = await sessionApi.createSession(createSession);
      navigation.push(
        launchedPackId === undefined
          ? sessionPath(session)
          : packLaunchSessionPath({ session, packId: launchedPackId }),
      );
    } catch (error: unknown) {
      reportError(error);
    }
  };

  const joinSession: (values: JoinSessionFormValues) => Promise<void> = async ({
    code,
  }: JoinSessionFormValues): Promise<void> => {
    try {
      const session: Session = await queryClient.query(
        sessionQueryOptions({ sessionApi, sessionId: code }),
      );
      navigation.push(joinableSessionPath(session));
    } catch (error: unknown) {
      reportError(error);
    }
  };

  return {
    joinSessionForm,
    playSolo: (pack: Pack) =>
      openNewSession({
        createSession: { mode: SessionMode.SOLO },
        launchedPackId: pack.id,
      }),
    launchQuickPlay: () =>
      openNewSession({
        createSession: { mode: SessionMode.SOLO, quickPlay: true },
      }),
    playMulti: () =>
      openNewSession({ createSession: { mode: SessionMode.MULTI } }),
    joinSession: joinSessionForm.handleSubmit(joinSession),
  };
}
