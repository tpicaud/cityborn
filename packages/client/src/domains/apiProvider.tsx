'use client';

import {
  focusManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ContractClient } from '../api/contractClient';
import type { AppFocus } from '../platform/appFocus';
import { type ErrorReporter, useErrorReporter } from '../shared/errorReporter';
import { createErrorReportingQueryCache } from '../shared/queryErrorReporting';
import type { AuthApi } from './auth/authApi';
import { type CategoryApi, createCategoryApi } from './category/categoryApi';
import {
  createGameRecordApi,
  type GameRecordApi,
} from './game-record/gameRecordApi';
import {
  createGuessObjectApi,
  type GuessObjectApi,
} from './guess-object/guessObjectApi';
import { createHealthApi, type HealthApi } from './health/healthApi';
import { createSearchApi, type SearchApi } from './search/searchApi';
import { createSessionApi, type SessionApi } from './session/sessionApi';
import { createUserApi, type UserApi } from './user/userApi';
import {
  createWorldLocationApi,
  type WorldLocationApi,
} from './world-location/worldLocationApi';

export type DomainApis = {
  authApi: AuthApi;
  categoryApi: CategoryApi;
  gameRecordApi: GameRecordApi;
  guessObjectApi: GuessObjectApi;
  healthApi: HealthApi;
  searchApi: SearchApi;
  sessionApi: SessionApi;
  userApi: UserApi;
  worldLocationApi: WorldLocationApi;
};

type ApiProviderProps = {
  contractClient: ContractClient;
  authApi: AuthApi;
  appFocus?: AppFocus;
  children: ReactNode;
};

const DomainApisContext = createContext<DomainApis | undefined>(undefined);

export function ApiProvider({
  contractClient,
  authApi,
  appFocus,
  children,
}: ApiProviderProps) {
  const { reportError }: ErrorReporter = useErrorReporter();
  const [queryClient] = useState<QueryClient>(
    () =>
      new QueryClient({
        queryCache: createErrorReportingQueryCache(reportError),
      }),
  );
  const domainApis: DomainApis = useMemo<DomainApis>(
    () => ({
      authApi,
      categoryApi: createCategoryApi(contractClient),
      gameRecordApi: createGameRecordApi(contractClient),
      guessObjectApi: createGuessObjectApi(contractClient),
      healthApi: createHealthApi(contractClient),
      searchApi: createSearchApi(contractClient),
      sessionApi: createSessionApi(contractClient),
      userApi: createUserApi(contractClient),
      worldLocationApi: createWorldLocationApi(contractClient),
    }),
    [contractClient, authApi],
  );

  useEffect(() => {
    if (!appFocus) return;
    focusManager.setEventListener((setFocused) =>
      appFocus.subscribe(setFocused),
    );
  }, [appFocus]);

  return (
    <QueryClientProvider client={queryClient}>
      <DomainApisContext.Provider value={domainApis}>
        {children}
      </DomainApisContext.Provider>
    </QueryClientProvider>
  );
}

export function useDomainApis(): DomainApis {
  const domainApis: DomainApis | undefined = useContext(DomainApisContext);
  if (!domainApis) {
    throw new Error('useDomainApis must be used within an ApiProvider');
  }
  return domainApis;
}
