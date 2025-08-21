import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e73c3b33b669412085a2cdc1d2641334',
  appName: 'cyber-cafe-central',
  webDir: 'dist',
  server: {
    url: 'https://e73c3b33-b669-4120-85a2-cdc1d2641334.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1625',
      showSpinner: false
    }
  }
};

export default config;