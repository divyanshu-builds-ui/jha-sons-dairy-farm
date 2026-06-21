// Retailers Tab — Lookup users, check balance, quick fix actions

async function loadRetailers() {
  const content = document.getElementById('tabContent');
  content.innerHTML = `
    <div class="info-box info">Search retailers by phone or name. Check balance, reset PIN, unblock, fix dues.</div>

    <div class="card">
      <div class="card-title">Find Retailer</div>
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <input id="retSearch" class="input" placeholder="Phone or name..." style="flex:1">
        <button class="btn btn-primary btn-sm" onclick="searchRetailers()">Search</button>
      </div>
      <button class="btn btn-sm" onclick="listAllRetailers()" style="width:100%">Show All Retailers</button>
    </div>

    <div id="retResults"></div>
    <div id="retDetail" style="display:none"></div>
  `;
}

async function searchRetailers() {
  const q = document.getElementById('retSearch').value.trim().toLowerCase();
  const results = document.getElementById('retResults');
  if (!q) { showToast('Enter phone or name', 'error'); return; }
  results.innerHTML = '<div class="loading"><span class="spinner"></span> Searching...</div>';

  try {
    const snap = await db.collection('users').where('role', '==', 'retailer').get();
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const matched = all.filter(u => u.id.includes(q) || (u.name || '').toLowerCase().includes(q) || (u.shop || '').toLowerCase().includes(q));
    renderRetailerList(matched);
  } catch (e) { results.innerHTML = `<div class="info-box error">${e.message}</div>`; }
}

async function listAllRetailers() {
  const results = document.getElementById('retResults');
  results.innerHTML = '<div class="loading"><span class="spinner"></span> Loading...</div>';
  try {
    const snap = await db.collection('users').where('role', '==', 'retailer').get();
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    all.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    renderRetailerList(all);
  } catch (e) { results.innerHTML = `<div class="info-box error">${e.message}</div>`; }
}

function renderRetailerList(retailers) {
  const results = document.getElementById('retResults');
  document.getElementById('retDetail').style.display = 'none';
  if (retailers.length === 0) {
    results.innerHTML = '<div class="empty"><div class="empty-text">No retailers found</div></div>';
    return;
  }
  results.innerHTML = `
    <div style="margin:12px 0;font-size:12px;color:var(--text2);font-weight:700">${retailers.length} retailers</div>
    ${retailers.map(r => `
      <div class="list-item" style="cursor:pointer" onclick="openRetailerDetail('${r.id}')">
        <div style="width:8px;height:8px;border-radius:50%;flex-shrink:0;background:${r.blocked ? 'var(--danger)' : r.activeSession ? 'var(--accent)' : '#374151'}"></div>
        <div class="content">
          <div class="title">${r.name || 'Unknown'} ${r.blocked ? '<span class="badge badge-red" style="margin-left:4px">BLOCKED</span>' : ''}</div>
          <div class="subtitle">${r.id} • ${r.area || 'No area'} ${r.shop ? '• ' + r.shop : ''}</div>
        </div>
      </div>
    `).join('')}
  `;
}

