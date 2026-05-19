// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30; // may have to change for ganache
import "./interfaces/IOracle.sol";
contract Oracle is IOracle {
    // owner address
    address public owner;
    // last random number calculated

    // add logging for randomisation

    // modifier for only the owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    //  constructor to set owner
    constructor() payable {
        // payable constructor can receive ether
        owner = payable(msg.sender);
    }
    // Obtained from: https://stackoverflow.com/questions/48848948/how-to-generate-a-random-number-in-solidity
    function randomise() internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.prevrandao, block.timestamp)));
    }

    function generateSeed(
        uint256 playerSeed
    ) external override view returns (uint256) {
        uint256 serverSeed = randomise();
        return uint256(keccak256(abi.encodePacked(playerSeed, serverSeed)));
    }
}
