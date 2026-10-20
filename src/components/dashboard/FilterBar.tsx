import React from 'react';
import { Search, X, UserPlus, Filter } from 'lucide-react';
import { useStudents } from '../../context/StudentContext';
import { FilterStatus } from '../../types';

interface FilterBarProps {
  onAddStudent: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ onAddStudent }) => {
  const { searchQuery, setSearchQuery, filterStatus, setFilterStatus, metrics } = useStudents();

  const filterOptions: { label: string; value: FilterStatus; count?: number }[] = [
    { label: 'All', value: 'ALL', count: metrics.totalActive },
    { label: 'Pending', value: 'PENDING', count: metrics.pendingCount + metrics.partialCount },
    { label: 'Paid', value: 'PAID', count: metrics.paidCount }
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Search Bar */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search student name, phone number, or standard..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between sm:justify-start gap-2">
        {/* Filter Chips */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <Filter className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1 hidden sm:block" />
          {filterOptions.map((opt) => {
            const isActive = filterStatus === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setFilterStatus(opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>{opt.label}</span>
                {typeof opt.count === 'number' && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {opt.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Add Student Button */}
        <button
          onClick={onAddStudent}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition shadow-md shadow-blue-600/20 whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Student</span>
        </button>
      </div>
    </div>
  );
};
