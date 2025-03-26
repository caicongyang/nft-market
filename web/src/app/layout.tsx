import '@/styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClientLayoutWrapper } from '@/components/client-layout-wrapper';
import { Providers } from '@/components/Providers';
import Navbar from '@/components/navbar';

// 设置字体
const inter = Inter({ subsets: ['latin'] });

// 设置元数据
export const metadata: Metadata = {
  title: '最可爱的女儿 NFT市场',
  description: '收集和交易最可爱的女儿主题NFT',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={inter.className} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}