import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  Phone, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Coins,
  X,
  LogIn
} from 'lucide-react';

interface AuthModalProps {
  initialMode?: 'signin' | 'signup' | 'forgot';
  onClose?: () => void;
  onSwitchToAdmin?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  initialMode = 'signin',
  onClose,
  onSwitchToAdmin
}) => {
  const { loginWithEmail, signupWithEmail, loginWithGoogle, resetPassword } = useAuth();
  
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [refCode, setRefCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-fill referral code from URL query param "?ref=CODE"
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref');
    if (refParam) {
      setRefCode(refParam.toUpperCase());
      setMode('signup');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        if (!email || !password) {
          throw new Error('Please fill in your email and password.');
        }
        await loginWithEmail(email, password);
        if (onClose) onClose();
      } else if (mode === 'signup') {
        if (!name.trim()) throw new Error('Please enter your full name.');
        if (!email.trim()) throw new Error('Please enter a valid email address.');
        if (!phone.trim() || phone.trim().length < 10) throw new Error('Please enter a valid 10-digit phone number.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');
        
        await signupWithEmail(name, email, password, phone, refCode);
        if (onClose) onClose();
      } else if (mode === 'forgot') {
        if (!email.trim()) throw new Error('Please enter your registered email address.');
        await resetPassword(email);
        setSuccessMsg('Password reset link sent to your email inbox! Check spam folder if not received.');
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'Authentication error';
      if (err.code === 'auth/operation-not-allowed' || msg.includes('auth/operation-not-allowed')) {
        msg = 'Email/Password sign-in is currently disabled in Firebase. Please enable Email/Password under Firebase Console → Authentication → Sign-in method.';
      } else if (err.code === 'auth/invalid-credential' || msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        msg = 'Invalid email or password. Please verify your credentials.';
      } else if (err.code === 'auth/user-not-found' || msg.includes('auth/user-not-found')) {
        msg = 'No account found with this email. Please check your email or click "New Account" to sign up.';
      } else if (err.code === 'auth/email-already-in-use' || msg.includes('auth/email-already-in-use')) {
        msg = 'This email is already registered. Please click "Sign In" instead of creating a new account.';
      } else if (err.code === 'auth/weak-password' || msg.includes('auth/weak-password')) {
        msg = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email' || msg.includes('auth/invalid-email')) {
        msg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/network-request-failed' || msg.includes('auth/network-request-failed')) {
        msg = 'Network connection error. Please check your internet connection and try again.';
      } else if (err.code === 'auth/unauthorized-domain' || msg.includes('auth/unauthorized-domain')) {
        msg = 'Domain authorization pending in Firebase. Please ensure this domain is added under Firebase Authentication → Settings → Authorized domains.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      if (onClose) onClose();
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'Google Sign-in failed. Please try again.';
      if (err.code === 'auth/popup-closed-by-user' || msg.includes('auth/popup-closed-by-user')) {
        msg = 'Google Sign-in popup was closed before completing. Please try again and complete the Google login dialog.';
      } else if (err.code === 'auth/popup-blocked' || msg.includes('auth/popup-blocked')) {
        msg = 'Popup was blocked by your browser. Please allow popups for this site or use redirect.';
      } else if (err.code === 'auth/cancelled-popup-request' || msg.includes('auth/cancelled-popup-request')) {
        msg = 'Previous sign-in request was cancelled. Please try again.';
      } else if (err.code === 'auth/operation-not-allowed' || msg.includes('auth/operation-not-allowed')) {
        msg = 'Google Sign-in provider is disabled in Firebase. Please enable Google under Firebase Console → Authentication → Sign-in method.';
      } else if (err.code === 'auth/unauthorized-domain' || msg.includes('auth/unauthorized-domain')) {
        msg = 'This domain is not authorized in Firebase Auth settings. Please ensure this domain is added under Firebase Console → Authentication → Settings → Authorized domains.';
      } else if (err.code === 'auth/network-request-failed' || msg.includes('auth/network-request-failed')) {
        msg = 'Network connection error during Google Sign-in. Please check your internet connection.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative">
        
        {/* Brand Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 p-8 text-white relative">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium">
              <Coins className="w-3.5 h-3.5 text-amber-300" />
              <span>Earn Real ₹</span>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/20 shadow-inner">
            <Sparkles className="w-7 h-7 text-amber-300" />
          </div>

          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider">
              User Login / Sign Up
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">Quiz Earning Task</h1>
          <p className="text-sm text-indigo-100 mt-1">
            Answer quizzes, complete tasks, refer friends & withdraw directly to your UPI.
          </p>

          <div className="mt-4 flex items-center gap-3 text-xs bg-black/15 p-2.5 rounded-xl border border-white/10">
            <div className="flex items-center gap-1 text-emerald-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              +₹1 / Correct
            </div>
            <div className="text-slate-300">•</div>
            <div className="flex items-center gap-1 text-rose-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              -₹1 / Wrong
            </div>
            <div className="text-slate-300">•</div>
            <div className="text-amber-300 font-semibold">
              ₹10 / Referral
            </div>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 text-sm font-semibold rounded-2xl transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 text-sm font-semibold rounded-2xl transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            New Account
          </button>
        </div>

        {/* Error / Success Banners */}
        <div className="p-6 pb-2">
          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-start gap-2.5 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (For UPI Payouts)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Password</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError(null); setSuccessMsg(null); }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Referral Code (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="e.g. QZ89AB"
                    value={refCode}
                    onChange={(e) => setRefCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 uppercase font-mono tracking-wider transition"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Get initial rewards if referred by a friend.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'signin' && 'Sign In to Wallet'}
                    {mode === 'signup' && 'Create Account & Start Earning'}
                    {mode === 'forgot' && 'Send Password Reset Link'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {mode === 'forgot' && (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-xs font-medium text-slate-500 hover:text-indigo-600 cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          )}

          {/* Social or Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs text-slate-400 bg-white px-2">
              or continue with
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Google Account (Any Gmail)</span>
          </button>

          {/* Admin shortcut link if needed */}
          {onSwitchToAdmin && (
            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={onSwitchToAdmin}
                className="text-xs text-slate-500 hover:text-slate-800 transition inline-flex items-center gap-1 cursor-pointer font-medium"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Admin Login</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Real UPI Payouts • Safe & Encrypted • 100% Free</span>
        </div>
      </div>
    </div>
  );
};
