import { runInTransaction } from '../../core/database/connection.js';
import { CompleteMissionSession } from './application/complete-mission-session.js';
import { CreateActiveRecallDeck } from './application/create-active-recall-deck.js';
import { DeleteActiveRecallDeck } from './application/delete-active-recall-deck.js';
import { GenerateAiQuiz } from './application/generate-ai-quiz.js';
import { GetMissionSettings } from './application/get-mission-settings.js';
import { ListActiveRecallDecks } from './application/list-active-recall-decks.js';
import { ListMissionHistory } from './application/list-mission-history.js';
import { StartMissionSession } from './application/start-mission-session.js';
import { AiQuizService } from './infrastructure/ai-quiz.service.js';
import { SqliteMissionRepository } from './infrastructure/mission.repository.js';
import { MissionController } from './presentation/mission.controller.js';
import { createMissionRouter } from './presentation/mission.routes.js';

export { missionSchema, migrateMissionSchema } from './infrastructure/mission.schema.js';
export { seedActiveRecallDecks } from './infrastructure/deck.seed.js';

export const createMissionsModule = ({ db, clock, authenticate, transactionRepository, timeScale, aiQuizService = new AiQuizService() }) => {
  const missionRepository = new SqliteMissionRepository({ db });
  const unitOfWork = { run: (work) => runInTransaction(db, work) };

  const controller = new MissionController({
    getMissionSettings: new GetMissionSettings({ timeScale }),
    startMissionSession: new StartMissionSession({ missionRepository, transactionRepository, clock, timeScale }),
    completeMissionSession: new CompleteMissionSession({ missionRepository, transactionRepository, unitOfWork, clock }),
    listMissionHistory: new ListMissionHistory({ missionRepository }),
    listActiveRecallDecks: new ListActiveRecallDecks({ missionRepository }),
    generateAiQuiz: new GenerateAiQuiz({ aiQuizService, missionRepository, clock }),
    createActiveRecallDeck: new CreateActiveRecallDeck({ missionRepository, clock }),
    deleteActiveRecallDeck: new DeleteActiveRecallDeck({ missionRepository })
  });

  return { router: createMissionRouter({ controller, authenticate }) };
};
