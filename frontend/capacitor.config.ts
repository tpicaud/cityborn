import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.app.cityborn',
  appName: 'cityborn',
  webDir: '.next/static',
  server: {
    url: 'https://cityborn.vercel.app',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
    }
  }
};

export default config;
