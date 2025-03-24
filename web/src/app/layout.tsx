import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClientLayoutWrapper } from '@/components/client-layout-wrapper';

// 设置字体
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

// 设置元数据
export const metadata: Metadata = {
  title: 'NFT 市场',
  description: '一个使用 Next.js 和以太坊构建的现代 NFT 市场应用',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={inter.className} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientLayoutWrapper>
          {children}
        </ClientLayoutWrapper>
      </body>
    </html>
  );
}