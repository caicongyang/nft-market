'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import CCYTokenABI from '@/lib/abis/CCYToken.json';

export default function MintToken() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [tokenInfo, setTokenInfo] = useState({ name: '', symbol: '', totalSupply: '0' });
  const { toast } = useToast();

  const CCY_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_CCY_TOKEN_ADDRESS || '';

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (connected) {
      checkOwnership();
      getTokenInfo();
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
          setIsOwner(false);
          setConnected(false);
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

  async function checkOwnership() {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const tokenContract = new ethers.Contract(CCY_TOKEN_ADDRESS, CCYTokenABI, provider);
      const ownerAddress = await tokenContract.owner();
      
      setIsOwner(account.toLowerCase() === ownerAddress.toLowerCase());
    } catch (error) {
      console.error("Failed to check ownership:", error);
      setIsOwner(false);
    }
  }

  async function getTokenInfo() {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const tokenContract = new ethers.Contract(CCY_TOKEN_ADDRESS, CCYTokenABI, provider);
      
      const name = await tokenContract.name();
      const symbol = await tokenContract.symbol();
      const totalSupply = ethers.utils.formatUnits(await tokenContract.totalSupply(), 18);
      
      setTokenInfo({ name, symbol, totalSupply });
    } catch (error) {
      console.error("Failed to get token info:", error);
    }
  }
  
  async function mintTokens() {
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
      
      setLoading(true);
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const tokenContract = new ethers.Contract(CCY_TOKEN_ADDRESS, CCYTokenABI, signer);
      
      const weiAmount = ethers.utils.parseEther(amount);
      
      toast({
        title: "铸造中",
        description: "请在MetaMask中确认交易",
      });
      
      const tx = await tokenContract.mint(recipient, weiAmount);
      await tx.wait();
      
      toast({
        title: "铸造成功",
        description: `已成功铸造 ${amount} ${tokenInfo.symbol} 代币到地址 ${recipient.slice(0, 6)}...${recipient.slice(-4)}`,
      });
      
      // 更新代币信息
      await getTokenInfo();
      
      // 清空表单
      setAmount('');
      
    } catch (error) {
      console.error("Failed to mint tokens:", error);
      toast({
        title: "铸造失败",
        description: "无法铸造代币，请检查您是否有铸造权限",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">铸造 {tokenInfo.symbol || 'CCY'} 代币</h1>
      
      {!connected ? (
        <div className="text-center py-16 border rounded-lg bg-muted/20">
          <h3 className="text-xl mb-4">请先连接您的钱包</h3>
          <Button onClick={connectWallet}>连接钱包</Button>
        </div>
      ) : !isOwner ? (
        <div className="text-center py-16 border rounded-lg bg-muted/20">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h3 className="text-xl font-medium mb-2">没有铸造权限</h3>
          <p className="text-muted-foreground mb-6">
            只有合约拥有者才能铸造 {tokenInfo.symbol || 'CCY'} 代币。
          </p>
          <div className="max-w-md mx-auto p-4 border rounded-md bg-muted">
            <p className="text-sm"><strong>代币名称:</strong> {tokenInfo.name}</p>
            <p className="text-sm"><strong>代币符号:</strong> {tokenInfo.symbol}</p>
            <p className="text-sm"><strong>当前供应量:</strong> {tokenInfo.totalSupply} {tokenInfo.symbol}</p>
            <p className="text-sm"><strong>合约地址:</strong> {CCY_TOKEN_ADDRESS}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>代币信息</CardTitle>
                <CardDescription>
                  {tokenInfo.name} ({tokenInfo.symbol}) 的基本信息
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">代币名称</span>
                  <span className="font-medium">{tokenInfo.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">代币符号</span>
                  <span className="font-medium">{tokenInfo.symbol}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">当前供应量</span>
                  <span className="font-medium">{tokenInfo.totalSupply} {tokenInfo.symbol}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">合约地址</span>
                  <span className="font-medium text-xs">{CCY_TOKEN_ADDRESS}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">您的权限</span>
                  <span className="font-medium text-green-600">合约拥有者</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>铸造新代币</CardTitle>
                <CardDescription>
                  创建新的 {tokenInfo.symbol || 'CCY'} 代币并分配给接收地址
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
                  <Label htmlFor="amount">数量</Label>
                  <Input 
                    id="amount" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100"
                    type="number"
                    min="0"
                    step="1"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={mintTokens} 
                  className="w-full"
                  disabled={loading || !recipient || !amount}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      铸造中...
                    </>
                  ) : (
                    `铸造 ${tokenInfo.symbol || 'CCY'} 代币`
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="mt-8 p-4 border rounded-md bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
            <div className="flex gap-2 items-center mb-2">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-medium">温馨提示</h3>
            </div>
            <p className="text-sm">
              作为合约拥有者，您有权铸造新的代币。请确保谨慎使用此功能，因为过度铸造可能会稀释代币价值。
            </p>
          </div>
        </>
      )}
    </div>
  );
} 