import { Stack, useRouter } from 'expo-router';
import 'react-native-reanimated';
import '../global.css';
import 'react-native-get-random-values';
import type { User } from '@cityborn/api';
import { AuthProvider, ErrorProvider } from '@cityborn/contexts';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect, useState } from 'react';
import { Platform, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorDialog from '@/components/ui/ErrorDialog';
import { Icon } from '@/components/ui/Icon';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { View } from '@/components/ui/native/NativeComponents';
import { getCurrentUser } from '@/lib/api/auth';

export default function RootLayout() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
          <AuthProvider initialValue={user} getCurrentUser={getCurrentUser}>
            <StatusBar hidden={true} />
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: 'transparent' },
                animation: 'none',
                headerLeft: () => {
                  return (
                    <TouchableOpacity onPressIn={router.back} className="mt-4">
                      <Icon name="arrow_back_outline" size={28} />
                    </TouchableOpacity>
                  );
                },
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
              <Stack.Screen
                name="session/multi/[sessionID]"
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
