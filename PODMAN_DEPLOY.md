# Podman 多环境部署指南

## 概述

本项目提供基于 Podman 的一键部署脚本，支持 development、test、production 三种环境的自动化部署。

## 前置要求

- 安装 [Podman](https://podman.io/getting-started/installation)
- 确保对应环境的 `.env.{environment}` 文件已配置

## 快速开始

```bash
# 部署到 development 环境（默认）
./scripts/deploy.sh

# 部署到 production 环境
./scripts/deploy.sh production

# 部署到 test 环境
./scripts/deploy.sh test
```

## 环境配置

| 环境        | 端口 | 环境文件         |
| ----------- | ---- | ---------------- |
| development | 3000 | .env.development |
| test        | 3001 | .env.test        |
| production  | 9000 | .env.production  |

## 镜像命名规则

镜像标签格式：`{项目名}-{环境}-{时间戳}`

示例：`storeverserepo-serve-production-20241230143022`

## 容器命名规则

容器名格式：`{项目名}-{环境}`

示例：`storeverserepo-serve-production`

## 常用命令

```bash
# 查看容器日志
podman logs -f storeverserepo-serve-development

# 停止容器
podman stop storeverserepo-serve-development

# 重启容器
podman restart storeverserepo-serve-development

# 查看所有容器
podman ps -a

# 查看所有镜像
podman images
```

## 脚本功能

1. **环境参数验证** - 自动验证环境参数有效性
2. **镜像构建** - 使用多阶段构建优化镜像体积
3. **容器管理** - 自动停止旧容器，启动新容器
4. **历史清理** - 自动删除历史镜像，只保留最新版本
5. **状态反馈** - 彩色输出显示部署进度

## 常见问题

### Q: 端口被占用怎么办？

检查并停止占用端口的进程：

```bash
lsof -i :3000
kill -9 <PID>
```

### Q: 如何查看构建日志？

脚本执行时会实时显示构建日志，也可以手动构建查看：

```bash
podman build -t test-image .
```

### Q: 如何手动清理所有镜像？

```bash
# 清理所有未使用的镜像
podman image prune -a

# 清理特定环境的所有镜像
podman images | grep storeverserepo-serve-production | awk '{print $3}' | xargs podman rmi
```
