export const missionSchema = `
  CREATE TABLE IF NOT EXISTS active_recall_decks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS active_recall_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deck_id INTEGER NOT NULL REFERENCES active_recall_decks(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    explanation TEXT
  );

  CREATE TABLE IF NOT EXISTS study_missions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
    deck_id INTEGER REFERENCES active_recall_decks(id) ON DELETE SET NULL,
    mission_type TEXT NOT NULL CHECK (mission_type IN ('pomodoro', 'active_recall')),
    subject TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('berjalan', 'selesai', 'gagal')),
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    required_seconds INTEGER NOT NULL,
    score INTEGER,
    started_at TEXT NOT NULL,
    completed_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_study_missions_user_completed
    ON study_missions (user_id, completed_at);
`;

export const migrateMissionSchema = (db) => {
  const columns = db.prepare('PRAGMA table_info(active_recall_decks)').all().map((c) => c.name);
  if (!columns.includes('user_id')) {
    db.exec('ALTER TABLE active_recall_decks ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE');
  }
  if (!columns.includes('content')) {
    db.exec('ALTER TABLE active_recall_decks ADD COLUMN content TEXT');
  }
  if (!columns.includes('created_at')) {
    db.exec('ALTER TABLE active_recall_decks ADD COLUMN created_at TEXT');
  }
};
