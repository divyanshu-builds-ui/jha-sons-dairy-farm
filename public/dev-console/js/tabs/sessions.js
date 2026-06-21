// Sessions Tab — Full session management with device details

function parseDevice(ua) {
  if (!ua) return 'Unknown';
  if (ua.includes('iPhone')) return 'iPhone';
  if (ua.includes('iPad')) return 'iPad';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'Mac';
  if (ua.includes('Linux')) return 'Linux';
  return 'Unknown';
}

function parseBrowser(ua) {
  if (!ua) return 'Unknown';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'Browser';
}

function parseOS(ua) {
  if (!ua) return 'Unknown';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  return 'Unknown';
}

async function loadSessions() {
  const content = document.getElementById('tabContent');
  content.innerHTML = '<div class="loading"><span class="spinner"></span> Loading sessions...</div>';

  try {
    const users = await getCollection('users');
    const now = Date.now();

    const sessions = users.map(u => {
      const isActive = u.activeSession && u.sessionExpiry && new Date(u.sessionExpiry).getTime() > now;
      // Admin multi-device
      const adminActiveSessions = (u.role === 'admin' && u.sessions?.length)
        ? u.sessions.filter(s => new Date(s.expiresAt).getTime() > now)
        : [];
      const isAdminActive = adminActiveSessions.length > 0;

      return {
        ...u,
        phone: u.id,
        isActive: isActive || isAdminActive,
        adminActiveSessions,
      };
    }).sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0) || (b.lastLogin || '').localeCompare(a.lastLogin || ''));

    const activeCount = sessions.filter(s => s.isActive).length;
    const blockedCount = sessions.filter(s => s.blocked).length;
    const neverLogged = sessions.filter(s => !s.lastLogin).length;

    content.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card green">
          <div class="stat-value">${activeCount}</div>
          <div class="stat-label">Active Now</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-value">${sessions.length}</div>
          <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-card ${blockedCount > 0 ? 'red' : 'green'}">
          <div class="stat-value">${blockedCount}</div>
          <div class="stat-label">Blocked</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-value">${neverLogged}</div>
          <div class="stat-label">Never Logged</div>
        </div>
      </div>

      <div class="btn-group" style="margin-bottom:16px">
        <button class="btn btn-info btn-sm" onclick="loadSessions()">Refresh</button>
        ${activeCount > 1 ? `<button class="btn btn-danger btn-sm" onclick="forceLogoutAll()">Logout All (${activeCount})</button>` : ''}
      </div>

      <div>
        ${sessions.map((s, i) => {
          const device = parseDevice(s.deviceInfo);
          const browser = parseBrowser(s.deviceInfo);
          const os = parseOS(s.deviceInfo);
          const expiresIn = s.sessionExpiry ? Math.max(0, Math.round((new Date(s.sessionExpiry).getTime() - now) / 60000)) : 0;

          return `
            <div class="card" style="padding:14px;margin-bottom:10px;border-color:${s.isActive ? 'rgba(34,197,94,0.3)' : s.blocked ? 'rgba(239,68,68,0.3)' : 'var(--border)'}">
              <div style="display:flex;align-items:flex-start;gap:12px">
                <div class="sn">${i + 1}</div>
                <div style="width:10px;height:10px;border-radius:50%;margin-top:4px;flex-shrink:0;background:${s.isActive ? 'var(--accent)' : s.blocked ? 'var(--danger)' : '#374151'}${s.isActive ? ';animation:pulse 2s infinite' : ''}"></div>
                <div style="flex:1;min-width:0">
                  <!-- Name + badges -->
                  <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px">
                    <span style="font-size:14px;font-weight:700;color:var(--text)">${s.name || 'Unknown'}</span>
                    ${s.role === 'admin' ? '<span class="badge badge-amber">ADMIN</span>' : ''}
                    ${s.blocked ? '<span class="badge badge-red">BLOCKED</span>' : ''}
                    ${s.isActive ? '<span class="badge badge-green">ONLINE</span>' : ''}
                    ${s.adminActiveSessions.length > 1 ? `<span class="badge badge-blue">${s.adminActiveSessions.length} devices</span>` : ''}
                  </div>

                  <!-- Phone + Area -->
                  <div style="font-size:12px;color:var(--text3);margin-bottom:6px">
                    ${s.phone} • ${s.area || 'No area'} ${s.shop ? '• ' + s.shop : ''}
                  </div>

                  <!-- Device details -->
                  <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px">
                    ${s.deviceInfo ? `
                      <span style="font-size:10px;padding:3px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text2)">${device}</span>
                      <span style="font-size:10px;padding:3px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text2)">${browser}</span>
                      <span style="font-size:10px;padding:3px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text2)">${os}</span>
                    ` : '<span style="font-size:10px;color:var(--text3)">No device info</span>'}
                  </div>

                  <!-- Timing -->
                  <div style="font-size:11px;color:var(--text3)">
                    Last login: ${s.lastLogin ? formatDate(s.lastLogin) : 'Never'}
                    ${s.isActive && expiresIn > 0 ? ` • <span style="color:var(--accent)">Expires in ${expiresIn}m</span>` : ''}
                    ${s.blocked ? ` • <span style="color:var(--danger)">Login attempts: ${s.loginAttempts || '?'}</span>` : ''}
                  </div>

                  <!-- Admin multi-device sessions -->
                  ${s.adminActiveSessions.length > 0 ? `
                    <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">
                      <div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;margin-bottom:6px">Active Devices</div>
                      ${s.adminActiveSessions.map((sess, idx) => `
                        <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;margin-bottom:4px;font-size:11px">
                          <span style="width:6px;height:6px;border-radius:50%;background:var(--accent);flex-shrink:0"></span>
                          <span style="flex:1;color:var(--text2)">${sess.browser || '?'} • ${sess.os || '?'} • ${sess.device || '?'}</span>
                          <span style="color:var(--text3);font-size:10px">${sess.loginAt ? new Date(sess.loginAt).toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'}) : ''}</span>
                          <button class="btn btn-danger btn-sm" style="padding:3px 8px;font-size:9px" onclick="endAdminSession('${s.phone}','${sess.sessionId}')">End</button>
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}

                  <!-- Action buttons -->
                  <div class="btn-group" style="margin-top:8px">
                    ${s.isActive ? `<button class="btn btn-danger btn-sm" onclick="forceLogout('${s.phone}')">Force Logout</button>` : ''}
                    ${s.blocked ? `<button class="btn btn-warn btn-sm" onclick="unblockUser('${s.phone}')">Unblock</button>` : ''}
                    <button class="btn btn-info btn-sm" onclick="resetPin('${s.phone}')">Reset PIN</button>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (e) {
    content.innerHTML = `<div class="info-box error">Failed: ${e.message}</div>`;
  }
}

function forceLogout(phone) {
  showConfirm('Force Logout', `Terminate all sessions for ${phone}? They will be kicked out immediately.`, async () => {
    try {
      await setDocument('users', phone, { activeSession: '', sessionExpiry: '', sessions: [] });
      showToast('Session terminated');
      loadSessions();
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  });
}

function unblockUser(phone) {
  showConfirm('Unblock User', `Unblock ${phone}? They will be able to login again.`, async () => {
    try {
      await setDocument('users', phone, { blocked: false, loginAttempts: 0 });
      showToast('User unblocked');
      loadSessions();
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  });
}

function resetPin(phone) {
  showConfirm('Reset PIN', `Reset PIN for ${phone} to default (1234)?`, async () => {
    try {
      await setDocument('users', phone, { pin: '1234' });
      showToast('PIN reset to 1234');
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  });
}

function endAdminSession(phone, sessionId) {
  showConfirm('End Session', `End this specific device session?`, async () => {
    try {
      const user = await getDocument('users', phone);
      if (user && user.sessions) {
        const updated = user.sessions.filter(s => s.sessionId !== sessionId);
        await setDocument('users', phone, { sessions: updated });
        showToast('Device session ended');
        loadSessions();
      }
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  });
}

function forceLogoutAll() {
  showConfirm('Logout ALL Users', 'This will terminate every active session immediately. All users will be kicked out.', async () => {
    try {
      const users = await getCollection('users');
      for (const u of users) {
        if (u.activeSession || (u.sessions && u.sessions.length)) {
          await setDocument('users', u.id, { activeSession: '', sessionExpiry: '', sessions: [] });
        }
      }
      showToast('All sessions terminated');
      loadSessions();
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  });
}
