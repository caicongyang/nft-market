'use client';

import { useState, useEffect } from 'react';
import { useContractRead, useAccount } from 'wagmi';
import NFTMarketABI from '@/lib/abis/NFTMarket.json';
import CCYNFTABI from '@/lib/abis/CCYNFT.json';
import { parseError } from '@/lib/blockchain';

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

  // 从市场合约获取所有活跃的NFT列表
  const { data: listedNFTs, isError, isLoading: isLoadingNFTs } = useContractRead({
    address: nftMarketAddress as `0x${string}`,
    abi: NFTMarketABI,
    functionName: 'getAllActiveListings',
    watch: true,
  });

  useEffect(() => {
    async function fetchNFTDetails() {
      if (!isConnected || !listedNFTs || isError) {
        setIsLoading(false);
        if (isError) setError('无法加载市场NFT数据');
        return;
      }

      try {
        setIsLoading(true);
        
        // 过滤出CCYNFT合约的NFT
        const ccyNfts = (listedNFTs as any[]).filter(
          (nft) => nft.nftContract.toLowerCase() === ccyNftAddress.toLowerCase() && nft.isActive
        );
        
        // 创建一个临时数组来存储带有完整详情的NFT
        const nftsWithDetails: NFTItem[] = [];
        
        // 限制只处理最多8个NFT以提高性能
        const nftsToProcess = ccyNfts.slice(0, 8);
        
        for (const nft of nftsToProcess) {
          try {
            // 模拟从链上获取NFT元数据
            // 在实际应用中，您需要调用tokenURI函数并获取IPFS/HTTP数据
            // 这里我们使用一个简单化版本
            
            const tokenId = Number(nft.tokenId);
            const price = Number(nft.price) / 1e18; // 将wei转换为以太单位
            
            // 创建NFT项
            const nftItem: NFTItem = {
              nftContract: nft.nftContract,
              tokenId,
              seller: nft.seller,
              price,
              imageUrl: `https://via.placeholder.com/300x300?text=可爱女儿${tokenId}`,
              name: `可爱女儿 #${tokenId}`,
              description: '这是一个独特的可爱女儿NFT收藏品',
            };
            
            nftsWithDetails.push(nftItem);
          } catch (err) {
            console.error('获取NFT详情时出错:', err);
          }
        }
        
        // 更新状态
        setNfts(nftsWithDetails);
        setError(null);
      } catch (err) {
        console.error('获取NFT数据时出错:', err);
        setError(parseError(err) || '获取NFT数据失败');
      } finally {
        setIsLoading(false);
      }
    }

    fetchNFTDetails();
  }, [listedNFTs, isConnected, isError, ccyNftAddress]);

  return { nfts, isLoading, error };
} 