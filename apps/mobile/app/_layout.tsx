import { Stack } from 'expo-router';
import 'react-native-reanimated';
import '../global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { apiClient } from '@/lib/apiClient';
import { AuthProvider } from '@cityborn/contexts';
import { useEffect, useState } from 'react';
import { User } from '@cityborn/types';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { View } from '@/components/ui/native/NativeComponents';
import ErrorProvider from '../../../packages/contexts/dist/ErrorContext';
import ErrorDialog from '@/components/ui/ErrorDialog';

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiClient
      .getCurrentUser()
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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <LoaderIcon />
      </View>
    );
  }

  return (
    <ErrorProvider ErrorDialogComponent={ErrorDialog}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#fafafa' }}>
          <AuthProvider
            initialValue={user}
            getCurrentUser={apiClient.getCurrentUser}
          >
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: 'transparent' },
                animation: 'none',
              }}
            >
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                  contentStyle: { backgroundColor: 'transparent' },
                }}
              />
              <Stack.Screen
                name="auth/sign-in"
                options={{
                  headerShown: true,
                  headerTitle: '',
                  headerTransparent: true,
                  headerShadowVisible: false,
                }}
              />
              <Stack.Screen
                name="auth/sign-up"
                options={{
                  headerShown: true,
                  headerTitle: '',
                  headerTransparent: true,
                  headerShadowVisible: false,
                }}
              />
              <Stack.Screen
                name="session/solo"
                options={{
                  headerShown: true,
                  headerTitle: '',
                  headerTransparent: true,
                  headerShadowVisible: false,
                }}
              />
            </Stack>
          </AuthProvider>
        </View>
      </SafeAreaProvider>
    </ErrorProvider>
  );
}
