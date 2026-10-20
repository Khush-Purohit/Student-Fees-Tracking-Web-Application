import React from 'react';
import { ChevronLeft, ChevronRight, Lock, Settings, Calendar, GraduationCap } from 'lucide-react';
import { useStudents } from '../../context/StudentContext';
import { useAuth } from '../../context/AuthContext';
import { SyncBadge } from './SyncBadge';
import { formatMonthLabel, getAdjacentMonthKey, getCurrentMonthKey } from '../../utils/dateUtils';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const { selectedMonth, setSelectedMonth } = useStudents();
  const { lock } = useAuth();

  const handlePrevMonth = () => {
    setSelectedMonth(getAdjacentMonthKey(selectedMonth, -1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(getAdjacentMonthKey(selectedMonth, 1));
  };

  const handleResetCurrentMonth = () => {
    setSelectedMonth(getCurrentMonthKey());
  };

  const isCurrentMonth = selectedMonth === getCurrentMonthKey();

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo & App Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                Fees Tracker
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">Private Student Ledger</p>
            </div>
          </div>

          {/* Month Selector in Header */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700/60 shadow-inner">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleResetCurrentMonth}
              title="Click to jump to current month"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs sm:text-sm font-semibold rounded-md transition ${
                isCurrentMonth
                  ? 'text-blue-400 bg-blue-950/40'
                  : 'text-slate-200 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 opacity-70" />
              <span>{formatMonthLabel(selectedMonth)}</span>
            </button>

            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right Actions: Sync Status, Lock, Settings */}
          <div className="flex items-center gap-2 sm:gap-3">
            <SyncBadge />

            <button
              onClick={lock}
              title="Lock Application"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition"
            >
              <Lock className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenSettings}
              title="Settings & Backup"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
