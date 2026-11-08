import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.backly.app',
  appName: 'Backly',
  webDir: 'dist/mobile',
  backgroundColor: '#0a0c12',
  android: {
    allowMixedContent: false,
  },
};

export default config;
