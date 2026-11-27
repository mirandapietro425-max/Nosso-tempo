/* Banco local do Nosso Tempo.
 * IndexedDB substitui o Firestore para dados do app; nenhum registro é enviado a um servidor.
 * O fallback em localStorage só é usado quando IndexedDB não está disponível.
 */
const DATABASE_NAME = 'nosso-tempo-local';
const DATABASE_VERSION = 1;
const STORE_NAME = 'documents';
const FALLBACK_PREFIX = 'nosso-tempo:document:';
const LEGACY_SNAPSHOT_PATH = '_system/legacy-local-storage-v1';

let databasePromise;
let backend = 'unknown';
const listeners = new Map();
const DB_CHANGED_EVENT = 'nosso-tempo:database-changed';
const broadcast = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('nosso-tempo-local-db')
  : null;

const database = Object.freeze({ kind: 'nosso-tempo-local' });

function clone(value) {
  if (value == null) return value;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function openDatabase() {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve) => {
    if (!globalThis.indexedDB) {
      backend = 'localStorage';
      resolve(null);
      return;
    }

    let settled = false;
    let request;
    try {
      request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    } catch (error) {
      backend = 'localStorage';
      resolve(null);
      return;
    }

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'path' });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      if (settled) {
        db.close();
        return;
      }
      settled = true;
      backend = 'IndexedDB';
      resolve(db);
    };
    request.onerror = () => {
      if (settled) return;
      settled = true;
      backend = 'localStorage';
      resolve(null);
    };
    request.onblocked = () => {
      if (settled) return;
      settled = true;
      backend = 'localStorage';
      resolve(null);
    };
  });
  return databasePromise;
}

export function getFirestore() {
  // Nome mantido para reduzir mudanças no restante do app; retorna só o banco local.
  return database;
}

export function doc(db, collectionName, documentId) {
  if (db?.kind !== database.kind) throw new TypeError('Referência de banco local inválida.');
  const collection = String(collectionName ?? '').trim();
  const id = String(documentId ?? '').trim();
  if (!collection || !id || collection.includes('/') || id.includes('/')) {
    throw new TypeError('Coleção ou identificador inválido para o banco local.');
  }
  return Object.freeze({ db, collection, id, path: `${collection}/${id}` });
}

function assertReference(reference) {
  if (reference?.db?.kind !== database.kind || !reference.path) {
    throw new TypeError('Referência de documento local inválida.');
  }
}

function fallbackGet(path) {
  const raw = localStorage.getItem(FALLBACK_PREFIX + path);
  return raw == null ? null : JSON.parse(raw);
}

function fallbackPut(path, data) {
  localStorage.setItem(FALLBACK_PREFIX + path, JSON.stringify({ path, data: clone(data), updatedAt: Date.now() }));
}

async function readRecord(reference) {
  assertReference(reference);
  const db = await openDatabase();
  if (!db) return fallbackGet(reference.path);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(reference.path);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error('Não foi possível ler do IndexedDB.'));
    tx.onabort = () => reject(tx.error || new Error('Leitura local cancelada.'));
  });
}

function makeSnapshot(reference, record) {
  const value = record?.data ?? null;
  return Object.freeze({
    id: reference.id,
    ref: reference,
    exists: () => value !== null,
    data: () => value === null ? undefined : clone(value),
  });
}

export async function getDoc(reference) {
  const record = await readRecord(reference);
  return makeSnapshot(reference, record);
}

function mergeObjects(current, update) {
  const result = { ...(current && typeof current === 'object' ? current : {}) };
  for (const [key, value] of Object.entries(update || {})) {
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = mergeObjects(result[key], value);
    } else {
      result[key] = clone(value);
    }
  }
  return result;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function notifyChanged(path) {
  const detail = { path };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DB_CHANGED_EVENT, { detail }));
  }
  try { broadcast?.postMessage(detail); } catch (_) {}
  notifyListeners(path);
}

async function notifyListeners(path) {
  const callbacks = [...(listeners.get(path) || [])];
  if (!callbacks.length) return;
  try {
    const reference = callbacks[0].reference;
    const snapshot = await getDoc(reference);
    for (const entry of callbacks) {
      if (!entry.active) continue;
      try { entry.next(snapshot); } catch (error) { queueMicrotask(() => { throw error; }); }
    }
  } catch (error) {
    for (const entry of callbacks) {
      if (entry.active) entry.error?.(error);
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener(DB_CHANGED_EVENT, event => {
    const path = event.detail?.path;
    if (path) notifyListeners(path);
  });
}

if (broadcast) {
  broadcast.addEventListener('message', event => {
    const path = event.data?.path;
    if (path) notifyListeners(path);
  });
}

export async function setDoc(reference, value, options = {}) {
  assertReference(reference);
  const db = await openDatabase();
  if (!db) {
    const old = options?.merge ? fallbackGet(reference.path)?.data : null;
    fallbackPut(reference.path, options?.merge ? mergeObjects(old, value) : value);
    notifyChanged(reference.path);
    return;
  }

  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const write = data => store.put({ path: reference.path, data: clone(data), updatedAt: Date.now() });
    if (options?.merge) {
      const request = store.get(reference.path);
      request.onsuccess = () => write(mergeObjects(request.result?.data, value));
      request.onerror = () => { try { tx.abort(); } catch (_) {} };
    } else {
      write(value);
    }
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error('Não foi possível salvar no IndexedDB.'));
    tx.onabort = () => reject(tx.error || new Error('Gravação local cancelada.'));
  });
  notifyChanged(reference.path);
}

