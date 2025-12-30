#!/usr/bin/env bash

# ============================================
# Podman 多环境一键部署脚本
# 项目: storeverserepo-serve
# ============================================

set -e

# ============================================
# 配置变量
# ============================================
PROJECT_NAME="storeverserepo-serve"
VALID_ENVS="development test production"
DEFAULT_ENV="development"

# 从环境变量文件读取端口
get_port() {
    local env_file=".env.${1}"
    if [ -f "$env_file" ]; then
        local port=$(grep "^SERVICE_PORT=" "$env_file" | cut -d'=' -f2 | tr -d ' \r\n')
        if [ -n "$port" ]; then
            echo "$port"
            return
        fi
    fi
    # 默认端口
    echo 3000
}

# ============================================
# 彩色输出函数
# ============================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "\n${BLUE}==>${NC} $1"
}

# ============================================
# 参数解析和验证函数
# ============================================

# 显示使用帮助
show_usage() {
    echo "Usage: $0 [environment]"
    echo ""
    echo "Environments:"
    echo "  development  - 开发环境 (端口: 3000) [默认]"
    echo "  test         - 测试环境 (端口: 3001)"
    echo "  production   - 生产环境 (端口: 9000)"
    echo ""
    echo "Examples:"
    echo "  $0              # 部署到 development 环境"
    echo "  $0 production   # 部署到 production 环境"
}

# 验证环境参数
validate_env() {
    local env=$1
    for valid_env in $VALID_ENVS; do
        if [ "$env" = "$valid_env" ]; then
            return 0
        fi
    done
    return 1
}

# 解析命令行参数
parse_args() {
    if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
        show_usage
        exit 0
    fi

    # 设置环境，默认为 development
    ENV="${1:-$DEFAULT_ENV}"

    # 验证环境参数
    if ! validate_env "$ENV"; then
        print_error "无效的环境参数: $ENV"
        echo ""
        echo "有效的环境: $VALID_ENVS"
        exit 1
    fi

    # 设置端口
    PORT=$(get_port "$ENV")
}

# ============================================
# 镜像标签生成函数
# ============================================

# 生成镜像标签: {项目名}-{环境}-{时间戳}
generate_tag() {
    local timestamp=$(date +%Y%m%d%H%M%S)
    IMAGE_TAG="${PROJECT_NAME}-${ENV}-${timestamp}"
    CONTAINER_NAME="${PROJECT_NAME}-${ENV}"
    print_info "镜像标签: $IMAGE_TAG"
    print_info "容器名称: $CONTAINER_NAME"
}

# ============================================
# 镜像构建函数
# ============================================

# 检查 Podman 是否安装
check_podman() {
    if ! command -v podman &> /dev/null; then
        print_error "Podman 未安装，请先安装 Podman"
        echo "安装指南: https://podman.io/getting-started/installation"
        exit 1
    fi
    print_info "Podman 版本: $(podman --version)"
}

# 复制环境文件
copy_env_file() {
    local env_file=".env.${ENV}"

    if [ ! -f "$env_file" ]; then
        print_warning "环境文件 $env_file 不存在，将使用默认配置"
        return
    fi

    # 复制环境文件到 .env（供 Dockerfile 使用）
    cp "$env_file" .env
    print_info "已复制 $env_file 到 .env"
}

# 构建镜像
build_image() {
    print_step "构建 Docker 镜像..."

    # 复制环境文件
    copy_env_file

    # 构建镜像
    if ! podman build -t "$IMAGE_TAG" .; then
        print_error "镜像构建失败"
        exit 1
    fi

    print_success "镜像构建成功: $IMAGE_TAG"
}

# ============================================
# 容器管理函数
# ============================================

# 停止旧容器
stop_container() {
    print_step "停止旧容器..."

    if podman ps -a --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
        podman stop "$CONTAINER_NAME" 2>/dev/null || true
        print_info "已停止容器: $CONTAINER_NAME"
    else
        print_info "没有找到运行中的容器: $CONTAINER_NAME"
    fi
}

