import { Wallet } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";

export function Navbar() {
  return (
    <nav className="border-b">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/" className="text-xl font-bold">
          NFT Market
        </Link>
        <div className="ml-auto flex items-center space-x-4">
          <Link href="/profile">
            <Button variant="outline">My NFTs</Button>
          </Link>
          <Button>
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </Button>
        </div>
      </div>
    </nav>
  );
}