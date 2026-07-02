const jsonServer = require('json-server')
const path = require('path')
const fs = require('fs')
const express = require('express')
const crypto = require('crypto')
const rateLimit = require('express-rate-limit')
const morgan = require('morgan')
const multer = require('multer')

const isProduction = process.env.NODE_ENV === 'production'

const server = jsonServer.create()
const router = jsonServer.router(path.join(__dirname, 'db.json'))
const middlewares = jsonServer.defaults()

// ── 上传目录配置 ──
const UPLOADS_DIR = isProduction
  ? path.join(__dirname, 'dist', 'uploads')
  : path.join(__dirname, 'public', 'uploads')
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

// ── Multer 配置 ──
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webp'
    const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext
    cb(null, name)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/bmp']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('仅支持 JPG/PNG/WebP/GIF/SVG/BMP 格式'))
    }
  },
})

// ── 访问日志 ──
server.use(morgan(isProduction ? 'combined' : 'dev'))

// ── 全局速率限制（防止 DoS） ──
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 1000,                // 最多 1000 次请求
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'RATE_LIMITED', message: '请求过于频繁，请稍后重试' },
})
server.use(globalLimiter)

// ── 登录接口严格限速（防暴力破解） ──
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: '登录尝试过于频繁，请 15 分钟后再试' },
})
server.use('/api/auth/login', authLimiter)
server.use('/api/auth/admin-login', authLimiter)

// ── 密码哈希工具（Mock 专用，生产环境应用 bcrypt） ──
function hashPassword(password) {
  return crypto.createHash('md5').update(password).digest('hex')
}

function verifyPassword(password, storedHash) {
  // 向后兼容：如果存储的是明文（如旧数据），直接比较
  // 如果存储的是哈希值，则哈希后比较
  if (storedHash && storedHash.length === 32 && /^[a-f0-9]+$/.test(storedHash)) {
    return hashPassword(password) === storedHash
  }
  return password === storedHash
}

server.use(middlewares)
server.use(jsonServer.bodyParser)

if (isProduction) {
  server.use(express.static(path.join(__dirname, 'dist')))
}
// ── CORS + 安全响应头（企业级） ──
server.use((req, res, next) => {
  // CORS — 仅允许明确配置的 origin，不再回退到 *
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3001',
    'https://ve-admin-jade.vercel.app',
  ]
  const origin = req.headers.origin
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin)
  }
  // 生产环境：同源请求不需要 CORS，但如果是通过反向代理访问则允许
  if (!origin && isProduction) {
    // 同源请求，跳过 CORS
  }
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
  res.header('Access-Control-Max-Age', '86400')

  // 安全响应头
  res.header('X-Content-Type-Options', 'nosniff')
  res.header('X-Frame-Options', 'DENY')
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // 移除过时的 X-XSS-Protection（现代浏览器不再支持，改用 CSP）
  // 生产环境应通过反向代理（Nginx/Vercel）设置 HSTS

  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

// ── 静态文件服务（上传的图片） ──
server.use('/uploads', express.static(UPLOADS_DIR))

// ── 图片上传 API ──
server.post('/api/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: '文件大小不能超过 10MB' })
        }
        return res.status(400).json({ message: '上传失败: ' + err.message })
      }
      return res.status(400).json({ message: err.message })
    }
    if (!req.file) {
      return res.status(400).json({ message: '请选择文件' })
    }
    const url = '/uploads/' + req.file.filename
    res.json({ url, filename: req.file.filename, size: req.file.size })
  })
})

server.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// ── Token 刷新端点 ──
server.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body || {}
  if (!refreshToken) return res.status(401).json({ message: '刷新令牌无效' })
  const id = refreshToken.replace('mock-refresh-', '')
  const db = router.db.getState()
  const user = db.users.find((u) => u.id === Number(id))
  if (!user || user.status !== 'active') return res.status(401).json({ message: '刷新令牌无效' })
  res.json({
    accessToken: 'mock-jwt-token-' + user.id,
    refreshToken: 'mock-refresh-' + user.id,
    expiresIn: 7200,
  })
})

server.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  const db = router.db.getState()
  const user = db.users.find(
    (u) => u.username === username && verifyPassword(password, u.password)
  )
  if (!user) return res.status(401).json({ message: '用户名或密码错误' })
  if (user.status !== 'active') return res.status(403).json({ message: '该账号已被禁用' })

  const { password: _, ...safeUser } = user
  res.json({
    token: 'mock-jwt-token-' + user.id,
    refreshToken: 'mock-refresh-' + user.id,
    expiresIn: 7200,
    user: safeUser,
  })
})

