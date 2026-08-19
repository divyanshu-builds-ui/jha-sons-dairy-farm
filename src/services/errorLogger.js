import { db, collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, writeBatch, updateDoc } from './firebase';

const ERROR_COLLECTION = 'app_errors';
const MAX_ERRORS = 50;
const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 min — same error won't log again within this

// Known error patterns with solutions
const ERROR_SOLUTIONS = [
  {
    pattern: /Firebase.*permission-denied/i,
    title: 'Firebase Permission Denied',
    solution: 'Firestore security rules are blocking this operation. Check Firebase Console → Firestore → Rules. Make sure the user has read/write access to the collection being accessed.',
  },
  {
    pattern: /Firebase.*not-found/i,
    title: 'Firebase Document Not Found',
    solution: 'The document or collection does not exist in Firestore. Verify the document path is correct and the data has been created.',
  },
  {
    pattern: /Firebase.*unavailable/i,
    title: 'Firebase Unavailable',
    solution: 'Firebase server is unreachable. This is usually a network issue. Check internet connection. If persistent, check Firebase Status Dashboard (status.firebase.google.com).',
  },
  {
    pattern: /Firebase.*quota-exceeded/i,
    title: 'Firebase Quota Exceeded',
    solution: 'Free tier limits reached. Either upgrade to Blaze plan or reduce read/write operations. Check Firebase Console → Usage tab.',
  },
  {
    pattern: /ChunkLoadError|Loading chunk/i,
    title: 'Chunk Load Failed',
    solution: 'User has an outdated cached version. Fix: Force reload (Ctrl+Shift+R) or clear browser cache. This happens after new deployments when old chunks are no longer available.',
  },
  {
    pattern: /Network Error|ERR_NETWORK|Failed to fetch/i,
    title: 'Network Error',
    solution: 'No internet connection or server unreachable. Check: 1) User\'s internet 2) Firebase project status 3) CORS settings if custom API.',
  },
  {
    pattern: /Cannot read properties of (undefined|null)/i,
    title: 'Null/Undefined Access',
    solution: 'Code is trying to access a property on undefined/null. Add optional chaining (?.) or null checks before accessing the property. Check the stack trace for the exact line.',
  },
  {
    pattern: /Maximum update depth exceeded/i,
    title: 'Infinite Re-render Loop',
    solution: 'A useEffect or setState is causing infinite re-renders. Check: 1) useEffect dependencies 2) setState inside render 3) Object/array in dependency array without useMemo.',
  },
  {
    pattern: /Objects are not valid as a React child/i,
    title: 'Invalid React Child',
    solution: 'Trying to render an object/array directly in JSX. Use JSON.stringify() for debugging or map() for arrays. Check what variable is being rendered.',
  },
  {
    pattern: /ResizeObserver loop/i,
    title: 'ResizeObserver Loop (Harmless)',
    solution: 'This is a browser warning, not a real error. It happens when layout changes trigger more resize observations. Safe to ignore — does not affect functionality.',
  },
  {
    pattern: /QUOTA_BYTES|storage.*quota/i,
    title: 'LocalStorage Full',
    solution: 'Browser localStorage is full (~5MB limit). Clear old/unused data from localStorage. Check what\'s stored with: Object.keys(localStorage).map(k => k + ": " + localStorage[k].length)',
  },
  {
    pattern: /timeout|ETIMEDOUT/i,
    title: 'Request Timeout',
    solution: 'Firebase or network request took too long. Causes: 1) Slow internet 2) Large data query 3) Firebase cold start. Add timeout handling and retry logic.',
  },
];

export const getErrorSolution = (errorMessage) => {
  for (const entry of ERROR_SOLUTIONS) {
    if (entry.pattern.test(errorMessage)) {
      return { title: entry.title, solution: entry.solution };
    }
  }
  return { title: 'Unknown Error', solution: 'Check the  stack trace for the source file and line number. Search the error message online for community solutions.' };
};

