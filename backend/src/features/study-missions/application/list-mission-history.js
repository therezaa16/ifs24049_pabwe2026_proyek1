export class ListMissionHistory {
  constructor({ missionRepository }) {
    this.missionRepository = missionRepository;
  }

  execute({ userId }) {
    return this.missionRepository.findHistory(userId);
  }
}
