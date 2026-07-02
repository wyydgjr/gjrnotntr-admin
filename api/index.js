import express from 'express'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const server = express()

// ── 安全：密码哈希（与 mock-server.cjs 保持一致） ──
function hashPassword(password) {
  return crypto.createHash('md5').update(password).digest('hex')
}

function verifyPassword(password, storedHash) {
  if (storedHash && storedHash.length === 32 && /^[a-f0-9]+$/.test(storedHash)) {
    return hashPassword(password) === storedHash
  }
  return password === storedHash
}

// ── Vercel 环境判断 ──
const isVercel = !!process.env.VERCEL

// ── 数据持久化 ──
// Vercel Serverless: 使用 /tmp 目录（可写但实例间不共享）
// 本地开发: 使用项目根目录的 db.json
const DB_PATH = isVercel
  ? path.join('/tmp', 'db.json')
  : path.join(__dirname, '..', 'db.json')

const SEED_PATH = path.join(__dirname, '..', 'db.json')

function emptyDb() {
  return { users: [], products: [], categories: [], orders: [], carts: [], addresses: [], wishlist: [], reviews: [], coupons: [], user_coupons: [], after_sales: [], invoices: [], chat_messages: [], spec_templates: [], purchase_orders: [], suppliers: [], audit_logs: [] }
}

function loadDb() {
  try {
    // Vercel 上优先从 /tmp 读取（热启动保留数据）
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
    }
    // 冷启动：从种子文件复制到 /tmp
    if (isVercel && fs.existsSync(SEED_PATH)) {
      const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf-8'))
      fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2), 'utf-8')
      return seed
    }
    // 本地开发：直接读 db.json
    return JSON.parse(fs.readFileSync(SEED_PATH, 'utf-8'))
  } catch (_) {
    return emptyDb()
  }
}

function saveDb(db) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8')
  } catch (e) {
    console.error('saveDb failed:', e.message)
  }
}

let db = loadDb()

server.use(express.json())

// ── CORS + 安全响应头（企业级） ──
server.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3001',
    'https://gjrnotntr.vercel.app',
    'https://gjrnotntr-admin.vercel.app',
    'https://ve-admin-jade.vercel.app',
  ]
  const origin = req.headers.origin
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin)
  } else if (origin) {
    // 允许任何 vercel.app 子域名（开发/预览部署）
    res.header('Access-Control-Allow-Origin', origin)
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

  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

// ── 工具函数 ──
function paginatedList(data, query) {
  const keyword = query.keyword
  let filtered = data
  if (keyword) {
    const kw = keyword.toLowerCase()
    filtered = data.filter((item) =>
      Object.values(item).some((v) => String(v).toLowerCase().includes(kw))
    )
  }
  const total = filtered.length
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 20
  const start = (page - 1) * pageSize
  return { list: filtered.slice(start, start + pageSize), total }
}

function getUserId(req) {
  const auth = req.headers.authorization
  if (!auth) return null
  return Number(auth.replace('Bearer mock-jwt-token-', ''))
}

function requireAuth(req, res) {
  const userId = getUserId(req)
  if (!userId) {
    res.status(401).json({ message: '未登录' })
    return null
  }
  const user = db.users.find((u) => u.id === userId)
  if (!user) {
    res.status(401).json({ message: '用户不存在' })
    return null
  }
  return user
}

// ── 健康检查 ──
server.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// ═══════════════════ 认证模块 ═══════════════════

// 登录
server.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ message: '用户名和密码不能为空' })
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

// 管理员登录
server.post('/api/auth/admin-login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ message: '用户名和密码不能为空' })
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

// 注册
server.post('/api/auth/register', (req, res) => {
  const { username, password, email } = req.body
  if (!username || !password) return res.status(400).json({ message: '用户名和密码不能为空' })
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return res.status(400).json({ message: '密码必须包含大小写字母和数字' })
  }
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
  saveDb(db)
  const { password: _, ...safeUser } = newUser
  res.json({
    token: 'mock-jwt-token-' + newUser.id,
    refreshToken: 'mock-refresh-' + newUser.id,
    expiresIn: 7200,
    user: safeUser,
  })
})

// Token 刷新
server.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body || {}
  if (!refreshToken) return res.status(401).json({ message: '刷新令牌无效' })
  const id = refreshToken.replace('mock-refresh-', '')
  const user = db.users.find((u) => u.id === Number(id))
  if (!user || user.status !== 'active') return res.status(401).json({ message: '刷新令牌无效' })
  res.json({
    accessToken: 'mock-jwt-token-' + user.id,
    refreshToken: 'mock-refresh-' + user.id,
    expiresIn: 7200,
  })
})

