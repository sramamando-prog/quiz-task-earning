import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  AlertTriangle, 
  ArrowLeft, 
  Lock, 
  CheckCircle2, 
  X,
  Mail
} from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user, isAdmin, loginWithAdminGoogle, loginWithEmail, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email/password login mode for admin
  const [useEmailMode, setUseEmailMode] = useState(false);
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

  if (!isOpen) return null;

  const handleAdminGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const authorized = await loginWithAdminGoogle();
      if (authorized) {
        onSuccess();
        onClose();
      } else {
        setError(
          'Access Denied\nThis account is not authorized to access the Admin Panel.'
        );
      }
    } catch (err: any) {
      console.error('Admin Google Login failed:', err);
      let msg = err.message || 'Authentication error';
      if (err.code === 'auth/popup-closed-by-user' || msg.includes('auth/popup-closed-by-user')) {
        msg = 'Google Sign-in was cancelled before completing.';
      } else if (err.code === 'auth/popup-blocked' || msg.includes('auth/popup-blocked')) {
        msg = 'Popup was blocked by your browser. Please allow popups or use redirect.';
      } else if (err.code === 'auth/unauthorized-domain' || msg.includes('auth/unauthorized-domain')) {
        msg = 'Domain not authorized in Firebase Auth settings.';
      } else if (err.code === 'auth/operation-not-allowed' || msg.includes('auth/operation-not-allowed')) {
        msg = 'Google sign-in provider is disabled in Firebase.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithEmail(adminEmailInput, adminPasswordInput);
      // AuthContext will check if it's authorized admin
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Admin email login error:', err);
      let msg = 'Invalid credentials or unauthorized account.';
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('auth/operation-not-allowed')) {
        msg = 'Email/Password sign-in is disabled in Firebase Console → Authentication → Sign-in method.';
      } else if (err.message && err.message.includes('auth/')) {
        msg = 'Invalid email or password.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Admin Panel Login</h3>
              <p className="text-xs text-slate-400">Restricted to authorized owner</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {/* If already logged in as authorized admin */}
          {user && isAdmin && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center mb-2">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-emerald-950">Authorized Admin Verified</h4>
              <p className="text-xs text-emerald-700 mt-1 truncate">
                {user.email}
              </p>
              <button
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="mt-3 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Enter Admin Panel
              </button>
            </div>
          )}

          {/* If currently logged in as a normal non-admin user */}
          {user && !isAdmin && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs mb-1">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Currently signed in as standard user:</span>
              </div>
              <p className="text-xs text-slate-600 truncate font-mono bg-white/70 px-2 py-1 rounded border border-amber-200/50">
                {user.email}
              </p>
              <p className="text-[11px] text-amber-900/80 mt-2 leading-relaxed">
                To access the Admin Panel, sign in using the authorized administrator Google account.
              </p>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 whitespace-pre-line text-left animate-in fade-in duration-150">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {!useEmailMode ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed text-center mb-2">
                Sign in with the authorized Google administrator account to manage quizzes, deposits, withdrawals, and users.
              </p>

              <button
                type="button"
                onClick={handleAdminGoogleLogin}
                disabled={loading}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                <span>{loading ? 'Verifying Credentials...' : 'Sign In with Admin Google Account'}</span>
              </button>

              <button
                type="button"
                onClick={() => setUseEmailMode(true)}
                className="w-full py-2 text-center text-xs text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Or use email & password
              </button>
            </div>
          ) : (
            <form onSubmit={handleAdminEmailLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="sramamando@gmail.com"
                    value={adminEmailInput}
                    onChange={(e) => setAdminEmailInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setUseEmailMode(false)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In as Admin'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <span className="text-[10px] text-slate-400 font-mono">
            Firebase Auth • Protected
          </span>
        </div>
      </div>
    </div>
  );
};
