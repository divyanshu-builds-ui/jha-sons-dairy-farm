// Maintenance Tab — Toggle maintenance, site block, manage app state

async function loadMaintenance() {
  const content = document.getElementById('tabContent');
  content.innerHTML = '<div class="loading"><span class="spinner"></span> Loading settings...</div>';

  try {
    const appSettings = await getDocument('settings', 'app');
    const banner = await getDocument('settings', 'banner');
    const isMaintenanceOn = appSettings?.maintenance || false;
    const hasBanner = banner?.active && banner?.message;
    const siteBlock = appSettings?.siteBlock || {};
    const isBlocked = siteBlock.enabled || false;

    content.innerHTML = `
      ${isBlocked ? '<div class="info-box error">SITE BLOCKED — Entire website is down for everyone except developer. Reason: ' + (siteBlock.reason || 'unknown') + '</div>' : ''}
      ${isMaintenanceOn && !isBlocked ? '<div class="info-box error">MAINTENANCE MODE IS ON — All retailers are blocked from accessing the app.</div>' : ''}

      <!-- Site Block Section -->
      <div class="card">
        <div class="card-title">Site Block (Full Shutdown)</div>
        <div class="toggle-row" style="border:none;padding:0;background:none;margin:0;margin-bottom:12px">
          <div class="toggle-info">
            <div class="toggle-label">Block Entire Website ${isBlocked ? '<span class="badge badge-red">ACTIVE</span>' : ''}</div>
            <div class="toggle-desc">Blocks EVERYONE (admin + retailers). Only developer can access. Use for payment issues or critical situations.</div>
          </div>
          <div class="toggle ${isBlocked ? 'on' : ''}" onclick="${isBlocked ? 'disableSiteBlock()' : 'showSiteBlockForm()'}"></div>
        </div>
        ${isBlocked ? (
          '<div style="background:var(--surface2);border-radius:8px;padding:12px;font-size:11px;color:var(--text2)">' +
          '<div><strong>Reason:</strong> ' + (siteBlock.reason || '-') + '</div>' +
          '<div><strong>Title:</strong> ' + (siteBlock.title || '-') + '</div>' +
          '<div><strong>Message:</strong> ' + (siteBlock.message || '-') + '</div>' +
          '<div><strong>Since:</strong> ' + formatDate(siteBlock.blockedAt) + '</div>' +
          '</div>'
        ) : ''}
        <div id="siteBlockForm" style="display:none;margin-top:12px">
          <div style="margin-bottom:8px">
            <label style="font-size:10px;color:var(--text3);font-weight:700">Reason</label>
            <select id="blockReason" style="width:100%;padding:8px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12px;margin-top:4px">
              <option value="payment">Payment Pending</option>
              <option value="maintenance">Major Maintenance</option>
              <option value="security">Security Issue</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div style="margin-bottom:8px">
            <label style="font-size:10px;color:var(--text3);font-weight:700">Title (shown on block page)</label>
            <input id="blockTitle" type="text" placeholder="e.g. Service Suspended" value="Service Suspended" style="width:100%;padding:8px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12px;margin-top:4px">
          </div>
          <div style="margin-bottom:8px">
            <label style="font-size:10px;color:var(--text3);font-weight:700">Message (shown below title)</label>
            <input id="blockMessage" type="text" placeholder="e.g. Suspended due to pending payment." value="बकाया भुगतान के कारण आपकी सेवा बंद कर दी गई है।" style="width:100%;padding:8px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12px;margin-top:4px">
          </div>
          <div style="margin-bottom:12px">
            <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text2);cursor:pointer">
              <input id="blockShowPayment" type="checkbox" checked onchange="document.getElementById('invoiceFields').style.display=this.checked?'block':'none'"> Show payment/invoice details to admin
            </label>
          </div>
          <div id="invoiceFields">
            <div style="font-size:10px;color:var(--accent);font-weight:700;margin-bottom:6px;margin-top:8px">INVOICE DETAILS (shown to admin only)</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
              <div>
                <label style="font-size:9px;color:var(--text3);font-weight:700">Invoice No.</label>
                <input id="blockInvNumber" type="text" value="LGD-2026-004" style="width:100%;padding:6px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:11px;margin-top:2px">
              </div>
              <div>
                <label style="font-size:9px;color:var(--text3);font-weight:700">Project Name</label>
                <input id="blockInvProject" type="text" value="Lucy Garden PWA" style="width:100%;padding:6px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:11px;margin-top:2px">
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px">
              <div>
                <label style="font-size:9px;color:var(--text3);font-weight:700">Total (₹)</label>
                <input id="blockInvTotal" type="number" value="20000" style="width:100%;padding:6px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:11px;margin-top:2px">
              </div>
              <div>
                <label style="font-size:9px;color:var(--text3);font-weight:700">Paid (₹)</label>
                <input id="blockInvPaid" type="number" value="6000" style="width:100%;padding:6px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:11px;margin-top:2px">
              </div>
              <div>
                <label style="font-size:9px;color:var(--text3);font-weight:700">Due (₹)</label>
                <input id="blockInvDue" type="number" value="14000" style="width:100%;padding:6px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:11px;margin-top:2px">
              </div>
            </div>
            <div style="font-size:10px;color:var(--accent);font-weight:700;margin-bottom:6px;margin-top:10px">PAYMENT INFO</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
              <div>
                <label style="font-size:9px;color:var(--text3);font-weight:700">UPI ID</label>
                <input id="blockUpiId" type="text" value="8051725780@ybl" style="width:100%;padding:6px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:11px;margin-top:2px">
              </div>
              <div>
                <label style="font-size:9px;color:var(--text3);font-weight:700">UPI Name</label>
                <input id="blockUpiName" type="text" value="DIVYANSHU KUMAR" style="width:100%;padding:6px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:11px;margin-top:2px">
              </div>
              <div>
                <label style="font-size:9px;color:var(--text3);font-weight:700">A/C No.</label>
                <input id="blockAccNo" type="text" value="008710839088" style="width:100%;padding:6px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:11px;margin-top:2px">
              </div>
              <div>
                <label style="font-size:9px;color:var(--text3);font-weight:700">IFSC</label>
                <input id="blockIfsc" type="text" value="IPOS0000001" style="width:100%;padding:6px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:11px;margin-top:2px">
              </div>
            </div>
          </div>
          <button class="btn btn-danger" onclick="enableSiteBlock()">Block Site Now</button>
          <button class="btn btn-info btn-sm" style="margin-left:8px" onclick="document.getElementById('siteBlockForm').style.display='none'">Cancel</button>
        </div>
      </div>

      <!-- Maintenance Section -->
      <div class="card">
        <div class="card-title">Maintenance Mode (Retailers Only)</div>
        <div class="toggle-row" style="border:none;padding:0;background:none;margin:0">
          <div class="toggle-info">
            <div class="toggle-label">Block Retailers Only</div>
            <div class="toggle-desc">Retailers see "Under Maintenance" page. Admin & Dev still have access.</div>
          </div>
          <div class="toggle ${isMaintenanceOn ? 'on' : ''}" onclick="toggleMaintenance(${!isMaintenanceOn})"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Live Banner</div>
        ${hasBanner ? `
          <div class="info-box warn" style="margin-bottom:12px">
            <div>
              <strong>Active Banner:</strong> ${banner.message}<br>
              <span style="font-size:10px;opacity:0.7">Type: ${banner.type} • Target: ${banner.target} • Expires: ${formatDate(banner.expiresAt)}</span>
            </div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="clearBanner()">Clear Banner</button>
        ` : '<div style="color:var(--text3);font-size:12px">No active banner</div>'}
      </div>

      <div class="card">
        <div class="card-title">Emergency Actions</div>
        <div class="btn-group">
          <button class="btn btn-danger" onclick="emergencyShutdown()">Emergency Shutdown</button>
          <button class="btn btn-primary" onclick="emergencyRestore()">Restore All Access</button>
        </div>
        <p style="font-size:10px;color:var(--text3);margin-top:8px">Emergency Shutdown = Maintenance ON + Clear all sessions + Clear banner<br>Restore All = Maintenance OFF + Site Block OFF</p>
      </div>
    `;
  } catch (e) {
    content.innerHTML = `<div class="info-box error">Failed: ${e.message}</div>`;
  }
}

