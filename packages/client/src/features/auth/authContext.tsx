'use client';

import type { User } from '@cityborn/api';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { createContext, type ReactNode, useContext } from 'react';
import { type DomainApis, useDomainApis } from '../../shared/apiProvider';
import { currentUserQueryOptions } from './api/authQueries';
import { type CurrentUserState, toCurrentUserState } from './currentUserState';

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
