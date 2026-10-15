const ADMIN_API = '/api/admin';
let adminToken = localStorage.getItem('briton_admin_token') || '';

async function adminLogin(e) {
  e.preventDefault();
  const username = document.getElementById('adminUser').value;
  const password = document.getElementById('adminPass').value;
  try {
    const res = await fetch(`${ADMIN_API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error('بيانات غير صحيحة');
    const data = await res.json();
    adminToken = data.token;
    localStorage.setItem('briton_admin_token', adminToken);
    showAdminPanel();
  } catch (err) {
    showToast('❌ ' + err.message);
  }
}

function adminLogout() {
  adminToken = '';
  localStorage.removeItem('briton_admin_token');
  location.reload();
}

function showAdminPanel() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminPanel').classList.add('active');
  loadAdminData();
}

async function apiCall(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
      ...(options.headers || {})
    }
  });
  if (res.status === 401 || res.status === 403) {
    adminLogout();
    throw new Error('انتهت الجلسة');
  }
  return res.json();
}

async function loadAdminData() {
  const products = await apiCall('/api/products');
  document.getElementById('statProducts').textContent = products.length;

  document.getElementById('adminProductsTable').innerHTML = products.map(p => `
    <tr>
      <td><img src="${p.image}" alt="${p.name}"></td>
      <td>${p.name}</td>
      <td>${p.price} ر.س</td>
      <td>${p.category || '-'}</td>
      <td>${p.isNew ? '🆕 جديد' : ''} ${p.onOffer ? '🔥 عرض' : ''}</td>
      <td>
        <button class="btn-sm btn-edit" onclick='editProduct(${p.id})'>تعديل</button>
        <button class="btn-sm btn-del" onclick='deleteProduct(${p.id})'>حذف</button>
      </td>
    </tr>
  `).join('');

  try {
    const orders = await apiCall(`${ADMIN_API}/orders`);
    document.getElementById('statOrders').textContent = orders.length;
    document.getElementById('adminOrdersTable').innerHTML = orders.map(o => `
      <tr>
        <td>#${o.id}</td>
        <td>${o.name}</td>
        <td>${o.phone}</td>
        <td>${o.total} ر.س</td>
        <td>${o.status || 'جديد'}</td>
      </tr>
    `).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--gray-light);">لا توجد طلبات</td></tr>';
  } catch {}

  document.getElementById('settingWhatsapp').value = localStorage.getItem('briton_whatsapp') || '';
  document.getElementById('settingEmail').value = localStorage.getItem('briton_email') || '';
}

function openProductForm() {
  document.getElementById('productId').value = '';
  document.getElementById('productName').value = '';
  document.getElementById('productPrice').value = '';
  document.getElementById('productOldPrice').value = '';
  document.getElementById('productImage').value = '';
  document.getElementById('productDesc').value = '';
  document.getElementById('productIsNew').checked = false;
  document.getElementById('productOnOffer').checked = false;
  document.getElementById('productModal').classList.add('active');
}

function closeProductForm() {
  document.getElementById('productModal').classList.remove('active');
}

async function editProduct(id) {
  const products = await apiCall('/api/products');
  const p = products.find(x => x.id === id);
  if (!p) return;
  document.getElementById('productId').value = p.id;
  document.getElementById('productName').value = p.name;
  document.getElementById('productPrice').value = p.price;
  document.getElementById('productOldPrice').value = p.oldPrice || '';
  document.getElementById('productImage').value = p.image;
  document.getElementById('productDesc').value = p.description || '';
  document.getElementById('productCategory').value = p.category || 'ألعاب';
  document.getElementById('productIsNew').checked = !!p.isNew;
  document.getElementById('productOnOffer').checked = !!p.onOffer;
  document.getElementById('productModal').classList.add('active');
}

async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  const data = {
    name: document.getElementById('productName').value,
    price: parseFloat(document.getElementById('productPrice').value),
    oldPrice: parseFloat(document.getElementById('productOldPrice').value) || null,
    image: document.getElementById('productImage').value,
    category: document.getElementById('productCategory').value,
    description: document.getElementById('productDesc').value,
    isNew: document.getElementById('productIsNew').checked,
    onOffer: document.getElementById('productOnOffer').checked
  };
  try {
    if (id) {
      await apiCall(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      showToast('✅ تم التعديل');
    } else {
      await apiCall('/api/products', { method: 'POST', body: JSON.stringify(data) });
      showToast('✅ تمت الإضافة');
    }
    closeProductForm();
    loadAdminData();
  } catch (err) {
    showToast('❌ خطأ: ' + err.message);
  }
}

async function deleteProduct(id) {
  if (!confirm('هل تريد حذف هذا المنتج؟')) return;
  try {
    await apiCall(`/api/products/${id}`, { method: 'DELETE' });
    showToast('🗑️ تم الحذف');
    loadAdminData();
  } catch (err) {
    showToast('❌ خطأ: ' + err.message);
  }
}

function saveSettings() {
  localStorage.setItem('briton_whatsapp', document.getElementById('settingWhatsapp').value);
  localStorage.setItem('briton_email', document.getElementById('settingEmail').value);
  showToast('💾 تم حفظ الإعدادات');
}

if (adminToken) showAdminPanel();
