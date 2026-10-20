import { STORAGE_KEYS } from '@/constants';

/**
 * Minimal promise-based IndexedDB wrapper.
 *
 * The whole application state lives in a single document inside a key/value
 * object store. That keeps writes atomic (no partially-updated state) and
 * makes export/restore trivial.
 *
 * If IndexedDB is unavailable — private browsing modes, hardened browsers or
 * a storage-blocked environment — the module transparently falls back to an
 * in-memory store so the app still works for the current session instead of
 * crashing on startup.
 */

const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    console.warn('[finance] IndexedDB is unavailable — running in memory only.');
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(STORAGE_KEYS.db, DB_VERSION);
    } catch (error) {
      console.warn('[finance] Could not open IndexedDB — running in memory only.', error);
      resolve(null);
      return;
    }

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORAGE_KEYS.store)) {
        db.createObjectStore(STORAGE_KEYS.store);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.warn('[finance] IndexedDB error — running in memory only.', request.error);
      resolve(null);
    };
    request.onblocked = () => {
      console.warn('[finance] IndexedDB upgrade blocked by another tab.');
      resolve(null);
    };
  });
}

function getDb(): Promise<IDBDatabase | null> {
  if (!dbPromise) dbPromise = openDatabase();
  return dbPromise;
}

/** In-memory fallback used when IndexedDB is not available. */
const memoryStore = new Map<string, unknown>();

export async function getDocument<T>(key: string): Promise<T | null> {
  const db = await getDb();
  if (!db) {
    return (memoryStore.get(key) as T) ?? null;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORAGE_KEYS.store, 'readonly');
      const request = tx.objectStore(STORAGE_KEYS.store).get(key);
      request.onsuccess = () => resolve((request.result as T) ?? null);
      request.onerror = () => resolve(null);
    } catch (error) {
      console.warn('[finance] Failed to read document.', error);
      resolve((memoryStore.get(key) as T) ?? null);
    }
  });
}

export async function setDocument(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  if (!db) {
    memoryStore.set(key, value);
    return;
  }

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORAGE_KEYS.store, 'readwrite');
      tx.objectStore(STORAGE_KEYS.store).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to persist document'));
      tx.onabort = () => reject(tx.error ?? new Error('Write aborted'));
    } catch (error) {
      console.warn('[finance] Failed to persist document.', error);
      memoryStore.set(key, value);
      resolve();
    }
  });
}

export async function deleteDocument(key: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    memoryStore.delete(key);
    return;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORAGE_KEYS.store, 'readwrite');
      tx.objectStore(STORAGE_KEYS.store).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/** Reports whether data will survive a page reload. */
export async function isPersistent(): Promise<boolean> {
  const db = await getDb();
  return db !== null;
}
