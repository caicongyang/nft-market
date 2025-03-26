import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import CCYTokenABI from '@/lib/abis/CCYToken.json';

// 使用环境变量获取合约地址和私钥
const CCY_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_CCY_TOKEN_ADDRESS || '';
// 私钥需要保密，并只在服务器端使用
const ADMIN_PRIVATE_KEY = process.env.CCY_TOKEN_ADMIN_PRIVATE_KEY || '';
// RPC URL，连接到区块链网络
const PRIMARY_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-holesky.publicnode.com';
// 备选公共RPC列表
const BACKUP_RPC_URLS = [
  'https://ethereum-holesky.publicnode.com',
  'https://ethereum-holesky-sepolia.blockpi.network/v1/rpc/public',
  'https://holesky.drpc.org'
];

// 打印配置信息（不要在生产环境中这样做！）
console.log("API配置检查:");
console.log("CCY_TOKEN_ADDRESS配置:", CCY_TOKEN_ADDRESS ? "已设置" : "未设置");
console.log("ADMIN_PRIVATE_KEY配置:", ADMIN_PRIVATE_KEY ? "已设置" : "未设置");
console.log("PRIMARY_RPC_URL配置:", PRIMARY_RPC_URL);

// 请求限制映射
const requestLimits: { [key: string]: { timestamp: number, count: number } } = {};

// 清理函数，每24小时重置请求计数
setInterval(() => {
  const now = Date.now();
  // 删除超过24小时的记录
  Object.keys(requestLimits).forEach((address) => {
    if (now - requestLimits[address].timestamp > 24 * 60 * 60 * 1000) {
      delete requestLimits[address];
    }
  });
}, 60 * 60 * 1000); // 每小时检查一次

// 尝试使用多个RPC URL连接到网络
async function getWorkingProvider() {
  // 检查是否设置了私有RPC URL
  console.log("尝试连接到主要RPC:", PRIMARY_RPC_URL);
  
  // 尝试使用简单的http方法测试端点连接
  async function testEndpoint(url: string) {
    try {
      // 使用fetch发起简单的JSON-RPC请求检查连接
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_chainId',
          params: []
        })
      });
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      console.log(`${url} 响应:`, data);
      return data.result ? true : false;
    } catch (error) {
      console.error(`测试 ${url} 失败:`, error);
      return false;
    }
  }
  
  // 首先尝试主要RPC URL
  let isMainRpcReachable = await testEndpoint(PRIMARY_RPC_URL);
  if (isMainRpcReachable) {
    console.log("主要RPC可达，尝试创建provider");
    try {
      const provider = new ethers.providers.JsonRpcProvider({
        url: PRIMARY_RPC_URL,
        timeout: 30000
      });
      
      // 简化检查，只检查一个简单方法
      const chainId = await provider.send('eth_chainId', []);
      console.log("成功连接到主要RPC, chainId:", chainId);
      return provider;
    } catch (error: any) {
      console.warn("主要RPC连接失败:", error.message || error);
    }
  } else {
    console.warn("主要RPC无法访问，跳过");
  }
  
  // 尝试备选RPC URL
  for (const rpcUrl of BACKUP_RPC_URLS) {
    console.log("尝试连接到备选RPC:", rpcUrl);
    const isRpcReachable = await testEndpoint(rpcUrl);
    if (isRpcReachable) {
      try {
        const provider = new ethers.providers.JsonRpcProvider({
          url: rpcUrl,
          timeout: 30000
        });
        
        // 简化检查
        const chainId = await provider.send('eth_chainId', []);
        console.log("成功连接到备选RPC, chainId:", chainId);
        return provider;
      } catch (error: any) {
        console.warn(`备选RPC连接失败 ${rpcUrl}:`, error.message || error);
      }
    } else {
      console.warn(`备选RPC ${rpcUrl} 无法访问，跳过`);
    }
  }
  
  // 尝试使用公共ANKR RPC作为最后的备选
  const ankrRpc = "https://rpc.ankr.com/eth_holesky";
  console.log("尝试连接到ANKR公共RPC:", ankrRpc);
  try {
    const provider = new ethers.providers.JsonRpcProvider({
      url: ankrRpc,
      timeout: 30000
    });
    
    // 简化检查
    const chainId = await provider.send('eth_chainId', []);
    console.log("成功连接到ANKR RPC, chainId:", chainId);
    return provider;
  } catch (error: any) {
    console.warn("ANKR RPC连接失败:", error.message || error);
  }
  
  // 最后一个备选方案：返回一个无法工作但能提供更好错误信息的provider
  console.error("所有RPC尝试都失败");
  throw new Error("无法连接到任何RPC节点，请检查网络环境或更新RPC URL");
}

