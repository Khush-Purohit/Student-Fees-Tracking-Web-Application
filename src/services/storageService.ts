import { GitHubConfig, StudentDatabase, AppSettings } from '../types';

const STORAGE_KEYS = {
  GITHUB_CONFIG: 'sft_github_config',
  STUDENT_CACHE: 'sft_student_cache',
  REMOTE_SHA: 'sft_remote_sha',
  SETTINGS: 'sft_settings',
  PENDING_SYNC: 'sft_pending_sync',
  IS_DEMO: 'sft_is_demo_mode'
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  currencySymbol: '₹',
  autoLockMinutes: 15,
  isDemoMode: false
};

export const INITIAL_DATABASE: StudentDatabase = {
  version: 1,
  lastUpdated: new Date().toISOString(),
  students: []
};

export const storageService = {
  // GitHub & Encrypted Credentials
  getGitHubConfig(): GitHubConfig | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GITHUB_CONFIG);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setGitHubConfig(config: GitHubConfig): void {
    localStorage.setItem(STORAGE_KEYS.GITHUB_CONFIG, JSON.stringify(config));
  },

  clearGitHubConfig(): void {
    localStorage.removeItem(STORAGE_KEYS.GITHUB_CONFIG);
  },

  // Student Database Local Cache
  getCachedDatabase(): StudentDatabase | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENT_CACHE);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCachedDatabase(db: StudentDatabase): void {
    localStorage.setItem(STORAGE_KEYS.STUDENT_CACHE, JSON.stringify(db));
  },

  clearCachedDatabase(): void {
    localStorage.removeItem(STORAGE_KEYS.STUDENT_CACHE);
  },

  // Remote Git Commit SHA
  getRemoteSha(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REMOTE_SHA);
  },

  setRemoteSha(sha: string): void {
    localStorage.setItem(STORAGE_KEYS.REMOTE_SHA, sha);
  },

  clearRemoteSha(): void {
    localStorage.removeItem(STORAGE_KEYS.REMOTE_SHA);
  },

  // App Settings
  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  setSettings(settings: Partial<AppSettings>): void {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  },

  // Pending Sync Flag
  hasPendingSync(): boolean {
    return localStorage.getItem(STORAGE_KEYS.PENDING_SYNC) === 'true';
  },

  setPendingSync(pending: boolean): void {
    if (pending) {
      localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.PENDING_SYNC);
    }
  },

  // Demo Mode
  isDemoMode(): boolean {
    return localStorage.getItem(STORAGE_KEYS.IS_DEMO) === 'true';
  },

  setDemoMode(enabled: boolean): void {
    if (enabled) {
      localStorage.setItem(STORAGE_KEYS.IS_DEMO, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.IS_DEMO);
    }
  },

  // Reset Everything
  clearAll(): void {
    localStorage.removeItem(STORAGE_KEYS.GITHUB_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.STUDENT_CACHE);
    localStorage.removeItem(STORAGE_KEYS.REMOTE_SHA);
    localStorage.removeItem(STORAGE_KEYS.PENDING_SYNC);
    localStorage.removeItem(STORAGE_KEYS.IS_DEMO);
  }
};
