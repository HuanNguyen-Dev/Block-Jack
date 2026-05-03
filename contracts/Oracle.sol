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
    // randomise function only for the owner..?
    // Temporary randomise function, should be off chain ideally
    function randomise() internal pure returns (uint256) {
        return uint256(123456789);
    }

    function generateSeed(
        uint256 playerSeed
    ) external override pure returns (bytes32) {
        uint256 serverSeed = randomise();
        return bytes32(playerSeed % serverSeed);
    }
}
