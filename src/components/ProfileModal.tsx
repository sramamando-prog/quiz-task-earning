import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User as UserIcon, 
  ShieldCheck, 
  LogOut, 
  X, 
  ChevronRight, 
  LogIn
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUserAuth: () => void;
  onOpenAdminAuth: () => void;
  onOpenAdminPanel?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenUserAuth,
  onOpenAdminAuth,
  onOpenAdminPanel
}) => {
  const { user, profile, isAdmin, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!isOpen) return null;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      onClose();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <UserIcon className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">👤 Profile</h3>
              <p className="text-xs text-indigo-200/80">Account & Security Menu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Login Status Banner if logged in */}
        {user && (
          <div className="bg-slate-50 border-b border-slate-100 px-5 py-3.5 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Signed in as</span>
                {isAdmin && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                {profile?.name || user.displayName || 'User'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {user.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{loggingOut ? 'Exiting...' : 'Logout'}</span>
            </button>
          </div>
        )}

        {/* Two Separate Options */}
        <div className="p-5 space-y-4">
          
          {/* User Account Section */}
          <div className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/20 transition">
            <h4 className="text-sm font-bold text-slate-900 mb-1">User Account</h4>
            <p className="text-xs text-slate-500 mb-3">
              Login as a normal user using any valid account.
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenUserAuth();
              }}
              className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-between shadow-sm cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                <span>[ User Login / Sign Up ]</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-75" />
            </button>
          </div>

          <div className="relative">
            <div className="border-t border-slate-200" />
          </div>

          {/* Administrator Section */}
          <div className="p-4 rounded-2xl border border-slate-200 hover:border-amber-300 bg-white hover:bg-amber-50/20 transition">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-bold text-slate-900">Administrator</h4>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                Owner Only
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Admin access only.
            </p>
            {user && isAdmin && onOpenAdminPanel ? (
              <button
                onClick={() => {
                  onClose();
                  onOpenAdminPanel();
                }}
                className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-between shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>[ Open Admin Panel ]</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-75" />
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onOpenAdminAuth();
                }}
                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-between shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>[ Admin Panel Login ]</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-75" />
              </button>
            )}
          </div>

        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Quiz Earning Task • Secure Multi-User & Admin Authentication
          </p>
        </div>
      </div>
    </div>
  );
};
