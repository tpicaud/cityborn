'use client';

import { type Session, SessionIdSchema, SessionMode } from '@cityborn/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
import { joinableSessionPath, sessionPath } from './sessionPath';

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
  playSolo: () => Promise<void>;
  playMulti: () => Promise<void>;
  joinSession: FormSubmitHandler;
  authenticationRequired: boolean;
  dismissAuthenticationRequired: () => void;
};

const joinSessionFormDefaultValues: JoinSessionFormInput = { code: '' };

export function useSessionLauncher({
  navigation,
}: SessionLauncherOptions): SessionLauncher {
  const { sessionApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();
  const { reportError }: ErrorReporter = useErrorReporter();
  const [authenticationRequired, setAuthenticationRequired] =
    useState<boolean>(false);
  const joinSessionForm: JoinSessionForm = useForm<
    JoinSessionFormInput,
    undefined,
    JoinSessionFormValues
  >({
    resolver: zodResolver(JoinSessionSchema),
    defaultValues: joinSessionFormDefaultValues,
  });

  const openNewSession: (mode: SessionMode) => Promise<void> = async (
    mode: SessionMode,
  ): Promise<void> => {
    try {
      const session: Session = await sessionApi.createSession({ mode });
      navigation.push(sessionPath(session));
    } catch (error: unknown) {
      reportError(error);
    }
  };

  const playMulti: () => Promise<void> = async (): Promise<void> => {
    await openNewSession(SessionMode.MULTI);
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
    playSolo: () => openNewSession(SessionMode.SOLO),
    playMulti,
    joinSession: joinSessionForm.handleSubmit(joinSession),
    authenticationRequired,
    dismissAuthenticationRequired: () => setAuthenticationRequired(false),
  };
}
