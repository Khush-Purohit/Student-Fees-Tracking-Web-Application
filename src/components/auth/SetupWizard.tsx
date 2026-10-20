import React, { useState } from 'react';
import {
  ShieldCheck,
  Github,
  Key,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { githubService } from '../../services/githubService';

export const SetupWizard: React.FC = () => {
  const { setup, enableDemoMode } = useAuth();

  const [owner, setOwner] = useState<string>('');
  const [repo, setRepo] = useState<string>('');
  const [branch, setBranch] = useState<string>('main');
  const [pat, setPat] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');

  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showTokenHelp, setShowTokenHelp] = useState<boolean>(false);

  // Connection tester
  const handleTestConnection = async () => {
    if (!owner.trim() || !repo.trim() || !pat.trim()) {
      setError('Please fill in GitHub Owner, Repository Name, and Personal Access Token first.');
      return;
    }

    setIsTesting(true);
    setTestStatus(null);
    setError(null);

    const result = await githubService.testConnection(
      owner.trim(),
      repo.trim(),
      branch.trim() || 'main',
      pat.trim()
    );

    setIsTesting(false);

    if (result.success) {
      setTestStatus({ success: true, message: 'Connected successfully! Repository & Token are valid.' });
    } else {
      setTestStatus({ success: false, message: result.error || 'Connection failed.' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!owner.trim() || !repo.trim() || !pat.trim()) {
      setError('Please fill in all required GitHub repository fields.');
      return;
    }

    if (pin.length < 4 || pin.length > 8) {
      setError('Master PIN must be between 4 and 8 digits.');
      return;
    }

    if (!/^\d+$/.test(pin)) {
      setError('Master PIN must contain numbers only.');
      return;
    }

    if (pin !== confirmPin) {
      setError('The Master PIN and Confirmation PIN do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Perform final check if not already tested
      if (!testStatus?.success) {
        const testRes = await githubService.testConnection(
          owner.trim(),
          repo.trim(),
          branch.trim() || 'main',
          pat.trim()
        );
        if (!testRes.success) {
          setError(`Connection check failed: ${testRes.error}`);
          setIsSubmitting(false);
          return;
        }
      }

      await setup(owner.trim(), repo.trim(), branch.trim() || 'main', pat.trim(), pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-xl w-full space-y-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome to Fees Tracker
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Connect your private GitHub repository to enable zero-cost cloud sync, secured with client-side AES-GCM encryption.
          </p>
        </div>

        {/* Demo Mode Quick Access */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Just want to test it out?</p>
              <p className="text-xs text-slate-300">Explore all features with demo student data.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={enableDemoMode}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/40 text-xs font-semibold transition"
          >
            Explore Demo Mode
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* GitHub Config Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Github className="w-4 h-4 text-blue-400" />
                <span>1. GitHub Repository Storage</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTokenHelp(!showTokenHelp)}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>How to get PAT</span>
              </button>
            </div>

            {/* Token Guide Accordion */}
            {showTokenHelp && (
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 space-y-2">
                <p className="font-semibold text-white">How to create a Fine-Grained Personal Access Token (PAT):</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>Go to <strong>GitHub &gt; Settings &gt; Developer Settings &gt; Personal access tokens &gt; Fine-grained tokens</strong>.</li>
                  <li>Click <strong>Generate new token</strong>.</li>
                  <li>Under <strong>Repository access</strong>, choose <em>Only select repositories</em> and select your private data repo.</li>
                  <li>Under <strong>Permissions &gt; Repository permissions</strong>, set <strong>Contents</strong> to <em>Access: Read and write</em>.</li>
                  <li>Generate and copy the token starting with <code>github_pat_</code>.</li>
                </ol>
                <a
                  href="https://github.com/settings/tokens?type=beta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-400 hover:underline pt-1 font-medium"
                >
                  <span>Open GitHub Token Settings</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  GitHub Username / Owner <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. john-doe"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Private Repository Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. tutor-fees-data"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Personal Access Token (PAT) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="github_pat_..."
                    value={pat}
                    onChange={(e) => setPat(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Branch</label>
                <input
                  type="text"
                  placeholder="main"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-500"
                />
              </div>
            </div>

            {/* Test Connection Button & Status */}
            <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5 text-blue-400" />
                    <span>Test GitHub Connection</span>
                  </>
                )}
              </button>

              {testStatus && (
                <div
                  className={`flex items-center gap-1.5 text-xs font-medium ${
                    testStatus.success ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {testStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{testStatus.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Master PIN Section */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>2. Create Client-Side Master PIN</span>
            </div>
            <p className="text-xs text-slate-400">
              This 4-8 digit PIN encrypts your GitHub Token locally using AES-GCM-256. Only you have this PIN; it is never sent anywhere.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Master PIN (4-8 digits) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-base tracking-widest text-center focus:outline-none focus:border-emerald-500 placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Confirm Master PIN <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  placeholder="••••"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-base tracking-widest text-center focus:outline-none focus:border-emerald-500 placeholder-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Save Credentials & Launch App</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
