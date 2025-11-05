import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { GameState, KPIDataset, CardsDataset, ObjectivesDataset, DifficultyDataset } from '../types';

interface DernierGouvernementDB extends DBSchema {
  games: {
    key: string; // saveId
    value: GameState;
    indexes: { 'by-date': string };
  };
  imports: {
    key: string; // checksum or timestamp
    value: {
      id: string;
      type: 'kpi' | 'cards' | 'objectives' | 'difficulty';
      data: KPIDataset | CardsDataset | ObjectivesDataset | DifficultyDataset;
      importedAt: string; // ISO 8601
      checksum: string;
    };
  };
  settings: {
    key: string;
    value: unknown;
  };
}

let db: IDBPDatabase<DernierGouvernementDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<DernierGouvernementDB>> {
  if (db) return db;

  db = await openDB<DernierGouvernementDB>('dernier-gouvernement', 1, {
    upgrade(db) {
      // Games store
      const gamesStore = db.createObjectStore('games', { keyPath: 'saveId' });
      gamesStore.createIndex('by-date', 'startDate');

      // Imports store
      db.createObjectStore('imports', { keyPath: 'id' });

      // Settings store
      db.createObjectStore('settings');
    },
  });

  return db;
}

// ====================================
// GAME OPERATIONS
// ====================================

export async function saveGame(gameState: GameState): Promise<void> {
  const database = await initDB();
  await database.put('games', gameState);
}

export async function loadGame(saveId: string): Promise<GameState | undefined> {
  const database = await initDB();
  return database.get('games', saveId);
}

export async function listGames(): Promise<GameState[]> {
  const database = await initDB();
  return database.getAll('games');
}

export async function deleteGame(saveId: string): Promise<void> {
  const database = await initDB();
  await database.delete('games', saveId);
}

// ====================================
// IMPORT OPERATIONS
// ====================================

export async function saveImport(
  type: 'kpi' | 'cards' | 'objectives' | 'difficulty',
  data: KPIDataset | CardsDataset | ObjectivesDataset | DifficultyDataset,
  checksum: string
): Promise<void> {
  const database = await initDB();
  const id = `${type}-${Date.now()}`;
  await database.put('imports', {
    id,
    type,
    data,
    importedAt: new Date().toISOString(),
    checksum,
  });
}

export async function getLatestImport(type: 'kpi' | 'cards' | 'objectives' | 'difficulty') {
  const database = await initDB();
  const all = await database.getAll('imports');
  const filtered = all.filter(i => i.type === type);
  filtered.sort((a, b) => b.importedAt.localeCompare(a.importedAt));
  return filtered[0];
}

export async function listImports() {
  const database = await initDB();
  return database.getAll('imports');
}

// ====================================
// SETTINGS OPERATIONS
// ====================================

export async function saveSetting(key: string, value: unknown): Promise<void> {
  const database = await initDB();
  await database.put('settings', value, key);
}

export async function loadSetting<T>(key: string): Promise<T | undefined> {
  const database = await initDB();
  return database.get('settings', key) as Promise<T | undefined>;
}

// ====================================
// UTILITY
// ====================================

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function generateChecksum(data: unknown): string {
  const str = JSON.stringify(data);
  return hashString(str).toString(36);
}
