'use client';

import * as React from 'react';
import { WagmiConfig, RainbowKitProvider, chains, wagmiConfig } from '@/lib/rainbowkit-config';

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        {mounted && children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
} 