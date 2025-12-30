# ============================================
# 阶段1: 构建阶段
# ============================================
FROM node:24-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm build

# ============================================
# 阶段2: 生产阶段
# ============================================
FROM node:24-alpine AS production

WORKDIR /app

# 从构建阶段复制必要文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# 复制环境变量文件（由部署脚本提前复制为 .env）
COPY .env ./

# 端口由环境变量 SERVICE_PORT 控制，默认 3000
ENV SERVICE_PORT=3000

# 暴露端口（运行时由 SERVICE_PORT 决定实际端口）
EXPOSE ${SERVICE_PORT}

# 启动应用
CMD ["node", "dist/main.js"]
