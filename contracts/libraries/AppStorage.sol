// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct MultisigProposal {
    address proposer;
    bytes callData; // encoded diamondCut call
    uint256 approvalCount;
    bool executed;
    mapping(address => bool) hasApproved;
}

struct BorrowInfo {
    address borrower;
    address lender;
    uint256 collateral;
    uint256 deadline;
}

struct BorrowListing {
    address owner;
    uint256 requiredCollateral;
    uint256 duration;
    bool active;
}

struct StakeInfo {
    address staker;
    uint256 stakeExpiry;
    uint256 rewardBps;
}

struct Listing {
    address seller;
    uint256 price;
    bool active;
}

struct AppStorage {
    // ── ERC721 ───────────────────────────────
    mapping(uint256 => address) tokenIdToOwner;
    mapping(address => uint256) addressToNFTBalance;
    mapping(uint256 => address) tokenIdToApproved;
    mapping(address => mapping(address => bool)) isApprovedForAll;
    string nftName;
    string nftSymbol;
    string baseURI;
    uint256 totalNFTSupply;
    uint256 totalNFTBurned;

    // ── ERC20 ────────────────────────────────
    mapping(address => uint256) erc20Balances;
    mapping(address => mapping(address => uint256)) erc20Allowances;
    uint256 totalERC20Supply;
    string erc20Name;
    string erc20Symbol;
    uint8 erc20Decimals;

    // ── Multisig ─────────────────────────────
    address[] multisigOwners;
    mapping(address => bool) isMultisigOwner;
    uint256 required;
    uint256 proposalCount;
    mapping(uint256 => MultisigProposal) proposals;

    // ── Staking ──────────────────────────────
    mapping(uint256 => StakeInfo) stakes;
    uint256[] stakeDurations;
    mapping(uint256 => uint256) stakeRewardBps;
    uint256 stakerRewardBps;

    // ── Borrowing ────────────────────────────
    mapping(uint256 => BorrowInfo) borrows;
    mapping(uint256 => BorrowListing) borrowListings;
    uint256 borrowFeeRate;

    // ── Marketplace ──────────────────────────
    mapping(uint256 => Listing) listings;
    uint256 platformFeeBps;

    // ── SVG / Traits ─────────────────────────
    mapping(uint256 => uint256) tokenSeed;
}
