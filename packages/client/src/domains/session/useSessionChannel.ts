'use client';

import type { sessionWsChannel } from '@cityborn/api';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { useWsChannel, type WsChannelState } from '../../ws/useWsChannel';
import { type DomainApis, useDomainApis } from '../apiProvider';
import { refreshCurrentUser } from '../auth/authQueries';
import type { SessionChannel } from './sessionApi';

export function useSessionChannel({
  restoreSession,
}: {
  restoreSession: (sessionChannel: SessionChannel) => Promise<void>;
}): WsChannelState<typeof sessionWsChannel> {
  const { authApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();

  return useWsChannel<typeof sessionWsChannel>({
    restoreChannel: restoreSession,
    refreshAuthentication: async () => {
      await refreshCurrentUser({ queryClient, authApi });
    },
  });
}
