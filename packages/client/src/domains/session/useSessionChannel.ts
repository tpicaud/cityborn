'use client';

import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { useWsChannel, type WsChannelState } from '../../ws/useWsChannel';
import { type DomainApis, useDomainApis } from '../apiProvider';
import { refreshCurrentUser } from '../auth/authQueries';
import { createSessionChannel, type SessionChannel } from './sessionApi';

export function useSessionChannel({
  restoreSession,
}: {
  restoreSession: (sessionChannel: SessionChannel) => Promise<void>;
}): WsChannelState<SessionChannel> {
  const { authApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();

  return useWsChannel({
    createChannel: createSessionChannel,
    restoreChannel: restoreSession,
    refreshAuthentication: async () => {
      await refreshCurrentUser({ queryClient, authApi });
    },
  });
}
