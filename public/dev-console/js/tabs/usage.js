// Usage Tab — Firebase read/write/delete usage tracking + daily stats

async function loadUsage() {
  const content = document.getElementById('tabContent');
  content.innerHTML = '<div class="loading"><span class="spinner"></span> Loading usage data...</div>';

  try {
    // Get last 30 days usage docs
    const today = new Date();
    const usageDocs = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const doc = await getDocument('settings', 'usage_' + dateKey);
      if (doc) usageDocs.push({ ...doc, dateKey });
    }

    // Today's data
    const todayKey = today.toISOString().split('T')[0];
    const todayData = usageDocs.find(d => d.dateKey === todayKey) || { reads: 0, writes: 0, deletes: 0 };

    // Last 7 days totals
    const week = usageDocs.slice(0, 7);
    const weekReads = week.reduce((s, d) => s + (d.reads || 0), 0);
    const weekWrites = week.reduce((s, d) => s + (d.writes || 0), 0);
    const weekDeletes = week.reduce((s, d) => s + (d.deletes || 0), 0);

    // Last 30 days totals
    const monthReads = usageDocs.reduce((s, d) => s + (d.reads || 0), 0);
    const monthWrites = usageDocs.reduce((s, d) => s + (d.writes || 0), 0);
    const monthDeletes = usageDocs.reduce((s, d) => s + (d.deletes || 0), 0);

    // Free tier limits (Firestore Spark plan)
    const FREE_READS = 50000; // per day
    const FREE_WRITES = 20000; // per day
    const FREE_DELETES = 20000; // per day

    const readPct = Math.min(100, ((todayData.reads || 0) / FREE_READS * 100)).toFixed(1);
    const writePct = Math.min(100, ((todayData.writes || 0) / FREE_WRITES * 100)).toFixed(1);

    // Bar chart (last 7 days)
    const maxOps = Math.max(1, ...week.map(d => (d.reads || 0) + (d.writes || 0) + (d.deletes || 0)));

    content.innerHTML = `
      <div class="info-box ${readPct > 80 ? 'warn' : 'success'}">
        ${readPct > 80 ? '⚠️ High usage today — approaching free tier limit!' : 'Usage within safe limits.'}
        Free tier: 50K reads, 20K writes per day.
      </div>

      <div class="stats-grid">
        <div class="stat-card green">
          <div class="stat-value">${(todayData.reads || 0).toLocaleString()}</div>
          <div class="stat-label">Reads Today</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-value">${(todayData.writes || 0).toLocaleString()}</div>
          <div class="stat-label">Writes Today</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-value">${(todayData.deletes || 0).toLocaleString()}</div>
          <div class="stat-label">Deletes Today</div>
        </div>
        <div class="stat-card ${readPct > 80 ? 'red' : 'green'}">
          <div class="stat-value">${readPct}%</div>
          <div class="stat-label">Daily Limit Used</div>
        </div>
      </div>

      <!-- Usage Bars (Today) -->
      <div class="card">
        <div class="card-title">Today's Usage vs Free Tier</div>
        <div style="space-y:12px">
          <div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px">
              <span style="color:var(--text2)">Reads</span>
              <span style="color:var(--text3)">${(todayData.reads || 0).toLocaleString()} / 50,000</span>
            </div>
            <div style="height:8px;background:var(--surface2);border-radius:4px;overflow:hidden">
              <div style="height:100%;width:${readPct}%;background:${readPct > 80 ? 'var(--danger)' : readPct > 50 ? 'var(--warn)' : 'var(--accent)'};border-radius:4px;transition:width .5s"></div>
            </div>
          </div>
          <div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px">
              <span style="color:var(--text2)">Writes</span>
              <span style="color:var(--text3)">${(todayData.writes || 0).toLocaleString()} / 20,000</span>
            </div>
            <div style="height:8px;background:var(--surface2);border-radius:4px;overflow:hidden">
              <div style="height:100%;width:${writePct}%;background:${writePct > 80 ? 'var(--danger)' : writePct > 50 ? 'var(--warn)' : 'var(--info)'};border-radius:4px;transition:width .5s"></div>
            </div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px">
              <span style="color:var(--text2)">Deletes</span>
              <span style="color:var(--text3)">${(todayData.deletes || 0).toLocaleString()} / 20,000</span>
            </div>
            <div style="height:8px;background:var(--surface2);border-radius:4px;overflow:hidden">
              <div style="height:100%;width:${Math.min(100, (todayData.deletes || 0) / FREE_DELETES * 100).toFixed(1)}%;background:var(--warn);border-radius:4px;transition:width .5s"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Weekly Summary -->
      <div class="card">
        <div class="card-title">Last 7 Days</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">
          <div style="text-align:center;padding:10px;background:var(--surface2);border-radius:8px">
            <div style="font-size:18px;font-weight:900;color:var(--accent)">${weekReads.toLocaleString()}</div>
            <div style="font-size:10px;color:var(--text3)">Reads</div>
          </div>
          <div style="text-align:center;padding:10px;background:var(--surface2);border-radius:8px">
            <div style="font-size:18px;font-weight:900;color:var(--info)">${weekWrites.toLocaleString()}</div>
            <div style="font-size:10px;color:var(--text3)">Writes</div>
          </div>
          <div style="text-align:center;padding:10px;background:var(--surface2);border-radius:8px">
            <div style="font-size:18px;font-weight:900;color:var(--warn)">${weekDeletes.toLocaleString()}</div>
            <div style="font-size:10px;color:var(--text3)">Deletes</div>
          </div>
        </div>

        <!-- Mini bar chart -->
        <div style="display:flex;align-items:flex-end;gap:4px;height:80px;padding-top:8px">
          ${week.reverse().map(d => {
            const total = (d.reads || 0) + (d.writes || 0) + (d.deletes || 0);
            const h = Math.max(4, (total / maxOps) * 70);
            const day = new Date(d.dateKey).toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2);
            return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">
              <div style="font-size:8px;color:var(--text3)">${total > 0 ? total : ''}</div>
              <div style="width:100%;height:${h}px;background:linear-gradient(to top,var(--accent),rgba(34,197,94,0.4));border-radius:4px"></div>
              <div style="font-size:8px;color:var(--text3)">${day}</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Monthly Summary -->
      <div class="card">
        <div class="card-title">Last 30 Days Total</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          <div style="text-align:center;padding:10px;background:var(--surface2);border-radius:8px">
            <div style="font-size:16px;font-weight:900;color:var(--accent)">${monthReads.toLocaleString()}</div>
            <div style="font-size:10px;color:var(--text3)">Reads</div>
          </div>
          <div style="text-align:center;padding:10px;background:var(--surface2);border-radius:8px">
            <div style="font-size:16px;font-weight:900;color:var(--info)">${monthWrites.toLocaleString()}</div>
            <div style="font-size:10px;color:var(--text3)">Writes</div>
          </div>
          <div style="text-align:center;padding:10px;background:var(--surface2);border-radius:8px">
            <div style="font-size:16px;font-weight:900;color:var(--warn)">${monthDeletes.toLocaleString()}</div>
            <div style="font-size:10px;color:var(--text3)">Deletes</div>
          </div>
        </div>
        <div style="margin-top:12px;font-size:11px;color:var(--text3)">
          Avg/day: ${Math.round(monthReads / Math.max(1, usageDocs.length))} reads, ${Math.round(monthWrites / Math.max(1, usageDocs.length))} writes
        </div>
      </div>

      <!-- Daily breakdown -->
      <div class="card">
        <div class="card-title">Daily Breakdown</div>
        <div style="max-height:250px;overflow-y:auto">
          ${usageDocs.map(d => `
            <div class="list-item" style="padding:8px 12px">
              <div class="content">
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="font-size:12px;font-weight:700;color:var(--text);min-width:75px">${d.dateKey?.slice(5) || '-'}</span>
                  <span style="font-size:11px;color:var(--accent)">R:${(d.reads || 0).toLocaleString()}</span>
                  <span style="font-size:11px;color:var(--info)">W:${(d.writes || 0).toLocaleString()}</span>
                  <span style="font-size:11px;color:var(--warn)">D:${(d.deletes || 0).toLocaleString()}</span>
                  ${d.lastSync ? `<span style="font-size:9px;color:var(--text3);margin-left:auto">${new Date(d.lastSync).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="btn-group" style="margin-top:12px">
        <button class="btn btn-info btn-sm" onclick="loadUsage()">Refresh</button>
      </div>
    `;
  } catch (e) {
    content.innerHTML = `<div class="info-box error">Failed: ${e.message}</div>`;
  }
}
