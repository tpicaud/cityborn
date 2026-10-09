'use client';

import {
  getFriendlyErrorMessage,
  parseApiError,
  resolveErrorMessage,
  type User,
} from '@cityborn/api';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { createContext, type ReactNode, useContext } from 'react';
import { type DomainApis, useDomainApis } from '../../shared/apiProvider';
import { currentUserQueryOptions } from './api/authQueries';

export type CurrentUserState =
  | { status: 'loading' }
  | { status: 'ready'; user: User | null }
  | { status: 'failed'; errorMessage: string };

export type CurrentUserLoad = {
  currentUserState: CurrentUserState;
  retry: () => void;
};

type AuthContextType = {
  user: User | null;
};

type AuthProviderProps = {
  user: User | null;
  children: ReactNode;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toCurrentUserState(
  currentUserQuery: UseQueryResult<User | null>,
): CurrentUserState {
  if (currentUserQuery.data !== undefined) {
    return { status: 'ready', user: currentUserQuery.data };
  }
  if (!currentUserQuery.isError || currentUserQuery.isFetching) {
    return { status: 'loading' };
  }
  return {
    status: 'failed',
    errorMessage: resolveErrorMessage(
      currentUserQuery.error,
      getFriendlyErrorMessage(parseApiError(0, currentUserQuery.error)),
    ),
  };
}

export function useCurrentUserLoad(): CurrentUserLoad {
  const { authApi }: DomainApis = useDomainApis();
  const currentUserQuery: UseQueryResult<User | null> = useQuery(
    currentUserQueryOptions(authApi),
  );

  return {
    currentUserState: toCurrentUserState(currentUserQuery),
    retry: () => {
      currentUserQuery.refetch();
    },
  };
}

export function AuthProvider({ user, children }: AuthProviderProps) {
  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context: AuthContextType | undefined = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
