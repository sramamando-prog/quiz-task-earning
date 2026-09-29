import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { WalletTransaction, WithdrawalRequest } from '../types';
import { requestWithdrawal } from '../services/walletService';
import { 
  ArrowLeft, 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Sparkles,
  ShieldCheck,
  Send,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

interface WalletScreenProps {
  onBack: () => void;
  initialTab?: 'wallet' | 'withdraw';
  onNavigateToDeposit?: () => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({ 
  onBack, 
  initialTab = 'wallet',
  onNavigateToDeposit 
}) => {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'wallet' | 'withdraw'>(initialTab);

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);

  // Form states for withdrawal
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phoneNumber || '');
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState<number>(10);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  // Real-time listen to user transactions
  useEffect(() => {
    if (!user) return;

    const txQ = query(
      collection(db, 'walletTransactions'),
      where('userId', '==', user.uid)
    );

    const unsubTx = onSnapshot(txQ, (snap) => {
      const list: WalletTransaction[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      // Sort client-side by timestamp desc
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setTransactions(list);
      setLoadingTx(false);
    }, (err) => {
      console.error('Tx snapshot error:', err);
      setLoadingTx(false);
    });

    const wQ = query(
      collection(db, 'withdrawals'),
      where('userId', '==', user.uid)
    );

    const unsubW = onSnapshot(wQ, (snap) => {
      const list: WithdrawalRequest[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      setWithdrawals(list);
    }, (err) => {
      console.error('Withdrawals snapshot error:', err);
    });

    return () => {
      unsubTx();
      unsubW();
    };
  }, [user]);

  // Update name and phone if profile changes
  useEffect(() => {
    if (profile) {
      if (!name) setName(profile.name);
      if (!phone) setPhone(profile.phoneNumber);
    }
  }, [profile]);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setWithdrawError(null);
    setWithdrawSuccess(null);

    // Validations
    if (!name.trim()) {
      setWithdrawError('Please enter your full name as per bank/UPI.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setWithdrawError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!upiId.trim() || !upiId.includes('@')) {
      setWithdrawError('Please enter a valid UPI ID (e.g. mobile@upi or username@okaxis).');
      return;
    }
    if (amount < 10) {
      setWithdrawError('Minimum withdrawal amount is ₹10.');
      return;
    }
    if ((profile?.walletBalance ?? 0) < amount) {
      setWithdrawError(`Insufficient balance. Your available balance is ₹${profile?.walletBalance ?? 0}.`);
      return;
    }

    setWithdrawLoading(true);
    try {
      const res = await requestWithdrawal(user.uid, name, phone, upiId, amount);
      setWithdrawSuccess(res.message);
      // Reset form
      setAmount(10);
    } catch (err: any) {
      console.error(err);
      setWithdrawError(err.message || 'Failed to submit withdrawal request.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const getTransactionIcon = (type: string, amount: number) => {
    if (amount > 0) {
      return (
        <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <ArrowDownLeft className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
        <ArrowUpRight className="w-4 h-4" />
      </div>
    );
  };

  const getStatusBadge = (status: 'PENDING' | 'SUCCESS' | 'REJECTED') => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Paid Success
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Rejected & Refunded
          </span>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto pb-24 px-4 pt-2">
      {/* Top Header */}
      <div className="flex items-center justify-between py-3 mb-2">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
        <span className="text-sm font-bold text-slate-800">
          {activeTab === 'wallet' ? 'Wallet & Earnings' : 'UPI Withdrawal'}
        </span>
        <div className="w-8" />
      </div>

      {/* Hero Wallet Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 rounded-3xl p-6 text-white shadow-xl mb-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between text-xs text-indigo-200 mb-2">
          <span>Available Wallet Balance</span>
          <span className="flex items-center gap-1 text-[11px] font-medium bg-white/10 px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Verified
          </span>
        </div>

        <div className="flex items-baseline gap-1 text-3xl font-extrabold tracking-tight mb-4">
          <span className="text-2xl text-indigo-300 font-semibold">₹</span>
          <span>{profile?.walletBalance ?? 0}</span>
        </div>

        {onNavigateToDeposit && (
          <div className="mb-4">
            <button
              onClick={onNavigateToDeposit}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>+ Deposit Funds (₹1 - ₹50)</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
          <div>
            <div className="text-indigo-200 text-[11px]">Total Lifetime Earned</div>
            <div className="font-bold text-emerald-400 text-sm mt-0.5">₹{profile?.totalEarned ?? 0}</div>
          </div>
          <div>
            <div className="text-indigo-200 text-[11px]">Total Withdrawn</div>
            <div className="font-bold text-indigo-200 text-sm mt-0.5">₹{profile?.totalWithdrawn ?? 0}</div>
          </div>
        </div>
      </div>

      {/* Switch Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl mb-4">
        <button
          onClick={() => setActiveTab('wallet')}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition ${
            activeTab === 'wallet'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Transaction History
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition ${
            activeTab === 'withdraw'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Withdraw to UPI
        </button>
      </div>

      {/* Content depending on tab */}
      {activeTab === 'withdraw' ? (
        <div className="space-y-4">
          {/* Withdrawal Form Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-600" />
              <span>Instant UPI Withdrawal Request</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Payouts are verified and transferred directly to your Google Pay, PhonePe, or Paytm UPI ID.
            </p>

            {withdrawError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{withdrawError}</span>
              </div>
            )}

            {withdrawSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{withdrawSuccess}</span>
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Name registered on UPI"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">UPI ID (VPA)</label>
                <input
                  type="text"
                  required
                  placeholder="example@okaxis / 9876543210@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Withdrawal Amount (₹)</label>
                  <span className="text-[11px] text-slate-400 font-medium">Min: ₹10</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-semibold text-sm">₹</span>
                  <input
                    type="number"
                    min={10}
                    max={profile?.walletBalance ?? 10}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                  />
                </div>

                {/* Quick amount chips */}
                <div className="flex items-center gap-2 mt-2">
                  {[10, 20, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        amount === amt
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAmount(profile?.walletBalance || 10)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    Max
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={withdrawLoading || (profile?.walletBalance ?? 0) < 10}
                className="w-full mt-3 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {withdrawLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Submit Withdrawal Request</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {(profile?.walletBalance ?? 0) < 10 && (
                <p className="text-[11px] text-amber-600 text-center font-medium mt-1">
                  You need minimum ₹10 wallet balance to request withdrawal. Answer quizzes to earn!
                </p>
              )}
            </form>
          </div>

          {/* Withdrawal Requests History */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-3">Your Withdrawal Requests</h3>

            {withdrawals.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No withdrawal requests yet.
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">₹{w.amount}</span>
                      {getStatusBadge(w.status)}
                    </div>
                    <div className="text-xs text-slate-600">
                      UPI: <span className="font-medium text-slate-800">{w.upiId}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{new Date(w.requestedAt).toLocaleString()}</span>
                      {w.processedAt && (
                        <span>Processed: {new Date(w.processedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                    {w.adminNote && (
                      <div className="text-[11px] bg-white p-2 rounded-xl border border-slate-200/60 text-slate-600 mt-1">
                        <span className="font-semibold text-slate-700">Note: </span>
                        {w.adminNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Transactions Tab */
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Passbook / History</h3>
            <span className="text-xs text-slate-400">{transactions.length} Records</span>
          </div>

          {loadingTx ? (
            <div className="py-8 flex flex-col items-center justify-center">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
              <span className="text-xs text-slate-400">Loading transactions...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              <WalletIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <span>No transactions yet. Complete quizzes or tasks to start earning!</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map((tx) => {
                const isPositive = tx.amount > 0;
                return (
                  <div key={tx.id} className="py-3 flex items-start gap-3">
                    {getTransactionIcon(tx.type, tx.amount)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {tx.description}
                        </p>
                        <span
                          className={`text-sm font-bold ml-2 shrink-0 ${
                            isPositive ? 'text-emerald-600' : 'text-slate-800'
                          }`}
                        >
                          {isPositive ? `+₹${tx.amount}` : `-₹${Math.abs(tx.amount)}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
                        <span>{new Date(tx.timestamp).toLocaleString()}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          {tx.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
