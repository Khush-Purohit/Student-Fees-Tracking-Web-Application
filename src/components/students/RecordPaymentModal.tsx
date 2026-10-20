import React, { useState, useEffect } from 'react';
import { X, IndianRupee, Calendar, FileText, Check } from 'lucide-react';
import { Student, FeeStatus, FeeRecord } from '../../types';
import { useStudents } from '../../context/StudentContext';
import { formatMonthLabel, getTodayDateString } from '../../utils/dateUtils';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  month?: string;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  student,
  month
}) => {
  const { selectedMonth, recordPayment, currencySymbol } = useStudents();
  const targetMonth = month || selectedMonth;

  const [status, setStatus] = useState<FeeStatus>('PAID');
  const [amountPaid, setAmountPaid] = useState<number | ''>(0);
  const [paidDate, setPaidDate] = useState<string>(getTodayDateString());
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (student && isOpen) {
      const existing = student.feeRecords[targetMonth];
      if (existing) {
        setStatus(existing.status);
        setAmountPaid(existing.amountPaid);
        setPaidDate(existing.paidDate || getTodayDateString());
        setNotes(existing.notes || '');
      } else {
        // Default to fully paid for quick convenience
        setStatus('PAID');
        setAmountPaid(student.monthlyFee);
        setPaidDate(getTodayDateString());
        setNotes('Paid via UPI');
      }
    }
  }, [student, targetMonth, isOpen]);

  if (!isOpen || !student) return null;

  const handleStatusChange = (newStatus: FeeStatus) => {
    setStatus(newStatus);
    if (newStatus === 'PAID') {
      setAmountPaid(student.monthlyFee);
      if (!paidDate) setPaidDate(getTodayDateString());
    } else if (newStatus === 'DUE') {
      setAmountPaid(0);
      setPaidDate('');
    } else if (newStatus === 'PARTIAL') {
      if (amountPaid === 0 || amountPaid === student.monthlyFee) {
        setAmountPaid(Math.round(student.monthlyFee / 2));
      }
      if (!paidDate) setPaidDate(getTodayDateString());
    }
  };

  const handleQuickPreset = (amount: number, presetNotes: string) => {
    setAmountPaid(amount);
    if (amount >= student.monthlyFee) {
      setStatus('PAID');
    } else if (amount > 0) {
      setStatus('PARTIAL');
    } else {
      setStatus('DUE');
    }
    setNotes(presetNotes);
    if (amount > 0 && !paidDate) {
      setPaidDate(getTodayDateString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const record: FeeRecord = {
      status,
      amountPaid: Number(amountPaid) || 0,
      paidDate: status === 'DUE' ? null : paidDate || getTodayDateString(),
      notes: notes.trim()
    };

    await recordPayment(student.id, targetMonth, record);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Record Fee Payment</h3>
            <p className="text-xs text-slate-400">
              {student.name} • <span className="text-blue-400 font-semibold">{formatMonthLabel(targetMonth)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Status Selection Chips */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Payment Status</label>
            <div className="grid grid-cols-3 gap-2">
              {(['PAID', 'PARTIAL', 'DUE'] as FeeStatus[]).map((s) => {
                const isSelected = status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStatusChange(s)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                      isSelected
                        ? s === 'PAID'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/30'
                          : s === 'PARTIAL'
                          ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-900/30'
                          : 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-900/30'
                        : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 border-slate-700/60'
                    }`}
                  >
                    <span>{s}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Paid */}
          {status !== 'DUE' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5 text-blue-400" />
                  <span>Amount Paid ({currencySymbol})</span>
                </label>
                <span className="text-xs text-slate-400">
                  Total Monthly Fee: {currencySymbol}{student.monthlyFee}
                </span>
              </div>
              <input
                type="number"
                min={0}
                max={student.monthlyFee * 2}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-base font-semibold focus:outline-none focus:border-blue-500"
              />

              {/* Quick Preset Buttons */}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => handleQuickPreset(student.monthlyFee, 'Paid via UPI')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition"
                >
                  Full ({currencySymbol}{student.monthlyFee})
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset(Math.round(student.monthlyFee / 2), 'Partial payment')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition"
                >
                  Half ({currencySymbol}{Math.round(student.monthlyFee / 2)})
                </button>
              </div>
            </div>
          )}

          {/* Payment Date */}
          {status !== 'DUE' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Payment Date</span>
              </label>
              <input
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Payment Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Payment Notes / Mode</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Paid via UPI (GPay ref: 9481)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold transition shadow-md shadow-blue-600/25 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Update Fee Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