function showSiteBlockForm() {
  document.getElementById('siteBlockForm').style.display = 'block';
}

function enableSiteBlock() {
  const reason = document.getElementById('blockReason').value;
  const title = document.getElementById('blockTitle').value.trim() || 'Service Suspended';
  const message = document.getElementById('blockMessage').value.trim() || 'This application has been temporarily suspended.';
  const showPayment = document.getElementById('blockShowPayment').checked;

  const invoice = {
    number: document.getElementById('blockInvNumber').value.trim(),
    project: document.getElementById('blockInvProject').value.trim(),
    total: Number(document.getElementById('blockInvTotal').value) || 0,
    paid: Number(document.getElementById('blockInvPaid').value) || 0,
    due: Number(document.getElementById('blockInvDue').value) || 0,
  };
  const upi = {
    id: document.getElementById('blockUpiId').value.trim(),
    name: document.getElementById('blockUpiName').value.trim(),
    account: document.getElementById('blockAccNo').value.trim(),
    ifsc: document.getElementById('blockIfsc').value.trim(),
  };

  showConfirm(
    'BLOCK ENTIRE SITE',
    'This will block EVERYONE (admin + retailers) from accessing the website. Only you (developer) will have access.\n\nReason: ' + reason + '\nTitle: ' + title + '\nDue: ₹' + invoice.due,
    async () => {
      try {
        await setDocument('settings', 'app', {
          siteBlock: {
            enabled: true,
            reason,
            title,
            message,
            showPayment,
            blockedAt: new Date().toISOString(),
            contact: { name: 'Divyanshu Gupta', phone: '8051725780' },
            invoice,
            upi,
          }
        });
        showToast('Site BLOCKED — everyone is locked out');
        loadMaintenance();
      } catch (e) { showToast('Failed: ' + e.message, 'error'); }
    }
  );
}

