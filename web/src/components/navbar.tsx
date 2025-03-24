'use client';

import { useState, useEffect } from 'react';
import { Wallet, Plus } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<string>('');
  const pathname = usePathname();

  useEffect(() => {
    checkConnection();

    // 监听账户变化
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setConnected(true);
        } else {
          setConnected(false);
          setAccount('');
        }
      });
    }

    return () => {
      // 清理事件监听
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  async function checkConnection() {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setConnected(true);
          setAccount(accounts[0]);
        }
      }
    } catch (error) {
      console.error("Failed to check connection:", error);
    }
  }

  async function connectWallet() {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setConnected(true);
        setAccount(accounts[0]);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  }

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/" className="text-xl font-bold">
          NFT 市场
        </Link>
        <div className="flex gap-4 ml-8">
          <Link 
            href="/" 
            className={`px-3 py-2 ${pathname === '/' ? 'text-primary font-medium border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            浏览市场
          </Link>
          <Link 
            href="/list" 
            className={`px-3 py-2 ${pathname === '/list' ? 'text-primary font-medium border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            上架NFT
          </Link>
          <Link 
            href="/profile" 
            className={`px-3 py-2 ${pathname === '/profile' ? 'text-primary font-medium border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            我的NFT
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-4">
          {!connected ? (
            <Button onClick={connectWallet}>
              <Wallet className="mr-2 h-4 w-4" />
              连接钱包
            </Button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
            </div>
          )}
          <Link href="/list">
            <Button variant="outline" size="sm">
              <Plus className="mr-1 h-4 w-4" />
              上架NFT
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}