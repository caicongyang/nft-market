import { NextResponse } from 'next/server';

// 仅检查是否存在环境变量，不显示实际值
export async function GET() {
  const result = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    variables: {
      NEXT_PUBLIC_RPC_URL: {
        exists: !!process.env.NEXT_PUBLIC_RPC_URL,
        masked_value: process.env.NEXT_PUBLIC_RPC_URL ? 
          maskString(process.env.NEXT_PUBLIC_RPC_URL) : null
      },
      NEXT_PUBLIC_NFT_MARKET_ADDRESS: {
        exists: !!process.env.NEXT_PUBLIC_NFT_MARKET_ADDRESS,
        masked_value: process.env.NEXT_PUBLIC_NFT_MARKET_ADDRESS ? 
          maskString(process.env.NEXT_PUBLIC_NFT_MARKET_ADDRESS) : null
      },
      NEXT_PUBLIC_CCY_NFT_ADDRESS: {
        exists: !!process.env.NEXT_PUBLIC_CCY_NFT_ADDRESS,
        masked_value: process.env.NEXT_PUBLIC_CCY_NFT_ADDRESS ? 
          maskString(process.env.NEXT_PUBLIC_CCY_NFT_ADDRESS) : null
      },
      NEXT_PUBLIC_CCY_TOKEN_ADDRESS: {
        exists: !!process.env.NEXT_PUBLIC_CCY_TOKEN_ADDRESS,
        masked_value: process.env.NEXT_PUBLIC_CCY_TOKEN_ADDRESS ? 
          maskString(process.env.NEXT_PUBLIC_CCY_TOKEN_ADDRESS) : null
      },
      CCY_TOKEN_ADMIN_PRIVATE_KEY: {
        exists: !!process.env.CCY_TOKEN_ADMIN_PRIVATE_KEY,
        // 私钥不显示任何内容，即使是掩码
        masked_value: process.env.CCY_TOKEN_ADMIN_PRIVATE_KEY ? "***" : null
      }
    },
    server_info: {
      platform: process.platform,
      arch: process.arch,
      node_version: process.version
    }
  };

  return NextResponse.json(result);
}

// 掩码函数，只显示字符串的开始和结尾部分
function maskString(str: string): string {
  if (!str) return '';
  if (str.length <= 8) return '****';
  
  const start = str.substring(0, 4);
  const end = str.substring(str.length - 4);
  return `${start}...${end}`;
} 