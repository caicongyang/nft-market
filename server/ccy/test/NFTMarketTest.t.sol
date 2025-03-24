// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/CCYToken.sol";
import "../src/CCYNFT.sol";
import "../src/NFTMarket.sol";

contract NFTMarketTest is Test {
    CCYToken public token;
    CCYNFT public nft;
    NFTMarket public market;
    
    address public owner = address(1);
    address public buyer = address(2);
    address public seller = address(3);
    
    uint256 public constant TOKEN_SUPPLY = 1000000 * 10**18;
    uint256 public constant NFT_PRICE = 1000 * 10**18;
    
    function setUp() public {
        vm.startPrank(owner);
        
        // 部署合约
        token = new CCYToken("Cryptocurrency Token", "CCY", 1000000);
        nft = new CCYNFT("Cryptocurrency NFT", "NFTCCY");
        market = new NFTMarket();
        
        // 为买家铸造代币
        token.mint(buyer, NFT_PRICE * 2);
        
        // 为卖家铸造NFT
        nft.mintNFT(seller, "https://example.com/nft/1");
        
        vm.stopPrank();
    }
    
    function testListAndBuyNFT() public {
        // 卖家上架NFT
        vm.startPrank(seller);
        uint256 tokenId = 1;
        nft.approve(address(market), tokenId);
        market.listNFT(address(nft), tokenId, address(token), NFT_PRICE);
        vm.stopPrank();
        
        // 确认NFT已经上架
        (address nftContract, uint256 listedTokenId, address nftSeller, address paymentToken, uint256 price, uint256 listedTime, bool isActive) = 
            market.listedNFTs(address(nft), tokenId);
        
        assertEq(nftContract, address(nft));
        assertEq(listedTokenId, tokenId);
        assertEq(nftSeller, seller);
        assertEq(paymentToken, address(token));
        assertEq(price, NFT_PRICE);
        assertTrue(listedTime > 0); // 检查上架时间已设置
        assertEq(isActive, true);
        
        // 买家购买NFT
        vm.startPrank(buyer);
        token.approve(address(market), NFT_PRICE);
        market.buyNFT(address(nft), tokenId);
        vm.stopPrank();
        
        // 验证NFT所有权已转移
        assertEq(nft.ownerOf(tokenId), buyer);
        
        // 验证代币已转移
        // 计算平台手续费（0.5%）
        uint256 marketFee = (NFT_PRICE * 5) / 1000;
        uint256 sellerAmount = NFT_PRICE - marketFee;
        
        // 验证卖家收到代币
        assertEq(token.balanceOf(seller), sellerAmount);
        
        // 验证市场合约收到手续费
        assertEq(token.balanceOf(address(market)), marketFee);
        
        // 验证NFT不再是上架状态
        (,,,,,, isActive) = market.listedNFTs(address(nft), tokenId);
        assertEq(isActive, false);
    }
    
    function testCancelListing() public {
        // 卖家上架NFT
        vm.startPrank(seller);
        uint256 tokenId = 1;
        nft.approve(address(market), tokenId);
        market.listNFT(address(nft), tokenId, address(token), NFT_PRICE);
        
        // 取消上架
        market.cancelListing(address(nft), tokenId);
        vm.stopPrank();
        
        // 验证NFT不再是上架状态
        (,,,,,, bool isActive) = market.listedNFTs(address(nft), tokenId);
        assertEq(isActive, false);
    }
    
    // 新增：测试下架NFT功能
    function testDelistNFT() public {
        // 卖家上架NFT
        vm.startPrank(seller);
        uint256 tokenId = 1;
        nft.approve(address(market), tokenId);
        market.listNFT(address(nft), tokenId, address(token), NFT_PRICE);
        
        // 下架NFT
        market.delistNFT(address(nft), tokenId);
        vm.stopPrank();
        
        // 验证NFT不再是上架状态
        (,,,,,, bool isActive) = market.listedNFTs(address(nft), tokenId);
        assertEq(isActive, false);
    }
    
    // 新增：测试获取所有活跃的上架NFT
    function testGetAllActiveListings() public {
        // 卖家上架多个NFT
        vm.startPrank(seller);
        
        // 铸造第二个NFT
        uint256 secondTokenId = nft.mintNFT(seller, "https://example.com/nft/2");
        
        // 上架第一个NFT
        uint256 firstTokenId = 1;
        nft.approve(address(market), firstTokenId);
        market.listNFT(address(nft), firstTokenId, address(token), NFT_PRICE);
        
        // 上架第二个NFT
        nft.approve(address(market), secondTokenId);
        market.listNFT(address(nft), secondTokenId, address(token), NFT_PRICE * 2);
        
        // 下架第一个NFT
        market.delistNFT(address(nft), firstTokenId);
        vm.stopPrank();
        
        // 获取所有活跃上架
        NFTMarket.ListedNFT[] memory activeListings = market.getAllActiveListings();
        
        // 应该只有一个活跃上架（第二个NFT）
        assertEq(activeListings.length, 1);
        assertEq(activeListings[0].tokenId, secondTokenId);
        assertEq(activeListings[0].price, NFT_PRICE * 2);
        assertEq(activeListings[0].isActive, true);
    }
    
    function testWithdrawFees() public {
        // 卖家上架NFT
        vm.startPrank(seller);
        uint256 tokenId = 1;
        nft.approve(address(market), tokenId);
        market.listNFT(address(nft), tokenId, address(token), NFT_PRICE);
        vm.stopPrank();
        
        // 买家购买NFT
        vm.startPrank(buyer);
        token.approve(address(market), NFT_PRICE);
        market.buyNFT(address(nft), tokenId);
        vm.stopPrank();
        
        // 计算平台手续费
        uint256 marketFee = (NFT_PRICE * 5) / 1000;
        
        // 平台提取手续费
        vm.startPrank(owner);
        market.withdrawFees(address(token), marketFee);
        vm.stopPrank();
        
        // 验证手续费已提取
        assertEq(token.balanceOf(address(market)), 0);
        assertEq(token.balanceOf(owner), marketFee);
    }
} 