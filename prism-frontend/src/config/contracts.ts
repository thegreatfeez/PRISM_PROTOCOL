// ─── Contract Addresses ────────────────────────────────────────────────────

export const DIAMOND_ADDRESS = "0x6e6742bA7C02214C2B798954f1084d94E7f02b0C" as const;

export const CONTRACT_ADDRESSES = {
  diamond: DIAMOND_ADDRESS,
  diamondCutFacet: "0x376bDf7EF380D2868E80F570559a211A82061a9F",
  diamondLoupeFacet: "0x9A20C36A7ADE62E50C682707D2e8278d8Daf805C",
  ownershipFacet: "0x1b65a91a889887a65e5f59F52A161D92359E493a",
  erc721Facet: "0xef571eCD58Ee26e3c4Ca6bE8CAb6a88ABC58a6A7",
  erc20Facet: "0xe7Fa28e17bE54A8a1C30D8F6638f8c42BBC5fad2",
  borrowFacet: "0xc9CFdd1150F6048Ce90d215D971Ed327BC45D45A",
  marketplaceFacet: "0x1AE32dfD7f063a13134CDCd5C194631843e158c0",
  stakingFacet: "0x41271490144e382B51457f2e09F6ad3eDEFC1fb8",
  multisigFacet: "0xF5CaeC80ab327B5D0988974d938F29DB66eFF8D7",
  treasuryFacet: "0xb3efE937539B09979A75D119441ed3869E899AeF",
  vrfFacet: "0x0b6E66E0E3f1f7d35C8dD209017D30CeB303D0c3",
  svgFacet: "0xA2Af6b7216Cb77f00BE9D4e70d20894cBd40e8c6",
} as const;

// ─── ABIs ──────────────────────────────────────────────────────────────────