server.post('/api/auth/admin-login', (req, res) => {
  const { username, password } = req.body
  const db = router.db.getState()
  const user = db.users.find(
    (u) => u.username === username && verifyPassword(password, u.password)
  )
  if (!user) return res.status(401).json({ message: '用户名或密码错误' })
  if (user.role !== 'admin') return res.status(403).json({ message: '仅允许管理员登录后台' })
  if (user.status !== 'active') return res.status(403).json({ message: '该账号已被禁用' })

  const { password: _, ...safeUser } = user
  res.json({
    token: 'mock-jwt-token-' + user.id,
    refreshToken: 'mock-refresh-' + user.id,
    expiresIn: 7200,
    user: safeUser,
  })
})

server.post('/api/auth/register', (req, res) => {
  const { username, password, email } = req.body
  if (!username || !password) return res.status(400).json({ message: '用户名和密码不能为空' })
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return res.status(400).json({ message: '密码必须包含大小写字母和数字' })
  }
  const db = router.db.getState()
  if (db.users.find((u) => u.username === username)) {
    return res.status(409).json({ message: '用户名已存在' })
  }
  if (email && db.users.find((u) => u.email === email)) {
    return res.status(409).json({ message: '邮箱已被注册' })
  }
  const maxId = db.users.reduce((max, u) => Math.max(max, u.id), 0)
  const newUser = {
    id: maxId + 1,
    username,
    email: email || '',
    password: hashPassword(password),
    role: 'user',
    status: 'active',
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
  }
  db.users.push(newUser)
  router.db.write()
  const { password: _, ...safeUser } = newUser
  res.json({
    token: 'mock-jwt-token-' + newUser.id,
    refreshToken: 'mock-refresh-' + newUser.id,
    expiresIn: 7200,
    user: safeUser,
  })
})

server.get('/api/auth/userinfo', (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ message: '未登录' })
  const id = auth.replace('Bearer mock-jwt-token-', '')
  const db = router.db.getState()
  const user = db.users.find((u) => u.id === Number(id))
  if (!user) return res.status(401).json({ message: '用户不存在' })
  const { password: _, ...safeUser } = user
  res.json({ user: safeUser })
})

server.put('/api/auth/profile', (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ message: '未登录' })
  const id = auth.replace('Bearer mock-jwt-token-', '')
  const db = router.db.getState()
  const idx = db.users.findIndex((u) => u.id === Number(id))
  if (idx === -1) return res.status(401).json({ message: '用户不存在' })
  const { password, ...rest } = req.body
  Object.assign(db.users[idx], rest)
  if (password) db.users[idx].password = hashPassword(password)
  router.db.write()
  const { password: _, ...safeUser } = db.users[idx]
  res.json({ user: safeUser })
})

server.get('/api/dashboard/stats', (req, res) => {
  const db = router.db.getState()
  const userCount = db.users.length
  const productCount = db.products.length
  const orderCount = db.orders.length
  const activeUsers = db.users.filter((u) => u.status === 'active').length
  const totalRevenue = db.orders
    .filter((o) => o.status === 'completed')
    .reduce((s, o) => s + o.total, 0)
  const pendingOrders = db.orders.filter((o) => o.status === 'pending').length
  const lowStock = db.products.filter((p) => p.stock > 0 && p.stock < 20).length
  res.json({ userCount, productCount, orderCount, activeUsers, totalRevenue, pendingOrders, lowStock })
})

server.get('/api/dashboard/activities', (req, res) => {
  const db = router.db.getState()
  const activities = []
  db.users.slice(-5).reverse().forEach((u) => {
    activities.push({ type: '新增用户', content: `用户「${u.username}」已注册`, time: u.createdAt })
  })
  db.orders.slice(-5).reverse().forEach((o) => {
    const statusMap = { pending: '待处理', shipped: '已发货', completed: '已完成', cancelled: '已取消' }
    activities.push({ type: '新订单', content: `订单 #${o.id} - ${o.userName} (${statusMap[o.status] || o.status})`, time: o.createdAt })
  })
  db.products.slice(-3).reverse().forEach((p) => {
    activities.push({ type: '产品更新', content: `产品「${p.name}」信息已更新`, time: p.createdAt || p.updatedAt })
  })
  activities.sort((a, b) => (b.time || '').localeCompare(a.time || ''))
  res.json(activities.slice(0, 10))
})

