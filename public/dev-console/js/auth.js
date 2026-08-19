// PIN Authentication with device tracking & session logging

const DEV_PIN = '0000'; // Fallback
let correctPin = DEV_PIN;
let attempts = 0;
let sessionId = null;

// Progressive lockout for dev console: 60s → 5min → 30min → 2hr (NO permanent block)
const DEV_LOCKOUT_TIERS = [60, 300, 1800, 7200]; // seconds
let lockTier = 0;
let lockUntil = 0;

// Device info
function getDeviceInfo() {
  const ua = navigator.userAgent || '';
  let device = 'Unknown', browser = 'Unknown', os = 'Unknown';
  if (ua.includes('iPhone')) device = 'iPhone';
  else if (ua.includes('iPad')) device = 'iPad';
  else if (ua.includes('Android')) device = 'Android';
  else if (ua.includes('Windows')) device = 'Windows PC';
  else if (ua.includes('Mac')) device = 'Mac';
  else if (ua.includes('Linux')) device = 'Linux';

  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';

  if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return { device, browser, os, ua: ua.slice(0, 150) };
}

function generateSessionId() {
  return 'dev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

// Load PIN from Firebase
async function loadPin() {
  try {
    const doc = await getDocument('settings', 'devAccess');
    if (doc && doc.pin) correctPin = doc.pin;
  } catch (e) { /* use fallback */ }
}
loadPin();

// Check if already verified this session
if (sessionStorage.getItem('dev_console_verified')) {
  sessionId = sessionStorage.getItem('dev_console_session_id');
  document.getElementById('lockScreen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  setTimeout(() => initApp(), 100);
  // Refresh heartbeat
  setTimeout(() => updateHeartbeat(), 2000);
}

// PIN input — auto submit on 4 digits
document.getElementById('pinInput').addEventListener('input', function() {
  if (this.value.length === 4) verifyPin();
});

document.getElementById('pinInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') verifyPin();
});

async function verifyPin() {
  const input = document.getElementById('pinInput');
  const error = document.getElementById('pinError');
  const pin = input.value;

  // Check lockout
  if (lockUntil > Date.now()) {
    const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
    const label = remaining >= 60 ? `${Math.floor(remaining/60)}m ${remaining%60}s` : `${remaining}s`;
    error.textContent = `Locked — wait ${label}`;
    input.value = '';
    return;
  }

  if (pin === correctPin) {
    // Reset lockout on success
    attempts = 0;
    lockTier = 0;
    lockUntil = 0;
    sessionStorage.removeItem('dev_console_lock');

    sessionId = generateSessionId();
    sessionStorage.setItem('dev_console_verified', 'true');
    sessionStorage.setItem('dev_console_session_id', sessionId);
    document.getElementById('lockScreen').style.display = 'none';
    document.getElementById('app').style.display = 'block';

    // Log successful login to Firebase
    await logDevSession('login');
    initApp();
  } else {
    attempts++;
    input.value = '';

    // Log failed attempt
    logFailedAttempt(attempts);

    if (attempts >= 5) {
      // Progressive lockout (NEVER permanent)
      lockTier = Math.min(lockTier + 1, DEV_LOCKOUT_TIERS.length);
      const duration = DEV_LOCKOUT_TIERS[Math.min(lockTier - 1, DEV_LOCKOUT_TIERS.length - 1)];
      lockUntil = Date.now() + duration * 1000;
      attempts = 0;

      // Save lockout state (survives page reload)
      sessionStorage.setItem('dev_console_lock', JSON.stringify({ lockUntil, lockTier }));

      const label = duration >= 60 ? `${Math.floor(duration/60)} min` : `${duration}s`;
      error.textContent = `Too many attempts. Locked for ${label}.`;
      startCountdown(error);
    } else {
      error.textContent = `Wrong PIN (${5 - attempts} attempts left)`;
    }
  }
}

function startCountdown(errorEl) {
  const interval = setInterval(() => {
    const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
    if (remaining <= 0) {
      clearInterval(interval);
      errorEl.textContent = 'You can try again now.';
      return;
    }
    const label = remaining >= 60 ? `${Math.floor(remaining/60)}m ${remaining%60}s` : `${remaining}s`;
    errorEl.textContent = `Locked — wait ${label}`;
  }, 1000);
}

