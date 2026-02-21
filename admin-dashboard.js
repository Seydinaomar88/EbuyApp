
const STORAGE_KEYS = typeof EBUY_STORAGE !== 'undefined' && EBUY_STORAGE.keys
  ? { ...EBUY_STORAGE.keys, adminUserStatus: 'ebuy_admin_user_status', adminProductStatus: 'ebuy_admin_product_status' }
  : {
      users: 'ebuy_users',
      products: 'ebuy_products',
      categories: 'ebuy_categories',
      orders: 'ebuy_orders',
      banners: 'ebuy_banners',
      featured: 'ebuy_featured',
      adminSession: 'ebuy_admin_session',
      adminUserStatus: 'ebuy_admin_user_status',
      adminProductStatus: 'ebuy_admin_product_status'
    };

let salesChart = null;
let productStatusChart = null;

function getJSON(key) {
  if (typeof EBUY_STORAGE !== 'undefined' && EBUY_STORAGE.get) return EBUY_STORAGE.get(key);
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

function setJSON(key, data) {
  if (typeof EBUY_STORAGE !== 'undefined' && EBUY_STORAGE.set) { EBUY_STORAGE.set(key, data); return; }
  localStorage.setItem(key, JSON.stringify(data));
}

function getFirstExistingArray(keys) {
  for (const key of keys) {
    const data = getJSON(key);
    if (Array.isArray(data) && data.length > 0) return { key, data };
  }
  const first = keys[0];
  return { key: first, data: Array.isArray(getJSON(first)) ? getJSON(first) : [] };
}

function getAdminUserStatusMap() {
  const map = getJSON(STORAGE_KEYS.adminUserStatus);
  return map && typeof map === 'object' && !Array.isArray(map) ? map : {};
}

function setAdminUserStatusMap(map) {
  setJSON(STORAGE_KEYS.adminUserStatus, map);
}

function getAdminProductStatusMap() {
  const map = getJSON(STORAGE_KEYS.adminProductStatus);
  return map && typeof map === 'object' && !Array.isArray(map) ? map : {};
}

function setAdminProductStatusMap(map) {
  setJSON(STORAGE_KEYS.adminProductStatus, map);
}

function normalizeUsers(rawUsers) {
  const statusMap = getAdminUserStatusMap();
  return (rawUsers || []).map((u) => {
    const email = u.email || u.mail || u.username || '';
    const id = u.id || email || String(Math.random());
    const role = u.role || (u.isSeller ? 'vendeur' : 'client');
    const name = u.name || u.fullName || (email ? email.split('@')[0] : 'Utilisateur');
    const userKey = String(id || email);
    const active = typeof u.active === 'boolean' ? u.active : (userKey in statusMap ? !!statusMap[userKey] : true);
    return { ...u, id, email, name, role, active };
  });
}

function normalizeProducts(rawProducts) {
  const statusMap = getAdminProductStatusMap();
  return (rawProducts || []).map((p) => {
    const id = p.id != null ? String(p.id) : (p.productId != null ? String(p.productId) : String(Math.random()));
    const name = p.name || p.title || 'Sans nom';
    const price = Number(p.price ?? p.prix ?? 0);
    const status = p.status || statusMap[id] || 'approved';
    const sellerId = p.sellerId || p.vendorId || p.vendeurId || '';
    return { ...p, id, name, price, status, sellerId };
  });
}

function getUsersForAdmin() {
  const res = getFirstExistingArray([STORAGE_KEYS.users, 'users']);
  return normalizeUsers(res.data);
}

function getProductsForAdmin() {
  const res = getFirstExistingArray([STORAGE_KEYS.products, 'products']);
  return normalizeProducts(res.data);
}

function getOrdersForAdmin() {
  const res = getFirstExistingArray([STORAGE_KEYS.orders, 'sales']);
  return (res.data || []).map((o) => ({
    id: o.id != null ? String(o.id) : String(Math.random()),
    total: Number(o.total ?? 0),
    date: o.date || o.createdAt || '',
    userId: o.userId || ''
  }));
}

function getConnectedUser() {
  try { return JSON.parse(localStorage.getItem('connectedUser') || 'null'); } catch { return null; }
}

function requireAdminOrRedirect() {
  const user = getConnectedUser();
  if (!user || user.role !== 'admin') {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

function initShellUI(adminUser) {
  const emailEl = document.getElementById('admin-email');
  if (emailEl) emailEl.textContent = adminUser?.email || 'admin';
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const openBtn = document.getElementById('btn-sidebar-open');
  function openSidebar() { if (sidebar) sidebar.classList.remove('-translate-x-full'); if (overlay) overlay.classList.remove('hidden'); }
  function closeSidebar() { if (sidebar) sidebar.classList.add('-translate-x-full'); if (overlay) overlay.classList.add('hidden'); }
  if (openBtn) openBtn.addEventListener('click', openSidebar);
  if (overlay) overlay.addEventListener('click', closeSidebar);
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => { if (window.matchMedia('(max-width: 767px)').matches) closeSidebar(); });
  });
}

