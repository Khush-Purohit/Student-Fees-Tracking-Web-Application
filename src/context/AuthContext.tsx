import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { GitHubConfig } from '../types';
import { AUTH_CONFIG } from '../config/authConfig';
import { storageService } from '../services/storageService';

interface AuthContextType {
  isUnlocked: boolean;
  username: string | null;
  config: GitHubConfig | null;
  pat: string | null;
  isGitHubConfigured: boolean;
  login: (enteredUsername: string, enteredPassword: string) => boolean;
  lock: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);
  const [pat, setPat] = useState<string | null>(null);
  const [config, setConfig] = useState<GitHubConfig | null>(null);

  const inactivityTimerRef = useRef<number | null>(null);

  // Check if GitHub is configured in AUTH_CONFIG
  const isGitHubConfigured = Boolean(
    AUTH_CONFIG.GITHUB.OWNER?.trim() &&
    AUTH_CONFIG.GITHUB.REPO?.trim() &&
    AUTH_CONFIG.GITHUB.PAT?.trim()
  );

  // Lock session
  const lock = useCallback(() => {
    setIsUnlocked(false);
    setPat(null);
  }, []);

  // Login checking against AUTH_CONFIG
  const login = useCallback((enteredUsername: string, enteredPassword: string): boolean => {
    const isValid =
      enteredUsername.trim() === AUTH_CONFIG.USERNAME.trim() &&
      enteredPassword === AUTH_CONFIG.PASSWORD;

    if (isValid) {
      setIsUnlocked(true);
      setUsername(enteredUsername.trim());

      // If GitHub config is provided in authConfig.ts, prepare GitHub sync credentials
      if (
        AUTH_CONFIG.GITHUB.OWNER?.trim() &&
        AUTH_CONFIG.GITHUB.REPO?.trim() &&
        AUTH_CONFIG.GITHUB.PAT?.trim()
      ) {
        const ghConfig: GitHubConfig = {
          owner: AUTH_CONFIG.GITHUB.OWNER.trim(),
          repo: AUTH_CONFIG.GITHUB.REPO.trim(),
          branch: (AUTH_CONFIG.GITHUB.BRANCH || 'main').trim(),
          encryptedPat: '',
          salt: '',
          iv: ''
        };
        setConfig(ghConfig);
        setPat(AUTH_CONFIG.GITHUB.PAT.trim());
      } else {
        // Fallback to local storage mode
        setConfig(null);
        setPat(null);
      }

      return true;
    }

    return false;
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
        isUnlocked,
        username,
        config,
        pat,
        isGitHubConfigured,
        login,
        lock
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
