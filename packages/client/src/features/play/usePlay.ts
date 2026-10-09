'use client';

import { type BaseSyntheticEvent, useState } from 'react';
import type { Navigation } from '../../platform/navigation';
import { useAuth } from '../auth/authContext';
import {
  type JoinSessionForm,
  type SessionLauncher,
  useJoinSessionForm,
  useSessionLauncher,
} from '../session';

export type PlayOptions = {
  navigation: Navigation;
};

export type Play = {
  joinSessionForm: JoinSessionForm;
  playSolo: () => void;
  playMulti: () => Promise<void>;
  joinSession: (event?: BaseSyntheticEvent) => Promise<void>;
  authenticationRequired: boolean;
  dismissAuthenticationRequired: () => void;
};

export function usePlay({ navigation }: PlayOptions): Play {
  const { user } = useAuth();
  const [authenticationRequired, setAuthenticationRequired] =
    useState<boolean>(false);
  const joinSessionForm: JoinSessionForm = useJoinSessionForm();
  const sessionLauncher: SessionLauncher = useSessionLauncher({ navigation });

  const playMulti = async (): Promise<void> => {
    if (!user) {
      setAuthenticationRequired(true);
      return;
    }

    await sessionLauncher.playMulti();
  };

  return {
    joinSessionForm,
    playSolo: sessionLauncher.playSolo,
    playMulti,
    joinSession: joinSessionForm.handleSubmit(({ code }) =>
      sessionLauncher.joinSession(code),
    ),
    authenticationRequired,
    dismissAuthenticationRequired: () => setAuthenticationRequired(false),
  };
}
