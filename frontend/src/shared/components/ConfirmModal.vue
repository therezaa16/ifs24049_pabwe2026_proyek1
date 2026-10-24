<script setup>
import BaseModal from './BaseModal.vue';

defineProps({
  title: { type: String, default: 'Konfirmasi' },
  message: { type: String, required: true },
  confirmText: { type: String, default: 'Lanjutkan' },
  cancelText: { type: String, default: 'Batal' },
  tone: { type: String, default: 'danger' }, // 'danger' | 'warning' | 'primary'
  busy: { type: Boolean, default: false }
});

const emit = defineEmits(['confirm', 'close']);
</script>

<template>
  <BaseModal :title="title" @close="emit('close')">
    <div class="space-y-4">
      <p class="text-sm text-slate-700 leading-relaxed">{{ message }}</p>

      <div class="flex justify-end gap-2.5 pt-2">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          :disabled="busy"
          @click="emit('close')"
        >
          {{ cancelText }}
        </button>
        <button
          type="button"
          class="px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          :class="{
            'bg-rose-600 hover:bg-rose-700 active:scale-95': tone === 'danger',
            'bg-amber-600 hover:bg-amber-700 active:scale-95': tone === 'warning',
            'bg-brand-600 hover:bg-brand-700 active:scale-95': tone === 'primary'
          }"
          :disabled="busy"
          @click="emit('confirm')"
        >
          <span v-if="busy" class="inline-block animate-spin">⏳</span>
          <span>{{ confirmText }}</span>
        </button>
      </div>
    </div>
  </BaseModal>
</template>
