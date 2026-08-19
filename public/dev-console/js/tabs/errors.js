// Errors Tab — View app crashes with fix suggestions

async function loadErrors() {
  const content = document.getElementById('tabContent');
  content.innerHTML = '<div class="loading"><span class="spinner"></span> Loading error logs...</div>';

  try {
    let errors = await getCollection('app_errors');
    errors.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    errors = errors.slice(0, 30);

    const unresolved = errors.filter(e => !e.resolved);
    const high = unresolved.filter(e => e.severity === 'high').length;

    if (errors.length === 0) {
      content.innerHTML = `
        <div class="empty">
          <div class="empty-icon"></div>
          <div class="empty-text">No errors! App is healthy.</div>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card red">
          <div class="stat-value">${unresolved.length}</div>
          <div class="stat-label">Unresolved</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-value">${high}</div>
          <div class="stat-label">High Severity</div>
        </div>
        <div class="stat-card green">
          <div class="stat-value">${errors.filter(e => e.resolved).length}</div>
          <div class="stat-label">Resolved</div>
        </div>
      </div>

      <div class="btn-group" style="margin-bottom:16px">
        <button class="btn btn-danger btn-sm" onclick="clearAllErrors()">Clear All</button>
        <button class="btn btn-info btn-sm" onclick="loadErrors()">Refresh</button>
      </div>

      <div id="errorList">
        ${unresolved.map((err, i) => {
          const sol = getErrorSolution(err.message || '');
          return `
            <div class="card" id="error-${err.id}">
              <div style="display:flex;align-items:flex-start;gap:10px">
                <div class="sn" style="margin-top:2px">${i + 1}</div>
                <div style="flex:1;min-width:0">
                  <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;flex-wrap:wrap">
                    <span class="badge badge-${err.severity === 'high' ? 'red' : err.severity === 'low' ? 'blue' : 'amber'}">${(err.severity || 'medium').toUpperCase()}</span>
                    <span style="font-size:10px;color:var(--text3)">${formatDate(err.timestamp)}</span>
                  </div>
                  <div class="title" style="margin-bottom:4px">${sol.title}</div>
                  <div class="subtitle" style="word-break:break-all">${(err.message || '').slice(0, 150)}</div>
                  ${err.context ? `<div class="subtitle">Context: ${err.context}</div>` : ''}
                  ${err.user ? `<div class="subtitle">User: ${err.user}</div>` : ''}
                  <div class="solution-box">
                    <div class="sol-title">Suggested Fix</div>
                    <div class="sol-text">${sol.solution}</div>
                  </div>
                  <div class="btn-group" style="margin-top:8px">
                    <button class="btn btn-primary btn-sm" onclick="resolveError('${err.id}')">Resolve</button>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (e) {
    content.innerHTML = `<div class="info-box error">Failed to load errors: ${e.message}</div>`;
  }
}

async function resolveError(id) {
  showConfirm('Resolve Error', 'Mark this error as resolved?', async () => {
    try {
      await db.collection('app_errors').doc(id).update({ resolved: true, resolvedAt: new Date().toISOString() });
      const el = document.getElementById('error-' + id);
      if (el) el.style.opacity = '0.4';
      showToast('Error marked as resolved');
    } catch (e) {
      showToast('Failed: ' + e.message, 'error');
    }
  });
}

function clearAllErrors() {
  showConfirm('Clear All Errors', 'Delete all error logs? This cannot be undone.', async () => {
    try {
      const errors = await getCollection('app_errors');
      for (const err of errors) {
        await deleteDocument('app_errors', err.id);
      }
      showToast('All errors cleared');
      loadErrors();
    } catch (e) {
      showToast('Failed: ' + e.message, 'error');
    }
  });
}