async function openRetailerDetail(phone) {
  const detail = document.getElementById('retDetail');
  document.getElementById('retResults').style.display = 'none';
  detail.style.display = 'block';
  detail.innerHTML = '<div class="loading"><span class="spinner"></span> Loading...</div>';

  try {
    const userDoc = await db.collection('users').doc(phone).get();
    if (!userDoc.exists) { detail.innerHTML = '<div class="info-box error">User not found</div>'; return; }
    const u = userDoc.data();

    // Get balance
    const balDoc = await db.collection('retailer_balances').doc(phone).get();
    const balance = balDoc.exists ? (balDoc.data().balance || 0) : 0;

    // Get recent orders (last 5)
    const ordSnap = await db.collection('orders').where('phone', '==', phone).limit(5).get();
    const orders = ordSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    orders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    // Get recent ledger (last 5)
    const ledSnap = await db.collection('ledger').where('retailerId', '==', phone).limit(10).get();
    const ledger = ledSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    ledger.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    detail.innerHTML = `
      <button class="btn btn-sm" onclick="document.getElementById('retResults').style.display='block';document.getElementById('retDetail').style.display='none'" style="margin-bottom:12px;background:var(--surface2);color:var(--text2)">← Back to list</button>

      <div class="card">
        <div class="card-title">Profile</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">
          <div><span style="color:var(--text3)">Name:</span> <strong>${u.name || '-'}</strong></div>
          <div><span style="color:var(--text3)">Phone:</span> <strong>${phone}</strong></div>
          <div><span style="color:var(--text3)">Shop:</span> <strong>${u.shop || '-'}</strong></div>
          <div><span style="color:var(--text3)">Area:</span> <strong>${u.area || '-'}</strong></div>
          <div><span style="color:var(--text3)">PIN:</span> <strong>${u.pin || '-'}</strong></div>
          <div><span style="color:var(--text3)">Blocked:</span> <strong style="color:${u.blocked ? 'var(--danger)' : 'var(--accent)'}">${u.blocked ? 'YES' : 'No'}</strong></div>
          <div><span style="color:var(--text3)">Last Login:</span> <strong>${formatDate(u.lastLogin)}</strong></div>
          <div><span style="color:var(--text3)">Device:</span> <strong>${u.lastLoginDevice || '-'}</strong></div>
        </div>
      </div>

      <div class="card" style="border-color:${balance > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}">
        <div class="card-title">Balance / Dues</div>
        <div style="font-size:28px;font-weight:900;color:${balance > 0 ? 'var(--danger)' : 'var(--accent)'}">₹${balance.toFixed(2)}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:4px">${balance > 0 ? 'Outstanding dues' : balance === 0 ? 'No dues' : 'Advance payment'}</div>
        <div class="btn-group" style="margin-top:12px">
          <button class="btn btn-sm" style="background:var(--surface2);color:var(--text2)" onclick="fixBalance('${phone}', ${balance})">Edit Balance</button>
          <button class="btn btn-danger btn-sm" onclick="resetBalance('${phone}')">Reset to ₹0</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Quick Actions</div>
        <div class="btn-group">
          ${u.blocked ? `<button class="btn btn-warn btn-sm" onclick="quickUnblock('${phone}')">Unblock</button>` : ''}
          <button class="btn btn-info btn-sm" onclick="quickResetPin('${phone}')">Reset PIN → 1234</button>
          <button class="btn btn-sm" style="background:var(--surface2);color:var(--text2)" onclick="quickClearSession('${phone}')">Clear Session</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Recent Orders (${orders.length})</div>
        ${orders.length === 0 ? '<div style="font-size:12px;color:var(--text3)">No orders</div>' : orders.map(o => `
          <div class="list-item" style="padding:10px">
            <div class="content">
              <div style="display:flex;align-items:center;gap:6px">
                <span class="badge badge-${o.status === 'Delivered' ? 'green' : o.status === 'Cancelled' ? 'red' : 'amber'}">${o.status}</span>
                <span style="font-size:12px;font-weight:700">₹${(o.total || 0).toFixed(2)}</span>
                <span style="font-size:10px;color:var(--text3)">${o.date || ''}</span>
              </div>
              <div style="font-size:10px;color:var(--text3);margin-top:3px">${(o.items || []).map(i => i.name).join(', ').slice(0, 60)}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="card">
        <div class="card-title">Recent Ledger (${ledger.length})</div>
        ${ledger.length === 0 ? '<div style="font-size:12px;color:var(--text3)">No entries</div>' : ledger.slice(0, 5).map(l => `
          <div class="list-item" style="padding:10px">
            <div class="content">
              <div style="display:flex;align-items:center;gap:6px">
                <span class="badge badge-${l.type === 'credit' ? 'green' : 'red'}">${l.type === 'credit' ? 'PAID' : 'DEBIT'}</span>
                <span style="font-size:12px;font-weight:700">₹${(l.amount || 0).toFixed(2)}</span>
                <span style="font-size:10px;color:var(--text3)">${l.date || ''}</span>
              </div>
              <div style="font-size:10px;color:var(--text3);margin-top:2px">${l.note || '-'}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (e) { detail.innerHTML = `<div class="info-box error">${e.message}</div>`; }
}

function fixBalance(phone, current) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="text-align:left">
      <h3>Edit Balance</h3>
      <p style="font-size:12px;color:var(--text3)">Current: ₹${current.toFixed(2)}</p>
      <input type="number" id="newBalInput" class="input" placeholder="New balance amount" value="${current}" style="width:100%;margin:12px 0;font-size:16px;padding:12px">
      <div class="btn-group" style="justify-content:center">
        <button class="btn btn-primary" id="saveBalBtn">Save</button>
        <button class="btn" style="background:var(--surface2);color:var(--text2)" id="cancelBalBtn">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#cancelBalBtn').onclick = () => overlay.remove();
  overlay.querySelector('#saveBalBtn').onclick = async () => {
    const val = parseFloat(document.getElementById('newBalInput').value) || 0;
    try {
      await db.collection('retailer_balances').doc(phone).set({ balance: val, updatedAt: new Date().toISOString() }, { merge: true });
      showToast(`Balance set to ₹${val}`);
      overlay.remove();
      openRetailerDetail(phone);
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  };
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

function resetBalance(phone) {
  showConfirm('Reset Balance', `Set balance for ${phone} to ₹0? This clears all dues.`, async () => {
    try {
      await db.collection('retailer_balances').doc(phone).set({ balance: 0, updatedAt: new Date().toISOString() }, { merge: true });
      showToast('Balance reset to ₹0');
      openRetailerDetail(phone);
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  });
}

function quickUnblock(phone) {
  showConfirm('Unblock', `Unblock ${phone}?`, async () => {
    try {
      await db.collection('users').doc(phone).update({ blocked: false, loginAttempts: 0, blockReason: '', blockNote: '', blockedAt: '' });
      showToast('Unblocked');
      openRetailerDetail(phone);
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  });
}

function quickResetPin(phone) {
  showConfirm('Reset PIN', `Reset PIN for ${phone} to 1234?`, async () => {
    try {
      await db.collection('users').doc(phone).update({ pin: '1234' });
      showToast('PIN reset to 1234');
      openRetailerDetail(phone);
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  });
}

function quickClearSession(phone) {
  showConfirm('Clear Session', `End all active sessions for ${phone}?`, async () => {
    try {
      await db.collection('users').doc(phone).update({ activeSession: '', sessionExpiry: '', sessions: [] });
      showToast('Session cleared');
      openRetailerDetail(phone);
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  });
}
