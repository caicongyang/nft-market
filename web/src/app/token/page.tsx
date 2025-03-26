'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ExternalLink, Copy, ArrowRight, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import CCYTokenABI from '@/lib/abis/CCYToken.json';

export default function TokenPage() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingTransfer, setLoadingTransfer] = useState(false);
  const [tokenInfo, setTokenInfo] = useState({ name: '', symbol: '', totalSupply: '0', balance: '0' });
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const { toast } = useToast();

  const CCY_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_CCY_TOKEN_ADDRESS || '';

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (connected) {
      getTokenInfo();
    } else {
      setLoading(false);
    }
  }, [connected, account]);

  async function checkConnection() {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setConnected(true);
          setAccount(accounts[0]);
        } else {
          setConnected(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Failed to check connection:", error);
      setLoading(false);
    }
  }

  async function connectWallet() {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setConnected(true);
        setAccount(accounts[0]);
        toast({
          title: "钱包已连接",
          description: `连接到账户: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
      } else {
        toast({
          title: "MetaMask未安装",
          description: "请安装MetaMask浏览器扩展",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast({
        title: "连接失败",
        description: "无法连接到钱包",
        variant: "destructive",
      });
    }
  }

  async function getTokenInfo() {
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const tokenContract = new ethers.Contract(CCY_TOKEN_ADDRESS, CCYTokenABI, provider);
      
      const name = await tokenContract.name();
      const symbol = await tokenContract.symbol();
      const totalSupply = ethers.utils.formatUnits(await tokenContract.totalSupply(), 18);
      const balance = ethers.utils.formatUnits(await tokenContract.balanceOf(account), 18);
      
      setTokenInfo({ name, symbol, totalSupply, balance });
    } catch (error) {
      console.error("Failed to get token info:", error);
      toast({
        title: "获取代币信息失败",
        description: "无法获取代币信息，请检查网络连接",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }
  
  async function transferTokens() {
    try {
      if (!recipient || !amount) {
        toast({
          title: "信息不完整",
          description: "请填写接收地址和数量",
          variant: "destructive",
        });
        return;
      }
      
      const addressRegex = /^0x[a-fA-F0-9]{40}$/;
      if (!addressRegex.test(recipient)) {
        toast({
          title: "地址无效",
          description: "请输入有效的以太坊地址",
          variant: "destructive",
        });
        return;
      }
      
      if (parseFloat(amount) <= 0) {
        toast({
          title: "数量无效",
          description: "请输入大于0的数量",
          variant: "destructive",
        });
        return;
      }
      
      if (parseFloat(amount) > parseFloat(tokenInfo.balance)) {
        toast({
          title: "余额不足",
          description: `您的余额 ${tokenInfo.balance} ${tokenInfo.symbol} 不足`,
          variant: "destructive",
        });
        return;
      }
      
      setLoadingTransfer(true);
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const tokenContract = new ethers.Contract(CCY_TOKEN_ADDRESS, CCYTokenABI, signer);
      
      const weiAmount = ethers.utils.parseEther(amount);
      
      toast({
        title: "转账中",
        description: "请在MetaMask中确认交易",
      });
      
      const tx = await tokenContract.transfer(recipient, weiAmount);
      await tx.wait();
      
      toast({
        title: "转账成功",
        description: `已成功转账 ${amount} ${tokenInfo.symbol} 到地址 ${recipient.slice(0, 6)}...${recipient.slice(-4)}`,
      });
      
      // 更新代币信息
      await getTokenInfo();
      
      // 清空表单
      setAmount('');
      
    } catch (error) {
      console.error("Failed to transfer tokens:", error);
      toast({
        title: "转账失败",
        description: "无法完成转账，请检查网络连接和交易参数",
        variant: "destructive",
      });
    } finally {
      setLoadingTransfer(false);
    }
  }
  
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "已复制",
        description: "地址已复制到剪贴板",
      });
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  }
  
  async function addHoleskyNetwork() {
    if (!window.ethereum) {
      toast({
        title: "MetaMask未安装",
        description: "请安装MetaMask浏览器扩展",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x4268',  // 17000 in 十六进制
          chainName: 'Holesky Testnet',
          nativeCurrency: {
            name: 'Holesky ETH',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: ['https://ethereum-holesky.publicnode.com'],
          blockExplorerUrls: ['https://holesky.etherscan.io']
        }]
      });
      
      toast({
        title: "添加成功",
        description: "Holesky 测试网络已添加到MetaMask",
      });
    } catch (error) {
      console.error("Failed to add Holesky network:", error);
      toast({
        title: "添加失败",
        description: "无法添加Holesky测试网络",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">代币管理</h1>
          <p className="text-muted-foreground">查看和管理您的 {tokenInfo.symbol || 'CCY'} 代币</p>
        </div>
        
        {!connected && (
          <Button onClick={connectWallet}>连接钱包</Button>
        )}
      </div>
      
      {!connected ? (
        <div className="text-center py-16 border rounded-lg bg-muted/20">
          <h3 className="text-xl mb-4">请先连接您的钱包</h3>
          <Button onClick={connectWallet}>连接钱包</Button>
        </div>
      ) : loading ? (
        <div className="flex flex-col justify-center items-center h-64 gap-3">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">加载代币信息...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>您的 {tokenInfo.symbol} 余额</CardTitle>
              <CardDescription>
                查看您的 {tokenInfo.name} 代币余额和基本信息
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold mb-6">
                {parseFloat(tokenInfo.balance).toLocaleString()} <span className="text-2xl">{tokenInfo.symbol}</span>
              </div>
              
              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                <div className="border rounded-md p-4">
                  <p className="text-sm text-muted-foreground mb-1">代币名称</p>
                  <p className="font-medium">{tokenInfo.name}</p>
                </div>
                <div className="border rounded-md p-4">
                  <p className="text-sm text-muted-foreground mb-1">代币符号</p>
                  <p className="font-medium">{tokenInfo.symbol}</p>
                </div>
                <div className="border rounded-md p-4">
                  <p className="text-sm text-muted-foreground mb-1">总供应量</p>
                  <p className="font-medium">{parseFloat(tokenInfo.totalSupply).toLocaleString()} {tokenInfo.symbol}</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 border rounded-md p-4">
                  <p className="text-sm text-muted-foreground mb-1">您的钱包地址</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-xs overflow-hidden text-ellipsis">{account}</p>
                    <button 
                      onClick={() => copyToClipboard(account)}
                      className="text-muted-foreground hover:text-foreground" 
                      title="复制地址"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 border rounded-md p-4">
                  <p className="text-sm text-muted-foreground mb-1">代币合约地址</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-xs overflow-hidden text-ellipsis">{CCY_TOKEN_ADDRESS}</p>
                    <button 
                      onClick={() => copyToClipboard(CCY_TOKEN_ADDRESS)}
                      className="text-muted-foreground hover:text-foreground" 
                      title="复制地址"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <a 
                      href={`https://holesky.etherscan.io/token/${CCY_TOKEN_ADDRESS}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                      title="在Holesky Etherscan上查看"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-4">
              <Link href="/token/mint" className="flex-1">
                <Button variant="outline" className="w-full">
                  铸造代币
                </Button>
              </Link>
              <Button 
                onClick={getTokenInfo}
                variant="outline"
                className="flex-1"
              >
                刷新余额
              </Button>
              <Button 
                onClick={addHoleskyNetwork}
                variant="outline"
                className="flex-1"
                title="添加Holesky测试网到MetaMask"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                添加Holesky网络
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>转账代币</CardTitle>
              <CardDescription>
                将您的 {tokenInfo.symbol} 代币转账给其他用户
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">接收地址</Label>
                <Input 
                  id="recipient" 
                  value={recipient} 
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="amount">数量</Label>
                  <span className="text-xs text-muted-foreground">
                    余额: {tokenInfo.balance} {tokenInfo.symbol}
                  </span>
                </div>
                <Input 
                  id="amount" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100"
                  type="number"
                  min="0"
                  max={tokenInfo.balance}
                  step="0.01"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={transferTokens} 
                className="w-full"
                disabled={loadingTransfer || !recipient || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(tokenInfo.balance)}
              >
                {loadingTransfer ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    转账中...
                  </>
                ) : (
                  <div className="flex items-center">
                    <span>发送</span>
                    <ArrowRight className="h-4 w-4 mx-1" />
                    <span>{amount || "0"} {tokenInfo.symbol}</span>
                  </div>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>交易信息</CardTitle>
              <CardDescription>
                您的 {tokenInfo.symbol} 代币交易历史
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <p className="text-muted-foreground">
                  暂无交易记录或该功能尚未实现
                </p>
                <p className="text-xs mt-2 text-muted-foreground">
                  您可以在Etherscan上查看完整的交易历史
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <a 
                href={`https://holesky.etherscan.io/token/${CCY_TOKEN_ADDRESS}?a=${account}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button variant="outline" className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  在Holesky Etherscan上查看
                </Button>
              </a>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
} 