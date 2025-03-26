'use client';

import { useState, useEffect } from 'react';
import { Wallet, Plus, Coins } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '浏览市场', icon: null },
    { href: '/list', label: '上架NFT', icon: <Plus className="h-4 w-4" /> },
    { href: '/profile', label: '我的NFT', icon: null },
    { href: '/mint', label: '铸造NFT', icon: null },
    { href: '/faucet', label: '代币水龙头', icon: <Coins className="h-4 w-4" /> },
  ];

  return (
    <nav className="bg-white shadow-md border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo和品牌名称 */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-pink-600">Lovely Daughter</span>
              <span className="text-xs text-gray-500">NFT LOVELY♡DAUGHTER</span>
            </div>
          </Link>

          {/* 导航链接 */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 flex items-center space-x-1 ${
                  pathname === item.href 
                    ? 'text-pink-600 font-medium border-b-2 border-pink-600' 
                    : 'text-gray-500 hover:text-pink-600'
                }`}
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* 钱包连接按钮和快捷操作 */}
          <div className="flex items-center space-x-4">
            <div className="h-[38px]">
              <ConnectButton />
            </div>
            <div className="hidden md:flex space-x-2">
              <Link href="/faucet">
                <Button variant="outline" size="sm" className="bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100">
                  <Coins className="mr-1 h-4 w-4" />
                  获取代币
                </Button>
              </Link>
              <Link href="/list">
                <Button variant="outline" size="sm" className="bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100">
                  <Plus className="mr-1 h-4 w-4" />
                  上架NFT
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 移动端导航菜单 */}
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                  pathname === item.href
                    ? 'bg-pink-50 text-pink-600'
                    : 'text-gray-500 hover:bg-pink-50 hover:text-pink-600'
                }`}
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}