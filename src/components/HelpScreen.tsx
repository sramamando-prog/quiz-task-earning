import React, { useState } from 'react';
import { 
  ArrowLeft, 
  HelpCircle, 
  Mail, 
  Send, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Coins, 
  CreditCard, 
  Share2 
} from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

interface HelpScreenProps {
  onBack: () => void;
}

export const HelpScreen: React.FC<HelpScreenProps> = ({ onBack }) => {
  const { user, profile } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const faqs = [
    {
      q: 'How does Quiz Earning work?',
      a: 'For every correct answer submitted, you earn ₹1 credited directly into your wallet. For every wrong answer, ₹1 is deducted. If your wallet is at ₹0, you will NOT be penalized below zero—your balance will never become negative.'
    },
    {
      q: 'What is the minimum withdrawal amount?',
      a: 'The minimum withdrawal threshold is only ₹10. As soon as your available wallet balance reaches ₹10, you can request a payout directly to any valid Indian UPI ID (Google Pay, PhonePe, Paytm, BHIM, etc.).'
    },
    {
      q: 'How does Refer & Earn work?',
      a: 'Share your exclusive referral code or link with friends. When a friend signs up for a new account using your referral code, you automatically receive ₹10 in your wallet balance.'
    },
    {
      q: 'How long does a withdrawal take to process?',
      a: 'Withdrawal requests are reviewed and sent by administrators directly to your UPI address within 1 to 24 hours. You can view the real-time status in your Wallet tab.'
    },
    {
      q: 'What happens if my withdrawal is rejected?',
      a: 'If an administrator rejects your request (e.g., incorrect UPI ID or invalid account name), your reserved money is immediately and safely refunded back into your wallet balance with a clear explanation note.'
    }
  ];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'supportMessages'), {
        userId: user?.uid || 'guest',
        userName: profile?.name || 'User',
        userEmail: user?.email || '',
        subject: subject.trim() || 'General Inquiry',
        message: message.trim(),
        status: 'OPEN',
        createdAt: new Date().toISOString()
      });
      setSentSuccess(true);
      setSubject('');
      setMessage('');
    } catch (err) {
      console.error('Support message send error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pb-24 px-4 pt-2">
      {/* Top Bar */}
      <div className="flex items-center justify-between py-3 mb-2">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
        <span className="text-sm font-bold text-slate-800">Help & Support</span>
        <div className="w-8" />
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl mb-4">
        <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center mb-3">
          <HelpCircle className="w-5 h-5 text-amber-300" />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight">How Can We Help You?</h2>
        <p className="text-xs text-indigo-100 mt-1">
          Find instant answers to common questions about quizzes, wallet rewards, and UPI withdrawals.
        </p>
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-4">
        <h3 className="font-bold text-slate-800 text-sm mb-3">Frequently Asked Questions</h3>

        <div className="divide-y divide-slate-100">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="py-3">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left gap-2 text-xs font-semibold text-slate-800 hover:text-indigo-600 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact Support Form */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
          <Mail className="w-4 h-4 text-indigo-600" />
          <span>Contact Support Team</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Need assistance with a withdrawal or account issue? Send us a message directly.
        </p>

        {sentSuccess ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Message Submitted!</span>
            </div>
            <p className="text-slate-600">
              Our team will review your query and reply to your registered email: {user?.email}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                required
                placeholder="e.g. Withdrawal enquiry, Quiz issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Your Message</label>
              <textarea
                required
                rows={3}
                placeholder="Describe your issue with details (UPI ID, date, etc.)..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Support Message</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
