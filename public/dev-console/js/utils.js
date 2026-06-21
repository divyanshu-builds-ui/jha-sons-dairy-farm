// Utility functions

// SVG Icons (Lucide-style) — no emojis
const icons = {
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  alert: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  shield: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  trash: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>',
  refresh: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>',
  bulb: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
  db: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/></svg>',
  zap: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  power: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" x2="12" y1="2" y2="12"/></svg>',
};

function icon(name, size) {
  return (icons[name] || '').replace(/width="\d+"/, `width="${size||14}"`).replace(/height="\d+"/, `height="${size||14}"`);
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  setTimeout(() => { toast.className = 'toast hidden'; }, 3000);
}

function showConfirm(title, message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h3>${title}</h3>
      <p>${message}</p>
      <div class="btn-group">
        <button class="btn btn-danger" id="confirmYes">Confirm</button>
        <button class="btn" style="background:var(--surface2);color:var(--text2)" id="confirmNo">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#confirmYes').onclick = () => { overlay.remove(); onConfirm(); };
  overlay.querySelector('#confirmNo').onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

// Error solution matcher
const ERROR_SOLUTIONS = [
  { pattern: /permission-denied/i, title: 'Permission Denied', solution: 'Firestore rules blocking this operation. Check Firebase Console → Firestore → Rules.' },
  { pattern: /not-found/i, title: 'Document Not Found', solution: 'Document/collection does not exist. Verify the path is correct.' },
  { pattern: /unavailable/i, title: 'Firebase Unavailable', solution: 'Network issue. Check internet connection or Firebase Status page.' },
  { pattern: /quota-exceeded/i, title: 'Quota Exceeded', solution: 'Free tier limit reached. Wait 24h or upgrade to Blaze plan.' },
  { pattern: /ChunkLoadError|Loading chunk/i, title: 'Chunk Load Failed', solution: 'Outdated cache. Users need to hard refresh (Ctrl+Shift+R) or clear cache.' },
  { pattern: /Network Error|Failed to fetch/i, title: 'Network Error', solution: 'No internet or server unreachable. Check connectivity.' },
  { pattern: /Cannot read properties of (undefined|null)/i, title: 'Null Access Error', solution: 'Code accessing property on undefined. Check stack trace for exact line. Add optional chaining (?.).' },
  { pattern: /Maximum update depth/i, title: 'Infinite Loop', solution: 'useEffect or setState causing infinite re-renders. Check dependency arrays.' },
  { pattern: /ResizeObserver/i, title: 'ResizeObserver (Harmless)', solution: 'Browser warning, not a real error. Safe to ignore.' },
];

function getErrorSolution(message) {
  for (const entry of ERROR_SOLUTIONS) {
    if (entry.pattern.test(message)) return entry;
  }
  return { title: 'Unknown Error', solution: 'Check stack trace for source file and line number. Search error message online.' };
}