function disableSiteBlock() {
  showConfirm(
    'Remove Site Block',
    'This will restore access for everyone. Are you sure?',
    async () => {
      try {
        await setDocument('settings', 'app', {
          siteBlock: { enabled: false }
        });
        showToast('Site block removed — access restored');
        loadMaintenance();
      } catch (e) { showToast('Failed: ' + e.message, 'error'); }
    }
  );
}

function toggleMaintenance(newValue) {
  showConfirm(
    newValue ? 'Enable Maintenance' : 'Disable Maintenance',
    newValue ? 'This will block ALL retailers immediately. Admin can still access.' : 'Retailers will be able to access the app again.',
    async () => {
      try {
        await setDocument('settings', 'app', { maintenance: newValue });
        showToast(newValue ? 'Maintenance ON — retailers blocked' : 'Maintenance OFF — app is live');
        loadMaintenance();
      } catch (e) { showToast('Failed: ' + e.message, 'error'); }
    }
  );
}

function clearBanner() {
  showConfirm('Clear Banner', 'Remove the active banner for all users?', async () => {
    try {
      await setDocument('settings', 'banner', { active: false, message: '' });
      showToast('Banner cleared');
      loadMaintenance();
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  });
}

function emergencyShutdown() {
  showConfirm('EMERGENCY SHUTDOWN', 'This will:\n• Turn ON maintenance mode\n• Terminate ALL active sessions\n• Clear any active banner\n\nRetailers will be completely locked out.', async () => {
    try {
      // Maintenance ON
      await setDocument('settings', 'app', { maintenance: true });
      // Clear banner
      await setDocument('settings', 'banner', { active: false, message: '' });
      // Kill all sessions
      const users = await getCollection('users');
      for (const u of users) {
        if (u.activeSession) {
          await setDocument('users', u.id, { activeSession: '', sessionExpiry: '', sessions: [] });
        }
      }
      showToast('Emergency shutdown complete');
      loadMaintenance();
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  });
}

function emergencyRestore() {
  showConfirm('Restore All Access', 'Turn OFF maintenance + Remove site block. Everything goes live?', async () => {
    try {
      await setDocument('settings', 'app', { maintenance: false, siteBlock: { enabled: false } });
      showToast('All access restored — app is live');
      loadMaintenance();
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  });
}
