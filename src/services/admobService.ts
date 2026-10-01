// Google AdMob Native Android & Web Integration Service for Quiz Earning Task
// Uses official @capacitor-community/admob plugin for native Android Google Mobile Ads SDK

import { Capacitor } from '@capacitor/core';
import { 
  AdMob, 
  BannerAdOptions, 
  BannerAdSize, 
  BannerAdPosition, 
  AdOptions,
  AdLoadInfo,
  InterstitialAdPluginEvents
} from '@capacitor-community/admob';

export const ADMOB_CONFIG = {
  // Production AdMob Ad Unit IDs provided by user:
  BANNER_AD_UNIT_ID: 'ca-app-pub-9895846279260256/3710345919',
  INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-9895846279260256/2564785204',

  // Google Official AdMob Test Ad Unit IDs (for safe local development/emulator testing):
  TEST_BANNER_AD_UNIT_ID: 'ca-app-pub-3940256099942544/6300978111',
  TEST_INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-3940256099942544/1033173712',

  // Sensible cooldowns to respect user experience and AdMob policies
  INTERSTITIAL_COOLDOWN_MS: 45 * 1000, // minimum 45 seconds between interstitials
  ACTIONS_TRIGGER_THRESHOLD: 4, // Show after 4 completed questions/tasks
};

// Internal state tracking
let isInitialized = false;
let lastInterstitialShownAt = 0;
let userActionCounter = 0;
let isBannerActive = false;
let isPreparingInterstitial = false;

/**
 * Initializes the native Google Mobile Ads SDK on Android via Capacitor
 * Safe to call multiple times (idempotent). In browser/web, it safely exits.
 */
export const initializeNativeAdMob = async (): Promise<boolean> => {
  if (isInitialized) return true;

  // Only run native Google Mobile Ads initialization when running on a native platform (Android/iOS)
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    await AdMob.initialize({
      // Set to false in production to serve real ads with production ad unit IDs.
      // Can be set to true during emulator testing to prevent policy violations.
      testingDevices: [],
      initializeForTesting: false,
    });
    isInitialized = true;
    console.log('Google Mobile Ads SDK initialized successfully on Android');
    return true;
  } catch (err) {
    console.warn('Google Mobile Ads SDK initialization warning:', err);
    return false;
  }
};

/**
 * Shows the native AdMob Banner Ad at the bottom of the screen (Android native overlay)
 */
export const showNativeBannerAd = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    await initializeNativeAdMob();

    if (isBannerActive) {
      await AdMob.resumeBanner();
      return true;
    }

    const options: BannerAdOptions = {
      adId: ADMOB_CONFIG.BANNER_AD_UNIT_ID,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 64, // Leaves clearance for bottom navigation
      isTesting: false,
    };

    await AdMob.showBanner(options);
    isBannerActive = true;
    return true;
  } catch (err) {
    console.warn('Native AdMob banner display error:', err);
    return false;
  }
};

/**
 * Hides the native AdMob Banner Ad if active
 */
export const hideNativeBannerAd = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform() || !isBannerActive) return;

  try {
    await AdMob.hideBanner();
  } catch (err) {
    console.warn('Native AdMob hide banner warning:', err);
  }
};

/**
 * Removes the native banner completely
 */
export const removeNativeBannerAd = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform() || !isBannerActive) return;

  try {
    await AdMob.removeBanner();
    isBannerActive = false;
  } catch (err) {
    console.warn('Native AdMob remove banner warning:', err);
  }
};

/**
 * Increment user action counter (e.g. after answering quiz questions or claiming tasks)
 * Returns true if eligible to trigger interstitial.
 */
export const recordUserQuizAction = (): boolean => {
  userActionCounter++;
  const now = Date.now();
  const timeSinceLastAd = now - lastInterstitialShownAt;

  if (userActionCounter >= ADMOB_CONFIG.ACTIONS_TRIGGER_THRESHOLD && timeSinceLastAd >= ADMOB_CONFIG.INTERSTITIAL_COOLDOWN_MS) {
    return true;
  }
  return false;
};

/**
 * Shows a native Interstitial Ad on Android at a natural transition point
 * Always resolves gracefully and never blocks the user experience.
 */
export const showAdMobInterstitial = async (onDismiss?: () => void): Promise<boolean> => {
  const now = Date.now();

  // Enforce cooldown
  if (now - lastInterstitialShownAt < ADMOB_CONFIG.INTERSTITIAL_COOLDOWN_MS) {
    if (onDismiss) onDismiss();
    return false;
  }

  // If on web / browser, execute onDismiss immediately without blocking
  if (!Capacitor.isNativePlatform()) {
    lastInterstitialShownAt = Date.now();
    userActionCounter = 0;
    if (onDismiss) onDismiss();
    return true;
  }

  if (isPreparingInterstitial) {
    if (onDismiss) onDismiss();
    return false;
  }

  try {
    isPreparingInterstitial = true;
    await initializeNativeAdMob();

    const options: AdOptions = {
      adId: ADMOB_CONFIG.INTERSTITIAL_AD_UNIT_ID,
      isTesting: false,
    };

    // Prepare and show the native interstitial
    await AdMob.prepareInterstitial(options);
    await AdMob.showInterstitial();

    lastInterstitialShownAt = Date.now();
    userActionCounter = 0;
    return true;
  } catch (err) {
    console.warn('Native AdMob Interstitial display error:', err);
    return false;
  } finally {
    isPreparingInterstitial = false;
    if (onDismiss) onDismiss();
  }
};
