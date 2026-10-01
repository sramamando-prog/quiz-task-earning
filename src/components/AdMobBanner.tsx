import React, { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { showNativeBannerAd, hideNativeBannerAd } from '../services/admobService';

interface AdMobBannerProps {
  placement?: 'home' | 'quiz' | 'tasks';
  className?: string;
}

/**
 * AdMob Banner Controller:
 * - On Native Android (via Capacitor): Uses Google Mobile Ads SDK to render the native Banner Ad
 * - On Web / Browser (Netlify): Cleanly renders nothing (0 fake boxes, 0 placeholders)
 */
export const AdMobBanner: React.FC<AdMobBannerProps> = ({ placement = 'home' }) => {
  useEffect(() => {
    // Only native platforms support real Google AdMob SDK
    if (Capacitor.isNativePlatform()) {
      showNativeBannerAd().catch((err) => {
        console.warn('Banner show notice:', err);
      });

      return () => {
        hideNativeBannerAd().catch(() => {});
      };
    }
  }, [placement]);

  // Zero fake ads or placeholders on web - app remains pristine and unblocked
  return null;
};
