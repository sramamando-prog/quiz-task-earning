import React from 'react';
import { Home, Users, ArrowUpRight, ArrowDownLeft, HelpCircle } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'deposit' | 'refer' | 'withdraw' | 'help';
  onChangeTab: (tab: 'home' | 'deposit' | 'refer' | 'withdraw' | 'help') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'deposit', label: 'Deposit', icon: ArrowDownLeft },
    { id: 'refer', label: 'Refer', icon: Users },
    { id: 'withdraw', label: 'Withdraw', icon: ArrowUpRight },
    { id: 'help', label: 'Help', icon: HelpCircle },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      <div className="max-w-md mx-auto flex items-center justify-around py-1.5 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all cursor-pointer ${
                isActive
                  ? 'text-indigo-600 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition ${
                  isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
