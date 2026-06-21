// Health Tab — Firebase status, collection counts, quick diagnostics

async function loadHealth() {
  const content = document.getElementById('tabContent');
  content.innerHTML = '<div class="loading"><span class="spinner"></span> Checking system health...</div>';

  try {
    const start = performance.now();
    const appSettings = await getDocument('settings', 'app');
    const responseTime = Math.round(performance.now() - start);

    // Collection counts — parallel fetch (much faster)
    const collections = ['users', 'orders', 'products', 'ledger', 'app_errors', 'support_tickets'];
    const results = await Promise.allSettled(collections.map(col => db.collection(col).get()));
    const counts = {};
    collections.forEach((col, i) => {
      counts[col] = results[i].status === 'fulfilled' ? results[i].value.size : -1;
    });

    const totalDocs = Object.values(counts).filter(c => c > 0).reduce((a, b) => a + b, 0);
    const errorCount = counts['app_errors'] || 0;
    const isMaintenanceOn = appSettings?.maintenance || false;

    content.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card green">
          <div class="stat-value">${responseTime}ms</div>
          <div class="stat-label">Response Time</div>
        </div>
        <div class="stat-card ${errorCount > 0 ? 'red' : 'green'}">
          <div class="stat-value">${errorCount}</div>
          <div class="stat-label">Active Errors</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-value">${totalDocs}</div>
          <div class="stat-label">Total Documents</div>
        </div>
        <div class="stat-card ${isMaintenanceOn ? 'red' : 'green'}">
          <div class="stat-value">${isMaintenanceOn ? 'ON' : 'OFF'}</div>
          <div class="stat-label">Maintenance</div>
        </div>
      </div>

      ${isMaintenanceOn ? '<div class="info-box warn">Maintenance mode is ON — retailers cannot access the app.</div>' : ''}
      ${errorCount > 5 ? '<div class="info-box error">High error count! Check Errors tab for details.</div>' : ''}
      ${responseTime > 500 ? '<div class="info-box warn">Slow response time. Firebase might be throttling.</div>' : ''}
      ${responseTime <= 200 && errorCount === 0 ? '<div class="info-box success">All systems healthy. No issues detected.</div>' : ''}

      <div class="card">
        <div class="card-title">Collection Status</div>
        ${collections.map((col, i) => `
          <div class="list-item">
            <div class="sn">${i + 1}</div>
            <div class="content">
              <div class="title">${col}</div>
            </div>
            <span class="badge ${counts[col] === -1 ? 'badge-red' : counts[col] > 100 ? 'badge-amber' : 'badge-green'}">${counts[col] === -1 ? 'ERROR' : counts[col] + ' docs'}</span>
          </div>
        `).join('')}
      </div>

      <div class="card">
        <div class="card-title">Quick Actions</div>
        <div class="btn-group">
          <button class="btn btn-primary" onclick="checkFirebaseStatus(); loadHealth();">Re-check Health</button>
          <button class="btn btn-info" onclick="switchTab('errors')">View Errors</button>
          <button class="btn btn-warn" onclick="switchTab('maintenance')">Maintenance</button>
        </div>
      </div>

      <div class="card" style="border-color:rgba(34,197,94,0.3)">
        <div class="card-title" style="color:#4ade80">Dev Console Sessions</div>
        <div id="devSessions"><span class="spinner" style="width:14px;height:14px"></span> Loading...</div>
      </div>

      <div class="card">
        <div class="card-title">Quick Fix Shortcuts</div>
        <div class="btn-group" style="flex-wrap:wrap">
          <button class="btn btn-sm" style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.25);color:var(--info)" onclick="switchTab('orders')">Find Order</button>
          <button class="btn btn-sm" style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);color:var(--warn)" onclick="switchTab('retailers')">Find Retailer</button>
          <button class="btn btn-sm" style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);color:var(--accent)" onclick="switchTab('tickets')">View Tickets</button>
          <button class="btn btn-sm" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);color:var(--danger)" onclick="quickClearAllSessions()">Kill All Sessions</button>
          <button class="btn btn-sm" style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.25);color:var(--info)" onclick="quickClearErrors()">Clear Old Errors</button>
        </div>
        <p style="font-size:10px;color:var(--text3);margin-top:8px">Common maintenance actions — no need to navigate.</p>
      </div>
    `;
    loadDevSessions();
  } catch (e) {
    content.innerHTML = `
      <div class="info-box error">
        <strong>Firebase Connection Failed</strong><br>
        ${e.message}<br><br>
        <strong>Possible fixes:</strong><br>
        • Check internet connection<br>
        • Verify Firebase project is active<br>
        • Check if Firestore is enabled in Firebase Console
      </div>
    `;
  }
}

// Dev Console Sessions — show who's logged in
async function loadDevSessions() {
  const el = document.getElementById('devSessions');
  if (!el) return;
  try {
    const doc = await getDocument('settings', 'devAccess');
    if (!doc || !doc.sessions || doc.sessions.length === 0) {
      el.innerHTML = '<div style="font-size:12px;color:var(--text3)">No active sessions</div>';
      return;
    }

    const cutoff = Date.now() - 60 * 60 * 1000; // 1 hour
    const active = doc.sessions.filter(s => new Date(s.lastActive).getTime() > cutoff);
    const stale = doc.sessions.filter(s => new Date(s.lastActive).getTime() <= cutoff);

    el.innerHTML = `
      <div style="margin-bottom:8px;font-size:11px;color:var(--text2)"><strong style="color:${active.length > 1 ? 'var(--danger)' : 'var(--accent)'}">${active.length}</strong> active, ${stale.length} expired</div>
      ${active.length > 1 ? '<div class="info-box error" style="margin-bottom:8px;font-size:11px">Multiple devices logged in! If this isn\'t you, kill all sessions immediately.</div>' : ''}
      ${doc.lastFailedAttempt ? `<div class="info-box warn" style="margin-bottom:8px;font-size:11px">Last failed login: ${formatDate(doc.lastFailedAttempt)} from ${doc.failedDevice || 'unknown'} (${doc.failedAttempts || '?'} attempts)</div>` : ''}
      ${active.map((s, i) => `
        <div class="list-item" style="padding:10px;border-color:${s.sessionId === sessionId ? 'rgba(34,197,94,0.4)' : 'var(--border)'}">
          <div style="width:8px;height:8px;border-radius:50%;background:var(--accent);animation:pulse 2s infinite;flex-shrink:0"></div>
          <div class="content">
            <div style="font-size:12px;font-weight:700;color:var(--text)">${s.device} • ${s.browser} • ${s.os} ${s.sessionId === sessionId ? '<span style="font-size:9px;color:var(--accent)">(You)</span>' : ''}</div>
            <div style="font-size:10px;color:var(--text3)">Login: ${formatDate(s.loginAt)} • Active: ${timeAgo(s.lastActive)}</div>
          </div>
          ${s.sessionId !== sessionId ? `<button class="btn btn-danger btn-sm" style="padding:4px 8px;font-size:9px" onclick="killDevSession('${s.sessionId}')">Kill</button>` : ''}
        </div>
      `).join('')}
      ${active.length > 1 ? '<button class="btn btn-danger btn-sm" onclick="killAllDevSessions()" style="margin-top:8px;width:100%">Kill All Other Sessions</button>' : ''}
    `;
  } catch (e) {
    el.innerHTML = '<div style="font-size:11px;color:var(--danger)">Failed to load sessions</div>';
  }
}

async function killDevSession(targetSessionId) {
  showConfirm('Kill Session', 'Terminate this dev console session?', async () => {
    try {
      const doc = await getDocument('settings', 'devAccess');
      if (doc && doc.sessions) {
        const updated = doc.sessions.filter(s => s.sessionId !== targetSessionId);
        await setDocument('settings', 'devAccess', { sessions: updated });
        showToast('Session killed');
        loadDevSessions();
      }
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  });
}

async function killAllDevSessions() {
  showConfirm('Kill All Sessions', 'Terminate ALL dev console sessions except yours?', async () => {
    try {
      const doc = await getDocument('settings', 'devAccess');
      if (doc && doc.sessions) {
        const onlyMine = doc.sessions.filter(s => s.sessionId === sessionId);
        await setDocument('settings', 'devAccess', { sessions: onlyMine });
        showToast('All other sessions killed');
        loadDevSessions();
      }
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  });
}

// Quick fix shortcuts from health tab
function quickClearAllSessions() {
  showConfirm('Kill All Sessions', 'Terminate ALL active retailer sessions? Everyone will be logged out.', async () => {
    try {
      const users = await getCollection('users');
      let count = 0;
      for (const u of users) {
        if (u.activeSession || (u.sessions && u.sessions.length)) {
          await setDocument('users', u.id, { activeSession: '', sessionExpiry: '', sessions: [] });
          count++;
        }
      }
      showToast(`${count} sessions killed`);
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  });
}

function quickClearErrors() {
  showConfirm('Clear Old Errors', 'Delete all resolved errors and errors older than 7 days?', async () => {
    try {
      const errors = await getCollection('app_errors');
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      let count = 0;
      for (const err of errors) {
        const isOld = err.timestamp && new Date(err.timestamp).getTime() < cutoff;
        if (err.resolved || isOld) {
          await deleteDocument('app_errors', err.id);
          count++;
        }
      }
      showToast(`${count} errors cleared`);
      loadHealth();
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  });
}
