/* ============================================================
   Kopi Senja — Kasir
   Vanilla JS · tanpa framework · data tersimpan di localStorage
============================================================ */
'use strict';

/* ---------------- Data ---------------- */
const STORE = {
  name: 'JEDA SENJA',
  tagline: 'SEDUH SANTAP SINGGAH',
  address: 'Jl. Kemang Raya No. 12, Jakarta Selatan',
  phone: '021-555-0199',
  instagram: '@jedasenja',
  cashier: 'Ego',
};

const TAX_RATE = 0.11;

const PRODUCTS = [
  { id: 'esp', name: 'Espresso', cat: 'Kopi', price: 18000, emoji: '☕', tint: '#f3e3d3' },
  { id: 'ame', name: 'Americano', cat: 'Kopi', price: 22000, emoji: '☕', tint: '#efe0cd' },
  { id: 'cap', name: 'Cappuccino', cat: 'Kopi', price: 28000, emoji: '☕', tint: '#f0dcc6' },
  { id: 'lat', name: 'Caffè Latte', cat: 'Kopi', price: 30000, emoji: '🥛', tint: '#f5e6d0' },
  { id: 'kss', name: 'Kopi Susu Senja', cat: 'Kopi', price: 26000, emoji: '🥛', tint: '#ecdcc5' },
  { id: 'mac', name: 'Caramel Macchiato', cat: 'Kopi', price: 35000, emoji: '☕', tint: '#f6e3c6' },
  { id: 'mat', name: 'Matcha Latte', cat: 'Kopi', price: 32000, emoji: '🍵', tint: '#e2efdc' },
  { id: 'cho', name: 'Chocolate', cat: 'Non-Kopi', price: 28000, emoji: '🍫', tint: '#ead9cd' },
  { id: 'teh', name: 'Teh Tarik', cat: 'Non-Kopi', price: 20000, emoji: '🧋', tint: '#f5e2c8' },
  { id: 'lem', name: 'Lemon Tea', cat: 'Non-Kopi', price: 18000, emoji: '🍋', tint: '#f7efcf' },
  { id: 'str', name: 'Strawberry Fizz', cat: 'Non-Kopi', price: 26000, emoji: '🍓', tint: '#f8e0e0' },
  { id: 'cro', name: 'Croissant Butter', cat: 'Makanan', price: 24000, emoji: '🥐', tint: '#f6e3c2' },
  { id: 'pnc', name: 'Pain au Chocolat', cat: 'Makanan', price: 26000, emoji: '🥐', tint: '#efdcc2' },
  { id: 'nas', name: 'Nasi Goreng Senja', cat: 'Makanan', price: 35000, emoji: '🍚', tint: '#f3e2cd' },
  { id: 'mie', name: 'Mie Goreng Spesial', cat: 'Makanan', price: 32000, emoji: '🍜', tint: '#f6e0c9' },
  { id: 'rot', name: 'Roti Bakar', cat: 'Makanan', price: 22000, emoji: '🍞', tint: '#f3e1c3' },
  { id: 'fri', name: 'French Fries', cat: 'Makanan', price: 25000, emoji: '🍟', tint: '#f8e8c8' },
  { id: 'don', name: 'Donat Gula', cat: 'Snack', price: 12000, emoji: '🍩', tint: '#f6e0e2' },
  { id: 'coo', name: 'Cookie Cokelat', cat: 'Snack', price: 15000, emoji: '🍪', tint: '#f0dfce' },
  { id: 'bro', name: 'Brownies', cat: 'Snack', price: 20000, emoji: '🍫', tint: '#eadccf' },
  { id: 'che', name: 'Cheesecake', cat: 'Snack', price: 30000, emoji: '🍰', tint: '#f8e9d2' },
];

const CATEGORIES = ['Semua', 'Kopi', 'Non-Kopi', 'Makanan', 'Snack'];

const LS = {
  cart: 'kasir.cart.v1',
  discount: 'kasir.discount.v1',
  history: 'kasir.history.v1',
  counter: 'kasir.counter.v1',
};