server.get('/api/dashboard/revenue', (req, res) => {
  const db = router.db.getState()
  const monthMap = {}
  db.orders.filter((o) => o.status === 'completed').forEach((o) => {
    const m = (o.createdAt || '').slice(0, 7)
    if (m) monthMap[m] = (monthMap[m] || 0) + o.total
  })
  const months = Object.keys(monthMap).sort()
  res.json({ months, values: months.map((m) => monthMap[m]) })
})

server.post('/api/orders', (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ message: '请先登录' })
  const id = auth.replace('Bearer mock-jwt-token-', '')
  const db = router.db.getState()
  const user = db.users.find((u) => u.id === Number(id))
  if (!user) return res.status(401).json({ message: '用户不存在' })
  const { items, total, name, address, phone } = req.body
  if (!items || !items.length) return res.status(400).json({ message: '订单不能为空' })
  for (const item of items) {
    const product = db.products.find((p) => p.id === item.productId)
    if (!product) return res.status(400).json({ message: `商品「${item.name}」不存在` })
    if (product.stock < item.qty) return res.status(400).json({ message: `「${product.name}」库存不足，仅剩 ${product.stock} 件` })
  }
  for (const item of items) {
    const product = db.products.find((p) => p.id === item.productId)
    product.stock -= item.qty
  }
  const maxId = db.orders.reduce((max, o) => Math.max(max, o.id), 1000)
  const order = {
    id: maxId + 1,
    userId: user.id,
    userName: user.username,
    items,
    total,
    name: name || user.username,
    status: 'pending',
    address,
    phone: phone || '',
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
  }
  db.orders.push(order)
  router.db.write()
  res.json(order)
})

server.get('/api/cart', (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ message: '未登录' })
  const id = auth.replace('Bearer mock-jwt-token-', '')
  const db = router.db.getState()
  if (!db.carts) db.carts = []
  const cart = db.carts.find(c => c.userId === Number(id))
  res.json(cart ? cart.items : [])
})

server.put('/api/cart', (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ message: '未登录' })
  const id = auth.replace('Bearer mock-jwt-token-', '')
  const db = router.db.getState()
  if (!db.carts) db.carts = []
  const userId = Number(id)
  const idx = db.carts.findIndex(c => c.userId === userId)
  if (idx >= 0) db.carts[idx].items = req.body
  else db.carts.push({ userId, items: req.body })
  router.db.write()
  res.json({ ok: true })
})

// --- Address API ---
server.get('/api/addresses', (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ message: '未登录' })
  const id = auth.replace('Bearer mock-jwt-token-', '')
  const db = router.db.getState()
  if (!db.addresses) db.addresses = []
  const list = db.addresses.filter(a => a.userId === Number(id))
  res.json(list)
})

server.post('/api/addresses', (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ message: '未登录' })
  const id = auth.replace('Bearer mock-jwt-token-', '')
  const db = router.db.getState()
  if (!db.addresses) db.addresses = []
  const maxId = db.addresses.reduce((m, a) => Math.max(m, a.id), 0)
  const addr = { id: maxId + 1, userId: Number(id), ...req.body, createdAt: new Date().toISOString() }
  if (addr.isDefault) db.addresses.forEach(a => { if (a.userId === Number(id)) a.isDefault = false })
  db.addresses.push(addr)
  router.db.write()
  res.json(addr)
})

server.put('/api/addresses/:id', (req, res) => {
  const db = router.db.getState()
  if (!db.addresses) db.addresses = []
  const idx = db.addresses.findIndex(a => a.id === Number(req.params.id))
  if (idx < 0) return res.status(404).json({ message: '地址不存在' })
  Object.assign(db.addresses[idx], req.body)
  if (req.body.isDefault) db.addresses.forEach(a => { if (a.userId === db.addresses[idx].userId) a.isDefault = false })
  db.addresses[idx].isDefault = true
  router.db.write()
  res.json(db.addresses[idx])
})

server.delete('/api/addresses/:id', (req, res) => {
  const db = router.db.getState()
  if (!db.addresses) db.addresses = []
  db.addresses = db.addresses.filter(a => a.id !== Number(req.params.id))
  router.db.write()
  res.json({ ok: true })
})

// --- Wishlist API ---
server.get('/api/wishlist', (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ message: '未登录' })
  const id = auth.replace('Bearer mock-jwt-token-', '')
  const db = router.db.getState()
  if (!db.wishlist) db.wishlist = []
  res.json(db.wishlist.filter(w => w.userId === Number(id)))
})

