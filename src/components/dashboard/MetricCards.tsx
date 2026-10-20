import React from 'react';
import { Users, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useStudents } from '../../context/StudentContext';

export const MetricCards: React.FC = () => {
  const { metrics, currencySymbol } = useStudents();

  const collectionPercent =
    metrics.totalExpected > 0
      ? Math.min(100, Math.round((metrics.totalCollected / metrics.totalExpected) * 100))
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* 1. Total Active Students */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Active Students
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {metrics.totalActive}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {metrics.paidCount} Paid
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-rose-400 font-medium">
            <Clock className="w-3.5 h-3.5" />
            {metrics.pendingCount + metrics.partialCount} Due
          </span>
        </div>
      </div>

      {/* 2. Collected Fees */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Collected This Month
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
              {currencySymbol}{metrics.totalCollected.toLocaleString()}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Progress Bar toward Expected */}
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>{collectionPercent}% collected</span>
            <span>of {currencySymbol}{metrics.totalExpected.toLocaleString()}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${collectionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Pending Balance */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Pending Balance
            </p>
            <h3 className={`text-2xl sm:text-3xl font-extrabold mt-1 ${metrics.totalPending > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {currencySymbol}{metrics.totalPending.toLocaleString()}
            </h3>
          </div>
          <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${
            metrics.totalPending > 0
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              : 'bg-slate-800 border-slate-700 text-slate-500'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-400">
          {metrics.totalPending === 0 && metrics.totalActive > 0 ? (
            <span className="text-emerald-400 font-medium">✨ All active fees cleared!</span>
          ) : (
            <span>Outstanding across {metrics.pendingCount + metrics.partialCount} student(s)</span>
          )}
        </div>
      </div>
    </div>
  );
};
