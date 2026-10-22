import { ValidationError } from '../../../core/errors/app-error.js';
import { MISSION_TYPES } from '../../../core/domain/mission-types.js';

export const MISSION_STATUSES = Object.freeze({
  RUNNING: 'berjalan',
  COMPLETED: 'selesai',
  FAILED: 'gagal'
});

export const MIN_POMODORO_MINUTES_TO_UNLOCK = 25;
export const PASSING_SCORE = 70;
export const SECONDS_PER_CARD = 15;
export const ELAPSED_TOLERANCE_SECONDS = 2;

const MISSION_LABELS = Object.freeze({
  [MISSION_TYPES.POMODORO]: 'Pomodoro',
  [MISSION_TYPES.ACTIVE_RECALL]: 'Active Recall'
});

export const getMissionLabel = (missionType) => MISSION_LABELS[missionType];

/**
 * Waktu minimum yang harus berlalu di server sebelum sesi boleh diselesaikan.
 * timeScale (1 = waktu nyata) memungkinkan demo singkat tanpa melonggarkan aturan.
 */
export const calculateRequiredSeconds = ({ missionType, durationMinutes, cardCount, timeScale }) => {
  const realSeconds = missionType === MISSION_TYPES.POMODORO
    ? durationMinutes * 60
    : cardCount * SECONDS_PER_CARD;
  return Math.max(1, Math.ceil(realSeconds * timeScale));
};

export const calculateElapsedSeconds = (startedAt, now) =>
  Math.max(0, Math.floor((now.getTime() - new Date(startedAt).getTime()) / 1000));

export const calculateRemainingSeconds = ({ requiredSeconds, elapsedSeconds }) =>
  Math.max(0, requiredSeconds - ELAPSED_TOLERANCE_SECONDS - elapsedSeconds);

export const isPassingScore = (score) => score >= PASSING_SCORE;

export const assertPomodoroLongEnoughToUnlock = (durationMinutes) => {
  if (durationMinutes < MIN_POMODORO_MINUTES_TO_UNLOCK) {
    throw new ValidationError(
      `Untuk membuka keinginan, sesi Pomodoro minimal ${MIN_POMODORO_MINUTES_TO_UNLOCK} menit`,
      { duration_minutes: `Minimal ${MIN_POMODORO_MINUTES_TO_UNLOCK} menit` }
    );
  }
};

export const assertMissionMatchesWish = (wish, missionType) => {
  if (wish.mission_type !== missionType) {
    throw new ValidationError(
      `Keinginan ini hanya dapat dibuka dengan misi ${getMissionLabel(wish.mission_type)}`,
      { mission_type: `Gunakan misi ${getMissionLabel(wish.mission_type)}` }
    );
  }
};
