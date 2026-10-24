<script setup>
import { onMounted, ref } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { APP_TITLE } from '@/core/config/env.js';
import AppIcon from '@/shared/components/AppIcon.vue';
import ConfirmModal from '@/shared/components/ConfirmModal.vue';
import PadlockMark from '@/shared/components/PadlockMark.vue';
import { useAuthStore } from '@/features/auth/application/auth.store.js';
import { endSession } from '../session.js';

const auth = useAuthStore();
const router = useRouter();

const showLogoutConfirm = ref(false);

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'grid', exact: true },
  { to: '/transaksi', label: 'Transaksi', icon: 'receipt' },
  { to: '/misi', label: 'Misi Belajar', icon: 'timer' }
];

const promptLogout = () => {
  showLogoutConfirm.value = true;
};

const executeLogout = () => {
  showLogoutConfirm.value = false;
  endSession();
  router.replace('/masuk');
};

onMounted(() => auth.restoreSession());
</script>

<template>
  <div class="shell min-h-screen bg-slate-50 text-slate-800">
    <!-- Mobile Topbar with Glass Effect -->
    <header class="topbar sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm md:hidden">
      <div class="flex items-center gap-2.5">
        <PadlockMark :size="28" />
        <span class="brand-name font-display font-extrabold text-base tracking-tight text-slate-900">{{ APP_TITLE }}</span>
      </div>
      <button
        type="button"
        class="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
        aria-label="Keluar"
        @click="promptLogout"
      >
        <AppIcon name="logout" :size="18" />
      </button>
    </header>

    <!-- Desktop Sidebar Rail -->
    <aside class="rail hidden md:flex fixed inset-y-0 left-0 w-64 flex-col justify-between bg-white border-r border-slate-200 p-5 shadow-sm z-30">
      <div>
        <div class="rail-brand flex items-center gap-3 pb-6 border-b border-slate-100">
          <div class="p-2 bg-brand-50 rounded-xl border border-brand-100 shadow-inner">
            <PadlockMark :size="32" />
          </div>
          <div>
            <h1 class="font-display font-extrabold text-base leading-tight text-slate-900">{{ APP_TITLE }}</h1>
            <p class="text-[11px] font-medium text-slate-400 mt-0.5">Sistem Disiplin Belajar</p>
          </div>
        </div>

        <nav class="nav mt-6 space-y-1.5" aria-label="Menu utama">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="nav-link flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all duration-150"
            :exact-active-class="item.exact ? 'active text-brand-700 bg-brand-50 font-bold shadow-xs' : ''"
            :active-class="item.exact ? '' : 'active text-brand-700 bg-brand-50 font-bold shadow-xs'"
          >
            <AppIcon :name="item.icon" :size="20" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>
      </div>

      <!-- User Profile & Logout -->
      <div class="rail-user pt-4 border-t border-slate-100">
        <div class="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100 mb-3">
          <div class="w-9 h-9 rounded-full bg-brand-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
            {{ (auth.user?.name || 'M').charAt(0).toUpperCase() }}
          </div>
          <div class="overflow-hidden">
            <p class="user-name text-xs font-bold text-slate-900 truncate">{{ auth.user?.name || 'Mahasiswa' }}</p>
            <p class="user-mail text-[11px] text-slate-500 truncate">{{ auth.user?.email || 'email@mahasiswa.ac.id' }}</p>
          </div>
        </div>
        <button
          type="button"
          class="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100/80 rounded-xl transition-all"
          @click="promptLogout"
        >
          <AppIcon name="logout" :size="16" /> Keluar
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="content md:pl-64 p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-12 transition-all">
      <RouterView />
    </main>

    <!-- Mobile Bottom Tabbar -->
    <nav class="tabbar fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 shadow-lg md:hidden" aria-label="Menu utama">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="tab-link flex flex-col items-center gap-1 py-1 text-[11px] font-semibold text-slate-500 transition-colors"
        :exact-active-class="item.exact ? 'active text-brand-600 font-bold' : ''"
        :active-class="item.exact ? '' : 'active text-brand-600 font-bold'"
      >
        <AppIcon :name="item.icon" :size="20" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

    <!-- Logout Confirmation Modal (HCI: Error Prevention & User Control) -->
    <ConfirmModal
      v-if="showLogoutConfirm"
      title="Konfirmasi Keluar"
      message="Apakah kamu yakin ingin keluar dari akunmu? Sesi belajarmu yang sedang aktif akan diakhiri dan kamu perlu masuk kembali nanti."
      confirm-text="Ya, Keluar"
      cancel-text="Batal"
      tone="danger"
      @confirm="executeLogout"
      @close="showLogoutConfirm = false"
    />
  </div>
</template>

<style scoped>
.nav-link.active {
  background-color: #eef2ff;
  color: #4338ca;
}
.tab-link.active {
  color: #4f46e5;
}
</style>
