import { ConflictError, NotFoundError, ValidationError } from '../../../core/errors/app-error.js';
import { MISSION_TYPES } from '../../../core/domain/mission-types.js';
import { TRANSACTION_STATUSES } from '../../transactions/index.js';
import {
  MISSION_STATUSES,
  calculateElapsedSeconds,
  calculateRemainingSeconds,
  isPassingScore
} from '../domain/mission.rules.js';

export class CompleteMissionSession {
  constructor({ missionRepository, transactionRepository, unitOfWork, clock }) {
    this.missionRepository = missionRepository;
    this.transactionRepository = transactionRepository;
    this.unitOfWork = unitOfWork;
    this.clock = clock;
  }

  execute({ userId, sessionId, score }) {
    const session = this.missionRepository.findById(sessionId, userId);
    if (!session) {
      throw new NotFoundError('Sesi misi tidak ditemukan');
    }
    if (session.status !== MISSION_STATUSES.RUNNING) {
      throw new ConflictError('Sesi misi ini sudah diselesaikan sebelumnya');
    }

    const now = this.clock();
    const elapsedSeconds = calculateElapsedSeconds(session.started_at, now);
    this.#assertEnoughTimeElapsed(session, elapsedSeconds);

    const result = this.#evaluate(session, score, elapsedSeconds);

    return this.unitOfWork.run(() => {
      const completedAt = now.toISOString();
      this.missionRepository.markFinished({
        id: session.id,
        userId,
        status: result.passed ? MISSION_STATUSES.COMPLETED : MISSION_STATUSES.FAILED,
        score: result.score,
        durationMinutes: result.durationMinutes,
        completedAt
      });

      const unlockedTransaction = result.passed
        ? this.#unlockWish(session, userId, completedAt)
        : null;

      return {
        mission: this.missionRepository.findById(session.id, userId),
        unlockedTransaction,
        passed: result.passed
      };
    });
  }

  #assertEnoughTimeElapsed(session, elapsedSeconds) {
    const remainingSeconds = calculateRemainingSeconds({
      requiredSeconds: session.required_seconds,
      elapsedSeconds
    });

    if (remainingSeconds > 0) {
      throw new ValidationError(
        `Waktu belajar belum cukup, sisa ${remainingSeconds} detik`,
        { remaining_seconds: remainingSeconds }
      );
    }
  }

  #evaluate(session, score, elapsedSeconds) {
    if (session.mission_type === MISSION_TYPES.POMODORO) {
      return { passed: true, score: 100, durationMinutes: session.duration_minutes };
    }

    if (score === undefined || score === null) {
      throw new ValidationError('Skor wajib diisi untuk sesi Active Recall', {
        score: 'Skor wajib diisi'
      });
    }

    return {
      passed: isPassingScore(Number(score)),
      score: Number(score),
      durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60))
    };
  }

  #unlockWish(session, userId, unlockedAt) {
    if (!session.transaction_id) {
      return null;
    }

    const wish = this.transactionRepository.findById(session.transaction_id, userId);
    if (wish.status !== TRANSACTION_STATUSES.LOCKED) {
      return null;
    }

    this.transactionRepository.markUnlocked(wish.id, userId, unlockedAt);
    return this.transactionRepository.findById(wish.id, userId);
  }
}
