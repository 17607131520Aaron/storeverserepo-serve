# PM2 部署指南

## 前置要求

1. 确保已安装 Node.js 和 pnpm
2. 全局安装 PM2：

```bash
npm install -g pm2
# 或
pnpm add -g pm2
```

## 部署步骤

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

项目支持多环境部署，需要根据环境创建对应的 `.env` 文件：

```bash
# 复制环境变量模板（如果存在）
cp .env.example .env.development
cp .env.example .env.test
cp .env.example .env.production

# 然后根据实际环境修改对应的 .env 文件
```

**环境变量文件说明**：

- `.env.development` - 开发环境配置
- `.env.test` - 测试环境配置
- `.env.production` - 生产环境配置

### 3. 构建项目

```bash
pnpm run build
```

### 4. 启动应用（多环境支持）

#### 开发环境

```bash
pnpm run pm2:start:dev
# 或
pnpm run pm2:start  # 默认使用 development 环境
```

#### 测试环境

```bash
pnpm run pm2:start:test
```

#### 生产环境

```bash
pnpm run pm2:start:prod
```

## 常用命令

### 查看应用状态

```bash
pnpm run pm2:status
# 或
pm2 status
```

### 查看日志

```bash
pnpm run pm2:logs
# 或
pm2 logs storeverserepo-serve
```

### 实时监控

```bash
pnpm run pm2:monit
# 或
pm2 monit
```

### 重启应用

#### 默认重启（保持当前环境）

```bash
pnpm run pm2:restart
# 或
pm2 restart storeverserepo-serve
```

#### 按环境重启（更新环境变量）

```bash
# 开发环境
pnpm run pm2:restart:dev

# 测试环境
pnpm run pm2:restart:test

# 生产环境
pnpm run pm2:restart:prod
```

### 停止应用

```bash
pnpm run pm2:stop
# 或
pm2 stop storeverserepo-serve
```

### 删除应用

```bash
pnpm run pm2:delete
# 或
pm2 delete storeverserepo-serve
```

### 一键部署（构建 + 重启）

#### 默认部署（保持当前环境）

```bash
pnpm run deploy
```

#### 按环境部署

```bash
# 开发环境部署
pnpm run deploy:dev

# 测试环境部署
pnpm run deploy:test

# 生产环境部署
pnpm run deploy:prod
```

### 保存 PM2 进程列表

```bash
pnpm run pm2:save
# 或
pm2 save
```

### 设置开机自启动

```bash
# 生成启动脚本（会输出需要执行的命令）
pnpm run pm2:startup
# 然后按照输出的提示执行命令，最后运行：
pnpm run pm2:save
```

### 取消开机自启动

```bash
pnpm run pm2:unstartup
# 或
pm2 unstartup
```

## 多环境配置说明

### 支持的环境

项目支持三种环境：

- **development** - 开发环境（默认端口：3000）
- **test** - 测试环境（默认端口：3001）
- **production** - 生产环境（默认端口：3000，集群模式）

### 环境变量配置方式

#### 方式一：在 ecosystem.config.js 中配置（推荐）

PM2 配置文件 `ecosystem.config.js` 中已为每个环境配置了默认变量：

- `env` - 开发环境配置
- `env_test` - 测试环境配置
- `env_production` - 生产环境配置

每个环境可以配置不同的：

- `NODE_ENV`: 环境类型
- `SERVICE_PORT`: 服务端口
- 其他自定义环境变量

#### 方式二：使用 .env 文件

1. 创建对应环境的 `.env` 文件：
   - `.env.development` - 开发环境
   - `.env.test` - 测试环境
   - `.env.production` - 生产环境

2. 在 `ecosystem.config.js` 中启用 `env_file` 选项（当前已注释）

3. NestJS 会自动根据 `NODE_ENV` 加载对应的 `.env` 文件

### 环境变量列表

项目需要以下环境变量（参考 `.env.example`）：

**应用配置**：

- `NODE_ENV` - 环境类型（development/test/production）
- `SERVICE_PORT` - 服务端口

**MySQL 数据库**：

