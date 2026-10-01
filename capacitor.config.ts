import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.quizearning.app',
  appName: 'Quiz Earning Task',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    AdMob: {
      // NOTE: Replace this testing App ID with your real AdMob Android App ID
      // (Format: ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX) in production
      appId: 'ca-app-pub-9895846279260256~XXXXXXXXXX'
    }
  }
};

export default config;