export const ERC721_ABI = [
  { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_to", type: "address" }, { name: "_tokenId", type: "uint256" }], outputs: [] },
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "_owner", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "batchMint", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_count", type: "uint256" }], outputs: [] },
  { name: "getApproved", type: "function", stateMutability: "view", inputs: [{ name: "_tokenId", type: "uint256" }], outputs: [{ name: "", type: "address" }] },
  { name: "getTokenData", type: "function", stateMutability: "view", inputs: [{ name: "_tokenId", type: "uint256" }], outputs: [{ name: "", type: "tuple", components: [{ name: "attack", type: "uint16" }, { name: "defense", type: "uint16" }, { name: "mage", type: "bool" }, { name: "requestId", type: "uint256" }] }] },
  { name: "initialize", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_name", type: "string" }, { name: "_symbol", type: "string" }], outputs: [] },
  { name: "isApprovedForAll", type: "function", stateMutability: "view", inputs: [{ name: "_owner", type: "address" }, { name: "_operator", type: "address" }], outputs: [{ name: "", type: "bool" }] },
  { name: "mint", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "name", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  { name: "ownerOf", type: "function", stateMutability: "view", inputs: [{ name: "_tokenId", type: "uint256" }], outputs: [{ name: "", type: "address" }] },
  { name: "setApprovalForAll", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_operator", type: "address" }, { name: "_approved", type: "bool" }], outputs: [] },
  { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  { name: "tokenURI", type: "function", stateMutability: "view", inputs: [{ name: "_tokenId", type: "uint256" }], outputs: [{ name: "", type: "string" }] },
  { name: "totalSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "transferFrom", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_from", type: "address" }, { name: "_to", type: "address" }, { name: "_tokenId", type: "uint256" }], outputs: [] },
  { name: "Approval", type: "event", inputs: [{ name: "owner", type: "address", indexed: true }, { name: "approved", type: "address", indexed: true }, { name: "tokenId", type: "uint256", indexed: true }] },
  { name: "ApprovalForAll", type: "event", inputs: [{ name: "owner", type: "address", indexed: true }, { name: "operator", type: "address", indexed: true }, { name: "approved", type: "bool", indexed: false }] },
  { name: "Transfer", type: "event", inputs: [{ name: "from", type: "address", indexed: true }, { name: "to", type: "address", indexed: true }, { name: "tokenId", type: "uint256", indexed: true }] },
] as const;

export const ERC20_ABI = [
  { name: "allowance", type: "function", stateMutability: "view", inputs: [{ name: "_owner", type: "address" }, { name: "_spender", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_spender", type: "address" }, { name: "_amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "_account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "burnERC20", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_amount", type: "uint256" }], outputs: [] },
  { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
  { name: "erc20BalanceOf", type: "function", stateMutability: "view", inputs: [{ name: "_account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "erc20TotalSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "initERC20", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_name", type: "string" }, { name: "_symbol", type: "string" }, { name: "_decimals", type: "uint8" }], outputs: [] },
  { name: "mintERC20", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_to", type: "address" }, { name: "_amount", type: "uint256" }], outputs: [] },
  { name: "name", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  { name: "totalSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "transfer", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_to", type: "address" }, { name: "_amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { name: "transferFrom", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_from", type: "address" }, { name: "_to", type: "address" }, { name: "_amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { name: "Approval", type: "event", inputs: [{ name: "owner", type: "address", indexed: true }, { name: "spender", type: "address", indexed: true }, { name: "value", type: "uint256", indexed: false }] },
  { name: "Transfer", type: "event", inputs: [{ name: "from", type: "address", indexed: true }, { name: "to", type: "address", indexed: true }, { name: "value", type: "uint256", indexed: false }] },
] as const;

export const MARKETPLACE_ABI = [
  { name: "batchListNFT", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_tokenIds", type: "uint256[]" }, { name: "_price", type: "uint256" }], outputs: [] },
  { name: "buyNFT", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_tokenId", type: "uint256" }], outputs: [] },
  { name: "cancelListing", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_tokenId", type: "uint256" }], outputs: [] },
  { name: "getActiveListings", type: "function", stateMutability: "view", inputs: [{ name: "_tokenIds", type: "uint256[]" }], outputs: [{ name: "tokenIds", type: "uint256[]" }, { name: "sellers", type: "address[]" }, { name: "prices", type: "uint256[]" }] },
  { name: "getListing", type: "function", stateMutability: "view", inputs: [{ name: "_tokenId", type: "uint256" }], outputs: [{ name: "seller", type: "address" }, { name: "price", type: "uint256" }, { name: "active", type: "bool" }] },
  { name: "getPlatformFee", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "listNFT", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_tokenId", type: "uint256" }, { name: "_price", type: "uint256" }], outputs: [] },
  { name: "setPlatformFee", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_feeBps", type: "uint256" }], outputs: [] },
  { name: "updatePrice", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_tokenId", type: "uint256" }, { name: "_newPrice", type: "uint256" }], outputs: [] },
  { name: "Listed", type: "event", inputs: [{ name: "tokenId", type: "uint256", indexed: true }, { name: "seller", type: "address", indexed: true }, { name: "price", type: "uint256", indexed: false }] },
  { name: "ListingCancelled", type: "event", inputs: [{ name: "tokenId", type: "uint256", indexed: true }, { name: "seller", type: "address", indexed: true }] },
  { name: "PriceUpdated", type: "event", inputs: [{ name: "tokenId", type: "uint256", indexed: true }, { name: "newPrice", type: "uint256", indexed: false }] },
  { name: "Sale", type: "event", inputs: [{ name: "tokenId", type: "uint256", indexed: true }, { name: "seller", type: "address", indexed: true }, { name: "buyer", type: "address", indexed: true }, { name: "price", type: "uint256", indexed: false }] },
] as const;

export const STAKING_ABI = [
  { name: "getStakeDurations", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "durations", type: "uint256[]" }, { name: "rewardBps", type: "uint256[]" }] },
  { name: "getStakeInfo", type: "function", stateMutability: "view", inputs: [{ name: "_tokenId", type: "uint256" }], outputs: [{ name: "staker", type: "address" }, { name: "stakeExpiry", type: "uint256" }, { name: "rewardBps", type: "uint256" }] },
  { name: "setRewardSplit", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_stakerBps", type: "uint256" }], outputs: [] },
  { name: "setStakeDurations", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_durations", type: "uint256[]" }, { name: "_rewardBps", type: "uint256[]" }], outputs: [] },
  { name: "stake", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_tokenId", type: "uint256" }, { name: "_duration", type: "uint256" }, { name: "_price", type: "uint256" }], outputs: [] },
  { name: "unstake", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_tokenId", type: "uint256" }], outputs: [] },
  { name: "Staked", type: "event", inputs: [{ name: "staker", type: "address", indexed: true }, { name: "tokenId", type: "uint256", indexed: true }] },
  { name: "Unstaked", type: "event", inputs: [{ name: "staker", type: "address", indexed: true }, { name: "tokenId", type: "uint256", indexed: true }] },
] as const;

export const BORROW_ABI = [
  { name: "borrow", type: "function", stateMutability: "payable", inputs: [{ name: "_tokenId", type: "uint256" }, { name: "_duration", type: "uint256" }], outputs: [] },
  { name: "getBorrowInfo", type: "function", stateMutability: "view", inputs: [{ name: "_tokenId", type: "uint256" }], outputs: [{ name: "borrower", type: "address" }, { name: "lender", type: "address" }, { name: "collateralEth", type: "uint256" }, { name: "deadline", type: "uint256" }] },
  { name: "getBorrowListing", type: "function", stateMutability: "view", inputs: [{ name: "_tokenId", type: "uint256" }], outputs: [{ name: "owner", type: "address" }, { name: "price", type: "uint256" }, { name: "duration", type: "uint256" }, { name: "active", type: "bool" }] },
  { name: "getRequiredCollateralEth", type: "function", stateMutability: "view", inputs: [{ name: "_tokenId", type: "uint256" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "liquidate", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_tokenId", type: "uint256" }], outputs: [] },
  { name: "returnNFT", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_tokenId", type: "uint256" }], outputs: [] },
  { name: "setERC20PerEth", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_erc20PerEth", type: "uint256" }], outputs: [] },
  { name: "BorrowerLiquidated", type: "event", inputs: [{ name: "tokenId", type: "uint256", indexed: true }, { name: "lender", type: "address", indexed: true }] },
  { name: "NFTBorrowed", type: "event", inputs: [{ name: "tokenId", type: "uint256", indexed: true }, { name: "borrower", type: "address", indexed: true }, { name: "deadline", type: "uint256", indexed: false }] },
  { name: "NFTReturned", type: "event", inputs: [{ name: "tokenId", type: "uint256", indexed: true }, { name: "borrower", type: "address", indexed: true }] },
] as const;

export const MULTISIG_ABI = [
  { name: "addOwner", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_owner", type: "address" }], outputs: [] },
  { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_proposalId", type: "uint256" }], outputs: [] },
  { name: "changeRequirement", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_required", type: "uint256" }], outputs: [] },
  { name: "execute", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_proposalId", type: "uint256" }], outputs: [] },
  { name: "getOwners", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address[]" }] },
  { name: "getProposal", type: "function", stateMutability: "view", inputs: [{ name: "_proposalId", type: "uint256" }], outputs: [{ name: "proposer", type: "address" }, { name: "callData", type: "bytes" }, { name: "approvalCount", type: "uint256" }, { name: "executed", type: "bool" }] },
  { name: "getRequired", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "hasApproved", type: "function", stateMutability: "view", inputs: [{ name: "_proposalId", type: "uint256" }, { name: "_owner", type: "address" }], outputs: [{ name: "", type: "bool" }] },
  { name: "initMultisig", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_owners", type: "address[]" }, { name: "_required", type: "uint256" }], outputs: [] },
  { name: "propose", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_callData", type: "bytes" }], outputs: [{ name: "proposalId", type: "uint256" }] },
  { name: "removeOwner", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_owner", type: "address" }], outputs: [] },
  { name: "replaceOwner", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_oldOwner", type: "address" }, { name: "_newOwner", type: "address" }], outputs: [] },
  { name: "revokeApproval", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_proposalId", type: "uint256" }], outputs: [] },
  { name: "ApprovalRevoked", type: "event", inputs: [{ name: "proposalId", type: "uint256", indexed: true }, { name: "approver", type: "address", indexed: true }] },
  { name: "OwnerAdded", type: "event", inputs: [{ name: "owner", type: "address", indexed: true }] },
  { name: "OwnerRemoved", type: "event", inputs: [{ name: "owner", type: "address", indexed: true }] },
  { name: "ProposalApproved", type: "event", inputs: [{ name: "proposalId", type: "uint256", indexed: true }, { name: "approver", type: "address", indexed: true }] },
  { name: "ProposalExecuted", type: "event", inputs: [{ name: "proposalId", type: "uint256", indexed: true }] },
  { name: "ProposalSubmitted", type: "event", inputs: [{ name: "proposalId", type: "uint256", indexed: true }, { name: "proposer", type: "address", indexed: true }] },
  { name: "RequirementChanged", type: "event", inputs: [{ name: "required", type: "uint256", indexed: false }] },
] as const;

export const TREASURY_ABI = [
  { name: "withdrawTreasuryERC20", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_to", type: "address" }, { name: "_amount", type: "uint256" }], outputs: [] },
  { name: "withdrawTreasuryETH", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_to", type: "address" }, { name: "_amount", type: "uint256" }], outputs: [] },
  { name: "TreasuryWithdrawERC20", type: "event", inputs: [{ name: "to", type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }] },
  { name: "TreasuryWithdrawETH", type: "event", inputs: [{ name: "to", type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }] },
] as const;

export const OWNERSHIP_ABI = [
  { name: "owner", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "owner_", type: "address" }] },
  { name: "transferOwnership", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_newOwner", type: "address" }], outputs: [] },
  { name: "OwnershipTransferred", type: "event", inputs: [{ name: "previousOwner", type: "address", indexed: true }, { name: "newOwner", type: "address", indexed: true }] },
] as const;

export const FAUCET_ABI = [
  { name: "claimFaucet",      type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "setFaucetAmount",  type: "function", stateMutability: "nonpayable", inputs: [{ name: "_amount",   type: "uint256" }], outputs: [] },
  { name: "setFaucetCooldown",type: "function", stateMutability: "nonpayable", inputs: [{ name: "_cooldown", type: "uint256" }], outputs: [] },
  { name: "getFaucetInfo",    type: "function", stateMutability: "view",       inputs: [], outputs: [{ name: "amount", type: "uint256" }, { name: "cooldown", type: "uint256" }, { name: "balance", type: "uint256" }] },
  { name: "canClaim",         type: "function", stateMutability: "view",       inputs: [{ name: "_user", type: "address" }], outputs: [{ name: "", type: "bool" }] },
  { name: "getNextClaimTime", type: "function", stateMutability: "view",       inputs: [{ name: "_user", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "FaucetClaimed",    type: "event",    inputs: [{ name: "claimer", type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }] },
  { name: "FaucetAmountSet",  type: "event",    inputs: [{ name: "amount",  type: "uint256", indexed: false }] },
  { name: "FaucetCooldownSet",type: "event",    inputs: [{ name: "cooldown",type: "uint256", indexed: false }] },
] as const;

/** EIP-2535 diamondCut — used to decode upgrade proposals. */
export const DIAMOND_CUT_ABI = [
  {
    name: "diamondCut",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "_diamondCut",
        type: "tuple[]",
        components: [
          { name: "facetAddress", type: "address" },
          { name: "action", type: "uint8" },
          { name: "functionSelectors", type: "bytes4[]" },
        ],
      },
      { name: "_init", type: "address" },
      { name: "_calldata", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

export const DIAMOND_LOUPE_ABI = [
  { name: "facetAddress", type: "function", stateMutability: "view", inputs: [{ name: "_functionSelector", type: "bytes4" }], outputs: [{ name: "facetAddress_", type: "address" }] },
  { name: "facetAddresses", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "facetAddresses_", type: "address[]" }] },
  { name: "facetFunctionSelectors", type: "function", stateMutability: "view", inputs: [{ name: "_facet", type: "address" }], outputs: [{ name: "facetFunctionSelectors_", type: "bytes4[]" }] },
  { name: "facets", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "facets_", type: "tuple[]", components: [{ name: "facetAddress", type: "address" }, { name: "functionSelectors", type: "bytes4[]" }] }] },
  { name: "supportsInterface", type: "function", stateMutability: "view", inputs: [{ name: "_interfaceId", type: "bytes4" }], outputs: [{ name: "", type: "bool" }] },
] as const;

// Combined ABI for the Diamond proxy (all facets interact through this address)
export const DIAMOND_ABI = [
  ...DIAMOND_CUT_ABI,
  ...ERC721_ABI,
  ...ERC20_ABI,
  ...MARKETPLACE_ABI,
  ...STAKING_ABI,
  ...BORROW_ABI,
  ...MULTISIG_ABI,
  ...TREASURY_ABI,
  ...OWNERSHIP_ABI,
  ...FAUCET_ABI,
  ...DIAMOND_LOUPE_ABI,
] as const;