server.post('/api/wishlist/toggle', (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ message: '未登录' })
  const id = auth.replace('Bearer mock-jwt-token-', '')
  const db = router.db.getState()
  if (!db.wishlist) db.wishlist = []
  const userId = Number(id)
  const productId = req.body.productId
  const idx = db.wishlist.findIndex(w => w.userId === userId && w.productId === productId)
  if (idx >= 0) {
    db.wishlist.splice(idx, 1)
    router.db.write()
    return res.json({ wishlisted: false })
  }
  db.wishlist.push({ userId, productId, createdAt: new Date().toISOString() })
  router.db.write()
  res.json({ wishlisted: true })
})

// --- Review API ---
server.post('/api/reviews', (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ message: '未登录' })
  const id = auth.replace('Bearer mock-jwt-token-', '')
  const db = router.db.getState()
  if (!db.reviews) db.reviews = []
  const maxId = db.reviews.reduce((m, r) => Math.max(m, r.id), 0)
  const review = { id: maxId + 1, userId: Number(id), ...req.body, createdAt: new Date().toISOString() }
  db.reviews.push(review)
  router.db.write()
  res.json(review)
})

server.get('/api/reviews/product/:productId', (req, res) => {
  const db = router.db.getState()
  if (!db.reviews) db.reviews = []
  const list = db.reviews.filter(r => r.productId === Number(req.params.productId))
  res.json(list)
})

server.delete('/api/reviews/:id', (req, res) => {
  const db = router.db.getState()
  if (!db.reviews) db.reviews = []
  db.reviews = db.reviews.filter(r => r.id !== Number(req.params.id))
  router.db.write()
  res.json({ ok: true })
})

server.get('/api/orders/my', (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ message: '请先登录' })
  const id = auth.replace('Bearer mock-jwt-token-', '')
  const db = router.db.getState()
  const userOrders = db.orders.filter((o) => o.userId === Number(id))
  res.json(userOrders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')))
})

// --- Coupon API ---
server.get('/api/coupons', (req, res) => {
  const db = router.db.getState()
  if (!db.coupons) db.coupons = []
  res.json(db.coupons)
})
server.post('/api/coupons', (req, res) => {
  const db = router.db.getState(); if (!db.coupons) db.coupons = []
  const maxId = db.coupons.reduce((m, c) => Math.max(m, c.id), 0)
  const c = { id: maxId + 1, ...req.body, createdAt: new Date().toISOString() }
  db.coupons.push(c); router.db.write(); res.json(c)
})
server.delete('/api/coupons/:id', (req, res) => {
  const db = router.db.getState(); if (!db.coupons) db.coupons = []
  db.coupons = db.coupons.filter(c => c.id !== Number(req.params.id)); router.db.write(); res.json({ ok: true })
})
server.post('/api/coupons/claim', (req, res) => {
  const auth = req.headers.authorization; if (!auth) return res.status(401).json({ message: '未登录' })
  const uid = Number(auth.replace('Bearer mock-jwt-token-', ''))
  const db = router.db.getState(); if (!db.user_coupons) db.user_coupons = []
  const coupon = db.coupons.find(c => c.id === req.body.couponId)
  if (!coupon) return res.status(404).json({ message: '优惠券不存在' })
  if (db.user_coupons.filter(c => c.userId === uid && c.couponId === req.body.couponId).length >= (coupon.limit || 1))
    return res.status(400).json({ message: '已达领取上限' })
  db.user_coupons.push({ userId: uid, couponId: req.body.couponId, used: false, claimedAt: new Date().toISOString() })
  router.db.write(); res.json({ ok: true })
})
server.get('/api/user/coupons', (req, res) => {
  const auth = req.headers.authorization; if (!auth) return res.status(401).json({ message: '未登录' })
  const uid = Number(auth.replace('Bearer mock-jwt-token-', ''))
  const db = router.db.getState(); if (!db.user_coupons) db.user_coupons = []
  if (!db.coupons) db.coupons = []
  const list = db.user_coupons.filter(c => c.userId === uid && !c.used)
    .map(uc => ({ ...uc, ...db.coupons.find(c => c.id === uc.couponId) }))
  res.json(list)
})

