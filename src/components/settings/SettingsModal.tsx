import React, { useState } from 'react';
import {
  X,
  Settings,
  Github,
  Download,
  Upload,
  RefreshCw,
  User,
  LogOut,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudents } from '../../context/StudentContext';
import { exportToJsonFile, parseJsonFile } from '../../utils/exportUtils';
import { githubService } from '../../services/githubService';
import { storageService } from '../../services/storageService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { config, pat, isGitHubConfigured, username, lock } = useAuth();
  const {
    students,
    currencySymbol,
    setCurrencySymbol,
    triggerSync,
    importDatabase,
    syncStatus,
    lastSyncTime
  } = useStudents();

  // Connection test
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; text: string } | null>(null);

  // Import JSON error/success
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Settings
  const [autoLockMinutes, setAutoLockMinutes] = useState(() => storageService.getSettings().autoLockMinutes || 15);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!config || !pat) return;
    setIsTesting(true);
    setTestResult(null);

    const res = await githubService.testConnection(config.owner, config.repo, config.branch, pat);
    setIsTesting(false);
    if (res.success) {
      setTestResult({ success: true, text: 'GitHub repository and token verified successfully!' });
    } else {
      setTestResult({ success: false, text: res.error || 'Connection failed' });
    }
  };

  const handleExportBackup = () => {
    const cachedDb = storageService.getCachedDatabase() || {
      version: 1,
      lastUpdated: new Date().toISOString(),
      students
    };
    exportToJsonFile(cachedDb, `students_data_backup_${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseJsonFile(file);
      await importDatabase(parsed);
      setImportMessage({ type: 'success', text: `Imported ${parsed.students.length} student records successfully!` });
    } catch (err) {
      setImportMessage({ type: 'error', text: err instanceof Error ? err.message : 'Invalid backup JSON file' });
    } finally {
      e.target.value = '';
    }
  };

  const handleAutoLockChange = (minutes: number) => {
    setAutoLockMinutes(minutes);
    storageService.setSettings({ autoLockMinutes: minutes });
  };

  const handleSignOut = () => {
    onClose();
    lock();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Settings & Preferences</h3>
              <p className="text-xs text-slate-400">Account, Cloud Sync & Data Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1 text-sm">
          {/* User Account Section */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">Logged in as</span>
                <span className="font-bold text-white text-base">{username || 'admin'}</span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Credentials Info Callout */}
          <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-200 flex gap-2.5">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-white block">Credential Configuration</span>
              <p className="text-slate-300 leading-relaxed">
                Username, password, and GitHub settings are configured in:
                <code className="block mt-1 p-1 px-2 rounded bg-slate-900 border border-slate-800 text-blue-300 font-mono text-[11px]">
                  src/config/authConfig.ts
                </code>
              </p>
            </div>
          </div>

          {/* Cloud Storage (GitHub Sync) */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Github className="w-4 h-4 text-blue-400" />
                <span>Cloud Synchronization</span>
              </h4>
              <span className={`text-[11px] px-2 py-0.5 rounded-full border ${
                isGitHubConfigured
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isGitHubConfigured ? 'GitHub Cloud' : 'Local Storage Only'}
              </span>
            </div>

            {isGitHubConfigured && config ? (
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block">Repository</span>
                    <span className="font-semibold text-white">{config.owner}/{config.repo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Branch</span>
                    <span className="font-semibold text-white">{config.branch}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs">
                  <span className="text-slate-400">
                    Last sync: <strong className="text-slate-300">{lastSyncTime || 'Just now'}</strong>
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition text-xs"
                    >
                      {isTesting ? 'Testing...' : 'Test Connection'}
                    </button>
                    <button
                      onClick={triggerSync}
                      disabled={syncStatus === 'syncing'}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition text-xs flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                      <span>Sync Now</span>
                    </button>
                  </div>
                </div>

                {testResult && (
                  <p className={`text-xs ${testResult.success ? 'text-emerald-400' : 'text-rose-400'} pt-1`}>
                    {testResult.text}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-1">
                <p className="text-slate-300 font-semibold">Running in Local Storage Mode</p>
                <p className="text-slate-400">
                  Student and fee records are stored in this browser. To automatically backup to GitHub, enter your repository and PAT in <span className="text-blue-300 font-mono">src/config/authConfig.ts</span>.
                </p>
              </div>
            )}
          </div>

          {/* Preferences */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Preferences
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Currency Symbol */}
              <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Currency Symbol
                </label>
                <div className="flex gap-2">
                  {['₹', '$', '€', '£', 'AED'].map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => setCurrencySymbol(sym)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                        currencySymbol === sym
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-lock Timeout */}
              <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Auto-Lock Inactivity
                </label>
                <select
                  value={autoLockMinutes}
                  onChange={(e) => handleAutoLockChange(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes (Default)</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Data Portability: Backup & Restore */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Data Backup & Recovery
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Export Backup */}
              <button
                type="button"
                onClick={handleExportBackup}
                className="p-3.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Export JSON Backup</p>
                  <p className="text-[11px] text-slate-400">Download ledger snapshot to device</p>
                </div>
              </button>

              {/* Import Backup */}
              <label className="p-3.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition flex items-center gap-3 cursor-pointer">
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportFile}
                  className="sr-only"
                />
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Restore from JSON</p>
                  <p className="text-[11px] text-slate-400">Upload and merge backup file</p>
                </div>
              </label>
            </div>

            {importMessage && (
              <p className={`text-xs ${importMessage.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {importMessage.text}
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};
