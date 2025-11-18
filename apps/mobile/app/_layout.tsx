import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ImageBackground, View } from 'react-native';
import { apiClient } from '@/lib/apiClient';
import { AuthProvider } from '@cityborn/contexts';
import { useEffect, useState } from 'react';
import { User } from '@cityborn/types';
import LoaderIcon from '@/components/ui/LoaderIcon';

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
    <AuthProvider initialValue={user} getCurrentUser={apiClient.getCurrentUser}>
      {/* <ImageBackground
        source={require('../assets/images/background_worldmap.png')}
        resizeMode="cover"
        className="absolute inset-0"
      />
      <View className="absolute inset-0 bg-black opacity-40" /> */}
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: 'transparent',
        }}
      >
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: 'transparent' },
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
              contentStyle: { backgroundColor: 'transparent' },
            }}
          />
        </Stack>
        <StatusBar style="auto" />
      </SafeAreaView>
    </AuthProvider>
  );
}
