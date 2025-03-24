# NFT 市场

这是一个现代化的、功能完备的 NFT 市场应用，使用 Next.js 和以太坊构建。该应用允许用户通过直观美观的界面购买、出售和管理他们的 NFT 收藏品。

## 项目架构

项目分为两个主要部分：

### Web 前端

使用 Next.js 14 构建的用户界面，提供 NFT 浏览、购买、出售和管理功能。

### Server 后端

使用 Foundry 构建的智能合约部分，负责 NFT 的铸造、交易和所有权管理。

## 技术栈

### 前端 (Web)

- **Next.js 14** - 支持服务器端渲染和应用路由器的 React 框架
- **React 18** - 带有钩子和服务器组件的 UI 库
- **TypeScript** - 静态类型检查
- **Tailwind CSS** - 实用优先的 CSS 框架
- **shadcn/ui** - 基于 Radix UI 和 Tailwind 构建的可重用 UI 组件
- **Lucide React** - 美观一致的图标集
- **ethers.js** - 与区块链交互的以太坊库
- **MetaMask** - 以太坊交易的钱包集成

### 后端 (Server)

- **Foundry** - 以太坊应用开发工具包，包含：
  - **Forge** - 智能合约测试框架
  - **Anvil** - 本地以太坊开发环境
  - **Cast** - 与以太坊交互的命令行工具

## 项目结构

项目根目录/
├── web/                     # 前端 Next.js 应用
│   ├── src/
│   │   ├── app/             # Next.js 应用路由页面
│   │   │   ├── list/        # NFT 上架页面
│   │   │   │   └── page.tsx # NFT 上架表单
│   │   │   ├── profile/     # 用户资料和拥有的 NFT
│   │   │   │   └── page.tsx # 个人主页
│   │   │   ├── layout.tsx   # 根布局
│   │   │   └── page.tsx     # 首页/市场
│   │   ├── components/      # 组件
│   │   │   ├── ui/          # 可重用 UI 组件
│   │   │   │   ├── button.tsx   # 按钮组件
│   │   │   │   ├── card.tsx     # 卡片组件
│   │   │   │   ├── input.tsx    # 输入框组件
│   │   │   │   ├── label.tsx    # 标签组件
│   │   │   │   ├── tabs.tsx     # 标签页组件
│   │   │   │   ├── toast.tsx    # 提示组件
│   │   │   │   ├── toaster.tsx  # 提示容器组件
│   │   │   │   └── use-toast.ts # 提示钩子
│   │   │   ├── navbar.tsx   # 导航组件
│   │   │   ├── nft-card.tsx # NFT 显示卡片
│   │   │   └── nft-marketplace.tsx # 主市场组件
│   │   ├── lib/             # 实用函数
│   │   │   ├── abis/        # 合约 ABI
│   │   │   │   ├── CCYToken.json # ERC20 代币 ABI
│   │   │   │   ├── CCYNFT.json   # ERC721 NFT ABI
│   │   │   │   └── NFTMarket.json # NFT 市场 ABI
│   │   │   └── utils.ts     # 辅助函数
│   │   ├── styles/          # 全局样式
│   │   │   └── globals.css  # Tailwind CSS 设置
│   │   └── types/           # TypeScript 类型定义
│   │       └── globals.d.ts # 全局类型声明
│   ├── public/              # 静态资源
│   ├── package.json         # 项目依赖
│   ├── next.config.js       # Next.js 配置
│   ├── tsconfig.json        # TypeScript 配置
│   └── tailwind.config.js   # Tailwind CSS 配置
│
└── server/                  # 后端智能合约
    └── ccy/                 # 智能合约目录
        ├── lib/             # 合约依赖库
        │   └── forge-std/   # Forge 标准库
        └── src/             # 合约源码

## 已实现功能

### 市场界面
- ✅ 网格布局浏览可用的 NFT
- ✅ NFT 卡片显示图片、名称、描述和价格
- ✅ 详细的 NFT 查看页面
- ✅ 市场和个人资料页面之间的导航
- ✅ 适应所有屏幕尺寸的响应式设计
- ✅ MetaMask 钱包集成
- ✅ NFT 上架和下架功能
- ✅ 使用 ERC20 代币购买 NFT

### NFT 管理
- ✅ 个人 NFT 收藏视图
- ✅ 带表单验证的 NFT 创建界面
- ✅ 基本钱包连接 UI
- ✅ 买/卖按钮界面

### NFT 详情页
- ✅ 大图显示
- ✅ 详细的 NFT 信息
- ✅ 价格历史标签页
- ✅ 属性/特性显示
- ✅ 交易历史视图

