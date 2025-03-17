# NFT Marketplace

A modern, full-featured NFT marketplace built with Next.js and Ethereum. This application allows users to buy, sell, and manage their NFT collections with a beautiful and intuitive interface.

## Technology Stack

### Frontend
- **Next.js 14** - React framework with server-side rendering and app router
- **React 18** - UI library with hooks and server components
- **TypeScript** - Static type checking
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Reusable UI components built with Radix UI and Tailwind
- **Lucide React** - Beautiful and consistent icon set

### Blockchain
- **ethers.js** - Ethereum library for interacting with the blockchain
- **MetaMask** - Wallet integration for Ethereum transactions

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── create/            # NFT creation page
│   ├── profile/           # User profile and owned NFTs
│   └── page.tsx           # Homepage/marketplace
├── components/            
│   ├── ui/                # Reusable UI components
│   ├── navbar.tsx         # Navigation component
│   ├── nft-card.tsx      # NFT display card
│   └── nft-grid.tsx      # Grid layout for NFTs
└── lib/                   # Utility functions
```

## Implemented Features

### Marketplace Interface
- ✅ Browse available NFTs in a grid layout
- ✅ NFT card display with image, name, description, and price
- ✅ Detailed NFT view page with comprehensive information
- ✅ Navigation between marketplace and profile pages
- ✅ Responsive design for all screen sizes

### NFT Management
- ✅ Personal NFT collection view
- ✅ NFT creation interface with form validation
- ✅ Basic wallet connection UI
- ✅ Buy/Sell button interfaces

### NFT Details Page
- ✅ Large image display
- ✅ Detailed NFT information
- ✅ Price history tabs
- ✅ Properties/attributes display
- ✅ Transaction history view

## Planned Features

### Smart Contract Integration
- 🔄 MetaMask wallet integration
- 🔄 NFT minting functionality
- 🔄 Buy/Sell transaction processing
- 🔄 Real-time price updates
- 🔄 Transaction confirmation handling

### User Features
- 🔄 User authentication
- 🔄 Profile customization
- 🔄 Favorite/Watch list
- 🔄 Bid placement system
- 🔄 Notification system

### Advanced Features
- 🔄 NFT Collections grouping
- 🔄 Advanced search and filters
- 🔄 Auction system
- 🔄 Royalties management
- 🔄 Bulk transfer/listing tools

### Analytics
- 🔄 Price history charts
- 🔄 Market trends
- 🔄 Collection statistics
- 🔄 Trading volume metrics

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create a `.env.local` file with:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
```

## Best Practices

- Server Components for improved performance
- TypeScript for type safety
- Client-side components only when necessary
- Proper error handling for blockchain transactions
- Loading states for better UX
- Responsive design for all screen sizes

Legend:
- ✅ Implemented
- 🔄 Planned/In Development