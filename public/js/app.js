let allProducts = [];
let currentFilter = 'all';

async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    allProducts = await res.json();
    renderProducts(allProducts);
    renderCategories();
  } catch (e) {
    console.error('فشل تحميل المنتجات', e);
  }
}

function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  if (!products.length) {
    grid.innerHTML = '<p style="text-align:center;color:var(--gray-light);grid-column:1/-1;">لا توجد منتجات</p>';
    return;
  }
  grid.innerHTML = products.map(p => `
    <div class="product-card">
      ${p.isNew ? '<span class="product-badge">جديد</span>' : ''}
      ${p.onOffer ? '<span class="product-badge offer">عرض خاص</span>' : ''}
      <button class="fav-btn ${favorites.has(p.id) ? 'active' : ''}" data-id="${p.id}" onclick="toggleFav(${p.id})">❤️</button>
      <img class="product-image" src="${p.image}" alt="${p.name}" loading="lazy">
      <div class="product-info">
        <div class="product-title">${p.name}</div>
        <div class="product-price">
          <span class="price-current">${p.price} ر.س</span>
          ${p.oldPrice ? `<span class="price-old">${p.oldPrice} ر.س</span>` : ''}
        </div>
        <div class="product-actions">
          <a href="/product.html?id=${p.id}" class="btn-details">عرض التفاصيل</a>
          <button class="btn-add-cart" onclick='addToCart(${p.id})'>أضف للسلة</button>
        </div>
      </div>
    </div>
  `).join('');
}

function addToCart(id) {
  const p = allProducts.find(x => x.id === id);
  if (p) cart.add(p);
}

function renderCategories() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;
  const cats = [
    { name: 'ألعاب', icon: '🎮' },
    { name: 'مستلزمات', icon: '💝' },
    { name: 'هدايا', icon: '🎁' },
    { name: 'عطور', icon: '🌸' }
  ];
  grid.innerHTML = cats.map(c => `
    <div class="category-card" onclick="filterByCategory('${c.name}')">
      <div class="cat-icon">${c.icon}</div>
      <h3>${c.name}</h3>
    </div>
  `).join('');
}

function filterProducts(type, btn) {
  currentFilter = type;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  let filtered = allProducts;
  if (type === 'new') filtered = allProducts.filter(p => p.isNew);
  if (type === 'offer') filtered = allProducts.filter(p => p.onOffer);
  renderProducts(filtered);
}

function filterByCategory(cat) {
  renderProducts(allProducts.filter(p => p.category === cat));
  document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

function openSearch() {
  document.getElementById('searchModal').classList.add('active');
  document.getElementById('searchInput').focus();
}

function closeSearch() {
  document.getElementById('searchModal').classList.remove('active');
}

function searchProducts() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const results = document.getElementById('searchResults');
  if (!q) { results.innerHTML = ''; return; }
  const found = allProducts.filter(p => p.name.toLowerCase().includes(q));
  results.innerHTML = found.length
    ? found.map(p => `
        <div class="search-result-item" onclick="location.href='/product.html?id=${p.id}'">
          <img src="${p.image}" alt="${p.name}">
          <div>
            <div style="color:var(--white);font-weight:700;">${p.name}</div>
            <div style="color:var(--gold);">${p.price} ر.س</div>
          </div>
        </div>
      `).join('')
    : '<p style="color:var(--gray-light);text-align:center;padding:20px;">لا توجد نتائج</p>';
}

async function loadProductDetail(id) {
  const res = await fetch('/api/products');
  const products = await res.json();
  const p = products.find(x => x.id === id);
  const detail = document.getElementById('productDetail');
  if (!p) { detail.innerHTML = '<p>المنتج غير موجود</p>'; return; }

  detail.innerHTML = `
    <div class="product-detail">
      <img class="product-detail-image" src="${p.image}" alt="${p.name}">
      <div class="product-detail-info">
        <h1>${p.name}</h1>
        <div class="detail-price">
          ${p.price} ر.س
          ${p.oldPrice ? `<span class="price-old" style="font-size:18px;">${p.oldPrice} ر.س</span>` : ''}
        </div>
        <p class="detail-desc">${p.description || 'منتج عالي الجودة من BRITON.'}</p>
        <div class="options-group">
          <label>الكمية:</label>
          <div class="qty-control" style="justify-content:flex-start;">
            <button onclick="document.getElementById('detailQty').value = Math.max(1, +document.getElementById('detailQty').value - 1)">−</button>
            <input type="number" id="detailQty" value="1" min="1">
            <button onclick="document.getElementById('detailQty').value = +document.getElementById('detailQty').value + 1">+</button>
          </div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px;">
          <button class="btn-gold" onclick="addToCartDetail()">🛒 أضف إلى السلة</button>
          <a href="https://wa.me/${localStorage.getItem('briton_whatsapp') || '966XXXXXXXXX'}?text=${encodeURIComponent('مرحبًا، أرغب بالاستفسار عن: ' + p.name)}" class="btn-whatsapp" style="width:auto;padding:15px 35px;" target="_blank">💬 اطلب عبر واتساب</a>
        </div>
      </div>
    </div>
  `;

  const related = products.filter(x => x.id !== id && x.category === p.category).slice(0, 4);
  document.getElementById('relatedProducts').innerHTML = related.map(r => `
    <div class="product-card">
      <img class="product-image" src="${r.image}" alt="${r.name}">
      <div class="product-info">
        <div class="product-title">${r.name}</div>
        <div class="product-price"><span class="price-current">${r.price} ر.س</span></div>
        <div class="product-actions">
          <a href="/product.html?id=${r.id}" class="btn-details">التفاصيل</a>
          <button class="btn-add-cart" onclick='addToCart(${r.id})'>أضف للسلة</button>
        </div>
      </div>
    </div>
  `).join('');

  window._detailProduct = p;
}

function addToCartDetail() {
  const qty = parseInt(document.getElementById('detailQty').value) || 1;
  cart.add(window._detailProduct, qty);
}

document.addEventListener('DOMContentLoaded', loadProducts);
