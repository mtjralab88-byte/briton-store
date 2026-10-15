require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-key';

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

const DATA_FILE = path.join(__dirname, 'data', 'db.json');
if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync(path.join(__dirname, 'data'));
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({
    products: [
      { id: 1, name: 'لعبة رومانسية للأزواج', price: 149, oldPrice: 199, image: 'https://images.unsplash.com/photo-1608889335941-32ac5f1e5dfe?w=600', category: 'ألعاب', description: 'لعبة تفاعلية ممتعة للأزواج.', isNew: true, onOffer: true },
      { id: 2, name: 'طقم شموع معطرة', price: 89, oldPrice: null, image: 'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?w=600', category: 'مستلزمات', description: 'شموع فاخرة بروائح مميزة.', isNew: true, onOffer: false },
      { id: 3, name: 'بوكس هدايا فاخر', price: 249, oldPrice: 349, image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600', category: 'هدايا', description: 'بوكس هدايا أنيق ومناسب للمناسبات.', isNew: false, onOffer: true },
      { id: 4, name: 'عطر شرقي فاخر', price: 199, oldPrice: null, image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600', category: 'عطور', description: 'عطر شرقي بثبات طويل.', isNew: false, onOffer: false }
    ],
    orders: [],
    admin: {
      username: process.env.ADMIN_USER || 'admin',
      passwordHash: bcrypt.hashSync(process.env.ADMIN_PASS || 'briton2026', 10)
    }
  }, null, 2));
}

function readDB() { return JSON.parse(fs.readFileSync(DATA_FILE)); }
function writeDB(db) { fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); }

app.get('/api/products', (req, res) => {
  const db = readDB();
  res.json(db.products);
});

app.get('/api/products/:id', (req, res) => {
  const db = readDB();
  const p = db.products.find(x => x.id === parseInt(req.params.id));
  if (!p) return res.status(404).json({ error: 'غير موجود' });
  res.json(p);
});

function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || '').split(' ')[1];
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'غير مصرح' });
  }
}

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  if (username !== db.admin.username) return res.status(401).json({ error: 'بيانات غير صحيحة' });
  const ok = await bcrypt.compare(password, db.admin.passwordHash);
  if (!ok) return res.status(401).json({ error: 'بيانات غير صحيحة' });
  const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

app.post('/api/products', requireAdmin, (req, res) => {
  const db = readDB();
  const newProduct = { id: Date.now(), ...req.body };
  db.products.push(newProduct);
  writeDB(db);
  res.json(newProduct);
});

app.put('/api/products/:id', requireAdmin, (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  const idx = db.products.findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'غير موجود' });
  db.products[idx] = { ...db.products[idx], ...req.body, id };
  writeDB(db);
  res.json(db.products[idx]);
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
  const db = readDB();
  db.products = db.products.filter(p => p.id !== parseInt(req.params.id));
  writeDB(db);
  res.json({ success: true });
});

app.post('/api/orders', (req, res) => {
  const db = readDB();
  const order = { id: Date.now(), ...req.body, status: 'جديد', createdAt: new Date().toISOString() };
  db.orders.push(order);
  writeDB(db);
  res.json(order);
});

app.get('/api/admin/orders', requireAdmin, (req, res) => {
  const db = readDB();
  res.json(db.orders);
});

app.put('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const db = readDB();
  const order = db.orders.find(o => o.id === parseInt(req.params.id));
  if (order) order.status = req.body.status;
  writeDB(db);
  res.json(order);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ BRITON يعمل على http://localhost:${PORT}`);
});
