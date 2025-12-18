export default {
  expo: {
    name: 'Cityborn',
    slug: 'cityborn',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    icon: './assets/images/icon.png',

    android: {
      package: 'com.app.cityborn',
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      userInterfaceStyle: 'light',
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },

    androidStatusBar: {
      hidden: true,
      backgroundColor: '#fafafa',
    },

    androidNavigationBar: {
      barStyle: 'light-content',
      backgroundColor: '#ffffff',
    },

    icon: './assets/images/icon.png',
    scheme: 'citybornmobile',
    userInterfaceStyle: 'light',
    newArchEnabled: true,

    ios: {
      supportsTablet: true,
      userInterfaceStyle: 'light',
    },

    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },

    plugins: [
      'expo-router',
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 36,
            targetSdkVersion: 36,
            buildToolsVersion: '36.0.0',
          },
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#fafafa',
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
