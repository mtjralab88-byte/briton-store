class Cart {
  constructor() {
    this.items = JSON.parse(localStorage.getItem('briton_cart') || '[]');
    this.updateUI();
  }
  add(product, qty = 1) {
    const existing = this.items.find(i => i.id === product.id);
    if (existing) existing.qty += qty;
    else this.items.push({ id: product.id, name: product.name, price: product.price, image: product.image, qty });
    this.save();
    this.updateUI();
    showToast('✅ تمت الإضافة إلى السلة');
  }
  remove(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.save();
    this.updateUI();
    if (typeof renderCart === 'function') renderCart();
  }
  updateQty(id, qty) {
    const item = this.items.find(i => i.id === id);
    if (item) { item.qty = Math.max(1, qty); this.save(); this.updateUI(); }
  }
  clear() { this.items = []; this.save(); this.updateUI(); }
  getTotal() { return this.items.reduce((s, i) => s + (i.price * i.qty), 0); }
  getCount() { return this.items.reduce((s, i) => s + i.qty, 0); }
  save() { localStorage.setItem('briton_cart', JSON.stringify(this.items)); }
  updateUI() {
    const el = document.getElementById('cartCount');
    if (el) el.textContent = this.getCount();
  }
}

const cart = new Cart();

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function checkoutWhatsApp(customerData) {
  const phone = localStorage.getItem('briton_whatsapp') || '966XXXXXXXXX';
  let message = `🛍️ *طلب جديد من BRITON*\n\n`;
  message += `👤 الاسم: ${customerData.name}\n`;
  message += `📱 الجوال: ${customerData.phone}\n`;
  message += `🏙️ المدينة: ${customerData.city}\n`;
  message += `📍 العنوان: ${customerData.address}\n\n`;
  message += `📦 *المنتجات:*\n`;
  cart.items.forEach((item, i) => {
    message += `${i + 1}. ${item.name} × ${item.qty} = ${item.price * item.qty} ر.س\n`;
  });
  message += `\n💰 *الإجمالي: ${cart.getTotal()} ر.س*`;
  if (customerData.notes) message += `\n\n📝 ملاحظات: ${customerData.notes}`;
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

function renderCart() {
  const container = document.getElementById('cartContent');
  if (!container) return;
  if (cart.items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span>🛒</span>
        <h2>السلة فارغة</h2>
        <p>ابدأ التسوق الآن</p>
        <br>
        <a href="/" class="btn-gold">تسوق الآن</a>
      </div>`;
    return;
  }
  let html = '';
  cart.items.forEach(item => {
    html += `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-info">
          <h3>${item.name}</h3>
          <div class="item-price">${item.price} ر.س</div>
        </div>
        <div class="qty-control">
          <button onclick="changeQty(${item.id}, ${item.qty - 1})">−</button>
          <input type="number" value="${item.qty}" onchange="changeQty(${item.id}, this.value)" min="1">
          <button onclick="changeQty(${item.id}, ${item.qty + 1})">+</button>
        </div>
        <button class="btn-remove" onclick="removeItem(${item.id})">🗑️</button>
      </div>`;
  });
  html += `
    <div class="cart-summary">
      <div class="summary-row"><span>عدد المنتجات:</span><span>${cart.getCount()}</span></div>
      <div class="summary-total"><span>الإجمالي:</span><span>${cart.getTotal()} ر.س</span></div>
      <div class="cart-actions">
        <a href="/" class="btn-secondary">← متابعة التسوق</a>
        <a href="/checkout.html" class="btn-gold">إتمام الطلب →</a>
      </div>
    </div>`;
  container.innerHTML = html;
}

function changeQty(id, qty) { cart.updateQty(id, parseInt(qty)); renderCart(); }
function removeItem(id) { cart.remove(id); showToast('🗑️ تم الحذف من السلة'); }
