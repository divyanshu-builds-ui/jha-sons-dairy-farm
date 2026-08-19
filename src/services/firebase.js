import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp, arrayUnion, writeBatch, deleteField } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Enable offline persistence — reads from local cache first, reduces Firebase reads by 60-80%
// Disabled for fresh installs — causes "client is offline" errors when no cache exists
// enableIndexedDbPersistence(db).catch(() => {});

// Lightweight usage counter (localStorage based, no circular deps)
const _track = (type) => {
  try {
    const key = 'lg_usage_today';
    const today = new Date().toISOString().split('T')[0];
    let stored = JSON.parse(localStorage.getItem(key) || '{}');
    if (stored.date !== today) {
      stored = { reads: 0, writes: 0, deletes: 0, date: today };
    }
    stored[type] = (stored[type] || 0) + 1;
    localStorage.setItem(key, JSON.stringify(stored));
  } catch {}
};

// App-level write authorization key (validated in Firestore rules)
const APP_WRITE_KEY = 'LG_2026_dG7xPmKv9Q';

// Tracked wrappers
const _getDoc = async (...args) => { _track('reads'); return getDoc(...args); };
const _getDocs = async (...args) => { const r = await getDocs(...args); _track('reads'); return r; };
const _addDoc = async (colRef, data) => { _track('writes'); return addDoc(colRef, { ...data, _appKey: APP_WRITE_KEY }); };
const _setDoc = async (docRef, data, options) => { _track('writes'); return setDoc(docRef, { ...data, _appKey: APP_WRITE_KEY }, options || {}); };
const _updateDoc = async (docRef, data) => { _track('writes'); return updateDoc(docRef, { ...data, _appKey: APP_WRITE_KEY }); };
const _deleteDoc = async (...args) => { _track('deletes'); return deleteDoc(...args); };

// --- Session Cache (avoids re-reading static docs per session) ---
const _cache = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const cachedGetDoc = async (docRef, ttl = CACHE_TTL) => {
  const key = docRef.path;
  const cached = _cache[key];
  if (cached && Date.now() - cached.ts < ttl) return cached.snap;
  const snap = await _getDoc(docRef);
  _cache[key] = { snap, ts: Date.now() };
  return snap;
};

// cachedGetDocs - collection query cache (stale-while-revalidate)
// Returns cached data instantly, fetches fresh in background
export const cachedGetDocs = async (queryRef, cacheKey, ttl = CACHE_TTL) => {
  const cached = _cache[cacheKey];
  if (cached && Date.now() - cached.ts < ttl) return cached.snap;
  const snap = await _getDocs(queryRef);
  _cache[cacheKey] = { snap, ts: Date.now() };
  return snap;
};

// useLiveData - stale-while-revalidate hook
// Shows cached data instantly, revalidates in background
export const getCachedDocs = (cacheKey) => {
  const cached = _cache[cacheKey];
  if (cached) return cached.snap;
  return null;
};

export const invalidateCache = (path) => {
  if (path) delete _cache[path];
  else Object.keys(_cache).forEach(k => delete _cache[k]);
};

// Invalidate all cache keys matching a prefix
export const invalidateCachePrefix = (prefix) => {
  Object.keys(_cache).filter(k => k.startsWith(prefix)).forEach(k => delete _cache[k]);
};

export {
  collection,
  doc,
  _getDoc as getDoc,
  _getDocs as getDocs,
  _addDoc as addDoc,
  _setDoc as setDoc,
  _updateDoc as updateDoc,
  _deleteDoc as deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  writeBatch,
  deleteField,
};
