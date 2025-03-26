import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// 使用环境变量获取合约地址和私钥
const CCY_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_CCY_TOKEN_ADDRESS || '';
const ADMIN_PRIVATE_KEY = process.env.CCY_TOKEN_ADMIN_PRIVATE_KEY || '';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-holesky.publicnode.com';

// 请求限制映射
const requestLimits: { [key: string]: { timestamp: number, count: number } } = {};

// ABI片段 - 只包含mint函数
const MINT_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export async function POST(request: Request) {
  try {
    // 解析请求体
    const body = await request.json();
    const { address, amount } = body;
    
    console.log("收到直接铸币请求:", { address, amount });
    
    // 验证输入
    if (!address || !amount) {
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
      if (now - timestamp < 24 * 60 * 60 * 1000 && count >= 3) {
        return NextResponse.json({ 
          error: '请求频率过高，每个地址每天最多请求3次',
          nextAvailable: new Date(timestamp + 24 * 60 * 60 * 1000).toISOString()
        }, { status: 429 });
      }
      
      if (now - timestamp < 24 * 60 * 60 * 1000) {
        requestLimits[address].count += 1;
      } else {
        requestLimits[address] = { timestamp: now, count: 1 };
      }
    } else {
      requestLimits[address] = { timestamp: now, count: 1 };
    }
    
    // 检查配置
    if (!ADMIN_PRIVATE_KEY) {
      return NextResponse.json({ error: '服务器配置错误: 管理员私钥未设置' }, { status: 500 });
    }
    
    if (!CCY_TOKEN_ADDRESS) {
      return NextResponse.json({ error: '服务器配置错误: 代币合约地址未设置' }, { status: 500 });
    }
    
    // 手动构建交易
    try {
      // 1. 创建钱包
      const wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY);
      const walletAddress = wallet.address;
      console.log("管理员钱包地址:", walletAddress);
      
      // 添加延迟，确保获取到最新的nonce
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 2. 获取当前nonce和gas价格 - 使用直接的JSON-RPC调用
      const nonceResponse = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getTransactionCount',
          params: [walletAddress, 'latest']
        })
      });
      
      if (!nonceResponse.ok) {
        throw new Error(`获取nonce失败: ${nonceResponse.statusText}`);
      }
      
      const nonceData = await nonceResponse.json();
      const nonce = parseInt(nonceData.result, 16);
      console.log("当前nonce:", nonce);
      
      // 获取gas价格
      const gasPriceResponse = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'eth_gasPrice',
          params: []
        })
      });
      
      if (!gasPriceResponse.ok) {
        throw new Error(`获取gas价格失败: ${gasPriceResponse.statusText}`);
      }
      
      const gasPriceData = await gasPriceResponse.json();
      const gasPrice = gasPriceData.result;
      console.log("当前gas价格:", gasPrice);
      
      // 获取链ID
      const chainIdResponse = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          method: 'eth_chainId',
          params: []
        })
      });
      
      if (!chainIdResponse.ok) {
        throw new Error(`获取chainId失败: ${chainIdResponse.statusText}`);
      }
      
      const chainIdData = await chainIdResponse.json();
      const chainId = parseInt(chainIdData.result, 16);
      console.log("当前chainId:", chainId);
      
      // 3. 编码mint函数调用
      const iface = new ethers.utils.Interface(MINT_ABI);
      const amountInWei = ethers.utils.parseEther(amount.toString());
      const data = iface.encodeFunctionData("mint", [address, amountInWei]);
      
      // 4. 构建原始交易
      const tx = {
        to: CCY_TOKEN_ADDRESS,
        nonce: nonce,
        gasLimit: ethers.utils.hexlify(300000), // 固定gas限制
        gasPrice: gasPrice,
        data: data,
        chainId: chainId,
        value: '0x0'
      };
      
      // 5. 签名交易
      const signedTx = await wallet.signTransaction(tx);
      console.log("已签名交易");
      
      // 6. 发送签名交易
      const sendTxResponse = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 4,
          method: 'eth_sendRawTransaction',
          params: [signedTx]
        })
      });
      
      if (!sendTxResponse.ok) {
        throw new Error(`发送交易失败: ${sendTxResponse.statusText}`);
      }
      
      const sendTxData = await sendTxResponse.json();
      
      if (sendTxData.error) {
        throw new Error(`交易失败: ${JSON.stringify(sendTxData.error)}`);
      }
      
      const txHash = sendTxData.result;
      console.log("交易已发送，哈希:", txHash);
      
      // 返回成功响应
      return NextResponse.json({ 
        success: true, 
        message: `已成功发送 ${amount} CCY代币到地址 ${address}`,
        transactionHash: txHash
      });
      
    } catch (error: any) {
      console.error("直接铸币过程中出错:", error);
      return NextResponse.json({ 
        error: '铸币失败', 
        details: error.message || String(error)
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('处理请求时出错:', error);
    return NextResponse.json({ 
      error: '处理请求失败', 
      details: error.message || '未知错误'
    }, { status: 500 });
  }
} 