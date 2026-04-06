// Diamond
const DiamondABI = [
  "constructor(address _contractOwner, address _diamondCutFacet) payable",
  "fallback() payable",
  "receive() payable",
  "function example() pure returns (string)",
  "event DiamondCut(tuple(address facetAddress, uint8 action, bytes4[] functionSelectors)[] _diamondCut, address _init, bytes _calldata)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
  "error EmptyCalldata()",
  "error ImmutableFunction(bytes4 selector)",
  "error InValidFacetCutAction()",
  "error InitCallFailed()",
  "error MustBeZeroAddress()",
  "error NoCode()",
  "error NoSelectorsInFacet()",
  "error NoZeroAddress()",
  "error NonEmptyCalldata()",
  "error NonExistentSelector(bytes4 selector)",
  "error SameSelectorReplacement(bytes4 selector)",
  "error SelectorExists(bytes4 selector)",
]

// DiamondCutFacet
const DiamondCutFacetABI = [
  "function diamondCut(tuple(address facetAddress, uint8 action, bytes4[] functionSelectors)[] _diamondCut, address _init, bytes _calldata)",
  "event DiamondCut(tuple(address facetAddress, uint8 action, bytes4[] functionSelectors)[] _diamondCut, address _init, bytes _calldata)",
  "error EmptyCalldata()",
  "error ImmutableFunction(bytes4 selector)",
  "error InValidFacetCutAction()",
  "error InitCallFailed()",
  "error MustBeZeroAddress()",
  "error NoCode()",
  "error NoSelectorsInFacet()",
  "error NoZeroAddress()",
  "error NonEmptyCalldata()",
  "error NonExistentSelector(bytes4 selector)",
  "error NotDiamondOwner()",
  "error SameSelectorReplacement(bytes4 selector)",
  "error SelectorExists(bytes4 selector)",
]

// DiamondLoupeFacet
const DiamondLoupeFacetABI = [
  "function facetAddress(bytes4 _functionSelector) view returns (address facetAddress_)",
  "function facetAddresses() view returns (address[] facetAddresses_)",
  "function facetFunctionSelectors(address _facet) view returns (bytes4[] facetFunctionSelectors_)",
  "function facets() view returns (tuple(address facetAddress, bytes4[] functionSelectors)[] facets_)",
  "function supportsInterface(bytes4 _interfaceId) view returns (bool)",
]

// OwnershipFacet
const OwnershipFacetABI = [
  "function owner() view returns (address owner_)",
  "function transferOwnership(address _newOwner)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
  "error NotDiamondOwner()",
]

// ERC721Facet
const ERC721FacetABI = [
  "function approve(address _to, uint256 _tokenId)",
  "function balanceOf(address _owner) view returns (uint256)",
  "function batchMint(uint256 _count)",
  "function getApproved(uint256 _tokenId) view returns (address)",
  "function getTokenData(uint256 _tokenId) view returns (tuple(uint16 attack, uint16 defense, bool mage, uint256 requestId))",
  "function initialize(string _name, string _symbol)",
  "function isApprovedForAll(address _owner, address _operator) view returns (bool)",
  "function mint()",
  "function name() view returns (string)",
  "function ownerOf(uint256 _tokenId) view returns (address)",
  "function setApprovalForAll(address _operator, bool _approved)",
  "function symbol() view returns (string)",
  "function tokenURI(uint256 _tokenId) view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function transferFrom(address _from, address _to, uint256 _tokenId)",
  "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
  "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
]