// --- After-sale API ---
server.post('/api/after-sales', (req, res) => {
  const auth = req.headers.authorization; if (!auth) return res.status(401).json({ message: '未登录' })
  const uid = Number(auth.replace('Bearer mock-jwt-token-', ''))
  const db = router.db.getState(); if (!db.after_sales) db.after_sales = []
  const maxId = db.after_sales.reduce((m, a) => Math.max(m, a.id), 0)
  const as = { id: maxId + 1, userId: uid, status: 'pending', ...req.body, createdAt: new Date().toISOString() }
  db.after_sales.push(as); router.db.write(); res.json(as)
})
server.get('/api/after-sales/my', (req, res) => {
  const auth = req.headers.authorization; if (!auth) return res.status(401).json({ message: '未登录' })
  const uid = Number(auth.replace('Bearer mock-jwt-token-', ''))
  const db = router.db.getState(); if (!db.after_sales) db.after_sales = []
  res.json(db.after_sales.filter(a => a.userId === uid))
})
server.get('/api/after-sales', (req, res) => {
  const db = router.db.getState(); if (!db.after_sales) db.after_sales = []; res.json(db.after_sales)
})
server.put('/api/after-sales/:id', (req, res) => {
  const db = router.db.getState(); if (!db.after_sales) db.after_sales = []
  const idx = db.after_sales.findIndex(a => a.id === Number(req.params.id))
  if (idx < 0) return res.status(404).json({ message: '不存在' })
  Object.assign(db.after_sales[idx], req.body); router.db.write(); res.json(db.after_sales[idx])
})

// --- Invoice API ---
server.post('/api/invoices', (req, res) => {
  const auth = req.headers.authorization; if (!auth) return res.status(401).json({ message: '未登录' })
  const uid = Number(auth.replace('Bearer mock-jwt-token-', ''))
  const db = router.db.getState(); if (!db.invoices) db.invoices = []
  const maxId = db.invoices.reduce((m, i) => Math.max(m, i.id), 0)
  const inv = { id: maxId + 1, userId: uid, status: 'pending', ...req.body, createdAt: new Date().toISOString() }
  db.invoices.push(inv); router.db.write(); res.json(inv)
})
server.get('/api/invoices/my', (req, res) => {
  const auth = req.headers.authorization; if (!auth) return res.status(401).json({ message: '未登录' })
  const uid = Number(auth.replace('Bearer mock-jwt-token-', ''))
  const db = router.db.getState(); if (!db.invoices) db.invoices = []; res.json(db.invoices.filter(i => i.userId === uid))
})
server.get('/api/invoices', (req, res) => {
  const db = router.db.getState(); if (!db.invoices) db.invoices = []; res.json(db.invoices)
})
server.put('/api/invoices/:id', (req, res) => {
  const db = router.db.getState(); if (!db.invoices) db.invoices = []
  const idx = db.invoices.findIndex(i => i.id === Number(req.params.id))
  if (idx < 0) return res.status(404).json({ message: '不存在' })
  Object.assign(db.invoices[idx], req.body); router.db.write(); res.json(db.invoices[idx])
})

// --- Chat API ---
server.get('/api/chat/messages', (req, res) => {
  const db = router.db.getState(); if (!db.chat_messages) db.chat_messages = []; res.json(db.chat_messages.slice(-50))
})
server.post('/api/chat/messages', (req, res) => {
  const db = router.db.getState(); if (!db.chat_messages) db.chat_messages = []
  const maxId = db.chat_messages.reduce((m, msg) => Math.max(m, msg.id), 0)
  const msg = { id: maxId + 1, ...req.body, createdAt: new Date().toISOString() }
  db.chat_messages.push(msg); router.db.write(); res.json(msg)
})

// --- Spec Templates API ---
server.get('/api/spec-templates', (req, res) => {
  const db = router.db.getState(); if (!db.spec_templates) db.spec_templates = []; res.json(db.spec_templates)
})
server.post('/api/spec-templates', (req, res) => {
  const db = router.db.getState(); if (!db.spec_templates) db.spec_templates = []
  const maxId = db.spec_templates.reduce((m, s) => Math.max(m, s.id), 0)
  const s = { id: maxId + 1, ...req.body }; db.spec_templates.push(s); router.db.write(); res.json(s)
})
server.delete('/api/spec-templates/:id', (req, res) => {
  const db = router.db.getState(); if (!db.spec_templates) db.spec_templates = []
  db.spec_templates = db.spec_templates.filter(s => s.id !== Number(req.params.id)); router.db.write(); res.json({ ok: true })
})