function initNavigation() {
  const sections = document.querySelectorAll('.admin-section');
  const navBtns = document.querySelectorAll('.nav-btn');
  const pageTitle = document.getElementById('page-title');
  const titleMap = { dashboard: 'Tableau de bord', users: 'Utilisateurs', products: 'Modération produits', categories: 'Catégories', content: 'Contenus' };

  function show(sectionId) {
    sections.forEach(s => s.classList.add('hidden'));
    navBtns.forEach(b => b.classList.remove('nav-active', 'bg-white/10'));
    const section = document.getElementById('section-' + sectionId);
    const btn = document.querySelector(`[data-section="${sectionId}"]`);
    if (section) section.classList.remove('hidden');
    if (btn) btn.classList.add('nav-active', 'bg-white/10');
    if (pageTitle) pageTitle.textContent = titleMap[sectionId] || 'Admin';
    if (sectionId === 'dashboard') refreshDashboard();
    if (sectionId === 'users') renderUsers();
    if (sectionId === 'products') renderProducts();
    if (sectionId === 'categories') renderCategories();
    if (sectionId === 'content') renderContent();
  }

  navBtns.forEach(btn => btn.addEventListener('click', () => show(btn.dataset.section)));
  document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('connectedUser');
    localStorage.removeItem('ebuy_cart');
    localStorage.removeItem(STORAGE_KEYS.adminSession);
    window.location.href = 'index.html';
  });
  show('dashboard');
}

function renderCharts(orders, products) {
  if (typeof Chart === 'undefined') return;

  const byDate = new Map();
  orders.forEach((o) => {
    if (!o.date) return;
    const d = new Date(o.date);
    if (Number.isNaN(d.getTime())) return;
    const key = d.toLocaleDateString('fr-FR');
    byDate.set(key, (byDate.get(key) || 0) + (Number(o.total) || 0));
  });
  const salesLabels = Array.from(byDate.keys());
  const salesData = Array.from(byDate.values());

  const salesCtx = document.getElementById('chart-sales');
  if (salesCtx) {
    const cfg = {
      type: 'line',
      data: {
        labels: salesLabels,
        datasets: [{ label: 'Total ventes (FCFA)', data: salesData, borderColor: 'rgb(37, 99, 235)', backgroundColor: 'rgba(37, 99, 235, 0.1)', tension: 0.3, fill: true, borderWidth: 2, pointRadius: 3 }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { size: 11 } } }, y: { ticks: { font: { size: 11 } }, beginAtZero: true } } }
    };
    if (salesChart) { salesChart.data = cfg.data; salesChart.update(); } else salesChart = new Chart(salesCtx.getContext('2d'), cfg);
  }

  const statusCounts = { approved: 0, pending: 0, rejected: 0 };
  products.forEach((p) => {
    const s = p.status || 'approved';
    if (s === 'pending') statusCounts.pending += 1;
    else if (s === 'rejected') statusCounts.rejected += 1;
    else statusCounts.approved += 1;
  });

  const productCtx = document.getElementById('chart-products-status');
  if (productCtx) {
    const cfg2 = {
      type: 'doughnut',
      data: {
        labels: ['Approuvés', 'En attente', 'Rejetés'],
        datasets: [{
          data: [statusCounts.approved, statusCounts.pending, statusCounts.rejected],
          backgroundColor: ['rgba(22, 163, 74, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(239, 68, 68, 0.8)'],
          borderColor: ['rgba(22, 163, 74, 1)', 'rgba(245, 158, 11, 1)', 'rgba(239, 68, 68, 1)'],
          borderWidth: 1
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } }, cutout: '60%' }
    };
    if (productStatusChart) { productStatusChart.data = cfg2.data; productStatusChart.update(); } else productStatusChart = new Chart(productCtx.getContext('2d'), cfg2);
  }
}

