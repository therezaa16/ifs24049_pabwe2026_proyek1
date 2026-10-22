import { useAuthStore } from '@/features/auth/application/auth.store.js';
import { useDashboardStore } from '@/features/dashboard/application/dashboard.store.js';
import { useMissionsStore } from '@/features/study-missions/application/missions.store.js';
import { useTransactionsStore } from '@/features/transactions/application/transactions.store.js';

/** Mengakhiri sesi dan membersihkan seluruh data milik pengguna dari memori. */
export const endSession = () => {
  useAuthStore().clearSession();
  useTransactionsStore().reset();
  useMissionsStore().reset();
  useDashboardStore().reset();
};
