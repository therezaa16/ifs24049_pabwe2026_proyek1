<script setup>
import { computed, ref } from 'vue';
import { ApiError } from '@/core/http/api-error.js';
import { formatClock } from '@/core/format/formatters.js';
import { MISSION_TYPES } from '@/shared/domain/mission-types.js';
import AppIcon from '@/shared/components/AppIcon.vue';
import ConfirmModal from '@/shared/components/ConfirmModal.vue';
import { useToast } from '@/shared/composables/useToast.js';
import { useCountdown } from '../application/useCountdown.js';
import { useMissionsStore } from '../application/missions.store.js';
import { RATINGS, calculateAverageScore, isPassing } from '../domain/mission.model.js';
import AiMaterialModal from './AiMaterialModal.vue';
import StudyMaterialModal from './StudyMaterialModal.vue';

const props = defineProps({ wish: { type: Object, default: null } });
const emit = defineEmits(['completed']);

const store = useMissionsStore();
const toast = useToast();
const countdown = useCountdown();

const selectedDeckId = ref(store.decks[0]?.id ?? null);
const session = ref(null);
const deck = ref(null);
const cardIndex = ref(0);
const revealed = ref(false);
const ratings = ref([]);
const busy = ref(false);

const showAiModal = ref(false);
const viewingMaterialDeck = ref(null);
const pendingDeleteDeck = ref(null);

const currentCard = computed(() => deck.value?.cards[cardIndex.value] ?? null);
const finishedCards = computed(() => deck.value !== null && cardIndex.value >= deck.value.cards.length);
const score = computed(() => calculateAverageScore(ratings.value));
const passing = computed(() => isPassing(score.value, store.settings.passingScore));
const canClaim = computed(() => finishedCards.value && countdown.remaining.value === 0);

const onDeckCreated = (newDeck) => {
  if (newDeck) {
    selectedDeckId.value = newDeck.id;
  }
};

const openDeckMaterial = (d) => {
  viewingMaterialDeck.value = d;
};

const promptDeleteDeck = (d) => {
  pendingDeleteDeck.value = d;
};

const confirmDeleteDeck = async () => {
  const target = pendingDeleteDeck.value;
  pendingDeleteDeck.value = null;
  if (!target) return;
  try {
    await store.removeDeck(target.id);
    toast.success('Materi kuis berhasil dihapus');
    if (selectedDeckId.value === target.id) {
      selectedDeckId.value = store.decks[0]?.id ?? null;
    }
  } catch (err) {
    toast.error(err.message);
  }
};

const startWithDeck = (targetDeck) => {
  selectedDeckId.value = targetDeck.id;
  start();
};

const start = async () => {
  busy.value = true;
  try {
    session.value = await store.startSession({
      missionType: MISSION_TYPES.ACTIVE_RECALL,
      deckId: selectedDeckId.value,
      transactionId: props.wish?.id
    });
    deck.value = store.decks.find((item) => item.id === selectedDeckId.value);
    cardIndex.value = 0;
    revealed.value = false;
    ratings.value = [];
    countdown.start(session.value.required_seconds);
  } catch (error) {
    toast.error(error.message);
  } finally {
    busy.value = false;
  }
};

const rate = (value) => {
  ratings.value.push(value);
  cardIndex.value += 1;
  revealed.value = false;
};

const abandon = () => {
  countdown.stop();
  session.value = null;
  deck.value = null;
};

const claim = async () => {
  busy.value = true;
  try {
    const result = await store.completeSession(session.value.id, score.value);
    abandon();
    emit('completed', result);
  } catch (error) {
    const remainingSeconds = error instanceof ApiError ? error.errors?.remaining_seconds : null;
    if (remainingSeconds) countdown.start(remainingSeconds + 1);
    toast.error(error.message);
  } finally {
    busy.value = false;
  }
};
</script>

