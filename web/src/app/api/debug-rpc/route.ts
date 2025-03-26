import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// RPC配置
const RPC_URLS = {
  primary: process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-holesky.publicnode.com',
  backups: [
    'https://ethereum-holesky.publicnode.com',
    'https://ethereum-holesky-sepolia.blockpi.network/v1/rpc/public',
    'https://holesky.drpc.org'
  ],
  defaultProvider: 'holesky'
};

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    rpcs: [] as any[],
    defaultProvider: null as any,
    successful: false
  };

  // 测试主要RPC
  const primaryResult = await testRPC(RPC_URLS.primary, 'primary');
  results.rpcs.push(primaryResult);
  if (primaryResult.success) {
    results.successful = true;
  }

  // 测试备选RPC
  for (const url of RPC_URLS.backups) {
    const result = await testRPC(url, 'backup');
    results.rpcs.push(result);
    if (result.success) {
      results.successful = true;
    }
  }

  // 测试默认provider
  try {
    const provider = ethers.getDefaultProvider(RPC_URLS.defaultProvider);
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    
    results.defaultProvider = {
      name: 'ethers default provider',
      success: true,
      network: {
        chainId: network.chainId,
        name: network.name
      },
      blockNumber
    };
    
    if (!results.successful) {
      results.successful = true;
    }
  } catch (error: any) {
    results.defaultProvider = {
      name: 'ethers default provider',
      success: false,
      error: error.message || String(error)
    };
  }

  return NextResponse.json(results);
}

async function testRPC(url: string, type: string) {
  const result = {
    url,
    type,
    success: false,
    latency: 0,
    error: null as string | null,
    network: null as any,
    blockNumber: null as number | null
  };

  const startTime = Date.now();
  
  try {
    const provider = new ethers.providers.JsonRpcProvider(url);
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    
    result.success = true;
    result.network = {
      chainId: network.chainId,
      name: network.name
    };
    result.blockNumber = blockNumber;
  } catch (error: any) {
    result.error = error.message || String(error);
  }
  
  result.latency = Date.now() - startTime;
  return result;
} 