// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30; // may have to change for ganache
import "./interfaces/IOracle.sol";
contract Oracle is IOracle {

    /// owner address
    address public owner;

    /// modifier resticting function access to only the owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    ///  constructor to set deployer as owner, payable to recieve ETH
    constructor() payable {
        owner = payable(msg.sender);
    }
    
    /// pseudo number generator using current block data
    /// Obtained from: https://stackoverflow.com/questions/48848948/how-to-generate-a-random-number-in-solidity
    /// @return uint256 pseudo-random integer derived from block entropy
    function randomise() internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.prevrandao, block.timestamp)));
    }


    /// Combines a player-supplied seed with a server-generated seed
    /// @param playerSeed A uint256 seed supplied by the player for added entropy
    /// @return uint256 combined pseudo-random integer derived from both seeds
    function generateSeed(
        uint256 playerSeed
    ) external override view returns (uint256) {
        uint256 serverSeed = randomise();
        return uint256(keccak256(abi.encodePacked(playerSeed, serverSeed)));
    }
}
