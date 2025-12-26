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

### 2. 构建项目
```bash
pnpm run build
```

### 3. 启动应用（开发环境）
```bash
pnpm run pm2:start
```

### 4. 启动应用（生产环境）
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
```bash
pnpm run pm2:restart
# 或
pm2 restart storeverserepo-serve
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
```bash
pnpm run deploy
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

## 环境变量配置

PM2 配置文件 `ecosystem.config.js` 中已配置了默认环境变量：

- `NODE_ENV`: 环境类型（development/production）
- `SERVICE_PORT`: 服务端口（默认 3000）

如需修改，可以：
1. 直接编辑 `ecosystem.config.js` 文件
2. 或创建 `.env` 文件，并在配置文件中使用 `env_file` 选项

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

## 注意事项

1. 确保 `dist` 目录存在且包含编译后的文件
2. 确保端口 3000（或配置的其他端口）未被占用
3. 生产环境建议使用 `pm2:start:prod` 命令
4. 日志文件会自动保存在 `logs` 目录，该目录已在 `.gitignore` 中忽略

