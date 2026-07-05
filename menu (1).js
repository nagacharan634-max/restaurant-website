document.getElementById('year').textContent = new Date().getFullYear();

const CATEGORY_LABELS = { chicken: '🍗 Chicken', pizza: '🍕 Pizza', sides: '🍟 Sides', dessert: '🍰 Desserts' };
let ALL_PRODUCTS = [];
let ACTIVE_CATEGORY = 'all';

(async function initMenu() {
  const urlCat = new URLSearchParams(window.location.search).get('cat');
  if (urlCat) ACTIVE_CATEGORY = urlCat;

  try {
    const res = await fetch(`${API_BASE}/api/products`);
    ALL_PRODUCTS = await res.json();
  } catch (e) {
    document.getElementById('menuGrid').innerHTML =
      `<p>Couldn't load the menu. Make sure the backend server is running at <code>${API_BASE}</code> (see README.md).</p>`;
    return;
  }
  renderTabs();
  renderGrid();
})();

function renderTabs() {
  const categories = ['all', ...new Set(ALL_PRODUCTS.map((p) => p.category))];
  const row = document.getElementById('tabRow');
  row.innerHTML = categories
    .map((c) => {
      const label = c === 'all' ? 'All Items' : CATEGORY_LABELS[c] || c;
      const active = c === ACTIVE_CATEGORY ? 'active' : '';
      return `<button class="tab-btn ${active}" data-cat="${c}">${label}</button>`;
    })
    .join('');
  row.querySelectorAll('.tab-btn').forEach((btn) =>
    btn.addEventListener('click', () => {
      ACTIVE_CATEGORY = btn.dataset.cat;
      row.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderGrid();
    })
  );
}

function renderGrid() {
  const grid = document.getElementById('menuGrid');
  const items = ALL_PRODUCTS.filter((p) => ACTIVE_CATEGORY === 'all' || p.category === ACTIVE_CATEGORY);
  if (!items.length) {
    grid.innerHTML = '<p>No items in this category yet.</p>';
    return;
  }
  grid.innerHTML = items.map(cardHTML).join('');

  grid.querySelectorAll('.product-card').forEach((card) => {
    const id = card.dataset.id;
    const btn = card.querySelector('.add-btn');
    btn.addEventListener('click', () => {
      const product = ALL_PRODUCTS.find((p) => p.id === id);
      const sizeSelect = card.querySelector('.size-select');
      const size = sizeSelect ? sizeSelect.value : 'Regular';
      addToCart({ id: product.id, name: product.name, price: product.price, size, qty: 1, image: product.image });
    });
  });
}

function cardHTML(p) {
  const badge = p.tags?.includes('bestseller')
    ? '<span class="badge badge-best">Best Seller</span>'
    : p.tags?.includes('new')
    ? '<span class="badge badge-new">New</span>'
    : '';
  const sizes = p.sizes && p.sizes.length > 1
    ? `<select class="size-select">${p.sizes.map((s) => `<option>${s}</option>`).join('')}</select>`
    : '';
  return `
    <div class="product-card" data-id="${p.id}">
      ${badge}
      <div class="emoji-plate">${p.image || '🍽️'}</div>
      <h3>${p.name}</h3>
      <p class="desc">${p.description || ''}</p>
      ${p.ingredients ? `<p class="desc" style="font-size:.78rem;"><b>Contains:</b> ${p.ingredients}</p>` : ''}
      <span class="price">₹${p.price}</span>
      ${sizes}
      <button class="btn btn-primary btn-sm btn-block add-btn">Add to Cart</button>
    </div>`;
}
