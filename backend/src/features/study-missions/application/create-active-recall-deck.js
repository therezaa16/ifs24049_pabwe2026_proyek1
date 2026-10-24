export class CreateActiveRecallDeck {
  constructor({ missionRepository, clock = () => new Date() }) {
    this.missionRepository = missionRepository;
    this.clock = clock;
  }

  execute({ userId, input }) {
    const { title, description = '', subject, content = '', cards } = input;
    const now = typeof this.clock === 'function' ? this.clock() : this.clock.now();
    return this.missionRepository.createDeck({
      userId,
      title,
      description,
      subject,
      content,
      cards,
      createdAt: now.toISOString()
    });
  }
}
