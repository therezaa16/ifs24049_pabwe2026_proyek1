export const authSchema = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password TEXT NOT NULL,
    monthly_budget REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
`;
