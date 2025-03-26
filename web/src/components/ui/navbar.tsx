import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="flex items-center space-x-1 md:space-x-2">
      <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active=true]:bg-accent/50")}>
        市场
      </Link>
      <Link href="/mint" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active=true]:bg-accent/50")}>
        铸造
      </Link>
      <Link href="/profile" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active=true]:bg-accent/50")}>
        我的NFT
      </Link>
      <Link href="/faucet" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active=true]:bg-accent/50")}>
        代币水龙头
      </Link>
    </nav>
  );
};

export default Navbar; 