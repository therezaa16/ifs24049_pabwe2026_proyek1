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
          class="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all"
          :disabled="busy"
          @click="emit('close')"
        >
          {{ cancelText }}
        </button>
        <button
          type="button"
          class="px-4 py-2 text-sm font-semibold text-white rounded-2xl shadow-lg transition-all flex items-center gap-1.5"
          :class="{
            'bg-gradient-to-r from-rose-500 to-red-600 shadow-rose-500/20 hover:shadow-rose-500/30': tone === 'danger',
            'bg-gradient-to-r from-amber-400 to-orange-500 text-amber-950 shadow-amber-500/20 hover:shadow-amber-500/30': tone === 'warning',
            'bg-gradient-to-r from-indigo-500 to-violet-600 shadow-indigo-500/20 hover:shadow-indigo-500/30': tone === 'primary'
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
