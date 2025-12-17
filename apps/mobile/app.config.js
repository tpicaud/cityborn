export default {
  expo: {
    name: 'cityborn-mobile',
    slug: 'cityborn-mobile',
    version: '1.0.0',
    orientation: 'portrait',

    android: {
      package: 'com.app.cityborn',
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
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
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