/* ---------------- Helpers ---------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const fmt = (n) => 'Rp ' + Math.round(n).toLocaleString('id-ID');
const fmtNum = (n) => Math.round(n).toLocaleString('id-ID');
const esc = (str) =>
  String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const digits = (str) => Number(String(str).replace(/\D/g, '')) || 0;

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage penuh / private mode — abaikan */
  }
}

const getProduct = (id) => PRODUCTS.find((p) => p.id === id);

/* ---------------- State ---------------- */
let cart = load(LS.cart, {});
let discountPct = Number(load(LS.discount, 0)) || 0;
let history = Array.isArray(load(LS.history, [])) ? load(LS.history, []) : [];
let activeCategory = 'Semua';
let query = '';
let cashRaw = 0;
let justAdded = null;
let lastReceipt = null;

// bersihkan cart dari id yang sudah tidak ada / qty tidak valid
if (!cart || typeof cart !== 'object' || Array.isArray(cart)) cart = {};
Object.keys(cart).forEach((id) => {
  const qty = Math.floor(Number(cart[id]));
  if (!getProduct(id) || !Number.isFinite(qty) || qty <= 0) delete cart[id];
  else cart[id] = Math.min(qty, 99);
});
discountPct = Math.min(100, Math.max(0, Math.round(discountPct)));
history = history.filter((t) => t && t.invoice && Array.isArray(t.items)).slice(0, 80);

/* ---------------- Elements ---------------- */
const els = {
  productGrid: $('#productGrid'),
  categoryChips: $('#categoryChips'),
  searchInput: $('#searchInput'),
  resultCount: $('#resultCount'),
  cartPanel: $('#cartPanel'),
  cartItems: $('#cartItems'),
  cartCount: $('#cartCount'),
  cartMeta: $('#cartMeta'),
  clearCartBtn: $('#clearCartBtn'),
  cartCloseBtn: $('#cartCloseBtn'),
  discountChips: $('#discountChips'),
  tSubtotal: $('#tSubtotal'),
  tDiscount: $('#tDiscount'),
  tDiscountLabel: $('#tDiscountLabel'),
  tTax: $('#tTax'),
  tTotal: $('#tTotal'),
  payBtn: $('#payBtn'),
  payMeta: $('#payMeta'),
  payAmount: $('#payAmount'),
  mobileCartBtn: $('#mobileCartBtn'),
  mBadge: $('#mBadge'),
  mTotal: $('#mTotal'),
  backdrop: $('#backdrop'),
  payModal: $('#payModal'),
  payModalMeta: $('#payModalMeta'),
  payModalTotal: $('#payModalTotal'),
  cashInput: $('#cashInput'),
  quickCash: $('#quickCash'),
  changeBox: $('#changeBox'),
  changeLabel: $('#changeLabel'),
  changeValue: $('#changeValue'),
  confirmPayBtn: $('#confirmPayBtn'),
  receiptModal: $('#receiptModal'),
  receiptBody: $('#receiptBody'),
  printBtn: $('#printBtn'),
  newTrxBtn: $('#newTrxBtn'),
  historyBtn: $('#historyBtn'),
  historyModal: $('#historyModal'),
  historyList: $('#historyList'),
  historyMeta: $('#historyMeta'),
  printArea: $('#printArea'),
  toasts: $('#toasts'),
  statTrx: $('#statTrx'),
  statItems: $('#statItems'),
  statRevenue: $('#statRevenue'),
  clockTime: $('#clockTime'),
  clockDate: $('#clockDate'),
};

/* ---------------- Cart math ---------------- */
function cartEntries() {
  return Object.keys(cart)
    .map((id) => ({ product: getProduct(id), qty: cart[id] }))
    .filter((e) => e.product && e.qty > 0);
}

