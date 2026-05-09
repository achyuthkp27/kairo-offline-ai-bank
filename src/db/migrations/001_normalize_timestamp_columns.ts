import * as SQLite from 'expo-sqlite';

const CAMEL_TO_SNAKE_TABLES = ['portfolio', 'savings_goals', 'bills', 'debts'] as const;

type TimestampMap = {
  createdCamel: string;
  updatedCamel: string;
  createdSnake: string;
  updatedSnake: string;
};

const TIMESTAMP_MAP: Record<(typeof CAMEL_TO_SNAKE_TABLES)[number], TimestampMap> = {
  portfolio: {
    createdCamel: 'createdAt',
    updatedCamel: 'updatedAt',
    createdSnake: 'created_at',
    updatedSnake: 'updated_at',
  },
  savings_goals: {
    createdCamel: 'createdAt',
    updatedCamel: 'updatedAt',
    createdSnake: 'created_at',
    updatedSnake: 'updated_at',
  },
  bills: {
    createdCamel: 'createdAt',
    updatedCamel: 'updatedAt',
    createdSnake: 'created_at',
    updatedSnake: 'updated_at',
  },
  debts: {
    createdCamel: 'createdAt',
    updatedCamel: 'updatedAt',
    createdSnake: 'created_at',
    updatedSnake: 'updated_at',
  },
};

const hasColumn = async (
  database: SQLite.SQLiteDatabase,
  table: string,
  columnName: string
): Promise<boolean> => {
  const rows = await database.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return rows.some((row) => row.name === columnName);
};

export const normalizeTimestampColumns = async (
  database: SQLite.SQLiteDatabase
): Promise<void> => {
  for (const table of CAMEL_TO_SNAKE_TABLES) {
    const map = TIMESTAMP_MAP[table];
    const hasCreatedSnake = await hasColumn(database, table, map.createdSnake);
    const hasUpdatedSnake = await hasColumn(database, table, map.updatedSnake);

    if (!hasCreatedSnake) {
      await database.runAsync(
        `ALTER TABLE ${table} ADD COLUMN ${map.createdSnake} INTEGER NOT NULL DEFAULT 0`
      );
    }
    if (!hasUpdatedSnake) {
      await database.runAsync(
        `ALTER TABLE ${table} ADD COLUMN ${map.updatedSnake} INTEGER NOT NULL DEFAULT 0`
      );
    }

    const hasCreatedCamel = await hasColumn(database, table, map.createdCamel);
    const hasUpdatedCamel = await hasColumn(database, table, map.updatedCamel);

    if (hasCreatedCamel) {
      await database.runAsync(
        `UPDATE ${table} SET ${map.createdSnake} = ${map.createdCamel} WHERE ${map.createdSnake} = 0`
      );
    }
    if (hasUpdatedCamel) {
      await database.runAsync(
        `UPDATE ${table} SET ${map.updatedSnake} = ${map.updatedCamel} WHERE ${map.updatedSnake} = 0`
      );
    }
  }
};
