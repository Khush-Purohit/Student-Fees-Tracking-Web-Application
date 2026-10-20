import React from 'react';
import { Phone, MessageSquare, Check, RotateCcw, ChevronRight } from 'lucide-react';
import { Student } from '../../types';
import { useStudents } from '../../context/StudentContext';
import { formatPhoneForWhatsApp, formatPhoneForTel } from '../../utils/exportUtils';
import { formatDisplayDate, isMonthBeforeJoining, getJoiningMonthKey, formatMonthLabel } from '../../utils/dateUtils';

interface StudentCardProps {
  student: Student;
  onOpenDetail: (student: Student) => void;
  onRecordPayment: (student: Student) => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  onOpenDetail,
  onRecordPayment
}) => {
  const { selectedMonth, currencySymbol, toggleFeePaid } = useStudents();

  const isEnrolledInMonth = !isMonthBeforeJoining(selectedMonth, student.joiningDate);
  const record = student.feeRecords[selectedMonth];
  const feeStatus = isEnrolledInMonth ? (record?.status || 'DUE') : 'NOT_ENROLLED';
  const amountPaid = record?.amountPaid || 0;
  const balanceRemaining = Math.max(0, student.monthlyFee - amountPaid);

  const primaryPhone = student.fatherPhone || student.motherPhone;
  const whatsappUrl = primaryPhone ? `https://wa.me/${formatPhoneForWhatsApp(primaryPhone)}` : null;
  const telUrl = primaryPhone ? `tel:${formatPhoneForTel(primaryPhone)}` : null;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEnrolledInMonth) {
      toggleFeePaid(student.id);
    }
  };

  return (
    <div
      onClick={() => onOpenDetail(student)}
      className="group bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl relative overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        {/* Left Side: Student Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-blue-400 transition truncate">
              {student.name}
            </h4>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700/60 shrink-0">
              {student.gradeOrStandard}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-400">
            <span>
              Monthly: <strong className="text-slate-200">{currencySymbol}{student.monthlyFee.toLocaleString()}</strong>
            </span>
            {primaryPhone && (
              <>
                <span>•</span>
                <span className="truncate">{student.fatherName ? `${student.fatherName} (${primaryPhone})` : primaryPhone}</span>
              </>
            )}
          </div>
        </div>

        {/* Center / Right Side: Status Badge & Quick Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t border-slate-800/60 sm:border-t-0">
          {/* Status Badge */}
          {!isEnrolledInMonth ? (
            <div
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border flex flex-col items-end bg-slate-800/80 text-slate-400 border-slate-700/60"
              title={`Student enrolled on ${formatDisplayDate(student.joiningDate)}. Fees apply from ${formatMonthLabel(getJoiningMonthKey(student.joiningDate))}.`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <span>Not Enrolled</span>
              </div>
              <span className="text-[10px] text-slate-500">
                Joined {formatMonthLabel(getJoiningMonthKey(student.joiningDate))}
              </span>
            </div>
          ) : (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onRecordPayment(student);
              }}
              title="Click to adjust payment details"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex flex-col items-end transition hover:opacity-90 ${
                feeStatus === 'PAID'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : feeStatus === 'PARTIAL'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>{feeStatus}</span>
                {feeStatus === 'PARTIAL' && (
                  <span className="text-[11px] opacity-80">
                    ({currencySymbol}{amountPaid})
                  </span>
                )}
              </div>
              {feeStatus === 'PAID' && record?.paidDate && (
                <span className="text-[10px] opacity-75">{formatDisplayDate(record.paidDate)}</span>
              )}
              {feeStatus === 'PARTIAL' && (
                <span className="text-[10px] text-rose-300">
                  Due: {currencySymbol}{balanceRemaining}
                </span>
              )}
            </div>
          )}

          {/* Quick Contact Links */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {telUrl && (
              <a
                href={telUrl}
                title="Call Parent"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
            )}
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Send WhatsApp Message"
                className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* 1-Tap Toggle Paid Button */}
          {!isEnrolledInMonth ? (
            <span
              title={`Joined in ${formatMonthLabel(getJoiningMonthKey(student.joiningDate))}`}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-medium bg-slate-800/40 text-slate-500 border border-slate-800/60 cursor-default"
            >
              <span className="hidden md:inline">Not Billed</span>
              <span className="md:hidden">—</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleToggle}
              title={feeStatus === 'PAID' ? 'Mark as Due' : 'Mark as Paid'}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                feeStatus === 'PAID'
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-600/30'
              }`}
            >
              {feeStatus === 'PAID' ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Mark Due</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Mark Paid</span>
                </>
              )}
            </button>
          )}

          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition hidden sm:block" />
        </div>
      </div>
    </div>
  );
};
