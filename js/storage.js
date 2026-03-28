/* ═══════════════════════════════════════════════
   PIETRO & EMILLY — storage.js
   Abstração do Firebase Firestore
   ═══════════════════════════════════════════════ */

import { getFirestore, doc, getDoc, setDoc, onSnapshot }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let _db = null;

/** Inicializa o Firestore com a app do Firebase */
export function initDB(app) {
  _db = getFirestore(app);
  return _db;
}

export function getDB() {
  if (!_db) throw new Error('DB não inicializado. Chame initDB() primeiro.');
  return _db;
}

/** Lê um documento; retorna null se não existir */
export async function readDoc(collection, id) {
  try {
    const ref  = doc(getDB(), collection, id);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn(`[storage] readDoc ${collection}/${id}:`, e);
    return null;
  }
}

/** Escreve (merge: false) em um documento */
export async function writeDoc(collection, id, data) {
  const ref = doc(getDB(), collection, id);
  await setDoc(ref, data);
}

/** Escuta mudanças em tempo real; retorna função de unsubscribe */
export function watchDoc(collection, id, callback) {
  const ref = doc(getDB(), collection, id);
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

/** Helper: retorna a referência de um doc (para uso avançado) */
export function docRef(collection, id) {
  return doc(getDB(), collection, id);
}

// ── Coleções conhecidas ──
export const COLLECTIONS = {
  GALLERY:       'gallery',
  MOVIES:        'movies',
  DREAMS:        'dreams',
  MURAL:         'mural',
  MOOD:          'mood',
  LOCATION:      'location',
  CALENDAR:      'calendar',
  SPECIAL_BDAY:  'special_bday',
  SPECIAL_MESV:  'special_mesv',
};

// ── Documentos compartilhados (id fixo "shared") ──
export const SHARED_ID = 'shared';
