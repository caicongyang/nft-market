'use client';

import { ReactNode } from 'react';
import { WagmiConfig, RainbowKitProvider, chains, wagmiConfig } from '@/lib/rainbowkit-config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useIsClient } from '@/hooks/useIsClient';

// 创建 React Query 客户端
const queryClient = new QueryClient();

export function RainbowKitProviders({ children }: { children: ReactNode }) {
  // 使用自定义hook检测客户端环境
  const isClient = useIsClient();
  
  // 如果不是客户端环境，只返回children
  if (!isClient) {
    return <>{children}</>;
  }
  
  // 在客户端环境中渲染完整的Provider结构
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={chains}>
          {children}
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
} 