## 计划功能

### 智能合约集成
- ✅ MetaMask 钱包集成
- ✅ NFT 铸造功能
- ✅ 买/卖交易处理
- 🔄 实时价格更新
- ✅ 交易确认处理

### 用户功能
- �� 用户认证
- 🔄 个人资料定制
- 🔄 收藏夹/关注列表
- 🔄 出价系统
- ✅ 交易通知系统

### 高级功能
- 🔄 NFT 收藏分组
- 🔄 高级搜索和过滤
- 🔄 拍卖系统
- 🔄 版税管理
- 🔄 批量转移/上架工具

### 分析功能
- 🔄 价格历史图表
- 🔄 市场趋势
- 🔄 收藏品统计
- 🔄 交易量指标

## 开发设置

### 前端设置

1. 安装依赖：
   cd web
   npm install

2. 设置环境变量：
   在 web 目录下创建 `.env.local` 文件：
   ```
   NEXT_PUBLIC_NFT_MARKET_ADDRESS=你的_nft_市场合约地址
   NEXT_PUBLIC_CCY_TOKEN_ADDRESS=你的_ccy_代币合约地址
   NEXT_PUBLIC_CCY_NFT_ADDRESS=你的_ccy_nft合约地址
   ```

3. 启动开发服务器：
   npm run dev

4. 打开 http://localhost:3000

### 后端设置

1. 安装 Foundry（如果尚未安装）：
   curl -L https://foundry.paradigm.xyz | bash
   foundryup

2. 构建和测试合约：
   cd server/ccy
   forge build
   forge test

## 环境变量

在 `web` 目录下创建一个 `.env.local` 文件：
NEXT_PUBLIC_NFT_MARKET_ADDRESS=你的_nft_市场合约地址
NEXT_PUBLIC_CCY_TOKEN_ADDRESS=你的_ccy_代币合约地址
NEXT_PUBLIC_CCY_NFT_ADDRESS=你的_ccy_nft合约地址

## 最佳实践

- 使用服务器组件提高性能
- 使用 TypeScript 确保类型安全
- 仅在必要时使用客户端组件
- 为区块链交易提供适当的错误处理
- 加载状态提升用户体验
- 适应所有屏幕尺寸的响应式设计

## 智能合约开发

### 合约结构

项目包含三个主要合约：

1. **CCYToken.sol** - ERC20 代币合约
   - 实现了标准 ERC20 接口
   - 支持铸造新代币（仅限所有者）
   - 用于 NFT 交易的支付

2. **CCYNFT.sol** - ERC721 NFT 合约
   - 实现了 ERC721 标准
   - 支持 NFT 的铸造
   - 支持设置 NFT 的元数据 URI

3. **NFTMarket.sol** - NFT 市场合约
   - 支持上架 NFT（指定 NFT 合约、Token ID 和价格）
   - 支持使用 ERC20 代币购买 NFT
   - 支持取消 NFT 上架
   - 包含平台手续费机制（默认 0.5%）
   - 支持平台提取手续费

### 关键功能

1. **上架 NFT**
   - NFT 所有者可以将其上架到市场
   - 上架时需指定 NFT 合约地址、Token ID 和价格
   - 上架会触发 `NFTListed` 事件

2. **购买 NFT**
   - 用户可以使用 ERC20 代币购买上架的 NFT
   - 购买成功后，NFT 转移给买家
   - 卖家收到代币（扣除平台手续费）
   - 市场合约收取手续费
   - 购买会触发 `NFTPurchased` 事件

3. **取消上架**
   - NFT 卖家可以取消已上架的 NFT
   - 取消会触发 `NFTListingCancelled` 事件

### 合约部署

使用 Forge 部署合约：

```bash
cd server/ccy
forge script script/DeployContracts.s.sol:DeployScript --rpc-url <您的RPC_URL> --broadcast --verify
```

### 合约测试

运行所有测试：

```bash
forge test
```

生成测试覆盖率报告：

```bash
forge coverage
```

### 环境变量

在 `server/ccy` 目录下创建 `.env` 文件：

## 持续集成/持续部署

项目使用 GitHub Actions 进行 CI/CD：
- 前端部署到 Vercel
- 智能合约自动测试和验证

## 贡献指南

1. Fork 该项目
2. 创建您的功能分支 (git checkout -b feature/amazing-feature)
3. 提交您的更改 (git commit -m 'Add some amazing feature')
4. 推送到分支 (git push origin feature/amazing-feature)
5. 打开一个 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 LICENSE 文件了解详情

图例：
- ✅ 已实现
- 🔄 计划/开发中