<template>
  <div class="recall w-full space-y-4">
    <!-- State 1: Choose Deck or Generate with AI -->
    <template v-if="!session">
      <!-- AI Generator Callout Card -->
      <div class="flex items-center justify-between p-3.5 bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-200 rounded-2xl shadow-xs">
        <div class="flex items-center gap-2.5">
          <span class="text-2xl">✨</span>
          <div>
            <p class="text-xs font-bold text-brand-900">Punya materi kuliah baru?</p>
            <p class="text-[11px] text-brand-700">Gunakan AI untuk membuat flashcards Active Recall otomatis dari catatanmu.</p>
          </div>
        </div>
        <button
          type="button"
          class="px-3 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
          @click="showAiModal = true"
        >
          <span>✨ Buat Kuis AI</span>
        </button>
      </div>

      <!-- Decks Selection Fieldset -->
      <fieldset class="decks w-full border-0 m-0 p-0 space-y-2">
        <legend class="label block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Pilih materi kartu</legend>
        <div
          v-for="item in store.decks"
          :key="item.id"
          class="deck flex items-start justify-between p-3.5 rounded-xl border transition-all cursor-pointer bg-white"
          :class="selectedDeckId === item.id ? 'on border-brand-600 bg-brand-50/50 shadow-xs' : 'border-slate-200 hover:border-slate-300'"
          @click="selectedDeckId = item.id"
        >
          <label class="flex items-start gap-3 cursor-pointer flex-1">
            <input v-model="selectedDeckId" type="radio" name="deck" :value="item.id" class="mt-1 accent-brand-600" />
            <span>
              <strong class="text-sm font-bold text-slate-900 block">{{ item.title }}</strong>
              <small class="text-xs text-slate-500 block mt-0.5">
                <span class="font-semibold text-brand-700">{{ item.subject }}</span> · {{ item.cards?.length || 0 }} kartu
                <template v-if="item.description"> · {{ item.description }}</template>
              </small>
            </span>
          </label>

          <div class="flex items-center gap-1.5 shrink-0 ml-2" @click.stop>
            <button
              v-if="item.content"
              type="button"
              class="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
              title="Baca Catatan Pembelajaran Lengkap"
              @click="openDeckMaterial(item)"
            >
              📖 Baca Materi
            </button>
            <button
              v-if="item.user_id"
              type="button"
              class="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
              title="Hapus Materi Ini"
              @click="promptDeleteDeck(item)"
            >
              <AppIcon name="trash" :size="15" />
            </button>
          </div>
        </div>
      </fieldset>

      <p class="rule text-xs text-slate-500 leading-relaxed">
        Lulus jika skor rata-rata minimal <strong class="num font-bold text-slate-800">{{ store.settings.passingScore }}</strong>. Sesi juga butuh waktu baca minimal {{ store.settings.secondsPerCard }} detik per kartu.
      </p>

      <button
        type="button"
        class="btn btn-primary px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm flex items-center gap-2 hover:shadow-md transition-all"
        :disabled="busy || selectedDeckId === null"
        @click="start"
      >
        <AppIcon name="layers" :size="18" /> Mulai sesi kartu
      </button>
    </template>

    <!-- State 2: Taking Quiz / Reviewing Flashcard -->
    <template v-else-if="!finishedCards">
      <div class="w-full flex items-center justify-between text-xs font-semibold text-slate-500">
        <p class="progress num">Kartu {{ cardIndex + 1 }} dari {{ deck.cards.length }}</p>
        <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">{{ deck.subject }}</span>
      </div>

      <!-- Flashcard with clean border, elevation, and typography -->
      <article class="card w-full p-6 rounded-2xl border-2 border-slate-800 bg-white shadow-neo space-y-4" aria-live="polite">
        <div>
          <span class="card-label inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-600 mb-1.5">Pertanyaan</span>
          <h3 class="text-base md:text-lg font-bold text-slate-900 leading-snug">{{ currentCard.question }}</h3>
        </div>

        <div v-if="revealed" class="pt-3 border-t border-slate-100 space-y-2 animate-fade-in">
          <span class="card-label inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-brand-50 text-brand-700">Jawaban</span>
          <p class="answer text-sm font-semibold text-slate-800 leading-relaxed">{{ currentCard.answer }}</p>
          <p v-if="currentCard.explanation" class="explain text-xs text-slate-500 leading-relaxed italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            💡 {{ currentCard.explanation }}
          </p>
        </div>
      </article>

      <div class="w-full space-y-3">
        <button
          v-if="!revealed"
          type="button"
          class="btn btn-primary w-full py-3 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all"
          @click="revealed = true"
        >
          Tampilkan jawaban
        </button>

        <div v-else class="ratings grid grid-cols-3 gap-2 w-full" role="group" aria-label="Seberapa ingat kamu?">
          <button
            v-for="rating in RATINGS"
            :key="rating.value"
            type="button"
            class="rating p-2.5 rounded-xl border-2 border-slate-800 bg-white hover:bg-slate-50 text-center transition-all active:scale-95 shadow-xs"
            @click="rate(rating.value)"
          >
            <strong class="block text-xs font-bold text-slate-900">{{ rating.label }}</strong>
            <small class="block text-[10px] text-slate-500 mt-0.5">{{ rating.hint }}</small>
          </button>
        </div>

        <div class="flex justify-between items-center pt-2">
          <button
            type="button"
            class="btn btn-quiet btn-small text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors"
            @click="abandon"
          >
            Batalkan sesi
          </button>
        </div>
      </div>
    </template>

    <!-- State 3: Quiz Finished / Results -->
    <template v-else>
      <div
        class="result w-full p-6 rounded-2xl border-2 text-center space-y-2 shadow-xs"
        :class="passing ? 'pass border-emerald-500 bg-emerald-50/70 text-emerald-950' : 'border-rose-300 bg-rose-50/70 text-rose-950'"
      >
        <span class="card-label inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider" :class="passing ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'">
          {{ passing ? '🎉 Selamat! Lulus' : '⚠️ Belum Lulus' }}
        </span>
        <p class="score num font-display font-extrabold text-5xl md:text-6xl my-1">{{ score }}</p>
        <p v-if="passing" class="text-sm font-medium text-emerald-800">
          Skormu di atas batas lulus {{ store.settings.passingScore }}. Keinginanmu siap dibuka!
        </p>
        <p v-else class="text-sm font-medium text-rose-800">
          Di bawah batas lulus {{ store.settings.passingScore }}. Kamu tetap bisa mengirim hasil, tetapi keinginan belum terbuka.
        </p>
      </div>

      <p v-if="!canClaim" class="rule text-xs text-slate-500 text-center">
        Tinjau jawabanmu. Hasil dapat dikirim dalam <strong class="num font-bold text-slate-800">{{ formatClock(countdown.remaining.value) }}</strong>.
      </p>

      <div class="actions flex flex-wrap gap-2.5 w-full justify-center pt-2">
        <button
          type="button"
          class="btn btn-brass px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm flex items-center gap-2 hover:shadow-md transition-all"
          :disabled="!canClaim || busy"
          @click="claim"
        >
          <AppIcon name="check" :size="18" /> Kirim hasil
        </button>
        <button
          type="button"
          class="btn px-4 py-2.5 rounded-xl font-semibold text-sm border border-slate-300 hover:bg-slate-50 transition-all"
          :disabled="busy"
          @click="abandon"
        >
          Ulangi dari awal
        </button>
      </div>
    </template>

    <!-- Modals -->
    <AiMaterialModal
      v-if="showAiModal"
      @close="showAiModal = false"
      @created="onDeckCreated"
    />

    <StudyMaterialModal
      v-if="viewingMaterialDeck"
      :deck="viewingMaterialDeck"
      @close="viewingMaterialDeck = null"
      @start="startWithDeck"
    />

    <ConfirmModal
      v-if="pendingDeleteDeck"
      title="Hapus Materi Kuis?"
      :message="`Hapus materi “${pendingDeleteDeck.title}”? Kartu pertanyaan kuis yang dibuat dari materi ini juga akan dihapus.`"
      confirm-text="Hapus"
      cancel-text="Batal"
      tone="danger"
      @confirm="confirmDeleteDeck"
      @close="pendingDeleteDeck = null"
    />
  </div>
</template>

<style scoped>
.recall { display: grid; gap: 1rem; justify-items: start; }
.decks { border: 0; margin: 0; padding: 0; display: grid; gap: 0.5rem; width: 100%; }
.deck.on { border-color: var(--cobalt); background: var(--cobalt-wash); }
.score { font-family: var(--font-display); }
.result.pass { border-color: var(--moss); background: var(--moss-wash); }
</style>
