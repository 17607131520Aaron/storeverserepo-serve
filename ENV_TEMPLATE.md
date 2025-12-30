# 环境变量配置模板

请复制以下内容创建 `.env.example` 文件，然后根据实际环境创建对应的 `.env` 文件。

## 创建步骤

```bash
# 1. 创建 .env.example 文件（模板文件，可提交到版本控制）
cat > .env.example << 'EOF'
# 复制下面的内容
EOF

# 2. 根据环境创建对应的 .env 文件
cp .env.example .env.development
cp .env.example .env.test
cp .env.example .env.production

# 3. 修改对应环境的配置
```

## 环境变量模板

```bash
# ============================================
# 应用基础配置
# ============================================
NODE_ENV=development
SERVICE_PORT=3000

# ============================================
# MySQL 数据库配置
# ============================================
NODE_MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USERNAME=root
MYSQL_PASSWORD=123456789
MYSQL_DATABASE=alkaline-backend-test

# ============================================
# Redis 配置
# ============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ============================================
# RabbitMQ 配置
# ============================================
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest

# ============================================
# JWT 认证配置
# ============================================
JWT_SECRET=your-secret-key-change-in-production
JWT_TTL_SECONDS=7200

# ============================================
# WebSocket 日志服务器配置
# ============================================
LOG_SERVER_PORT=8082
```

## 环境说明

- **开发环境** (`.env.development`): 本地开发使用，端口 3000
- **测试环境** (`.env.test`): 测试服务器使用，端口 3001
- **生产环境** (`.env.production`): 生产服务器使用，端口 3000（可自定义）

## 注意事项

1. `.env.example` 文件可以提交到版本控制，作为配置模板
2. `.env.*` 文件包含敏感信息，不应提交到版本控制（已在 `.gitignore` 中配置）
3. 生产环境必须修改 `JWT_SECRET` 为强密码
4. 确保每个环境的数据库、Redis、RabbitMQ 配置正确

