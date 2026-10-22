<script setup>
import { computed, reactive, ref } from 'vue';
import { fieldErrorsOf } from '@/core/http/api-error.js';
import { MISSION_LABELS, MISSION_TYPES } from '@/shared/domain/mission-types.js';
import BaseModal from '@/shared/components/BaseModal.vue';
import AppIcon from '@/shared/components/AppIcon.vue';
import { CATEGORIES, TRANSACTION_TYPES, TYPE_LABELS } from '../domain/transaction.model.js';
import { validateTransactionForm } from '../domain/transaction.validators.js';
import { useTransactionsStore } from '../application/transactions.store.js';
import { useToast } from '@/shared/composables/useToast.js';

const emit = defineEmits(['close']);
const store = useTransactionsStore();
const toast = useToast();

const form = reactive({
  type: TRANSACTION_TYPES.NEED,
  title: '',
  amount: '',
  category: CATEGORIES[0],
  note: '',
  missionType: MISSION_TYPES.POMODORO
});
const errors = ref({});
const submitting = ref(false);

const isWant = computed(() => form.type === TRANSACTION_TYPES.WANT);
const typeOptions = Object.values(TRANSACTION_TYPES);

const submit = async () => {
  errors.value = validateTransactionForm(form);
  if (Object.keys(errors.value).length > 0) return;

  submitting.value = true;
  try {
    const data = await store.create(form);
    data.isLocked ? toast.info(data.message) : toast.success(data.message);
    emit('close');
  } catch (error) {
    errors.value = fieldErrorsOf(error);
    toast.error(error.message);
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <BaseModal title="Catat transaksi" @close="emit('close')">
    <form novalidate @submit.prevent="submit">
      <fieldset class="segment" aria-label="Jenis transaksi">
        <label v-for="type in typeOptions" :key="type" class="segment-option" :class="{ on: form.type === type }">
          <input v-model="form.type" type="radio" name="type" :value="type" class="sr-only" />
          {{ TYPE_LABELS[type] }}
        </label>
      </fieldset>

      <div v-if="isWant" class="lock-note" role="note">
        <AppIcon name="lock" :size="18" />
        <p><strong>Keinginan tidak langsung berlaku.</strong> Ia disimpan terkunci sampai kamu menyelesaikan misi belajar.</p>
      </div>

      <div class="field">
        <label for="tx-title">Judul</label>
        <input id="tx-title" v-model="form.title" class="input" placeholder="Contoh: Makan siang kantin" :aria-invalid="Boolean(errors.title)" />
        <span v-if="errors.title" class="field-error">{{ errors.title }}</span>
      </div>

      <div class="pair">
        <div class="field">
          <label for="tx-amount">Nominal (Rp)</label>
          <input id="tx-amount" v-model="form.amount" class="input num" type="number" min="0" step="500" inputmode="numeric" :aria-invalid="Boolean(errors.amount)" />
          <span v-if="errors.amount" class="field-error">{{ errors.amount }}</span>
        </div>
        <div class="field">
          <label for="tx-category">Kategori</label>
          <select id="tx-category" v-model="form.category" class="input">
            <option v-for="category in CATEGORIES" :key="category" :value="category">{{ category }}</option>
          </select>
          <span v-if="errors.category" class="field-error">{{ errors.category }}</span>
        </div>
      </div>

      <fieldset v-if="isWant" class="field mission-pick">
        <legend class="label">Misi untuk membukanya</legend>
        <label v-for="type in Object.values(MISSION_TYPES)" :key="type" class="mission-option" :class="{ on: form.missionType === type }">
          <input v-model="form.missionType" type="radio" name="mission" :value="type" />
          <span>
            <strong>{{ MISSION_LABELS[type] }}</strong>
            <small>{{ type === MISSION_TYPES.POMODORO ? 'Fokus belajar minimal 25 menit' : 'Uji ingatan dengan kartu soal, skor minimal 70' }}</small>
          </span>
        </label>
      </fieldset>

      <div class="field">
        <label for="tx-note">Catatan (opsional)</label>
        <input id="tx-note" v-model="form.note" class="input" maxlength="255" />
      </div>

      <div class="foot">
        <button type="button" class="btn" @click="emit('close')">Batal</button>
        <button type="submit" class="btn btn-primary" :disabled="submitting">{{ submitting ? 'Menyimpan…' : 'Simpan' }}</button>
      </div>
    </form>
  </BaseModal>
</template>

<style scoped>
.segment { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; margin: 0 0 1rem; padding: 0; border: 1.5px solid var(--ink); border-radius: var(--radius-s); overflow: hidden; }
.segment-option { padding: 0.55rem 0.25rem; text-align: center; font-weight: 600; cursor: pointer; border-right: 1.5px solid var(--ink); }
.segment-option:last-child { border-right: 0; }
.segment-option.on { background: var(--ink); color: #fff; }
.segment-option:focus-within { outline: 3px solid var(--cobalt); outline-offset: -3px; }
.lock-note { display: flex; gap: 0.6rem; align-items: flex-start; padding: 0.7rem 0.85rem; margin-bottom: 1rem; background: var(--brass-wash); color: var(--brass-ink); border-left: 5px solid var(--brass); font-size: 0.9rem; }
.pair { display: grid; gap: 0 1rem; }
.mission-pick { border: 0; padding: 0; margin: 0 0 1rem; }
.mission-option { display: flex; gap: 0.6rem; align-items: flex-start; padding: 0.6rem 0.75rem; margin-top: 0.4rem; border: 1.5px solid var(--line); border-radius: var(--radius-s); cursor: pointer; }
.mission-option.on { border-color: var(--cobalt); background: var(--cobalt-wash); }
.mission-option span { display: grid; }
.mission-option small { color: var(--ink-soft); }
.foot { display: flex; justify-content: flex-end; gap: 0.6rem; margin-top: 0.5rem; }
@media (min-width: 34rem) { .pair { grid-template-columns: 1fr 1fr; } }
</style>
