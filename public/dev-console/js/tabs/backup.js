// Backup Tab — Emergency backup & restore (Local + Cloud + Secondary Firebase)

const BACKUP_COLS = ['users', 'products', 'settings', 'retailer_balances', 'ledger', 'orders', 'order_history', 'support_tickets'];

// Secondary Firebase for backup storage (separate project = safe from primary corruption)
const BACKUP_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDorZ42EcJ27XuG4LembQVJabtrSDrL2E4",
  authDomain: "lucy-garden-backup.firebaseapp.com",
  projectId: "lucy-garden-backup",
  storageBucket: "lucy-garden-backup.firebasestorage.app",
  messagingSenderId: "730233860355",
  appId: "1:730233860355:web:4ded6f3b5e22e6cd583936"
};

// Secret token for backup write authorization (must match Firestore rules)
const BACKUP_SECRET = 'LG_BACKUP_2026_xK9mP4vQ';

let backupDb = null;
function getBackupDb() {
  if (backupDb) return backupDb;
  if (!BACKUP_FIREBASE_CONFIG.apiKey) return null; // not configured yet
  const backupApp = firebase.initializeApp(BACKUP_FIREBASE_CONFIG, 'backup');
  backupDb = backupApp.firestore();
  return backupDb;
}

async function loadBackup() {
  const content = document.getElementById('tabContent');
  content.innerHTML = '<div class="loading"><span class="spinner"></span> Loading backups...</div>';

  try {
    let backups = await getCollection('backups');
    backups.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  const hasSecondaryDb = !!BACKUP_FIREBASE_CONFIG.apiKey;

    content.innerHTML = `
      <div class="info-box info">Backup ${BACKUP_COLS.length} collections: ${BACKUP_COLS.join(', ')}</div>

      ${!hasSecondaryDb ? '<div class="info-box warn">Secondary backup database not configured. Backups are stored locally or in same Firestore (risky). Ask developer to set up <strong>lucy-garden-backup</strong> project.</div>' : '<div class="info-box success">Secondary backup database connected — backups stored safely in separate project.</div>'}

      <div class="card" style="border-color:#166534">
        <div class="card-title" style="color:#4ade80">Local Backup (Safest)</div>
        <p style="font-size:11px;color:#6b7280;margin-bottom:12px">JSON file saved to your device. Works even if Firebase goes down.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <button class="btn btn-primary" onclick="downloadLocalBackup()" id="btnDownload">Download JSON</button>
          <button class="btn btn-warning" onclick="restoreFromFile()">Restore from File</button>
        </div>
      </div>

      <button class="btn btn-primary" onclick="createCloudBackup()" style="width:100%;padding:14px;font-size:14px;margin:16px 0">
        ${hasSecondaryDb ? 'Backup to Secondary DB' : 'Cloud Backup (Same Firestore)'}
      </button>

      <div id="backupResult"></div>
      <div id="restoreProgress" style="display:none"></div>

      <div class="card">
        <div class="card-title">Cloud Backups (${backups.length})</div>
        ${backups.length === 0 ? '<div class="empty"><div class="empty-text">No cloud backups yet</div></div>' : ''}
        ${backups.map((b, i) => `
          <div class="list-item">
            <div class="sn">${i + 1}</div>
            <div class="content">
              <div class="title">${formatDate(b.createdAt)}</div>
              <div class="subtitle">${b.docCount || '?'} docs • ${b.collections?.length || BACKUP_COLS.length} collections</div>
            </div>
            <div class="btn-group">
              <button class="btn btn-sm" onclick="downloadCloudBackup('${b.id}')" style="background:#1e40af;color:#fff">DL</button>
              <button class="btn btn-danger btn-sm" onclick="deleteBackup('${b.id}')">Del</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (e) {
    content.innerHTML = `<div class="info-box error">Failed: ${e.message}</div>`;
  }
}

// === LOCAL DOWNLOAD ===
async function downloadLocalBackup() {
  const btn = document.getElementById('btnDownload');
  btn.disabled = true; btn.textContent = 'Downloading...';
  const result = document.getElementById('backupResult');
  try {
    const data = {};
    let totalDocs = 0;
    for (const col of BACKUP_COLS) {
      const snap = await db.collection(col).get();
      data[col] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      totalDocs += snap.size;
    }
    const backup = { data, collections: BACKUP_COLS, docCount: totalDocs, createdAt: new Date().toISOString(), version: '2.4.0', source: 'emergency_console' };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `LG_Backup_${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
    result.innerHTML = `<div class="info-box success">Downloaded! ${totalDocs} docs from ${BACKUP_COLS.length} collections.</div>`;
    showToast('Backup downloaded');
  } catch (e) {
    result.innerHTML = `<div class="info-box error">Download failed: ${e.message}</div>`;
  }
  btn.disabled = false; btn.textContent = 'Download JSON';
}

// === RESTORE FROM FILE ===
function restoreFromFile() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      if (!backup.data || !backup.collections) { showToast('Invalid backup file', 'error'); return; }

      showConfirm('Restore from File',
        `File: ${file.name}\nCollections: ${backup.collections.join(', ')}\nDocs: ${backup.docCount}\nCreated: ${backup.createdAt?.slice(0, 16)}\n\nThis will CLEAN + REPLACE all data. IRREVERSIBLE.`,
        async () => {
          const prog = document.getElementById('restoreProgress');
          prog.style.display = 'block';
          prog.innerHTML = '<div class="info-box info"><span class="spinner"></span> Cleaning existing data...</div>';

          try {
            const data = backup.data;
            // Phase 1: Delete existing
            for (const col of Object.keys(data)) {
              const snap = await db.collection(col).get();
              const batch = db.batch();
              snap.docs.forEach(d => batch.delete(d.ref));
              if (snap.size > 0) await batch.commit();
            }

            // Phase 2: Write
            prog.innerHTML = '<div class="info-box info"><span class="spinner"></span> Restoring data...</div>';
            let done = 0, errors = 0;
            for (const [col, docs] of Object.entries(data)) {
              for (const d of docs) {
                const { id, ...rest } = d;
                try { await db.collection(col).doc(id).set(rest); } catch { errors++; }
                done++;
              }
            }
            prog.innerHTML = errors === 0
              ? `<div class="info-box success">Restore complete! ${done} docs restored.</div>`
              : `<div class="info-box warning">${done - errors}/${done} restored. ${errors} failed.</div>`;
            showToast('Restore complete');
          } catch (e) {
            prog.innerHTML = `<div class="info-box error">Restore failed: ${e.message}</div>`;
          }
        }
      );
    } catch (e) { showToast('File read failed: ' + e.message, 'error'); }
  };
  input.click();
}

// === CLOUD BACKUP ===
async function createCloudBackup() {
  const targetDb = getBackupDb() || db;
  const targetLabel = getBackupDb() ? 'Secondary DB (Secure)' : 'Same Firestore';
  showConfirm('Cloud Backup', `Save backup to ${targetLabel}? (${BACKUP_COLS.join(', ')})\n\nLarge collections auto-split into safe chunks.`, async () => {
    const result = document.getElementById('backupResult');
    result.innerHTML = '<div class="info-box info"><span class="spinner"></span> Creating backup...</div>';
    try {
      const backupId = 'backup_' + Date.now();
      let totalDocs = 0;
      const MAX_CHUNK_BYTES = 800 * 1024; // 800KB safe limit per doc

      for (const col of BACKUP_COLS) {
        const snap = await db.collection(col).get();
        const allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        totalDocs += snap.size;
        result.innerHTML = `<div class="info-box info"><span class="spinner"></span> Backing up ${col} (${snap.size} docs)...</div>`;

        // Split into chunks if too large
        const chunks = [];
        let currentChunk = [];
        let currentSize = 0;

        for (const doc of allDocs) {
          const docStr = JSON.stringify(doc);
          if (currentSize + docStr.length > MAX_CHUNK_BYTES && currentChunk.length > 0) {
            chunks.push(currentChunk);
            currentChunk = [];
            currentSize = 0;
          }
          currentChunk.push(doc);
          currentSize += docStr.length;
        }
        if (currentChunk.length > 0) chunks.push(currentChunk);

        // Store chunks
        if (chunks.length === 1) {
          // Single chunk — simple
          await targetDb.collection('backups').doc(backupId).collection('chunks').doc(col).set({
            data: JSON.stringify(chunks[0]),
            count: allDocs.length,
            parts: 1,
            _auth: BACKUP_SECRET
          });
        } else {
          // Multiple chunks — split
          for (let i = 0; i < chunks.length; i++) {
            await targetDb.collection('backups').doc(backupId).collection('chunks').doc(`${col}_part${i}`).set({
              data: JSON.stringify(chunks[i]),
              count: chunks[i].length,
              collection: col,
              part: i,
              totalParts: chunks.length,
              _auth: BACKUP_SECRET
            });
          }
          // Index doc for this collection
          await targetDb.collection('backups').doc(backupId).collection('chunks').doc(col).set({
            count: allDocs.length,
            parts: chunks.length,
            split: true,
            _auth: BACKUP_SECRET
          });
        }
      }

      // Store metadata
      await targetDb.collection('backups').doc(backupId).set({
        createdAt: new Date().toISOString(),
        collections: BACKUP_COLS,
        docCount: totalDocs,
        source: 'emergency_console',
        version: '2.4.0',
        _auth: BACKUP_SECRET
      });

      result.innerHTML = `<div class="info-box success">Backup complete! ${totalDocs} docs stored safely in ${targetLabel}.</div>`;
      showToast('Backup created');
      setTimeout(() => loadBackup(), 1500);
    } catch (e) {
      result.innerHTML = `<div class="info-box error">Failed: ${e.message}</div>`;
    }
  });
}

// === DOWNLOAD CLOUD BACKUP AS FILE ===
async function downloadCloudBackup(id) {
  try {
    const targetDb = getBackupDb() || db;
    const metaDoc = await targetDb.collection('backups').doc(id).get();
    if (!metaDoc.exists) { showToast('Backup not found', 'error'); return; }
    const meta = metaDoc.data();

    // Read all chunks
    const chunksSnap = await targetDb.collection('backups').doc(id).collection('chunks').get();
    let data = {};

    if (chunksSnap.size > 0) {
      // Group parts by collection
      const parts = {}; // { orders: [{part:0, data:[...]}, {part:1, data:[...]}] }
      chunksSnap.docs.forEach(d => {
        const chunkData = d.data();
        if (chunkData.split) return; // skip index docs
        if (chunkData.collection && chunkData.part !== undefined) {
          // Multi-part chunk
          if (!parts[chunkData.collection]) parts[chunkData.collection] = [];
          parts[chunkData.collection].push({ part: chunkData.part, docs: JSON.parse(chunkData.data || '[]') });
        } else if (chunkData.data) {
          // Single chunk
          data[d.id] = JSON.parse(chunkData.data || '[]');
        }
      });
      // Merge multi-part collections
      for (const [col, chunks] of Object.entries(parts)) {
        chunks.sort((a, b) => a.part - b.part);
        data[col] = chunks.flatMap(c => c.docs);
      }
    } else if (meta.data) {
      // Old format — single JSON string
      data = JSON.parse(meta.data);
    }

    const backup = { data, collections: meta.collections, docCount: meta.docCount, createdAt: meta.createdAt, version: meta.version || '2.4.0' };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `LG_Backup_${meta.createdAt?.slice(0, 10) || 'unknown'}.json`; a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded');
  } catch (e) { showToast('Failed: ' + e.message, 'error'); }
}

function deleteBackup(id) {
  showConfirm('Delete Backup', 'Remove this backup permanently? (metadata + all chunks)', async () => {
    try {
      const targetDb = getBackupDb() || db;
      // Delete chunks subcollection first
      const chunksSnap = await targetDb.collection('backups').doc(id).collection('chunks').get();
      for (const chunk of chunksSnap.docs) {
        await chunk.ref.delete();
      }
      // Delete metadata doc
      await targetDb.collection('backups').doc(id).delete();
      showToast('Deleted');
      loadBackup();
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  });
}
