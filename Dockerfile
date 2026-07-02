# ── 构建阶段 ──
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npm run build

# ── 运行阶段 ──
FROM node:20-alpine AS runner
WORKDIR /app

# 复制构建产物
COPY --from=builder /app/dist ./dist

# 复制服务端文件
COPY --from=builder /app/mock-server.cjs ./
COPY --from=builder /app/db.json ./
COPY --from=builder /app/package*.json ./

# 仅安装生产依赖
RUN npm ci --production

# 创建 uploads 目录（持久化上传的图片）
RUN mkdir -p /app/dist/uploads

EXPOSE 3001

# 生产模式运行
ENV NODE_ENV=production
CMD ["node", "mock-server.cjs"]
