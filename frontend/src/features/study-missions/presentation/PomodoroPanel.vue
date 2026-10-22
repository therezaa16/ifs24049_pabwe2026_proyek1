<script setup>
import { computed, ref } from 'vue';
import { ApiError } from '@/core/http/api-error.js';
import { formatClock } from '@/core/format/formatters.js';
import { MISSION_TYPES } from '@/shared/domain/mission-types.js';
import AppIcon from '@/shared/components/AppIcon.vue';
import { useToast } from '@/shared/composables/useToast.js';
import { useCountdown } from '../application/useCountdown.js';
import { useMissionsStore } from '../application/missions.store.js';
import { POMODORO_PRESETS, isPresetAllowed, scaledSeconds } from '../domain/mission.model.js';

const props = defineProps({
  wish: { type: Object, default: null },
  subjectSuggestion: { type: String, default: '' }
});
const emit = defineEmits(['completed']);

const store = useMissionsStore();
const toast = useToast();
const countdown = useCountdown();

const subject = ref(props.subjectSuggestion);
const durationMinutes = ref(25);
const session = ref(null);
const busy = ref(false);
const subjectError = ref('');

const phase = computed(() => {
  if (!session.value) return 'setup';
  return countdown.remaining.value > 0 ? 'running' : 'ready';
});

const presetState = (minutes) => isPresetAllowed(minutes, {
  hasWish: Boolean(props.wish),
  minToUnlock: store.settings.minPomodoroMinutesToUnlock
});

const isDemoSpeed = computed(() => store.settings.timeScale !== 1);
const progress = computed(() => {
  if (!session.value) return 0;
  return 1 - countdown.remaining.value / session.value.required_seconds;
});
const RING_LENGTH = 2 * Math.PI * 54;
const ringOffset = computed(() => RING_LENGTH * (1 - progress.value));

const start = async () => {
  subjectError.value = subject.value.trim().length < 2 ? 'Isi mata kuliah atau topik yang akan dipelajari' : '';
  if (subjectError.value) return;

  busy.value = true;
  try {
    session.value = await store.startSession({
      missionType: MISSION_TYPES.POMODORO,
      subject: subject.value.trim(),
      durationMinutes: durationMinutes.value,
      transactionId: props.wish?.id
    });
    countdown.start(session.value.required_seconds);
  } catch (error) {
    toast.error(error.message);
  } finally {
    busy.value = false;
  }
};

const abandon = () => {
  countdown.stop();
  session.value = null;
};

const claim = async () => {
  busy.value = true;
  try {
    const result = await store.completeSession(session.value.id);
    session.value = null;
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
  <div class="pomodoro">
    <template v-if="phase === 'setup'">
      <div class="field">
        <label for="subject">Mata kuliah / topik</label>
        <input id="subject" v-model="subject" class="input" placeholder="Contoh: Basis Data, normalisasi" :aria-invalid="Boolean(subjectError)" />
        <span v-if="subjectError" class="field-error">{{ subjectError }}</span>
      </div>

      <div class="field">
        <span class="label">Durasi fokus</span>
        <div class="presets" role="group" aria-label="Durasi fokus">
          <button
            v-for="minutes in POMODORO_PRESETS"
            :key="minutes"
            type="button"
            class="preset"
            :class="{ on: durationMinutes === minutes }"
            :disabled="!presetState(minutes)"
            :aria-pressed="durationMinutes === minutes"
            @click="durationMinutes = minutes"
          >
            <strong class="num">{{ minutes }}</strong> menit
          </button>
        </div>
        <span v-if="wish" class="field-hint">Membuka keinginan membutuhkan minimal {{ store.settings.minPomodoroMinutesToUnlock }} menit.</span>
        <span v-if="isDemoSpeed" class="field-hint">Mode demo: sesi dipercepat menjadi {{ formatClock(scaledSeconds(durationMinutes, store.settings.timeScale)) }}.</span>
      </div>

      <button type="button" class="btn btn-primary" :disabled="busy" @click="start">
        <AppIcon name="play" :size="18" /> Mulai fokus
      </button>
    </template>

    <div v-else class="session">
      <div class="ring-wrap">
        <svg viewBox="0 0 120 120" class="ring" role="img" :aria-label="`Sisa waktu ${formatClock(countdown.remaining.value)}`">
          <circle cx="60" cy="60" r="54" class="ring-track" />
          <circle cx="60" cy="60" r="54" class="ring-bar" :stroke-dasharray="RING_LENGTH" :stroke-dashoffset="ringOffset" />
        </svg>
        <p class="clock num">{{ phase === 'ready' ? '00:00' : formatClock(countdown.remaining.value) }}</p>
      </div>

      <p class="session-subject">{{ session.subject }}</p>
      <p v-if="phase === 'running'" class="session-hint">Tetap di halaman ini dan fokus. Server mencatat waktu mulaimu.</p>
      <p v-else class="session-hint ready">Waktu belajar selesai. Klaim hasilnya sekarang.</p>

      <div class="session-actions">
        <button v-if="phase === 'ready'" type="button" class="btn btn-brass" :disabled="busy" @click="claim">
          <AppIcon name="check" :size="18" /> {{ wish ? 'Selesai & buka keinginan' : 'Selesaikan misi' }}
        </button>
        <button type="button" class="btn" :disabled="busy" @click="abandon">Batalkan sesi</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.presets { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.preset { padding: 0.5rem 1rem; border: 1.5px solid var(--ink); border-radius: var(--radius-s); background: var(--surface); }
.preset strong { font-family: var(--font-display); font-size: 1.2rem; }
.preset.on { background: var(--cobalt); color: #fff; }
.preset:disabled { opacity: 0.4; cursor: not-allowed; text-decoration: line-through; }
.session { display: grid; justify-items: center; gap: 0.75rem; padding: 0.5rem 0; text-align: center; }
.ring-wrap { position: relative; width: min(15rem, 70vw); aspect-ratio: 1; }
.ring { width: 100%; height: 100%; transform: rotate(-90deg); }
.ring-track { fill: none; stroke: var(--line); stroke-width: 8; }
.ring-bar { fill: none; stroke: var(--cobalt); stroke-width: 8; stroke-linecap: round; transition: stroke-dashoffset 0.3s linear; }
.clock { position: absolute; inset: 0; display: grid; place-items: center; font-family: var(--font-display); font-weight: 800; font-size: clamp(2.2rem, 10vw, 3.2rem); }
.session-subject { font-family: var(--font-display); font-weight: 700; font-size: 1.2rem; }
.session-hint { color: var(--ink-soft); max-width: 24rem; }
.session-hint.ready { color: var(--moss); font-weight: 600; }
.session-actions { display: flex; flex-wrap: wrap; gap: 0.6rem; justify-content: center; }
</style>
