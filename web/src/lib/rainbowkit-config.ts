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
  holesky
} from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';

// 获取Alchemy RPC URL
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-holesky-rpc.publicnode.com';

// 配置支持的链
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [holesky],
  [
    jsonRpcProvider({
      rpc: () => ({ http: rpcUrl }),
    }),
    publicProvider(),
  ]
);

// 配置钱包
const { connectors } = getDefaultWallets({
  appName: '最可爱的女儿 NFT市场',
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