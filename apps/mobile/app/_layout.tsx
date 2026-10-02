import { Stack } from 'expo-router';
import 'react-native-reanimated';
import '../global.css';
import 'react-native-get-random-values';
import {
  getApiVersionInfo,
  installFrenchZodErrorMap,
  isApiVersionOutdated,
} from '@cityborn/api';
import { ErrorProvider, useMinSupportedApiVersion } from '@cityborn/client';
import {
  AuthProvider,
  type CurrentUserBootstrap,
  useCurrentUserBootstrap,
} from '@cityborn/client/auth';
import * as NavigationBar from 'expo-navigation-bar';
import { useCallback, useEffect, useState } from 'react';
import { Platform, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BackendUnreachableDialog from '@/components/ui/BackendUnreachableDialog';
import Button from '@/components/ui/Button';
import CustomHeader from '@/components/ui/CustomHeader';
import ErrorDialog from '@/components/ui/ErrorDialog';
import ForceUpdateDialog from '@/components/ui/ForceUpdateDialog';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { Text, View } from '@/components/ui/native/NativeComponents';
import { ForegroundUserRefresh } from '@/features/auth/ForegroundUserRefresh';
import { authApi } from '@/lib/api/auth';
import { checkHealth } from '@/lib/api/health';

installFrenchZodErrorMap();

const localApiVersionInfo = getApiVersionInfo();

export default function RootLayout() {
  const {
    currentUserState,
    retry: retryCurrentUserLoad,
  }: CurrentUserBootstrap = useCurrentUserBootstrap(authApi);
  const [isBackendUnreachable, setIsBackendUnreachable] =
    useState<boolean>(false);
  const minSupportedApiVersion = useMinSupportedApiVersion();
  const isForceUpdateRequired =
    minSupportedApiVersion !== null &&
    isApiVersionOutdated(
      localApiVersionInfo.currentVersion,
      minSupportedApiVersion,
    );

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setStyle('light');
    }
  }, []);

  const runHealthCheck = useCallback(async () => {
    try {
      const result = await checkHealth();
      if (result.ok) {
        setIsBackendUnreachable(false);
      } else {
        console.error('Healthcheck failed:', result.error);
      }
    } catch (error) {
      console.error('Healthcheck unreachable:', error);
      setIsBackendUnreachable(true);
    }
  }, []);

  useEffect(() => {
    runHealthCheck();
  }, [runHealthCheck]);

  return (
    <>
      <ForceUpdateDialog visible={isForceUpdateRequired} />
      <BackendUnreachableDialog
        visible={isBackendUnreachable}
        onRetry={async () => {
          await runHealthCheck();
          retryCurrentUserLoad();
        }}
      />
      {currentUserState.status === 'loading' && (
        <View className="flex-1 items-center justify-center">
          <LoaderIcon />
        </View>
      )}
      {currentUserState.status === 'failed' && (
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Text className="text-lg text-center">
            {currentUserState.errorMessage}
          </Text>
          <Button label="Réessayer" onPress={retryCurrentUserLoad} />
        </View>
      )}
      {currentUserState.status === 'ready' && (
        <ErrorProvider ErrorDialogComponent={ErrorDialog}>
          <SafeAreaProvider>
            <View style={{ flex: 1, backgroundColor: '#fafafa' }}>
              <AuthProvider
                initialValue={currentUserState.user}
                getCurrentUser={authApi.getCurrentUser}
              >
                <ForegroundUserRefresh />
                <StatusBar hidden={true} />
                <Stack
                  screenOptions={{
                    contentStyle: { backgroundColor: 'transparent' },
                    animation: 'none',
                    header: (props) => <CustomHeader {...props} />,
                  }}
                >
                  <Stack.Screen
                    name="(tabs)"
                    options={{
                      headerShown: false,
                      contentStyle: { backgroundColor: 'transparent' },
                    }}
                  />
                  <Stack.Screen name="auth/sign-in" />
                  <Stack.Screen name="auth/sign-up" />
                  <Stack.Screen name="session/solo" />
                  <Stack.Screen name="session/multi/[sessionID]" />
                </Stack>
              </AuthProvider>
            </View>
          </SafeAreaProvider>
        </ErrorProvider>
      )}
    </>
  );
}
