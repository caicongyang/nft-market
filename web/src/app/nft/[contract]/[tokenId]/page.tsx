'use client';

import { useState, useEffect, use } from 'react';
import { ethers } from 'ethers';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart,
  Clock,
  Loader2
} from "lucide-react";
import Image from "next/image";
import CCYNFTABI from '@/lib/abis/CCYNFT.json';
import NFTMarketABI from '@/lib/abis/NFTMarket.json';

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface ParamsType {
  contract: string;
  tokenId: string;
}

interface NFTDetailsPageProps {
  params: ParamsType | Promise<ParamsType>;
}

export default function NFTDetailsPage({ params: paramsPromise }: NFTDetailsPageProps) {
  // 使用React.use()解包params
  const params = paramsPromise instanceof Promise ? use(paramsPromise) : paramsPromise;
  const { contract, tokenId } = params;
  
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [owner, setOwner] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const NFT_MARKET_ADDRESS = process.env.NEXT_PUBLIC_NFT_MARKET_ADDRESS || '';
  
  // 获取NFT元数据和所有权信息
  useEffect(() => {
    async function fetchNFTData() {
      try {
        setLoading(true);
        setError(null);
        
        // 创建只读provider
        let provider: ethers.providers.Provider;
        
        if (window.ethereum) {
          provider = new ethers.providers.Web3Provider(window.ethereum as any);
        } else {
          // 如果没有MetaMask，使用公共RPC
          provider = new ethers.providers.JsonRpcProvider(
            process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-holesky.publicnode.com'
          );
        }
        
        // 连接到NFT合约
        const nftContract = new ethers.Contract(contract, CCYNFTABI, provider);
        
        // 获取TokenURI
        let tokenURI;
        try {
          tokenURI = await nftContract.tokenURI(tokenId);
          console.log("获取到tokenURI:", tokenURI);
        } catch (error) {
          console.error("获取tokenURI失败:", error);
          setError("无法获取NFT元数据，请确认合约地址和Token ID是否正确");
          setLoading(false);
          return;
        }
        
        // 解析元数据
        let metadataObj: NFTMetadata = {
          name: `NFT #${tokenId}`,
          description: "无描述",
          image: ""
        };
        
        if (tokenURI) {
          try {
            if (tokenURI.startsWith('data:application/json;base64,')) {
              // 解析Base64内联数据
              const base64Data = tokenURI.split(',')[1];
              const jsonString = atob(base64Data);
              const parsedMetadata = JSON.parse(jsonString);
              
              metadataObj = {
                name: parsedMetadata.name || metadataObj.name,
                description: parsedMetadata.description || metadataObj.description,
                image: parsedMetadata.image || metadataObj.image,
                attributes: parsedMetadata.attributes || []
              };
            } else if (tokenURI.startsWith('ipfs://')) {
              // 从IPFS获取元数据
              const httpURI = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
              const response = await fetch(httpURI);
              const parsedMetadata = await response.json();
              
              metadataObj = {
                name: parsedMetadata.name || metadataObj.name,
                description: parsedMetadata.description || metadataObj.description,
                image: parsedMetadata.image || metadataObj.image,
                attributes: parsedMetadata.attributes || []
              };
              
              // 确保IPFS图片URL转换为HTTP
              if (metadataObj.image.startsWith('ipfs://')) {
                metadataObj.image = metadataObj.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
              }
            } else if (tokenURI.startsWith('http')) {
              // 直接HTTP URL
              const response = await fetch(tokenURI);
              const parsedMetadata = await response.json();
              
              metadataObj = {
                name: parsedMetadata.name || metadataObj.name,
                description: parsedMetadata.description || metadataObj.description,
                image: parsedMetadata.image || metadataObj.image,
                attributes: parsedMetadata.attributes || []
              };
            }
          } catch (error) {
            console.error("解析元数据失败:", error);
          }
        }
        
        setMetadata(metadataObj);
        
        // 获取所有者
        try {
          const ownerAddress = await nftContract.ownerOf(tokenId);
          setOwner(ownerAddress);
        } catch (error) {
          console.error("获取所有者信息失败:", error);
        }
        
        // 尝试从市场合约获取价格
        try {
          const marketContract = new ethers.Contract(NFT_MARKET_ADDRESS, NFTMarketABI, provider);
          // 使用listedNFTs查询
          const listing = await marketContract.listedNFTs(contract, tokenId);
          
          if (listing && listing.isActive) {
            const priceValue = ethers.utils.formatEther(listing.price);
            setPrice(priceValue);
          }
        } catch (error) {
          console.error("获取价格信息失败:", error);
        }
        
      } catch (error) {
        console.error("加载NFT数据时出错:", error);
        setError("加载NFT数据时出错");
      } finally {
        setLoading(false);
      }
    }
    
    fetchNFTData();
  }, [contract, tokenId, NFT_MARKET_ADDRESS]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-pink-500" />
          <p className="mt-4 text-lg text-gray-600">加载NFT详情...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-4xl mb-4">😢</div>
          <h3 className="text-xl font-bold text-pink-600 mb-2">加载失败</h3>
          <p className="text-gray-600">{error}</p>
          <p className="mt-4 text-sm text-gray-500">
            合约地址: {contract}<br />
            Token ID: {tokenId}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 左侧 - 图片 */}
        <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-pink-200 shadow-lg">
          {metadata?.image ? (
            <Image
              src={metadata.image}
              alt={metadata?.name || `NFT #${tokenId}`}
              fill
              className="object-cover"
              onError={(e) => {
                // 直接隐藏图片并显示文本
                const imgElement = e.currentTarget as HTMLImageElement;
                imgElement.style.display = 'none';
                // 获取父元素并添加文本
                const parent = imgElement.parentElement;
                if (parent) {
                  parent.classList.add('flex', 'items-center', 'justify-center', 'bg-pink-50');
                  const textElement = document.createElement('p');
                  textElement.className = 'text-pink-300 text-xl';
                  textElement.textContent = '图片加载失败';
                  parent.appendChild(textElement);
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-pink-50">
              <p className="text-pink-300 text-xl">没有图片</p>
            </div>
          )}
        </div>

        {/* 右侧 - 详情 */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-pink-600">{metadata?.name || `NFT #${tokenId}`}</h1>
            <Button variant="outline" size="icon" className="text-pink-500">
              <Heart className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              {owner ? `所有者: ${owner.slice(0, 6)}...${owner.slice(-4)}` : '无所有者信息'}
            </span>
          </div>

          {price ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div>
                    <p className="text-sm text-gray-500">当前价格</p>
                    <p className="text-3xl font-bold">{price} CCY</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-gray-500">此NFT目前不在售</p>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="properties">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="properties">属性</TabsTrigger>
              <TabsTrigger value="details">详情</TabsTrigger>
            </TabsList>

            <TabsContent value="properties">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">NFT属性</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  {metadata?.attributes && metadata.attributes.length > 0 ? (
                    metadata.attributes.map((attr, index) => (
                      <div key={index} className="rounded-lg bg-pink-50 p-3">
                        <p className="text-sm text-gray-500">{attr.trait_type}</p>
                        <p className="font-medium text-pink-600">{attr.value}</p>
                      </div>
                    ))
                  ) : (
                    <p className="col-span-2 text-center text-gray-500 py-4">此NFT没有属性</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details">
              <Card>
                <CardContent className="space-y-4 p-6">
                  <div>
                    <h3 className="font-medium">描述</h3>
                    <p className="text-gray-500">{metadata?.description || '没有描述'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">合约地址</h3>
                    <p className="text-gray-500">{contract}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Token ID</h3>
                    <p className="text-gray-500">#{tokenId}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Token标准</h3>
                    <p className="text-gray-500">ERC-721</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 