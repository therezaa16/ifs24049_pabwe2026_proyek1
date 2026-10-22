export const transactionSchema = `
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('pemasukan', 'kebutuhan', 'keinginan')),
    title TEXT NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL CHECK (status IN ('aktif', 'terkunci', 'terbuka', 'dibatalkan')),
    mission_type TEXT CHECK (mission_type IS NULL OR mission_type IN ('pomodoro', 'active_recall')),
    unlocked_at TEXT,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_user_created
    ON transactions (user_id, created_at);
`;
