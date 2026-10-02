import { useAuth } from '@cityborn/client/auth';
import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export function ForegroundUserRefresh() {
  const { refreshUser } = useAuth();

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') refreshUser();
      },
    );
    return () => subscription.remove();
  }, [refreshUser]);

  return null;
}
