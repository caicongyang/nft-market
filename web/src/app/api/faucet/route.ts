import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import CCYTokenABI from '@/lib/abis/CCYToken.json';

// 使用环境变量获取合约地址和私钥
const CCY_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_CCY_TOKEN_ADDRESS || '';
// 私钥需要保密，并只在服务器端使用
const ADMIN_PRIVATE_KEY = process.env.CCY_TOKEN_ADMIN_PRIVATE_KEY || '';
// RPC URL，连接到区块链网络
const PRIMARY_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY';
// 备选公共RPC列表
const BACKUP_RPC_URLS = [
  'https://ethereum-holesky-rpc.publicnode.com',
  'https://1rpc.io/holesky'
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
  // 首先尝试主要RPC URL
  console.log("尝试连接到主要RPC:", PRIMARY_RPC_URL);
  try {
    const provider = new ethers.providers.JsonRpcProvider(PRIMARY_RPC_URL);
    await provider.getNetwork(); // 测试连接
    console.log("成功连接到主要RPC");
    return provider;
  } catch (error) {
    console.warn("主要RPC连接失败，尝试备选RPC");
  }
  
  // 尝试备选RPC URL
  for (const rpcUrl of BACKUP_RPC_URLS) {
    console.log("尝试连接到备选RPC:", rpcUrl);
    try {
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      await provider.getNetwork(); // 测试连接
      console.log("成功连接到备选RPC:", rpcUrl);
      return provider;
    } catch (error) {
      console.warn(`备选RPC连接失败: ${rpcUrl}`);
    }
  }
  
  throw new Error("无法连接到任何RPC节点");
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
      provider = await getWorkingProvider();
    } catch (error) {
      console.error("所有RPC节点连接失败:", error);
      return NextResponse.json({ error: '无法连接到任何以太坊网络节点，请稍后再试' }, { status: 500 });
    }
    
    console.log("创建钱包实例...");
    const wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
    const walletAddress = await wallet.getAddress();
    console.log("钱包地址:", walletAddress);
    
    console.log("连接到代币合约...");
    const tokenContract = new ethers.Contract(CCY_TOKEN_ADDRESS, CCYTokenABI, wallet);
    
    // 检查合约连接
    try {
      const tokenName = await tokenContract.name();
      const tokenSymbol = await tokenContract.symbol();
      console.log("已连接到代币合约:", tokenName, tokenSymbol);
    } catch (contractError) {
      console.error("合约连接失败:", contractError);
      return NextResponse.json({ error: '代币合约连接失败, 请检查合约地址是否正确' }, { status: 500 });
    }
    
    // 转换金额到wei格式
    const amountInWei = ethers.utils.parseEther(amount.toString());
    console.log("发送的代币数量(wei):", amountInWei.toString());
    
    // 发送代币
    console.log("开始铸造代币...");
    const tx = await tokenContract.mint(address, amountInWei);
    console.log("铸造交易已发送:", tx.hash);
    const receipt = await tx.wait();
    console.log("铸造交易已确认:", receipt.transactionHash);
    
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