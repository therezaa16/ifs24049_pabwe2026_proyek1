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
  <div class="shell min-h-screen text-slate-900">
    <!-- Mobile Topbar -->
    <header class="topbar sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 bg-white/80 backdrop-blur-xl border-b border-slate-200/70 md:hidden">
      <div class="flex items-center gap-2.5">
        <div class="p-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/10">
          <PadlockMark :size="24" />
        </div>
        <span class="brand-name font-display font-extrabold text-base tracking-tight">{{ APP_TITLE }}</span>
      </div>
      <button
        type="button"
        class="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
        aria-label="Keluar"
        @click="promptLogout"
      >
        <AppIcon name="logout" :size="18" />
      </button>
    </header>

    <!-- Desktop Sidebar -->
    <aside class="rail hidden md:flex fixed inset-y-0 left-0 w-[17rem] flex-col justify-between bg-white/90 backdrop-blur-xl border-r border-slate-200/70 p-6 z-30">
      <div>
        <div class="rail-brand flex items-center gap-3 pb-6 border-b border-slate-100">
          <div class="relative p-2 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/15">
            <PadlockMark :size="34" />
          </div>
          <div>
            <h1 class="font-display font-extrabold text-base leading-tight">{{ APP_TITLE }}</h1>
            <p class="text-[11px] font-medium text-slate-500 mt-0.5">Disiplin Finansial • Misi Belajar</p>
          </div>
        </div>

        <nav class="nav mt-6 space-y-1" aria-label="Menu utama">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="nav-link group flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-semibold text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-all"
            :exact-active-class="item.exact ? 'active' : ''"
            :active-class="item.exact ? '' : 'active'"
          >
            <div class="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100/70 group-hover:bg-white group-[.active]:bg-gradient-to-br group-[.active]:from-indigo-500 group-[.active]:to-violet-600 transition-all">
              <AppIcon :name="item.icon" :size="18" class="text-slate-500 group-hover:text-slate-900 group-[.active]:text-white" />
            </div>
            <span class="flex-1">{{ item.label }}</span>
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 opacity-0 group-[.active]:opacity-100 transition-opacity"></span>
          </RouterLink>
        </nav>
      </div>

      <div class="rail-user pt-5 border-t border-slate-100 space-y-3">
        <div class="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 shadow-sm">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/15">
            {{ (auth.user?.name || 'M').charAt(0).toUpperCase() }}
          </div>
          <div class="overflow-hidden">
            <p class="user-name text-sm font-bold truncate">{{ auth.user?.name || 'Mahasiswa' }}</p>
            <p class="user-mail text-[11px] text-slate-500 truncate">{{ auth.user?.email || 'email@mahasiswa.ac.id' }}</p>
          </div>
        </div>
        <button
          type="button"
          class="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-2xl transition-all shadow-sm"
          @click="promptLogout"
        >
          <AppIcon name="logout" :size="16" /> Keluar
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="content md:ml-[17rem] px-4 sm:px-6 lg:px-10 xl:px-14 py-6 md:py-10 pb-28 md:pb-12">
      <div class="mx-auto w-full max-w-[88rem]">
        <RouterView />
      </div>
    </main>

    <!-- Mobile Bottom Tabbar -->
    <nav class="tabbar fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 bg-white/90 backdrop-blur-xl border-t border-slate-200/70 py-1.5 md:hidden shadow-[0_-10px_40px_-20px_rgba(79,70,229,0.5)]" aria-label="Menu utama">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="tab-link flex flex-col items-center gap-1 py-1 text-[10px] font-semibold text-slate-500 transition-colors"
        :exact-active-class="item.exact ? 'active' : ''"
        :active-class="item.exact ? '' : 'active'"
      >
        <div class="w-9 h-9 rounded-xl flex items-center justify-center">
          <AppIcon :name="item.icon" :size="19" />
        </div>
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
  color: #312e81;
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.12) 0%, transparent 100%);
}
.tab-link.active {
  color: #4f46e5;
}
.tab-link.active :deep(svg) {
  color: #4f46e5;
}
</style>
