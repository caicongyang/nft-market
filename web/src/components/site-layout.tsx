'use client';

import { ReactNode } from 'react';
import Navbar from '@/components/navbar';
import { Toaster } from '@/components/ui/toaster';
import { useIsClient } from '@/hooks/useIsClient';

export function SiteLayout({ children }: { children: ReactNode }) {
  const isClient = useIsClient();
  
  return (
    <div className="flex min-h-screen flex-col">
      {isClient && <Navbar />}
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t py-6 px-4 md:py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} NFT 市场. 版权所有.
          </p>
        </div>
      </footer>
      {isClient && <Toaster />}
    </div>
  );
} 