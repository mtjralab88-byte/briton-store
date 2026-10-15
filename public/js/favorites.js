class Favorites {
  constructor() {
    this.items = JSON.parse(localStorage.getItem('briton_favs') || '[]');
    this.updateUI();
  }
  toggle(product) {
    const idx = this.items.findIndex(i => i.id === product.id);
    if (idx > -1) { this.items.splice(idx, 1); showToast('💔 تم الحذف من المفضلة'); }
    else { this.items.push(product); showToast('❤️ تمت الإضافة للمفضلة'); }
    this.save();
    this.updateUI();
  }
  has(id) { return this.items.some(i => i.id === id); }
  remove(id) { this.items = this.items.filter(i => i.id !== id); this.save(); this.updateUI(); }
  save() { localStorage.setItem('briton_favs', JSON.stringify(this.items)); }
  updateUI() {
    const el = document.getElementById('favCount');
    if (el) el.textContent = this.items.length;
  }
}

const favorites = new Favorites();

function toggleFav(id) {
  fetch('/api/products').then(r => r.json()).then(products => {
    const product = products.find(p => p.id === id);
    if (product) {
      favorites.toggle(product);
      document.querySelectorAll(`.fav-btn[data-id="${id}"]`).forEach(btn => {
        btn.classList.toggle('active', favorites.has(id));
      });
    }
  });
}

function renderFavorites() {
  const container = document.getElementById('favContent');
  if (!container) return;
  if (favorites.items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span>❤️</span>
        <h2>لا توجد منتجات في المفضلة</h2>
        <a href="/" class="btn-gold">تصفح المنتجات</a>
      </div>`;
    return;
  }
  container.innerHTML = `<div class="products-grid">${
    favorites.items.map(p => `
      <div class="product-card">
        <img class="product-image" src="${p.image}" alt="${p.name}">
        <div class="product-info">
          <div class="product-title">${p.name}</div>
          <div class="product-price"><span class="price-current">${p.price} ر.س</span></div>
          <div class="product-actions">
            <a href="/product.html?id=${p.id}" class="btn-details">عرض التفاصيل</a>
            <button class="btn-add-cart" onclick='cart.add(${JSON.stringify(p).replace(/'/g, "&#39;")})'>أضف للسلة</button>
          </div>
        </div>
      </div>
    `).join('')
  }</div>`;
}