- `NODE_MYSQL_HOST` - 数据库主机
- `MYSQL_PORT` - 数据库端口
- `MYSQL_USERNAME` - 数据库用户名
- `MYSQL_PASSWORD` - 数据库密码
- `MYSQL_DATABASE` - 数据库名称

**Redis**：

- `REDIS_HOST` - Redis 主机
- `REDIS_PORT` - Redis 端口
- `REDIS_PASSWORD` - Redis 密码（可选）
- `REDIS_DB` - Redis 数据库编号

**RabbitMQ**：

- `RABBITMQ_HOST` - RabbitMQ 主机
- `RABBITMQ_PORT` - RabbitMQ 端口
- `RABBITMQ_USERNAME` - RabbitMQ 用户名
- `RABBITMQ_PASSWORD` - RabbitMQ 密码

**JWT 认证**：

- `JWT_SECRET` - JWT 密钥（生产环境必须修改）
- `JWT_TTL_SECONDS` - JWT 过期时间（秒）

**WebSocket 日志服务器**：

- `LOG_SERVER_PORT` - 日志服务器端口

### 环境切换示例

```bash
# 当前运行在开发环境，切换到生产环境
pm2 stop storeverserepo-serve
pnpm run pm2:start:prod

# 或者直接重启并更新环境
pnpm run pm2:restart:prod
```

## 日志文件

日志文件保存在 `./logs/` 目录：

- `pm2-error.log`: 错误日志
- `pm2-out.log`: 输出日志

## 开机自启动设置

### macOS / Linux 设置步骤

#### 方法一：使用便捷命令（推荐）

```bash
# 1. 先启动应用（使用生产环境配置）
pnpm run pm2:start:prod

# 2. 生成启动脚本（会输出需要执行的命令）
pnpm run pm2:startup

# 3. 复制并执行上一步输出的命令（通常需要 sudo 权限）
# 例如：sudo env PATH=$PATH:/usr/local/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup launchd -u your_username --hp /Users/your_username

# 4. 保存当前 PM2 进程列表
pnpm run pm2:save
```

#### 方法二：手动执行命令

```bash
# 1. 生成启动脚本
pm2 startup

# 执行后会输出类似这样的命令（**需要复制并执行这个命令**）：
# sudo env PATH=$PATH:/usr/local/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup launchd -u your_username --hp /Users/your_username

# 2. 启动应用（如果还没启动）
pnpm run pm2:start:prod

# 3. 保存当前 PM2 进程列表
pm2 save
```

**重要提示**：

- `pm2 startup` 会输出一个需要以管理员权限执行的命令，你必须复制并执行它
- macOS 通常使用 `launchd`，Linux 使用 `systemd`
- `pm2 save` 会将当前运行的 PM2 进程列表保存，这样开机后会自动恢复这些进程

#### 3. 验证设置

重启电脑后，应用应该会自动启动。你也可以手动测试：

```bash
# 停止所有 PM2 进程
pm2 kill

# 重新加载保存的进程列表
pm2 resurrect
```

### 取消开机自启动

如果需要取消开机自启动：

```bash
# 使用便捷命令
pnpm run pm2:unstartup

# 或手动执行
pm2 unstartup

# 清除保存的进程列表（可选）
pm2 kill
pm2 save --force
```

### 更新自启动配置

如果修改了应用配置或添加了新应用：

```bash
# 1. 重启或启动应用
pnpm run pm2:restart
# 或
pnpm run pm2:start:prod

# 2. 保存新的配置
pnpm run pm2:save
# 或
pm2 save
```

### 注意事项

1. **权限问题**：设置开机自启动通常需要管理员权限（sudo）
2. **路径问题**：确保 PM2 的路径在系统 PATH 中，如果 `pm2 startup` 输出的路径不正确，需要手动调整
3. **用户权限**：确保启动脚本使用的用户有权限访问项目目录
4. **项目路径**：如果项目路径发生变化，需要重新设置
5. **Node.js 路径**：确保系统能找到 Node.js 和 pnpm，建议使用 nvm 或全局安装

### 常见问题

**Q: 开机后应用没有自动启动？**

- 检查 PM2 是否正常运行：`pm2 status`
- 查看 PM2 日志：`pm2 logs`
- 检查启动脚本是否正确安装：`pm2 startup` 会显示当前状态

