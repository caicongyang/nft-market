// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMarket is ReentrancyGuard, Ownable {
    // 上架的NFT结构体
    struct ListedNFT {
        address nftContract;
        uint256 tokenId;
        address seller;
        address paymentToken; // ERC20代币合约地址
        uint256 price;
        uint256 listedTime; // 新增：上架时间
        bool isActive;
    }

    // 市场交易手续费率（千分之五）
    uint256 public feePercentage = 5; // 0.5%
    uint256 public constant PERCENTAGE_BASE = 1000;

    // 保存所有上架的NFT
    mapping(address => mapping(uint256 => ListedNFT)) public listedNFTs;
    
    // 保存所有活跃的NFT列表，用于前端获取所有上架的NFT
    address[] public nftContracts;
    mapping(address => uint256[]) public tokenIdsPerContract;
    
    // 事件
    event NFTListed(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed seller,
        address paymentToken,
        uint256 price,
        uint256 listedTime
    );
    
    event NFTPurchased(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed buyer,
        address seller,
        address paymentToken,
        uint256 price
    );
    
    event NFTListingCancelled(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed seller
    );
    
    // 新增：NFT下架事件
    event NFTDelisted(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed seller
    );
    
    constructor() {}
    
    // 设置手续费率
    function setFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 100, "Fee too high"); // 最高10%
        feePercentage = _feePercentage;
    }
    
    // 上架NFT
    function listNFT(
        address _nftContract,
        uint256 _tokenId,
        address _paymentToken,
        uint256 _price
    ) external nonReentrant {
        require(_price > 0, "Price must be greater than zero");
        require(
            IERC721(_nftContract).ownerOf(_tokenId) == msg.sender,
            "Not the owner of the NFT"
        );
        
        // 确保合约已获得NFT的转让权限
        require(
            IERC721(_nftContract).isApprovedForAll(msg.sender, address(this)) ||
            IERC721(_nftContract).getApproved(_tokenId) == address(this),
            "Market not approved to manage this NFT"
        );
        
        // 如果是新的NFT合约，添加到合约列表
        bool contractExists = false;
        for (uint i = 0; i < nftContracts.length; i++) {
            if (nftContracts[i] == _nftContract) {
                contractExists = true;
                break;
            }
        }
        if (!contractExists) {
            nftContracts.push(_nftContract);
        }
        
        // 添加token到该合约的token列表
        bool tokenExists = false;
        for (uint i = 0; i < tokenIdsPerContract[_nftContract].length; i++) {
            if (tokenIdsPerContract[_nftContract][i] == _tokenId) {
                tokenExists = true;
                break;
            }
        }
        if (!tokenExists) {
            tokenIdsPerContract[_nftContract].push(_tokenId);
        }
        
        // 记录上架信息
        listedNFTs[_nftContract][_tokenId] = ListedNFT({
            nftContract: _nftContract,
            tokenId: _tokenId,
            seller: msg.sender,
            paymentToken: _paymentToken,
            price: _price,
            listedTime: block.timestamp,
            isActive: true
        });
        
        // 触发上架事件
        emit NFTListed(_nftContract, _tokenId, msg.sender, _paymentToken, _price, block.timestamp);
    }
    
    // 购买NFT
    function buyNFT(address _nftContract, uint256 _tokenId) external nonReentrant {
        ListedNFT storage listedNFT = listedNFTs[_nftContract][_tokenId];
        
        require(listedNFT.isActive, "NFT not listed for sale");
        require(listedNFT.seller != msg.sender, "Cannot buy your own NFT");
        
        // 标记为已售出，防止重入攻击
        listedNFT.isActive = false;
        
        // 计算平台手续费
        uint256 marketFee = (listedNFT.price * feePercentage) / PERCENTAGE_BASE;
        uint256 sellerAmount = listedNFT.price - marketFee;
        
        // 转移ERC20代币
        IERC20 paymentToken = IERC20(listedNFT.paymentToken);
        require(
            paymentToken.transferFrom(msg.sender, address(this), marketFee),
            "Payment token transfer failed for market fee"
        );
        require(
            paymentToken.transferFrom(msg.sender, listedNFT.seller, sellerAmount),
            "Payment token transfer failed for seller amount"
        );
        
        // 转移NFT
        IERC721(listedNFT.nftContract).safeTransferFrom(
            listedNFT.seller,
            msg.sender,
            listedNFT.tokenId
        );
        
        // 触发购买事件
        emit NFTPurchased(
            _nftContract,
            _tokenId,
            msg.sender,
            listedNFT.seller,
            listedNFT.paymentToken,
            listedNFT.price
        );
    }
    
    // 取消上架（旧方法，保留向后兼容性）
    function cancelListing(address _nftContract, uint256 _tokenId) external {
        delistNFT(_nftContract, _tokenId);
        
        // 触发取消上架事件（向后兼容）
        emit NFTListingCancelled(_nftContract, _tokenId, msg.sender);
    }
    
    // 新增：下架NFT功能
    function delistNFT(address _nftContract, uint256 _tokenId) public nonReentrant {
        ListedNFT storage listedNFT = listedNFTs[_nftContract][_tokenId];
        
        require(listedNFT.isActive, "NFT not listed for sale");
        require(listedNFT.seller == msg.sender, "Not the seller");
        
        // 标记为已下架
        listedNFT.isActive = false;
        
        // 触发下架事件
        emit NFTDelisted(_nftContract, _tokenId, msg.sender);
    }
    
    // 提取平台收取的手续费
    function withdrawFees(address _token, uint256 _amount) external onlyOwner {
        IERC20 token = IERC20(_token);
        require(token.balanceOf(address(this)) >= _amount, "Insufficient balance");
        require(token.transfer(owner(), _amount), "Transfer failed");
    }
    
    // 新增：获取所有上架的NFT合约数量
    function getNFTContractsCount() external view returns (uint256) {
        return nftContracts.length;
    }
    
    // 新增：获取特定合约的上架NFT数量
    function getTokenIdsCount(address _nftContract) external view returns (uint256) {
        return tokenIdsPerContract[_nftContract].length;
    }
    
    // 新增：获取所有活跃的上架NFT
    function getAllActiveListings() external view returns (ListedNFT[] memory) {
        // 计算活跃上架NFT的总数
        uint256 activeCount = 0;
        for (uint i = 0; i < nftContracts.length; i++) {
            address nftContract = nftContracts[i];
            for (uint j = 0; j < tokenIdsPerContract[nftContract].length; j++) {
                uint256 tokenId = tokenIdsPerContract[nftContract][j];
                if (listedNFTs[nftContract][tokenId].isActive) {
                    activeCount++;
                }
            }
        }
        
        // 创建返回数组
        ListedNFT[] memory activeListings = new ListedNFT[](activeCount);
        uint256 currentIndex = 0;
        
        // 填充返回数组
        for (uint i = 0; i < nftContracts.length; i++) {
            address nftContract = nftContracts[i];
            for (uint j = 0; j < tokenIdsPerContract[nftContract].length; j++) {
                uint256 tokenId = tokenIdsPerContract[nftContract][j];
                ListedNFT storage listing = listedNFTs[nftContract][tokenId];
                if (listing.isActive) {
                    activeListings[currentIndex] = listing;
                    currentIndex++;
                }
            }
        }
        
        return activeListings;
    }
} 