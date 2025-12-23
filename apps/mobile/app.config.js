const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getUniqueIdentifier = () => {
  return 'com.app.cityborn';
};

const getAppName = () => {
  if (IS_PREVIEW) return 'Cityborn (Preview)';
  return 'Cityborn';
};

export default {
  expo: {
    name: getAppName(),
    slug: 'cityborn',
    scheme: 'cityborn',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    icon: './assets/images/icon.png',
    newArchEnabled: true,

    android: {
      package: getUniqueIdentifier(),
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      userInterfaceStyle: 'light',
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },

    ios: {
      bundleIdentifier: getUniqueIdentifier(),
      supportsTablet: true,
      userInterfaceStyle: 'light',
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },

    extra: {
      eas: {
        projectId: '2e929dee-4003-47f1-8aac-8d2b06f5dc6f',
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
      [
        'expo-navigation-bar',
        {
          backgroundColor: '#ffffff',
          barStyle: 'light',
          visibility: 'visible',
        },
      ],
      [
        '@react-native-google-signin/google-signin',
        {
          iosUrlScheme:
            'com.googleusercontent.apps.871572964929-iajpene5iktr5isun4sg6dqnjri8po0p',
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
