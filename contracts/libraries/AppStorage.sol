// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct AppStorage {
    mapping(uint256 => address) tokenIdToOwner;
    mapping(address => uint256) addressToBalance;
    mapping(uint256 => address) tokenIdToApproved;
    mapping(address => mapping(address => bool)) isApprovedForAll;
    string name;
    string symbol;
    string baseURI;
    uint256 totalSupply;
}