// --- Purchase Order API ---
server.get('/api/purchase-orders', (req, res) => {
  const db = router.db.getState(); if (!db.purchase_orders) db.purchase_orders = []; res.json(db.purchase_orders)
})
server.post('/api/purchase-orders', (req, res) => {
  const db = router.db.getState(); if (!db.purchase_orders) db.purchase_orders = []
  const maxId = db.purchase_orders.reduce((m, p) => Math.max(m, p.id), 0)
  const po = { id: maxId + 1, status: 'pending', ...req.body, createdAt: new Date().toISOString() }
  db.purchase_orders.push(po); router.db.write(); res.json(po)
})
server.put('/api/purchase-orders/:id', (req, res) => {
  const db = router.db.getState(); if (!db.purchase_orders) db.purchase_orders = []
  const idx = db.purchase_orders.findIndex(p => p.id === Number(req.params.id))
  if (idx < 0) return res.status(404).json({ message: '不存在' })
  Object.assign(db.purchase_orders[idx], req.body); router.db.write(); res.json(db.purchase_orders[idx])
})

// --- Supplier API ---
server.get('/api/suppliers', (req, res) => {
  const db = router.db.getState(); if (!db.suppliers) db.suppliers = []; res.json(db.suppliers)
})
server.post('/api/suppliers', (req, res) => {
  const db = router.db.getState(); if (!db.suppliers) db.suppliers = []
  const maxId = db.suppliers.reduce((m, s) => Math.max(m, s.id), 0)
  const sup = { id: maxId + 1, ...req.body }; db.suppliers.push(sup); router.db.write(); res.json(sup)
})
server.delete('/api/suppliers/:id', (req, res) => {
  const db = router.db.getState(); if (!db.suppliers) db.suppliers = []
  db.suppliers = db.suppliers.filter(s => s.id !== Number(req.params.id)); router.db.write(); res.json({ ok: true })
})

// --- Audit Log API ---
server.get('/api/audit-logs', (req, res) => {
  const db = router.db.getState(); if (!db.audit_logs) db.audit_logs = []
  res.json(db.audit_logs.slice(-100).reverse())
})
server.post('/api/audit-logs', (req, res) => {
  const db = router.db.getState(); if (!db.audit_logs) db.audit_logs = []
  const maxId = db.audit_logs.reduce((m, l) => Math.max(m, l.id), 0)
  db.audit_logs.push({ id: maxId + 1, ...req.body, createdAt: new Date().toISOString() })
  router.db.write(); res.json({ ok: true })
})

// ── 库存日志 API ──
server.get('/api/stock-logs', (req, res) => {
  const db = router.db.getState()
  if (!db.stock_logs) db.stock_logs = []
  let data = [...db.stock_logs]
  if (req.query.productId) data = data.filter(l => l.productId === Number(req.query.productId))
  res.json({ list: data.slice(-100).reverse(), total: data.length })
})
server.post('/api/stock-logs', (req, res) => {
  const db = router.db.getState()
  if (!db.stock_logs) db.stock_logs = []
  const maxId = db.stock_logs.reduce((m, l) => Math.max(m, l.id), 0)
  const log = { id: maxId + 1, ...req.body }
  db.stock_logs.push(log)
  router.db.write()
  res.json(log)
})

