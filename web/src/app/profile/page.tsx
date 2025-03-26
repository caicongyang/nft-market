'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { NFTCard, NFTItem } from '@/components/nft-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Loader2, Plus, Wallet } from 'lucide-react';
import CCYNFTABI from '@/lib/abis/CCYNFT.json';
import NFTMarketABI from '@/lib/abis/NFTMarket.json';

export default function Profile() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [ownedNFTs, setOwnedNFTs] = useState<NFTItem[]>([]);
  const [listedNFTs, setListedNFTs] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // 缓存系统
  const [metadataCache, setMetadataCache] = useState<Record<string, any>>({});

  const NFT_MARKET_ADDRESS = process.env.NEXT_PUBLIC_NFT_MARKET_ADDRESS || '';
  const CCY_NFT_ADDRESS = process.env.NEXT_PUBLIC_CCY_NFT_ADDRESS || '';

  useEffect(() => {
    // 从本地存储加载缓存的元数据
    const cachedMetadata = localStorage.getItem('nft-metadata-cache');
    if (cachedMetadata) {
      try {
        const parsedCache = JSON.parse(cachedMetadata);
        setMetadataCache(parsedCache);
      } catch (e) {
        console.error("Error loading metadata cache:", e);
      }
    }
    
    checkConnection();
  }, []);

  // 保存元数据到缓存
  useEffect(() => {
    if (Object.keys(metadataCache).length > 0) {
      try {
        localStorage.setItem('nft-metadata-cache', JSON.stringify(metadataCache));
      } catch (e) {
        console.error("Error saving metadata cache:", e);
      }
    }
  }, [metadataCache]);

  // 辅助函数：使用缓存获取元数据或保存到缓存
  function getCachedMetadata(tokenId: number, contractAddress: string): any | null {
    const cacheKey = `${contractAddress}-${tokenId}`;
    return metadataCache[cacheKey] || null;
  }

  function saveCachedMetadata(tokenId: number, contractAddress: string, metadata: any): void {
    const cacheKey = `${contractAddress}-${tokenId}`;
    setMetadataCache(prev => ({
      ...prev,
      [cacheKey]: metadata
    }));
  }

  // 辅助函数: 处理 RPC 调用，包括重试机制
  async function safeRpcCall<T>(
    call: () => Promise<T>, 
    retries = 3, 
    delay = 1000
  ): Promise<T> {
    try {
      return await call();
    } catch (error: any) {
      console.log(`RPC call failed: ${error.message || 'Unknown error'}`);
      if (retries > 0) {
        console.log(`Retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return safeRpcCall(call, retries - 1, delay * 1.5);
      }
      throw error;
    }
  }

  async function checkConnection() {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum as ethers.providers.ExternalProvider);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setConnected(true);
          setAccount(accounts[0]);
          await Promise.all([
            loadBalance(accounts[0]),
            loadOwnedNFTs(accounts[0]),
            loadListedNFTs(accounts[0])
          ]);
        } else {
          setLoading(false);
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
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setConnected(true);
        setAccount(accounts[0]);
        loadBalance(accounts[0]);
        loadOwnedNFTs(accounts[0]);
        loadListedNFTs(accounts[0]);
      } else {
        toast({
          title: "MetaMask未安装",
          description: "请安装MetaMask钱包以使用此功能",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("连接钱包失败:", error);
      toast({
        title: "连接钱包失败",
        description: "无法连接到您的MetaMask钱包",
        variant: "destructive",
      });
    }
  }
  
  async function loadBalance(userAddress: string) {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as ethers.providers.ExternalProvider);
      const balance = await provider.getBalance(userAddress);
      setBalance(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error("Failed to load balance:", error);
    }
  }

  async function loadOwnedNFTs(userAddress: string) {
    setLoading(true);
    try {
      // 先尝试检查链上状态是否正常，如果不正常则提早返回
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum as ethers.providers.ExternalProvider);
        await provider.getNetwork();
      } catch (networkError) {
        console.error("Network error, cannot load NFTs:", networkError);
        toast({
          title: "网络连接错误",
          description: "无法连接到区块链网络，请检查您的网络连接",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      const provider = new ethers.providers.Web3Provider(window.ethereum as ethers.providers.ExternalProvider);
      const nftContract = new ethers.Contract(CCY_NFT_ADDRESS, CCYNFTABI, provider);
      
      // 大幅减少检查的 token 数量，避免 RPC 过载
      const maxTokenIdToCheck = 20; // 减少到 20 个
      const ownedNFTs: NFTItem[] = [];
      
      // 使用更小的批次，减少并发请求
      const batchSize = 3;
      
      for (let batchStart = 1; batchStart <= maxTokenIdToCheck; batchStart += batchSize) {
        try {
          const batchPromises = [];
          
          for (let offset = 0; offset < batchSize && batchStart + offset <= maxTokenIdToCheck; offset++) {
            const tokenId = batchStart + offset;
            batchPromises.push(checkOwnership(nftContract, tokenId, userAddress));
          }
          
          // 等待这一批次的所有查询完成
          const batchResults = await Promise.all(batchPromises);
          
          // 处理结果
          const validNFTs = batchResults.filter(result => result !== null) as NFTItem[];
          ownedNFTs.push(...validNFTs);
        } catch (batchError) {
          console.error(`Error processing batch starting at ${batchStart}:`, batchError);
          // 继续处理下一批，不中断整个循环
        }
        
        // 添加更长的延迟以避免 RPC 限制
        if (batchStart + batchSize <= maxTokenIdToCheck) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 增加到 1 秒
        }
      }
      
      setOwnedNFTs(ownedNFTs);
    } catch (error) {
      console.error("Failed to load owned NFTs:", error);
      toast({
        title: "加载NFT失败",
        description: "无法获取您拥有的NFT，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }
  
  // 辅助函数：检查单个 tokenId 的所有权并获取元数据
  async function checkOwnership(nftContract: ethers.Contract, tokenId: number, userAddress: string): Promise<NFTItem | null> {
    try {
      // 尝试获取这个 tokenId 的所有者
      const owner = await safeRpcCall(async () => {
        try {
          console.log(`检查 Token #${tokenId} 的所有权...`);
          const result = await nftContract.ownerOf(tokenId);
          console.log(`Token #${tokenId} 的所有者: ${result}`);
          console.log(`当前用户: ${userAddress}`);
          return result as string;
        } catch (e) {
          // 捕获特定的合约错误，如 token 不存在
          if (e && (e as any).code === 'CALL_EXCEPTION') {
            // This is normal for non-existent tokens
            console.log(`Token #${tokenId} 不存在`);
            return null;
          }
          throw e; // 重新抛出其他错误
        }
      });
      
      // 如果 owner 为 null 或当前用户不是所有者，直接返回 null
      if (!owner || owner.toLowerCase() !== userAddress.toLowerCase()) {
        if (owner) {
          console.log(`当前用户不是 Token #${tokenId} 的所有者`);
        }
        return null;
      }
      
      console.log(`确认用户是 Token #${tokenId} 的所有者，加载元数据...`);
      // 尝试从缓存获取元数据
      const cachedMetadata = getCachedMetadata(tokenId, CCY_NFT_ADDRESS);
      if (cachedMetadata) {
        return {
          nftContract: CCY_NFT_ADDRESS,
          tokenId: Number(tokenId),
          owner: userAddress,
          metadata: cachedMetadata
        };
      }
      
      // 获取 NFT 元数据
      let metadata = {
        name: `NFT #${tokenId}`,
        description: "No description available",
        image: "https://via.placeholder.com/300"
      };
      
      try {
        const tokenURI = await safeRpcCall(async () => {
          try {
            const result = await nftContract.tokenURI(tokenId);
            return result as string;
          } catch (e) {
            console.error(`Failed to get tokenURI for token ${tokenId}:`, e);
            return null;
          }
        });
        
        if (tokenURI) {
          if (typeof tokenURI === 'string' && tokenURI.startsWith('data:application/json;base64,')) {
            try {
              const base64Data = tokenURI.split(',')[1];
              const jsonString = atob(base64Data);
              const metadataObj = JSON.parse(jsonString);
              metadata = {
                name: metadataObj.name || metadata.name,
                description: metadataObj.description || metadata.description,
                image: metadataObj.image || metadata.image
              };
            } catch (parseError) {
              console.error(`Error parsing base64 metadata for token ${tokenId}:`, parseError);
            }
          } else if (typeof tokenURI === 'string' && tokenURI.startsWith('ipfs://')) {
            const httpURI = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 3000);
              
              const response = await fetch(httpURI, { 
                signal: controller.signal 
              });
              
              clearTimeout(timeoutId);
              
              if (response.ok) {
                const metadataJson = await response.json();
                metadata = {
                  name: metadataJson.name || metadata.name,
                  description: metadataJson.description || metadata.description,
                  image: metadataJson.image || metadata.image
                };
                
                if (metadata.image && typeof metadata.image === 'string' && metadata.image.startsWith('ipfs://')) {
                  metadata.image = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
                }
              }
            } catch (fetchError) {
              console.error(`Error fetching IPFS metadata for token ${tokenId}:`, fetchError);
            }
          }
        }
        
        // 保存元数据到缓存
        saveCachedMetadata(tokenId, CCY_NFT_ADDRESS, metadata);
      } catch (metadataError) {
        console.error(`Error getting tokenURI for token ${tokenId}:`, metadataError);
      }
      
      // 返回 NFT 项
      return {
        nftContract: CCY_NFT_ADDRESS,
        tokenId: Number(tokenId),
        owner: userAddress,
        metadata
      };
    } catch (error) {
      console.error(`Error checking ownership for token ${tokenId}:`, error);
      return null;
    }
  }

  async function loadListedNFTs(userAddress: string) {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as ethers.providers.ExternalProvider);
      const marketContract = new ethers.Contract(NFT_MARKET_ADDRESS, NFTMarketABI, provider);
      
      // 获取所有活跃上架的 NFT
      const allListings = await marketContract.getAllActiveListings();
      const userListings = allListings.filter(
        (listing: any) => listing.seller.toLowerCase() === userAddress.toLowerCase()
      );
      
      // 如果没有上架的 NFT，直接返回空数组
      if (userListings.length === 0) {
        setListedNFTs([]);
        return;
      }
      
      const listedNFTsData: NFTItem[] = [];
      // 批量处理，每批 5 个 NFT
      const batchSize = 5;
      
      for (let i = 0; i < userListings.length; i += batchSize) {
        const batch = userListings.slice(i, Math.min(i + batchSize, userListings.length));
        const batchPromises = batch.map((listing: any) => fetchNFTMetadata(listing, provider, userAddress));
        
        // 等待当前批次完成
        const batchResults = await Promise.all(batchPromises);
        listedNFTsData.push(...batchResults);
        
        // 添加延迟以避免 RPC 限制
        if (i + batchSize < userListings.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      setListedNFTs(listedNFTsData);
    } catch (error) {
      console.error("Failed to load listed NFTs:", error);
      toast({
        title: "加载上架NFT失败",
        description: "无法获取您上架的NFT，请稍后再试",
        variant: "destructive",
      });
    }
  }
  
  // 辅助函数：获取单个上架 NFT 的元数据
  async function fetchNFTMetadata(listing: any, provider: ethers.providers.Web3Provider, userAddress: string): Promise<NFTItem> {
    const contractAddress = listing.nftContract;
    const tokenId = listing.tokenId.toNumber();
    const price = ethers.utils.formatEther(listing.price);
    const paymentToken = listing.paymentToken;
    
    // 尝试从缓存获取元数据
    const cachedMetadata = getCachedMetadata(tokenId, contractAddress);
    if (cachedMetadata) {
      return {
        nftContract: contractAddress,
        tokenId: tokenId,
        owner: userAddress,
        price,
        metadata: cachedMetadata
      } as NFTItem;
    }
    
    const nftContract = new ethers.Contract(contractAddress, CCYNFTABI, provider);
    let metadata = {
      name: `NFT #${tokenId}`,
      description: "No description available",
      image: "https://via.placeholder.com/300"
    };
    
    try {
      const tokenURI = await safeRpcCall(async () => {
        try {
          const result = await nftContract.tokenURI(tokenId);
          return result as string;
        } catch (e) {
          console.error(`Failed to get tokenURI for listed token ${tokenId}:`, e);
          return null;
        }
      });
      
      if (tokenURI) {
        if (typeof tokenURI === 'string' && tokenURI.startsWith('data:application/json;base64,')) {
          try {
            const base64Data = tokenURI.split(',')[1];
            const jsonString = atob(base64Data);
            const metadataObj = JSON.parse(jsonString);
            metadata = {
              name: metadataObj.name || metadata.name,
              description: metadataObj.description || metadata.description,
              image: metadataObj.image || metadata.image
            };
          } catch (parseError) {
            console.error(`Error parsing base64 metadata for listed token ${tokenId}:`, parseError);
          }
        } else if (typeof tokenURI === 'string' && tokenURI.startsWith('ipfs://')) {
          const httpURI = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(httpURI, { 
              signal: controller.signal 
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              const metadataJson = await response.json();
              metadata = {
                name: metadataJson.name || metadata.name,
                description: metadataJson.description || metadata.description,
                image: metadataJson.image || metadata.image
              };
              
              if (metadata.image && typeof metadata.image === 'string' && metadata.image.startsWith('ipfs://')) {
                metadata.image = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
              }
            }
          } catch (fetchError) {
            console.error(`Error fetching IPFS metadata for listed token ${tokenId}:`, fetchError);
          }
        }
      }
      
      // 保存元数据到缓存
      saveCachedMetadata(tokenId, contractAddress, metadata);
    } catch (error) {
      console.error(`Error getting metadata for listed token ${tokenId}:`, error);
    }
    
    return {
      nftContract: contractAddress,
      tokenId: tokenId,
      owner: userAddress,
      price,
      metadata
    } as NFTItem;
  }
  
  async function delistNFT(nft: NFTItem) {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as ethers.providers.ExternalProvider);
      const signer = provider.getSigner();
      
      toast({
        title: "下架中",
        description: "请在MetaMask中确认下架NFT",
      });
      
      const marketContract = new ethers.Contract(NFT_MARKET_ADDRESS, NFTMarketABI, signer);
      const transaction = await marketContract.delistNFT(nft.nftContract, nft.tokenId);
      await transaction.wait();
      
      toast({
        title: "下架成功",
        description: `你已成功下架 NFT #${nft.tokenId}`,
      });
      
      // 重新加载列表
      await loadListedNFTs(account);
    } catch (error) {
      console.error("Failed to delist NFT:", error);
      toast({
        title: "下架失败",
        description: "无法完成NFT下架",
        variant: "destructive",
      });
    }
  }
  
  function navigateToList(nft: NFTItem) {
    window.location.href = `/list?tokenId=${nft.tokenId}`;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">我的NFT</h1>
        
        {!connected ? (
          <Button onClick={connectWallet} className="flex items-center">
            <Wallet className="mr-2 h-4 w-4" />
            连接钱包
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
              余额: {parseFloat(balance).toFixed(4)} ETH
            </div>
            <Link href="/mint">
              <Button size="sm" variant="outline">
                <Plus className="mr-1 h-4 w-4" />
                铸造新NFT
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      {!connected ? (
        <div className="text-center py-16 border rounded-lg bg-muted/20">
          <h3 className="text-xl mb-4">请先连接您的钱包</h3>
          <Button onClick={connectWallet}>连接钱包</Button>
        </div>
      ) : (
        <Tabs defaultValue="owned" className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-md mb-6">
            <TabsTrigger value="owned">我拥有的</TabsTrigger>
            <TabsTrigger value="listed">我上架的</TabsTrigger>
          </TabsList>
          
          <TabsContent value="owned">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : ownedNFTs.length === 0 ? (
              <div className="text-center py-16 border rounded-lg bg-muted/20">
                <h3 className="text-xl mb-2">您还没有拥有任何NFT</h3>
                <p className="text-muted-foreground mb-4">铸造您的第一个NFT开始收藏</p>
                <Link href="/mint">
                  <Button>
                    <Plus className="mr-1 h-4 w-4" />
                    铸造NFT
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {ownedNFTs.map((nft) => (
                  <NFTCard 
                    key={`${nft.nftContract}-${nft.tokenId}`}
                    nft={nft}
                    account={account}
                    mode="sell"
                    onList={navigateToList}
                    connected={connected}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="listed">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : listedNFTs.length === 0 ? (
              <div className="text-center py-16 border rounded-lg bg-muted/20">
                <h3 className="text-xl mb-2">您还没有上架任何NFT</h3>
                <p className="text-muted-foreground mb-4">上架您的NFT开始销售</p>
                <Link href="/list">
                  <Button>
                    <Plus className="mr-1 h-4 w-4" />
                    上架NFT
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {listedNFTs.map((nft) => (
                  <NFTCard 
                    key={`${nft.nftContract}-${nft.tokenId}`}
                    nft={nft}
                    account={account}
                    mode="buy"
                    onDelist={delistNFT}
                    connected={connected}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}