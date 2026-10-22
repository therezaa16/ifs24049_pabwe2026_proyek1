import { NotFoundError } from '../../../core/errors/app-error.js';
import { MISSION_TYPES } from '../../../core/domain/mission-types.js';
import { assertCanBeUnlocked } from '../../transactions/index.js';
import {
  assertMissionMatchesWish,
  assertPomodoroLongEnoughToUnlock,
  calculateRequiredSeconds
} from '../domain/mission.rules.js';

export class StartMissionSession {
  constructor({ missionRepository, transactionRepository, clock, timeScale }) {
    this.missionRepository = missionRepository;
    this.transactionRepository = transactionRepository;
    this.clock = clock;
    this.timeScale = timeScale;
  }

  execute({ userId, input }) {
    const missionType = input.mission_type;
    const wish = this.#findWish(userId, input.transaction_id, missionType);
    const plan = missionType === MISSION_TYPES.POMODORO
      ? this.#planPomodoro(input, wish)
      : this.#planActiveRecall(input);

    return this.missionRepository.createSession({
      userId,
      transactionId: wish ? wish.id : null,
      missionType,
      subject: plan.subject,
      deckId: plan.deckId,
      durationMinutes: plan.durationMinutes,
      requiredSeconds: calculateRequiredSeconds({
        missionType,
        durationMinutes: plan.durationMinutes,
        cardCount: plan.cardCount,
        timeScale: this.timeScale
      }),
      startedAt: this.clock().toISOString()
    });
  }

  #findWish(userId, transactionId, missionType) {
    if (transactionId === undefined || transactionId === null) {
      return null;
    }

    const wish = this.transactionRepository.findById(Number(transactionId), userId);
    if (!wish) {
      throw new NotFoundError('Keinginan yang ingin dibuka tidak ditemukan');
    }

    assertCanBeUnlocked(wish);
    assertMissionMatchesWish(wish, missionType);
    return wish;
  }

  #planPomodoro(input, wish) {
    const durationMinutes = Number(input.duration_minutes);
    if (wish) {
      assertPomodoroLongEnoughToUnlock(durationMinutes);
    }

    return { subject: input.subject.trim(), deckId: null, durationMinutes, cardCount: 0 };
  }

  #planActiveRecall(input) {
    const deck = this.missionRepository.findDeckById(Number(input.deck_id));
    if (!deck) {
      throw new NotFoundError('Materi kuis tidak ditemukan');
    }

    return { subject: deck.title, deckId: deck.id, durationMinutes: 0, cardCount: deck.card_count };
  }
}
