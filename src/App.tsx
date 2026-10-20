import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StudentProvider, useStudents } from './context/StudentContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { Header } from './components/common/Header';
import { MetricCards } from './components/dashboard/MetricCards';
import { FilterBar } from './components/dashboard/FilterBar';
import { StudentCard } from './components/dashboard/StudentCard';
import { StudentModal } from './components/students/StudentModal';
import { StudentDetailModal } from './components/students/StudentDetailModal';
import { RecordPaymentModal } from './components/students/RecordPaymentModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { Student } from './types';
import { UserX, Plus } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { filteredStudents, students, searchQuery, filterStatus } = useStudents();

  // Modals state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStudent, setPaymentStudent] = useState<Student | null>(null);
  const [paymentTargetMonth, setPaymentTargetMonth] = useState<string | undefined>(undefined);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Handlers
  const handleOpenAddStudent = () => {
    setStudentToEdit(null);
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setStudentToEdit(student);
    setIsStudentModalOpen(true);
  };

  const handleOpenDetail = (student: Student) => {
    setSelectedStudentForDetail(student);
    setIsDetailModalOpen(true);
  };

  const handleOpenPayment = (student: Student, monthKey?: string) => {
    setPaymentStudent(student);
    setPaymentTargetMonth(monthKey);
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Sticky Top Header */}
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Metric Cards */}
        <MetricCards />

        {/* Filter Bar */}
        <FilterBar onAddStudent={handleOpenAddStudent} />

        {/* Student Cards List */}
        {filteredStudents.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {filteredStudents.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onOpenDetail={handleOpenDetail}
                onRecordPayment={(s) => handleOpenPayment(s)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center my-8">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center mb-3">
              <UserX className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {students.length === 0
                ? 'No students added yet'
                : searchQuery || filterStatus !== 'ALL'
                ? 'No matching students found'
                : 'Student list is empty'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-5">
              {students.length === 0
                ? 'Add your students to begin tracking monthly tuition cycles, parent contacts, and fee balances.'
                : 'Try adjusting your search query or status filter chips.'}
            </p>
            {students.length === 0 && (
              <button
                onClick={handleOpenAddStudent}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-blue-600/25"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Student</span>
              </button>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        studentToEdit={studentToEdit}
      />

      <StudentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        student={selectedStudentForDetail}
        onEditStudent={(s) => {
          setIsDetailModalOpen(false);
          handleOpenEditStudent(s);
        }}
        onRecordPaymentForMonth={(s, month) => {
          handleOpenPayment(s, month);
        }}
      />

      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        student={paymentStudent}
        month={paymentTargetMonth}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

const MainFlow: React.FC = () => {
  const { isUnlocked } = useAuth();

  if (!isUnlocked) {
    return <LoginScreen />;
  }

  return (
    <StudentProvider>
      <DashboardContent />
    </StudentProvider>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainFlow />
    </AuthProvider>
  );
};

export default App;
