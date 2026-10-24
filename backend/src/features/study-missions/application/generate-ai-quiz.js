export class GenerateAiQuiz {
  constructor({ aiQuizService, missionRepository, clock = () => new Date() }) {
    this.aiQuizService = aiQuizService;
    this.missionRepository = missionRepository;
    this.clock = clock;
  }

  async execute({ userId, input }) {
    const { title, subject, content, card_count = 3, save_as_deck = true } = input;
    const cards = await this.aiQuizService.generate({
      title,
      subject,
      content,
      cardCount: card_count
    });

    let deck = null;
    if (save_as_deck) {
      const now = typeof this.clock === 'function' ? this.clock() : this.clock.now();
      deck = this.missionRepository.createDeck({
        userId,
        title,
        description: `Dibuat otomatis oleh AI dari materi ${subject}`,
        subject,
        content,
        cards,
        createdAt: now.toISOString()
      });
    }

    return { deck, cards };
  }
}
