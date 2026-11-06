import type { NavigationAction } from 'expo-router/react-navigation';

export function interceptBackAction({
  action,
  onBack,
  resume,
}: {
  action: NavigationAction;
  onBack: () => void;
  resume: (action: NavigationAction) => void;
}): void {
  if (action.type === 'GO_BACK' || action.type === 'POP') {
    onBack();
    return;
  }
  resume(action);
}
