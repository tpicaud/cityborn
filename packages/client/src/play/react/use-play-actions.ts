'use client';

import { SessionMode } from '@cityborn/api';
import { useCallback, useState } from 'react';
import { useError } from '../../infrastructure/react/error-context';
import type { SessionGateway } from '../../ports/gateways';
import type { PlayNavigation } from '../../ports/navigation';

export interface PlayActions {
  isAuthenticationRequired: boolean;
  dismissAuthenticationRequired: () => void;
  playSolo: () => void;
  playMulti: () => Promise<void>;
  joinSession: (code: string) => Promise<void>;
}

export interface PlayActionsOptions {
  isAuthenticated: boolean;
  sessionGateway: SessionGateway;
  navigation: PlayNavigation;
}

export function usePlayActions({
  isAuthenticated,
  sessionGateway,
  navigation,
}: PlayActionsOptions): PlayActions {
  const { invokeError } = useError();
  const [isAuthenticationRequired, setIsAuthenticationRequired] =
    useState(false);

  const dismissAuthenticationRequired = useCallback(
    () => setIsAuthenticationRequired(false),
    [],
  );

  const playSolo = useCallback(
    () => navigation.goToSoloSession(),
    [navigation],
  );

  const playMulti = useCallback(async () => {
    if (!isAuthenticated) {
      setIsAuthenticationRequired(true);
      return;
    }

    const result = await sessionGateway.createSession({
      mode: SessionMode.MULTI,
    });
    if (!result.ok) return invokeError(result.error);
    navigation.goToMultiSession(result.data.id);
  }, [isAuthenticated, sessionGateway, navigation, invokeError]);

  const joinSession = useCallback(
    async (code: string) => {
      const result = await sessionGateway.fetchSession(code);
      if (!result.ok) return invokeError(result.error);
      navigation.goToMultiSession(code);
    },
    [sessionGateway, navigation, invokeError],
  );

  return {
    isAuthenticationRequired,
    dismissAuthenticationRequired,
    playSolo,
    playMulti,
    joinSession,
  };
}
