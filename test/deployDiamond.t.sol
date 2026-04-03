// SPDX-License-Identifier: UNLICENSED
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
import "../contracts/Diamond.sol";
import "../contracts/libraries/LibDiamond.sol";

import "./helpers/TestHelpers.sol";

contract DiamondDeployer is TestHelpers {
    Diamond diamond;
    DiamondCutFacet dCutFacet;
    DiamondLoupeFacet dLoupe;
    OwnershipFacet ownerF;
    ERC721Facet erc721F;
    ERC20Facet erc20F;
    BorrowFacet borrowF;
    MarketplaceFacet marketF;
    StakingFacet stakingF;
    MultisigFacet multisigF;
    SVGFacet svgF;

    address timidan;
    address magicEden;
    address josh;
    address youngancient;

    function _durations() internal pure returns (uint256[] memory d) {
        d = new uint256[](1);
        d[0] = 7 days;
    }

    function _rewardBps() internal pure returns (uint256[] memory r) {
        r = new uint256[](1);
        r[0] = 8000;
    }

 function setUp() public {
    timidan      = makeAddr("timidan");
    magicEden    = makeAddr("magiceden");
    josh         = makeAddr("josh");
    youngancient = makeAddr("youngancient");

    dCutFacet = new DiamondCutFacet();
    diamond   = new Diamond(address(this), address(dCutFacet));
    dLoupe    = new DiamondLoupeFacet();
    ownerF    = new OwnershipFacet();
    erc721F   = new ERC721Facet();
    erc20F    = new ERC20Facet();
    borrowF   = new BorrowFacet();
    marketF   = new MarketplaceFacet();
    stakingF  = new StakingFacet();
    multisigF = new MultisigFacet();
    svgF      = new SVGFacet();

    IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](4);
    cuts[0] = buildAddCutByName(address(dLoupe),    "DiamondLoupeFacet");
    cuts[1] = buildAddCutByName(address(ownerF),    "OwnershipFacet");
    cuts[2] = buildAddCutByName(address(erc721F),   "ERC721Facet");
    cuts[3] = buildAddCutByName(address(multisigF), "MultisigFacet");

    executeDiamondCut(IDiamondCut(address(diamond)), cuts, address(0), "");

    IDiamondLoupe loupe = IDiamondLoupe(address(diamond));
    IDiamondCut.FacetCut[] memory addCuts = new IDiamondCut.FacetCut[](4);
    addCuts[0] = buildAddMissingCutByName(loupe, address(erc20F), "ERC20Facet");
    addCuts[1] = buildAddCutByName(address(borrowF), "BorrowFacet");
    addCuts[2] = buildAddCutByName(address(marketF), "MarketplaceFacet");
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

    // initialize multisig first — uses LibDiamond.enforceIsContractOwner as bootstrap
    address[] memory owners = new address[](1);
    owners[0] = address(this);
    MultisigFacet(address(diamond)).initMultisig(owners, 1);

    // now everything privileged goes through multisig
    _multisigCall(address(diamond), abi.encodeWithSelector(ERC721Facet.initialize.selector, "Panda", "PDA"));
}

    function testMintNft() public {
        _warpToWallClock();
        _multisigCall(address(diamond), abi.encodeWithSelector(ERC721Facet.mint.selector, timidan));
        assertEq(ERC721Facet(address(diamond)).balanceOf(timidan), 1);

        string memory uri = SVGFacet(address(diamond)).tokenURI(1);
        _writeTokenSvg(address(diamond), 1);
        assertTrue(
            bytes(uri).length > 0,
            "tokenURI should not be empty"
        );
        assertEq(
            _substring(uri, 0, 29),
            "data:application/json;base64,"
        );
    }

    function testMintRevertsForNonOwner() public {
        vm.prank(timidan);
        vm.expectRevert("Multisig: not authorized");
        ERC721Facet(address(diamond)).mint(timidan);
    }

    function testBalanceOfZeroAddressReverts() public {
        vm.expectRevert("ERC721: zero address");
        ERC721Facet(address(diamond)).balanceOf(address(0));
    }

    function testOwnerOfAndTokenURIRevertsForMissingToken() public {
        vm.expectRevert("ERC721: token does not exist");
        ERC721Facet(address(diamond)).ownerOf(1);
        vm.expectRevert("ERC721: token does not exist");
        SVGFacet(address(diamond)).tokenURI(1);
    }

    function testApproveAndTransferFromByApproved() public {
        _multisigCall(address(diamond), abi.encodeWithSelector(ERC721Facet.mint.selector, timidan));

        vm.prank(timidan);
        ERC721Facet(address(diamond)).approve(josh, 1);
        assertEq(ERC721Facet(address(diamond)).getApproved(1), josh);

        vm.prank(josh);
        ERC721Facet(address(diamond)).transferFrom(timidan, josh, 1);
        assertEq(ERC721Facet(address(diamond)).ownerOf(1), josh);
        assertEq(ERC721Facet(address(diamond)).balanceOf(timidan), 0);
        assertEq(ERC721Facet(address(diamond)).balanceOf(josh), 1);
        assertEq(ERC721Facet(address(diamond)).getApproved(1), address(0));
    }

    function testApproveRevertsForNonOwnerOrOperator() public {
        _multisigCall(address(diamond), abi.encodeWithSelector(ERC721Facet.mint.selector, timidan));

        vm.prank(josh);
        vm.expectRevert("ERC721: caller is not owner nor approved for all");
        ERC721Facet(address(diamond)).approve(josh, 1);
    }

    function testSetApprovalForAllAndOperatorTransfer() public {
        _multisigCall(address(diamond), abi.encodeWithSelector(ERC721Facet.mint.selector, timidan));

        vm.prank(timidan);
        ERC721Facet(address(diamond)).setApprovalForAll(magicEden, true);
        assertTrue(ERC721Facet(address(diamond)).isApprovedForAll(timidan, magicEden));

        vm.prank(magicEden);
        ERC721Facet(address(diamond)).transferFrom(timidan, youngancient, 1);
        assertEq(ERC721Facet(address(diamond)).ownerOf(1), youngancient);
    }

    function testTransferFromRevertsOnBadFromOrTo() public {
        _multisigCall(address(diamond), abi.encodeWithSelector(ERC721Facet.mint.selector, timidan));

        vm.expectRevert("ERC721: transfer from incorrect owner");
        ERC721Facet(address(diamond)).transferFrom(josh, timidan, 1);

        vm.prank(timidan);
        vm.expectRevert("ERC721: transfer to zero address");
        ERC721Facet(address(diamond)).transferFrom(timidan, address(0), 1);
    }

    function testGetApprovedRevertsForMissingToken() public {
        vm.expectRevert("ERC721: token does not exist");
        ERC721Facet(address(diamond)).getApproved(1);
    }

    function testInitializeOnlyOnce() public {
        vm.expectRevert("ERC721: already initialized");
        ERC721Facet(address(diamond)).initialize("Again", "AGN");
    }

    function testBatchMintFour() public {
        _warpToWallClock();
        address[] memory recipients = new address[](4);
        recipients[0] = timidan;
        recipients[1] = magicEden;
        recipients[2] = josh;
        recipients[3] = youngancient;

        _multisigCall(address(diamond), abi.encodeWithSelector(ERC721Facet.batchMint.selector, recipients));

        assertEq(ERC721Facet(address(diamond)).balanceOf(timidan), 1);
        assertEq(ERC721Facet(address(diamond)).balanceOf(magicEden), 1);
        assertEq(ERC721Facet(address(diamond)).balanceOf(josh), 1);
        assertEq(ERC721Facet(address(diamond)).balanceOf(youngancient), 1);

        _writeTokenSvg(address(diamond), 1);
        _writeTokenSvg(address(diamond), 2);
        _writeTokenSvg(address(diamond), 3);
        _writeTokenSvg(address(diamond), 4);
    }

    function testLiquidationBurnsToken() public {
        _multisigCall(address(diamond), abi.encodeWithSelector(ERC721Facet.mint.selector, timidan));

        _multisigCall(address(diamond), abi.encodeWithSelector(ERC20Facet.initERC20.selector, "Prism", "PRM", 18));
        _multisigCall(address(diamond), abi.encodeWithSelector(ERC20Facet.mintERC20.selector, magicEden, 1_000 ether));
        _multisigCall(address(diamond), abi.encodeWithSelector(BorrowFacet.setERC20PerEth.selector, 100 ether));
        _multisigCall(address(diamond), abi.encodeWithSelector(StakingFacet.setStakeDurations.selector, _durations(), _rewardBps()));
        _multisigCall(address(diamond), abi.encodeWithSelector(StakingFacet.setRewardSplit.selector, 8000));

        vm.prank(timidan);
        StakingFacet(address(diamond)).stake(1, 7 days, 100 ether);

        vm.deal(magicEden, 10 ether);
        vm.prank(magicEden);
        BorrowFacet(address(diamond)).borrow{value: 2 ether}(1, 7 days);

        vm.warp(block.timestamp + 7 days + 1);
        vm.prank(timidan);
        BorrowFacet(address(diamond)).liquidate(1);

        assertEq(ERC721Facet(address(diamond)).totalSupply(), 0);

        vm.expectRevert("ERC721: token does not exist");
        ERC721Facet(address(diamond)).ownerOf(1);

        vm.prank(magicEden);
        vm.expectRevert("Marketplace: not token owner");
        MarketplaceFacet(address(diamond)).listNFT(1, 1 ether);
    }

    function testBorrowFeeAndCollateralFlow() public {
        _multisigCall(address(diamond), abi.encodeWithSelector(ERC721Facet.mint.selector, timidan));
        _multisigCall(address(diamond), abi.encodeWithSelector(ERC20Facet.initERC20.selector, "Prism", "PRM", 18));
        _multisigCall(address(diamond), abi.encodeWithSelector(ERC20Facet.mintERC20.selector, magicEden, 1_000 ether));
        _multisigCall(address(diamond), abi.encodeWithSelector(BorrowFacet.setERC20PerEth.selector, 100 ether));
        _multisigCall(address(diamond), abi.encodeWithSelector(StakingFacet.setStakeDurations.selector, _durations(), _rewardBps()));
        _multisigCall(address(diamond), abi.encodeWithSelector(StakingFacet.setRewardSplit.selector, 8000));

        vm.prank(timidan);
        StakingFacet(address(diamond)).stake(1, 7 days, 100 ether);

        uint256 borrowerErc20Before = ERC20Facet(address(diamond)).erc20BalanceOf(magicEden);
        uint256 stakerErc20Before = ERC20Facet(address(diamond)).erc20BalanceOf(timidan);
        uint256 protocolErc20Before = ERC20Facet(address(diamond)).erc20BalanceOf(address(diamond));

        vm.deal(magicEden, 10 ether);
        vm.prank(magicEden);
        BorrowFacet(address(diamond)).borrow{value: 2 ether}(1, 7 days);

        uint256 borrowerErc20After = ERC20Facet(address(diamond)).erc20BalanceOf(magicEden);
        uint256 stakerErc20After = ERC20Facet(address(diamond)).erc20BalanceOf(timidan);
        uint256 protocolErc20After = ERC20Facet(address(diamond)).erc20BalanceOf(address(diamond));

        assertEq(borrowerErc20Before - borrowerErc20After, 5 ether);
        assertEq(stakerErc20After - stakerErc20Before, 4 ether);
        assertEq(protocolErc20After - protocolErc20Before, 1 ether);
        assertEq(address(diamond).balance, 2 ether);

        vm.warp(block.timestamp + 1 days);
        vm.prank(magicEden);
        BorrowFacet(address(diamond)).returnNFT(1);

        assertEq(address(diamond).balance, 0);
        assertEq(ERC20Facet(address(diamond)).erc20BalanceOf(magicEden), borrowerErc20After);
    }

    function testUndercollateralizedLiquidation() public {
        _multisigCall(address(diamond), abi.encodeWithSelector(ERC721Facet.mint.selector, timidan));
        _multisigCall(address(diamond), abi.encodeWithSelector(ERC20Facet.initERC20.selector, "Prism", "PRM", 18));
        _multisigCall(address(diamond), abi.encodeWithSelector(ERC20Facet.mintERC20.selector, magicEden, 1_000 ether));
        _multisigCall(address(diamond), abi.encodeWithSelector(BorrowFacet.setERC20PerEth.selector, 100 ether));
        _multisigCall(address(diamond), abi.encodeWithSelector(StakingFacet.setStakeDurations.selector, _durations(), _rewardBps()));
        _multisigCall(address(diamond), abi.encodeWithSelector(StakingFacet.setRewardSplit.selector, 8000));

        vm.prank(timidan);
        StakingFacet(address(diamond)).stake(1, 7 days, 100 ether);

        vm.deal(magicEden, 10 ether);
        vm.prank(magicEden);
        BorrowFacet(address(diamond)).borrow{value: 2 ether}(1, 7 days);

        _multisigCall(address(diamond), abi.encodeWithSelector(BorrowFacet.setERC20PerEth.selector, 50 ether));

        uint256 stakerEthBefore = timidan.balance;

        vm.prank(timidan);
        BorrowFacet(address(diamond)).liquidate(1);

        assertEq(timidan.balance - stakerEthBefore, 1.6 ether);
        assertEq(address(diamond).balance, 0.4 ether);
        assertEq(ERC721Facet(address(diamond)).totalSupply(), 0);
    }

}
