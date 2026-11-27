import 'dotenv/config';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';

export function openDatabase(filename: string) {
  const sqlite = new Database(filename);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('busy_timeout = 5000');
  const database = drizzle(sqlite, { schema });
  migrate(database, { migrationsFolder: './drizzle' });
  return { database, sqlite };
}

const globalForDatabase = globalThis as unknown as {
  postDatabase?: ReturnType<typeof openDatabase>;
};

export function getDatabase() {
  globalForDatabase.postDatabase ??= openDatabase(
    process.env.DATABASE_URL?.replace(/^file:/, '') ?? './dev.db'
  );
  return globalForDatabase.postDatabase.database;
}

export type PostDatabase = ReturnType<typeof getDatabase>;
