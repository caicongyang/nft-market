'use client';

import { NFTCard } from "@/components/nft-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";

const MY_NFTS = [
  {
    id: "1",
    name: "Abstract Art #1",
    description: "A beautiful piece of abstract art",
    image: "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8",
    price: "0.1",
    owner: "0x1234...5678",
  },
];

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">My NFTs</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="mr-2 h-5 w-5" />
            Wallet Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Connected Address: 0x1234...5678</p>
          <p className="text-sm text-gray-500">Balance: 1.5 ETH</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {MY_NFTS.map((nft) => (
          <NFTCard key={nft.id} nft={nft} mode="sell" />
        ))}
      </div>
    </div>
  );
}