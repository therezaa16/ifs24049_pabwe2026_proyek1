<script setup>
import BaseModal from '@/shared/components/BaseModal.vue';

const props = defineProps({
  deck: { type: Object, required: true }
});

const emit = defineEmits(['close', 'start']);
</script>

<template>
  <BaseModal :title="`Materi: ${deck.title}`" wide @close="emit('close')">
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <span class="px-2.5 py-1 text-xs font-bold rounded-lg bg-brand-50 text-brand-700 border border-brand-200">
          {{ deck.subject }}
        </span>
        <span class="text-xs text-slate-500 font-medium">
          {{ deck.cards.length }} kartu Active Recall
        </span>
      </div>

      <!-- Full Study Notes / Materi -->
      <div v-if="deck.content" class="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm leading-relaxed text-slate-800 whitespace-pre-line max-h-72 overflow-y-auto">
        {{ deck.content }}
      </div>
      <div v-else class="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-600 italic">
        {{ deck.description || 'Materi pembelajaran terstruktur untuk pengujian active recall.' }}
      </div>

      <!-- Preview of Cards -->
      <div>
        <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Daftar Pertanyaan Kartu:</h4>
        <div class="space-y-2 max-h-60 overflow-y-auto">
          <div
            v-for="(card, idx) in deck.cards"
            :key="card.id || idx"
            class="p-2.5 rounded-lg border border-slate-200 bg-white text-xs"
          >
            <p class="font-semibold text-slate-800">Q{{ idx + 1 }}: {{ card.question }}</p>
            <p class="text-slate-600 mt-1"><span class="font-semibold text-brand-600">Jawaban:</span> {{ card.answer }}</p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          @click="emit('close')"
        >
          Tutup
        </button>
        <button
          type="button"
          class="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-all"
          @click="emit('start', deck); emit('close')"
        >
          Mulai Uji Ingatan (Active Recall)
        </button>
      </div>
    </div>
  </BaseModal>
</template>
