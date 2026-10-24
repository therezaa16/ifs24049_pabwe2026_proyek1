import { openDatabase } from './core/database/connection.js';
import { authSchema } from './features/auth/index.js';
import { migrateMissionSchema, missionSchema, seedActiveRecallDecks } from './features/study-missions/index.js';
import { transactionSchema } from './features/transactions/index.js';

export const createDatabase = (path) => {
  const db = openDatabase(path);
  db.exec([authSchema, transactionSchema, missionSchema].join('\n'));
  migrateMissionSchema(db);
  seedActiveRecallDecks(db);
  return db;
};
