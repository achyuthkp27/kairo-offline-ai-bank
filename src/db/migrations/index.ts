import * as SQLite from 'expo-sqlite';
import { normalizeTimestampColumns } from './001_normalize_timestamp_columns';

const SCHEMA_VERSION = 1;

const getUserVersion = async (database: SQLite.SQLiteDatabase): Promise<number> => {
  const result = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return result?.user_version ?? 0;
};

export const runMigrations = async (database: SQLite.SQLiteDatabase): Promise<void> => {
  const currentVersion = await getUserVersion(database);
  if (currentVersion >= SCHEMA_VERSION) return;

  if (currentVersion < 1) {
    await normalizeTimestampColumns(database);
  }

  await database.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
};
