import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

interface NetworkStatusToastProps {
  className?: string;
}

export const NetworkStatusToast: React.FC<NetworkStatusToastProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [reconnectedToast, setReconnectedToast] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setReconnectedToast(true);
      const timer = setTimeout(() => {
        setReconnectedToast(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setReconnectedToast(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !reconnectedToast) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm transition-all duration-300 pointer-events-none ${className}`}
    >
      {!isOnline ? (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-xl border border-amber-500/30 pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <WifiOff className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-white tracking-tight">You are offline</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-300 leading-tight truncate">
              Attempting to reconnect to Firebase...
            </p>
          </div>
          <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0 opacity-80" />
        </div>
      ) : (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-xl border border-emerald-500/30 pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <span className="text-xs font-semibold text-white tracking-tight">Back online</span>
            <p className="text-[11px] text-emerald-300/90 leading-tight truncate">
              Firebase sync restored successfully.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
