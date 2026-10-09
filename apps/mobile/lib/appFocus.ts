import type { AppFocus } from '@cityborn/client/platform';
import {
  AppState,
  type AppStateStatus,
  type NativeEventSubscription,
} from 'react-native';

export const appFocus: AppFocus = {
  subscribe: (onFocusChange: (isFocused: boolean) => void) => {
    const appStateSubscription: NativeEventSubscription =
      AppState.addEventListener('change', (appStateStatus: AppStateStatus) =>
        onFocusChange(appStateStatus === 'active'),
      );
    return () => appStateSubscription.remove();
  },
};
