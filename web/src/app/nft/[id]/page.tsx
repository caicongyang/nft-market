'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  History, 
  BarChart2, 
  Users, 
  Heart,
  Clock,
  Tag,
  Share2
} from "lucide-react";
import Image from "next/image";

interface Transaction {
  type: string;
  price: string;
  from: string;
  to: string;
  date: string;
}

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    type: "Sale",
    price: "0.5 ETH",
    from: "0x1234...5678",
    to: "0x8765...4321",
    date: "2024-02-20"
  },
  {
    type: "Transfer",
    price: "-",
    from: "0x9876...5432",
    to: "0x1234...5678",
    date: "2024-02-15"
  }
];

export default function NFTDetailsPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column - Image */}
        <div className="relative aspect-square rounded-xl overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8"
            alt="NFT Image"
            fill
            className="object-cover"
          />
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold">Abstract Art #1</h1>
            <Button variant="outline" size="icon">
              <Heart className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              Listed 2 days ago
            </span>
            <span className="flex items-center">
              <Users className="mr-1 h-4 w-4" />
              42 views
            </span>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Current Price</p>
                  <p className="text-3xl font-bold">0.5 ETH</p>
                  <p className="text-sm text-gray-500">≈ $1,234.56 USD</p>
                </div>
                <div className="space-x-4">
                  <Button>
                    <Tag className="mr-2 h-4 w-4" />
                    Buy Now
                  </Button>
                  <Button variant="outline">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="properties">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="properties">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Attributes</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-secondary p-3">
                    <p className="text-sm text-gray-500">Background</p>
                    <p className="font-medium">Blue</p>
                    <p className="text-xs text-gray-500">12% have this trait</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-3">
                    <p className="text-sm text-gray-500">Style</p>
                    <p className="font-medium">Abstract</p>
                    <p className="text-xs text-gray-500">8% have this trait</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {MOCK_TRANSACTIONS.map((tx, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b">
                        <div>
                          <p className="font-medium">{tx.type}</p>
                          <p className="text-sm text-gray-500">
                            From {tx.from} to {tx.to}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{tx.price}</p>
                          <p className="text-sm text-gray-500">{tx.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details">
              <Card>
                <CardContent className="space-y-4 p-6">
                  <div>
                    <h3 className="font-medium">Description</h3>
                    <p className="text-gray-500">A beautiful piece of abstract art created by a renowned digital artist.</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Contract Address</h3>
                    <p className="text-gray-500">0x1234...5678</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Token ID</h3>
                    <p className="text-gray-500">#1234</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Token Standard</h3>
                    <p className="text-gray-500">ERC-721</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Similar NFTs */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Similar NFTs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Similar NFTs would be rendered here */}
        </div>
      </div>
    </div>
  );
}