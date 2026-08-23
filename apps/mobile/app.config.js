require('dotenv').config();

if (
  !process.env.APP_VARIANT ||
  !process.env.GOOGLE_MAPS_ANDROID_API_KEY ||
  !process.env.GOOGLE_MAPS_IOS_API_KEY
) {
  throw new Error('Environment not loaded');
}
const IS_DEVELOPMENT = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';
const IS_STAGING = process.env.APP_VARIANT === 'staging';

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
    version: '0.1.3',
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
          apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
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
        ios: 'https://apps.apple.com/app/id0000000000',
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
          iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY,
          androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
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
