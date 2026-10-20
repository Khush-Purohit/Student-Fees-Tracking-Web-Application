import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Student,
  StudentDatabase,
  FeeRecord,
  SyncStatus,
  FilterStatus,
  MonthMetrics
} from '../types';
import { storageService } from '../services/storageService';
import { syncService } from '../services/syncService';
import { useAuth } from './AuthContext';
import { getCurrentMonthKey, getTodayDateString, isMonthBeforeJoining } from '../utils/dateUtils';

interface StudentContextType {
  students: Student[];
  selectedMonth: string;
  searchQuery: string;
  filterStatus: FilterStatus;
  syncStatus: SyncStatus;
  lastSyncTime: string | null;
  syncError: string | null;
  currencySymbol: string;
  metrics: MonthMetrics;
  filteredStudents: Student[];
  setSelectedMonth: (month: string) => void;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: FilterStatus) => void;
  setCurrencySymbol: (symbol: string) => void;
  addStudent: (data: Omit<Student, 'id' | 'feeRecords'>) => Promise<void>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  toggleFeePaid: (studentId: string, month?: string) => Promise<void>;
  recordPayment: (studentId: string, month: string, record: FeeRecord) => Promise<void>;
  triggerSync: () => Promise<void>;
  importDatabase: (db: StudentDatabase) => Promise<void>;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

