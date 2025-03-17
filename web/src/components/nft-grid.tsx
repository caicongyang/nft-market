'use client';

import { NFTCard } from "./nft-card";

const MOCK_NFTS = [
  {
    id: "1",
    name: "Abstract Art #1",
    description: "A beautiful piece of abstract art",
    image: "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8",
    price: "0.1",
    owner: "0x1234...5678",
  },
  {
    id: "2",
    name: "Digital Landscape #2",
    description: "A stunning digital landscape",
    image: "https://images.unsplash.com/photo-1569437061241-a848be43cc82",
    price: "0.2",
    owner: "0x8765...4321",
  },
];

export function NFTGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {MOCK_NFTS.map((nft) => (
        <NFTCard key={nft.id} nft={nft} mode="buy" />
      ))}
    </div>
  );
}