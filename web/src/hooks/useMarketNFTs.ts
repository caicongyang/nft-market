'use client';

import { useState, useEffect } from 'react';
import { useContractRead, useAccount } from 'wagmi';
import NFTMarketABI from '@/lib/abis/NFTMarket.json';
import CCYNFTABI from '@/lib/abis/CCYNFT.json';
import { parseError } from '@/lib/blockchain';
import { ethers } from 'ethers';

export interface NFTItem {
  nftContract: string;
  tokenId: number;
  seller: string;
  price: number;
  imageUrl: string;
  name: string;
  description: string;
}

export function useMarketNFTs() {
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isConnected } = useAccount();

  const nftMarketAddress = process.env.NEXT_PUBLIC_NFT_MARKET_ADDRESS || '';
  const ccyNftAddress = process.env.NEXT_PUBLIC_CCY_NFT_ADDRESS || '';
  
  // RPC URL - 使用您的网络的公共RPC（推荐确保在环境变量中设置）
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-holesky.publicnode.com';

  // 从市场合约获取所有活跃的NFT列表
  const { data: listedNFTs, isError, isLoading: isLoadingNFTs } = useContractRead({
    address: nftMarketAddress as `0x${string}`,
    abi: NFTMarketABI,
    functionName: 'getAllActiveListings',
    watch: true,
    enabled: true, // 总是启用，不再依赖于钱包连接
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchNFTDetails() {
      if (isLoadingNFTs) {
        setIsLoading(true);
        return;
      }

      if (isError || !listedNFTs) {
        if (isMounted) {
          setIsLoading(false);
          setError('无法加载市场NFT数据');
        }
        return;
      }

      try {
        if (isMounted) setIsLoading(true);
        
        // 创建只读provider - 不需要钱包连接
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        
        // 过滤出CCYNFT合约的NFT
        let ccyNfts = [];
        try {
          ccyNfts = (listedNFTs as any[]).filter(
            (nft) => nft.nftContract.toLowerCase() === ccyNftAddress.toLowerCase() && nft.isActive
          );
        } catch (filterError) {
          console.error("过滤NFT列表失败:", filterError);
          ccyNfts = [];
        }
        
        if (ccyNfts.length === 0) {
          if (isMounted) {
            setNfts([]);
            setError(null);
            setIsLoading(false);
          }
          return;
        }
        
        // 创建一个临时数组来存储带有完整详情的NFT
        const nftsWithDetails: NFTItem[] = [];
        
        // 限制只处理最多8个NFT以提高性能
        const nftsToProcess = ccyNfts.slice(0, 8);
        
        // 创建合约实例
        const nftContract = new ethers.Contract(ccyNftAddress, CCYNFTABI, provider);
        
        for (const nft of nftsToProcess) {
          try {
            const tokenId = Number(nft.tokenId);
            const price = Number(nft.price) / 1e18;
            
            // 添加重试逻辑
            let tokenURI = null;
            let retryCount = 0;
            const maxRetries = 3;
            
            while (retryCount < maxRetries && tokenURI === null) {
              try {
                tokenURI = await nftContract.tokenURI(tokenId);
                break;
              } catch (tokenURIError) {
                console.error(`获取tokenURI失败 (尝试 ${retryCount + 1}/${maxRetries}):`, tokenURIError);
                retryCount++;
                
                if (retryCount < maxRetries) {
                  // 指数退避策略
                  const delay = Math.pow(2, retryCount) * 500;
                  await new Promise(resolve => setTimeout(resolve, delay));
                }
              }
            }
            
            // 解析元数据
            let metadata = {
              name: `可爱女儿 #${tokenId}`,
              description: '这是一个独特的可爱女儿NFT收藏品',
              image: '/images/placeholder-nft.jpg'
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
            } else {
              console.log(`无法获取Token #${tokenId}的元数据，使用默认值`);
            }
            
            // 创建NFT项
            const nftItem: NFTItem = {
              nftContract: nft.nftContract,
              tokenId,
              seller: nft.seller,
              price,
              imageUrl: metadata.image,
              name: metadata.name,
              description: metadata.description,
            };
            
            nftsWithDetails.push(nftItem);
          } catch (err) {
            console.error('获取NFT详情时出错:', err);
          }
        }
        
        // 更新状态 - 添加防抖逻辑
        if (isMounted) {
          // 使用setTimeout避免频繁更新
          setTimeout(() => {
            if (isMounted) {
              setNfts(nftsWithDetails);
              setError(null);
              setIsLoading(false);
            }
          }, 100);
        }
      } catch (err) {
        console.error('获取NFT数据时出错:', err);
        if (isMounted) {
          setError(parseError(err) || '获取NFT数据失败');
          setIsLoading(false);
        }
      }
    }

    fetchNFTDetails();

    // 清理函数
    return () => {
      isMounted = false;
    };
  }, [listedNFTs, isError, ccyNftAddress, isLoadingNFTs, rpcUrl]);

  return { nfts, isLoading, error };
} 