function refreshDashboard() {
  const users = getUsersForAdmin();
  const products = getProductsForAdmin();
  const orders = getOrdersForAdmin();
  const pending = products.filter(p => p.status === 'pending').length;

  document.getElementById('stat-users').textContent = users.length;
  document.getElementById('stat-products').textContent = products.length;
  document.getElementById('stat-orders').textContent = orders.length;
  document.getElementById('stat-pending').textContent = pending;

  const totalSales = orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  document.getElementById('sales-summary').innerHTML = `
    <p><strong>Nombre de commandes :</strong> ${orders.length}</p>
    <p class="mt-1"><strong>Chiffre d'affaires total :</strong> ${totalSales.toFixed(2)} FCFA</p>
  `; 
  renderCharts(orders, products);
}

let currentUserFilter = 'all';

function renderUsers() {
  let users = getUsersForAdmin();
  if (currentUserFilter === 'client') users = users.filter(u => u.role === 'client');
  if (currentUserFilter === 'vendeur') users = users.filter(u => u.role === 'vendeur');

  const tbody = document.getElementById('users-tbody');
  const empty = document.getElementById('users-empty');
  tbody.innerHTML = '';
  if (users.length === 0) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  users.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML =` 
      <td class="px-4 py-3 text-sm">${u.email || u.phone || '-'}</td>
      <td class="px-4 py-3 text-sm">${u.name || '-'}</td>
      <td class="px-4 py-3"><span class="px-2 py-0.5 rounded text-xs font-medium ${u.role === 'vendeur' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}">${u.role || 'client'}</span></td>
      <td class="px-4 py-3"><span class="px-2 py-0.5 rounded text-xs font-medium ${u.active !== false ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'}">${u.active !== false ? 'Actif' : 'Inactif'}</span></td>
      <td class="px-4 py-3"><button class="toggle-user px-3 py-1 rounded text-sm font-medium ${u.active !== false ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}" data-id="${u.id}">${u.active !== false ? 'Désactiver' : 'Activer'}</button></td>
    `;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('.toggle-user').forEach(btn => btn.addEventListener('click', () => toggleUser(btn.dataset.id)));
}

function toggleUser(id) {
  const map = getAdminUserStatusMap();
  const key = String(id);
  map[key] = key in map ? !map[key] : false;
  setAdminUserStatusMap(map);
  renderUsers();
}

function initUserFilters() {
  document.getElementById('filter-users-all').addEventListener('click', () => { currentUserFilter = 'all'; renderUsers(); setFilterActive('filter-users', 'filter-users-all'); });
  document.getElementById('filter-users-client').addEventListener('click', () => { currentUserFilter = 'client'; renderUsers(); setFilterActive('filter-users', 'filter-users-client'); });
  document.getElementById('filter-users-vendeur').addEventListener('click', () => { currentUserFilter = 'vendeur'; renderUsers(); setFilterActive('filter-users', 'filter-users-vendeur'); });
}

