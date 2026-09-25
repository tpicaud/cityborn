require('dotenv').config();
const { mobileBuildConfig } = require('./config/build');

const IS_DEVELOPMENT = mobileBuildConfig.appVariant === 'development';
const IS_PREVIEW = mobileBuildConfig.appVariant === 'preview';
const IS_STAGING = mobileBuildConfig.appVariant === 'staging';

const getUniqueIdentifier = () => {
  if (IS_DEVELOPMENT) return 'com.app.cityborn.dev';
  if (IS_PREVIEW) return 'com.app.cityborn.preview';
  if (IS_STAGING) return 'com.app.cityborn.staging';
  return 'com.app.cityborn';
};

const getAppName = () => {
  if (IS_DEVELOPMENT) return 'Cityborn (Dev)';
  if (IS_PREVIEW) return 'Cityborn (Preview)';
  if (IS_STAGING) return 'Cityborn (Staging)';
  return 'Cityborn';
};

export default {
  expo: {
    name: getAppName(),
    slug: 'cityborn',
    scheme: 'cityborn',
    version: '0.3.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    icon: './assets/stores/icons/universal_icon.png',
    newArchEnabled: true,

    android: {
      package: getUniqueIdentifier(),
      predictiveBackGestureEnabled: false,
      userInterfaceStyle: 'light',
      config: {
        googleMaps: {
          apiKey: mobileBuildConfig.googleMapsAndroidApiKey,
        },
      },
    },

    ios: {
      bundleIdentifier: getUniqueIdentifier(),
      supportsTablet: true,
      userInterfaceStyle: 'light',
      usesAppleSignIn: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription:
          'Nous n’utilisons pas votre position actuellement.',
      },
    },

    extra: {
      eas: {
        projectId: '2e929dee-4003-47f1-8aac-8d2b06f5dc6f',
      },
      storeUrls: {
        ios: 'https://apps.apple.com/app/id6745219519',
        android:
          'https://play.google.com/store/apps/details?id=com.app.cityborn',
      },
    },

    updates: {
      url: 'https://u.expo.dev/2e929dee-4003-47f1-8aac-8d2b06f5dc6f',
    },

    runtimeVersion: {
      policy: 'appVersion',
    },

    scripts: {
      dev: 'APP_VARIANT=development npx expo start',
    },

    plugins: [
      'expo-router',
      'expo-font',
      'expo-image',
      'expo-secure-store',
      'expo-web-browser',
      ['./expo-plugins/withGradleProperties'],
      ['./expo-plugins/withModularHeaders'],
      ['expo-apple-authentication'],
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 36,
            targetSdkVersion: 36,
            buildToolsVersion: '36.0.0',
          },
          ios: {},
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/stores/icons/universal_splash_icon.png',
          resizeMode: 'contain',
          imageWidth: 200,
          backgroundColor: '#008988',
        },
      ],
      [
        'expo-navigation-bar',
        {
          style: 'dark',
          hidden: false,
        },
      ],
      [
        '@react-native-google-signin/google-signin',
        {
          iosUrlScheme:
            'com.googleusercontent.apps.871572964929-iajpene5iktr5isun4sg6dqnjri8po0p',
        },
      ],
      [
        'react-native-maps',
        {
          iosGoogleMapsApiKey: mobileBuildConfig.googleMapsIosApiKey,
          androidGoogleMapsApiKey: mobileBuildConfig.googleMapsAndroidApiKey,
        },
      ],
      '@react-native-community/datetimepicker',
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
