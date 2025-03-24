'use client';

import { ReactNode } from 'react';
import dynamic from 'next/dynamic';

// 动态导入组件，仅在客户端渲染
const ClientLayout = dynamic(
  () => import('@/components/site-layout').then(mod => mod.SiteLayout),
  { ssr: false }
);

const RainbowKitProviders = dynamic(
  () => import('@/components/providers/rainbow-kit-provider').then(mod => mod.RainbowKitProviders),
  { ssr: false }
);

export function ClientLayoutWrapper({ children }: { children: ReactNode }) {
  return (
    <RainbowKitProviders>
      <ClientLayout>
        {children}
      </ClientLayout>
    </RainbowKitProviders>
  );
} 