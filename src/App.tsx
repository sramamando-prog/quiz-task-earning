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
  const { user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');

  // Seed default questions & tasks if empty in Firebase
  useEffect(() => {
    seedInitialDataIfEmpty();
  }, []);

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
    return <AuthModal />;
  }

  // Admin panel view
  if (currentScreen === 'admin') {
    return <AdminPanel onBackToApp={() => setCurrentScreen('home')} />;
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
      {/* Screen Routing */}
      {currentScreen === 'home' && (
        <HomeScreen onNavigate={(screen) => setCurrentScreen(screen)} />
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
        <HelpScreen onBack={() => setCurrentScreen('home')} />
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
