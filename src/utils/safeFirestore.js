/**
 * safeFirestore.js
 * ──────────────────────────────────────────────────────
 * Data abstraction / error-immunity layer for Firestore.
 *
 * Every exported function:
 *  1. Attempts the real Firestore operation.
 *  2. Silently catches ALL errors (permission, index, network).
 *  3. Returns fallback/demo data instead of crashing.
 *  4. Merges partial real data with demo data when possible.
 *
 * NEVER throws to the UI — only logs warnings internally.
 */

import { onSnapshot, getDocs, getDoc, getCountFromServer, setDoc } from 'firebase/firestore';

// ─── Internal logger (silent to users) ──────────────────
function logWarn(context, err) {
  console.warn(`[SafeFirestore] ${context}:`, err?.code || err?.message || err);
}

// ─── safeOnSnapshot ─────────────────────────────────────
/**
 * Wraps Firestore `onSnapshot`.
 *
 * @param {Query} query         Firestore query
 * @param {Array}  fallbackData Full fallback array returned on error
 * @param {Object} options
 *   - onData:  (dataArray) => void  — called with (possibly merged) data
 *   - onError: (dataArray) => void  — called ONLY with fallback data on failure
 *   - mapFn:   (doc) => any         — optional document mapper (default: d => ({id:d.id,...d.data()}))
 *   - isEmptyFallback: boolean      — if true, fill with fallbackData when real data is empty
 *   - minItems: number              — if real data < minItems, merge with fallback to reach minItems
 *
 * @returns {Function} Unsubscribe function
 */
export function safeOnSnapshot(query, fallbackData = [], options = {}) {
  const {
    onData,
    onError,
    mapFn = (d) => ({ id: d.id, ...d.data() }),
    isEmptyFallback = true,
    minItems = 0,
  } = options;

  const unsub = onSnapshot(
    query,
    (snap) => {
      const realData = snap.docs.map(mapFn).filter(Boolean);

      // If real data exists, use it (potentially merged/fluffed)
      if (realData.length > 0) {
        // If we have fewer than minItems, pad with non-overlapping fallback
        if (minItems > 0 && realData.length < minItems) {
          const realIds = new Set(realData.map((d) => d.id));
          const extra = fallbackData.filter((d) => !realIds.has(d.id)).slice(0, minItems - realData.length);
          onData?.([...realData, ...extra]);
        } else {
          onData?.(realData);
        }
        return;
      }

      // Real data is empty
      if (isEmptyFallback && fallbackData.length > 0) {
        onData?.(fallbackData);
      } else {
        onData?.(realData);
      }
    },
    (err) => {
      logWarn('onSnapshot error, using fallback', err);
      if (fallbackData.length > 0) {
        onData?.(fallbackData);
        onError?.(fallbackData);
      } else {
        onData?.([]);
        onError?.([]);
      }
    }
  );

  return unsub;
}

// ─── safeGetDocs (one-time fetch) ───────────────────────
/**
 * Wraps Firestore `getDocs`.
 *
 * @param {Query}   query         Firestore query
 * @param {Array}   fallbackData  Fallback array returned on error
 * @param {Function} mapFn        Optional document mapper
 * @param {boolean}  isEmptyFallback  Use fallback when real data is empty
 * @returns {Promise<Array>}
 */
export async function safeGetDocs(query, fallbackData = [], mapFn, isEmptyFallback = true) {
  try {
    const snap = await getDocs(query);
    const mapper = mapFn || ((d) => ({ id: d.id, ...d.data() }));
    const realData = snap.docs.map(mapper).filter(Boolean);

    if (realData.length > 0) return realData;
    if (isEmptyFallback && fallbackData.length > 0) return fallbackData;
    return realData;
  } catch (err) {
    logWarn('getDocs error, using fallback', err);
    return fallbackData || [];
  }
}

// ─── safeGetDoc (single document) ───────────────────────
/**
 * Wraps Firestore `getDoc`.
 *
 * @param {DocumentReference} docRef
 * @param {Object|null} fallbackData  Object returned on error / not-found
 * @param {boolean}       useFallbackOnEmpty  If true, return fallback when doc doesn't exist
 * @returns {Promise<Object|null>}
 */
export async function safeGetDoc(docRef, fallbackData = null, useFallbackOnEmpty = true) {
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) return { id: snap.id, ...snap.data() };
    if (useFallbackOnEmpty) return fallbackData;
    return null;
  } catch (err) {
    logWarn('getDoc error, using fallback', err);
    return fallbackData;
  }
}

// ─── safeGetCountFromServer ──────────────────────────────
/**
 * Wraps Firestore `getCountFromServer`.
 *
 * @param {Query}  query
 * @param {number} fallbackCount  Default count on error
 * @returns {Promise<{count: number}>}
 */
export async function safeGetCountFromServer(query, fallbackCount = 0) {
  try {
    return { count: (await getCountFromServer(query)).data().count };
  } catch (err) {
    logWarn('getCountFromServer error, using fallback', err);
    return { count: fallbackCount };
  }
}

// ─── safeSetDoc (create-or-fail) ────────────────────────
/**
 * Wraps Firestore `setDoc` for documents that should be created-only.
 * Returns { success: true } or { success: false, error: 'already-exists' | 'permission-denied' | ... }
 *
 * @param {DocumentReference} docRef
 * @param {Object}            data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function safeCreateDoc(docRef, data) {
  // First check if document exists (silent check)
  try {
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      logWarn('safeCreateDoc: document already exists', docRef.path);
      return { success: false, error: 'already-exists' };
    }
  } catch (checkErr) {
    // If checking fails, we still try the write
    logWarn('safeCreateDoc: pre-check failed', checkErr);
  }

  try {
    await setDoc(docRef, data);
    return { success: true };
  } catch (err) {
    const code = err?.code || '';
    logWarn('safeCreateDoc: setDoc failed', err);
    if (code === 'already-exists') {
      return { success: false, error: 'already-exists' };
    }
    // When rules only allow create and doc somehow exists, Firestore
    // returns permission-denied instead of already-exists
    if (code.includes('permission-denied')) {
      // Double-check existence to provide accurate error
      try {
        const recheck = await getDoc(docRef);
        if (recheck.exists()) {
          return { success: false, error: 'already-exists' };
        }
      } catch { /* ignore */ }
      return { success: false, error: 'permission-denied' };
    }
    return { success: false, error: code || 'unknown' };
  }
}
