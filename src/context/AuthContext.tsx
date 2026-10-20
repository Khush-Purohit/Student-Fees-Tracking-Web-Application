import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { GitHubConfig } from '../types';
import { encryptWithPin, decryptWithPin } from '../services/cryptoService';
import { storageService } from '../services/storageService';

interface AuthContextType {
  isConfigured: boolean;
  isUnlocked: boolean;
  isDemoMode: boolean;
  config: GitHubConfig | null;
  pat: string | null;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;
  setup: (owner: string, repo: string, branch: string, pat: string, pin: string) => Promise<void>;
  changePin: (currentPin: string, newPin: string) => Promise<boolean>;
  enableDemoMode: () => void;
  exitDemoMode: () => void;
  resetApp: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<GitHubConfig | null>(() => storageService.getGitHubConfig());
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => storageService.isDemoMode());
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [pat, setPat] = useState<string | null>(null);

  const inactivityTimerRef = useRef<number | null>(null);

  const isConfigured = Boolean(config || isDemoMode);

  // Manual Lock
  const lock = useCallback(() => {
    setPat(null);
    setIsUnlocked(false);
  }, []);

  // Unlock with Master PIN
  const unlock = useCallback(
    async (pin: string): Promise<boolean> => {
      if (isDemoMode) {
        setIsUnlocked(true);
        return true;
      }

      const currentConfig = config || storageService.getGitHubConfig();
      if (!currentConfig) {
        throw new Error('Application is not configured yet.');
      }

      try {
        const decryptedPat = await decryptWithPin(
          currentConfig.encryptedPat,
          pin,
          currentConfig.salt,
          currentConfig.iv
        );

        if (!decryptedPat) {
          return false;
        }

        setPat(decryptedPat);
        setIsUnlocked(true);
        return true;
      } catch {
        return false;
      }
    },
    [config, isDemoMode]
  );

  // First time Setup
  const setup = useCallback(
    async (owner: string, repo: string, branch: string, rawPat: string, pin: string) => {
      const encrypted = await encryptWithPin(rawPat.trim(), pin);

      const newConfig: GitHubConfig = {
        owner: owner.trim(),
        repo: repo.trim(),
        branch: (branch || 'main').trim(),
        encryptedPat: encrypted.ciphertext,
        salt: encrypted.salt,
        iv: encrypted.iv
      };

      storageService.setGitHubConfig(newConfig);
      storageService.setDemoMode(false);

      setConfig(newConfig);
      setIsDemoMode(false);
      setPat(rawPat.trim());
      setIsUnlocked(true);
    },
    []
  );

  // Change PIN
  const changePin = useCallback(
    async (currentPin: string, newPin: string): Promise<boolean> => {
      if (!config) return false;

      try {
        const decryptedPat = await decryptWithPin(
          config.encryptedPat,
          currentPin,
          config.salt,
          config.iv
        );

        const newEncrypted = await encryptWithPin(decryptedPat, newPin);
        const updatedConfig: GitHubConfig = {
          ...config,
          encryptedPat: newEncrypted.ciphertext,
          salt: newEncrypted.salt,
          iv: newEncrypted.iv
        };

        storageService.setGitHubConfig(updatedConfig);
        setConfig(updatedConfig);
        return true;
      } catch {
        return false;
      }
    },
    [config]
  );

  // Demo mode
  const enableDemoMode = useCallback(() => {
    storageService.setDemoMode(true);
    setIsDemoMode(true);
    setIsUnlocked(true);
  }, []);

  const exitDemoMode = useCallback(() => {
    storageService.setDemoMode(false);
    setIsDemoMode(false);
    lock();
  }, [lock]);

  // Reset entire application
  const resetApp = useCallback(() => {
    storageService.clearAll();
    setConfig(null);
    setIsDemoMode(false);
    setPat(null);
    setIsUnlocked(false);
  }, []);

  // Inactivity Auto-Lock
  useEffect(() => {
    if (!isUnlocked) {
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
      return;
    }

    const settings = storageService.getSettings();
    const timeoutMs = (settings.autoLockMinutes || 15) * 60 * 1000;

    const resetTimer = () => {
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = window.setTimeout(() => {
        lock();
      }, timeoutMs);
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));

    resetTimer();

    return () => {
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
      activityEvents.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [isUnlocked, lock]);

  return (
    <AuthContext.Provider
      value={{
        isConfigured,
        isUnlocked,
        isDemoMode,
        config,
        pat,
        unlock,
        lock,
        setup,
        changePin,
        enableDemoMode,
        exitDemoMode,
        resetApp
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