function computeTotals() {
  const entries = cartEntries();
  const count = entries.reduce((sum, e) => sum + e.qty, 0);
  const subtotal = entries.reduce((sum, e) => sum + e.product.price * e.qty, 0);
  const discountAmount = Math.round((subtotal * discountPct) / 100);
  const taxable = subtotal - discountAmount;
  const tax = Math.round(taxable * TAX_RATE);
  const total = taxable + tax;
  return { entries, count, subtotal, discountAmount, tax, total };
}

/* ---------------- Render: categories ---------------- */
function renderChips() {
  els.categoryChips.innerHTML = CATEGORIES.map((cat) => {
    const count = cat === 'Semua' ? PRODUCTS.length : PRODUCTS.filter((p) => p.cat === cat).length;
    return `<button class="chip${cat === activeCategory ? ' active' : ''}" type="button" role="tab"
      aria-selected="${cat === activeCategory}" data-cat="${cat}">${cat} <b>${count}</b></button>`;
  }).join('');
}

/* ---------------- Render: products ---------------- */
function visibleProducts() {
  const q = query.trim().toLowerCase();
  return PRODUCTS.filter((p) => {
    const inCat = activeCategory === 'Semua' || p.cat === activeCategory;
    const inQuery = !q || p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q);
    return inCat && inQuery;
  });
}

function renderProducts() {
  const list = visibleProducts();
  els.resultCount.textContent = list.length;

  if (!list.length) {
    els.productGrid.innerHTML = `
      <div class="empty-results">
        <div class="big">🔍</div>
        <strong>Menu tidak ditemukan</strong>
        <p>Coba kata kunci lain atau lihat semua menu.</p>
        <button type="button" data-reset>Reset pencarian</button>
      </div>`;
    return;
  }

  els.productGrid.innerHTML = list
    .map((p) => {
      const qty = cart[p.id] || 0;
      return `
        <button class="product${qty ? ' in-cart' : ''}" type="button" data-id="${p.id}"
          aria-label="Tambah ${esc(p.name)} ke pesanan">
          <span class="p-thumb" style="--tint:${p.tint}"><span>${p.emoji}</span></span>
          <span class="p-body">
            <span class="p-name">${esc(p.name)}</span>
            <span class="p-cat">${esc(p.cat)}</span>
          </span>
          <span class="p-foot">
            <span class="p-price">${fmt(p.price)}</span>
            <span class="p-add" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            </span>
          </span>
          <span class="p-qty" aria-hidden="true">${qty}</span>
        </button>`;
    })
    .join('');
}

function syncProductBadges() {
  $$('.product', els.productGrid).forEach((card) => {
    const qty = cart[card.dataset.id] || 0;
    card.classList.toggle('in-cart', qty > 0);
    const badge = $('.p-qty', card);
    if (badge) badge.textContent = qty;
  });
}

/* ---------------- Render: cart ---------------- */
function renderCart() {
  const { entries, count } = computeTotals();

  els.cartCount.textContent = count;
  els.mBadge.textContent = count;
  els.cartMeta.textContent = count
    ? `${count} item · ${entries.length} menu`
    : 'Belum ada item';
  els.clearCartBtn.disabled = count === 0;

  if (!entries.length) {
    els.cartItems.innerHTML = `
      <div class="cart-empty">
        <div class="art">🧾</div>
        <strong>Keranjang masih kosong</strong>
        <p>Pilih menu di sebelah kiri untuk mulai membuat pesanan.</p>
        <span class="hint">Tips: tekan <kbd>/</kbd> untuk mencari</span>
      </div>`;
    return;
  }

  els.cartItems.innerHTML = entries
    .map(({ product, qty }) => `
      <div class="cart-item${justAdded === product.id ? ' just-in' : ''}" data-id="${product.id}">
        <span class="ci-thumb" style="--tint:${product.tint}" aria-hidden="true">${product.emoji}</span>
        <div class="ci-main">
          <div class="ci-name-row">
            <span class="ci-name">${esc(product.name)}</span>
            <button class="ci-remove" type="button" data-act="remove" aria-label="Hapus ${esc(product.name)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="ci-unit">${fmt(product.price)} / item</div>
        </div>
        <div class="ci-right">
          <div class="ci-line">${fmt(product.price * qty)}</div>
          <div class="stepper">
            <button type="button" data-act="dec" aria-label="Kurangi ${esc(product.name)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 12h14"/></svg>
            </button>
            <span class="qty">${qty}</span>
            <button type="button" data-act="inc" aria-label="Tambah ${esc(product.name)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>
        </div>
      </div>`)
    .join('');

  justAdded = null;
}

