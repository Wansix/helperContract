// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MBT is ERC20, Ownable {
    constructor(uint256 mintAmount) ERC20("MBT", "MBT") {
        _mint(msg.sender, mintAmount );
    }
}
