<script setup>
import { computed, ref } from 'vue';
import { ApiError } from '@/core/http/api-error.js';
import { formatClock } from '@/core/format/formatters.js';
import { MISSION_TYPES } from '@/shared/domain/mission-types.js';
import AppIcon from '@/shared/components/AppIcon.vue';
import { useToast } from '@/shared/composables/useToast.js';
import { useCountdown } from '../application/useCountdown.js';
import { useMissionsStore } from '../application/missions.store.js';
import { RATINGS, calculateAverageScore, isPassing } from '../domain/mission.model.js';

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

const currentCard = computed(() => deck.value?.cards[cardIndex.value] ?? null);
const finishedCards = computed(() => deck.value !== null && cardIndex.value >= deck.value.cards.length);
const score = computed(() => calculateAverageScore(ratings.value));
const passing = computed(() => isPassing(score.value, store.settings.passingScore));
const canClaim = computed(() => finishedCards.value && countdown.remaining.value === 0);

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
  <div class="recall">
    <template v-if="!session">
      <fieldset class="decks">
        <legend class="label">Pilih materi kartu</legend>
        <label v-for="item in store.decks" :key="item.id" class="deck" :class="{ on: selectedDeckId === item.id }">
          <input v-model="selectedDeckId" type="radio" name="deck" :value="item.id" />
          <span>
            <strong>{{ item.title }}</strong>
            <small>{{ item.description }} · {{ item.cards.length }} kartu</small>
          </span>
        </label>
      </fieldset>

      <p class="rule">Lulus jika skor rata-rata minimal <strong class="num">{{ store.settings.passingScore }}</strong>. Sesi juga butuh waktu baca minimal {{ store.settings.secondsPerCard }} detik per kartu.</p>

      <button type="button" class="btn btn-primary" :disabled="busy || selectedDeckId === null" @click="start">
        <AppIcon name="layers" :size="18" /> Mulai sesi kartu
      </button>
    </template>

    <template v-else-if="!finishedCards">
      <p class="progress num">Kartu {{ cardIndex + 1 }} dari {{ deck.cards.length }}</p>
      <article class="card" aria-live="polite">
        <p class="card-label">Pertanyaan</p>
        <h3>{{ currentCard.question }}</h3>

        <template v-if="revealed">
          <p class="card-label">Jawaban</p>
          <p class="answer">{{ currentCard.answer }}</p>
          <p v-if="currentCard.explanation" class="explain">{{ currentCard.explanation }}</p>
        </template>
      </article>

      <button v-if="!revealed" type="button" class="btn btn-primary" @click="revealed = true">Tampilkan jawaban</button>
      <div v-else class="ratings" role="group" aria-label="Seberapa ingat kamu?">
        <button v-for="rating in RATINGS" :key="rating.value" type="button" class="rating" @click="rate(rating.value)">
          <strong>{{ rating.label }}</strong>
          <small>{{ rating.hint }}</small>
        </button>
      </div>
      <button type="button" class="btn btn-quiet btn-small" @click="abandon">Batalkan sesi</button>
    </template>

    <template v-else>
      <div class="result" :class="{ pass: passing }">
        <p class="card-label">Skor akhirmu</p>
        <p class="score num">{{ score }}</p>
        <p v-if="passing">Di atas batas lulus {{ store.settings.passingScore }}.</p>
        <p v-else>Di bawah batas lulus {{ store.settings.passingScore }}. Kamu tetap bisa mengirim hasil, tetapi keinginan belum terbuka.</p>
      </div>
      <p v-if="!canClaim" class="rule">Tinjau jawabanmu. Hasil dapat dikirim dalam <strong class="num">{{ formatClock(countdown.remaining.value) }}</strong>.</p>
      <div class="actions">
        <button type="button" class="btn btn-brass" :disabled="!canClaim || busy" @click="claim">
          <AppIcon name="check" :size="18" /> Kirim hasil
        </button>
        <button type="button" class="btn" :disabled="busy" @click="abandon">Ulangi dari awal</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.recall { display: grid; gap: 1rem; justify-items: start; }
.decks { border: 0; margin: 0; padding: 0; display: grid; gap: 0.5rem; width: 100%; }
.deck { display: flex; gap: 0.6rem; padding: 0.7rem 0.85rem; border: 1.5px solid var(--line); border-radius: var(--radius-s); cursor: pointer; }
.deck.on { border-color: var(--cobalt); background: var(--cobalt-wash); }
.deck span { display: grid; }
.deck small { color: var(--ink-soft); }
.rule { color: var(--ink-soft); font-size: 0.92rem; }
.progress { font-weight: 600; color: var(--ink-soft); }
.card { width: 100%; padding: 1.25rem; border: 1.5px solid var(--ink); border-radius: var(--radius-m); background: var(--surface-sunken); display: grid; gap: 0.5rem; }
.card h3 { font-size: 1.3rem; }
.card-label { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-faint); }
.answer { font-weight: 600; }
.explain { color: var(--ink-soft); font-size: 0.92rem; }
.ratings { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; width: 100%; }
.rating { display: grid; gap: 0.1rem; padding: 0.7rem 0.4rem; border: 1.5px solid var(--ink); border-radius: var(--radius-s); background: var(--surface); text-align: center; }
.rating:hover { background: var(--cobalt-wash); }
.rating small { color: var(--ink-soft); font-size: 0.75rem; }
.result { width: 100%; padding: 1.25rem; text-align: center; border: 1.5px solid var(--rose); border-radius: var(--radius-m); background: var(--rose-wash); }
.result.pass { border-color: var(--moss); background: var(--moss-wash); }
.score { font-family: var(--font-display); font-weight: 800; font-size: 3.5rem; line-height: 1; margin: 0.25rem 0; }
.actions { display: flex; flex-wrap: wrap; gap: 0.6rem; }
</style>
