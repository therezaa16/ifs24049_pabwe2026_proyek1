<script setup>
import { reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { fieldErrorsOf } from '@/core/http/api-error.js';
import { validateLoginForm, resolveRedirect } from '../domain/auth.validators.js';
import { useAuthStore } from '../application/auth.store.js';
import AuthLayout from './AuthLayout.vue';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const form = reactive({ email: '', password: '' });
const errors = ref({});
const formError = ref('');
const submitting = ref(false);

const submit = async () => {
  formError.value = '';
  errors.value = validateLoginForm(form);
  if (Object.keys(errors.value).length > 0) return;

  submitting.value = true;
  try {
    await auth.login(form);
    router.replace(resolveRedirect(route.query.redirect));
  } catch (error) {
    formError.value = error.message;
    errors.value = fieldErrorsOf(error);
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <AuthLayout>
    <form class="card" novalidate @submit.prevent="submit">
      <div class="card-head">
        <p class="card-kicker">Selamat datang kembali</p>
        <h1>Masuk</h1>
        <p class="lead">Lanjutkan mencatat keuangan dan menuntaskan misi belajarmu.</p>
      </div>

      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>

      <div class="field">
        <label for="email">Email</label>
        <input id="email" v-model="form.email" class="input" type="email" autocomplete="email" :aria-invalid="Boolean(errors.email)" />
        <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
      </div>

      <div class="field">
        <label for="password">Password</label>
        <input id="password" v-model="form.password" class="input" type="password" autocomplete="current-password" :aria-invalid="Boolean(errors.password)" />
        <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
      </div>

      <button type="submit" class="btn btn-primary btn-block" :disabled="submitting">
        {{ submitting ? 'Memproses…' : 'Masuk' }}
      </button>

      <p class="switch">Belum punya akun? <RouterLink to="/daftar">Daftar sekarang</RouterLink></p>
    </form>
  </AuthLayout>
</template>

<style scoped>
.card { width: min(28rem, 100%); background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, #fff 100%); border: 1px solid var(--line); border-radius: var(--radius-l); padding: clamp(1.8rem, 4vw, 2.6rem); box-shadow: var(--shadow-elevated); display: grid; gap: 1rem; }
.card-head { display: grid; gap: 0.4rem; }
.card-kicker { text-transform: uppercase; letter-spacing: 0.3em; font-size: 0.7rem; color: var(--cobalt); font-weight: 700; }
h1 { font-size: clamp(2rem, 4vw, 2.8rem); }
.lead { color: var(--ink-soft); }
.form-error { background: var(--rose-wash); color: var(--rose); border: 1px solid rgba(220, 38, 38, 0.2); border-radius: var(--radius-m); padding: 0.7rem 0.9rem; font-weight: 500; }
.switch { margin-top: 0.5rem; text-align: center; color: var(--ink-soft); }
</style>
