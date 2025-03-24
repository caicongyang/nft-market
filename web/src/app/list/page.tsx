'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import NFTMarketABI from '@/lib/abis/NFTMarket.json';
import CCYNFTABI from '@/lib/abis/CCYNFT.json';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Wallet } from 'lucide-react';
import Link from 'next/link';
import NFTCard from '@/components/nft-card';

export default function ListNFT() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [tokenId, setTokenId] = useState(searchParams?.get('tokenId') || '');
  const [price, setPrice] = useState('');
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingNFT, setLoadingNFT] = useState(true);
  const { toast } = useToast();

  const NFT_MARKET_ADDRESS = process.env.NEXT_PUBLIC_NFT_MARKET_ADDRESS || '';
  const CCY_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_CCY_TOKEN_ADDRESS || '';
  const CCY_NFT_ADDRESS = process.env.NEXT_PUBLIC_CCY_NFT_ADDRESS || '';

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (connected && tokenId) {
      loadNFTDetails(tokenId);
    }
  }, [connected, tokenId]);

  async function checkConnection() {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setConnected(true);
          setAccount(accounts[0]);
          if (tokenId) {
            await loadNFTDetails(tokenId);
          }
        } else {
          setLoadingNFT(false);
        }
      } else {
        setLoadingNFT(false);
      }
    } catch (error) {
      console.error("Failed to check connection:", error);
      setLoadingNFT(false);
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
        if (tokenId) {
          await loadNFTDetails(tokenId);
        }
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

  async function loadNFTDetails(id: string) {
    setLoadingNFT(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const nftContract = new ethers.Contract(CCY_NFT_ADDRESS, CCYNFTABI, provider);
      
      // 检查是否是NFT的所有者
      const owner = await nftContract.ownerOf(id);
      if (owner.toLowerCase() !== account.toLowerCase()) {
        toast({
          title: "无法上架",
          description: "您不是该NFT的拥有者",
          variant: "destructive",
        });
        return;
      }
      
      // 获取NFT的元数据
      const tokenURI = await nftContract.tokenURI(id);
      
      // 解析元数据
      let metadata = {
        name: `NFT #${id}`,
        description: "No description available",
        image: "https://via.placeholder.com/300"
      };
      
      if (tokenURI) {
        try {
          if (tokenURI.startsWith('data:application/json;base64,')) {
            const base64Data = tokenURI.split(',')[1];
            const jsonString = atob(base64Data);
            const metadataObj = JSON.parse(jsonString);
            metadata = {
              name: metadataObj.name || metadata.name,
              description: metadataObj.description || metadata.description,
              image: metadataObj.image || metadata.image
            };
          } else if (tokenURI.startsWith('ipfs://')) {
            const httpURI = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
            const response = await fetch(httpURI);
            const metadataJson = await response.json();
            metadata = {
              name: metadataJson.name || metadata.name,
              description: metadataJson.description || metadata.description,
              image: metadataJson.image || metadata.image
            };
            
            if (metadata.image.startsWith('ipfs://')) {
              metadata.image = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }
          }
        } catch (error) {
          console.error(`Error fetching metadata for token ${id}:`, error);
        }
      }
      
      setSelectedNFT({
        nftContract: CCY_NFT_ADDRESS,
        tokenId: Number(id),
        owner: account,
        metadata
      });
      
    } catch (error) {
      console.error("Failed to load NFT details:", error);
      toast({
        title: "加载NFT失败",
        description: "无法获取NFT详情",
        variant: "destructive",
      });
    } finally {
      setLoadingNFT(false);
    }
  }
  
  async function listNFT() {
    try {
      if (!price || parseFloat(price) <= 0) {
        toast({
          title: "无效价格",
          description: "请输入有效的价格",
          variant: "destructive",
        });
        return;
      }
      
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // 授权NFT操作权
      const nftContract = new ethers.Contract(CCY_NFT_ADDRESS, CCYNFTABI, signer);
      
      toast({
        title: "授权中",
        description: "请在MetaMask中确认NFT授权",
      });
      
      const approveTx = await nftContract.approve(NFT_MARKET_ADDRESS, tokenId);
      await approveTx.wait();
      
      // 上架NFT
      const weiPrice = ethers.utils.parseEther(price);
      const marketContract = new ethers.Contract(NFT_MARKET_ADDRESS, NFTMarketABI, signer);
      
      toast({
        title: "上架中",
        description: "请在MetaMask中确认上架交易",
      });
      
      const listTx = await marketContract.listNFT(
        CCY_NFT_ADDRESS,
        tokenId,
        CCY_TOKEN_ADDRESS,
        weiPrice
      );
      await listTx.wait();
      
      toast({
        title: "上架成功",
        description: `NFT #${tokenId} 已成功上架`,
      });
      
      // 跳转到市场页
      router.push('/');
      
    } catch (error) {
      console.error("Failed to list NFT:", error);
      toast({
        title: "上架失败",
        description: "无法完成NFT上架",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">上架NFT</h1>
        
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
              <CardTitle>NFT详情</CardTitle>
              <CardDescription>
                确认以下NFT信息
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingNFT ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : !selectedNFT ? (
                <div className="text-center py-10 text-muted-foreground">
                  {tokenId ? "找不到指定NFT" : "请输入NFT ID"}
                </div>
              ) : (
                <div className="space-y-4">
                  <NFTCard 
                    nft={selectedNFT}
                    account={account}
                    mode="view"
                    connected={connected}
                  />
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>上架信息</CardTitle>
              <CardDescription>
                设置上架参数
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tokenId">NFT ID</Label>
                <Input 
                  id="tokenId" 
                  value={tokenId} 
                  onChange={(e) => setTokenId(e.target.value)}
                  placeholder="1"
                  disabled={!!searchParams?.get('tokenId')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">价格 (CCY)</Label>
                <Input 
                  id="price" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="1.0"
                  type="number"
                  min="0"
                  step="0.01"
                />
              </div>
            </CardContent>
            <CardFooter className="flex gap-4">
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">
                  取消
                </Button>
              </Link>
              <Button 
                onClick={listNFT} 
                className="flex-1"
                disabled={loading || loadingNFT || !selectedNFT || !price}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    上架中...
                  </>
                ) : (
                  "上架NFT"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
} 