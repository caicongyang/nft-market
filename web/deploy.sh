#!/bin/bash

# NFT市场Web应用部署脚本 - Nginx优化版

# 显示彩色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 输出标题
echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}  NFT市场Web应用部署脚本(Nginx优化版)${NC}"
echo -e "${BLUE}====================================${NC}"

# 检查.env文件是否存在
if [ ! -f .env ]; then
  echo -e "${YELLOW}未发现.env文件，将从.env.example创建${NC}"
  
  if [ -f .env.example ]; then
    cp .env.example .env
    echo -e "${GREEN}已创建.env文件，请编辑此文件设置正确的环境变量${NC}"
    echo -e "${YELLOW}按任意键继续...${NC}"
    read -n 1
  else
    echo -e "${RED}错误：找不到.env.example文件${NC}"
    exit 1
  fi
fi

# 确认环境变量
echo -e "${YELLOW}请确认您的环境变量已正确设置：${NC}"
echo -e "1. NEXT_PUBLIC_CCY_TOKEN_ADDRESS：您的CCYToken合约地址"
echo -e "2. NEXT_PUBLIC_RPC_URL：区块链RPC节点URL"
echo -e "3. CCY_TOKEN_ADMIN_PRIVATE_KEY：您的合约拥有者私钥"
echo -e "${YELLOW}这些值将从.env文件加载，敏感信息不会显示在控制台${NC}"
echo -e "${YELLOW}确认继续部署？ (y/n) ${NC}"

read -r confirmation
if [[ ! "$confirmation" =~ ^[Yy]$ ]]; then
  echo -e "${RED}部署已取消${NC}"
  exit 0
fi

# 停止并移除旧容器
echo -e "${BLUE}停止并移除旧容器...${NC}"
docker compose down -v 2>/dev/null || true

# 构建新镜像
echo -e "${BLUE}构建Docker镜像...${NC}"
docker compose build --no-cache

# 启动容器
echo -e "${BLUE}启动容器...${NC}"
docker compose up -d

# 检查容器状态
echo -e "${BLUE}检查容器状态...${NC}"
sleep 5
containerName="nft-market-web"
containerStatus=$(docker ps --filter "name=$containerName" --format "{{.Status}}")

if [[ $containerStatus == *"Up"* ]]; then
  echo -e "${GREEN}部署成功！NFT市场Web应用现在运行在http://localhost${NC}"
  echo -e "${GREEN}容器状态: $containerStatus${NC}"
  echo -e ""
  echo -e "${BLUE}性能优化说明：${NC}"
  echo -e "1. 静态资源现在由Nginx直接服务，并启用了30天缓存"
  echo -e "2. 启用了Gzip压缩，减少传输大小"
  echo -e "3. Next.js应用采用standalone模式，减少了依赖大小"
  echo -e "4. 数据API请求通过Nginx代理，提高稳定性"
else
  echo -e "${RED}部署可能失败，请检查容器日志:${NC}"
  echo -e "${YELLOW}docker logs $containerName${NC}"
fi

echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}           部署完成                ${NC}"
echo -e "${BLUE}====================================${NC}" 