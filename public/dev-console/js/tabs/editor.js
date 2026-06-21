// Doc Editor Tab — Read, edit, delete any document

const EDITOR_COLLECTIONS = ['users', 'products', 'orders', 'order_history', 'ledger', 'retailer_balances', 'settings', 'support_tickets', 'announcements', 'app_errors', 'app_ratings', 'audit_log', 'company_orders', 'daily_stock'];

let editorSelectedCol = '';
let editorDocId = '';

function loadDocEditor() {
  const content = document.getElementById('tabContent');
  content.innerHTML = `
    <div class="info-box info">Read, edit, or delete any document in any collection.</div>

    <div class="card">
      <div class="card-title">1. Select Collection</div>
      <select id="editorCol" onchange="editorColChange()" class="input" style="width:100%">
        <option value="">Select collection...</option>
        ${EDITOR_COLLECTIONS.map(c => `<option value="${c}">${c}</option>`).join('')}
      </select>
    </div>

    <div id="editorFetch" style="display:none">
      <div class="card">
        <div class="card-title">2. Find Document</div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <input id="editorDocId" class="input" placeholder="Document ID..." style="flex:1">
          <button class="btn btn-primary btn-sm" onclick="editorFetchById()">Fetch</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <input id="editorField" class="input" placeholder="Field (e.g. phone)">
          <input id="editorValue" class="input" placeholder="Value...">
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-sm" onclick="editorSearch()" style="flex:1;background:#1e40af;color:#fff">Search</button>
          <button class="btn btn-sm" onclick="editorListAll()" style="flex:1">List First 20</button>
        </div>
      </div>
    </div>

    <div id="editorList" style="display:none"></div>
    <div id="editorPanel" style="display:none"></div>
    <div id="editorMsg"></div>
  `;
}

function editorColChange() {
  editorSelectedCol = document.getElementById('editorCol').value;
  document.getElementById('editorFetch').style.display = editorSelectedCol ? 'block' : 'none';
  document.getElementById('editorList').style.display = 'none';
  document.getElementById('editorPanel').style.display = 'none';
  document.getElementById('editorMsg').innerHTML = '';
}

async function editorFetchById() {
  const id = document.getElementById('editorDocId').value.trim();
  if (!id || !editorSelectedCol) return;
  editorDocId = id;
  try {
    const doc = await db.collection(editorSelectedCol).doc(id).get();
    if (doc.exists) { showEditorPanel(doc.data()); }
    else { document.getElementById('editorMsg').innerHTML = '<div class="info-box error">Document not found</div>'; }
  } catch (e) { document.getElementById('editorMsg').innerHTML = `<div class="info-box error">${e.message}</div>`; }
}

async function editorSearch() {
  const field = document.getElementById('editorField').value.trim();
  const value = document.getElementById('editorValue').value.trim();
  if (!field || !value || !editorSelectedCol) return;
  try {
    const snap = await db.collection(editorSelectedCol).where(field, '==', value).get();
    if (snap.empty) { document.getElementById('editorMsg').innerHTML = '<div class="info-box warning">No docs found</div>'; return; }
    showEditorList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) { document.getElementById('editorMsg').innerHTML = `<div class="info-box error">${e.message}</div>`; }
}

async function editorListAll() {
  if (!editorSelectedCol) return;
  try {
    const snap = await db.collection(editorSelectedCol).limit(20).get();
    showEditorList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) { document.getElementById('editorMsg').innerHTML = `<div class="info-box error">${e.message}</div>`; }
}

function showEditorList(docs) {
  const el = document.getElementById('editorList');
  el.style.display = 'block';
  el.innerHTML = `
    <div class="card">
      <div class="card-title">Results (${docs.length})</div>
      ${docs.map(d => `
        <div class="list-item" style="cursor:pointer" onclick="editorSelectDoc('${d.id}')">
          <div class="content">
            <div class="title">${d.id}</div>
            <div class="subtitle">${d.name || d.phone || d.retailer || d.message || JSON.stringify(d).slice(0, 50)}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

async function editorSelectDoc(id) {
  editorDocId = id;
  document.getElementById('editorDocId').value = id;
  try {
    const doc = await db.collection(editorSelectedCol).doc(id).get();
    if (doc.exists) showEditorPanel(doc.data());
  } catch (e) { document.getElementById('editorMsg').innerHTML = `<div class="info-box error">${e.message}</div>`; }
}

function showEditorPanel(data) {
  const el = document.getElementById('editorPanel');
  el.style.display = 'block';
  document.getElementById('editorList').style.display = 'none';
  document.getElementById('editorMsg').innerHTML = '';
  el.innerHTML = `
    <div class="card">
      <div class="card-title" style="color:#4ade80">${editorSelectedCol} / ${editorDocId}</div>
      <textarea id="editorTextarea" class="input" style="width:100%;height:300px;font-family:monospace;font-size:11px;resize:vertical;white-space:pre">${JSON.stringify(data, null, 2)}</textarea>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn-primary" onclick="editorSave()" style="flex:1">Save</button>
        <button class="btn btn-danger" onclick="editorDelete()">Delete</button>
      </div>
    </div>
  `;
}

async function editorSave() {
  const text = document.getElementById('editorTextarea').value;
  let parsed;
  try { parsed = JSON.parse(text); } catch { showToast('Invalid JSON', 'error'); return; }
  showConfirm('Save Document', `Overwrite ${editorSelectedCol}/${editorDocId}?`, async () => {
    try {
      await db.collection(editorSelectedCol).doc(editorDocId).set(parsed);
      showToast('Saved!');
      document.getElementById('editorMsg').innerHTML = '<div class="info-box success">Document saved</div>';
    } catch (e) { showToast('Save failed: ' + e.message, 'error'); }
  });
}

function editorDelete() {
  showConfirm('Delete Document', `Permanently delete ${editorSelectedCol}/${editorDocId}?`, async () => {
    try {
      await db.collection(editorSelectedCol).doc(editorDocId).delete();
      showToast('Deleted');
      document.getElementById('editorPanel').style.display = 'none';
      document.getElementById('editorMsg').innerHTML = '<div class="info-box success">Document deleted</div>';
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  });
}
