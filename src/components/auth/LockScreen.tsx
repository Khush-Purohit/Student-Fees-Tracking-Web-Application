import React, { useState, useEffect } from 'react';
import { Lock, Delete, AlertCircle, ShieldAlert, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LockScreen: React.FC = () => {
  const { unlock, resetApp, isDemoMode } = useAuth();

  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Progressive brute-force delay countdown
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lockoutSeconds > 0 || isLoading) return;

      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 8) {
          setPin((prev) => prev + e.key);
          setError(null);
        }
      } else if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
        setError(null);
      } else if (e.key === 'Enter') {
        if (pin.length >= 4) {
          handleAttemptUnlock(pin);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, lockoutSeconds, isLoading]);

  const handleDigit = (digit: string) => {
    if (lockoutSeconds > 0 || isLoading) return;
    if (pin.length < 8) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(null);

      // Auto-submit if 6 digits or more
      if (nextPin.length === 6) {
        handleAttemptUnlock(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    if (lockoutSeconds > 0 || isLoading) return;
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    if (lockoutSeconds > 0 || isLoading) return;
    setPin('');
    setError(null);
  };

  const handleAttemptUnlock = async (candidatePin: string) => {
    if (candidatePin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await unlock(candidatePin);
      if (!success) {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        setPin('');

        if (nextAttempts >= 5) {
          setLockoutSeconds(10);
          setError('Too many failed attempts. Locked for 10 seconds.');
        } else if (nextAttempts >= 3) {
          setLockoutSeconds(3);
          setError('Incorrect PIN. Please wait 3 seconds.');
        } else {
          setError('Incorrect Master PIN. Please try again.');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decryption error');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Lock Icon Emblem */}
        <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 shadow-xl shadow-blue-900/10">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold text-white tracking-tight text-center">
          Fees Tracker Locked
        </h2>
        <p className="text-sm text-slate-400 mt-1 mb-8 text-center">
          {isDemoMode ? 'Demo Mode Active — Enter any PIN or tap Unlock' : 'Enter your Master PIN to decrypt and unlock'}
        </p>

        {/* PIN Dots Indicator */}
        <div className="flex items-center gap-3 mb-8 h-8">
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-blue-500 scale-125 shadow-lg shadow-blue-500/50'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="w-full mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Lockout countdown */}
        {lockoutSeconds > 0 && (
          <div className="w-full mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs sm:text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Security timeout: wait {lockoutSeconds}s</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="w-full grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              disabled={lockoutSeconds > 0 || isLoading}
              className="h-16 rounded-2xl bg-slate-900 border border-slate-800/80 hover:bg-slate-800/80 active:bg-blue-600 active:border-blue-500 text-2xl font-semibold text-white transition duration-150 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {digit}
            </button>
          ))}

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClear}
            disabled={lockoutSeconds > 0 || isLoading || pin.length === 0}
            className="h-16 rounded-2xl bg-slate-900/50 border border-slate-800/60 hover:bg-slate-800/50 active:bg-slate-700 text-sm font-medium text-slate-400 transition flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Clear
          </button>

          {/* 0 Button */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            disabled={lockoutSeconds > 0 || isLoading}
            className="h-16 rounded-2xl bg-slate-900 border border-slate-800/80 hover:bg-slate-800/80 active:bg-blue-600 active:border-blue-500 text-2xl font-semibold text-white transition duration-150 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            onClick={handleBackspace}
            disabled={lockoutSeconds > 0 || isLoading || pin.length === 0}
            className="h-16 rounded-2xl bg-slate-900/50 border border-slate-800/60 hover:bg-slate-800/50 active:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Unlock Action Button */}
        <button
          type="button"
          onClick={() => handleAttemptUnlock(pin)}
          disabled={pin.length < 4 || lockoutSeconds > 0 || isLoading}
          className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              <span>Unlock Ledger</span>
            </>
          )}
        </button>

        {/* Forgot PIN / Reset Link */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="text-xs text-slate-500 hover:text-slate-300 transition underline underline-offset-4"
          >
            Forgot PIN / Reset Application?
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Reset Application?</h3>
            <p className="text-sm text-slate-400 mb-6">
              This will remove the locally encrypted credentials from this device. Your data on GitHub will remain safe, but you will need your Personal Access Token (PAT) to set up again.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  resetApp();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm transition"
              >
                Reset App
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