// Sample demo data for instant explore mode
const DEMO_STUDENTS: Student[] = [
  {
    id: 'demo-std-1',
    name: 'Aarav Sharma',
    gradeOrStandard: 'Class 10th',
    fatherName: 'Rajesh Sharma',
    fatherPhone: '+91 98765 43210',
    motherName: 'Sunita Sharma',
    motherPhone: '+91 98765 43211',
    address: '42 Lake View Road, Indiranagar, Bengaluru',
    description: 'Mathematics & Physics tuition. 5 PM - 6:30 PM batch.',
    monthlyFee: 2500,
    joiningDate: '2026-06-01',
    isActive: true,
    feeRecords: {
      [getCurrentMonthKey()]: {
        status: 'PAID',
        amountPaid: 2500,
        paidDate: getTodayDateString(),
        notes: 'Paid via UPI'
      }
    }
  },
  {
    id: 'demo-std-2',
    name: 'Priya Patel',
    gradeOrStandard: 'Class 8th',
    fatherName: 'Kiran Patel',
    fatherPhone: '+91 98220 12345',
    motherName: 'Bhavna Patel',
    motherPhone: '+91 98220 12346',
    address: 'B-204 Green Acres, Koramangala',
    description: 'Science & English batch.',
    monthlyFee: 2000,
    joiningDate: '2026-07-15',
    isActive: true,
    feeRecords: {
      [getCurrentMonthKey()]: {
        status: 'PARTIAL',
        amountPaid: 1000,
        paidDate: getTodayDateString(),
        notes: 'Cash advance, balance next week'
      }
    }
  },
  {
    id: 'demo-std-3',
    name: 'Rohan Gupta',
    gradeOrStandard: 'Class 12th',
    fatherName: 'Sanjay Gupta',
    fatherPhone: '+91 99001 54321',
    motherName: 'Meera Gupta',
    motherPhone: '',
    address: '15/3 4th Cross, Malleshwaram',
    description: 'Chemistry intensive test series.',
    monthlyFee: 3000,
    joiningDate: '2026-08-01',
    isActive: true,
    feeRecords: {}
  }
];

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isUnlocked, isGitHubConfigured, config, pat } = useAuth();

  const [database, setDatabase] = useState<StudentDatabase>(() => {
    const cached = storageService.getCachedDatabase();
    if (cached && cached.students.length > 0) return cached;
    return {
      version: 1,
      lastUpdated: new Date().toISOString(),
      students: DEMO_STUDENTS
    };
  });

  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonthKey());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [currencySymbol, setCurrencySymbolState] = useState<string>(() => storageService.getSettings().currencySymbol || '₹');

  const setCurrencySymbol = (sym: string) => {
    storageService.setSettings({ currencySymbol: sym });
    setCurrencySymbolState(sym);
  };

  // Sync pull on session unlock
  useEffect(() => {
    if (!isUnlocked) return;

    if (!isGitHubConfigured || !config || !pat) {
      const cached = storageService.getCachedDatabase();
      if (!cached || cached.students.length === 0) {
        const initialDb: StudentDatabase = {
          version: 1,
          lastUpdated: new Date().toISOString(),
          students: DEMO_STUDENTS
        };
        storageService.setCachedDatabase(initialDb);
        setDatabase(initialDb);
      }
      setSyncStatus('synced');
      setLastSyncTime(new Date().toLocaleTimeString());
      return;
    }

    let isMounted = true;
    setSyncStatus('syncing');

    syncService.pull(pat, config).then((res) => {
      if (!isMounted) return;
      setDatabase(res.database);
      if (res.success) {
        setSyncStatus('synced');
        setLastSyncTime(new Date().toLocaleTimeString());
        setSyncError(null);
      } else {
        setSyncStatus('error');
        setSyncError(res.error || 'Sync pull failed');
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isUnlocked, isGitHubConfigured, config, pat]);

  // Persist mutations & push sync helper
  const commitDatabaseMutation = useCallback(
    async (updater: (prev: StudentDatabase) => StudentDatabase) => {
      setDatabase((prev) => {
        const next = updater(prev);
        next.lastUpdated = new Date().toISOString();
        storageService.setCachedDatabase(next);

        // Local storage mode: purely local
        if (!isGitHubConfigured || !config || !pat) {
          setSyncStatus('synced');
          setLastSyncTime(new Date().toLocaleTimeString());
          return next;
        }

        // Trigger background push sync
        setSyncStatus('syncing');
        syncService.push(next, pat, config).then((res) => {
          if (res.success) {
            setSyncStatus('synced');
            setLastSyncTime(new Date().toLocaleTimeString());
            setSyncError(null);
            setDatabase(res.database);
          } else {
            setSyncStatus('error');
            setSyncError(res.error || 'Failed to sync with GitHub');
          }
        });

        return next;
      });
    },
    [isGitHubConfigured, config, pat]
  );

  // Manual Trigger Sync
  const triggerSync = useCallback(async () => {
    if (!isGitHubConfigured || !config || !pat) {
      setSyncStatus('synced');
      setLastSyncTime(new Date().toLocaleTimeString());
      return;
    }

    setSyncStatus('syncing');
    setSyncError(null);

    const res = await syncService.pull(pat, config);
    setDatabase(res.database);
    if (res.success) {
      setSyncStatus('synced');
      setLastSyncTime(new Date().toLocaleTimeString());
    } else {
      setSyncStatus('error');
      setSyncError(res.error || 'Sync failed');
    }
  }, [isGitHubConfigured, config, pat]);

  // Add Student
  const addStudent = useCallback(
    async (studentData: Omit<Student, 'id' | 'feeRecords'>) => {
      const newStudent: Student = {
        ...studentData,
        id: `std_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        feeRecords: {}
      };

      await commitDatabaseMutation((prev) => ({
        ...prev,
        students: [newStudent, ...prev.students]
      }));
    },
    [commitDatabaseMutation]
  );

  // Update Student
  const updateStudent = useCallback(
    async (id: string, updatedData: Partial<Student>) => {
      await commitDatabaseMutation((prev) => ({
        ...prev,
        students: prev.students.map((s) => (s.id === id ? { ...s, ...updatedData } : s))
      }));
    },
    [commitDatabaseMutation]
  );

  // Delete Student
  const deleteStudent = useCallback(
    async (id: string) => {
      await commitDatabaseMutation((prev) => ({
        ...prev,
        students: prev.students.filter((s) => s.id !== id)
      }));
    },
    [commitDatabaseMutation]
  );

  // Toggle Fee Paid
  const toggleFeePaid = useCallback(
    async (studentId: string, month = selectedMonth) => {
      await commitDatabaseMutation((prev) => {
        const student = prev.students.find((s) => s.id === studentId);
        if (!student) return prev;

        const currentRecord = student.feeRecords[month];
        const isCurrentlyPaid = currentRecord?.status === 'PAID';

        const updatedRecord: FeeRecord = isCurrentlyPaid
          ? {
              status: 'DUE',
              amountPaid: 0,
              paidDate: null,
              notes: ''
            }
          : {
              status: 'PAID',
              amountPaid: student.monthlyFee,
              paidDate: getTodayDateString(),
              notes: currentRecord?.notes || 'Marked as paid'
            };

        return {
          ...prev,
          students: prev.students.map((s) =>
            s.id === studentId
              ? {
                  ...s,
                  feeRecords: {
                    ...s.feeRecords,
                    [month]: updatedRecord
                  }
                }
              : s
          )
        };
      });
    },
    [selectedMonth, commitDatabaseMutation]
  );

  // Record Payment
  const recordPayment = useCallback(
    async (studentId: string, month: string, record: FeeRecord) => {
      await commitDatabaseMutation((prev) => ({
        ...prev,
        students: prev.students.map((s) =>
          s.id === studentId
            ? {
                ...s,
                feeRecords: {
                  ...s.feeRecords,
                  [month]: record
                }
              }
            : s
        )
      }));
    },
    [commitDatabaseMutation]
  );

  // Import Database
  const importDatabase = useCallback(
    async (db: StudentDatabase) => {
      await commitDatabaseMutation(() => db);
    },
    [commitDatabaseMutation]
  );

  // Calculate Metrics for selectedMonth
  const metrics: MonthMetrics = useMemo(() => {
    let totalActive = 0;
    let totalExpected = 0;
    let totalCollected = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let partialCount = 0;

    for (const student of database.students) {
      if (!student.isActive) continue;

      // Requirement 3: Student fee should not be shown due for months before joining date
      const isEnrolledInMonth = !isMonthBeforeJoining(selectedMonth, student.joiningDate);
      if (!isEnrolledInMonth) {
        // Not enrolled in this month: excluded from this month's billing
        continue;
      }

      totalActive++;
      totalExpected += student.monthlyFee;

      const record = student.feeRecords[selectedMonth];
      if (!record || record.status === 'DUE') {
        pendingCount++;
      } else if (record.status === 'PAID') {
        paidCount++;
        totalCollected += record.amountPaid || student.monthlyFee;
      } else if (record.status === 'PARTIAL') {
        partialCount++;
        totalCollected += record.amountPaid || 0;
      }
    }

    const totalPending = Math.max(0, totalExpected - totalCollected);

    return {
      totalActive,
      totalExpected,
      totalCollected,
      totalPending,
      paidCount,
      pendingCount,
      partialCount
    };
  }, [database.students, selectedMonth]);

  // Filtered and Searched Students
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return database.students.filter((student) => {
      // Search match
      if (q) {
        const nameMatch = student.name.toLowerCase().includes(q);
        const gradeMatch = student.gradeOrStandard.toLowerCase().includes(q);
        const fatherPhoneMatch = student.fatherPhone.replace(/\s+/g, '').includes(q.replace(/\s+/g, ''));
        const motherPhoneMatch = student.motherPhone.replace(/\s+/g, '').includes(q.replace(/\s+/g, ''));
        if (!nameMatch && !gradeMatch && !fatherPhoneMatch && !motherPhoneMatch) {
          return false;
        }
      }

      // Filter chip match
      if (filterStatus !== 'ALL') {
        const isEnrolledInMonth = !isMonthBeforeJoining(selectedMonth, student.joiningDate);
        // If student is not enrolled in selectedMonth, they have no pending or paid fees in this month
        if (!isEnrolledInMonth) {
          return false;
        }

        const record = student.feeRecords[selectedMonth];
        const status = record?.status || 'DUE';

        if (filterStatus === 'PAID' && status !== 'PAID') {
          return false;
        }
        if (filterStatus === 'PENDING' && status === 'PAID') {
          return false;
        }
      }

      return true;
    });
  }, [database.students, searchQuery, filterStatus, selectedMonth]);

  return (
    <StudentContext.Provider
      value={{
        students: database.students,
        selectedMonth,
        searchQuery,
        filterStatus,
        syncStatus,
        lastSyncTime,
        syncError,
        currencySymbol,
        metrics,
        filteredStudents,
        setSelectedMonth,
        setSearchQuery,
        setFilterStatus,
        setCurrencySymbol,
        addStudent,
        updateStudent,
        deleteStudent,
        toggleFeePaid,
        recordPayment,
        triggerSync,
        importDatabase
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};

export const useStudents = (): StudentContextType => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudents must be used within a StudentProvider');
  }
  return context;
};
