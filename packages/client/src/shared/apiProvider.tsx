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
import type { AuthApi } from '../features/auth/api/authApi';
import {
  type CategoryApi,
  createCategoryApi,
} from '../features/category/api/categoryApi';
import {
  createProfileApi,
  type ProfileApi,
} from '../features/profile/api/profileApi';
import {
  createSessionApi,
  type SessionApi,
} from '../features/session/api/sessionApi';
import type { AppFocus } from '../platform/appFocus';
import { useError } from './errorContext';
import { createErrorReportingQueryCache } from './queryErrorReporting';

export type DomainApis = {
  authApi: AuthApi;
  categoryApi: CategoryApi;
  profileApi: ProfileApi;
  sessionApi: SessionApi;
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
  const { invokeError } = useError();
  const [queryClient] = useState<QueryClient>(
    () =>
      new QueryClient({
        queryCache: createErrorReportingQueryCache(invokeError),
      }),
  );
  const domainApis: DomainApis = useMemo<DomainApis>(
    () => ({
      authApi,
      categoryApi: createCategoryApi(contractClient),
      profileApi: createProfileApi(contractClient),
      sessionApi: createSessionApi(contractClient),
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
