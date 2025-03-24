'use client';

import { NFTGrid } from "@/components/nft-grid";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import NFTMarketplace from '@/components/nft-marketplace';

export default function Home() {
  return (
    <main>
      <NFTMarketplace />
    </main>
  );
}