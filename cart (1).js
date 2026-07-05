document.getElementById('year').textContent = new Date().getFullYear();
let SETTINGS = null;

(async function initCart() {
  SETTINGS = await loadSettings();
  render();
})();

function render() {
  const cart = getCart();
  const empty = document.getElementById('cartEmpty');
  const full = document.getElementById('cartFull');
  if (!cart.length) {
    empty.classList.remove('hidden');
    full.classList.add('hidden');
    return;
  }
  empty.classList.add('hidden');
  full.classList.remove('hidden');

  const itemsEl = document.getElementById('cartItems');
  itemsEl.innerHTML = cart
    .map(
      (item, idx) => `
    <div class="cart-row">
      <div class="emoji-plate">${item.image || '🍽️'}</div>
      <div class="grow">
        <div style="font-weight:700;">${item.name}</div>
        <div style="font-size:.8rem; color:var(--text-dim);">${item.size} · ₹${item.price} each</div>
      </div>
      <div class="qty-ctrl">
        <button data-idx="${idx}" data-dir="-1">−</button>
        <span>${item.qty}</span>
        <button data-idx="${idx}" data-dir="1">+</button>
      </div>
      <div style="font-weight:800; width:70px; text-align:right;">₹${item.price * item.qty}</div>
      <button data-idx="${idx}" class="remove-btn btn btn-sm btn-outline" aria-label="Remove">✕</button>
    </div>`
    )
    .join('');

  itemsEl.querySelectorAll('.qty-ctrl button').forEach((btn) =>
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      const dir = Number(btn.dataset.dir);
      const cart = getCart();
      cart[idx].qty = Math.max(1, cart[idx].qty + dir);
      saveCart(cart);
      render();
    })
  );
  itemsEl.querySelectorAll('.remove-btn').forEach((btn) =>
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      const cart = getCart();
      cart.splice(idx, 1);
      saveCart(cart);
      render();
    })
  );

  const total = cartTotal(cart);
  document.getElementById('subtotalVal').textContent = `₹${total}`;
  document.getElementById('totalVal').textContent = `₹${total}`;
}

document.querySelectorAll('.pay-option').forEach((opt) =>
  opt.addEventListener('click', () => {
    document.querySelectorAll('.pay-option').forEach((o) => o.classList.remove('selected'));
    opt.classList.add('selected');
    document.getElementById('paymentMethod').value = opt.dataset.method;
  })
);

document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const cart = getCart();
  if (!cart.length) return;

  const payload = {
    items: cart,
    customer: {
      name: document.getElementById('custName').value,
      phone: document.getElementById('custPhone').value,
      address: document.getElementById('custAddress').value,
    },
    notes: document.getElementById('custNotes').value,
    paymentMethod: document.getElementById('paymentMethod').value,
  };

  try {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('order failed');
    const order = await res.json();

    localStorage.removeItem('afc-cart');
    updateCartCount();

    if (payload.paymentMethod === 'UPI' && SETTINGS?.upiId) {
      const upiUrl = `upi://pay?pa=${encodeURIComponent(SETTINGS.upiId)}&pn=${encodeURIComponent(SETTINGS.businessName)}&am=${order.total}&cu=INR&tn=${encodeURIComponent(order.id)}`;
      window.location.href = `track.html?id=${order.id}&upi=${encodeURIComponent(upiUrl)}`;
    } else {
      window.location.href = `track.html?id=${order.id}`;
    }
  } catch (err) {
    showToast('Could not place order — is the backend server running?');
  }
});
