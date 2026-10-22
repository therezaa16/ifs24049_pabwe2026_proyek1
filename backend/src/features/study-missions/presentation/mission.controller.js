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
    listActiveRecallDecks
  }) {
    this.getMissionSettings = getMissionSettings;
    this.startMissionSession = startMissionSession;
    this.completeMissionSession = completeMissionSession;
    this.listMissionHistory = listMissionHistory;
    this.listActiveRecallDecks = listActiveRecallDecks;
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
    res.status(200).json({ success: true, decks: this.listActiveRecallDecks.execute() });
  };
}
