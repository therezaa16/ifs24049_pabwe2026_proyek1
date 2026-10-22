import { ConflictError } from '../../../core/errors/app-error.js';

const PUBLIC_COLUMNS = 'id, name, email, monthly_budget, created_at';
const UNIQUE_VIOLATION_PATTERN = /UNIQUE constraint failed/;

export class SqliteUserRepository {
  constructor({ db, clock }) {
    this.db = db;
    this.clock = clock;
  }

  create({ name, email, password, monthlyBudget }) {
    try {
      const result = this.db
        .prepare('INSERT INTO users (name, email, password, monthly_budget, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(name, email, password, monthlyBudget, this.clock().toISOString());
      return this.findById(Number(result.lastInsertRowid));
    } catch (error) {
      if (UNIQUE_VIOLATION_PATTERN.test(error.message)) {
        throw new ConflictError('Email sudah terdaftar, silakan gunakan email lain atau masuk');
      }
      throw error;
    }
  }

  findByEmail(email) {
    return this.db
      .prepare(`SELECT ${PUBLIC_COLUMNS}, password FROM users WHERE email = ?`)
      .get(email);
  }

  findById(id) {
    return this.db.prepare(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`).get(id);
  }

  updateBudget(id, monthlyBudget) {
    this.db.prepare('UPDATE users SET monthly_budget = ? WHERE id = ?').run(monthlyBudget, id);
    return this.findById(id);
  }
}