/* ---------------- Render: totals ---------------- */
function updateTotalsUI() {
  const { count, subtotal, discountAmount, tax, total } = computeTotals();

  els.tSubtotal.textContent = fmt(subtotal);
  els.tDiscount.textContent = '−' + fmt(discountAmount);
  els.tDiscountLabel.textContent = discountPct + '%';
  els.tTax.textContent = fmt(tax);
  els.tTotal.textContent = fmt(total);

  els.payBtn.disabled = count === 0;
  els.payMeta.textContent = count ? `${count} item · tunai` : 'Keranjang kosong';
  els.payAmount.textContent = fmt(total);
  els.mTotal.textContent = fmt(total);

  $$('.d-chip', els.discountChips).forEach((chip) => {
    chip.classList.toggle('active', Number(chip.dataset.discount) === discountPct);
  });
}

function refreshCartUI() {
  renderCart();
  updateTotalsUI();
  syncProductBadges();
}

/* ---------------- Persist ---------------- */
function persistCart() {
  save(LS.cart, cart);
  save(LS.discount, discountPct);
}

/* ---------------- Actions ---------------- */
function addToCart(id) {
  const product = getProduct(id);
  if (!product) return;
  cart[id] = Math.min(99, (cart[id] || 0) + 1);
  justAdded = id;
  persistCart();
  refreshCartUI();
}

function changeQty(id, delta) {
  if (!cart[id]) return;
  cart[id] += delta;
  if (cart[id] <= 0) delete cart[id];
  persistCart();
  refreshCartUI();
}

function removeItem(id) {
  delete cart[id];
  persistCart();
  refreshCartUI();
}

function clearCart() {
  if (!cartEntries().length) return;
  cart = {};
  persistCart();
  refreshCartUI();
  toast('Pesanan dikosongkan', 'info');
}

function setDiscount(pct) {
  discountPct = Math.min(100, Math.max(0, Number(pct) || 0));
  save(LS.discount, discountPct);
  updateTotalsUI();
}

/* ---------------- Toast ---------------- */
function toast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'error' ? ' error' : type === 'info' ? ' info' : '');
  el.innerHTML = `<span class="dot"></span><span>${esc(message)}</span>`;
  els.toasts.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 240);
  }, 2400);
}

