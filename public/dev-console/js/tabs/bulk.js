// Bulk Update Tab — Find docs by filter, update a field in all matched

const BULK_COLLECTIONS = ['orders', 'order_history', 'users', 'products', 'ledger', 'retailer_balances', 'support_tickets', 'company_orders', 'daily_stock'];

let bulkMatchedDocs = [];
let bulkSelectedCol = '';

function loadBulkUpdate() {
  const content = document.getElementById('tabContent');
  bulkMatchedDocs = [];
  content.innerHTML = `
    <div class="info-box info">Find documents by filter, then update a specific field across all matched docs.</div>

    <div class="card">
      <div class="card-title">1. Collection</div>
      <select id="bulkCol" onchange="bulkSelectedCol=this.value;bulkMatchedDocs=[];document.getElementById('bulkResults').innerHTML='';document.getElementById('bulkUpdateSection').style.display='none'" class="input" style="width:100%">
        <option value="">Select...</option>
        ${BULK_COLLECTIONS.map(c => `<option value="${c}">${c}</option>`).join('')}
      </select>
    </div>

    <div class="card">
      <div class="card-title">2. Find Documents</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        <input id="bulkFilterField" class="input" placeholder="Field (e.g. date, phone)">
        <input id="bulkFilterValue" class="input" placeholder="Value...">
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" onclick="bulkFind()" style="flex:1">Find</button>
        <button class="btn btn-sm" onclick="bulkFindAll()" style="flex:1">All Docs</button>
      </div>
    </div>

    <div id="bulkResults"></div>
    <div id="bulkUpdateSection" style="display:none"></div>
    <div id="bulkProgress" style="display:none"></div>
    <div id="bulkMsg"></div>
  `;
}

async function bulkFind() {
  const col = document.getElementById('bulkCol').value;
  const field = document.getElementById('bulkFilterField').value.trim();
  const value = document.getElementById('bulkFilterValue').value.trim();
  if (!col || !field || !value) return;
  bulkSelectedCol = col;
  try {
    const snap = await db.collection(col).where(field, '==', value).get();
    if (snap.empty) { document.getElementById('bulkMsg').innerHTML = '<div class="info-box warning">No docs found</div>'; bulkMatchedDocs = []; return; }
    bulkMatchedDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    showBulkResults();
  } catch (e) { document.getElementById('bulkMsg').innerHTML = `<div class="info-box error">${e.message}</div>`; }
}

async function bulkFindAll() {
  const col = document.getElementById('bulkCol').value;
  if (!col) return;
  bulkSelectedCol = col;
  try {
    const snap = await db.collection(col).get();
    bulkMatchedDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    showBulkResults();
  } catch (e) { document.getElementById('bulkMsg').innerHTML = `<div class="info-box error">${e.message}</div>`; }
}

function showBulkResults() {
  document.getElementById('bulkMsg').innerHTML = '';
  document.getElementById('bulkResults').innerHTML = `
    <div class="info-box success" style="margin:12px 0">${bulkMatchedDocs.length} documents matched</div>
  `;
  document.getElementById('bulkUpdateSection').style.display = 'block';
  document.getElementById('bulkUpdateSection').innerHTML = `
    <div class="card" style="border-color:#92400e">
      <div class="card-title" style="color:#fbbf24">3. Update Field</div>
      <input id="bulkUpdateField" class="input" placeholder="Field to update (e.g. name, price, unit)" style="margin-bottom:8px">
      <div id="bulkPreview" style="font-size:10px;color:#6b7280;margin-bottom:8px"></div>
      <input id="bulkUpdateValue" class="input" placeholder="New value" style="margin-bottom:8px" oninput="bulkShowPreview()">
      <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#9ca3af;margin-bottom:12px">
        <input type="checkbox" id="bulkIsJson"> Value is JSON (array/object)
      </label>
      <button class="btn btn-warning" onclick="bulkExecute()" style="width:100%;padding:12px">
        Update ${bulkMatchedDocs.length} Documents
      </button>
    </div>
  `;
}

function bulkShowPreview() {
  const field = document.getElementById('bulkUpdateField').value.trim();
  if (!field || bulkMatchedDocs.length === 0) return;
  const val = bulkMatchedDocs[0][field];
  document.getElementById('bulkPreview').textContent = val !== undefined ? `Current in first doc: ${JSON.stringify(val).slice(0, 80)}` : 'Field does not exist in first doc (will be created)';
}

async function bulkExecute() {
  const field = document.getElementById('bulkUpdateField').value.trim();
  const rawValue = document.getElementById('bulkUpdateValue').value;
  const isJson = document.getElementById('bulkIsJson').checked;
  if (!field || !rawValue || bulkMatchedDocs.length === 0) return;

  let parsedValue;
  if (isJson) {
    try { parsedValue = JSON.parse(rawValue); } catch { showToast('Invalid JSON', 'error'); return; }
  } else {
    if (rawValue === 'true') parsedValue = true;
    else if (rawValue === 'false') parsedValue = false;
    else if (!isNaN(rawValue) && rawValue.trim() !== '') parsedValue = Number(rawValue);
    else parsedValue = rawValue;
  }

  showConfirm('Bulk Update', `Update "${field}" to "${JSON.stringify(parsedValue).slice(0, 50)}" in ${bulkMatchedDocs.length} docs of ${bulkSelectedCol}?`, async () => {
    const prog = document.getElementById('bulkProgress');
    prog.style.display = 'block';
    let done = 0, errors = 0;
    for (const d of bulkMatchedDocs) {
      try {
        await db.collection(bulkSelectedCol).doc(d.id).update({ [field]: parsedValue });
      } catch { errors++; }
      done++;
      prog.innerHTML = `<div class="info-box info">Updating... ${done}/${bulkMatchedDocs.length}</div>`;
    }
    prog.style.display = 'none';
    document.getElementById('bulkMsg').innerHTML = errors === 0
      ? `<div class="info-box success">Updated ${done} documents!</div>`
      : `<div class="info-box warning">${done - errors} updated, ${errors} failed.</div>`;
    showToast(errors === 0 ? 'Bulk update complete' : `${errors} failed`);
  });
}
