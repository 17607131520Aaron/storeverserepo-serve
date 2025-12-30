# Implementation Plan: Podman 多环境部署脚本

## Overview

实现基于 Podman 的多环境一键部署方案，包含 Dockerfile 和部署脚本，支持构建、部署、清理的自动化流程。

## Tasks

- [x] 1. 创建 Dockerfile
  - [x] 1.1 创建多阶段构建的 Dockerfile
    - 使用 node:24-alpine 作为基础镜像
    - 第一阶段安装依赖并构建应用
    - 第二阶段只复制必要文件
    - 配置正确的启动命令
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 2. 创建部署脚本
  - [x] 2.1 创建脚本基础结构和配置变量
    - 定义项目名、有效环境列表、端口映射
    - 定义彩色输出函数
    - _Requirements: 1.3, 6.4_

  - [x] 2.2 实现参数解析和验证函数
    - 解析命令行环境参数
    - 验证环境参数有效性
    - 设置默认环境为 development
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 2.3 实现镜像标签生成函数
    - 生成格式为 `{项目名}-{环境}-{时间戳}` 的标签
    - _Requirements: 2.2_

  - [x] 2.4 实现镜像构建函数
    - 调用 Podman 构建镜像
    - 复制对应环境的 .env 文件
    - 处理构建失败情况
    - _Requirements: 2.1, 2.3, 2.4_

  - [x] 2.5 实现容器管理函数
    - 停止同环境的旧容器
    - 删除旧容器
    - 启动新容器并映射端口
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 2.6 实现历史镜像清理函数
    - 查找同环境的历史镜像
    - 删除除最新外的所有镜像
    - 显示清理信息
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 2.7 实现主流程和状态输出
    - 串联所有步骤
    - 显示部署进度和结果
    - 显示访问地址
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 3. Checkpoint - 验证部署脚本
  - 确保脚本可执行
  - 测试 development 环境部署
  - 验证镜像和容器命名正确
  - 确认历史镜像被清理

- [x] 4. 创建使用文档
  - [x] 4.1 更新 README 或创建 PODMAN_DEPLOY.md
    - 添加脚本使用说明
    - 添加各环境部署示例
    - 添加常见问题解答
    - _Requirements: 6.2_

## Notes

- 脚本使用 Bash 编写，需要 Podman 已安装
- 端口映射：development:3000, test:3001, production:9000
- 镜像标签格式：`storeverserepo-serve-{env}-{timestamp}`
- 容器名格式：`storeverserepo-serve-{env}`
