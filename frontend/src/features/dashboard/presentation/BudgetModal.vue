<script setup>
import { ref } from 'vue';
import BaseModal from '@/shared/components/BaseModal.vue';
import { useToast } from '@/shared/composables/useToast.js';
import { useAuthStore } from '@/features/auth/application/auth.store.js';

const props = defineProps({ current: { type: Number, default: 0 } });
const emit = defineEmits(['close', 'saved']);

const auth = useAuthStore();
const toast = useToast();

const value = ref(String(props.current));
const error = ref('');
const saving = ref(false);

const save = async () => {
  error.value = Number(value.value) >= 0 && value.value !== '' ? '' : 'Masukkan angka 0 atau lebih';
  if (error.value) return;

  saving.value = true;
  try {
    await auth.updateBudget(value.value);
    toast.success('Anggaran bulanan diperbarui');
    emit('saved');
    emit('close');
  } catch (failure) {
    error.value = failure.message;
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <BaseModal title="Atur anggaran bulanan" @close="emit('close')">
    <form novalidate @submit.prevent="save">
      <div class="field">
        <label for="budget-input">Anggaran per bulan (Rp)</label>
        <input id="budget-input" v-model="value" class="input num" type="number" min="0" step="10000" inputmode="numeric" :aria-invalid="Boolean(error)" />
        <span v-if="error" class="field-error">{{ error }}</span>
        <span v-else class="field-hint">Isi 0 untuk menonaktifkan perhitungan sisa anggaran.</span>
      </div>
      <div class="foot">
        <button type="button" class="btn" @click="emit('close')">Batal</button>
        <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? 'Menyimpan…' : 'Simpan' }}</button>
      </div>
    </form>
  </BaseModal>
</template>

<style scoped>
.foot { display: flex; justify-content: flex-end; gap: 0.6rem; }
</style>
