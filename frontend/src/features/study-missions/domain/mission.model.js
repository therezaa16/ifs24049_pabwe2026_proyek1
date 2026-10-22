export const POMODORO_PRESETS = Object.freeze([15, 25, 45]);

export const RATINGS = Object.freeze([
  { value: 100, label: 'Ingat', hint: 'Bisa menjawab tanpa melihat' },
  { value: 60, label: 'Ragu', hint: 'Ingat sebagian' },
  { value: 20, label: 'Lupa', hint: 'Perlu diulang' }
]);

export const MISSION_STATUS_LABELS = Object.freeze({ selesai: 'Selesai', gagal: 'Gagal' });

export const isPresetAllowed = (minutes, { hasWish, minToUnlock }) => !hasWish || minutes >= minToUnlock;

export const calculateAverageScore = (ratings) =>
  ratings.length === 0 ? 0 : Math.round(ratings.reduce((sum, value) => sum + value, 0) / ratings.length);

export const isPassing = (score, passingScore) => score >= passingScore;

export const wishesForMission = (wishes, missionType) => wishes.filter((wish) => wish.mission_type === missionType);

/** Lama sesi sesungguhnya (detik) setelah dikalikan time scale server; dipakai untuk label sebelum mulai. */
export const scaledSeconds = (minutes, timeScale) => Math.max(1, Math.ceil(minutes * 60 * timeScale));