# 删除旧容器
remove_container() {
    print_step "删除旧容器..."

    if podman ps -a --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
        podman rm "$CONTAINER_NAME" 2>/dev/null || true
        print_info "已删除容器: $CONTAINER_NAME"
    else
        print_info "没有需要删除的容器"
    fi
}

# 检查端口是否被占用
check_port() {
    if lsof -i ":${PORT}" &>/dev/null; then
        print_warning "端口 ${PORT} 已被占用，尝试释放..."

        # 获取占用端口的进程信息
        local pid=$(lsof -t -i ":${PORT}" 2>/dev/null | head -1)
        if [ -n "$pid" ]; then
            local process_name=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
            print_info "占用进程: PID=$pid, 名称=$process_name"

            # 询问是否终止进程
            echo -n "是否终止该进程? [y/N]: "
            read -r answer
            if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
                kill -9 "$pid" 2>/dev/null || true
                sleep 1
                print_success "已终止进程 $pid"
            else
                print_error "端口 ${PORT} 被占用，无法启动容器"
                print_info "请手动释放端口: kill -9 $pid"
                exit 1
            fi
        fi
    fi
}

# 启动新容器
start_container() {
    print_step "启动新容器..."

    # 检查端口占用
    check_port

    # 获取环境文件路径
    local env_file=".env.${ENV}"
    local env_option=""

    if [ -f "$env_file" ]; then
        env_option="--env-file=$env_file"
    fi

    # 启动容器
    if ! podman run -d \
        --name "$CONTAINER_NAME" \
        -p "${PORT}:${PORT}" \
        $env_option \
        --restart=unless-stopped \
        "$IMAGE_TAG"; then
        print_error "容器启动失败"
        exit 1
    fi

    print_success "容器启动成功: $CONTAINER_NAME"

    # 显示容器状态
    print_info "容器状态:"
    podman ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# ============================================
# 历史镜像清理函数
# ============================================

# 清理历史镜像
cleanup_images() {
    print_step "清理历史镜像..."

    # 获取同环境的所有镜像（排除当前镜像）
    local image_prefix="${PROJECT_NAME}-${ENV}-"
    local old_images=$(podman images --format "{{.Repository}}:{{.Tag}}" | grep "^${image_prefix}" | grep -v "^${IMAGE_TAG}$" || true)

    if [ -z "$old_images" ]; then
        print_info "没有需要清理的历史镜像"
        return
    fi

    print_info "发现以下历史镜像:"
    echo "$old_images"

    # 删除历史镜像
    for image in $old_images; do
        if podman rmi "$image" 2>/dev/null; then
            print_info "已删除镜像: $image"
        else
            print_warning "无法删除镜像: $image (可能正在使用中)"
        fi
    done

    print_success "历史镜像清理完成"
}

# ============================================
# 主流程
# ============================================

main() {
    echo ""
    echo "============================================"
    echo "  Podman 多环境一键部署脚本"
    echo "  项目: $PROJECT_NAME"
    echo "============================================"
    echo ""

    # 解析参数
    parse_args "$@"

    print_info "部署环境: $ENV"
    print_info "服务端口: $PORT"

    # 检查 Podman
    check_podman

    # 生成镜像标签
    generate_tag

    # 构建镜像
    build_image

    # 停止并删除旧容器
    stop_container
    remove_container

    # 启动新容器
    start_container

    # 清理历史镜像
    cleanup_images

    # 显示部署结果
    echo ""
    echo "============================================"
    print_success "部署完成!"
    echo "============================================"
    echo ""
    print_info "环境: $ENV"
    print_info "镜像: $IMAGE_TAG"
    print_info "容器: $CONTAINER_NAME"
    print_info "访问地址: http://localhost:${PORT}"
    echo ""

    # 显示容器日志提示
    print_info "查看日志: podman logs -f $CONTAINER_NAME"
    print_info "停止容器: podman stop $CONTAINER_NAME"
    print_info "重启容器: podman restart $CONTAINER_NAME"
    echo ""
}

# 执行主流程
main "$@"