function setFilterActive(prefix, activeId) {
  document.querySelectorAll(`[id^="${prefix}"]`).forEach(b => { b.classList.remove('bg-slate-900', 'text-white'); b.classList.add('bg-slate-200', 'text-slate-700'); });
  const active = document.getElementById(activeId);
  if (active) { active.classList.remove('bg-slate-200', 'text-slate-700'); active.classList.add('bg-slate-900', 'text-white'); }
}

let currentProductFilter = 'all';

function renderProducts() {
  let products = getProductsForAdmin();
  if (currentProductFilter === 'pending') products = products.filter(p => p.status === 'pending');
  if (currentProductFilter === 'approved') products = products.filter(p => p.status === 'approved');

  const list = document.getElementById('products-list');
  const empty = document.getElementById('products-empty');
  list.innerHTML = '';
  if (products.length === 0) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  products.forEach(p => {

    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3';
    card.innerHTML = `
      <div>
        <p class="font-medium text-slate-900">${p.name || 'Sans nom'}</p>
        <p class="text-sm text-slate-500">${p.price != null ? p.price + ' FCFA' : ''} · <span class="px-2 py-0.5 rounded text-xs ${p.status === 'approved' ? 'bg-green-100 text-green-800' : p.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}">${p.status === 'approved' ? 'Approuvé' : p.status === 'rejected' ? 'Rejeté' : 'En attente'}</span></p>
      </div>
      <div class="flex gap-2">
        ${p.status !== 'approved' ? `<button class="approve-product px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium" data-id="${p.id}">Approuver</button>` : ''}
        <button class="reject-product px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-sm font-medium" data-id="${p.id}">${p.status === 'rejected' ? 'Remettre en attente' : 'Rejeter'}</button>
      </div>
    `;
    list.appendChild(card);
  });
  list.querySelectorAll('.approve-product').forEach(btn => btn.addEventListener('click', () => setProductStatus(btn.dataset.id, 'approved')));
  list.querySelectorAll('.reject-product').forEach(btn => btn.addEventListener('click', () => {
    const products = getProductsForAdmin();
    const p = products.find(x => String(x.id) === String(btn.dataset.id));
    setProductStatus(btn.dataset.id, p && p.status === 'rejected' ? 'pending' : 'rejected');
  }));
}

function setProductStatus(id, status) {
  const map = getAdminProductStatusMap();
  map[String(id)] = status;
  setAdminProductStatusMap(map);
  renderProducts();
  refreshDashboard();
}

function initProductFilters() {
  document.getElementById('filter-products-all').addEventListener('click', () => { currentProductFilter = 'all'; renderProducts(); setFilterActive('filter-products', 'filter-products-all'); });
  document.getElementById('filter-products-pending').addEventListener('click', () => { currentProductFilter = 'pending'; renderProducts(); setFilterActive('filter-products', 'filter-products-pending'); });
  document.getElementById('filter-products-approved').addEventListener('click', () => { currentProductFilter = 'approved'; renderProducts(); setFilterActive('filter-products', 'filter-products-approved'); });
}

function renderCategories() {
  const categories = getJSON(STORAGE_KEYS.categories);
  const list = document.getElementById('categories-list');
  const empty = document.getElementById('categories-empty');
  list.innerHTML = '';
  if (categories.length === 0) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  categories.forEach(c => {
    const li = document.createElement('li');
    li.className = 'flex items-center justify-between px-4 py-3 hover:bg-slate-50';
    li.innerHTML = `<span class="font-medium">${c.name}</span><span class="text-slate-500 text-sm">${c.slug || ''}</span><button class="delete-category text-red-600 text-sm font-medium hover:underline" data-id="${c.id}">Supprimer</button>`;
    list.appendChild(li);
  });
  list.querySelectorAll('.delete-category').forEach(btn => btn.addEventListener('click', () => deleteCategory(btn.dataset.id)));
}

function deleteCategory(id) {
  if (!confirm('Supprimer cette catégorie ?')) return;
  let categories = getJSON(STORAGE_KEYS.categories);
  categories = categories.filter(c => c.id !== id);
  setJSON(STORAGE_KEYS.categories, categories);
  renderCategories();
  refreshDashboard();
}

