# Requirements Document

## Introduction

本规范定义了一个基于 Podman 的多环境一键部署脚本，用于 NestJS 项目 `storeverserepo-serve` 的容器化部署。脚本需要支持构建镜像、启动容器、清理历史镜像等功能，实现从打包到部署启动的一键完成。

## Glossary

- **Deploy_Script**: 部署脚本，负责执行构建、部署、清理等操作的 Shell 脚本
- **Podman**: 容器运行时工具，用于构建和运行容器
- **Image**: 容器镜像，包含应用程序及其依赖的打包文件
- **Container**: 容器实例，从镜像启动的运行时环境
- **Environment**: 部署环境，包括 development、test、production
- **Image_Tag**: 镜像标签，格式为 `{项目名}-{环境}-{时间戳}`

## Requirements

### Requirement 1: 环境参数支持

**User Story:** 作为开发者，我希望通过命令行参数指定部署环境，以便在不同环境中部署应用。

#### Acceptance Criteria

1. WHEN 用户执行脚本时提供环境参数 THEN Deploy_Script SHALL 使用指定的环境配置进行部署
2. WHEN 用户未提供环境参数 THEN Deploy_Script SHALL 默认使用 development 环境
3. THE Deploy_Script SHALL 支持 development、test、production 三种环境
4. IF 用户提供无效的环境参数 THEN Deploy_Script SHALL 显示错误信息并退出

### Requirement 2: 镜像构建

**User Story:** 作为开发者，我希望脚本能自动构建 Docker 镜像，以便将应用打包为容器镜像。

#### Acceptance Criteria

1. WHEN 执行部署脚本 THEN Deploy_Script SHALL 使用 Podman 构建容器镜像
2. THE Deploy_Script SHALL 使用格式 `{项目名}-{环境}-{时间戳}` 作为镜像标签
3. WHEN 构建镜像时 THEN Deploy_Script SHALL 将对应环境的 .env 文件复制到镜像中
4. IF 镜像构建失败 THEN Deploy_Script SHALL 显示错误信息并退出

### Requirement 3: 容器部署

**User Story:** 作为开发者，我希望脚本能自动停止旧容器并启动新容器，以便实现无缝更新。

#### Acceptance Criteria

1. WHEN 部署新版本时 THEN Deploy_Script SHALL 先停止并删除同环境的旧容器
2. WHEN 启动新容器时 THEN Deploy_Script SHALL 使用最新构建的镜像
3. THE Deploy_Script SHALL 根据环境配置映射正确的端口
4. WHEN 容器启动成功 THEN Deploy_Script SHALL 显示容器运行状态

### Requirement 4: 历史镜像清理

**User Story:** 作为开发者，我希望脚本能自动清理历史镜像，以便节省磁盘空间。

#### Acceptance Criteria

1. WHEN 部署完成后 THEN Deploy_Script SHALL 删除同环境的历史镜像
2. THE Deploy_Script SHALL 保留最新的镜像，只删除旧版本
3. WHEN 清理镜像时 THEN Deploy_Script SHALL 显示被删除的镜像信息

### Requirement 5: Dockerfile 创建

**User Story:** 作为开发者，我希望有一个优化的 Dockerfile，以便高效构建 NestJS 应用镜像。

#### Acceptance Criteria

1. THE Dockerfile SHALL 使用多阶段构建以减小最终镜像体积
2. THE Dockerfile SHALL 正确安装项目依赖并构建应用
3. THE Dockerfile SHALL 配置正确的启动命令运行 NestJS 应用
4. THE Dockerfile SHALL 支持通过环境变量配置应用

### Requirement 6: 部署状态反馈

**User Story:** 作为开发者，我希望脚本能提供清晰的部署状态反馈，以便了解部署进度和结果。

#### Acceptance Criteria

1. WHEN 执行每个部署步骤时 THEN Deploy_Script SHALL 显示当前步骤信息
2. WHEN 部署成功完成 THEN Deploy_Script SHALL 显示成功信息和访问地址
3. IF 任何步骤失败 THEN Deploy_Script SHALL 显示具体的错误信息
4. THE Deploy_Script SHALL 使用彩色输出区分不同类型的信息
