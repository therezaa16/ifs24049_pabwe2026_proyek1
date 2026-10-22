import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/features/auth/application/auth.store.js';
import { APP_TITLE } from '@/core/config/env.js';

export const routes = [
  { path: '/masuk', name: 'login', component: () => import('@/features/auth/presentation/LoginView.vue'), meta: { guestOnly: true, title: 'Masuk' } },
  { path: '/daftar', name: 'register', component: () => import('@/features/auth/presentation/RegisterView.vue'), meta: { guestOnly: true, title: 'Daftar' } },
  {
    path: '/',
    component: () => import('../layouts/AppShell.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'dashboard', component: () => import('@/features/dashboard/presentation/DashboardView.vue'), meta: { title: 'Dashboard' } },
      { path: 'transaksi', name: 'transactions', component: () => import('@/features/transactions/presentation/TransactionsView.vue'), meta: { title: 'Transaksi' } },
      { path: 'misi', name: 'missions', component: () => import('@/features/study-missions/presentation/StudyMissionsView.vue'), meta: { title: 'Misi Belajar' } }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

export const authGuard = (to) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: to.fullPath === '/' ? {} : { redirect: to.fullPath } };
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'dashboard' };
  }
  return true;
};

export const createAppRouter = () => {
  const router = createRouter({ history: createWebHistory(), routes });
  router.beforeEach(authGuard);
  router.afterEach((to) => {
    document.title = to.meta.title ? `${to.meta.title} · ${APP_TITLE}` : APP_TITLE;
  });
  return router;
};
