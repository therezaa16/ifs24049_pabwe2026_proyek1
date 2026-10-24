import { NotFoundError } from '../../../core/errors/app-error.js';

export class DeleteActiveRecallDeck {
  constructor({ missionRepository }) {
    this.missionRepository = missionRepository;
  }

  execute({ userId, deckId }) {
    const deleted = this.missionRepository.deleteDeck(deckId, userId);
    if (!deleted) {
      throw new NotFoundError('Materi kuis tidak ditemukan atau bukan milikmu');
    }
    return { success: true, message: 'Materi kuis berhasil dihapus' };
  }
}
