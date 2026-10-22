<script setup>
import { onMounted } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { APP_TITLE } from '@/core/config/env.js';
import AppIcon from '@/shared/components/AppIcon.vue';
import PadlockMark from '@/shared/components/PadlockMark.vue';
import { useAuthStore } from '@/features/auth/application/auth.store.js';
import { endSession } from '../session.js';

const auth = useAuthStore();
const router = useRouter();

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'grid', exact: true },
  { to: '/transaksi', label: 'Transaksi', icon: 'receipt' },
  { to: '/misi', label: 'Misi Belajar', icon: 'timer' }
];

const logout = () => {
  endSession();
  router.replace('/masuk');
};

onMounted(() => auth.restoreSession());
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <PadlockMark :size="30" />
      <span class="brand-name">{{ APP_TITLE }}</span>
      <button type="button" class="btn btn-quiet btn-small" aria-label="Keluar" @click="logout"><AppIcon name="logout" /></button>
    </header>

    <aside class="rail">
      <div class="rail-brand">
        <PadlockMark :size="38" />
        <p>{{ APP_TITLE }}</p>
      </div>

      <nav class="nav" aria-label="Menu utama">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="nav-link" :exact-active-class="item.exact ? 'active' : ''" :active-class="item.exact ? '' : 'active'">
          <AppIcon :name="item.icon" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="rail-user">
        <p class="user-name">{{ auth.user?.name }}</p>
        <p class="user-mail">{{ auth.user?.email }}</p>
        <button type="button" class="btn btn-small btn-block" @click="logout"><AppIcon name="logout" :size="16" /> Keluar</button>
      </div>
    </aside>

    <main class="content"><RouterView /></main>

    <nav class="tabbar" aria-label="Menu utama">
      <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="tab-link" :exact-active-class="item.exact ? 'active' : ''" :active-class="item.exact ? '' : 'active'">
        <AppIcon :name="item.icon" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
.shell { min-height: 100vh; padding-bottom: 4.5rem; }
.topbar { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 1rem; background: var(--surface); border-bottom: 1.5px solid var(--ink); }
.brand-name { flex: 1; font-family: var(--font-display); font-weight: 800; }
.rail { display: none; }
.content { padding: 1.25rem 1rem 2rem; max-width: var(--content-max); margin: 0 auto; }
.tabbar { position: fixed; inset: auto 0 0 0; z-index: 20; display: grid; grid-template-columns: repeat(3, 1fr); background: var(--surface); border-top: 1.5px solid var(--ink); }
.tab-link { display: grid; justify-items: center; gap: 0.1rem; padding: 0.55rem 0.25rem; font-size: 0.75rem; font-weight: 600; color: var(--ink-soft); text-decoration: none; }
.tab-link.active { color: var(--cobalt); box-shadow: inset 0 3px 0 var(--cobalt); }

@media (min-width: 56rem) {
  .shell { padding: 0 0 0 var(--sidebar-width); }
  .topbar, .tabbar { display: none; }
  .rail { position: fixed; inset: 0 auto 0 0; width: var(--sidebar-width); display: flex; flex-direction: column; gap: 1.5rem; padding: 1.25rem 1rem; background: var(--surface); border-right: 1.5px solid var(--ink); }
  .rail-brand { display: flex; align-items: center; gap: 0.6rem; }
  .rail-brand p { font-family: var(--font-display); font-weight: 800; font-size: 1.05rem; line-height: 1.15; }
  .nav { display: grid; gap: 0.25rem; }
  .nav-link { display: flex; align-items: center; gap: 0.7rem; padding: 0.65rem 0.8rem; border: 1.5px solid transparent; border-radius: var(--radius-s); font-weight: 600; color: var(--ink-soft); text-decoration: none; }
  .nav-link:hover { background: var(--surface-sunken); color: var(--ink); }
  .nav-link.active { background: var(--cobalt-wash); border-color: var(--ink); color: var(--cobalt-deep); }
  .rail-user { margin-top: auto; display: grid; gap: 0.25rem; }
  .user-name { font-weight: 700; }
  .user-mail { font-size: 0.8rem; color: var(--ink-soft); word-break: break-all; margin-bottom: 0.5rem; }
  .content { padding: 2rem 2rem 3rem; }
}
</style>
