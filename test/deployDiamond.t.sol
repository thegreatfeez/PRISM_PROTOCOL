// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../contracts/interfaces/IDiamondCut.sol";
import "../contracts/interfaces/IDiamondLoupe.sol";
import "../contracts/facets/DiamondCutFacet.sol";
import "../contracts/facets/DiamondLoupeFacet.sol";
import "../contracts/facets/OwnershipFacet.sol";
import "../contracts/facets/ERC721Facet.sol";
import "../contracts/facets/ERC20Facet.sol";
import "../contracts/facets/BorrowFacet.sol";
import "../contracts/facets/MarketplaceFacet.sol";
import "../contracts/facets/MultisigFacet.sol";
import "../contracts/facets/SVGFacet.sol";
import "../contracts/facets/StakingFacet.sol";
import "../contracts/facets/VRFFacet.sol";
import "../contracts/mocks/MockVRFCoordinator.sol";
import "../contracts/Diamond.sol";
import "../contracts/libraries/LibDiamond.sol";
import "../contracts/libraries/AppStorage.sol";

import "./helpers/TestHelpers.sol";

contract ProtocolFlowTest is TestHelpers {

    // ── contracts ─────────────────────────────────────────────
    Diamond             diamond;
    DiamondCutFacet     dCutFacet;
    DiamondLoupeFacet   dLoupe;
    OwnershipFacet      ownerF;
    ERC721Facet         erc721F;
    ERC20Facet          erc20F;
    BorrowFacet         borrowF;
    MarketplaceFacet    marketF;
    StakingFacet        stakingF;
    MultisigFacet       multisigF;
    SVGFacet            svgF;
    VRFFacet            vrfF;
    MockVRFCoordinator  vrfCoordinator;

    // ── multisig owners (5 owners, threshold = 3) ─────────────
    address timidan;      // proposes most admin actions
    address kas;          // approver (replacing magicEden as signer)
    address josh;         // approver
    address youngancient; // approver
    address kenny;        // approver

    // ── external entities ─────────────────────────────────────
    address magicEden;    // marketplace operator (external to multisig)

    // ── protocol actors ────────────────────────────────────────
    address buyer;    // buys NFT from marketplace, then stakes as lender
    address borrower; // borrows the staked NFT with ETH collateral

    // ── constants ──────────────────────────────────────────────
    uint256 constant ERC20_PER_ETH  = 100 ether;
    uint256 constant MARKET_PRICE   = 100 ether;
    uint256 constant BORROW_PRICE   = 100 ether;
    uint256 constant PLATFORM_FEE   = 500;       // 5%
    uint256 constant STAKE_DURATION = 7 days;
    uint256 constant REQUIRED       = 3;         // 3-of-5 threshold

    // ═══════════════════════════════════════════════════════════
    //  MULTISIG HELPER
    //  Simulates a 3-of-5 proposal: timidan proposes,
    //  kas + josh approve, timidan executes.
    // ═══════════════════════════════════════════════════════════

    function _adminCall(address _target, bytes memory _callData) internal {
        // timidan proposes
        vm.prank(timidan);
        uint256 proposalId = MultisigFacet(_target).propose(_callData);

        // timidan approves (counts as 1)
        vm.prank(timidan);
        MultisigFacet(_target).approve(proposalId);

        // kas approves (counts as 2)
        vm.prank(kas);
        MultisigFacet(_target).approve(proposalId);

        // josh approves (counts as 3 — threshold reached)
        vm.prank(josh);
        MultisigFacet(_target).approve(proposalId);

        // timidan executes
        vm.prank(timidan);
        MultisigFacet(_target).execute(proposalId);
    }

    // ── helpers ────────────────────────────────────────────────

    function _durations() internal pure returns (uint256[] memory d) {
        d = new uint256[](1);
        d[0] = STAKE_DURATION;
    }

    function _rewardBps() internal pure returns (uint256[] memory r) {
        r = new uint256[](1);
        r[0] = 8000;
    }

    function _setupEconomics() internal {
        _adminCall(address(diamond),
            abi.encodeWithSelector(ERC20Facet.initERC20.selector, "Prism", "PRM", 18));
        _adminCall(address(diamond),
            abi.encodeWithSelector(BorrowFacet.setERC20PerEth.selector, ERC20_PER_ETH));
        _adminCall(address(diamond),
            abi.encodeWithSelector(StakingFacet.setStakeDurations.selector, _durations(), _rewardBps()));
        _adminCall(address(diamond),
            abi.encodeWithSelector(MarketplaceFacet.setPlatformFee.selector, PLATFORM_FEE));
    }

    function _mintAndSellTo(address _buyer, uint256 _price) internal returns (uint256 tokenId) {
        _warpToWallClock();
        _adminCall(address(diamond),
            abi.encodeWithSelector(ERC721Facet.mint.selector));
        tokenId = ERC721Facet(address(diamond)).totalSupply();
        _adminCall(address(diamond),
            abi.encodeWithSelector(MarketplaceFacet.listNFT.selector, tokenId, _price));
        vm.prank(_buyer);
        MarketplaceFacet(address(diamond)).buyNFT(tokenId);
    }

    // ═══════════════════════════════════════════════════════════
    //  SETUP
    // ═══════════════════════════════════════════════════════════

    function setUp() public {
        timidan      = makeAddr("timidan");
        kas          = makeAddr("kas");
        josh         = makeAddr("josh");
        youngancient = makeAddr("youngancient");
        kenny        = makeAddr("kenny");
        
        magicEden    = makeAddr("magicEden");
        buyer        = makeAddr("buyer");
        borrower     = makeAddr("borrower");

        dCutFacet      = new DiamondCutFacet();
        diamond        = new Diamond(address(this), address(dCutFacet));
        dLoupe         = new DiamondLoupeFacet();
        ownerF         = new OwnershipFacet();
        erc721F        = new ERC721Facet();
        erc20F         = new ERC20Facet();
        borrowF        = new BorrowFacet();
        marketF        = new MarketplaceFacet();
        stakingF       = new StakingFacet();
        multisigF      = new MultisigFacet();
        svgF           = new SVGFacet();
        vrfF           = new VRFFacet();
        vrfCoordinator = new MockVRFCoordinator();

        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](5);
        cuts[0] = buildAddCutByName(address(dLoupe),    "DiamondLoupeFacet");
        cuts[1] = buildAddCutByName(address(ownerF),    "OwnershipFacet");
        cuts[2] = buildAddCutByName(address(erc721F),   "ERC721Facet");
        cuts[3] = buildAddCutByName(address(multisigF), "MultisigFacet");
        cuts[4] = buildAddCutByName(address(vrfF),      "VRFFacet");
        executeDiamondCut(IDiamondCut(address(diamond)), cuts, address(0), "");

        IDiamondLoupe loupe = IDiamondLoupe(address(diamond));
        IDiamondCut.FacetCut[] memory addCuts = new IDiamondCut.FacetCut[](4);
        addCuts[0] = buildAddMissingCutByName(loupe, address(erc20F),  "ERC20Facet");
        addCuts[1] = buildAddCutByName(address(borrowF),  "BorrowFacet");
        addCuts[2] = buildAddCutByName(address(marketF),  "MarketplaceFacet");
        addCuts[3] = buildAddCutByName(address(stakingF), "StakingFacet");
        executeDiamondCut(IDiamondCut(address(diamond)), addCuts, address(0), "");

        IDiamondCut.FacetCut[] memory svgCut = new IDiamondCut.FacetCut[](1);
        bytes4[] memory svgSelectors = new bytes4[](1);
        svgSelectors[0] = SVGFacet.tokenURI.selector;
        svgCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(svgF),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: svgSelectors
        });
        executeDiamondCut(IDiamondCut(address(diamond)), svgCut, address(0), "");

        // bootstrap: address(this) is contract owner so it can call initMultisig
        // register all 5 owners with a 3-of-5 threshold
        address[] memory owners = new address[](5);
        owners[0] = timidan;
        owners[1] = kas;
        owners[2] = josh;
        owners[3] = youngancient;
        owners[4] = kenny;
        MultisigFacet(address(diamond)).initMultisig(owners, REQUIRED);

        // from here, every privileged call goes through _adminCall (3-of-5)
        _adminCall(address(diamond),
            abi.encodeWithSelector(ERC721Facet.initialize.selector, "Panda", "PDA"));

        VRFFacet(address(diamond)).setReqData(ReqData({
            subscriptionId:       1,
            keyHash:              bytes32(0),
            callbackGasLimit:     500_000,
            requestConfirmations: 3,
            numWords:             2,
            vrfCoordinator:       address(vrfCoordinator)
        }));
    }

    // ═══════════════════════════════════════════════════════════
    //  TESTS... (identical logic below)
    // ═══════════════════════════════════════════════════════════

    function testMintAndBatchMint() public {
        _warpToWallClock();

        _adminCall(address(diamond),
            abi.encodeWithSelector(ERC721Facet.mint.selector));

        assertEq(ERC721Facet(address(diamond)).totalSupply(), 1);
        assertEq(ERC721Facet(address(diamond)).ownerOf(1), address(diamond));

        string memory uri = SVGFacet(address(diamond)).tokenURI(1);
        assertEq(_substring(uri, 0, 29), "data:application/json;base64,");

        _adminCall(address(diamond),
            abi.encodeWithSelector(ERC721Facet.batchMint.selector, uint256(3)));

        assertEq(ERC721Facet(address(diamond)).totalSupply(), 4);
        for (uint256 i = 2; i <= 4; i++) {
            assertEq(ERC721Facet(address(diamond)).ownerOf(i), address(diamond));
        }
    }

    function testMintStillWorksWhenVrfUnavailable() public {
        // Simulate missing VRF config after an upgrade/migration.
        VRFFacet(address(diamond)).setReqData(ReqData({
            subscriptionId: 0,
            keyHash: bytes32(0),
            callbackGasLimit: 0,
            requestConfirmations: 0,
            numWords: 0,
            vrfCoordinator: address(0)
        }));

        _warpToWallClock();
        _adminCall(address(diamond), abi.encodeWithSelector(ERC721Facet.mint.selector));

        assertEq(ERC721Facet(address(diamond)).totalSupply(), 1);
        assertEq(ERC721Facet(address(diamond)).ownerOf(1), address(diamond));
    }

    function testMarketplaceListAndBuy() public {
        _setupEconomics();
        _adminCall(address(diamond),
            abi.encodeWithSelector(ERC20Facet.mintERC20.selector, buyer, 200 ether));

        _warpToWallClock();
        _adminCall(address(diamond),
            abi.encodeWithSelector(ERC721Facet.mint.selector));
        _adminCall(address(diamond),
            abi.encodeWithSelector(MarketplaceFacet.listNFT.selector, uint256(1), MARKET_PRICE));

        (address seller, uint256 listedPrice, bool active) =
            MarketplaceFacet(address(diamond)).getListing(1);
        assertEq(seller,      address(diamond));
        assertEq(listedPrice, MARKET_PRICE);
        assertTrue(active);

        uint256 diamondErc20Before = ERC20Facet(address(diamond)).erc20BalanceOf(address(diamond));
        uint256 supplyBefore       = ERC20Facet(address(diamond)).erc20TotalSupply();

        vm.prank(buyer);
        MarketplaceFacet(address(diamond)).buyNFT(1);

        assertEq(ERC721Facet(address(diamond)).ownerOf(1), buyer);
        assertEq(ERC20Facet(address(diamond)).erc20BalanceOf(buyer), 100 ether);

        uint256 fee = (MARKET_PRICE * PLATFORM_FEE) / 10_000; // 5 ether burned
        assertEq(ERC20Facet(address(diamond)).erc20TotalSupply(), supplyBefore - fee);
        assertEq(ERC20Facet(address(diamond)).erc20BalanceOf(address(diamond)),
                 diamondErc20Before + MARKET_PRICE - fee);

        (, , bool stillActive) = MarketplaceFacet(address(diamond)).getListing(1);
        assertFalse(stillActive);
    }

    function testStakeAndBorrowAndReturn() public {
        _setupEconomics();
        _adminCall(address(diamond),
            abi.encodeWithSelector(ERC20Facet.mintERC20.selector, buyer,    200 ether));
        _adminCall(address(diamond),
            abi.encodeWithSelector(ERC20Facet.mintERC20.selector, borrower, 50 ether));
        vm.deal(borrower, 10 ether);

        uint256 tokenId = _mintAndSellTo(buyer, MARKET_PRICE);
        assertEq(ERC721Facet(address(diamond)).ownerOf(tokenId), buyer);

        vm.prank(buyer);
        StakingFacet(address(diamond)).stake(tokenId, STAKE_DURATION, BORROW_PRICE);
        assertEq(ERC721Facet(address(diamond)).ownerOf(tokenId), address(diamond));

        (address listingOwner, , , bool listingActive) =
            BorrowFacet(address(diamond)).getBorrowListing(tokenId);
        assertEq(listingOwner, buyer);
        assertTrue(listingActive);

        uint256 buyerErc20Before    = ERC20Facet(address(diamond)).erc20BalanceOf(buyer);
        uint256 borrowerErc20Before = ERC20Facet(address(diamond)).erc20BalanceOf(borrower);

        vm.prank(borrower);
        BorrowFacet(address(diamond)).borrow{value: 2 ether}(tokenId, STAKE_DURATION);

        assertEq(ERC721Facet(address(diamond)).ownerOf(tokenId), borrower);
        assertEq(address(diamond).balance, 2 ether);

        uint256 borrowFee   = (BORROW_PRICE * 500) / 10_000; // 5 ether
        uint256 stakerShare = (borrowFee * 8000) / 10_000;   // 4 ether
        assertEq(ERC20Facet(address(diamond)).erc20BalanceOf(borrower),
                 borrowerErc20Before - borrowFee);
        assertEq(ERC20Facet(address(diamond)).erc20BalanceOf(buyer),
                 buyerErc20Before + stakerShare);

        vm.warp(block.timestamp + 1 days);
        vm.prank(borrower);
        BorrowFacet(address(diamond)).returnNFT(tokenId);

        assertEq(borrower.balance, 10 ether);
        assertEq(address(diamond).balance, 0);
        assertEq(ERC721Facet(address(diamond)).ownerOf(tokenId), address(diamond));
    }

    function testLiquidationOnExpiry() public {
        _setupEconomics();
        _adminCall(address(diamond),
            abi.encodeWithSelector(ERC20Facet.mintERC20.selector, buyer,    200 ether));
        _adminCall(address(diamond),
            abi.encodeWithSelector(ERC20Facet.mintERC20.selector, borrower, 50 ether));
        vm.deal(borrower, 10 ether);

        uint256 tokenId = _mintAndSellTo(buyer, MARKET_PRICE);

        vm.prank(buyer);
        StakingFacet(address(diamond)).stake(tokenId, STAKE_DURATION, BORROW_PRICE);

        vm.prank(borrower);
        BorrowFacet(address(diamond)).borrow{value: 2 ether}(tokenId, STAKE_DURATION);

        vm.warp(block.timestamp + STAKE_DURATION + 1);

        uint256 buyerEthBefore = buyer.balance;

        vm.prank(buyer);
        BorrowFacet(address(diamond)).liquidate(tokenId);

        assertEq(buyer.balance - buyerEthBefore, 1.6 ether);
        assertEq(address(diamond).balance, 0.4 ether);
        assertEq(ERC721Facet(address(diamond)).totalSupply(), 0);
        vm.expectRevert("ERC721: token does not exist");
        ERC721Facet(address(diamond)).ownerOf(tokenId);
    }
}