# NFT 市场智能合约

该目录包含 NFT 市场的智能合约代码，使用 Foundry 开发框架构建。

## 项目结构

server/ccy/
├── lib/                    # 外部依赖库
│   └── openzeppelin-contracts/ # OpenZeppelin 合约
├── src/                    # 合约源代码
│   ├── CCYToken.sol        # ERC20 代币合约
│   ├── CCYNFT.sol          # ERC721 NFT 合约
│   └── NFTMarket.sol       # NFT 市场合约
├── script/                 # 部署脚本
│   └── DeployContracts.s.sol # 部署所有合约的脚本
├── test/                   # 测试文件
│   └── NFTMarketTest.t.sol # 市场合约测试
├── .env                    # 环境变量（私有，不提交到Git）
├── .env_template           # 环境变量模板
└── foundry.toml            # Foundry 配置

## 环境设置

1. 安装 Foundry

curl -L https://foundry.paradigm.xyz | bash
foundryup

2. 安装依赖

cd server/ccy
forge install

3. 设置环境变量

复制 `.env_template` 到 `.env` 并填写您的私钥和 RPC URL：

cp .env_template .env

编辑 `.env` 文件，填入以下信息：

PRIVATE_KEY=您的以太坊私钥（不带0x前缀）
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/您的API密钥
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/您的API密钥
ETHERSCAN_API_KEY=您的Etherscan API密钥

您可以从以下服务获取 RPC URL：
- Alchemy: https://www.alchemy.com/
- Infura: https://www.infura.io/
- QuickNode: https://www.quicknode.com/

## 编译合约

cd server/ccy
forge build

## 运行测试

forge test

如需详细输出：

forge test -vvv

## 部署合约

### 部署到测试网（推荐先测试）

确保已加载环境变量：

source .env

使用部署脚本部署到 Sepolia 测试网：

forge script script/DeployContracts.s.sol:DeployScript --rpc-url sepolia --broadcast -vvvv


使用部署脚本部署到 holesky 测试网：
forge script script/DeployContracts.s.sol:DeployScript --rpc-url holesky --broadcast -vvvv


### 部署到主网（谨慎操作）

forge script script/DeployContracts.s.sol:DeployScript --rpc-url mainnet --broadcast -vvvv

### 验证合约

添加 --verify 标志自动在 Etherscan 上验证合约：

forge script script/DeployContracts.s.sol:DeployScript --rpc-url holesky --broadcast --verify -vvvv

## 合约说明

### CCYToken.sol

ERC20 标准代币合约，用于在 NFT 市场中支付 NFT。

构造函数参数：
- name: 代币名称
- symbol: 代币符号
- initialSupply: 初始供应量

### CCYNFT.sol

ERC721 标准 NFT 合约，用于铸造和管理 NFT。

构造函数参数：
- name: NFT 系列名称
- symbol: NFT 符号

主要功能：
- mintNFT(address recipient, string memory tokenURI): 铸造新的 NFT

### NFTMarket.sol

NFT 市场合约，允许用户上架、购买和下架 NFT。

主要功能：
- listNFT: 上架 NFT 销售
- buyNFT: 购买上架的 NFT
- delistNFT: 下架 NFT
- cancelListing: 取消 NFT 上架（向后兼容）
- withdrawFees: 提取平台收取的手续费

## 部署后步骤

部署完成后，控制台将输出所有合约地址。请将这些地址保存在安全的地方，并更新前端代码中的合约地址。

在 web 项目的 .env.local 文件中添加：

NEXT_PUBLIC_NFT_MARKET_ADDRESS=已部署的市场合约地址
NEXT_PUBLIC_CCY_TOKEN_ADDRESS=已部署的代币合约地址
NEXT_PUBLIC_CCY_NFT_ADDRESS=已部署的NFT合约地址

## 常见问题

1. 错误：无法估算gas
   - 确保 RPC URL 正确
   - 检查账户余额是否足够支付gas费用

2. 合约验证失败
   - 确保 Etherscan API 密钥正确
   - 检查合约源代码是否包含外部导入

3. ReentrancyGuard 错误
   - 这是一个安全机制，防止重入攻击
   - 在开发中，确保不在同一个测试中连续调用使用 nonReentrant 修饰符的函数

## 安全注意事项

- 永远不要在公共代码库中提交您的私钥或 API 密钥
- 总是将 .env 文件添加到 .gitignore 中
- 在部署到主网前，建议进行专业的安全审计 