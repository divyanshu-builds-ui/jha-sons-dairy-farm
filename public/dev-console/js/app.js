// App Shell — Tab navigation, sidebar state, Firebase status

let currentTab = 'health';

const TAB_TITLES = {
  health: 'Health Check',
  errors: 'Error Logs',
  sessions: 'Sessions',
  orders: 'Orders',
  retailers: 'Retailers',
  tickets: 'Support Tickets',
  flags: 'Feature Flags',
  backup: 'Backup & Restore',
  usage: 'Firebase Usage',
  editor: 'Doc Editor',
  bulk: 'Bulk Update',
  maintenance: 'Maintenance',
};

function initApp() {
  // Immediately show status
  const badge = document.getElementById('fbStatus');
  badge.innerHTML = `<span class="status-dot"></span> Checking...`;
  checkFirebaseStatus();
  switchTab('health');
}

async function checkFirebaseStatus() {
  const badge = document.getElementById('fbStatus');
  try {
    const start = performance.now();
    await getDocument('settings', 'app');
    const time = Math.round(performance.now() - start);
    badge.innerHTML = `<span class="status-dot"></span> Connected (${time}ms)`;
    badge.className = 'status-badge connected';
  } catch (e) {
    badge.innerHTML = `<span class="status-dot"></span> Disconnected`;
    badge.className = 'status-badge error';
  }
}

function switchTab(tab) {
  currentTab = tab;

  // Update sidebar nav
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });

  // Update mobile nav
  document.querySelectorAll('.mobile-nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });

  // Update page title
  document.getElementById('pageTitle').textContent = TAB_TITLES[tab] || tab;

  // Close mobile sidebar if open
  closeMobileNav();

  // Load content
  const content = document.getElementById('tabContent');
  content.innerHTML = '<div class="loading"><span class="spinner"></span> Loading...</div>';

  switch (tab) {
    case 'health': loadHealth(); break;
    case 'errors': loadErrors(); break;
    case 'sessions': loadSessions(); break;
    case 'orders': loadOrders(); break;
    case 'retailers': loadRetailers(); break;
    case 'tickets': loadTickets(); break;
    case 'flags': loadFlags(); break;
    case 'backup': loadBackup(); break;
    case 'usage': loadUsage(); break;
    case 'editor': loadDocEditor(); break;
    case 'bulk': loadBulkUpdate(); break;
    case 'maintenance': loadMaintenance(); break;
  }
}

function toggleMobileNav() {
  document.querySelector('.sidebar')?.classList.toggle('open');
  document.getElementById('sidebarOverlay')?.classList.toggle('open');
}

function closeMobileNav() {
  document.querySelector('.sidebar')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('open');
}

// Close sidebar on outside click (mobile)
document.addEventListener('click', (e) => {
  const sidebar = document.querySelector('.sidebar');
  const menuBtn = document.querySelector('.mobile-menu-btn');
  if (sidebar?.classList.contains('open') && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
    closeMobileNav();
  }
});
