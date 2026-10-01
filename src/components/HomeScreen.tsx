import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { WalletTransaction } from '../types';
import { 
  Wallet, 
  HelpCircle, 
  Share2, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sparkles, 
  Award, 
  Zap, 
  ChevronRight, 
  LogOut, 
  ShieldCheck, 
  User, 
  TrendingUp,
  Gift,
  Clock,
  Send,
  Layers,
  Phone,
  PlusCircle
} from 'lucide-react';
import { AdMobBanner } from './AdMobBanner';

interface HomeScreenProps {
  onNavigate: (tab: 'home' | 'quiz' | 'tasks' | 'deposit' | 'refer' | 'wallet' | 'withdraw' | 'help' | 'admin') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const { user, profile, isAdmin, logout } = useAuth();
  const [recentTransactions, setRecentTransactions] = useState<WalletTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);

  // Load recent 4 wallet transactions
  useEffect(() => {
    async function loadRecentActivity() {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'walletTransactions'),
          where('userId', '==', user.uid),
          limit(6)
        );
        const snap = await getDocs(q);
        const list: WalletTransaction[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRecentTransactions(list.slice(0, 4));
      } catch (err) {
        console.error('Recent activity load error:', err);
      } finally {
        setLoadingTx(false);
      }
    }
    loadRecentActivity();
  }, [user, profile?.walletBalance]);

  return (
    <div className="max-w-md mx-auto pb-24 px-4 pt-3">
      {/* Top Mobile Bar with Profile & Admin Entry */}
      <div className="flex items-center justify-between py-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
            {profile?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Welcome back,</span>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">
              {profile?.name || 'Valued User'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className="px-2.5 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
              <span>Admin</span>
            </button>
          )}

          <button
            onClick={() => logout()}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Wallet Card */}
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-950 rounded-3xl p-6 text-white shadow-xl mb-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between text-xs text-indigo-200 mb-1">
          <span>Available Wallet Balance</span>
          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-indigo-100 font-medium">
            Min Payout: ₹10
          </span>
        </div>

        <div className="flex items-baseline gap-1 text-3xl font-black tracking-tight mb-4">
          <span className="text-2xl text-amber-300 font-semibold">₹</span>
          <span>{profile?.walletBalance ?? 0}</span>
        </div>

        {/* Quick action buttons on wallet card: Deposit, Withdraw, Passbook */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => onNavigate('deposit')}
            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1 cursor-pointer"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>+ Deposit</span>
          </button>

          <button
            onClick={() => onNavigate('withdraw')}
            className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1 cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Withdraw</span>
          </button>

          <button
            onClick={() => onNavigate('wallet')}
            className="flex-1 py-2.5 bg-white/15 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-sm transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Passbook</span>
          </button>
        </div>

        {/* Summary Mini Stats */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-center">
          <div>
            <span className="text-[10px] text-indigo-200 block">Total Earned</span>
            <span className="text-xs font-bold text-emerald-400">₹{profile?.totalEarned ?? 0}</span>
          </div>
          <div>
            <span className="text-[10px] text-indigo-200 block">Withdrawn</span>
            <span className="text-xs font-bold text-slate-200">₹{profile?.totalWithdrawn ?? 0}</span>
          </div>
          <div>
            <span className="text-[10px] text-indigo-200 block">Referrals</span>
            <span className="text-xs font-bold text-amber-300">{profile?.successfulReferrals ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Google AdMob Banner Ad (ca-app-pub-9895846279260256/3710345919) */}
      <AdMobBanner placement="home" />

      {/* MAIN CARDS GRID */}
      <div className="space-y-3.5 mb-6">
        
        {/* 1. Deposit Funds Card */}
        <div
          onClick={() => onNavigate('deposit')}
          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <PlusCircle className="w-6 h-6" />
            </div>

            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100">
              ₹1 - ₹50 UPI
            </span>
          </div>

          <h3 className="font-extrabold text-slate-900 text-base mb-1 group-hover:text-emerald-600 transition">
            Deposit to Wallet
          </h3>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            Add funds instantly using Google Pay, PhonePe, Paytm or any UPI app.
          </p>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-600">UPI: 9335255724@ptyes</span>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
              <span>Deposit Now</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 2. Quiz Earning Card */}
        <div
          onClick={() => onNavigate('quiz')}
          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Zap className="w-6 h-6" />
            </div>

            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100">
              Live Quizzes
            </span>
          </div>

          <h3 className="font-extrabold text-slate-900 text-base mb-1 group-hover:text-indigo-600 transition">
            Quiz Earning
          </h3>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            Test your general knowledge, science & sports skills and win instant rupees.
          </p>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                +₹1 Correct
              </span>
              <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                -₹1 Wrong
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-indigo-600">
              <span>Play Now</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 3. Tasks Earning Card */}
        <div
          onClick={() => onNavigate('tasks')}
          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Layers className="w-6 h-6" />
            </div>

            <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-100">
              High Rewards
            </span>
          </div>

          <h3 className="font-extrabold text-slate-900 text-base mb-1 group-hover:text-purple-600 transition">
            Available Tasks
          </h3>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            Complete quick sponsor tasks, partner surveys, and app trials to earn ₹3 to ₹20 per task.
          </p>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700">Earn up to ₹50 / day</span>
            <div className="flex items-center gap-1 text-xs font-bold text-purple-600">
              <span>Explore Tasks</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 4. Refer & Earn Banner Card */}
        <div
          onClick={() => onNavigate('refer')}
          className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-5 text-white shadow-md hover:shadow-lg transition cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold bg-black/20 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                Instant ₹10 Bonus
              </span>
              <h3 className="font-extrabold text-lg text-white">Refer Friends & Earn</h3>
              <p className="text-xs text-amber-100 mt-0.5">
                Get ₹10 added to your wallet for each friend who signs up!
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
              <Gift className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-bold">
            <span className="text-amber-100">Code: {profile?.referralCode || 'VIP'}</span>
            <span className="flex items-center gap-1 bg-white text-orange-700 px-3 py-1 rounded-xl">
              <span>Share Code</span>
              <Share2 className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* RECENT PASSBOOK ACTIVITY */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-slate-900 text-sm">Recent Activity</h4>
          <button
            onClick={() => onNavigate('wallet')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            See All
          </button>
        </div>

        {loadingTx ? (
          <div className="py-6 text-center text-xs text-slate-400">Loading activity...</div>
        ) : recentTransactions.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No earning transactions yet. Play a quiz or deposit to start!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTransactions.map((tx) => {
              const isPos = tx.amount > 0;
              return (
                <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        isPos ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {isPos ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                    </div>
                    <div className="truncate">
                      <p className="font-semibold text-slate-800 truncate">{tx.description}</p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <span className={`font-bold shrink-0 ${isPos ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {isPos ? `+₹${tx.amount}` : `-₹${Math.abs(tx.amount)}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Safety & Trust info */}
      <div className="p-4 bg-slate-100/70 rounded-2xl text-[11px] text-slate-500 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Authentic Indian UPI Payouts & Deposits • Safe & Encrypted</span>
      </div>
    </div>
  );
};
