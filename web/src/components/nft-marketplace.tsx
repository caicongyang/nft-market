'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { NFTCard, NFTItem, NFTMetadata } from '@/components/nft-card';
import NFTMarketABI from '@/lib/abis/NFTMarket.json';
import CCYNFTABI from '@/lib/abis/CCYNFT.json';
import CCYTokenABI from '@/lib/abis/CCYToken.json';
import { Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, usePublicClient, useWalletClient, useNetwork } from 'wagmi';
import { Signer } from 'ethers';

export default function NFTMarketplace() {
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOperation, setLoadingOperation] = useState<string | null>(null);
  const { toast } = useToast();

  // Rainbow Kit hooks
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  const NFT_MARKET_ADDRESS = process.env.NEXT_PUBLIC_NFT_MARKET_ADDRESS || '';
  const CCY_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_CCY_TOKEN_ADDRESS || '';
  const CCY_NFT_ADDRESS = process.env.NEXT_PUBLIC_CCY_NFT_ADDRESS || '';

  useEffect(() => {
    if (walletClient && isConnected) {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const ethSigner = provider.getSigner();
      setSigner(ethSigner);
    } else {
      setSigner(null);
    }
  }, [walletClient, isConnected]);

  useEffect(() => {
    // 当钱包连接状态或地址变化时加载NFT
    if (isConnected) {
      loadNFTs();
    } else {
      // 即使没有连接钱包也尝试加载NFT
      loadNFTs();
    }
  }, [isConnected, address, chain]);

  async function loadNFTs() {
    setLoading(true);
    
    try {
      // 详细日志
      console.log("开始加载 NFTs");
      console.log("使用合约地址:", NFT_MARKET_ADDRESS);
      console.log("当前链ID:", chain?.id);
      console.log("当前账户:", address);
      
      // 创建ethers provider
      let ethersProvider;
      if (window.ethereum) {
        // 如果有window.ethereum，使用它创建provider
        ethersProvider = new ethers.providers.Web3Provider(window.ethereum as any);
      } else {
        console.log("使用默认provider");
        // 如果没有连接钱包，使用ethers默认provider
        ethersProvider = new ethers.providers.JsonRpcProvider();
      }
      
      // 创建合约实例
      const contract = new ethers.Contract(
        NFT_MARKET_ADDRESS,
        NFTMarketABI,
        ethersProvider
      );
      console.log("合约实例已创建");
      
      try {
        // 先尝试获取总上架数量
        const nftContractsCount = await contract.getNFTContractsCount();
        console.log("合约数量:", nftContractsCount.toString());
      } catch (e) {
        console.error("获取合约数量失败:", e);
      }
      
      // 获取所有上架的NFT
      console.log("尝试获取所有上架的NFT");
      const listings = await contract.getAllActiveListings();
      console.log("获取到的上架NFT:", listings);
      
      // 处理每个NFT的数据
      const nftItems: NFTItem[] = await Promise.all(listings.map(async (item: any) => {
        // 创建NFT合约实例获取元数据
        const nftContract = new ethers.Contract(item.nftContract, CCYNFTABI, ethersProvider);
        let tokenURI;
        try {
          tokenURI = await nftContract.tokenURI(item.tokenId);
        } catch (error) {
          console.error(`Error fetching tokenURI for token ${item.tokenId}:`, error);
          tokenURI = '';
        }
        
        // 解析元数据
        let metadata: NFTMetadata = {
          name: `NFT #${item.tokenId}`,
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
              tokenURI = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
              const metadataResponse = await fetch(tokenURI);
              const metadataJson = await metadataResponse.json();
              metadata = {
                name: metadataJson.name || metadata.name,
                description: metadataJson.description || metadata.description,
                image: metadataJson.image || metadata.image
              };
            } else {
              try {
                const metadataResponse = await fetch(tokenURI);
                const metadataJson = await metadataResponse.json();
                metadata = {
                  name: metadataJson.name || metadata.name,
                  description: metadataJson.description || metadata.description,
                  image: metadataJson.image || metadata.image
                };
              } catch (error) {
                console.error(`Failed to fetch metadata from URI: ${tokenURI}`, error);
              }
            }
            
            // 如果图片是IPFS链接，转换为HTTP URL
            if (metadata.image.startsWith('ipfs://')) {
              metadata.image = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }
          } catch (error) {
            console.error(`Error fetching metadata for token ${item.tokenId}:`, error);
          }
        }
        
        // 格式化价格
        const price = ethers.utils.formatUnits(item.price, 18);
        
        return {
          nftContract: item.nftContract,
          tokenId: item.tokenId.toNumber(),
          seller: item.seller,
          paymentToken: item.paymentToken,
          price: price,
          listedTime: item.listedTime.toNumber(),
          metadata
        };
      }));
      
      setNfts(nftItems);
    } catch (error: any) {
      console.error("加载 NFTs 时出错:", error);
      // 更详细的错误分析
      if (error.code === "CALL_EXCEPTION") {
        console.error("合约调用异常 - 可能原因:");
        console.error("1. 合约地址错误");
        console.error("2. 网络连接问题");
        console.error("3. 函数不存在");
        console.error("4. 权限问题");
      }
      toast({
        title: "加载NFT失败",
        description: "无法获取上架的NFT列表",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }
  
  async function buyNFT(nft: NFTItem) {
    if (!isConnected || !signer) {
      toast({
        title: "请先连接钱包",
        description: "您需要连接钱包才能购买NFT",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoadingOperation(`buying-${nft.tokenId}`);
      
      // 使用状态中的signer
      const tokenContract = new ethers.Contract(CCY_TOKEN_ADDRESS, CCYTokenABI, signer);
      const weiPrice = ethers.utils.parseEther(nft.price || '0');
      
      toast({
        title: "授权中",
        description: "请在钱包中确认授权CCY代币",
      });
      
      const approveTx = await tokenContract.approve(NFT_MARKET_ADDRESS, weiPrice);
      await approveTx.wait();
      
      // 购买NFT
      toast({
        title: "购买中",
        description: "请在钱包中确认购买NFT",
      });
      
      const marketContract = new ethers.Contract(NFT_MARKET_ADDRESS, NFTMarketABI, signer);
      const transaction = await marketContract.buyNFT(nft.nftContract, nft.tokenId);
      await transaction.wait();
      
      toast({
        title: "购买成功",
        description: `你已成功购买 ${nft.metadata?.name || `NFT #${nft.tokenId}`}`,
      });
      
      // 重新加载NFT列表
      await loadNFTs();
    } catch (error) {
      console.error("Failed to buy NFT:", error);
      toast({
        title: "购买失败",
        description: "无法完成NFT购买",
        variant: "destructive",
      });
    } finally {
      setLoadingOperation(null);
    }
  }
  
  async function delistNFT(nft: NFTItem) {
    if (!isConnected || !signer) {
      toast({
        title: "请先连接钱包",
        description: "您需要连接钱包才能下架NFT",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoadingOperation(`delisting-${nft.tokenId}`);
      
      toast({
        title: "下架中",
        description: "请在钱包中确认下架NFT",
      });
      
      const marketContract = new ethers.Contract(NFT_MARKET_ADDRESS, NFTMarketABI, signer);
      const transaction = await marketContract.delistNFT(nft.nftContract, nft.tokenId);
      await transaction.wait();
      
      toast({
        title: "下架成功",
        description: `你已成功下架 ${nft.metadata?.name || `NFT #${nft.tokenId}`}`,
      });
      
      // 重新加载NFT列表
      await loadNFTs();
    } catch (error) {
      console.error("Failed to delist NFT:", error);
      toast({
        title: "下架失败",
        description: "无法完成NFT下架",
        variant: "destructive",
      });
    } finally {
      setLoadingOperation(null);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">NFT 市场</h1>
          {!loading && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={loadNFTs} 
              className="ml-2"
              title="刷新"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* 替换成RainbowKit的ConnectButton */}
          <ConnectButton />
          
          {isConnected && (
            <Link href="/list">
              <Button size="sm" variant="outline">上架NFT</Button>
            </Link>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 gap-3">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">加载上架的NFT...</p>
        </div>
      ) : nfts.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-muted/20">
          <h3 className="text-xl mb-2">目前没有NFT上架</h3>
          <p className="text-muted-foreground mb-4">连接钱包后可以上架您的NFT</p>
          {isConnected && (
            <Link href="/list">
              <Button>上架我的NFT</Button>
            </Link>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <p className="text-muted-foreground">找到 {nfts.length} 个上架的NFT</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {nfts.map((nft) => (
              <NFTCard 
                key={`${nft.nftContract}-${nft.tokenId}`}
                nft={nft}
                account={address || ''}
                mode="buy"
                onBuy={(n) => buyNFT(n)}
                onDelist={(n) => delistNFT(n)}
                connected={isConnected}
                loading={loadingOperation === `buying-${nft.tokenId}` || loadingOperation === `delisting-${nft.tokenId}`}
              />
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-12 border-t pt-6">
        <h2 className="text-2xl font-bold mb-4">使用指南</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2">1. 连接钱包</h3>
            <p className="text-muted-foreground">点击右上角的"Connect Wallet"按钮，选择您的钱包类型进行连接</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2">2. 浏览NFT</h3>
            <p className="text-muted-foreground">在市场中查看所有上架的NFT，包含价格、上架时间和卖家信息</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2">3. 购买或下架</h3>
            <p className="text-muted-foreground">使用CCY代币购买喜欢的NFT，或下架自己上架的NFT</p>
          </div>
        </div>
      </div>
    </div>
  );
} 