// ---------- Theme (dark "kitchen" default / light "daylight" mode) ----------
function initTheme() {
  const saved = localStorage.getItem('afc-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = saved === 'dark' ? '☀️' : '🌙';
}
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('afc-theme', next);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = next === 'dark' ? '☀️' : '🌙';
}

// ---------- Cart (stored in this browser only, per customer) ----------
function getCart() {
  try { return JSON.parse(localStorage.getItem('afc-cart') || '[]'); }
  catch (e) { return []; }
}
function saveCart(cart) {
  localStorage.setItem('afc-cart', JSON.stringify(cart));
  updateCartCount();
}
function addToCart(item) {
  const cart = getCart();
  const existing = cart.find((c) => c.id === item.id && c.size === item.size);
  if (existing) existing.qty += item.qty;
  else cart.push(item);
  saveCart(cart);
  showToast(`Added ${item.name} to cart`);
}
function updateCartCount() {
  const el = document.getElementById('cartCount');
  if (!el) return;
  const cart = getCart();
  el.textContent = cart.reduce((s, i) => s + i.qty, 0);
}
function cartTotal(cart) {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

// ---------- Toast ----------
function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

// ---------- Business settings (shared across header/footer) ----------
async function loadSettings() {
  try {
    const res = await fetch(`${API_BASE}/api/settings`);
    if (!res.ok) throw new Error('failed');
    return await res.json();
  } catch (e) {
    console.warn('Could not reach backend at', API_BASE, '- is the server running?');
    return null;
  }
}

function todayHoursLabel(settings) {
  if (!settings || !settings.hours) return '';
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const key = days[new Date().getDay()];
  const range = settings.hours[key];
  if (!range) return '';
  const [open, close] = range.split('-');
  const now = new Date();
  const [ch, cm] = close.split(':').map(Number);
  const closeDate = new Date(); closeDate.setHours(ch, cm, 0, 0);
  const [oh, om] = open.split(':').map(Number);
  const openDate = new Date(); openDate.setHours(oh, om, 0, 0);
  const isOpen = now >= openDate && now <= closeDate;
  return { isOpen, open, close };
}

function waLink(phone, text) {
  const clean = phone.replace(/[^\d+]/g, '').replace('+', '');
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

// ---------- PWA ----------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  updateCartCount();
});