// ERC20Facet
const ERC20FacetABI = [
  "function allowance(address _owner, address _spender) view returns (uint256)",
  "function approve(address _spender, uint256 _amount) returns (bool)",
  "function balanceOf(address _account) view returns (uint256)",
  "function burnERC20(uint256 _amount)",
  "function decimals() view returns (uint8)",
  "function erc20BalanceOf(address _account) view returns (uint256)",
  "function erc20TotalSupply() view returns (uint256)",
  "function initERC20(string _name, string _symbol, uint8 _decimals)",
  "function mintERC20(address _to, uint256 _amount)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function transfer(address _to, uint256 _amount) returns (bool)",
  "function transferFrom(address _from, address _to, uint256 _amount) returns (bool)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]

// BorrowFacet
const BorrowFacetABI = [
  "function borrow(uint256 _tokenId, uint256 _duration) payable",
  "function getBorrowInfo(uint256 _tokenId) view returns (address borrower, address lender, uint256 collateralEth, uint256 deadline)",
  "function getBorrowListing(uint256 _tokenId) view returns (address owner, uint256 price, uint256 duration, bool active)",
  "function getRequiredCollateralEth(uint256 _tokenId) view returns (uint256)",
  "function liquidate(uint256 _tokenId)",
  "function returnNFT(uint256 _tokenId)",
  "function setERC20PerEth(uint256 _erc20PerEth)",
  "event BorrowerLiquidated(uint256 indexed tokenId, address indexed lender)",
  "event NFTBorrowed(uint256 indexed tokenId, address indexed borrower, uint256 deadline)",
  "event NFTReturned(uint256 indexed tokenId, address indexed borrower)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]

// MarketplaceFacet
const MarketplaceFacetABI = [
  "function buyNFT(uint256 _tokenId)",
  "function cancelListing(uint256 _tokenId)",
  "function getActiveListings(uint256[] _tokenIds) view returns (uint256[] tokenIds, address[] sellers, uint256[] prices)",
  "function getListing(uint256 _tokenId) view returns (address seller, uint256 price, bool active)",
  "function getPlatformFee() view returns (uint256)",
  "function listNFT(uint256 _tokenId, uint256 _price)",
  "function setPlatformFee(uint256 _feeBps)",
  "function updatePrice(uint256 _tokenId, uint256 _newPrice)",
  "event Listed(uint256 indexed tokenId, address indexed seller, uint256 price)",
  "event ListingCancelled(uint256 indexed tokenId, address indexed seller)",
  "event PriceUpdated(uint256 indexed tokenId, uint256 newPrice)",
  "event Sale(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]

// StakingFacet
const StakingFacetABI = [
  "function getStakeDurations() view returns (uint256[] durations, uint256[] rewardBps)",
  "function getStakeInfo(uint256 _tokenId) view returns (address staker, uint256 stakeExpiry, uint256 rewardBps)",
  "function setRewardSplit(uint256 _stakerBps)",
  "function setStakeDurations(uint256[] _durations, uint256[] _rewardBps)",
  "function stake(uint256 _tokenId, uint256 _duration, uint256 _price)",
  "function unstake(uint256 _tokenId)",
  "event Staked(address indexed staker, uint256 indexed tokenId)",
  "event Unstaked(address indexed staker, uint256 indexed tokenId)",
]

// MultisigFacet
const MultisigFacetABI = [
  "function addOwner(address _owner)",
  "function approve(uint256 _proposalId)",
  "function changeRequirement(uint256 _required)",
  "function execute(uint256 _proposalId)",
  "function getOwners() view returns (address[])",
  "function getProposal(uint256 _proposalId) view returns (address proposer, bytes callData, uint256 approvalCount, bool executed)",
  "function getRequired() view returns (uint256)",
  "function hasApproved(uint256 _proposalId, address _owner) view returns (bool)",
  "function initMultisig(address[] _owners, uint256 _required)",
  "function propose(bytes _callData) returns (uint256 proposalId)",
  "function removeOwner(address _owner)",
  "function replaceOwner(address _oldOwner, address _newOwner)",
  "function revokeApproval(uint256 _proposalId)",
  "event ApprovalRevoked(uint256 indexed proposalId, address indexed approver)",
  "event OwnerAdded(address indexed owner)",
  "event OwnerRemoved(address indexed owner)",
  "event OwnerReplaced(address indexed oldOwner, address indexed newOwner)",
  "event ProposalApproved(uint256 indexed proposalId, address indexed approver)",
  "event ProposalExecuted(uint256 indexed proposalId)",
  "event ProposalSubmitted(uint256 indexed proposalId, address indexed proposer)",
  "event RequirementChanged(uint256 required)",
  "error NotDiamondOwner()",
]

// TreasuryFacet
const TreasuryFacetABI = [
  "function withdrawTreasuryERC20(address _to, uint256 _amount)",
  "function withdrawTreasuryETH(address _to, uint256 _amount)",
  "event TreasuryWithdrawERC20(address indexed to, uint256 amount)",
  "event TreasuryWithdrawETH(address indexed to, uint256 amount)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]

// VRFFacet
const VRFFacetABI = [
  "function EXTRA_ARGS_V1_TAG() view returns (bytes4)",
  "function getRequestStatus(uint256 requestId) view returns (bool exists, bool fulfilled, uint256[] randomWords)",
  "function getWords(uint256 _tokenId) returns (uint256 requestId)",
  "function rawFulfillRandomWords(uint256 requestId, uint256[] randomWords)",
  "function setReqData(tuple(uint256 subscriptionId, bytes32 keyHash, uint32 callbackGasLimit, uint16 requestConfirmations, uint32 numWords, address vrfCoordinator) r)",
  "event RequestFulfilled(uint256 requestId, uint256[] randomWords)",
  "event RequestSent(uint256 requestId, uint32 numWords)",
  "error NotDiamondOwner()",
  "error OnlyCoordinatorCanFulfill()",
]

// SVGFacet
const SVGFacetABI = [
  "function tokenURI(uint256 _tokenId) view returns (string)",
]