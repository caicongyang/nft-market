'use client';

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Feather as Ethereum, Tag, ShoppingCart, Loader2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { formatDate, truncateAddress } from '@/lib/utils';

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
}

export interface NFTItem {
  nftContract: string;
  tokenId: number;
  seller?: string;
  owner?: string;
  price?: string;
  listedTime?: number;
  metadata?: NFTMetadata;
}

interface NFTCardProps {
  nft: NFTItem;
  account: string;
  mode?: 'buy' | 'sell' | 'view';
  onBuy?: (nft: NFTItem) => void;
  onList?: (nft: NFTItem) => void;
  onDelist?: (nft: NFTItem) => void;
  connected: boolean;
  loading?: boolean;
}

export function NFTCard({ 
  nft, 
  account, 
  mode = 'buy', 
  onBuy, 
  onList, 
  onDelist, 
  connected,
  loading = false
}: NFTCardProps) {
  const isOwner = account.toLowerCase() === (nft.seller || nft.owner || '').toLowerCase();
  
  // 设置默认值
  const metadata = nft.metadata || {
    name: `NFT #${nft.tokenId}`,
    description: "No description available",
    image: "https://via.placeholder.com/300"
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <div className="aspect-square overflow-hidden relative">
        <img 
          src={metadata.image} 
          alt={metadata.name} 
          className="w-full h-full object-cover transition-transform hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://via.placeholder.com/300?text=No+Image";
          }}
        />
        {nft.price && (
          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-md text-sm font-medium flex items-center">
            <Tag className="h-3.5 w-3.5 mr-1" />
            {nft.price} CCY
          </div>
        )}
      </div>
      <CardHeader className="p-4">
        <CardTitle className="text-lg">{metadata.name}</CardTitle>
        <CardDescription className="h-10 overflow-hidden text-ellipsis">
          {metadata.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-2 text-sm">
          {nft.listedTime && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">上架时间:</span>
              <span>{formatDate(nft.listedTime)}</span>
            </div>
          )}
          {(nft.seller || nft.owner) && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {mode === 'buy' ? '卖家:' : '拥有者:'}
              </span>
              <span className="truncate max-w-[150px]" title={nft.seller || nft.owner}>
                {truncateAddress(nft.seller || nft.owner || '')}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Token ID:</span>
            <span>{nft.tokenId}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {mode === 'buy' && (
          isOwner ? (
            <Button 
              onClick={() => onDelist && onDelist(nft)} 
              variant="destructive" 
              className="w-full"
              disabled={loading || !connected}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  下架中...
                </>
              ) : (
                "下架"
              )}
            </Button>
          ) : (
            <Button 
              onClick={() => onBuy && onBuy(nft)} 
              className="w-full"
              disabled={loading || !connected}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  购买中...
                </>
              ) : (
                "购买"
              )}
            </Button>
          )
        )}
        
        {mode === 'sell' && (
          <Button 
            onClick={() => onList && onList(nft)} 
            className="w-full"
            disabled={loading || !connected}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                处理中...
              </>
            ) : (
              "上架出售"
            )}
          </Button>
        )}
        
        {mode === 'view' && (
          <Button 
            variant="outline" 
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "查看详情"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default NFTCard;