// ── 报表 API ──
server.get('/api/reports', (req, res) => {
  const db = router.db.getState()
  const { type = 'sales', from, to } = req.query
  const orders = db.orders.filter(o => o.status !== 'cancelled')
    .filter(o => !from || (o.createdAt || '') >= from)
    .filter(o => !to || (o.createdAt || '') <= to)

  // 按日期分组
  const dateMap = {}
  orders.forEach(o => {
    const d = (o.createdAt || '').slice(0, 10)
    if (!dateMap[d]) dateMap[d] = { orders: 0, revenue: 0, cost: 0 }
    dateMap[d].orders++
    dateMap[d].revenue += o.total || 0
    dateMap[d].cost += (o.cost || o.total * 0.6) || 0
  })
  const sortedDates = Object.keys(dateMap).sort()
  const totalRevenue = sortedDates.reduce((s, d) => s + dateMap[d].revenue, 0)
  const totalCost = sortedDates.reduce((s, d) => s + dateMap[d].cost, 0)
  const totalProfit = totalRevenue - totalCost

  let chartData = {
    labels: sortedDates,
    revenue: sortedDates.map(d => dateMap[d].revenue),
    cost: sortedDates.map(d => dateMap[d].cost),
    profit: sortedDates.map(d => dateMap[d].revenue - dateMap[d].cost),
  }
  let data = []
  if (type === 'sales') {
    data = sortedDates.map(d => ({
      '日期': d,
      '订单数': dateMap[d].orders,
      '营收': `¥${dateMap[d].revenue.toLocaleString()}`,
      '成本': `¥${dateMap[d].cost.toLocaleString()}`,
      '利润': `¥${(dateMap[d].revenue - dateMap[d].cost).toLocaleString()}`,
    }))
  } else if (type === 'product') {
    const productMap = {}
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        if (!productMap[item.name]) productMap[item.name] = { qty: 0, revenue: 0, cost: 0 }
        productMap[item.name].qty += item.qty || 0
        productMap[item.name].revenue += (item.price * item.qty) || 0
        productMap[item.name].cost += (item.cost || item.price * 0.6 * item.qty) || 0
      })
    })
    data = Object.entries(productMap).map(([name, v]) => ({
      '商品名称': name,
      '销量': v.qty,
      '营收': `¥${v.revenue.toLocaleString()}`,
      '成本': `¥${v.cost.toLocaleString()}`,
      '利润': `¥${(v.revenue - v.cost).toLocaleString()}`,
    }))
  } else if (type === 'category') {
    const catMap = {}
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        const product = db.products.find(p => p.id === item.productId)
        const cat = product?.category || '未分类'
        if (!catMap[cat]) catMap[cat] = { qty: 0, revenue: 0, cost: 0 }
        catMap[cat].qty += item.qty || 0
        catMap[cat].revenue += (item.price * item.qty) || 0
        catMap[cat].cost += (item.cost || item.price * 0.6 * item.qty) || 0
      })
    })
    data = Object.entries(catMap).map(([cat, v]) => ({
      '分类': cat,
      '销量': v.qty,
      '营收': `¥${v.revenue.toLocaleString()}`,
      '成本': `¥${v.cost.toLocaleString()}`,
      '利润': `¥${(v.revenue - v.cost).toLocaleString()}`,
    }))
  } else if (type === 'profit') {
    data = sortedDates.map(d => ({
      '日期': d,
      '营收': `¥${dateMap[d].revenue.toLocaleString()}`,
      '成本': `¥${dateMap[d].cost.toLocaleString()}`,
      '利润': `¥${(dateMap[d].revenue - dateMap[d].cost).toLocaleString()}`,
      '利润率': dateMap[d].revenue ? ((dateMap[d].revenue - dateMap[d].cost) / dateMap[d].revenue * 100).toFixed(1) + '%' : '0%',
    }))
  }
  res.json({
    summary: {
      totalOrders: orders.length,
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin: totalRevenue ? (totalProfit / totalRevenue * 100).toFixed(1) : 0,
      avgOrderValue: orders.length ? Math.round(totalRevenue / orders.length) : 0,
    },
    chartData,
    data,
  })
})

// ── 角色管理 API ──
server.get('/api/roles', (req, res) => {
  const db = router.db.getState()
  if (!db.roles) db.roles = [
    { id: 1, label: '超级管理员', value: 'super_admin', permissions: { dashboard: ['view'], users: ['view','create','edit','delete'], products: ['view','create','edit','delete'], categories: ['view','create','edit','delete'], orders: ['view','edit','delete','export'], coupons: ['view','create','edit','delete'], banners: ['view','create','edit','delete'], reviews: ['view','delete'], afterSales: ['view','edit'], invoices: ['view','edit'], suppliers: ['view','create','edit','delete'], purchaseOrders: ['view','create','edit','delete'], specTemplates: ['view','create','edit','delete'], auditLogs: ['view'], settings: ['view','edit'], reports: ['view','export'], inventory: ['view','edit'], roles: ['view','create','edit','delete'] }, createdAt: '2026-01-01' },
    { id: 2, label: '管理员', value: 'admin', permissions: { dashboard: ['view'], users: ['view','create','edit'], products: ['view','create','edit','delete'], categories: ['view','create','edit','delete'], orders: ['view','edit','delete','export'], coupons: ['view','create','edit','delete'], banners: ['view','create','edit','delete'], reviews: ['view','delete'], afterSales: ['view','edit'], invoices: ['view','edit'], suppliers: ['view','create','edit'], purchaseOrders: ['view','create','edit'], specTemplates: ['view','create','edit'], auditLogs: ['view'], settings: ['view'], reports: ['view','export'], inventory: ['view','edit'], roles: [] }, createdAt: '2026-01-01' },
  ]
  res.json({ list: db.roles, total: db.roles.length })
})
server.post('/api/roles', (req, res) => {
  const db = router.db.getState()
  if (!db.roles) db.roles = []
  const maxId = db.roles.reduce((m, r) => Math.max(m, r.id), 0)
  const role = { id: maxId + 1, ...req.body, createdAt: new Date().toISOString().slice(0, 10) }
  db.roles.push(role)
  router.db.write()
  res.json(role)
})
server.put('/api/roles/:id', (req, res) => {
  const db = router.db.getState()
  const idx = db.roles.findIndex(r => r.id === Number(req.params.id))
  if (idx < 0) return res.status(404).json({ message: '不存在' })
  Object.assign(db.roles[idx], req.body)
  router.db.write()
  res.json(db.roles[idx])
})
server.delete('/api/roles/:id', (req, res) => {
  const db = router.db.getState()
  if (!db.roles) db.roles = []
  db.roles = db.roles.filter(r => r.id !== Number(req.params.id))
  router.db.write()
  res.json({ ok: true })
})

