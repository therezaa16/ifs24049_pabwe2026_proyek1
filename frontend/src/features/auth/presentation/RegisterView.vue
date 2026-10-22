<script setup>
import { reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { fieldErrorsOf } from '@/core/http/api-error.js';
import { validateRegisterForm } from '../domain/auth.validators.js';
import { useAuthStore } from '../application/auth.store.js';
import AuthLayout from './AuthLayout.vue';

const auth = useAuthStore();
const router = useRouter();

const form = reactive({ name: '', email: '', password: '', confirmPassword: '', monthlyBudget: '' });
const errors = ref({});
const formError = ref('');
const submitting = ref(false);

const FIELD_MAP = { monthly_budget: 'monthlyBudget' };

const mapServerErrors = (serverErrors) =>
  Object.fromEntries(Object.entries(serverErrors).map(([key, message]) => [FIELD_MAP[key] || key, message]));

const submit = async () => {
  formError.value = '';
  errors.value = validateRegisterForm(form);
  if (Object.keys(errors.value).length > 0) return;

  submitting.value = true;
  try {
    await auth.register(form);
    router.replace('/');
  } catch (error) {
    formError.value = error.message;
    errors.value = mapServerErrors(fieldErrorsOf(error));
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <AuthLayout>
    <form class="card" novalidate @submit.prevent="submit">
      <h1>Buat akun</h1>
      <p class="lead">Mulai melatih disiplin finansial dan belajar dari sekarang.</p>

      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>

      <div class="field">
        <label for="name">Nama lengkap</label>
        <input id="name" v-model="form.name" class="input" autocomplete="name" :aria-invalid="Boolean(errors.name)" />
        <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
      </div>

      <div class="field">
        <label for="email">Email</label>
        <input id="email" v-model="form.email" class="input" type="email" autocomplete="email" :aria-invalid="Boolean(errors.email)" />
        <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
      </div>

      <div class="pair">
        <div class="field">
          <label for="password">Password</label>
          <input id="password" v-model="form.password" class="input" type="password" autocomplete="new-password" :aria-invalid="Boolean(errors.password)" />
          <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
        </div>
        <div class="field">
          <label for="confirm">Ulangi password</label>
          <input id="confirm" v-model="form.confirmPassword" class="input" type="password" autocomplete="new-password" :aria-invalid="Boolean(errors.confirmPassword)" />
          <span v-if="errors.confirmPassword" class="field-error">{{ errors.confirmPassword }}</span>
        </div>
      </div>

      <div class="field">
        <label for="budget">Anggaran bulanan (opsional)</label>
        <input id="budget" v-model="form.monthlyBudget" class="input num" type="number" min="0" step="1000" inputmode="numeric" placeholder="1500000" :aria-invalid="Boolean(errors.monthlyBudget)" />
        <span v-if="errors.monthlyBudget" class="field-error">{{ errors.monthlyBudget }}</span>
        <span v-else class="field-hint">Dipakai untuk menghitung sisa anggaran di dashboard.</span>
      </div>

      <button type="submit" class="btn btn-primary btn-block" :disabled="submitting">
        {{ submitting ? 'Memproses…' : 'Daftar' }}
      </button>

      <p class="switch">Sudah punya akun? <RouterLink to="/masuk">Masuk</RouterLink></p>
    </form>
  </AuthLayout>
</template>

<style scoped>
.card { width: min(30rem, 100%); background: var(--surface); border: 1.5px solid var(--ink); border-radius: var(--radius-m); padding: 2rem; box-shadow: 6px 6px 0 var(--ink); }
h1 { font-size: 1.9rem; margin-bottom: 0.35rem; }
.lead { color: var(--ink-soft); margin-bottom: 1.5rem; }
.form-error { background: var(--rose-wash); color: var(--rose); border-left: 5px solid var(--rose); padding: 0.6rem 0.8rem; margin-bottom: 1rem; font-weight: 500; }
.pair { display: grid; gap: 0 1rem; }
.switch { margin-top: 1.25rem; text-align: center; color: var(--ink-soft); }
@media (min-width: 34rem) { .pair { grid-template-columns: 1fr 1fr; } }
</style>
