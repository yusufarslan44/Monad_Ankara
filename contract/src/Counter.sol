// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Counter — test amaçlı basit sayaç kontratı
contract Counter {
    error NotOwner();
    error AlreadyReset();

    event Incremented(address indexed by, uint256 newValue);
    event Reset(address indexed by);

    address public immutable owner;
    uint256 public count;

    constructor() {
        owner = msg.sender;
    }

    function increment() external {
        count++;
        emit Incremented(msg.sender, count);
    }

    function reset() external {
        if (msg.sender != owner) revert NotOwner();
        if (count == 0) revert AlreadyReset();
        count = 0;
        emit Reset(msg.sender);
    }
}
