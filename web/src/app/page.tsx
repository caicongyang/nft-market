'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useMarketNFTs } from '@/hooks/useMarketNFTs';
import { NFTCard } from '@/components/NFTCard';
import { useAccount } from 'wagmi';

export default function Home() {
  const { nfts, isLoading, error } = useMarketNFTs();
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-pink-50">
      <header className="bg-gradient-to-r from-pink-300 via-purple-200 to-pink-300 shadow-md">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center">
            <Image 
              src="/images/cute-logo.png" 
              alt="最可爱的女儿" 
              width={50} 
              height={50} 
              className="rounded-full"
              onError={(e) => {
                const imgElement = e.currentTarget as HTMLImageElement;
                imgElement.src = "https://via.placeholder.com/50?text=💖";
                imgElement.onerror = null;
              }}
            />
            <h1 className="ml-3 text-2xl font-bold text-pink-600">最可爱的女儿</h1>
          </div>
          <ConnectButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* 1. 热门NFT列表区域 */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-pink-600">热门女儿NFT</h2>
            <Link href="/list" className="text-pink-500 hover:text-pink-600 transition">
              查看全部 &rarr;
            </Link>
          </div>
          
          {isConnected ? (
            isLoading ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                <p className="mt-2 text-pink-500">正在加载最可爱的女儿NFT...</p>
              </div>
            ) : error ? (
              <div className="text-center py-10 text-pink-600">
                <p>加载NFT时出错: {error}</p>
                <p className="mt-2">请连接钱包或稍后再试</p>
              </div>
            ) : nfts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {nfts.map((nft) => (
                  <NFTCard key={`${nft.nftContract}-${nft.tokenId}`} nft={nft} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-white rounded-lg shadow border-2 border-pink-200">
                <div className="text-6xl mb-4">👧</div>
                <h3 className="text-xl font-bold text-pink-600 mb-2">暂无NFT列表</h3>
                <p className="text-gray-600 mb-4">目前市场上还没有可爱女儿NFT，成为第一个创建者吧！</p>
                <Link href="/create" className="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition inline-block">
                  创建我的女儿NFT
                </Link>
              </div>
            )
          ) : (
            <div className="text-center py-10 bg-white rounded-lg shadow border-2 border-pink-200">
              <div className="text-6xl mb-4">🔗</div>
              <h3 className="text-xl font-bold text-pink-600 mb-2">请连接钱包</h3>
              <p className="text-gray-600 mb-4">连接您的钱包以查看最可爱的女儿NFT</p>
            </div>
          )}
        </section>

        {/* 2. 获取免费代币区域 */}
        <section className="bg-gradient-to-r from-pink-200 via-purple-100 to-pink-200 rounded-lg p-8 mb-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-pink-600 mb-6">获取免费代币开始您的收藏之旅</h2>
            <p className="text-gray-700 mb-8">
              想要开始收集最可爱的女儿NFT吗？您需要一些CCY代币！
              点击下方按钮获取免费代币，开始您的收藏之旅。
            </p>
            <Link href="/faucet" className="px-8 py-3 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition font-medium">
              领取免费代币
            </Link>
          </div>
        </section>

        {/* 3. 介绍区域 */}
        <section className="text-center mb-16">
          <h2 className="text-4xl font-bold text-pink-600 mb-6">收集最可爱的女儿NFT系列</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            欢迎来到"最可爱的女儿"NFT市场！在这里您可以创建、收集、交易可爱的女儿主题艺术品和收藏品。
            每一个NFT都是独一无二的，就像每个女儿都是世界上最可爱的一样！
          </p>
        </section>

        {/* 4. 功能区域 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
          <div className="bg-white rounded-lg shadow-lg p-6 transform transition duration-300 hover:scale-105 border-2 border-pink-200">
            <div className="text-pink-500 text-4xl mb-4 flex justify-center">🦄</div>
            <h3 className="text-xl font-bold text-center text-pink-600 mb-3">创建你的女儿NFT</h3>
            <p className="text-gray-600 text-center">铸造独一无二的女儿主题NFT，展示你心目中最可爱的女儿形象！</p>
            <div className="mt-6 text-center">
              <Link href="/create" className="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition">
                开始创建
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 transform transition duration-300 hover:scale-105 border-2 border-pink-200">
            <div className="text-pink-500 text-4xl mb-4 flex justify-center">🎀</div>
            <h3 className="text-xl font-bold text-center text-pink-600 mb-3">浏览女儿NFT市场</h3>
            <p className="text-gray-600 text-center">探索各种风格的可爱女儿NFT，找到你最喜欢的收藏品！</p>
            <div className="mt-6 text-center">
              <Link href="/list" className="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition">
                浏览市场
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 transform transition duration-300 hover:scale-105 border-2 border-pink-200">
            <div className="text-pink-500 text-4xl mb-4 flex justify-center">💖</div>
            <h3 className="text-xl font-bold text-center text-pink-600 mb-3">查看你的收藏</h3>
            <p className="text-gray-600 text-center">管理您已拥有的女儿NFT收藏，或将它们上架到市场！</p>
            <div className="mt-6 text-center">
              <Link href="/profile" className="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition">
                我的收藏
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-pink-600 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold">最可爱的女儿 NFT市场</h2>
              <p className="text-pink-200">收集、创建和交易独一无二的女儿主题NFT</p>
            </div>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-pink-200 transition">关于我们</a>
              <a href="#" className="hover:text-pink-200 transition">使用条款</a>
              <a href="#" className="hover:text-pink-200 transition">隐私政策</a>
              <a href="#" className="hover:text-pink-200 transition">联系我们</a>
            </div>
          </div>
          <div className="mt-8 text-center text-pink-200">
            <p>© {new Date().getFullYear()} 最可爱的女儿 NFT市场. 保留所有权利。</p>
          </div>
        </div>
      </footer>
    </div>
  );
}