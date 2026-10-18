import {
  AuthProvider,
  type CurrentUserLoad,
  useCurrentUserLoad,
} from '@cityborn/client/auth';
import type { ReactNode } from 'react';
import Button from '@/components/ui/Button';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { Text, View } from '@/components/ui/native/NativeComponents';

type AuthBootstrapProps = {
  children: ReactNode;
};

export function AuthBootstrap({ children }: AuthBootstrapProps) {
  const { currentUserState, retry }: CurrentUserLoad = useCurrentUserLoad();

  if (currentUserState.status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center">
        <LoaderIcon />
      </View>
    );
  }

  if (currentUserState.status === 'failed') {
    return (
      <View className="flex-1 items-center justify-center gap-4 px-6">
        <Text className="text-lg text-center">
          {currentUserState.errorMessage}
        </Text>
        <Button label="Réessayer" onPress={retry} />
      </View>
    );
  }

  return <AuthProvider user={currentUserState.user}>{children}</AuthProvider>;
}
