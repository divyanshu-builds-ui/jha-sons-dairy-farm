// Feature Flags Tab — Toggle features ON/OFF

const FLAG_DEFINITIONS = [
  { key: 'seasonalProducts', label: 'Seasonal Products', desc: 'Show seasonal products in order page' },
  { key: 'supportTickets', label: 'Support Tickets', desc: 'Allow retailers to submit tickets' },
  { key: 'orderHistory', label: 'Order History', desc: 'Show order history page' },
  { key: 'ledgerView', label: 'Retailer Ledger', desc: 'Allow retailers to view ledger' },
  { key: 'darkMode', label: 'Dark Mode', desc: 'Allow dark mode toggle' },
  { key: 'pdfInvoice', label: 'PDF Invoice', desc: 'Allow PDF invoice download' },
  { key: 'duplicateOrderCheck', label: 'Duplicate Order Check', desc: 'Warn on duplicate orders' },
  { key: 'balanceWarning', label: 'Balance Warning', desc: 'Show pending due warning' },
  { key: 'companyOrder', label: 'Company Order', desc: 'Show company order page' },
  { key: 'bulkPriceUpdate', label: 'Bulk Price Update', desc: 'Allow bulk price change' },
  { key: 'cancelOrder', label: 'Cancel Order', desc: 'Allow retailers to cancel before dispatch' },
  { key: 'priceList', label: 'Price List', desc: 'Show price list page + PDF download' },
  { key: 'pullToRefresh', label: 'Pull to Refresh', desc: 'Enable pull-to-refresh on mobile' },
  { key: 'welcomePopup', label: 'Welcome Popup', desc: 'Show onboarding popup on first login' },
  { key: 'installPrompt', label: 'Install Prompt', desc: 'Show PWA install banner' },
  { key: 'orderPlacement', label: 'Order Placement', desc: 'Allow new orders — disable to block all' },
  { key: 'rateCard', label: 'Rate Card PDF', desc: 'Allow rate card PDF download' },
  { key: 'announcements', label: 'Announcements', desc: 'Show announcement banners' },
  { key: 'autoCleanup', label: 'Auto Cleanup', desc: 'Daily auto-delete old errors/data' },
  { key: 'usageTracking', label: 'Usage Tracking', desc: 'Track Firestore reads/writes' },
];

let currentFlags = {};

async function loadFlags() {
  const content = document.getElementById('tabContent');
  content.innerHTML = '<div class="loading"><span class="spinner"></span> Loading feature flags...</div>';

  try {
    const doc = await getDocument('settings', 'featureFlags');
    currentFlags = doc || {};

    const enabledCount = FLAG_DEFINITIONS.filter(f => currentFlags[f.key] !== false).length;
    const disabledCount = FLAG_DEFINITIONS.length - enabledCount;

    content.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card green">
          <div class="stat-value">${enabledCount}</div>
          <div class="stat-label">Enabled</div>
        </div>
        <div class="stat-card red">
          <div class="stat-value">${disabledCount}</div>
          <div class="stat-label">Disabled</div>
        </div>
      </div>

      <div class="info-box info">Changes take effect immediately. Retailers see updates on next page load.</div>

      <div>
        ${FLAG_DEFINITIONS.map((flag, i) => {
          const enabled = currentFlags[flag.key] !== false;
          return `
            <div class="toggle-row">
              <div style="display:flex;align-items:center;gap:10px;flex:1">
                <div class="sn">${i + 1}</div>
                <div class="toggle-info">
                  <div class="toggle-label">${flag.label} ${!enabled ? '<span class="badge badge-red">OFF</span>' : ''}</div>
                  <div class="toggle-desc">${flag.desc}</div>
                </div>
              </div>
              <div class="toggle ${enabled ? 'on' : ''}" onclick="toggleFlag('${flag.key}', ${!enabled})"></div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (e) {
    content.innerHTML = `<div class="info-box error">Failed: ${e.message}</div>`;
  }
}

function toggleFlag(key, newValue) {
  const label = FLAG_DEFINITIONS.find(f => f.key === key)?.label || key;
  showConfirm(
    `${newValue ? 'Enable' : 'Disable'} Feature`,
    `${newValue ? 'Enable' : 'Disable'} "${label}"? This affects all users immediately.`,
    async () => {
      try {
        currentFlags[key] = newValue;
        currentFlags.updatedAt = new Date().toISOString();
        await setDocument('settings', 'featureFlags', currentFlags);
        showToast(`${label} ${newValue ? 'enabled' : 'disabled'}`);
        loadFlags();
      } catch (e) { showToast('Failed: ' + e.message, 'error'); }
    }
  );
}