const ARRAY_UNION_MARKER = '__nossoTempoArrayUnion__';
export function arrayUnion(...values) {
  return Object.freeze({ [ARRAY_UNION_MARKER]: values.map(clone) });
}

function applyUpdate(current, updates) {
  const result = clone(current || {});
  for (const [field, value] of Object.entries(updates || {})) {
    const parts = field.split('.');
    let target = result;
    for (const part of parts.slice(0, -1)) {
      if (!isPlainObject(target[part])) target[part] = {};
      target = target[part];
    }
    const key = parts.at(-1);
    if (value && Array.isArray(value[ARRAY_UNION_MARKER])) {
      const list = Array.isArray(target[key]) ? target[key] : [];
      for (const item of value[ARRAY_UNION_MARKER]) {
        const exists = list.some(existing => {
          try { return JSON.stringify(existing) === JSON.stringify(item); } catch (_) { return existing === item; }
        });
        if (!exists) list.push(clone(item));
      }
      target[key] = list;
    } else {
      target[key] = clone(value);
    }
  }
  return result;
}

export async function updateDoc(reference, updates) {
  assertReference(reference);
  const db = await openDatabase();
  if (!db) {
    const existing = fallbackGet(reference.path);
    if (!existing) throw new Error(`Documento local inexistente: ${reference.path}`);
    fallbackPut(reference.path, applyUpdate(existing.data, updates));
    notifyChanged(reference.path);
    return;
  }

  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(reference.path);
    request.onsuccess = () => {
      if (!request.result) {
        try { tx.abort(); } catch (_) {}
        reject(new Error(`Documento local inexistente: ${reference.path}`));
        return;
      }
      store.put({ path: reference.path, data: applyUpdate(request.result.data, updates), updatedAt: Date.now() });
    };
    request.onerror = () => { try { tx.abort(); } catch (_) {} };
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error('Não foi possível atualizar o IndexedDB.'));
    tx.onabort = () => reject(tx.error || new Error('Atualização local cancelada.'));
  });
  notifyChanged(reference.path);
}

export async function deleteDoc(reference) {
  assertReference(reference);
  const db = await openDatabase();
  if (!db) localStorage.removeItem(FALLBACK_PREFIX + reference.path);
  else await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(reference.path);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error('Não foi possível excluir do IndexedDB.'));
    tx.onabort = () => reject(tx.error || new Error('Exclusão local cancelada.'));
  });
  notifyChanged(reference.path);
}

export function onSnapshot(reference, next, error) {
  assertReference(reference);
  const entry = { reference, next, error, active: true };
  if (!listeners.has(reference.path)) listeners.set(reference.path, new Set());
  listeners.get(reference.path).add(entry);
  getDoc(reference).then(snapshot => {
    if (entry.active) next(snapshot);
  }).catch(err => { if (entry.active) error?.(err); });
  return () => {
    entry.active = false;
    const set = listeners.get(reference.path);
    set?.delete(entry);
    if (set?.size === 0) listeners.delete(reference.path);
  };
}

export async function exportAllDocuments() {
  const db = await openDatabase();
  if (!db) {
    const rows = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(FALLBACK_PREFIX)) continue;
      try { rows.push(JSON.parse(localStorage.getItem(key))); } catch (_) {}
    }
    return rows;
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error || new Error('Não foi possível ler os documentos para o backup.'));
    tx.onabort = () => reject(tx.error || new Error('Leitura do backup cancelada.'));
  });
}

export async function importDocuments(records) {
  if (!Array.isArray(records)) throw new TypeError('O backup não contém uma lista de documentos.');
  for (const record of records) {
    if (!record || typeof record.path !== 'string' || !/^[A-Za-z0-9_-]{1,60}\/[A-Za-z0-9_-]{1,120}$/.test(record.path)) continue;
    if (record.path === LEGACY_SNAPSHOT_PATH || record.data == null || typeof record.data !== 'object') continue;
    const [collection, id] = record.path.split('/');
    await setDoc(doc(database, collection, id), record.data);
  }
}

export async function migrateLegacyLocalStorage() {
  try {
    const reference = doc(database, '_system', 'legacy-local-storage-v1');
    if ((await getDoc(reference)).exists()) return 0;
    const values = {};
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (!key || key.startsWith(FALLBACK_PREFIX)) continue;
      values[key] = localStorage.getItem(key);
    }
    const count = Object.keys(values).length;
    if (count) await setDoc(reference, { capturedAt: new Date().toISOString(), values });
    return count;
  } catch (error) {
    console.warn('[Banco local] Não foi possível copiar as preferências antigas:', error?.message || error);
    return 0;
  }
}

export async function getLocalDatabaseStatus() {
  await openDatabase();
  return backend === 'IndexedDB'
    ? { mode: 'IndexedDB', persistent: true, message: 'Salvamento automático neste navegador. Os dados não são enviados a um servidor.' }
    : { mode: 'localStorage', persistent: true, message: 'IndexedDB não está disponível; usando armazenamento local de compatibilidade neste navegador.' };
}
