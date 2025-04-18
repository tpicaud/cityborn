import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cityborn.app',
  appName: 'cityborn',
  server: {
    url: 'https://cityborn.vercel.app',
    cleartext: true,
  },
};

export default config;
