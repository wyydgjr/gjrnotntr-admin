/**
 * JSONBin.io 数据持久化层（admin 项目）
 * 与商城项目共享同一个 Bin，确保数据一致
 */

const JSONBIN_ID = process.env.JSONBIN_ID || '6a4619bbda38895dfe20e2f5'
const JSONBIN_MASTER_KEY = process.env.JSONBIN_MASTER_KEY || '$2a$10$rI5sADEOLoyZ/4TRglDr1.FGK4E4xzeKQuv7wQTaL86U8.v1k16PG'
const JSONBIN_BASE = 'https://api.jsonbin.io/v3'

const enabled = () => !!JSONBIN_MASTER_KEY

async function read() {
  if (!enabled()) return null
  try {
    const res = await fetch(`${JSONBIN_BASE}/b/${JSONBIN_ID}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_MASTER_KEY },
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.record
  } catch {
    return null
  }
}

async function write(data) {
  if (!enabled()) return false
  try {
    const res = await fetch(`${JSONBIN_BASE}/b/${JSONBIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_MASTER_KEY,
      },
      body: JSON.stringify(data),
    })
    return res.ok
  } catch {
    return false
  }
}

export default { enabled, read, write }
