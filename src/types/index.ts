export type FeeStatus = 'PAID' | 'DUE' | 'PARTIAL';

export interface FeeRecord {
  status: FeeStatus;
  amountPaid: number;
  paidDate: string | null; // ISO YYYY-MM-DD
  notes: string;
}

export interface Student {
  id: string; // UUID v4
  name: string;
  gradeOrStandard: string;
  fatherName: string;
  fatherPhone: string;
  motherName: string;
  motherPhone: string;
  address: string;
  description: string;
  monthlyFee: number;
  joiningDate: string; // ISO YYYY-MM-DD
  isActive: boolean;
  feeRecords: Record<string, FeeRecord>; // Keyed by YYYY-MM (e.g. '2026-10')
}

export interface StudentDatabase {
  version: number;
  lastUpdated: string;
  students: Student[];
}

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error' | 'offline';

export interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  encryptedPat: string; // Base64
  salt: string; // Base64
  iv: string; // Base64
}

export interface AppSettings {
  currencySymbol: string;
  autoLockMinutes: number;
  isDemoMode?: boolean;
}

export type FilterStatus = 'ALL' | 'PENDING' | 'PAID';

export interface MonthMetrics {
  totalActive: number;
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  paidCount: number;
  pendingCount: number;
  partialCount: number;
}
