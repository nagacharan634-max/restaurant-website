document.getElementById('year').textContent = new Date().getFullYear();

(async function initHome() {
  const settings = await loadSettings();
  if (settings) {
    document.getElementById('tagline').textContent = settings.tagline;
    document.getElementById('addressText').textContent = settings.address;
    document.getElementById('ratingVal').textContent = settings.rating;
    document.getElementById('reviewCount').textContent = settings.reviewCount;

    const wa = waLink(settings.whatsapp, `Hi AFC Allagadda! I'd like to place an order.`);
    document.getElementById('whatsappBtn').href = wa;
    document.getElementById('footerWhatsapp').href = wa;
    document.getElementById('callBtn').href = `tel:${settings.phone}`;

    if (settings.mapEmbedUrl) document.getElementById('mapEmbed').src = settings.mapEmbedUrl;

    const status = todayHoursLabel(settings);
    if (status) {
      document.getElementById('hoursText').textContent = `${to12h(status.open)} – ${to12h(status.close)}`;
      const badge = document.getElementById('openStatus');
      badge.textContent = status.isOpen ? `● Open · closes ${to12h(status.close)}` : `● Closed now`;
      badge.style.color = status.isOpen ? 'var(--green-ok)' : 'var(--velvet)';
    }
  }

  // Best sellers
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    const products = await res.json();
    const bestSellers = products.filter((p) => p.tags && p.tags.includes('bestseller')).slice(0, 4);
    const grid = document.getElementById('bestSellerGrid');
    grid.innerHTML = '';
    (bestSellers.length ? bestSellers : products.slice(0, 4)).forEach((p) => {
      grid.insertAdjacentHTML('beforeend', productCardHTML(p));
    });
  } catch (e) {
    document.getElementById('bestSellerGrid').innerHTML =
      '<p>Menu is loading — make sure the backend server is running (see README).</p>';
  }
})();

function to12h(t) {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

function productCardHTML(p) {
  const badge = p.tags?.includes('bestseller')
    ? '<span class="badge badge-best">Best Seller</span>'
    : p.tags?.includes('new')
    ? '<span class="badge badge-new">New</span>'
    : '';
  return `
    <div class="product-card">
      ${badge}
      <div class="emoji-plate">${p.image || '🍽️'}</div>
      <h3>${p.name}</h3>
      <p class="desc">${p.description || ''}</p>
      <span class="price">₹${p.price}</span>
      <a href="menu.html" class="btn btn-primary btn-sm btn-block">View in Menu</a>
    </div>`;
}
