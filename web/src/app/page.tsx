'use client';

import { NFTGrid } from "@/components/nft-grid";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">NFT Marketplace</h1>
        <Link href="/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create NFT
          </Button>
        </Link>
      </div>
      <NFTGrid />
    </div>
  );
}