/* ---------------- Clock & stats ---------------- */
function updateClock() {
  const now = new Date();
  els.clockTime.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  els.clockDate.textContent = now.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function updateStats() {
  const today = new Date().toDateString();
  const todays = history.filter((t) => new Date(t.at).toDateString() === today);
  const items = todays.reduce((sum, t) => sum + t.items.reduce((s, it) => s + it.qty, 0), 0);
  const revenue = todays.reduce((sum, t) => sum + t.total, 0);

  els.statTrx.textContent = todays.length;
  els.statItems.textContent = items;
  els.statRevenue.textContent = fmt(revenue);
}

/* ---------------- Invoice ---------------- */
function nextInvoice() {
  const now = new Date();
  const y = String(now.getFullYear()).slice(2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const stamp = `${y}${m}${d}`;

  const counter = load(LS.counter, { date: '', n: 0 });
  const next = counter && counter.date === stamp ? Number(counter.n) + 1 : 1;
  save(LS.counter, { date: stamp, n: next });

  return `INV-${stamp}-${String(next).padStart(3, '0')}`;
}

/* ---------------- Receipt ---------------- */
function barcodeHTML(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let out = '';
  for (let i = 0; i < 54; i++) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    const mod = h % 5;
    const cls = mod === 0 ? 'thick' : mod === 1 || mod === 2 ? 'thin' : '';
    out += `<i class="${cls}"></i>`;
  }
  return out;
}

function receiptHTML(trx) {
  const d = new Date(trx.at);
  const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');

  const items = trx.items
    .map(
      (it) => `
      <div class="r-item">
        <div class="nm">${esc(it.name)}</div>
        <div class="ln"><span>${it.qty} × ${fmtNum(it.price)}</span><span>${fmtNum(it.qty * it.price)}</span></div>
      </div>`
    )
    .join('');

  const discountRow =
    trx.discountAmount > 0
      ? `<div class="row"><span>Diskon ${trx.discountPct}%</span><span>−${fmtNum(trx.discountAmount)}</span></div>`
      : '';

  return `
    <div class="r-head">
      <div class="r-logo" aria-hidden="true">☕</div>
      <h3>${STORE.name}</h3>
      <div class="tag">${STORE.tagline}</div>
      <p>${STORE.address}<br>${STORE.phone} · ${STORE.instagram}</p>
    </div>

    <div class="r-sep"></div>

    <div class="r-meta">
      <div class="row"><span>No. ${esc(trx.invoice)}</span><span>${dateStr}</span></div>
      <div class="row"><span>Kasir: ${esc(trx.cashier)}</span><span>${timeStr}</span></div>
    </div>

    <div class="r-sep"></div>

    <div class="r-items">${items}</div>

    <div class="r-sep"></div>

    <div class="r-totals">
      <div class="row"><span>Subtotal</span><span>${fmtNum(trx.subtotal)}</span></div>
      ${discountRow}
      <div class="row"><span>PPN 11%</span><span>${fmtNum(trx.tax)}</span></div>
      <div class="row grand"><span>TOTAL</span><span>${fmtNum(trx.total)}</span></div>
      <div class="row" style="margin-top:5px"><span>Tunai</span><span>${fmtNum(trx.cash)}</span></div>
      <div class="row"><span>Kembali</span><span>${fmtNum(trx.change)}</span></div>
    </div>

    <div class="r-sep"></div>

    <div class="r-thanks">
      <strong>Terima kasih sudah mampir!</strong>
      Semoga harimu semanis kopi kami ☕
    </div>

    <div class="r-barcode" aria-hidden="true">${barcodeHTML(trx.invoice)}</div>
    <div class="r-code">${esc(trx.invoice)}</div>
    <div class="r-note">Struk ini adalah bukti pembayaran yang sah.<br>Simpan struk untuk keperluan retur.</div>`;
}

function showReceipt(trx) {
  lastReceipt = trx;
  const html = receiptHTML(trx);
  els.receiptBody.innerHTML = html;
  els.printArea.innerHTML = html;
  openModal('receiptModal');
}

/* ---------------- Modals ---------------- */
function syncScrollLock() {
  const locked = $$('.modal.open').length > 0 || els.cartPanel.classList.contains('open');
  document.body.style.overflow = locked ? 'hidden' : '';
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  syncScrollLock();
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  syncScrollLock();
}

function closeAllModals() {
  $$('.modal.open').forEach((m) => {
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
  });
  syncScrollLock();
}

/* ---------------- Cart drawer (mobile) ---------------- */
function openCartDrawer() {
  els.cartPanel.classList.add('open');
  els.backdrop.classList.add('show');
  syncScrollLock();
}

function closeCartDrawer() {
  els.cartPanel.classList.remove('open');
  els.backdrop.classList.remove('show');
  syncScrollLock();
}

/* ---------------- Payment ---------------- */
function quickCashOptions(total) {
  const bills = [20000, 50000, 100000, 200000, 500000, 1000000];
  const options = [{ value: total, label: 'Uang pas', exact: true }];
  bills.filter((b) => b >= total).forEach((b) => options.push({ value: b, label: fmt(b), exact: false }));
  return options.slice(0, 6);
}

function openPayment() {
  const { count, entries, total } = computeTotals();
  if (!count) {
    toast('Keranjang masih kosong', 'info');
    return;
  }

  closeCartDrawer();
  els.payModalMeta.textContent = `${count} item · ${entries.length} menu · PPN 11%`;
  els.payModalTotal.textContent = fmt(total);

  cashRaw = 0;
  els.cashInput.value = '';

  els.quickCash.innerHTML = quickCashOptions(total)
    .map(
      (o) =>
        `<button class="q-cash${o.exact ? ' exact' : ''}" type="button" data-cash="${o.value}">${o.label}</button>`
    )
    .join('');

  updateChangeUI();
  openModal('payModal');
  setTimeout(() => els.cashInput.focus(), 260);
}

function updateChangeUI() {
  const { total, count } = computeTotals();
  const diff = cashRaw - total;

  els.changeBox.classList.remove('less', 'ok');

  if (cashRaw <= 0) {
    els.changeLabel.textContent = 'Kembalian';
    els.changeValue.textContent = fmt(0);
  } else if (diff < 0) {
    els.changeBox.classList.add('less');
    els.changeLabel.textContent = 'Uang kurang';
    els.changeValue.textContent = fmt(-diff);
  } else {
    els.changeBox.classList.add('ok');
    els.changeLabel.textContent = 'Kembalian';
    els.changeValue.textContent = fmt(diff);
  }

  els.confirmPayBtn.disabled = !(count > 0 && cashRaw >= total && total > 0);
}

function setCash(value, sourceBtn = null) {
  cashRaw = Math.max(0, Math.floor(Number(value) || 0));
  els.cashInput.value = cashRaw ? cashRaw.toLocaleString('id-ID') : '';
  $$('.q-cash', els.quickCash).forEach((btn) => btn.classList.toggle('selected', btn === sourceBtn));
  updateChangeUI();
}

function confirmPayment() {
  const { entries, count, subtotal, discountAmount, tax, total } = computeTotals();
  if (!count || cashRaw < total) return;

  const trx = {
    invoice: nextInvoice(),
    at: Date.now(),
    cashier: STORE.cashier,
    items: entries.map(({ product, qty }) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      qty,
    })),
    subtotal,
    discountPct,
    discountAmount,
    tax,
    total,
    cash: cashRaw,
    change: cashRaw - total,
  };

  history.unshift(trx);
  history = history.slice(0, 80);
  save(LS.history, history);

  cart = {};
  persistCart();

  closeModal('payModal');
  refreshCartUI();
  updateStats();
  showReceipt(trx);
  toast(`Pembayaran ${fmt(total)} berhasil`);

  els.searchInput.value = '';
  query = '';
  renderProducts();
}

