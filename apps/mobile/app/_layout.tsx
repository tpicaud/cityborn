import { Stack } from 'expo-router';
import 'react-native-reanimated';
import '../global.css';
import 'react-native-get-random-values';
import {
  getCurrentApiVersion,
  isApiVersionOutdated,
  type User,
} from '@cityborn/api';
import {
  AuthProvider,
  ErrorProvider,
  useMinSupportedApiVersion,
} from '@cityborn/client';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect, useState } from 'react';
import { Platform, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CustomHeader from '@/components/ui/CustomHeader';
import ErrorDialog from '@/components/ui/ErrorDialog';
import ForceUpdateDialog from '@/components/ui/ForceUpdateDialog';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { View } from '@/components/ui/native/NativeComponents';
import { getCurrentUser } from '@/lib/api/auth';

const currentApiVersion = getCurrentApiVersion();

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const minSupportedApiVersion = useMinSupportedApiVersion();
  const isForceUpdateRequired =
    minSupportedApiVersion !== null &&
    isApiVersionOutdated(currentApiVersion, minSupportedApiVersion);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setStyle('light');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getCurrentUser()
      .then((fetchedUser) => {
        if (isMounted) {
          setUser(fetchedUser);
        }
      })
      .catch((error) => console.error('Failed to fetch user:', error))
      .finally(() => isMounted && setLoading(false));

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <ForceUpdateDialog visible={isForceUpdateRequired} />
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <LoaderIcon />
        </View>
      ) : (
        <ErrorProvider ErrorDialogComponent={ErrorDialog}>
          <SafeAreaProvider>
            <View style={{ flex: 1, backgroundColor: '#fafafa' }}>
              <AuthProvider initialValue={user} getCurrentUser={getCurrentUser}>
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