// ── 数据备份恢复 API ──
server.get('/api/db', (req, res) => {
  const db = router.db.getState()
  res.json(db)
})
server.post('/api/db/restore', (req, res) => {
  const db = router.db.getState()
  const { resource, data } = req.body
  if (!resource || !Array.isArray(data)) return res.status(400).json({ message: '参数错误' })
  db[resource] = data
  router.db.write()
  res.json({ ok: true })
})
server.post('/api/db/reset', (req, res) => {
  const db = router.db.getState()
  const keepTables = ['users'] // 保留管理员账号
  const keepUsers = db.users.filter(u => u.role === 'admin')
  db.users = keepUsers
  db.products = []
  db.categories = []
  db.orders = []
  db.carts = []
  db.addresses = []
  db.wishlist = []
  db.reviews = []
  db.coupons = []
  db.user_coupons = []
  db.after_sales = []
  db.invoices = []
  db.chat_messages = []
  db.audit_logs = []
  db.purchase_orders = []
  db.suppliers = []
  db.stock_logs = []
  db.staff = []
  db.spec_templates = []
  router.db.write()
  res.json({ ok: true })
})

server.use('/api', (req, res, next) => {
  if (req.method === 'GET') {
    // req.path 已剥离 '/api' 前缀，如 '/products' → 资源名 'products'
    const resource = req.path.replace('/', '').split('?')[0]
    const db = router.db.getState()
    let data = db[resource]
    if (!data) { next(); return }
    if (req.query.category && resource === 'products') {
      data = data.filter((item) => item.category === req.query.category)
    }
    if (req.query.status) {
      data = data.filter((item) => item.status === req.query.status)
    }
    if (req.query.keyword) {
      const keyword = req.query.keyword.toLowerCase()
      data = data.filter((item) =>
        Object.values(item).some(
          (v) => String(v).toLowerCase().includes(keyword)
        )
      )
    }
    const total = data.length
    const page = Number(req.query.page) || 1
    const pageSize = Number(req.query.pageSize) || 20
    const start = (page - 1) * pageSize
    data = data.slice(start, start + pageSize)
    return res.json({ list: data, total })
  }
  next()
})

server.use(jsonServer.rewriter({
  '/api/*': '/$1',
}))

server.use((req, res, next) => {
  const originalJson = res.json.bind(res)
  res.json = function (body) {
    if (Array.isArray(body)) {
      const page = Number(req.query._page) || 1
      const pageSize = Number(req.query._limit) || 20
      const start = (page - 1) * pageSize
      const items = body.slice(start, start + pageSize)
      return originalJson({
        list: items,
        total: body.length,
      })
    }
    return originalJson(body)
  }
  next()
})

server.use(router)

if (isProduction) {
  server.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ message: 'API not found' })
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  })
}

const PORT = process.env.PORT || 3001

function tryListen(port) {
  server.listen(port, () => {
    console.log('Mock API server running at http://localhost:' + port)
  })
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log('Port ' + port + ' in use, trying to free it...')
      const { execSync } = require('child_process')
      try {
        const result = execSync(
          'netstat -ano | findstr ":' + port + '"',
          { encoding: 'utf8', timeout: 3000 }
        )
        const lines = result.trim().split('\n')
        for (const line of lines) {
          const parts = line.trim().split(/\s+/)
          const pid = parts[parts.length - 1]
          if (pid && pid !== '0') {
            try {
              execSync('taskkill /f /pid ' + pid, { stdio: 'ignore', timeout: 3000 })
              console.log('Killed process ' + pid)
            } catch (_) {}
          }
        }
      } catch (_) {}
      setTimeout(() => tryListen(port), 500)
    } else {
      console.error('Server error:', e)
    }
  })
}

tryListen(PORT)