**Q: 如何查看启动脚本？**

- macOS: `cat ~/Library/LaunchAgents/org.pm2.*.plist` 或检查 `/Library/LaunchDaemons/`
- Linux: `cat /etc/systemd/system/pm2-*.service`

**Q: 如何修改启动用户？**

```bash
# 先删除旧的启动脚本
pm2 unstartup

# 重新生成，指定用户
pm2 startup systemd -u your_username --hp /home/your_username
```

## 多环境部署最佳实践

### 1. 环境隔离

- 每个环境使用独立的数据库、Redis、RabbitMQ 实例
- 使用不同的端口避免冲突
- 生产环境使用强密码和密钥

### 2. 配置管理

- 敏感信息（密码、密钥）不要提交到版本控制
- 使用 `.env.example` 作为模板，团队成员复制后修改
- 生产环境配置通过安全的方式管理（如密钥管理服务）

### 3. 部署流程

```bash
# 1. 构建项目
pnpm run build

# 2. 停止旧进程（如果存在）
pnpm run pm2:stop

# 3. 启动新进程（指定环境）
pnpm run pm2:start:prod  # 或 pm2:start:dev, pm2:start:test

# 4. 检查状态
pnpm run pm2:status

# 5. 查看日志确认启动成功
pnpm run pm2:logs
```

### 4. 生产环境建议

- 使用 `pm2:start:prod` 启动（自动启用集群模式）
- 设置 `instances: 'max'` 充分利用多核 CPU
- 配置内存限制 `max_memory_restart`
- 设置开机自启动
- 定期备份数据库和配置文件

## 故障排除

### PM2 状态异常或进程找不到

如果遇到以下错误：

- `Process 0 not found`
- `Cannot read properties of undefined (reading 'pm2_env')`
- `EPERM: operation not permitted`

**解决方案**：

```bash
# 方法一：清理 PM2 状态并重新启动
pnpm run pm2:reset
pnpm run pm2:start:test  # 或其他环境

# 方法二：手动清理（如果方法一不行）
pm2 kill          # 杀掉所有 PM2 进程
pm2 flush          # 清空日志
rm -rf ~/.pm2      # 删除 PM2 配置目录（谨慎使用，会丢失所有配置）
pm2 start ecosystem.config.js --env test  # 重新启动

# 方法三：如果 PM2 守护进程卡死
# macOS/Linux: 查找并杀掉 PM2 守护进程
pkill -f pm2
# 然后重新启动
pnpm run pm2:start:test
```

### 端口被占用

```bash
# 检查端口占用情况
lsof -i :3000  # macOS
netstat -tulpn | grep 3000  # Linux

# 杀掉占用端口的进程
kill -9 <PID>
```

### 环境变量文件未找到

如果看到警告 `⚠️ 环境变量文件不存在`：

```bash
# 创建对应的环境变量文件
cp ENV_TEMPLATE.md .env.test  # 参考模板创建
# 然后编辑文件，填入正确的配置
```

### 进程启动失败

```bash
# 1. 检查构建文件是否存在
ls -la dist/main.js

# 2. 检查日志
pnpm run pm2:logs

# 3. 检查环境变量配置
cat .env.test  # 或对应环境的 .env 文件

# 4. 手动测试启动（不使用 PM2）
NODE_ENV=test node dist/main.js
```

## 注意事项

1. **构建要求**：确保 `dist` 目录存在且包含编译后的文件
2. **端口检查**：确保配置的端口未被占用
   - 开发环境：3000
   - 测试环境：3001
   - 生产环境：3000（可自定义）
3. **环境变量**：确保每个环境的环境变量都已正确配置
4. **日志管理**：日志文件会自动保存在 `logs` 目录，该目录已在 `.gitignore` 中忽略
5. **生产环境**：生产环境建议使用 `pm2:start:prod` 命令，会自动启用集群模式
6. **环境切换**：切换环境时建议先停止旧进程，再启动新环境，避免端口冲突
7. **PM2 状态**：如果 PM2 出现异常，使用 `pnpm run pm2:reset` 清理状态
