import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageSquare,
  Calendar,
  MapPin,
  FileText,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlusCircle
} from 'lucide-react';
import { Student } from '../../types';
import { useStudents } from '../../context/StudentContext';
import { formatPhoneForWhatsApp, formatPhoneForTel } from '../../utils/exportUtils';
import { formatMonthLabel, formatDisplayDate, getRecentMonths, getCurrentMonthKey } from '../../utils/dateUtils';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onEditStudent: (student: Student) => void;
  onRecordPaymentForMonth: (student: Student, monthKey: string) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  student,
  onEditStudent,
  onRecordPaymentForMonth
}) => {
  const { deleteStudent, currencySymbol } = useStudents();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !student) return null;

  const currentMonth = getCurrentMonthKey();
  const monthsTimeline = getRecentMonths(currentMonth, 11, 0); // Past 12 months

  const handleDelete = async () => {
    await deleteStudent(student.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const fatherWa = formatPhoneForWhatsApp(student.fatherPhone);
  const motherWa = formatPhoneForWhatsApp(student.motherPhone);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {student.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600/20 text-blue-400 border border-blue-500/30">
                {student.gradeOrStandard}
              </span>
              {!student.isActive && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>Standard Monthly Fee: <strong className="text-white">{currencySymbol}{student.monthlyFee}</strong></span>
              <span>•</span>
              <span>Enrolled: {formatDisplayDate(student.joiningDate)}</span>
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEditStudent(student)}
              title="Edit Student Profile"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete Student"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">
          {/* Contact Action Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Father Card */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Father
                </p>
                <p className="text-sm font-semibold text-white">
                  {student.fatherName || 'Not specified'}
                </p>
                <p className="text-xs text-slate-400">{student.fatherPhone || 'No phone'}</p>
              </div>

              {student.fatherPhone && (
                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${formatPhoneForTel(student.fatherPhone)}`}
                    title="Call Father"
                    className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition shadow-sm"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  {fatherWa && (
                    <a
                      href={`https://wa.me/${fatherWa}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="WhatsApp Father"
                      className="p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 transition shadow-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Mother Card */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Mother
                </p>
                <p className="text-sm font-semibold text-white">
                  {student.motherName || 'Not specified'}
                </p>
                <p className="text-xs text-slate-400">{student.motherPhone || 'No phone'}</p>
              </div>

              {student.motherPhone && (
                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${formatPhoneForTel(student.motherPhone)}`}
                    title="Call Mother"
                    className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition shadow-sm"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  {motherWa && (
                    <a
                      href={`https://wa.me/${motherWa}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="WhatsApp Mother"
                      className="p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 transition shadow-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Address & Notes */}
          {(student.address || student.description) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {student.address && (
                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex gap-2.5">
                  <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-300 block mb-0.5">Address</span>
                    <span className="text-slate-400 leading-relaxed">{student.address}</span>
                  </div>
                </div>
              )}

              {student.description && (
                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex gap-2.5">
                  <FileText className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-300 block mb-0.5">Tuition & Batch Notes</span>
                    <span className="text-slate-400 leading-relaxed">{student.description}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fee History Timeline */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                  Month-by-Month Fee Ledger
                </h3>
              </div>
              <span className="text-xs text-slate-400">Past 12 Months</span>
            </div>

            <div className="space-y-2">
              {monthsTimeline.map((monthKey) => {
                const record = student.feeRecords[monthKey];
                const status = record?.status || 'DUE';
                const amount = record?.amountPaid ?? 0;
                const isCurrent = monthKey === currentMonth;

                return (
                  <div
                    key={monthKey}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                      isCurrent
                        ? 'bg-blue-950/20 border-blue-800/50'
                        : 'bg-slate-800/40 border-slate-800/80 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
                        {status === 'PAID' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : status === 'PARTIAL' ? (
                          <AlertTriangle className="w-5 h-5 text-amber-400" />
                        ) : (
                          <Clock className="w-5 h-5 text-rose-400" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-semibold text-white">
                            {formatMonthLabel(monthKey)}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-600 text-white font-semibold">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {status === 'PAID' && `Paid on ${formatDisplayDate(record?.paidDate)} ${record?.notes ? `(${record.notes})` : ''}`}
                          {status === 'PARTIAL' && `Paid ${currencySymbol}${amount} of ${currencySymbol}${student.monthlyFee} ${record?.notes ? `(${record.notes})` : ''}`}
                          {status === 'DUE' && `Outstanding: ${currencySymbol}${student.monthlyFee}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span
                          className={`text-xs sm:text-sm font-bold ${
                            status === 'PAID'
                              ? 'text-emerald-400'
                              : status === 'PARTIAL'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {status === 'PAID' ? `${currencySymbol}${amount}` : status === 'PARTIAL' ? `${currencySymbol}${amount}` : 'Due'}
                        </span>
                      </div>

                      <button
                        onClick={() => onRecordPaymentForMonth(student, monthKey)}
                        title="Adjust payment for this month"
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 flex items-center justify-between bg-slate-900/90">
          <button
            onClick={() => onRecordPaymentForMonth(student, currentMonth)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 shadow-md shadow-blue-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Current Month Fee</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-medium transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h4 className="text-base font-bold text-white mb-2">Delete {student.name}?</h4>
            <p className="text-xs text-slate-400 mb-5">
              This will remove the student profile and their historical fee ledger. This change will sync to GitHub.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition"
              >
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
