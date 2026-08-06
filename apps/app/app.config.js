module.exports = {
  expo: {
    name: 'Tabilog',
    slug: 'app',
    version: '1.0.0',
    scheme: 'tabilog',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    ios: {
      supportsTablet: true,
    },
    android: {
      package: 'com.watchiiee.tabilog',
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
        },
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: ['expo-router'],
    extra: {
      router: {},
      eas: {
        projectId: 'ba41e06f-e1e2-408a-8446-908ee5415a98',
      },
    },
    owner: 'watchiie',
  },
};
