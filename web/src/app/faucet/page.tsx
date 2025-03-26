'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CCYTokenABI from '@/lib/abis/CCYToken.json';
import { Loader2, Wallet, Copy } from 'lucide-react';
import { parseError } from '@/lib/blockchain';

export default function TokenFaucet() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [amount, setAmount] = useState('10');
  const [loading, setLoading] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const { toast } = useToast();

  const CCY_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_CCY_TOKEN_ADDRESS || '';

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (connected) {
      loadTokenBalance();
    }
  }, [connected]);

  async function checkConnection() {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum as ethers.providers.ExternalProvider);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setConnected(true);
          setAccount(accounts[0]);
        } else {
          setLoadingBalance(false);
        }
      } else {
        setLoadingBalance(false);
      }
    } catch (error) {
      console.error("检查钱包连接失败:", error);
      setLoadingBalance(false);
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
        loadTokenBalance();
      } else {
        toast({
          title: "MetaMask未安装",
          description: "请安装MetaMask浏览器扩展",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("连接钱包失败:", error);
      toast({
        title: "连接失败",
        description: "无法连接到钱包",
        variant: "destructive",
      });
    }
  }

  async function loadTokenBalance() {
    setLoadingBalance(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as ethers.providers.ExternalProvider);
      const tokenContract = new ethers.Contract(CCY_TOKEN_ADDRESS, CCYTokenABI, provider);
      
      const userBalance = await tokenContract.balanceOf(account);
      setBalance(ethers.utils.formatEther(userBalance));
    } catch (error) {
      console.error("加载代币余额失败:", error);
    } finally {
      setLoadingBalance(false);
    }
  }
  
  async function requestTokens() {
    try {
      if (!amount || parseFloat(amount) <= 0) {
        toast({
          title: "无效金额",
          description: "请输入有效的金额",
          variant: "destructive",
        });
        return;
      }
      
      // 使用提供的水龙头API或合约来获取代币
      // 此处我们需要调用后端API，因为我们需要使用合约拥有者的钱包来mint代币
      setLoading(true);
      
      const response = await fetch('/api/faucet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: account,
          amount: amount
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '请求代币失败');
      }
      
      const data = await response.json();
      
      toast({
        title: "请求成功",
        description: `已向您的钱包发送 ${amount} CCY代币`,
      });
      
      // 重新加载余额
      await loadTokenBalance();
    } catch (error) {
      console.error("请求代币失败:", error);
      toast({
        title: "请求失败",
        description: error instanceof Error ? error.message : "无法请求代币",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }
  
  function copyAddress(text: string) {
    navigator.clipboard.writeText(text);
    toast({
      title: "已复制",
      description: "地址已复制到剪贴板",
    });
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">CCY代币水龙头</h1>
        
        {!connected && (
          <Button onClick={connectWallet} className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            连接钱包
          </Button>
        )}
      </div>
      
      {!connected ? (
        <div className="text-center py-16 border rounded-lg bg-muted/20">
          <h3 className="text-xl mb-4">请先连接您的钱包</h3>
          <Button onClick={connectWallet}>连接钱包</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>钱包信息</CardTitle>
              <CardDescription>
                您的钱包地址和代币余额
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-md bg-muted">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">您的地址:</span>
                  <Button variant="ghost" size="sm" onClick={() => copyAddress(account)} className="h-6 px-2">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm break-all">{account}</p>
              </div>
              
              <div className="p-4 rounded-md bg-muted">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">CCY代币余额:</span>
                  {loadingBalance ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                </div>
                <p className="text-xl font-bold">{balance} CCY</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>获取CCY代币</CardTitle>
              <CardDescription>
                使用此水龙头获取测试用的CCY代币
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">代币数量</Label>
                <Input 
                  id="amount" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="10"
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                />
                <p className="text-xs text-muted-foreground">单次最多可请求 100 CCY代币</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={requestTokens} 
                className="w-full"
                disabled={loading || loadingBalance}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    处理中...
                  </>
                ) : (
                  "获取CCY代币"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
      
      <div className="mt-8 p-4 border rounded-lg bg-muted/10">
        <h3 className="text-lg font-semibold mb-2">关于CCY代币</h3>
        <p className="text-sm text-muted-foreground">
          CCY代币是此NFT市场的交易代币。您需要CCY代币才能在市场上购买NFT。
          这是一个测试网络代币，没有实际价值，仅用于演示和测试目的。
        </p>
        <div className="mt-4">
          <h4 className="text-md font-medium mb-1">水龙头使用说明</h4>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>每个地址每天最多可请求 100 CCY代币</li>
            <li>如需更多代币，请联系管理员</li>
            <li>请勿滥用此水龙头服务</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 