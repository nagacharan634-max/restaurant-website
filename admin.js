let TOKEN = sessionStorage.getItem('afc-admin-token') || null;
const STATUSES = ['placed', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];

function authHeaders() {
  return { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
}

if (TOKEN) showDashboard();

document.getElementById('loginBtn').addEventListener('click', async () => {
  const password = document.getElementById('pwInput').value;
  try {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      document.getElementById('loginError').textContent = 'Wrong password. Try again.';
      return;
    }
    const data = await res.json();
    TOKEN = data.token;
    sessionStorage.setItem('afc-admin-token', TOKEN);
    showDashboard();
  } catch (e) {
    document.getElementById('loginError').textContent = 'Could not reach the server — is the backend running?';
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem('afc-admin-token');
  location.reload();
});

function showDashboard() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  loadOrders();
  loadProducts();
  loadAnalytics();
  loadSettingsIntoForm();
}

// ---------- tabs ----------
document.querySelectorAll('.tab-link').forEach((btn) =>
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-link').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.admin-main > section').forEach((s) => s.classList.add('hidden'));
    document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
  })
);

// ---------- ORDERS ----------
let CACHED_ORDERS = [];

async function loadOrders() {
  const res = await fetch(`${API_BASE}/api/admin/orders`, { headers: authHeaders() });
  if (!res.ok) return;
  CACHED_ORDERS = await res.json();
  const body = document.getElementById('ordersBody');
  body.innerHTML = CACHED_ORDERS
    .map(
      (o) => `
    <tr>
      <td style="font-family:var(--font-mono);">${o.id}</td>
      <td>${o.customer.name}<br><span style="color:var(--text-dim); font-size:.8rem;">${o.customer.phone}</span></td>
      <td>${o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</td>
      <td>₹${o.total}</td>
      <td>${o.paymentMethod}</td>
      <td>
        <select data-id="${o.id}" class="status-select size-select" style="padding:.3em .5em;">
          ${STATUSES.map((s) => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
      <td style="font-size:.8rem;">${new Date(o.createdAt).toLocaleString()}</td>
    </tr>`
    )
    .join('') || '<tr><td colspan="7">No orders yet.</td></tr>';

  body.querySelectorAll('.status-select').forEach((sel) =>
    sel.addEventListener('change', async () => {
      await fetch(`${API_BASE}/api/admin/orders/${sel.dataset.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: sel.value }),
      });
      showToast(`Order ${sel.dataset.id} marked ${sel.value}`);
      loadAnalytics();
    })
  );
}

document.getElementById('exportBtn').addEventListener('click', () => {
  if (!CACHED_ORDERS.length) return showToast('No orders to export');
  const rows = [['Order ID', 'Customer', 'Phone', 'Items', 'Total', 'Payment', 'Status', 'Placed At']];
  CACHED_ORDERS.forEach((o) =>
    rows.push([
      o.id,
      o.customer.name,
      o.customer.phone,
      o.items.map((i) => `${i.qty}x ${i.name}`).join('; '),
      o.total,
      o.paymentMethod,
      o.status,
      o.createdAt,
    ])
  );
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `afc-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
});

// ---------- PRODUCTS ----------
let CACHED_PRODUCTS = [];

async function loadProducts() {
  const res = await fetch(`${API_BASE}/api/products`);
  CACHED_PRODUCTS = await res.json();
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = CACHED_PRODUCTS
    .map(
      (p) => `
    <div class="product-card">
      <div class="emoji-plate">${p.image || '🍽️'}</div>
      <h3>${p.name}</h3>
      <span class="price">₹${p.price}</span>
      <p class="desc">${p.category}</p>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-outline btn-sm edit-btn" data-id="${p.id}">Edit</button>
        <button class="btn btn-danger btn-sm delete-btn" data-id="${p.id}">Delete</button>
      </div>
    </div>`
    )
    .join('');

  grid.querySelectorAll('.edit-btn').forEach((btn) =>
    btn.addEventListener('click', () => openProductForm(CACHED_PRODUCTS.find((p) => p.id === btn.dataset.id)))
  );
  grid.querySelectorAll('.delete-btn').forEach((btn) =>
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this product?')) return;
      await fetch(`${API_BASE}/api/admin/products/${btn.dataset.id}`, { method: 'DELETE', headers: authHeaders() });
      loadProducts();
    })
  );
}

document.getElementById('newProductBtn').addEventListener('click', () => openProductForm(null));
document.getElementById('cancelProductBtn').addEventListener('click', () => document.getElementById('productForm').classList.add('hidden'));

function openProductForm(product) {
  document.getElementById('productForm').classList.remove('hidden');
  document.getElementById('pId').value = product?.id || '';
  document.getElementById('pName').value = product?.name || '';
  document.getElementById('pCategory').value = product?.category || 'chicken';
  document.getElementById('pPrice').value = product?.price || '';
  document.getElementById('pSizes').value = (product?.sizes || ['Regular']).join(', ');
  document.getElementById('pDesc').value = product?.description || '';
  document.getElementById('pIngredients').value = product?.ingredients || '';
  document.getElementById('pImage').value = product?.image || '🍗';
  document.getElementById('pBestseller').checked = product?.tags?.includes('bestseller') || false;
  document.getElementById('pNew').checked = product?.tags?.includes('new') || false;
}

document.getElementById('saveProductBtn').addEventListener('click', async () => {
  const id = document.getElementById('pId').value;
  const tags = [];
  if (document.getElementById('pBestseller').checked) tags.push('bestseller');
  if (document.getElementById('pNew').checked) tags.push('new');
  const body = {
    name: document.getElementById('pName').value,
    category: document.getElementById('pCategory').value,
    price: Number(document.getElementById('pPrice').value),
    sizes: document.getElementById('pSizes').value.split(',').map((s) => s.trim()).filter(Boolean),
    description: document.getElementById('pDesc').value,
    ingredients: document.getElementById('pIngredients').value,
    image: document.getElementById('pImage').value,
    tags,
  };
  const url = id ? `${API_BASE}/api/admin/products/${id}` : `${API_BASE}/api/admin/products`;
  await fetch(url, { method: id ? 'PUT' : 'POST', headers: authHeaders(), body: JSON.stringify(body) });
  document.getElementById('productForm').classList.add('hidden');
  loadProducts();
  showToast('Product saved');
});

// ---------- ANALYTICS ----------
async function loadAnalytics() {
  const res = await fetch(`${API_BASE}/api/admin/analytics`, { headers: authHeaders() });
  if (!res.ok) return;
  const data = await res.json();
  document.getElementById('statSales').textContent = `₹${data.totalSales}`;
  document.getElementById('statOrders').textContent = data.totalOrders;
  document.getElementById('statAvg').textContent = `₹${data.avgOrderValue}`;
  const list = document.getElementById('bestSellerList');
  list.innerHTML = data.bestSellers.length
    ? data.bestSellers.map((b) => `<div class="summary-line"><span>${b.name}</span><span>${b.qty} sold</span></div>`).join('')
    : '<p>No sales yet.</p>';
}

// ---------- SETTINGS ----------
async function loadSettingsIntoForm() {
  const s = await loadSettings();
  if (!s) return;
  document.getElementById('sName').value = s.businessName || '';
  document.getElementById('sTagline').value = s.tagline || '';
  document.getElementById('sPhone').value = s.phone || '';
  document.getElementById('sWhatsapp').value = s.whatsapp || '';
  document.getElementById('sAddress').value = s.address || '';
  document.getElementById('sUpi').value = s.upiId || '';
}

document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
  const body = {
    businessName: document.getElementById('sName').value,
    tagline: document.getElementById('sTagline').value,
    phone: document.getElementById('sPhone').value,
    whatsapp: document.getElementById('sWhatsapp').value,
    address: document.getElementById('sAddress').value,
    upiId: document.getElementById('sUpi').value,
  };
  await fetch(`${API_BASE}/api/admin/settings`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) });
  showToast('Settings saved');
});
