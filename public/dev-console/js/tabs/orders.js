// Orders Tab — Lookup orders by phone/date, change status, revert cancelled

async function loadOrders() {
  const content = document.getElementById('tabContent');
  content.innerHTML = `
    <div class="info-box info">Search orders by phone, date, or status. Change status, revert cancellations.</div>

    <div class="card">
      <div class="card-title">Find Orders</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        <input id="orderPhone" class="input" placeholder="Phone number...">
        <input id="orderDate" class="input" type="date">
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" onclick="searchOrders()" style="flex:1">Search</button>
        <button class="btn btn-sm" onclick="searchOrdersByStatus('Pending')" style="flex:1;background:#f59e0b;color:#fff">Pending</button>
        <button class="btn btn-sm" onclick="searchOrdersByStatus('Cancelled')" style="flex:1;background:#ef4444;color:#fff">Cancelled</button>
      </div>
    </div>

    <div id="orderResults"></div>
  `;
}

async function searchOrders() {
  const phone = document.getElementById('orderPhone').value.trim();
  const dateVal = document.getElementById('orderDate').value;
  const results = document.getElementById('orderResults');
  results.innerHTML = '<div class="loading"><span class="spinner"></span> Searching...</div>';

  try {
    let snap;
    if (phone && dateVal) {
      const dateStr = new Date(dateVal + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      snap = await db.collection('orders').where('phone', '==', phone).where('date', '==', dateStr).get();
    } else if (phone) {
      snap = await db.collection('orders').where('phone', '==', phone).limit(20).get();
    } else if (dateVal) {
      const dateStr = new Date(dateVal + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      snap = await db.collection('orders').where('date', '==', dateStr).get();
    } else {
      snap = await db.collection('orders').limit(20).get();
    }

    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    orders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    renderOrders(orders);
  } catch (e) {
    results.innerHTML = `<div class="info-box error">${e.message}</div>`;
  }
}

async function searchOrdersByStatus(status) {
  const results = document.getElementById('orderResults');
  results.innerHTML = '<div class="loading"><span class="spinner"></span> Loading...</div>';
  try {
    const snap = await db.collection('orders').where('status', '==', status).limit(30).get();
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    orders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    renderOrders(orders);
  } catch (e) {
    results.innerHTML = `<div class="info-box error">${e.message}</div>`;
  }
}

function renderOrders(orders) {
  const results = document.getElementById('orderResults');
  if (orders.length === 0) {
    results.innerHTML = '<div class="empty"><div class="empty-text">No orders found</div></div>';
    return;
  }

  const statusColor = { Pending: 'amber', Confirmed: 'blue', Dispatched: 'blue', Delivered: 'green', Cancelled: 'red', Returned: 'amber' };

  results.innerHTML = `
    <div style="margin:12px 0;font-size:12px;color:var(--text2);font-weight:700">${orders.length} orders found</div>
    ${orders.map(o => {
      const items = (o.items || []).map(i => `${i.name} x${i.qty}`).join(', ');
      const color = statusColor[o.status] || 'blue';
      return `
        <div class="card" style="padding:14px;margin-bottom:10px" id="order-${o.id}">
          <div style="display:flex;align-items:flex-start;gap:10px">
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px">
                <span style="font-size:14px;font-weight:700;color:var(--text)">${o.retailer || o.phone}</span>
                <span class="badge badge-${color}">${o.status}</span>
              </div>
              <div style="font-size:12px;color:var(--text3);margin-bottom:4px">
                ${o.phone} • ${o.date || ''} • ₹${(o.total || 0).toFixed(2)}
              </div>
              <div style="font-size:11px;color:var(--text3);margin-bottom:8px;word-break:break-word">
                ${items.slice(0, 100)}${items.length > 100 ? '...' : ''}
              </div>
              <div class="btn-group">
                ${o.status === 'Cancelled' ? `<button class="btn btn-primary btn-sm" onclick="revertOrder('${o.id}','Confirmed')">→ Confirmed</button>` : ''}
                ${o.status === 'Pending' ? `<button class="btn btn-info btn-sm" onclick="revertOrder('${o.id}','Confirmed')">→ Confirmed</button>` : ''}
                ${o.status === 'Confirmed' || o.status === 'Pending' ? `<button class="btn btn-danger btn-sm" onclick="changeOrderStatus('${o.id}','Cancelled')">Cancel</button>` : ''}
                ${o.status === 'Dispatched' ? `<button class="btn btn-sm" style="background:var(--surface2);color:var(--text2)" onclick="revertOrder('${o.id}','Confirmed')">Undo → Confirmed</button>` : ''}
                ${o.status === 'Dispatched' ? `<button class="btn btn-warn btn-sm" onclick="changeOrderStatus('${o.id}','Returned')">Return</button>` : ''}
                ${o.status === 'Returned' ? `<button class="btn btn-info btn-sm" onclick="revertOrder('${o.id}','Dispatched')">→ Dispatched</button>` : ''}
                <button class="btn btn-sm" style="background:var(--surface2);color:var(--text3);font-size:10px" onclick="viewOrderRaw('${o.id}')">Raw</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('')}
  `;
}

function changeOrderStatus(orderId, newStatus) {
  showConfirm(`Change to ${newStatus}`, `Set order status to "${newStatus}"?`, async () => {
    try {
      const update = { status: newStatus };
      if (newStatus === 'Cancelled') { update.cancelledAt = new Date().toISOString(); update.cancelledBy = 'developer'; }
      if (newStatus === 'Returned') { update.returnedAt = new Date().toISOString(); }
      await db.collection('orders').doc(orderId).update(update);
      // Sync to order_history
      const hSnap = await db.collection('order_history').where('orderId', '==', orderId).get();
      if (!hSnap.empty) await db.collection('order_history').doc(hSnap.docs[0].id).update(update);
      showToast(`Status → ${newStatus}`);
      searchOrders();
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  });
}

function revertOrder(orderId, targetStatus) {
  showConfirm(`Revert to ${targetStatus}`, `This will change order status back to "${targetStatus}". Continue?`, async () => {
    try {
      const update = { status: targetStatus };
      // Clean up status-specific fields
      if (targetStatus === 'Confirmed') {
        update.cancelledAt = null; update.cancelledBy = null;
        update.dispatchedAt = null; update.returnedAt = null;
      }
      if (targetStatus === 'Dispatched') {
        update.returnedAt = null;
      }
      await db.collection('orders').doc(orderId).update(update);
      // Sync to order_history
      const hSnap = await db.collection('order_history').where('orderId', '==', orderId).get();
      if (!hSnap.empty) await db.collection('order_history').doc(hSnap.docs[0].id).update(update);
      showToast(`Reverted → ${targetStatus}`);
      searchOrders();
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  });
}

async function viewOrderRaw(orderId) {
  try {
    const doc = await db.collection('orders').doc(orderId).get();
    if (!doc.exists) { showToast('Not found', 'error'); return; }
    const data = doc.data();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:500px;text-align:left">
        <h3 style="margin-bottom:12px">Order: ${orderId}</h3>
        <pre style="font-size:10px;background:var(--surface2);padding:12px;border-radius:8px;overflow:auto;max-height:50vh;white-space:pre-wrap">${JSON.stringify(data, null, 2)}</pre>
        <div class="btn-group" style="margin-top:12px;justify-content:center">
          <button class="btn" style="background:var(--surface2);color:var(--text2)" id="closeRaw">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#closeRaw').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  } catch (e) { showToast('Failed: ' + e.message, 'error'); }
}
