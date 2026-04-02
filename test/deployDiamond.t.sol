// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "../contracts/interfaces/IDiamondCut.sol";
import "../contracts/facets/DiamondCutFacet.sol";
import "../contracts/facets/DiamondLoupeFacet.sol";
import "../contracts/facets/OwnershipFacet.sol";
import "../contracts/facets/ERC721Facet.sol";
import "../contracts/Diamond.sol";
import "../contracts/libraries/LibDiamond.sol";

import "./helpers/DiamondUpgradeHelper.sol";

contract DiamondDeployer is DiamondUpgradeHelper {
    //contract types of facets to be deployed
    Diamond diamond;
    DiamondCutFacet dCutFacet;
    DiamondLoupeFacet dLoupe;
    OwnershipFacet ownerF;
    ERC721Facet erc721F;
    address timidan;
    address magicEden;
    address josh;
    address youngancient; 

    function setUp() public {
        string memory baseURI = "https://ipfs.io/ipfs/QmUpZ6KU4WJZXQ9seWB9VdXAjXQcpDCCwYvnxcHinmdCvD";
        timidan = makeAddr("timidan");
        magicEden = makeAddr("magiceden");
        josh = makeAddr("josh");
        youngancient = makeAddr("youngancient");

        //deploy facets
        dCutFacet = new DiamondCutFacet();
        diamond = new Diamond(address(this), address(dCutFacet));
        dLoupe = new DiamondLoupeFacet();
        ownerF = new OwnershipFacet();
        erc721F = new ERC721Facet();

       
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](3);
        cuts[0] = buildAddCutByName(address(dLoupe), "DiamondLoupeFacet");
        cuts[1] = buildAddCutByName(address(ownerF), "OwnershipFacet");
        cuts[2] = buildAddCutByName(address(erc721F), "ERC721Facet");

        executeDiamondCut(IDiamondCut(address(diamond)), cuts, address(0), "");

        //call a function
        DiamondLoupeFacet(address(diamond)).facetAddresses();
        ERC721Facet(address(diamond)).initialize("Panda", "PDA", baseURI);
    }

    function testMintNft() public{
        ERC721Facet(address(diamond)).mint(timidan);
        assertEq(ERC721Facet(address(diamond)).balanceOf(timidan), 1);

        string memory uri = ERC721Facet(address(diamond)).tokenURI(1);
        assertEq(uri, "https://ipfs.io/ipfs/QmUpZ6KU4WJZXQ9seWB9VdXAjXQcpDCCwYvnxcHinmdCvD");
    }

    function testMintRevertsForNonOwner() public {
        vm.prank(timidan);
        vm.expectRevert(LibDiamond.NotDiamondOwner.selector);
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
        ERC721Facet(address(diamond)).tokenURI(1);
    }

    function testApproveAndTransferFromByApproved() public {
        ERC721Facet(address(diamond)).mint(timidan);

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
        ERC721Facet(address(diamond)).mint(timidan);

        vm.prank(josh);
        vm.expectRevert("ERC721: caller is not owner nor approved for all");
        ERC721Facet(address(diamond)).approve(josh, 1);
    }

    function testSetApprovalForAllAndOperatorTransfer() public {
        ERC721Facet(address(diamond)).mint(timidan);

        vm.prank(timidan);
        ERC721Facet(address(diamond)).setApprovalForAll(magicEden, true);
        assertTrue(ERC721Facet(address(diamond)).isApprovedForAll(timidan, magicEden));

        vm.prank(magicEden);
        ERC721Facet(address(diamond)).transferFrom(timidan, youngancient, 1);
        assertEq(ERC721Facet(address(diamond)).ownerOf(1), youngancient);
    }

    function testTransferFromRevertsOnBadFromOrTo() public {
        ERC721Facet(address(diamond)).mint(timidan);

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
        ERC721Facet(address(diamond)).initialize("Again", "AGN", "ipfs://example");
    }

}