/* ---------------- History ---------------- */
function renderHistory() {
  if (!history.length) {
    els.historyMeta.textContent = 'Belum ada transaksi';
    els.historyList.innerHTML = `
      <div class="history-empty">
        <div class="big">🗂️</div>
        <strong>Belum ada transaksi</strong>
        <p>Transaksi yang selesai akan muncul di sini.</p>
      </div>`;
    return;
  }

  const today = new Date().toDateString();
  els.historyMeta.textContent = `${history.length} transaksi tersimpan`;

  els.historyList.innerHTML = history
    .map((t) => {
      const d = new Date(t.at);
      const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
      const day = d.toDateString() === today
        ? 'Hari ini'
        : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const itemCount = t.items.reduce((s, it) => s + it.qty, 0);
      return `
        <button class="history-row" type="button" data-invoice="${esc(t.invoice)}">
          <span class="h-time">${time}<small>${day}</small></span>
          <span class="h-main">
            <strong>${esc(t.invoice)}</strong>
            <small>${itemCount} item · ${esc(t.cashier)}</small>
          </span>
          <span class="h-total">${fmt(t.total)}</span>
          <span class="h-chevron" aria-hidden="true">›</span>
        </button>`;
    })
    .join('');
}

function openHistory() {
  renderHistory();
  openModal('historyModal');
}

