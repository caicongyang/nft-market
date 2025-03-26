'use client';

import Image from 'next/image';
import Link from 'next/link';
import { NFTItem } from '@/hooks/useMarketNFTs';

interface NFTCardProps {
  nft: NFTItem;
}

export function NFTCard({ nft }: NFTCardProps) {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg border-2 border-pink-200 transition duration-300 hover:shadow-xl hover:scale-105 h-full flex flex-col">
      <div className="h-48 relative overflow-hidden bg-pink-100">
        <Image 
          src={nft.imageUrl}
          alt={nft.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P//fwAJCAMZZaB/BAAAAABJRU5ErkJggg=="
          onError={(e) => {
            const imgElement = e.currentTarget as HTMLImageElement;
            imgElement.src = "/images/placeholder-nft.jpg";
            imgElement.onerror = null;
          }}
        />
      </div>
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="font-bold text-lg text-pink-600 truncate">{nft.name}</h3>
        <p className="text-gray-500 text-sm h-10 overflow-hidden">{nft.description}</p>
        <div className="mt-auto pt-3 flex justify-between items-center">
          <span className="text-pink-500 font-medium">{nft.price} CCY</span>
          <Link 
            href={`/nft/${nft.nftContract}/${nft.tokenId}`}
            className="px-3 py-1 bg-pink-100 text-pink-500 rounded hover:bg-pink-200 transition text-sm"
          >
            查看详情
          </Link>
        </div>
      </div>
    </div>
  );
} 