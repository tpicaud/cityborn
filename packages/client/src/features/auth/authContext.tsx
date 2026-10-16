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

export type CurrentUser = {
  user: User | null;
};

type AuthProviderProps = {
  user: User | null;
  children: ReactNode;
};

const CurrentUserContext = createContext<CurrentUser | undefined>(undefined);

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
    <CurrentUserContext.Provider value={{ user }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): CurrentUser {
  const currentUser: CurrentUser | undefined = useContext(CurrentUserContext);
  if (!currentUser) {
    throw new Error('useCurrentUser must be used within an AuthProvider');
  }
  return currentUser;
}