/* ---------------- Events ---------------- */
function bindEvents() {
  // products
  els.productGrid.addEventListener('click', (e) => {
    if (e.target.closest('[data-reset]')) {
      query = '';
      activeCategory = 'Semua';
      els.searchInput.value = '';
      renderChips();
      renderProducts();
      els.searchInput.focus();
      return;
    }
    const card = e.target.closest('.product');
    if (card) addToCart(card.dataset.id);
  });

  // category chips
  els.categoryChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    activeCategory = chip.dataset.cat;
    renderChips();
    renderProducts();
  });

  // search
  els.searchInput.addEventListener('input', (e) => {
    query = e.target.value;
    renderProducts();
  });

  // cart item actions
  els.cartItems.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('[data-act]');
    if (!actionBtn) return;
    const item = actionBtn.closest('.cart-item');
    if (!item) return;
    const id = item.dataset.id;
    const act = actionBtn.dataset.act;
    if (act === 'inc') changeQty(id, 1);
    else if (act === 'dec') changeQty(id, -1);
    else if (act === 'remove') removeItem(id);
  });

  els.clearCartBtn.addEventListener('click', clearCart);

  // discount
  els.discountChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.d-chip');
    if (chip) setDiscount(chip.dataset.discount);
  });

  // pay
  els.payBtn.addEventListener('click', openPayment);

  // mobile drawer
  els.mobileCartBtn.addEventListener('click', openCartDrawer);
  els.cartCloseBtn.addEventListener('click', closeCartDrawer);
  els.backdrop.addEventListener('click', closeCartDrawer);

  // modal close buttons + backdrop
  $$('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  // cash input
  els.cashInput.addEventListener('input', (e) => {
    const raw = digits(e.target.value);
    cashRaw = raw;
    e.target.value = raw ? raw.toLocaleString('id-ID') : '';
    $$('.q-cash', els.quickCash).forEach((btn) => btn.classList.remove('selected'));
    updateChangeUI();
  });

  els.cashInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !els.confirmPayBtn.disabled) {
      e.preventDefault();
      confirmPayment();
    }
  });

  // quick cash
  els.quickCash.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cash]');
    if (btn) setCash(Number(btn.dataset.cash), btn);
  });

  els.confirmPayBtn.addEventListener('click', confirmPayment);

  // receipt actions
  els.printBtn.addEventListener('click', () => window.print());
  els.newTrxBtn.addEventListener('click', () => {
    closeModal('receiptModal');
    els.searchInput.focus();
  });

  // history
  els.historyBtn.addEventListener('click', openHistory);
  els.historyList.addEventListener('click', (e) => {
    const row = e.target.closest('[data-invoice]');
    if (!row) return;
    const trx = history.find((t) => t.invoice === row.dataset.invoice);
    if (!trx) return;
    closeModal('historyModal');
    showReceipt(trx);
  });

  // keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');

    if (e.key === '/' && !typing) {
      e.preventDefault();
      els.searchInput.focus();
      return;
    }

    if (e.key === 'Escape') {
      const openModals = $$('.modal.open');
      if (openModals.length) {
        const top = openModals[openModals.length - 1];
        closeModal(top.id);
      } else if (els.cartPanel.classList.contains('open')) {
        closeCartDrawer();
      } else if (document.activeElement === els.searchInput && els.searchInput.value) {
        els.searchInput.value = '';
        query = '';
        renderProducts();
      }
    }
  });
}

/* ---------------- Init ---------------- */
function init() {
  renderChips();
  renderProducts();
  renderCart();
  updateTotalsUI();
  updateStats();
  updateClock();
  bindEvents();

  setInterval(updateClock, 15000);

  // permintaan fokus otomatis saat halaman siap
  if (window.innerWidth > 720) els.searchInput.focus({ preventScroll: true });
}

init();