// 获取用户信息
server.get('/api/auth/userinfo', (req, res) => {
  const user = requireAuth(req, res)
  if (!user) return
  const { password: _, ...safeUser } = user
  res.json({ user: safeUser })
})

// 更新个人资料
server.put('/api/auth/profile', (req, res) => {
  const user = requireAuth(req, res)
  if (!user) return
  const idx = db.users.findIndex((u) => u.id === user.id)
  const { password, ...rest } = req.body
  Object.assign(db.users[idx], rest)
  if (password) db.users[idx].password = hashPassword(password)
  saveDb(db)
  const { password: _, ...safeUser } = db.users[idx]
  res.json({ user: safeUser })
})

// 修改密码
server.put('/api/auth/password', (req, res) => {
  const user = requireAuth(req, res)
  if (!user) return
  const { oldPassword, newPassword } = req.body
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: '旧密码和新密码不能为空' })
  }
  if (!verifyPassword(oldPassword, user.password)) {
    return res.status(400).json({ message: '旧密码不正确' })
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: '新密码至少6位' })
  }
  if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return res.status(400).json({ message: '新密码必须包含大小写字母和数字' })
  }
  const idx = db.users.findIndex((u) => u.id === user.id)
  db.users[idx].password = hashPassword(newPassword)
  saveDb(db)
  res.json({ ok: true, message: '密码修改成功' })
})

// ═══════════════════ 仪表盘 ═══════════════════

server.get('/api/dashboard/stats', (_req, res) => {
  const userCount = db.users.length
  const productCount = db.products.length
  const orderCount = db.orders.length
  const activeUsers = db.users.filter((u) => u.status === 'active').length
  const totalRevenue = db.orders.filter((o) => o.status === 'completed').reduce((s, o) => s + o.total, 0)
  const pendingOrders = db.orders.filter((o) => o.status === 'pending').length
  const lowStock = db.products.filter((p) => p.stock > 0 && p.stock < 20).length
  res.json({ userCount, productCount, orderCount, activeUsers, totalRevenue, pendingOrders, lowStock })
})

