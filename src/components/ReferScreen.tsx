import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { ReferralRecord } from '../types';
import { 
  ArrowLeft, 
  Share2, 
  Copy, 
  Check, 
  Users, 
  Gift, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReferScreenProps {
  onBack: () => void;
}

export const ReferScreen: React.FC<ReferScreenProps> = ({ onBack }) => {
  const { profile, user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const referralCode = profile?.referralCode || 'QUIZVIP';
  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

  // Listen to referrals created for this user
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'referrals'),
      where('referrerUid', '==', user.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list: ReferralRecord[] = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => new Date(b.referralDate).getTime() - new Date(a.referralDate).getTime());
      setReferrals(list);
      setLoading(false);
    }, (err) => {
      console.error('Referrals snapshot error:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Quiz Earning Task - Earn ₹1 per Quiz!',
          text: `Join Quiz Earning Task with my referral code ${referralCode} and start earning real cash to UPI!`,
          url: referralLink,
        });
      } catch (err) {
        console.log('Share canceled or error');
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="max-w-md mx-auto pb-24 px-4 pt-2">
      {/* Top bar */}
      <div className="flex items-center justify-between py-3 mb-2">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
        <span className="text-sm font-bold text-slate-800">Refer & Earn ₹10</span>
        <div className="w-8" />
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-3xl p-6 text-white shadow-xl mb-4 relative overflow-hidden">
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-3 border border-white/20">
          <Gift className="w-6 h-6 text-amber-300" />
        </div>

        <h2 className="text-xl font-extrabold tracking-tight">Earn ₹10 Per Friend</h2>
        <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
          Invite your friends & family. As soon as they register using your code or link, you get ₹10 directly in your wallet!
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/15 text-center">
          <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl">
            <span className="text-[10px] text-indigo-200 block">Total Invites</span>
            <span className="text-base font-bold">{profile?.totalReferrals ?? 0}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl">
            <span className="text-[10px] text-indigo-200 block">Successful</span>
            <span className="text-base font-bold text-emerald-300">{profile?.successfulReferrals ?? 0}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl">
            <span className="text-[10px] text-indigo-200 block">Earned</span>
            <span className="text-base font-bold text-amber-300">₹{(profile?.successfulReferrals ?? 0) * 10}</span>
          </div>
        </div>
      </div>

      {/* Referral Code & Link Box */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4 mb-4">
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Your Unique Referral Code</label>
          <div className="flex items-center justify-between p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl">
            <span className="text-lg font-black tracking-widest text-indigo-900 font-mono">
              {referralCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="px-3.5 py-1.5 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-indigo-700 hover:bg-indigo-50 shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleCopyLink}
            className="py-3 px-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Copy className="w-4 h-4 text-slate-600" />
            <span>Copy Link</span>
          </button>
          <button
            onClick={handleNativeShare}
            className="py-3 px-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md hover:shadow-indigo-500/20 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share on WhatsApp</span>
          </button>
        </div>
      </div>

      {/* How it works steps */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-4">
        <h3 className="font-bold text-slate-800 text-sm mb-3">How Referral Works</h3>
        
        <div className="space-y-3 text-xs">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-xs">
              1
            </span>
            <div>
              <p className="font-semibold text-slate-800">Share your invite link</p>
              <p className="text-slate-500 text-[11px]">Send your referral link or code to friends on WhatsApp, Telegram, or Instagram.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-xs">
              2
            </span>
            <div>
              <p className="font-semibold text-slate-800">Friend signs up</p>
              <p className="text-slate-500 text-[11px]">Your friend creates their free account using your referral code.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-xs">
              3
            </span>
            <div>
              <p className="font-semibold text-emerald-800">Get ₹10 Instantly in Wallet</p>
              <p className="text-slate-500 text-[11px]">₹10 is added to your available balance. You can withdraw once balance hits ₹10.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Invited Friends History */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm mb-3">Invited Friends ({referrals.length})</h3>

        {loading ? (
          <div className="py-6 flex flex-col items-center justify-center">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs text-slate-400">Loading referral tracking...</span>
          </div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <span>No referrals yet. Share your code now to earn ₹10 per friend!</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {referrals.map((r) => (
              <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-800">{r.referredName}</p>
                  <p className="text-[11px] text-slate-400">{new Date(r.referralDate).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600">+₹{r.rewardAmount}</span>
                  <span className="block text-[10px] text-emerald-700 font-medium">Credited</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
