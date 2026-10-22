import {
  ELAPSED_TOLERANCE_SECONDS,
  MIN_POMODORO_MINUTES_TO_UNLOCK,
  PASSING_SCORE,
  SECONDS_PER_CARD
} from '../domain/mission.rules.js';

export class GetMissionSettings {
  constructor({ timeScale }) {
    this.timeScale = timeScale;
  }

  execute() {
    return {
      timeScale: this.timeScale,
      passingScore: PASSING_SCORE,
      minPomodoroMinutesToUnlock: MIN_POMODORO_MINUTES_TO_UNLOCK,
      secondsPerCard: SECONDS_PER_CARD,
      toleranceSeconds: ELAPSED_TOLERANCE_SECONDS
    };
  }
}