// Restore lockout state on page load
(function restoreLockState() {
  try {
    const stored = sessionStorage.getItem('dev_console_lock');
    if (stored) {
      const { lockUntil: lu, lockTier: lt } = JSON.parse(stored);
      if (lu > Date.now()) {
        lockUntil = lu;
        lockTier = lt;
        const error = document.getElementById('pinError');
        if (error) startCountdown(error);
      } else {
        sessionStorage.removeItem('dev_console_lock');
      }
    }
  } catch (e) {}
})();

// Log dev session to Firebase
async function logDevSession(action) {
  try {
    const info = getDeviceInfo();
    const sessionData = {
      sessionId,
      action,
      device: info.device,
      browser: info.browser,
      os: info.os,
      ua: info.ua,
      loginAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      active: true,
      _appKey: APP_WRITE_KEY
    };
    await db.collection('settings').doc('devAccess').set({
      sessions: firebase.firestore.FieldValue.arrayUnion(sessionData),
      lastLogin: new Date().toISOString(),
      lastDevice: `${info.device} • ${info.browser} • ${info.os}`,
      _appKey: APP_WRITE_KEY
    }, { merge: true });
  } catch (e) { console.warn('Session log failed:', e.message); }
}

// Log failed PIN attempts
async function logFailedAttempt(count) {
  try {
    const info = getDeviceInfo();
    await db.collection('settings').doc('devAccess').set({
      lastFailedAttempt: new Date().toISOString(),
      failedDevice: `${info.device} • ${info.browser} • ${info.os}`,
      failedAttempts: count,
      failedUA: info.ua,
      _appKey: APP_WRITE_KEY
    }, { merge: true });
  } catch (e) {}
}

// Heartbeat — update lastActive every 2 minutes
async function updateHeartbeat() {
  if (!sessionId) return;
  try {
    const doc = await getDocument('settings', 'devAccess');
    if (doc && doc.sessions) {
      const updated = doc.sessions.map(s => {
        if (s.sessionId === sessionId) return { ...s, lastActive: new Date().toISOString() };
        return s;
      });
      await db.collection('settings').doc('devAccess').set({ sessions: updated, _appKey: APP_WRITE_KEY }, { merge: true });
    }
  } catch (e) {}
}
setInterval(updateHeartbeat, 2 * 60 * 1000); // every 2 min

// Cleanup stale sessions (older than 1 hour = inactive)
async function cleanStaleSessions() {
  try {
    const doc = await getDocument('settings', 'devAccess');
    if (doc && doc.sessions) {
      const cutoff = Date.now() - 60 * 60 * 1000; // 1 hour
      const active = doc.sessions.filter(s => new Date(s.lastActive).getTime() > cutoff);
      if (active.length !== doc.sessions.length) {
        await db.collection('settings').doc('devAccess').set({ sessions: active, _appKey: APP_WRITE_KEY }, { merge: true });
      }
    }
  } catch (e) {}
}
setTimeout(cleanStaleSessions, 5000); // run on load

function logout() {
  showConfirm('Logout', 'Are you sure you want to logout from Emergency Console?', async () => {
    // Remove this session from Firebase
    try {
      const doc = await getDocument('settings', 'devAccess');
      if (doc && doc.sessions) {
        const updated = doc.sessions.filter(s => s.sessionId !== sessionId);
        await db.collection('settings').doc('devAccess').set({ sessions: updated, _appKey: APP_WRITE_KEY }, { merge: true });
      }
    } catch (e) {}
    sessionStorage.removeItem('dev_console_verified');
    sessionStorage.removeItem('dev_console_session_id');
    window.location.reload();
  });
}

// On tab close — mark session inactive
window.addEventListener('beforeunload', () => {
  if (!sessionId) return;
  try {
    const doc = db.collection('settings').doc('devAccess');
    // Best effort — may not complete
    navigator.sendBeacon && navigator.sendBeacon('about:blank'); // trigger unload
  } catch (e) {}
});
