import React from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, CloudOff } from 'lucide-react';
import { useStudents } from '../../context/StudentContext';
import { useAuth } from '../../context/AuthContext';

export const SyncBadge: React.FC = () => {
  const { syncStatus, lastSyncTime, syncError, triggerSync } = useStudents();
  const { isGitHubConfigured } = useAuth();

  if (!isGitHubConfigured) {
    return (
      <span
        title="Running in local browser storage mode. To sync with GitHub, enter your repository details in src/config/authConfig.ts"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700/60"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        <span className="hidden sm:inline">Local Storage</span>
        <span className="sm:hidden">Local</span>
      </span>
    );
  }

  const handleClick = () => {
    if (syncStatus !== 'syncing') {
      triggerSync();
    }
  };

  return (
    <button
      onClick={handleClick}
      title={
        syncStatus === 'syncing'
          ? 'Synchronizing with GitHub...'
          : syncStatus === 'error'
          ? `Sync Error: ${syncError}. Click to retry.`
          : `Synced with GitHub ${lastSyncTime ? `at ${lastSyncTime}` : ''}. Click to refresh.`
      }
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
        syncStatus === 'synced'
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
          : syncStatus === 'syncing'
          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse'
          : syncStatus === 'pending'
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
          : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
      }`}
    >
      {syncStatus === 'synced' && (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Synced</span>
        </>
      )}
      {syncStatus === 'syncing' && (
        <>
          <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
          <span className="hidden sm:inline">Syncing...</span>
        </>
      )}
      {syncStatus === 'pending' && (
        <>
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Pending</span>
        </>
      )}
      {syncStatus === 'error' && (
        <>
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">Sync Error</span>
        </>
      )}
      {syncStatus === 'offline' && (
        <>
          <CloudOff className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Offline</span>
        </>
      )}
    </button>
  );
};
