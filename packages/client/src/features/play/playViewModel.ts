'use client';

import { useState } from 'react';
import type { Navigation } from '../../platform/navigation';
import {
  type SessionApi,
  useJoinSessionForm,
  useSessionLauncher,
} from '../session';

export interface PlayViewModelOptions {
  isAuthenticated: boolean;
  sessionApi: SessionApi;
  navigation: Navigation;
}

export function usePlayViewModel({
  isAuthenticated,
  sessionApi,
  navigation,
}: PlayViewModelOptions) {
  const [authenticationRequired, setAuthenticationRequired] = useState(false);
  const joinSessionForm = useJoinSessionForm();
  const sessionLauncher = useSessionLauncher({ sessionApi, navigation });

  const playMulti = async () => {
    if (!isAuthenticated) {
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
