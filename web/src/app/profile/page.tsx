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

  const NFT_MARKET_ADDRESS = process.env.NEXT_PUBLIC_NFT_MARKET_ADDRESS || '';
  const CCY_NFT_ADDRESS = process.env.NEXT_PUBLIC_CCY_NFT_ADDRESS || '';

  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
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
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setConnected(true);
        setAccount(accounts[0]);
        toast({
          title: "钱包已连接",
          description: `连接到账户: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
        await Promise.all([
          loadBalance(accounts[0]),
          loadOwnedNFTs(accounts[0]),
          loadListedNFTs(accounts[0])
        ]);
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
  
  async function loadBalance(userAddress: string) {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balance = await provider.getBalance(userAddress);
      setBalance(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error("Failed to load balance:", error);
    }
  }

  async function loadOwnedNFTs(userAddress: string) {
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const nftContract = new ethers.Contract(CCY_NFT_ADDRESS, CCYNFTABI, provider);
      
      // 查询用户拥有的 NFT 总数
      const balance = await nftContract.balanceOf(userAddress);
      
      const ownedNFTs: NFTItem[] = [];
      
      // 获取每个 NFT 的信息
      for (let i = 0; i < balance; i++) {
        try {
          const tokenId = await nftContract.tokenOfOwnerByIndex(userAddress, i);
          const tokenURI = await nftContract.tokenURI(tokenId);
          
          // 解析元数据
          let metadata = {
            name: `NFT #${tokenId}`,
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
              console.error(`Error fetching metadata for token ${tokenId}:`, error);
            }
          }
          
          ownedNFTs.push({
            nftContract: CCY_NFT_ADDRESS,
            tokenId: Number(tokenId),
            owner: userAddress,
            metadata
          });
        } catch (error) {
          console.error(`Error loading NFT:`, error);
        }
      }
      
      setOwnedNFTs(ownedNFTs);
    } catch (error) {
      console.error("Failed to load owned NFTs:", error);
      toast({
        title: "加载NFT失败",
        description: "无法获取您拥有的NFT",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadListedNFTs(userAddress: string) {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const marketContract = new ethers.Contract(NFT_MARKET_ADDRESS, NFTMarketABI, provider);
      
      // 获取所有上架的NFT
      const allListings = await marketContract.getAllActiveListings();
      
      // 过滤出用户自己上架的NFT
      const userListings = allListings.filter(
        (item: any) => item.seller.toLowerCase() === userAddress.toLowerCase()
      );
      
      const listedNFTItems: NFTItem[] = await Promise.all(userListings.map(async (item: any) => {
        // 创建NFT合约实例获取元数据
        const nftContract = new ethers.Contract(item.nftContract, CCYNFTABI, provider);
        let tokenURI;
        try {
          tokenURI = await nftContract.tokenURI(item.tokenId);
        } catch (error) {
          console.error(`Error fetching tokenURI for token ${item.tokenId}:`, error);
          tokenURI = '';
        }
        
        // 解析元数据
        let metadata = {
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
              
              if (metadata.image.startsWith('ipfs://')) {
                metadata.image = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
              }
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
          price: price,
          listedTime: item.listedTime.toNumber(),
          metadata
        };
      }));
      
      setListedNFTs(listedNFTItems);
    } catch (error) {
      console.error("Failed to load listed NFTs:", error);
    }
  }
  
  async function delistNFT(nft: NFTItem) {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
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