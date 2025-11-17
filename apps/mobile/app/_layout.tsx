import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ImageBackground } from 'react-native';

export default function RootLayout() {
  return (
    <ImageBackground
      source={require('../assets/images/background_worldmap.png')}
      resizeMode="cover"
      className="h-full w-full absolute"
    >
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
    </ImageBackground>
  );
}
