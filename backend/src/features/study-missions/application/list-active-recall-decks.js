export class ListActiveRecallDecks {
  constructor({ missionRepository }) {
    this.missionRepository = missionRepository;
  }

  execute() {
    return this.missionRepository.findDecks();
  }
}
