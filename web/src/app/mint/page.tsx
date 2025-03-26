'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import CCYNFTABI from '@/lib/abis/CCYNFT.json';

// 简化类型定义，避免扩展window对象
type EthereumProvider = {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
}

export default function MintNFT() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const { toast } = useToast();

  const CCY_NFT_ADDRESS = process.env.NEXT_PUBLIC_CCY_NFT_ADDRESS || '';

  // 页面加载时自动检查钱包连接状态
  useEffect(() => {
    async function checkConnection() {
      try {
        if (typeof window !== 'undefined' && window.ethereum) {
          // 检查是否已连接
          const provider = new ethers.providers.Web3Provider(window.ethereum as ethers.providers.ExternalProvider);
          const accounts = await provider.listAccounts();
          
          if (accounts.length > 0) {
            setConnected(true);
            setAccount(accounts[0]);
            console.log("自动检测到已连接的钱包:", accounts[0]);
          }
        }
      } catch (error) {
        console.error("检查钱包连接状态时出错:", error);
      } finally {
        setCheckingConnection(false);
      }
    }
    
    checkConnection();
    
    // 监听钱包连接变化事件
    function handleAccountsChanged(accounts: string[]) {
      if (accounts.length > 0) {
        setConnected(true);
        setAccount(accounts[0]);
        console.log("钱包账户变更:", accounts[0]);
        
        toast({
          title: "钱包已更新",
          description: `当前账户: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
      } else {
        setConnected(false);
        setAccount('');
        console.log("钱包已断开连接");
        
        toast({
          title: "钱包已断开",
          description: "请重新连接您的钱包",
          variant: "destructive",
        });
      }
    }
    
    // 使用更安全的方式检查和处理以太坊提供程序
    const ethereum = window?.ethereum as EthereumProvider | undefined;
    
    if (ethereum) {
      ethereum.on('accountsChanged', handleAccountsChanged);
      
      // 监听网络变化
      ethereum.on('chainChanged', (_chainId: string) => {
        console.log("网络已切换，页面将重新加载");
        window.location.reload();
      });
    }
    
    // 清理函数，移除事件监听器
    return () => {
      if (ethereum) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [toast]);  // 添加toast作为依赖项

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
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      toast({
        title: "连接失败",
        description: "无法连接到钱包",
        variant: "destructive",
      });
    }
  }
  
  async function mintNFT() {
    try {
      if (!name || !description || !imageUrl) {
        toast({
          title: "信息不完整",
          description: "请填写所有必要信息",
          variant: "destructive",
        });
        return;
      }
      
      setLoading(true);
      
      // 创建NFT元数据
      const metadata = {
        name,
        description,
        image: imageUrl
      };
      
      // 在实际应用中，你可能需要将元数据上传到IPFS
      // 这里我们简化为直接使用JSON字符串
      const tokenURI = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
      
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const nftContract = new ethers.Contract(CCY_NFT_ADDRESS, CCYNFTABI, signer);
      
      toast({
        title: "铸造中",
        description: "请在MetaMask中确认交易",
      });
      
      const tx = await nftContract.mintNFT(account, tokenURI);
      console.log("铸造交易已发送:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("铸造交易已确认:", receipt);
      
      // 从事件日志中获取 tokenId
      let tokenId;
      try {
        // 查找 Transfer 事件
        const transferEvent = receipt.events?.find(event => event.event === 'Transfer');
        if (transferEvent && transferEvent.args) {
          // ERC721 Transfer 事件的第三个参数是 tokenId
          tokenId = transferEvent.args[2].toString();
          console.log("铸造的 NFT tokenId:", tokenId);
        }
      } catch (eventError) {
        console.error("解析铸造事件失败:", eventError);
      }
      
      toast({
        title: "铸造成功",
        description: tokenId ? `您的NFT已成功铸造，TokenID: ${tokenId}` : "您的NFT已成功铸造",
      });
      
      // 清空表单
      setName('');
      setDescription('');
      setImageUrl('');
      
    } catch (error) {
      console.error("Failed to mint NFT:", error);
      toast({
        title: "铸造失败",
        description: "无法铸造NFT，请检查网络连接和交易参数",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">铸造新NFT</h1>
      
      {checkingConnection ? (
        <div className="text-center py-16 border rounded-lg bg-muted/20">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-pink-500" />
          <p className="mt-4 text-lg text-gray-600">正在检查钱包连接状态...</p>
        </div>
      ) : !connected ? (
        <div className="text-center py-16 border rounded-lg bg-muted/20">
          <h3 className="text-xl mb-4">请先连接您的钱包</h3>
          <Button onClick={connectWallet}>连接钱包</Button>
        </div>
      ) : (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>创建新NFT</CardTitle>
            <CardDescription>
              填写NFT信息并铸造
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">NFT名称</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="我的NFT"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="这是一个很棒的NFT..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="imageUrl">图片URL</Label>
              <Input 
                id="imageUrl" 
                value={imageUrl} 
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              {imageUrl && (
                <div className="mt-2 aspect-square w-32 overflow-hidden rounded border">
                  <img 
                    src={imageUrl} 
                    alt="NFT Preview" 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/images/placeholder-nft.jpg';
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={mintNFT} 
              className="w-full"
              disabled={loading || !name || !description || !imageUrl}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  铸造中...
                </>
              ) : (
                '铸造NFT'
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 