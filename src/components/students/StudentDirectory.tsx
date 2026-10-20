import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  X,
  Phone,
  MessageSquare,
  Edit2,
  Trash2,
  Calendar,
  IndianRupee,
  History,
  GraduationCap
} from 'lucide-react';
import { Student, STANDARD_CLASSES } from '../../types';
import { useStudents } from '../../context/StudentContext';
import { formatPhoneForWhatsApp, formatPhoneForTel } from '../../utils/exportUtils';
import { formatDisplayDate } from '../../utils/dateUtils';

interface StudentDirectoryProps {
  onAddStudent: () => void;
  onEditStudent: (student: Student) => void;
  onViewHistory: (student: Student) => void;
}

export const StudentDirectory: React.FC<StudentDirectoryProps> = ({
  onAddStudent,
  onEditStudent,
  onViewHistory
}) => {
  const { students, deleteStudent, currencySymbol } = useStudents();

  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Filtered roster
  const filteredRoster = useMemo(() => {
    const q = search.toLowerCase().trim();

    return students.filter((s) => {
      // 1. Search Query
      if (q) {
        const nameMatch = s.name.toLowerCase().includes(q);
        const gradeMatch = s.gradeOrStandard.toLowerCase().includes(q);
        const fatherMatch = s.fatherName.toLowerCase().includes(q) || s.fatherPhone.replace(/\s+/g, '').includes(q.replace(/\s+/g, ''));
        const motherMatch = s.motherName.toLowerCase().includes(q) || s.motherPhone.replace(/\s+/g, '').includes(q.replace(/\s+/g, ''));
        const addressMatch = s.address.toLowerCase().includes(q);
        if (!nameMatch && !gradeMatch && !fatherMatch && !motherMatch && !addressMatch) {
          return false;
        }
      }

      // 2. Class Filter
      if (selectedClass !== 'ALL' && s.gradeOrStandard !== selectedClass) {
        return false;
      }

      // 3. Status Filter
      if (statusFilter === 'ACTIVE' && !s.isActive) return false;
      if (statusFilter === 'INACTIVE' && s.isActive) return false;

      return true;
    });
  }, [students, search, selectedClass, statusFilter]);

  const activeCount = useMemo(() => students.filter((s) => s.isActive).length, [students]);

  const handleConfirmDelete = async () => {
    if (studentToDelete) {
      await deleteStudent(studentToDelete.id);
      setStudentToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Directory Header Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Student Directory</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600/20 text-blue-400 border border-blue-500/30">
                {students.length} Total
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeCount} Active • {students.length - activeCount} Inactive
            </p>
          </div>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={onAddStudent}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="relative sm:col-span-6">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by student name, phone, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition shadow-inner"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Class Filter Dropdown */}
        <div className="sm:col-span-3">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Classes (1st to 12th)</option>
            {STANDARD_CLASSES.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3">
          <div className="grid grid-cols-3 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Students Roster List / Cards */}
      {filteredRoster.length > 0 ? (
        <div className="space-y-3">
          {filteredRoster.map((student) => {
            const fatherWa = formatPhoneForWhatsApp(student.fatherPhone);
            const motherWa = formatPhoneForWhatsApp(student.motherPhone);

            return (
              <div
                key={student.id}
                className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Student Profile & Academic Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {student.name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600/20 text-blue-400 border border-blue-500/30">
                      {student.gradeOrStandard}
                    </span>
                    {!student.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400">
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400 pt-0.5">
                    <span className="flex items-center gap-1">
                      <IndianRupee className="w-3.5 h-3.5 text-blue-400" />
                      Monthly Fee: <strong className="text-white">{currencySymbol}{student.monthlyFee.toLocaleString()}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      Joined: <strong className="text-slate-300">{formatDisplayDate(student.joiningDate)}</strong>
                    </span>
                  </div>

                  {/* Parents contact preview */}
                  {(student.fatherPhone || student.motherPhone) && (
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                      {student.fatherPhone && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">Father:</span>
                          <span className="text-slate-300 font-medium">{student.fatherName ? `${student.fatherName} (${student.fatherPhone})` : student.fatherPhone}</span>
                          <a
                            href={`tel:${formatPhoneForTel(student.fatherPhone)}`}
                            title="Call Father"
                            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                          {fatherWa && (
                            <a
                              href={`https://wa.me/${fatherWa}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="WhatsApp Father"
                              className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                            >
                              <MessageSquare className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}

                      {student.motherPhone && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">Mother:</span>
                          <span className="text-slate-300 font-medium">{student.motherName ? `${student.motherName} (${student.motherPhone})` : student.motherPhone}</span>
                          <a
                            href={`tel:${formatPhoneForTel(student.motherPhone)}`}
                            title="Call Mother"
                            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                          {motherWa && (
                            <a
                              href={`https://wa.me/${motherWa}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="WhatsApp Mother"
                              className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                            >
                              <MessageSquare className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 pt-3 md:pt-0 border-t border-slate-800 md:border-t-0 shrink-0">
                  {/* View History */}
                  <button
                    onClick={() => onViewHistory(student)}
                    title="View Fee Ledger Timeline"
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <History className="w-3.5 h-3.5 text-blue-400" />
                    <span>Ledger</span>
                  </button>

                  {/* Edit Profile */}
                  <button
                    onClick={() => onEditStudent(student)}
                    title="Edit Student Profile"
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Edit</span>
                  </button>

                  {/* Remove Student */}
                  <button
                    onClick={() => setStudentToDelete(student)}
                    title="Remove / Delete Student"
                    className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center my-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mb-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            {students.length === 0 ? 'No students enrolled yet' : 'No matching students found'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-5">
            {students.length === 0
              ? 'Add your students to manage their profiles, class schedules, and monthly fee collections.'
              : 'Try clearing your search query or selecting "All Classes".'}
          </p>
          <button
            onClick={onAddStudent}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-blue-600/25"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-white mb-1">Remove Student?</h4>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Are you sure you want to remove <strong className="text-white">{studentToDelete.name}</strong> ({studentToDelete.gradeOrStandard})? This will delete their profile and fee records.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition shadow-md shadow-rose-600/25"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
