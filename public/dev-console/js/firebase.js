// Firebase initialization
firebase.initializeApp({
  apiKey: "AIzaSyDF0iQlKp1YRClC7GfsSfCw7FL2hcEpJc4",
  authDomain: "lucy-garden.firebaseapp.com",
  projectId: "lucy-garden",
  storageBucket: "lucy-garden.firebasestorage.app",
  messagingSenderId: "828869866166",
  appId: "1:828869866166:web:739979546e5e553e362c17"
});

const db = firebase.firestore();

// App-level write authorization key (must match Firestore rules)
const APP_WRITE_KEY = 'LG_2026_dG7xPmKv9Q';

// Helper functions for Firestore
async function getCollection(name) {
  const snap = await db.collection(name).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getDocument(col, id) {
  const snap = await db.collection(col).doc(id).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

async function setDocument(col, id, data) {
  await db.collection(col).doc(id).set({ ...data, _appKey: APP_WRITE_KEY }, { merge: true });
}

async function deleteDocument(col, id) {
  await db.collection(col).doc(id).delete();
}

async function addDocument(col, data) {
  return await db.collection(col).add({ ...data, _appKey: APP_WRITE_KEY });
}
