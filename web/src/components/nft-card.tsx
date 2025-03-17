'use client';

import Image from "next/image";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Feather as Ethereum, Tag, ShoppingCart } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface NFTCardProps {
  nft: {
    id: string;
    name: string;
    description: string;
    image: string;
    price: string;
    owner: string;
  };
  mode?: 'buy' | 'sell';
}

export function NFTCard({ nft, mode = 'buy' }: NFTCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async () => {
    try {
      setIsLoading(true);
      if (mode === 'buy') {
        // TODO: Implement buy logic
        console.log('Buying NFT:', nft.id);
      } else {
        // TODO: Implement sell logic
        console.log('Listing NFT for sale:', nft.id);
      }
    } catch (error) {
      console.error(`Error ${mode === 'buy' ? 'buying' : 'selling'} NFT:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link href={`/nft/${nft.id}`} className="block transition-transform hover:scale-[1.02]">
      <Card className="overflow-hidden">
        <CardHeader className="p-0">
          <div className="relative aspect-square">
            <Image
              src={nft.image}
              alt={nft.name}
              fill
              className="object-cover"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="mb-2">{nft.name}</CardTitle>
          <p className="text-sm text-gray-500">{nft.description}</p>
        </CardContent>
        <CardFooter className="flex items-center justify-between p-4 pt-0">
          <div className="flex items-center">
            <Ethereum className="mr-1 h-4 w-4" />
            <span>{nft.price} ETH</span>
          </div>
          <Button 
            onClick={(e) => {
              e.preventDefault(); // 防止触发 Link 跳转
              handleAction();
            }}
            disabled={isLoading}
            variant={mode === 'buy' ? 'default' : 'outline'}
          >
            {mode === 'buy' ? (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                {isLoading ? 'Processing...' : 'Buy Now'}
              </>
            ) : (
              <>
                <Tag className="mr-2 h-4 w-4" />
                {isLoading ? 'Listing...' : 'Sell'}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}