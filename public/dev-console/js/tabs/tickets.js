// Tickets Tab — View support tickets, reply, change status

async function loadTickets() {
  const content = document.getElementById('tabContent');
  content.innerHTML = '<div class="loading"><span class="spinner"></span> Loading tickets...</div>';

  try {
    const snap = await db.collection('support_tickets').get();
    let tickets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    tickets.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    const open = tickets.filter(t => t.status !== 'Closed' && t.status !== 'Resolved');
    const closed = tickets.filter(t => t.status === 'Closed' || t.status === 'Resolved');

    content.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card ${open.length > 0 ? 'amber' : 'green'}">
          <div class="stat-value">${open.length}</div>
          <div class="stat-label">Open</div>
        </div>
        <div class="stat-card green">
          <div class="stat-value">${closed.length}</div>
          <div class="stat-label">Closed</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-value">${tickets.length}</div>
          <div class="stat-label">Total</div>
        </div>
      </div>

      <div class="btn-group" style="margin-bottom:14px">
        <button class="btn btn-info btn-sm" onclick="loadTickets()">Refresh</button>
      </div>

      ${open.length > 0 ? `<div style="font-size:11px;font-weight:700;color:var(--warn);text-transform:uppercase;margin-bottom:8px">Open Tickets</div>` : ''}
      ${open.map(t => renderTicketCard(t)).join('')}

      ${closed.length > 0 ? `<div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;margin:16px 0 8px">Closed (${closed.length})</div>` : ''}
      ${closed.slice(0, 10).map(t => renderTicketCard(t)).join('')}
      ${closed.length > 10 ? `<div style="font-size:11px;color:var(--text3);text-align:center;padding:8px">+ ${closed.length - 10} more closed tickets</div>` : ''}
    `;
  } catch (e) {
    content.innerHTML = `<div class="info-box error">Failed: ${e.message}</div>`;
  }
}

function renderTicketCard(t) {
  const statusColor = { Open: 'amber', 'In Progress': 'blue', Resolved: 'green', Closed: 'green' };
  const color = statusColor[t.status] || 'amber';
  const msgs = t.messages || [];
  const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;

  return `
    <div class="card" style="padding:14px;margin-bottom:10px">
      <div style="display:flex;align-items:flex-start;gap:10px">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px">
            <span style="font-size:14px;font-weight:700;color:var(--text)">${t.subject || 'No subject'}</span>
            <span class="badge badge-${color}">${t.status || 'Open'}</span>
          </div>
          <div style="font-size:12px;color:var(--text3);margin-bottom:4px">
            ${t.phone || ''} • ${t.name || ''} • ${formatDate(t.createdAt)}
          </div>
          <div style="font-size:12px;color:var(--text2);margin-bottom:6px;padding:8px;background:var(--surface2);border-radius:8px">
            ${(t.message || '').slice(0, 200)}
          </div>
          ${lastMsg ? `<div style="font-size:11px;color:var(--text3);margin-bottom:6px">Last reply: <strong style="color:${lastMsg.from === 'admin' ? 'var(--info)' : 'var(--text2)'}">${lastMsg.from}</strong> — "${(lastMsg.text || '').slice(0, 80)}" <span style="opacity:0.6">${formatDate(lastMsg.time)}</span></div>` : ''}
          <div class="btn-group">
            <button class="btn btn-primary btn-sm" onclick="replyTicket('${t.id}')">Reply</button>
            ${t.status !== 'Closed' ? `<button class="btn btn-sm" style="background:var(--surface2);color:var(--accent)" onclick="closeTicket('${t.id}')">Close</button>` : ''}
            ${t.status === 'Closed' ? `<button class="btn btn-sm" style="background:var(--surface2);color:var(--warn)" onclick="reopenTicket('${t.id}')">Reopen</button>` : ''}
            ${t.status === 'Open' ? `<button class="btn btn-info btn-sm" onclick="setTicketStatus('${t.id}','In Progress')">In Progress</button>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

function replyTicket(ticketId) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="text-align:left;max-width:420px">
      <h3>Reply to Ticket</h3>
      <textarea id="ticketReplyText" class="input" placeholder="Type your reply..." style="width:100%;height:100px;resize:vertical;font-size:13px;margin:12px 0;padding:12px"></textarea>
      <div class="btn-group" style="justify-content:center">
        <button class="btn btn-primary" id="sendReplyBtn">Send Reply</button>
        <button class="btn" style="background:var(--surface2);color:var(--text2)" id="cancelReplyBtn">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#cancelReplyBtn').onclick = () => overlay.remove();
  overlay.querySelector('#sendReplyBtn').onclick = async () => {
    const text = document.getElementById('ticketReplyText').value.trim();
    if (!text) { showToast('Enter reply', 'error'); return; }
    try {
      const doc = await db.collection('support_tickets').doc(ticketId).get();
      const data = doc.data();
      const messages = data.messages || [];
      messages.push({ from: 'admin', text, time: new Date().toISOString() });
      await db.collection('support_tickets').doc(ticketId).update({ messages, status: 'In Progress' });
      showToast('Reply sent');
      overlay.remove();
      loadTickets();
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  };
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

function closeTicket(ticketId) {
  showConfirm('Close Ticket', 'Mark this ticket as closed?', async () => {
    try {
      await db.collection('support_tickets').doc(ticketId).update({ status: 'Closed', closedAt: new Date().toISOString() });
      showToast('Ticket closed');
      loadTickets();
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  });
}

function reopenTicket(ticketId) {
  showConfirm('Reopen Ticket', 'Reopen this ticket?', async () => {
    try {
      await db.collection('support_tickets').doc(ticketId).update({ status: 'Open', closedAt: '' });
      showToast('Ticket reopened');
      loadTickets();
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  });
}

function setTicketStatus(ticketId, status) {
  showConfirm('Update Status', `Set status to "${status}"?`, async () => {
    try {
      await db.collection('support_tickets').doc(ticketId).update({ status });
      showToast(`Status → ${status}`);
      loadTickets();
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  });
}