export async function POST(request: Request) {
  try {
    // 解析请求体
    const body = await request.json();
    const { address, amount } = body;
    
    console.log("收到水龙头请求:", { address, amount });
    
    // 验证输入
    if (!address || !amount) {
      console.log("验证失败: 地址或金额为空");
      return NextResponse.json({ error: '地址和金额不能为空' }, { status: 400 });
    }
    
    // 验证地址格式
    if (!ethers.utils.isAddress(address)) {
      return NextResponse.json({ error: '无效的以太坊地址' }, { status: 400 });
    }
    
    // 验证金额
    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0 || amountNumber > 100) {
      return NextResponse.json({ error: '金额必须在 1-100 之间' }, { status: 400 });
    }
    
    // 检查请求限制
    const now = Date.now();
    if (requestLimits[address]) {
      const { timestamp, count } = requestLimits[address];
      // 如果在24小时内已经请求超过限制
      if (now - timestamp < 24 * 60 * 60 * 1000 && count >= 3) {
        return NextResponse.json({ 
          error: '请求频率过高，每个地址每天最多请求3次',
          nextAvailable: new Date(timestamp + 24 * 60 * 60 * 1000).toISOString()
        }, { status: 429 });
      }
      
      // 更新请求计数
      if (now - timestamp < 24 * 60 * 60 * 1000) {
        requestLimits[address].count += 1;
      } else {
        // 如果超过24小时，重置计数
        requestLimits[address] = { timestamp: now, count: 1 };
      }
    } else {
      // 首次请求
      requestLimits[address] = { timestamp: now, count: 1 };
    }
    
    // 连接到区块链
    if (!ADMIN_PRIVATE_KEY) {
      console.error('缺少管理员私钥');
      return NextResponse.json({ error: '服务器配置错误: 管理员私钥未设置' }, { status: 500 });
    }
    
    if (!CCY_TOKEN_ADDRESS) {
      console.error('缺少代币合约地址');
      return NextResponse.json({ error: '服务器配置错误: 代币合约地址未设置' }, { status: 500 });
    }
    
    // 获取工作的provider
    let provider;
    try {
      console.log("开始尝试连接RPC...");
      provider = await getWorkingProvider();
      console.log("成功获取provider");
    } catch (error) {
      console.error("所有RPC节点连接失败:", error);
      
      // 创建一个可调试的响应
      const debugInfo = {
        env: {
          rpcUrl: PRIMARY_RPC_URL,
          backupRpcs: BACKUP_RPC_URLS,
          tokenAddress: CCY_TOKEN_ADDRESS,
          hasPrivateKey: !!ADMIN_PRIVATE_KEY
        },
        error: error instanceof Error ? error.message : String(error)
      };
      
      return NextResponse.json({ 
        error: '无法连接到任何以太坊网络节点，请稍后再试',
        debug: debugInfo
      }, { status: 500 });
    }
    
    console.log("创建钱包实例...");
    let wallet;
    try {
      wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
      const walletAddress = await wallet.getAddress();
      console.log("钱包地址:", walletAddress);
    } catch (walletError) {
      console.error("创建钱包实例失败:", walletError);
      return NextResponse.json({ 
        error: '钱包初始化失败',
        details: walletError instanceof Error ? walletError.message : String(walletError)
      }, { status: 500 });
    }
    
    console.log("连接到代币合约...");
    let tokenContract;
    try {
      tokenContract = new ethers.Contract(CCY_TOKEN_ADDRESS, CCYTokenABI, wallet);
      
      // 检查合约连接
      const tokenName = await tokenContract.name();
      const tokenSymbol = await tokenContract.symbol();
      console.log("已连接到代币合约:", tokenName, tokenSymbol);
    } catch (contractError) {
      console.error("合约连接失败:", contractError);
      return NextResponse.json({ 
        error: '代币合约连接失败',
        details: contractError instanceof Error ? contractError.message : String(contractError),
        contractAddress: CCY_TOKEN_ADDRESS
      }, { status: 500 });
    }
    
    // 转换金额到wei格式
    const amountInWei = ethers.utils.parseEther(amount.toString());
    console.log("发送的代币数量(wei):", amountInWei.toString());
    
    // 发送代币
    console.log("开始铸造代币...");
    let tx;
    try {
      // 首先检查管理员的ETH余额
      const adminBalance = await wallet.getBalance();
      console.log("管理员ETH余额:", ethers.utils.formatEther(adminBalance), "ETH");
      
      if (adminBalance.isZero()) {
        return NextResponse.json({ 
          error: '管理员钱包没有ETH，无法支付gas费',
          details: '请为管理员钱包充值一些ETH用于支付gas费'
        }, { status: 500 });
      }
      
      // 检查gas估算
      const gasEstimate = await tokenContract.estimateGas.mint(address, amountInWei);
      console.log("估计gas消耗:", gasEstimate.toString());
      
      // 执行交易
      tx = await tokenContract.mint(address, amountInWei);
      console.log("铸造交易已发送:", tx.hash);
    } catch (txError: any) {
      console.error("铸造交易失败:", txError);
      
      // 提取有用的错误信息
      let errorDetails = '交易执行失败';
      if (txError.reason) errorDetails = txError.reason;
      else if (txError.message) errorDetails = txError.message;
      
      return NextResponse.json({ 
        error: '铸造代币失败',
        details: errorDetails,
        code: txError.code || 'UNKNOWN_ERROR'
      }, { status: 500 });
    }
    
    // 等待交易确认
    let receipt;
    try {
      receipt = await tx.wait();
      console.log("铸造交易已确认:", receipt.transactionHash);
    } catch (confirmError) {
      console.error("交易确认失败:", confirmError);
      return NextResponse.json({ 
        error: '交易已发送但确认失败',
        transactionHash: tx.hash,
        details: confirmError instanceof Error ? confirmError.message : String(confirmError)
      }, { status: 500 });
    }
    
    // 返回成功响应
    return NextResponse.json({ 
      success: true, 
      message: `已成功发送 ${amount} CCY代币到地址 ${address}`,
      transactionHash: receipt.transactionHash
    });
    
  } catch (error: any) {
    console.error('水龙头请求处理错误:', error);
    console.error('错误堆栈:', error.stack);
    
    // 尝试识别特定类型的错误
    let errorMessage = '处理请求失败';
    let errorDetails = error.message || '未知错误';
    
    if (error.code) {
      console.error('错误代码:', error.code);
      // 解析常见的以太坊错误代码
      if (error.code === 'INSUFFICIENT_FUNDS') {
        errorDetails = '管理员钱包没有足够的ETH支付gas费';
      } else if (error.code === 'CALL_EXCEPTION') {
        errorDetails = '合约调用失败，可能是权限问题或参数错误';
      } else if (error.code === 'NETWORK_ERROR') {
        errorDetails = '网络连接错误，请检查RPC URL';
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage, 
      details: errorDetails
    }, { status: 500 });
  }
} 