import { Stack } from 'expo-router';
import 'react-native-reanimated';
import '../global.css';
import 'react-native-get-random-values';
import { installFrenchZodErrorMap } from '@cityborn/api';
import { ApiProvider, ErrorReporterProvider } from '@cityborn/client';
import { WsProvider } from '@cityborn/client/ws';
import { tamaguiConfig } from '@cityborn/design-system';
import {
  Fredoka_400Regular,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';
import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider } from 'tamagui';
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
    Fredoka_400Regular,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontsError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontsError]);

  if (!fontsLoaded && !fontsError) return null;

  return (
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
