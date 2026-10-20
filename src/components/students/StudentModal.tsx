import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, FileText, Calendar, IndianRupee, Save } from 'lucide-react';
import { Student, STANDARD_CLASSES } from '../../types';
import { useStudents } from '../../context/StudentContext';
import { getTodayDateString } from '../../utils/dateUtils';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentToEdit?: Student | null;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  studentToEdit
}) => {
  const { addStudent, updateStudent, currencySymbol } = useStudents();

  const [name, setName] = useState('');
  const [gradeOrStandard, setGradeOrStandard] = useState('');
  const [monthlyFee, setMonthlyFee] = useState<number | ''>(2000);
  const [fatherName, setFatherName] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherPhone, setMotherPhone] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [joiningDate, setJoiningDate] = useState(getTodayDateString());
  const [isActive, setIsActive] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (studentToEdit) {
      setName(studentToEdit.name);
      setGradeOrStandard(studentToEdit.gradeOrStandard);
      setMonthlyFee(studentToEdit.monthlyFee);
      setFatherName(studentToEdit.fatherName);
      setFatherPhone(studentToEdit.fatherPhone);
      setMotherName(studentToEdit.motherName);
      setMotherPhone(studentToEdit.motherPhone);
      setAddress(studentToEdit.address);
      setDescription(studentToEdit.description);
      setJoiningDate(studentToEdit.joiningDate);
      setIsActive(studentToEdit.isActive);
    } else {
      setName('');
      setGradeOrStandard('');
      setMonthlyFee(2000);
      setFatherName('');
      setFatherPhone('');
      setMotherName('');
      setMotherPhone('');
      setAddress('');
      setDescription('');
      setJoiningDate(getTodayDateString());
      setIsActive(true);
    }
    setError(null);
  }, [studentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Student name is required.');
      return;
    }

    if (!gradeOrStandard.trim()) {
      setError('Grade or Standard is required.');
      return;
    }

    if (monthlyFee === '' || monthlyFee < 0) {
      setError('Please provide a valid monthly fee.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (studentToEdit) {
        await updateStudent(studentToEdit.id, {
          name: name.trim(),
          gradeOrStandard: gradeOrStandard.trim(),
          monthlyFee: Number(monthlyFee),
          fatherName: fatherName.trim(),
          fatherPhone: fatherPhone.trim(),
          motherName: motherName.trim(),
          motherPhone: motherPhone.trim(),
          address: address.trim(),
          description: description.trim(),
          joiningDate,
          isActive
        });
      } else {
        await addStudent({
          name: name.trim(),
          gradeOrStandard: gradeOrStandard.trim(),
          monthlyFee: Number(monthlyFee),
          fatherName: fatherName.trim(),
          fatherPhone: fatherPhone.trim(),
          motherName: motherName.trim(),
          motherPhone: motherPhone.trim(),
          address: address.trim(),
          description: description.trim(),
          joiningDate,
          isActive
        });
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save student record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {studentToEdit ? 'Edit Student Profile' : 'Add New Student'}
              </h3>
              <p className="text-xs text-slate-400">Personal & Academic Tuition Record</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Aarav Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Standard / Grade <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={gradeOrStandard}
                onChange={(e) => setGradeOrStandard(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="" disabled>Select Class (1 to 12th)</option>
                {STANDARD_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
                {gradeOrStandard && !STANDARD_CLASSES.includes(gradeOrStandard as (typeof STANDARD_CLASSES)[number]) && (
                  <option value={gradeOrStandard}>{gradeOrStandard}</option>
                )}
              </select>
            </div>
          </div>

          {/* Fee & Joining Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-blue-400" />
                <span>Monthly Fee ({currencySymbol})</span> <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                required
                min={0}
                step={50}
                placeholder="2500"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Joining Date</span>
              </label>
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Father Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Father's Name
              </label>
              <input
                type="text"
                placeholder="Rajesh Sharma"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-400" />
                <span>Father's Phone</span>
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={fatherPhone}
                onChange={(e) => setFatherPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />
            </div>
          </div>

          {/* Mother Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Mother's Name
              </label>
              <input
                type="text"
                placeholder="Sunita Sharma"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-400" />
                <span>Mother's Phone</span>
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43211"
                value={motherPhone}
                onChange={(e) => setMotherPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>Residential Address</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 42 Lake View Road, Indiranagar, Bengaluru"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-500 resize-none"
            />
          </div>

          {/* Notes / Description */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Tuition Notes / Batch Schedule</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Mathematics batch 5 PM - 6:30 PM. Focus on trigonometry."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-500 resize-none"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div>
              <p className="text-xs font-semibold text-white">Active Student</p>
              <p className="text-[11px] text-slate-400">Inactive students are excluded from monthly metrics.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
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
              <Save className="w-4 h-4" />
              <span>{studentToEdit ? 'Save Changes' : 'Create Student'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
