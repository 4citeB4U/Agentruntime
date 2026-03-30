import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.agentlee.voxelos',
  appName: 'Agent Lee VoxelOS',
  webDir: 'dist',
  server: {
    // Allow cleartext traffic to the local Ollama endpoint on-device
    cleartext: true,
    androidScheme: 'https',
  },
  android: {
    // Allow the WebView to reach the on-device Ollama server
    allowMixedContent: true,
    // Enable DevTools in dev builds
    webContentsDebuggingEnabled: process.env.NODE_ENV !== 'production',
  },
  plugins: {
    // Filesystem — grant access to external storage so Memory Lake can echo
    // the device's real file system.
    Filesystem: {
      iosScheme: 'ionic',
    },
    // SplashScreen — optional; keep the splash until React hydrates
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#070d18',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
};

export default config;
