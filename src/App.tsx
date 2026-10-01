/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { HomeScreen } from './components/HomeScreen';
import { QuizScreen } from './components/QuizScreen';
import { WalletScreen } from './components/WalletScreen';
import { DepositScreen } from './components/DepositScreen';
import { ReferScreen } from './components/ReferScreen';
import { TasksScreen } from './components/TasksScreen';
import { HelpScreen } from './components/HelpScreen';
import { AdminPanel } from './components/AdminPanel';
import { BottomNav } from './components/BottomNav';
import { seedInitialDataIfEmpty } from './services/seedData';
import { initializeNativeAdMob, removeNativeBannerAd } from './services/admobService';
import { NetworkStatusToast } from './components/NetworkStatusToast';
import { ProfileModal } from './components/ProfileModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

type AppScreen = 
  | 'home' 
  | 'quiz' 
  | 'tasks' 
  | 'deposit'
  | 'refer' 
  | 'wallet' 
  | 'withdraw' 
  | 'help' 
  | 'admin';

function MainApp() {
  const { user, loading, isAdmin } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserAuthModal, setShowUserAuthModal] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);

  // Seed default questions & tasks if empty in Firebase (Admin only)
  useEffect(() => {
    if (isAdmin) {
      seedInitialDataIfEmpty(true);
    }
  }, [isAdmin]);

  // Initialize native Google Mobile Ads when user is authenticated
  useEffect(() => {
    if (user && currentScreen !== 'admin') {
      initializeNativeAdMob().catch(() => {});
    } else if (currentScreen === 'admin') {
      // Strictly prevent ads from ever appearing in the Admin Panel
      removeNativeBannerAd().catch(() => {});
    }
  }, [user, currentScreen]);

  // Handle Android Native hardware back button & status bar
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      StatusBar.setStyle({ style: Style.Light }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#4338ca' }).catch(() => {});
    } catch (e) {}

    const backListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      // If user is on a sub-screen, pressing back takes them to home
      if (currentScreen !== 'home') {
        setCurrentScreen('home');
      } else {
        // If already on home, minimize/exit app
        CapacitorApp.exitApp();
      }
    });

    return () => {
      backListener.then((l) => l.remove()).catch(() => {});
    };
  }, [currentScreen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <h2 className="text-sm font-bold text-slate-800 tracking-tight">Quiz Earning Task</h2>
        <p className="text-xs text-slate-400 mt-1">Connecting to secure Firebase backend...</p>
      </div>
    );
  }

  // If user is not authenticated, show signin / signup / forgot modal
  if (!user) {
    return (
      <>
        <NetworkStatusToast />
        <AuthModal onSwitchToAdmin={() => setShowAdminLoginModal(true)} />
        <AdminLoginModal
          isOpen={showAdminLoginModal}
          onClose={() => setShowAdminLoginModal(false)}
          onSuccess={() => {
            setShowAdminLoginModal(false);
            setCurrentScreen('admin');
          }}
        />
      </>
    );
  }

  // Admin panel view
  if (currentScreen === 'admin') {
    return (
      <>
        <NetworkStatusToast />
        <AdminPanel onBackToApp={() => setCurrentScreen('home')} />
      </>
    );
  }

  // Determine active tab for fixed bottom nav
  let navActiveTab: 'home' | 'deposit' | 'refer' | 'withdraw' | 'help' = 'home';
  if (currentScreen === 'deposit') navActiveTab = 'deposit';
  else if (currentScreen === 'refer') navActiveTab = 'refer';
  else if (currentScreen === 'withdraw') navActiveTab = 'withdraw';
  else if (currentScreen === 'help') navActiveTab = 'help';

  const handleBottomNavChange = (tab: 'home' | 'deposit' | 'refer' | 'withdraw' | 'help') => {
    setCurrentScreen(tab);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 antialiased">
      {/* Network Status & Firebase Reconnection Indicator */}
      <NetworkStatusToast />

      {/* Profile Menu Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onOpenUserAuth={() => setShowUserAuthModal(true)}
        onOpenAdminAuth={() => setShowAdminLoginModal(true)}
        onOpenAdminPanel={() => setCurrentScreen('admin')}
      />

      {/* Admin Panel Login Modal */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onSuccess={() => {
          setShowAdminLoginModal(false);
          setCurrentScreen('admin');
        }}
      />

      {/* User Login/Sign Up Modal (when triggered via Profile Menu) */}
      {showUserAuthModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <AuthModal 
            onClose={() => setShowUserAuthModal(false)} 
            onSwitchToAdmin={() => {
              setShowUserAuthModal(false);
              setShowAdminLoginModal(true);
            }}
          />
        </div>
      )}

      {/* Screen Routing */}
      {currentScreen === 'home' && (
        <HomeScreen 
          onNavigate={(screen) => setCurrentScreen(screen)} 
          onOpenProfile={() => setShowProfileModal(true)}
        />
      )}

      {currentScreen === 'deposit' && (
        <DepositScreen 
          onBack={() => setCurrentScreen('home')}
          onOpenWallet={() => setCurrentScreen('wallet')}
        />
      )}

      {currentScreen === 'quiz' && (
        <QuizScreen 
          onBack={() => setCurrentScreen('home')} 
          onOpenWallet={() => setCurrentScreen('wallet')}
        />
      )}

      {currentScreen === 'tasks' && (
        <TasksScreen 
          onBack={() => setCurrentScreen('home')} 
          onOpenWallet={() => setCurrentScreen('wallet')}
        />
      )}

      {currentScreen === 'refer' && (
        <ReferScreen onBack={() => setCurrentScreen('home')} />
      )}

      {currentScreen === 'wallet' && (
        <WalletScreen 
          onBack={() => setCurrentScreen('home')} 
          initialTab="wallet" 
          onNavigateToDeposit={() => setCurrentScreen('deposit')}
        />
      )}

      {currentScreen === 'withdraw' && (
        <WalletScreen 
          onBack={() => setCurrentScreen('home')} 
          initialTab="withdraw" 
          onNavigateToDeposit={() => setCurrentScreen('deposit')}
        />
      )}

      {currentScreen === 'help' && (
        <HelpScreen 
          onBack={() => setCurrentScreen('home')} 
          onOpenProfile={() => setShowProfileModal(true)}
        />
      )}

      {/* Fixed Bottom Navigation (visible on mobile/tablet during main screens) */}
      {currentScreen !== 'quiz' && (
        <BottomNav 
          activeTab={navActiveTab} 
          onChangeTab={handleBottomNavChange} 
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