// In-memory dedup cache
const recentErrors = new Map();

export const logError = async (error, context = '') => {
  try {
    const msg = error.message || String(error);
    // Dedup: skip if same error logged within DEDUP_WINDOW
    const key = msg.slice(0, 80);
    const lastLogged = recentErrors.get(key);
    if (lastLogged && Date.now() - lastLogged < DEDUP_WINDOW_MS) return;
    recentErrors.set(key, Date.now());
    // Keep dedup cache small
    if (recentErrors.size > 30) {
      const first = recentErrors.keys().next().value;
      recentErrors.delete(first);
    }

    const errorData = {
      message: msg,
      stack: error.stack || '',
      context,
      url: window.location.href,
      userAgent: navigator.userAgent.slice(0, 150),
      timestamp: new Date().toISOString(),
      user: JSON.parse(localStorage.getItem('lg_user') || '{}').phone || 'unknown',
      severity: getSeverity(msg),
    };
    await addDoc(collection(db, ERROR_COLLECTION), errorData);
  } catch (e) {
    console.warn('Failed to log error:', e);
  }
};

const getSeverity = (msg) => {
  if (/ResizeObserver|Non-Error/i.test(msg)) return 'low';
  if (/ChunkLoad|Network/i.test(msg)) return 'medium';
  if (/permission|quota|Maximum update/i.test(msg)) return 'high';
  return 'medium';
};

export const getErrors = async () => {
  try {
    const snap = await getDocs(query(collection(db, ERROR_COLLECTION), orderBy('timestamp', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, MAX_ERRORS);
  } catch (e) {
    // Fallback without orderBy (no index)
    const snap = await getDocs(collection(db, ERROR_COLLECTION));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    return list.slice(0, MAX_ERRORS);
  }
};

export const clearErrors = async () => {
  try {
    const snap = await getDocs(collection(db, ERROR_COLLECTION));
    // Batch delete (max 500 per batch)
    const batchSize = 500;
    for (let i = 0; i < snap.docs.length; i += batchSize) {
      const batch = writeBatch(db);
      snap.docs.slice(i, i + batchSize).forEach(d => batch.delete(doc(db, ERROR_COLLECTION, d.id)));
      await batch.commit();
    }
  } catch (e) {
    console.warn('Failed to clear errors:', e);
  }
};

export const resolveError = async (errorId) => {
  try {
    await updateDoc(doc(db, ERROR_COLLECTION, errorId), { resolved: true, resolvedAt: new Date().toISOString() });
  } catch (e) {}
};

// Global error listeners
export const initErrorTracking = () => {
  // Catch unhandled JS errors
  window.addEventListener('error', (event) => {
    if (event.message?.includes('ResizeObserver')) return; // Ignore harmless
    logError({
      message: event.message,
      stack: `${event.filename}:${event.lineno}:${event.colno}`,
    }, 'window.onerror');
  });

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    logError({
      message: error?.message || String(error),
      stack: error?.stack || '',
    }, 'unhandledrejection');
  });

  // Intercept console.error to catch React errors, component crashes, etc.
  const originalConsoleError = console.error;
  console.error = (...args) => {
    originalConsoleError.apply(console, args);
    try {
      const msg = args.map(a => typeof a === 'string' ? a : a?.message || JSON.stringify(a)).join(' ');
      // Skip React dev warnings (not real errors)
      if (/Warning:|React does not recognize|validateDOMNesting|Each child in a list/i.test(msg)) return;
      // Skip duplicate of what window.onerror already catches
      if (/ResizeObserver/i.test(msg)) return;
      // Log actual errors
      if (/error|Error|failed|Failed|crash|Crash|Cannot|TypeError|ReferenceError|SyntaxError/i.test(msg)) {
        logError({
          message: msg.slice(0, 500),
          stack: args[0]?.stack || new Error().stack || '',
        }, 'console.error');
      }
    } catch (e) {}
  };
};
