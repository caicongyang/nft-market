// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/CCYToken.sol";
import "../src/CCYNFT.sol";
import "../src/NFTMarket.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 部署ERC20代币 - 初始供应量1,000,000个代币
        CCYToken token = new CCYToken("Cryptocurrency Token", "CCY", 1000000);

        // 部署NFT合约
        CCYNFT nft = new CCYNFT("Cryptocurrency NFT", "NFTCCY");

        // 部署NFT市场合约
        NFTMarket market = new NFTMarket();

        vm.stopBroadcast();

        // 输出合约地址，便于后续交互
        console.log("CCY Token deployed at:", address(token));
        console.log("CCY NFT deployed at:", address(nft));
        console.log("NFT Market deployed at:", address(market));
    }
} 