function initCategoryForm() {
  document.getElementById('form-category').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('category-name').value.trim();
    let slug = document.getElementById('category-slug').value.trim();
    if (!name) return;
    if (!slug) slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const categories = getJSON(STORAGE_KEYS.categories);
    categories.push({ id: 'c' + Date.now(), name, slug });
    setJSON(STORAGE_KEYS.categories, categories);
    document.getElementById('category-name').value = '';
    document.getElementById('category-slug').value = '';
    renderCategories();
  });
}

function renderContent() {
  const banners = getJSON(STORAGE_KEYS.banners);
  const featured = getJSON(STORAGE_KEYS.featured);
  const bannersList = document.getElementById('banners-list');
  const featuredList = document.getElementById('featured-list');
  if (!bannersList || !featuredList) return;

  if (banners.length === 0) {
    bannersList.innerHTML = '<li class="py-3 px-4 rounded-lg bg-slate-50 border border-slate-100 text-slate-500 text-sm">Aucune bannière pour l\'instant. Utilisez le formulaire ci-dessus pour en ajouter.</li>';
  } else {
    bannersList.innerHTML = banners.map(b => `
      <li class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
        <span>${b.title || 'Sans titre'}</span>
        <button class="delete-banner text-red-600 text-sm hover:underline" data-id="${b.id}">Supprimer</button>
      </li>
    `).join('');
  }

  if (featured.length === 0) {
    featuredList.innerHTML = '<li class="py-3 px-4 rounded-lg bg-slate-50 border border-slate-100 text-slate-500 text-sm">Aucune mise en avant. Utilisez le formulaire ci-dessus pour en ajouter.</li>';
  } else {
    featuredList.innerHTML = featured.map(f => `
      <li class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
        <span>${f.label || 'Sans libellé'}</span>
        <button class="delete-featured text-red-600 text-sm hover:underline" data-id="${f.id}">Supprimer</button>
      </li>
    `).join('');
  }

  bannersList.querySelectorAll('.delete-banner').forEach(btn => btn.addEventListener('click', () => {
    setJSON(STORAGE_KEYS.banners, getJSON(STORAGE_KEYS.banners).filter(x => x.id !== btn.dataset.id));
    renderContent();
  }));
  featuredList.querySelectorAll('.delete-featured').forEach(btn => btn.addEventListener('click', () => {
    setJSON(STORAGE_KEYS.featured, getJSON(STORAGE_KEYS.featured).filter(x => x.id !== btn.dataset.id));
    renderContent();
  }));
}

function initContentForms() {
  document.getElementById('form-banner').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('banner-title').value.trim();
    const imageUrl = document.getElementById('banner-url').value.trim();
    const link = document.getElementById('banner-link').value.trim();
    if (!title || !imageUrl) return;
    const banners = getJSON(STORAGE_KEYS.banners);
    banners.push({ id: 'b' + Date.now(), title, imageUrl, link: link || '#' });
    setJSON(STORAGE_KEYS.banners, banners);
    document.getElementById('banner-title').value = '';
    document.getElementById('banner-url').value = '';
    document.getElementById('banner-link').value = '';
    renderContent();
  });
  document.getElementById('form-featured').addEventListener('submit', (e) => {
    e.preventDefault();
    const label = document.getElementById('featured-label').value.trim();
    const productOrLink = document.getElementById('featured-id').value.trim();
    if (!label || !productOrLink) return;
    const featured = getJSON(STORAGE_KEYS.featured);
    featured.push({ id: 'f' + Date.now(), label, productOrLink });
    setJSON(STORAGE_KEYS.featured, featured);
    document.getElementById('featured-label').value = '';
    document.getElementById('featured-id').value = '';
    renderContent();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const adminUser = requireAdminOrRedirect();
  if (!adminUser) return;
  initShellUI(adminUser);
  initNavigation();
  initUserFilters();
  initProductFilters();
  initCategoryForm();
  initContentForms();
  refreshDashboard();
});
