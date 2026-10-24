import { parseIdParam } from '../../../core/utils/params.js';
import { PASSING_SCORE, getMissionLabel } from '../domain/mission.rules.js';

const buildCompletionMessage = ({ mission, unlockedTransaction, passed }) => {
  const label = getMissionLabel(mission.mission_type);

  if (!passed) {
    return `Skor ${mission.score} belum mencapai batas lulus ${PASSING_SCORE}. Ulangi sesi untuk membuka keinginanmu.`;
  }

  return unlockedTransaction
    ? `Hebat! Misi ${label} selesai dan keinginan "${unlockedTransaction.title}" resmi TERBUKA!`
    : `Misi ${label} berhasil diselesaikan. Disiplin belajarmu bertambah!`;
};

export class MissionController {
  constructor({
    getMissionSettings,
    startMissionSession,
    completeMissionSession,
    listMissionHistory,
    listActiveRecallDecks,
    generateAiQuiz,
    createActiveRecallDeck,
    deleteActiveRecallDeck
  }) {
    this.getMissionSettings = getMissionSettings;
    this.startMissionSession = startMissionSession;
    this.completeMissionSession = completeMissionSession;
    this.listMissionHistory = listMissionHistory;
    this.listActiveRecallDecks = listActiveRecallDecks;
    this.generateAiQuiz = generateAiQuiz;
    this.createActiveRecallDeck = createActiveRecallDeck;
    this.deleteActiveRecallDeck = deleteActiveRecallDeck;
  }

  settings = async (req, res) => {
    res.status(200).json({ success: true, settings: this.getMissionSettings.execute() });
  };

  start = async (req, res) => {
    const session = this.startMissionSession.execute({ userId: req.user.id, input: req.body });
    res.status(201).json({ success: true, message: 'Sesi misi dimulai', session });
  };

  complete = async (req, res) => {
    const result = this.completeMissionSession.execute({
      userId: req.user.id,
      sessionId: parseIdParam(req.params.id, 'ID sesi misi'),
      score: req.body.score
    });

    res.status(200).json({
      success: true,
      message: buildCompletionMessage(result),
      passed: result.passed,
      mission: result.mission,
      unlockedTransaction: result.unlockedTransaction
    });
  };

  history = async (req, res) => {
    const missions = this.listMissionHistory.execute({ userId: req.user.id });
    res.status(200).json({ success: true, count: missions.length, missions });
  };

  decks = async (req, res) => {
    const decks = this.listActiveRecallDecks.execute({ userId: req.user?.id });
    res.status(200).json({ success: true, decks });
  };

  generateAi = async (req, res) => {
    const result = await this.generateAiQuiz.execute({ userId: req.user.id, input: req.body });
    res.status(201).json({
      success: true,
      message: 'Kuis Active Recall berhasil dihasilkan oleh AI',
      ...result
    });
  };

  createDeck = async (req, res) => {
    const deck = this.createActiveRecallDeck.execute({ userId: req.user.id, input: req.body });
    res.status(201).json({ success: true, message: 'Materi kartu berhasil dibuat', deck });
  };

  deleteDeck = async (req, res) => {
    const result = this.deleteActiveRecallDeck.execute({
      userId: req.user.id,
      deckId: parseIdParam(req.params.id, 'ID materi kartu')
    });
    res.status(200).json(result);
  };
}
