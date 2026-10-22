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
      <h1>Masuk</h1>
      <p class="lead">Lanjutkan mencatat keuangan dan menuntaskan misi belajarmu.</p>

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
.card { width: min(26rem, 100%); background: var(--surface); border: 1.5px solid var(--ink); border-radius: var(--radius-m); padding: 2rem; box-shadow: 6px 6px 0 var(--ink); }
h1 { font-size: 1.9rem; margin-bottom: 0.35rem; }
.lead { color: var(--ink-soft); margin-bottom: 1.5rem; }
.form-error { background: var(--rose-wash); color: var(--rose); border-left: 5px solid var(--rose); padding: 0.6rem 0.8rem; margin-bottom: 1rem; font-weight: 500; }
.switch { margin-top: 1.25rem; text-align: center; color: var(--ink-soft); }
</style>