server.get('/api/dashboard/activities', (_req, res) => {
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

server.get('/api/dashboard/revenue', (_req, res) => {
  const monthMap = {}
  db.orders.filter((o) => o.status === 'completed').forEach((o) => {
    const m = (o.createdAt || '').slice(0, 7)
    if (m) monthMap[m] = (monthMap[m] || 0) + o.total
  })
  const months = Object.keys(monthMap).sort()
  res.json({ months, values: months.map((m) => monthMap[m]) })
})

// ═══════════════════ CRUD 资源 ═══════════════════

// 注意：orders 的 PUT 单独定义在后面（带权限校验，覆盖通用路由）
const resources = ['users', 'products', 'categories', 'orders']
resources.forEach((resource) => {
  server.get(`/api/${resource}`, (req, res) => {
    res.json(paginatedList(db[resource] || [], req.query))
  })
  server.get(`/api/${resource}/:id`, (req, res) => {
    const item = (db[resource] || []).find((i) => i.id === Number(req.params.id))
    item ? res.json(item) : res.status(404).json({ message: '未找到' })
  })
})

// 订单更新（带用户归属校验，覆盖通用 CRUD 的 PUT）
server.put('/api/orders/:id', (req, res) => {
  const user = requireAuth(req, res)
  if (!user) return
  const order = db.orders.find((o) => o.id === Number(req.params.id))
  if (!order) return res.status(404).json({ message: '订单不存在' })
  // 普通用户只能操作自己的订单，管理员可操作所有
  if (user.role !== 'admin' && order.userId !== user.id) {
    return res.status(403).json({ message: '无权操作此订单' })
  }
  const idx = db.orders.findIndex((o) => o.id === Number(req.params.id))
  // 不允许已取消/已完成的订单再次修改状态
  if (req.body.status === 'cancelled' && order.status !== 'pending') {
    return res.status(400).json({ message: '只能取消待处理状态的订单' })
  }
  Object.assign(db.orders[idx], req.body)
  saveDb(db)
  res.json(db.orders[idx])
})

// ═══════════════════ 购物车 ═══════════════════

server.get('/api/cart', (req, res) => {
  const user = requireAuth(req, res)
  if (!user) return
  if (!db.carts) db.carts = []
  const cart = db.carts.find(c => c.userId === user.id)
  res.json(cart ? cart.items : [])
})

server.put('/api/cart', (req, res) => {
  const user = requireAuth(req, res)
  if (!user) return
  if (!db.carts) db.carts = []
  const idx = db.carts.findIndex(c => c.userId === user.id)
  if (idx >= 0) db.carts[idx].items = req.body
  else db.carts.push({ userId: user.id, items: req.body })
  saveDb(db)
  res.json({ ok: true })
})

// ═══════════════════ 地址 ═══════════════════

server.get('/api/addresses', (req, res) => {
  const user = requireAuth(req, res)
  if (!user) return
  if (!db.addresses) db.addresses = []
  res.json(db.addresses.filter(a => a.userId === user.id))
})

server.post('/api/addresses', (req, res) => {
  const user = requireAuth(req, res)
  if (!user) return
  if (!db.addresses) db.addresses = []
  const maxId = db.addresses.reduce((m, a) => Math.max(m, a.id), 0)
  const addr = { id: maxId + 1, userId: user.id, ...req.body, createdAt: new Date().toISOString() }
  if (addr.isDefault) db.addresses.forEach(a => { if (a.userId === user.id) a.isDefault = false })
  db.addresses.push(addr)
  saveDb(db)
  res.json(addr)
})

server.put('/api/addresses/:id', (req, res) => {
  if (!db.addresses) db.addresses = []
  const idx = db.addresses.findIndex(a => a.id === Number(req.params.id))
  if (idx < 0) return res.status(404).json({ message: '地址不存在' })
  Object.assign(db.addresses[idx], req.body)
  if (req.body.isDefault) db.addresses.forEach(a => { if (a.userId === db.addresses[idx].userId) a.isDefault = false })
  db.addresses[idx].isDefault = true
  saveDb(db)
  res.json(db.addresses[idx])
})

server.delete('/api/addresses/:id', (req, res) => {
  if (!db.addresses) db.addresses = []
  db.addresses = db.addresses.filter(a => a.id !== Number(req.params.id))
  saveDb(db)
  res.json({ ok: true })
})

// ═══════════════════ 收藏夹 ═══════════════════

server.get('/api/wishlist', (req, res) => {
  const user = requireAuth(req, res)
  if (!user) return
  if (!db.wishlist) db.wishlist = []
  res.json(db.wishlist.filter(w => w.userId === user.id))
})

server.post('/api/wishlist/toggle', (req, res) => {
  const user = requireAuth(req, res)
  if (!user) return
  if (!db.wishlist) db.wishlist = []
  const productId = req.body.productId
  const idx = db.wishlist.findIndex(w => w.userId === user.id && w.productId === productId)
  if (idx >= 0) {
    db.wishlist.splice(idx, 1)
    saveDb(db)
    return res.json({ wishlisted: false })
  }
  db.wishlist.push({ userId: user.id, productId, createdAt: new Date().toISOString() })
  saveDb(db)
  res.json({ wishlisted: true })
})

// ═══════════════════ 评价 ═══════════════════

server.post('/api/reviews', (req, res) => {
  const user = requireAuth(req, res)
  if (!user) return
  if (!db.reviews) db.reviews = []
  const maxId = db.reviews.reduce((m, r) => Math.max(m, r.id), 0)
  const review = { id: maxId + 1, userId: user.id, ...req.body, createdAt: new Date().toISOString() }
  db.reviews.push(review)
  saveDb(db)
  res.json(review)
})

server.get('/api/reviews/product/:productId', (req, res) => {
  if (!db.reviews) db.reviews = []
  res.json(db.reviews.filter(r => r.productId === Number(req.params.productId)))
})

server.delete('/api/reviews/:id', (req, res) => {
  if (!db.reviews) db.reviews = []
  db.reviews = db.reviews.filter(r => r.id !== Number(req.params.id))
  saveDb(db)
  res.json({ ok: true })
})

// ═══════════════════ 订单 ═══════════════════

server.post('/api/orders', (req, res) => {
  const user = requireAuth(req, res)
  if (!user) return
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
  saveDb(db)
  res.json(order)
})

server.get('/api/orders/my', (req, res) => {
  const user = requireAuth(req, res)
  if (!user) return
  const userOrders = db.orders.filter((o) => o.userId === user.id)
  res.json(userOrders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')))
})

// ═══════════════════ 优惠券 ═══════════════════

server.get('/api/coupons', (_req, res) => {
  if (!db.coupons) db.coupons = []
  res.json(db.coupons)
})

server.post('/api/coupons', (req, res) => {
  if (!db.coupons) db.coupons = []
  const maxId = db.coupons.reduce((m, c) => Math.max(m, c.id), 0)
  const c = { id: maxId + 1, ...req.body, createdAt: new Date().toISOString() }
  db.coupons.push(c)
  saveDb(db)
  res.json(c)
})

server.delete('/api/coupons/:id', (req, res) => {
  if (!db.coupons) db.coupons = []
  db.coupons = db.coupons.filter(c => c.id !== Number(req.params.id))
  saveDb(db)
  res.json({ ok: true })
})

server.post('/api/coupons/claim', (req, res) => {
  const user = requireAuth(req, res)
  if (!user) return
  if (!db.user_coupons) db.user_coupons = []
  const coupon = db.coupons.find(c => c.id === req.body.couponId)
  if (!coupon) return res.status(404).json({ message: '优惠券不存在' })
  if (db.user_coupons.filter(c => c.userId === user.id && c.couponId === req.body.couponId).length >= (coupon.limit || 1))
    return res.status(400).json({ message: '已达领取上限' })
  db.user_coupons.push({ userId: user.id, couponId: req.body.couponId, used: false, claimedAt: new Date().toISOString() })
  saveDb(db)
  res.json({ ok: true })
})

server.get('/api/user/coupons', (req, res) => {
  const user = requireAuth(req, res)
  if (!user) return
  if (!db.user_coupons) db.user_coupons = []
  if (!db.coupons) db.coupons = []
  const list = db.user_coupons.filter(c => c.userId === user.id && !c.used)
    .map(uc => ({ ...uc, ...db.coupons.find(c => c.id === uc.couponId) }))
  res.json(list)
})

// ═══════════════════ 售后 ═══════════════════

server.post('/api/after-sales', (req, res) => {
  const user = requireAuth(req, res)
  if (!user) return
  if (!db.after_sales) db.after_sales = []
  const maxId = db.after_sales.reduce((m, a) => Math.max(m, a.id), 0)
  const as = { id: maxId + 1, userId: user.id, status: 'pending', ...req.body, createdAt: new Date().toISOString() }
  db.after_sales.push(as)
  saveDb(db)
  res.json(as)
})

server.get('/api/after-sales/my', (req, res) => {
  const user = requireAuth(req, res)
  if (!user) return
  if (!db.after_sales) db.after_sales = []
  res.json(db.after_sales.filter(a => a.userId === user.id))
})

server.get('/api/after-sales', (_req, res) => {
  if (!db.after_sales) db.after_sales = []
  res.json(db.after_sales)
})

server.put('/api/after-sales/:id', (req, res) => {
  if (!db.after_sales) db.after_sales = []
  const idx = db.after_sales.findIndex(a => a.id === Number(req.params.id))
  if (idx < 0) return res.status(404).json({ message: '不存在' })
  Object.assign(db.after_sales[idx], req.body)
  saveDb(db)
  res.json(db.after_sales[idx])
})

// ═══════════════════ 发票 ═══════════════════

server.post('/api/invoices', (req, res) => {
  const user = requireAuth(req, res)
  if (!user) return
  if (!db.invoices) db.invoices = []
  const maxId = db.invoices.reduce((m, i) => Math.max(m, i.id), 0)
  const inv = { id: maxId + 1, userId: user.id, status: 'pending', ...req.body, createdAt: new Date().toISOString() }
  db.invoices.push(inv)
  saveDb(db)
  res.json(inv)
})

server.get('/api/invoices/my', (req, res) => {
  const user = requireAuth(req, res)
  if (!user) return
  if (!db.invoices) db.invoices = []
  res.json(db.invoices.filter(i => i.userId === user.id))
})

server.get('/api/invoices', (_req, res) => {
  if (!db.invoices) db.invoices = []
  res.json(db.invoices)
})

server.put('/api/invoices/:id', (req, res) => {
  if (!db.invoices) db.invoices = []
  const idx = db.invoices.findIndex(i => i.id === Number(req.params.id))
  if (idx < 0) return res.status(404).json({ message: '不存在' })
  Object.assign(db.invoices[idx], req.body)
  saveDb(db)
  res.json(db.invoices[idx])
})

// ═══════════════════ 聊天 ═══════════════════

server.get('/api/chat/messages', (_req, res) => {
  if (!db.chat_messages) db.chat_messages = []
  res.json(db.chat_messages.slice(-50))
})

server.post('/api/chat/messages', (req, res) => {
  if (!db.chat_messages) db.chat_messages = []
  const maxId = db.chat_messages.reduce((m, msg) => Math.max(m, msg.id), 0)
  const msg = { id: maxId + 1, ...req.body, createdAt: new Date().toISOString() }
  db.chat_messages.push(msg)
  saveDb(db)
  res.json(msg)
})

// ═══════════════════ 属性模板 ═══════════════════

server.get('/api/spec-templates', (_req, res) => {
  if (!db.spec_templates) db.spec_templates = []
  res.json(db.spec_templates)
})

server.post('/api/spec-templates', (req, res) => {
  if (!db.spec_templates) db.spec_templates = []
  const maxId = db.spec_templates.reduce((m, s) => Math.max(m, s.id), 0)
  const s = { id: maxId + 1, ...req.body }
  db.spec_templates.push(s)
  saveDb(db)
  res.json(s)
})

server.delete('/api/spec-templates/:id', (req, res) => {
  if (!db.spec_templates) db.spec_templates = []
  db.spec_templates = db.spec_templates.filter(s => s.id !== Number(req.params.id))
  saveDb(db)
  res.json({ ok: true })
})

// ═══════════════════ 采购单 ═══════════════════

server.get('/api/purchase-orders', (_req, res) => {
  if (!db.purchase_orders) db.purchase_orders = []
  res.json(db.purchase_orders)
})

server.post('/api/purchase-orders', (req, res) => {
  if (!db.purchase_orders) db.purchase_orders = []
  const maxId = db.purchase_orders.reduce((m, p) => Math.max(m, p.id), 0)
  const po = { id: maxId + 1, status: 'pending', ...req.body, createdAt: new Date().toISOString() }
  db.purchase_orders.push(po)
  saveDb(db)
  res.json(po)
})

server.put('/api/purchase-orders/:id', (req, res) => {
  if (!db.purchase_orders) db.purchase_orders = []
  const idx = db.purchase_orders.findIndex(p => p.id === Number(req.params.id))
  if (idx < 0) return res.status(404).json({ message: '不存在' })
  Object.assign(db.purchase_orders[idx], req.body)
  saveDb(db)
  res.json(db.purchase_orders[idx])
})

// ═══════════════════ 供应商 ═══════════════════

server.get('/api/suppliers', (_req, res) => {
  if (!db.suppliers) db.suppliers = []
  res.json(db.suppliers)
})

server.post('/api/suppliers', (req, res) => {
  if (!db.suppliers) db.suppliers = []
  const maxId = db.suppliers.reduce((m, s) => Math.max(m, s.id), 0)
  const sup = { id: maxId + 1, ...req.body }
  db.suppliers.push(sup)
  saveDb(db)
  res.json(sup)
})

server.delete('/api/suppliers/:id', (req, res) => {
  if (!db.suppliers) db.suppliers = []
  db.suppliers = db.suppliers.filter(s => s.id !== Number(req.params.id))
  saveDb(db)
  res.json({ ok: true })
})

// ═══════════════════ 审计日志 ═══════════════════

server.get('/api/audit-logs', (_req, res) => {
  if (!db.audit_logs) db.audit_logs = []
  res.json(db.audit_logs.slice(-100).reverse())
})

server.post('/api/audit-logs', (req, res) => {
  if (!db.audit_logs) db.audit_logs = []
  const maxId = db.audit_logs.reduce((m, l) => Math.max(m, l.id), 0)
  db.audit_logs.push({ id: maxId + 1, ...req.body, createdAt: new Date().toISOString() })
  saveDb(db)
  res.json({ ok: true })
})

// ═══════════════════ 文件上传 ═══════════════════

// 上传目录：Vercel 使用 /tmp/uploads，本地使用项目 uploads 目录
const UPLOAD_DIR = isVercel
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, '..', 'public', 'uploads')

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

// 解析 JSON body 中的 base64 图片上传
server.post('/api/upload', (req, res) => {
  const user = requireAuth(req, res)
  if (!user) return
  const { file, filename } = req.body || {}
  if (!file) return res.status(400).json({ message: '缺少文件数据' })

  // 支持 base64 data URL 格式
  const matches = file.match(/^data:([^;]+);base64,(.+)$/)
  if (!matches) return res.status(400).json({ message: '文件格式不支持，需要 base64 data URL' })

  const mimeType = matches[1]
  const ext = mimeType.split('/')[1] || 'png'
  const name = filename || `avatar_${user.id}_${Date.now()}.${ext}`
  const filePath = path.join(UPLOAD_DIR, name)

  try {
    const buffer = Buffer.from(matches[2], 'base64')
    fs.writeFileSync(filePath, buffer)
    const url = `/uploads/${name}`
    res.json({ url, filename: name })
  } catch (e) {
    console.error('upload failed:', e.message)
    res.status(500).json({ message: '文件上传失败' })
  }
})

// 静态文件服务：提供上传文件的访问
server.use('/uploads', express.static(UPLOAD_DIR))

export default server
