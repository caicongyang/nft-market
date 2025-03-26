# NFT Marketplace

A modern, full-featured NFT marketplace built with Next.js and Ethereum. This application allows users to buy, sell, and manage their NFT collections with a beautiful and intuitive interface.

## Technology Stack

### Frontend
- **Next.js 14** - React framework with server-side rendering and app router
- **React 18** - UI library with hooks and server components
- **TypeScript** - Static type checking
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Reusable UI components built with Radix UI and Tailwind
- **Lucide React** - Beautiful and consistent icon set

### Blockchain
- **ethers.js** - Ethereum library for interacting with the blockchain
- **MetaMask** - Wallet integration for Ethereum transactions

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── create/            # NFT creation page
│   ├── profile/           # User profile and owned NFTs
│   └── page.tsx           # Homepage/marketplace
├── components/            
│   ├── ui/                # Reusable UI components
│   ├── navbar.tsx         # Navigation component
│   ├── nft-card.tsx      # NFT display card
│   └── nft-grid.tsx      # Grid layout for NFTs
└── lib/                   # Utility functions
```

## Implemented Features

### Marketplace Interface
- ✅ Browse available NFTs in a grid layout
- ✅ NFT card display with image, name, description, and price
- ✅ Detailed NFT view page with comprehensive information
- ✅ Navigation between marketplace and profile pages
- ✅ Responsive design for all screen sizes

### NFT Management
- ✅ Personal NFT collection view
- ✅ NFT creation interface with form validation
- ✅ Basic wallet connection UI
- ✅ Buy/Sell button interfaces

### NFT Details Page
- ✅ Large image display
- ✅ Detailed NFT information
- ✅ Price history tabs
- ✅ Properties/attributes display
- ✅ Transaction history view

## Planned Features

### Smart Contract Integration
- 🔄 MetaMask wallet integration
- 🔄 NFT minting functionality
- 🔄 Buy/Sell transaction processing
- 🔄 Real-time price updates
- 🔄 Transaction confirmation handling

### User Features
- 🔄 User authentication
- 🔄 Profile customization
- 🔄 Favorite/Watch list
- 🔄 Bid placement system
- 🔄 Notification system

### Advanced Features
- 🔄 NFT Collections grouping
- 🔄 Advanced search and filters
- 🔄 Auction system
- 🔄 Royalties management
- 🔄 Bulk transfer/listing tools

### Analytics
- 🔄 Price history charts
- 🔄 Market trends
- 🔄 Collection statistics
- 🔄 Trading volume metrics

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create a `.env.local` file with:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
```

## Best Practices

- Server Components for improved performance
- TypeScript for type safety
- Client-side components only when necessary
- Proper error handling for blockchain transactions
- Loading states for better UX
- Responsive design for all screen sizes

Legend:
- ✅ Implemented
- 🔄 Planned/In Development

# NFT市场Web应用Docker部署说明 (Nginx优化版)

## 项目介绍

NFT市场Web应用是一个基于Next.js开发的去中心化NFT交易平台，支持NFT铸造、上架、购买等功能，并集成了CCYToken代币水龙头功能。

## 技术栈

- 前端: Next.js 14, React, TypeScript, Tailwind CSS
- 区块链交互: ethers.js
- 容器化: Docker, Docker Compose
- 服务器: Nginx (静态资源服务 + 反向代理)

## 性能优化方案

本应用采用了以下性能优化方案：

1. **Nginx静态资源服务**: 静态文件直接由Nginx提供，避免Next.js处理静态请求
2. **长期缓存策略**: 不变的静态资源设置30天缓存期，减少请求次数
3. **Gzip压缩**: 减少传输数据大小，加快页面加载速度
4. **HTTP/2支持**: 多路复用，提高并发请求效率
5. **Next.js standalone模式**: 减小应用体积，优化启动速度
6. **独立volumes**: 分离日志和缓存，便于维护

## 部署前准备

### 环境要求

- Docker 20.10.0或更高版本
- Docker Compose 1.29.0或更高版本
- 已部署的CCYToken和NFT合约

### 配置文件准备

1. 复制环境变量示例文件并进行配置:

```bash
cp .env.example .env
```

2. 编辑`.env`文件，填入以下必要参数:

```
# 公共变量（构建时和运行时都需要）
NEXT_PUBLIC_CCY_TOKEN_ADDRESS=0x你的CCYToken合约地址
NEXT_PUBLIC_RPC_URL=https://ethereum-holesky-rpc.publicnode.com

# 只在服务器端使用的变量（运行时需要）
CCY_TOKEN_ADMIN_PRIVATE_KEY=你的合约拥有者私钥（不含0x前缀）
```

## 部署方式

### 自动部署（推荐）

使用提供的部署脚本进行一键部署:

```bash
chmod +x deploy.sh
./deploy.sh
```

脚本会自动检查环境变量，构建Docker镜像并启动容器。

### 手动部署

如果您需要手动部署，请按以下步骤操作:

1. 构建Docker镜像:

```bash
docker-compose build --no-cache
```

2. 启动容器:

```bash
docker-compose up -d
```

3. 验证部署:

```bash
docker ps
# 检查nft-market-web容器是否正常运行
```

## 验证部署

部署完成后，可通过浏览器访问 http://localhost 验证应用是否正常运行。

## 架构说明

本部署方案使用双进程方式运行应用：

1. **Next.js Node服务器**: 处理API请求和服务端渲染
2. **Nginx服务器**: 处理静态资源和作为反向代理

客户端请求流程:
```
客户端请求 → Nginx (80端口) → 
  ├── 静态资源 → 直接由Nginx处理并返回
  └── 动态内容 → 代理到Next.js (3000端口) → 生成内容 → 返回给Nginx → 返回给客户端
```

## 常见问题

### 1. 水龙头功能不可用

- 检查CCY_TOKEN_ADMIN_PRIVATE_KEY是否正确设置
- 确认私钥对应的账户是CCYToken合约的拥有者
- 检查RPC节点连接是否正常

### 2. 容器无法启动

检查容器日志:

```bash
docker logs nft-market-web
```

### 3. 环境变量未正确加载

确保在docker-compose.yml所在目录中存在.env文件，且包含所有必需的环境变量。

### 4. Nginx性能调优

如需进一步优化Nginx性能，可在`nginx/nginx.conf`中调整以下参数：

- `worker_processes`: 调整为服务器CPU核心数
- `worker_connections`: 根据服务器内存情况调整
- `client_max_body_size`: 根据上传需求调整
- 缓存时间: 根据更新频率调整静态资源缓存时间

## 维护与更新

### 停止应用

```bash
docker-compose down
```

### 查看日志

```bash
# 查看容器日志
docker logs -f nft-market-web

# 查看Nginx访问日志
docker exec nft-market-web cat /var/log/nginx/access.log

# 查看Nginx错误日志  
docker exec nft-market-web cat /var/log/nginx/error.log
```

### 更新应用

1. 拉取最新代码
2. 重新运行部署脚本或手动执行构建和启动命令

## 安全注意事项

- 不要在公共环境暴露您的私钥
- 定期更新Docker镜像以获取安全补丁
- 在生产环境中使用HTTPS协议
- 考虑添加Web应用防火墙(WAF)保护