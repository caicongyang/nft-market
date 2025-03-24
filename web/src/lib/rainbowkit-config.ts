'use client';

import '@rainbow-me/rainbowkit/styles.css';

import {
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme,
  lightTheme,
} from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { 
  mainnet, sepolia, goerli, 
  // 移除错误的导入
  // chain as localChain,
} from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';

// 创建本地测试网络配置 - 直接创建对象，不使用chain
const localNetwork = {
  id: 31337,
  name: 'Local Network',
  network: 'localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
};

// 配置支持的链
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    // 仅使用本地网络进行开发，避免多链造成的复杂性
    // mainnet, sepolia, goerli, 
    localNetwork,
  ],
  [
    // 简化提供者配置
    jsonRpcProvider({
      rpc: () => ({ http: 'http://127.0.0.1:8545' }),
    }),
    publicProvider(),
  ]
);

// 配置钱包
const { connectors } = getDefaultWallets({
  appName: 'NFT Marketplace',
  // 如果没有ProjectID，使用固定字符串
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains
});

// 创建Wagmi配置
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

// 导出
export { RainbowKitProvider, WagmiConfig, chains }; 