// App settings. Build numbers come from the cloud build (one higher every build).
const base = {
  "name": "DesignStager",
  "slug": "designstager",
  "scheme": "designstager",
  "version": "2.0.0",
  "orientation": "portrait",
  "icon": "./assets/icon.png",
  "userInterfaceStyle": "light",
  "backgroundColor": "#f4f5f9",
  "ios": {
    "bundleIdentifier": "com.designstager.app",
    "supportsTablet": true,
    "infoPlist": {}
  },
  "android": {
    "package": "com.designstager.app",
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-foreground.png",
      "backgroundColor": "#141a30"
    },
  },
  "plugins": [
    "expo-router",
    "expo-secure-store",
    "expo-font",
    [
      "expo-splash-screen",
      {
        "image": "./assets/icon.png",
        "imageWidth": 160,
        "backgroundColor": "#141a30"
      }
    ],
    "expo-image",
    "expo-sharing",
    "./plugins/withReleaseSigning"
  ],
  "experiments": {
    "typedRoutes": false
  }
};

const build = parseInt(process.env.VERSION_CODE || '1', 10);
module.exports = () => ({
  ...base,
  version: process.env.VERSION_NAME || base.version,
  android: { ...base.android, versionCode: 1000 + build },
  ios: { ...base.ios, buildNumber: String(1000 + build) },
});
