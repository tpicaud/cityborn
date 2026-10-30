import { Stack } from 'expo-router';
import 'react-native-reanimated';
import '../global.css';
import 'react-native-get-random-values';
import { installFrenchZodErrorMap } from '@cityborn/api';
import { ApiProvider, ErrorReporterProvider } from '@cityborn/client';
import { WsProvider } from '@cityborn/client/ws';
import { CommonIconsProvider, tamaguiConfig } from '@cityborn/design-system';
import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider } from 'tamagui';
import { CommonIconImage } from '@/components/CommonIconImage';
import ForceUpdateDialog from '@/components/ForceUpdateDialog';
import CustomHeader from '@/components/ui/CustomHeader';
import ErrorDialog from '@/components/ui/ErrorDialog';
import { View } from '@/components/ui/native/NativeComponents';
import { AuthBootstrap } from '@/features/auth/AuthBootstrap';
import BackendUnreachableDialog from '@/features/health/BackendUnreachableDialog';
import { authApi } from '@/lib/api/auth';
import { contractClient } from '@/lib/api/contractClient';
import { appFocus } from '@/lib/appFocus';
import { createSocketConnection } from '@/lib/socket';

installFrenchZodErrorMap();
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontsError]: [boolean, Error | null] = useFonts({
    Fredoka: require('@cityborn/design-system/assets/fonts/Fredoka_400Regular.ttf'),
    Fredoka_400Regular: require('@cityborn/design-system/assets/fonts/Fredoka_400Regular.ttf'),
    Fredoka_500Medium: require('@cityborn/design-system/assets/fonts/Fredoka_500Medium.ttf'),
    Fredoka_600SemiBold: require('@cityborn/design-system/assets/fonts/Fredoka_600SemiBold.ttf'),
    Fredoka_700Bold: require('@cityborn/design-system/assets/fonts/Fredoka_700Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontsError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontsError]);

  if (!fontsLoaded && !fontsError) return null;

  return (
    <CommonIconsProvider image={CommonIconImage}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
        <ErrorReporterProvider ErrorDialogComponent={ErrorDialog}>
          <ApiProvider
            contractClient={contractClient}
            authApi={authApi}
            appFocus={appFocus}
          >
            <WsProvider createSocket={createSocketConnection}>
              <RootLayoutContent />
            </WsProvider>
          </ApiProvider>
        </ErrorReporterProvider>
      </TamaguiProvider>
    </CommonIconsProvider>
  );
}

function RootLayoutContent() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setStyle('light');
    }
  }, []);

  return (
    <>
      <ForceUpdateDialog />
      <BackendUnreachableDialog />
      <AuthBootstrap>
        <SafeAreaProvider>
          <View style={{ flex: 1, backgroundColor: '#fafafa' }}>
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
              <Stack.Screen name="session/[mode]/[sessionID]" />
            </Stack>
          </View>
        </SafeAreaProvider>
      </AuthBootstrap>
    </>
  );
}
