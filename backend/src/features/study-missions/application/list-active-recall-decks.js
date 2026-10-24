export class ListActiveRecallDecks {
  constructor({ missionRepository }) {
    this.missionRepository = missionRepository;
  }

  execute({ userId } = {}) {
    return this.missionRepository.findDecks(userId);
  }
}
