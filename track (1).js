document.getElementById('year').textContent = new Date().getFullYear();

const STAGES = ['placed', 'confirmed', 'preparing', 'ready', 'completed'];

const params = new URLSearchParams(window.location.search);
const idFromUrl = params.get('id');
const upiFromUrl = params.get('upi');

if (idFromUrl) {
  document.getElementById('orderIdInput').value = idFromUrl;
  trackOrder(idFromUrl);
}
if (upiFromUrl) {
  document.getElementById('upiBanner').classList.remove('hidden');
  document.getElementById('upiPayBtn').href = decodeURIComponent(upiFromUrl);
}

document.getElementById('trackBtn').addEventListener('click', () => {
  const id = document.getElementById('orderIdInput').value.trim();
  if (id) trackOrder(id);
});

async function trackOrder(id) {
  const resultEl = document.getElementById('orderResult');
  resultEl.innerHTML = '<p>Looking up your order…</p>';
  try {
    const res = await fetch(`${API_BASE}/api/orders/${id}`);
    if (!res.ok) {
      resultEl.innerHTML = `<p>No order found with ID <b>${id}</b>. Double-check and try again.</p>`;
      return;
    }
    const order = await res.json();
    const stageIdx = STAGES.indexOf(order.status);
    resultEl.innerHTML = `
      <div class="summary-box" style="position:static;">
        <div style="display:flex; justify-content:space-between; margin-bottom:14px;">
          <div>
            <div style="font-family:var(--font-mono); color:var(--gold);">${order.id}</div>
            <div style="font-size:.8rem; color:var(--text-dim);">Placed ${new Date(order.createdAt).toLocaleString()}</div>
          </div>
          <span class="status-tag status-${order.status}">${order.status}</span>
        </div>

        ${
          order.status === 'cancelled'
            ? '<p>This order was cancelled. Contact us on WhatsApp if this is unexpected.</p>'
            : `<div style="display:flex; justify-content:space-between; margin-bottom:20px;">
                ${STAGES.map(
                  (s, i) => `
                  <div style="text-align:center; flex:1;">
                    <div style="width:14px; height:14px; border-radius:50%; margin:0 auto 6px; background:${i <= stageIdx ? 'var(--chili)' : 'var(--border)'};"></div>
                    <div style="font-size:.7rem; text-transform:capitalize; color:${i <= stageIdx ? 'var(--text)' : 'var(--text-dim)'};">${s}</div>
                  </div>`
                ).join('')}
              </div>`
        }

        <div style="border-top:1px solid var(--border); padding-top:14px;">
          ${order.items.map((i) => `<div class="summary-line"><span>${i.qty} × ${i.name} (${i.size})</span><span>₹${i.price * i.qty}</span></div>`).join('')}
          <div class="summary-line total"><span>Total</span><span>₹${order.total}</span></div>
        </div>
      </div>`;
  } catch (e) {
    resultEl.innerHTML = '<p>Could not reach the server. Make sure the backend is running.</p>';
  }
}
