import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { DepositRequest, PaymentMethodType } from '../types';
import { submitDepositRequest } from '../services/walletService';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ShieldCheck, 
  Coins, 
  Info,
  ArrowDownLeft,
  QrCode,
  Zap,
  CreditCard
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DepositScreenProps {
  onBack: () => void;
  onOpenWallet: () => void;
}

const OFFICIAL_UPI_ID = '9335255724@ptyes';

const PAYMENT_METHODS: { id: PaymentMethodType; name: string; icon: string }[] = [
  { id: 'Google Pay', name: 'Google Pay', icon: 'GPay' },
  { id: 'PhonePe', name: 'PhonePe', icon: 'Pe' },
  { id: 'Paytm', name: 'Paytm', icon: 'Paytm' },
  { id: 'Other UPI', name: 'Other UPI', icon: 'UPI' }
];

export const DepositScreen: React.FC<DepositScreenProps> = ({ onBack, onOpenWallet }) => {
  const { profile, user } = useAuth();
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Form states
  const [amount, setAmount] = useState<number>(10);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('Google Pay');
  const [utrNumber, setUtrNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Live user deposits history
  const [myDeposits, setMyDeposits] = useState<DepositRequest[]>([]);
  const [loadingDeposits, setLoadingDeposits] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'deposits'),
      where('userId', '==', user.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list: DepositRequest[] = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      setMyDeposits(list);
      setLoadingDeposits(false);
    }, (err) => {
      console.error('Error fetching user deposits:', err);
      setLoadingDeposits(false);
    });

    return () => unsub();
  }, [user]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(OFFICIAL_UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validations: ₹1 to ₹50
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 1 || numAmount > 50) {
      setErrorMessage('Deposit amount must be between ₹1 and ₹50.');
      return;
    }

    const cleanUtr = utrNumber.trim();
    if (!/^\d{12}$/.test(cleanUtr)) {
      setErrorMessage('UTR Number must be exactly 12 digits from your UPI transaction receipt.');
      return;
    }

    if (!paymentMethod) {
      setErrorMessage('Please choose your payment method.');
      return;
    }

    setLoading(true);
    try {
      const res = await submitDepositRequest(
        user.uid,
        profile?.name || 'User',
        profile?.phoneNumber || '',
        numAmount,
        paymentMethod,
        cleanUtr
      );

      setSuccessMessage(res.message);
      setUtrNumber('');
      setAmount(10);
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to submit deposit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: 'PENDING' | 'CONFIRMED' | 'REJECTED') => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Confirmed
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Under Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto pb-24 px-4 pt-2">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between py-3 mb-2">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={onOpenWallet}
          className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100/80 px-3 py-1.5 rounded-full border border-indigo-100 transition text-xs font-bold text-indigo-900"
        >
          <Coins className="w-3.5 h-3.5 text-amber-500" />
          <span>Wallet: ₹{profile?.walletBalance ?? 0}</span>
        </button>
      </div>

      {/* Hero Deposit Banner */}
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl mb-4 relative overflow-hidden">
        <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center mb-3 border border-white/20">
          <ArrowDownLeft className="w-6 h-6 text-emerald-300" />
        </div>

        <h2 className="text-xl font-extrabold tracking-tight">Deposit Funds to Wallet</h2>
        <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
          Add balance to your wallet instantly using any UPI app. Minimum deposit is ₹1, maximum is ₹50 per request.
        </p>

        <div className="mt-4 flex items-center gap-2 bg-black/20 px-3 py-2 rounded-2xl border border-white/10 text-xs">
          <span className="text-amber-300 font-bold">Min: ₹1</span>
          <span className="text-slate-400">•</span>
          <span className="text-emerald-300 font-bold">Max: ₹50</span>
          <span className="text-slate-400">•</span>
          <span className="text-indigo-200">0% Convenience Fee</span>
        </div>
      </div>

      {/* UPI Payment Instructions Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Step 1: Pay to Official UPI ID
          </span>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Verified Receiver
          </span>
        </div>

        <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-indigo-600 font-semibold block">Official UPI ID:</span>
            <span className="text-base font-black text-indigo-950 font-mono tracking-tight select-all">
              {OFFICIAL_UPI_ID}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyUpi}
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            {copiedUpi ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy UPI</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-3 text-[11px] text-slate-500 flex items-start gap-1.5 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <span>
            Open Google Pay, PhonePe, Paytm or any UPI app, send the desired amount (₹1-₹50) to the UPI ID above, then copy the 12-digit UTR/Reference number from your receipt.
          </span>
        </div>
      </div>

      {/* Step 2: Verification Form */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Step 2: Submit Payment Details
        </h3>

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmitDeposit} className="space-y-4">
          {/* Amount input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Deposit Amount (₹)</label>
              <span className="text-[11px] text-slate-400 font-medium">Range: ₹1 - ₹50</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-semibold text-sm">₹</span>
              <input
                type="number"
                min={1}
                max={50}
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            {/* Quick chips */}
            <div className="flex items-center gap-2 mt-2">
              {[5, 10, 20, 30, 50].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    amount === amt
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Payment Method Used
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    paymentMethod === pm.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span>{pm.name}</span>
                  {paymentMethod === pm.id && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* UTR / Ref Number */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">12-Digit UPI UTR / Ref No.</label>
              <span className="text-[11px] text-slate-400 font-medium">Exact 12 Digits</span>
            </div>
            <input
              type="text"
              required
              maxLength={12}
              placeholder="e.g. 427189123456"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Found on your payment success receipt under "UPI Transaction ID" or "Google Transaction ID".
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Submitting Deposit...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Submit Deposit Request (₹{amount})</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* User Deposit History */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm mb-3">Your Deposit Requests</h3>

        {loadingDeposits ? (
          <div className="py-6 text-center text-slate-400 text-xs">Loading deposits...</div>
        ) : myDeposits.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No deposit requests yet.
          </div>
        ) : (
          <div className="space-y-3">
            {myDeposits.map((d) => (
              <div
                key={d.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-sm">₹{d.amount}</span>
                  {getStatusBadge(d.status)}
                </div>

                <div className="text-xs text-slate-600 flex items-center justify-between">
                  <span>Method: <strong className="text-slate-800">{d.paymentMethod}</strong></span>
                  <span className="font-mono text-slate-500 text-[11px]">UTR: {d.utrNumber}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{new Date(d.requestedAt).toLocaleString()}</span>
                  {d.processedAt && (
                    <span>Processed: {new Date(d.processedAt).toLocaleDateString()}</span>
                  )}
                </div>

                {d.adminNote && (
                  <div className="text-[11px] bg-white p-2 rounded-xl border border-slate-200/60 text-slate-600 mt-1">
                    <span className="font-semibold text-slate-700">Admin Note: </span>
                    {d.adminNote}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
