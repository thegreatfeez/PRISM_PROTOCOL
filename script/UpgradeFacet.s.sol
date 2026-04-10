// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import {IDiamondCut} from "../contracts/interfaces/IDiamondCut.sol";
import {IDiamondLoupe} from "../contracts/interfaces/IDiamondLoupe.sol";
import {DiamondUpgradeHelper} from "../test/helpers/DiamondUpgradeHelper.sol";
import {MultisigFacet} from "../contracts/facets/MultisigFacet.sol";

import {DiamondCutFacet} from "../contracts/facets/DiamondCutFacet.sol";
import {DiamondLoupeFacet} from "../contracts/facets/DiamondLoupeFacet.sol";
import {OwnershipFacet} from "../contracts/facets/OwnershipFacet.sol";
import {ERC721Facet} from "../contracts/facets/ERC721Facet.sol";
import {ERC20Facet} from "../contracts/facets/ERC20Facet.sol";
import {BorrowFacet} from "../contracts/facets/BorrowFacet.sol";
import {MarketplaceFacet} from "../contracts/facets/MarketplaceFacet.sol";
import {StakingFacet} from "../contracts/facets/StakingFacet.sol";
import {TreasuryFacet} from "../contracts/facets/TreasuryFacet.sol";
import {SVGFacet} from "../contracts/facets/SVGFacet.sol";
import {VRFFacet} from "../contracts/facets/VRFFacet.sol";
import {FaucetFacet} from "../contracts/facets/FaucetFacet.sol";

contract UpgradeFacet is Script, DiamondUpgradeHelper {
function run() external {
        address diamond = vm.envAddress("DIAMOND");
        string memory facetName = vm.envString("FACET");
        vm.startBroadcast();
        _upgrade(diamond, facetName);
        vm.stopBroadcast();
    }

    function _upgrade(address diamond, string memory facetName) internal {
        address newFacet = _deployFacet(facetName);

        IDiamondLoupe loupe = IDiamondLoupe(diamond);
        // IMPORTANT: when a facet gains new functions, we need BOTH:
        // - Replace existing selectors to point at the new facet implementation
        // - Add any selectors that are missing on the diamond
        IDiamondCut.FacetCut[] memory cuts = buildExtendCutsByName(loupe, newFacet, facetName);
        require(cuts.length > 0, string.concat("UpgradeFacet: no selectors found for ", facetName));

        _multisigCut(diamond, cuts);

        console.log("Upgraded", facetName, "->", newFacet);
    }

    function _deployFacet(string memory facetName) internal returns (address) {
        bytes32 nameHash = keccak256(bytes(facetName));

        if (nameHash == keccak256("ERC721Facet"))      return address(new ERC721Facet());
        if (nameHash == keccak256("ERC20Facet"))       return address(new ERC20Facet());
        if (nameHash == keccak256("BorrowFacet"))      return address(new BorrowFacet());
        if (nameHash == keccak256("MarketplaceFacet")) return address(new MarketplaceFacet());
        if (nameHash == keccak256("StakingFacet"))     return address(new StakingFacet());
        if (nameHash == keccak256("TreasuryFacet"))    return address(new TreasuryFacet());
        if (nameHash == keccak256("SVGFacet"))         return address(new SVGFacet());
        if (nameHash == keccak256("VRFFacet"))         return address(new VRFFacet());
        if (nameHash == keccak256("MultisigFacet"))    return address(new MultisigFacet());
        if (nameHash == keccak256("OwnershipFacet"))   return address(new OwnershipFacet());
        if (nameHash == keccak256("DiamondLoupeFacet")) return address(new DiamondLoupeFacet());
        if (nameHash == keccak256("DiamondCutFacet"))  return address(new DiamondCutFacet());
        if (nameHash == keccak256("FaucetFacet"))     return address(new FaucetFacet());

        revert(string.concat("UpgradeFacet: unknown facet ", facetName));
    }

    function _multisigCut(address diamond, IDiamondCut.FacetCut[] memory cuts) internal {
        bytes memory callData = abi.encodeWithSelector(
            IDiamondCut.diamondCut.selector,
            cuts,
            address(0),
            ""
        );
        uint256 proposalId = MultisigFacet(diamond).propose(callData);
        MultisigFacet(diamond).approve(proposalId);
        MultisigFacet(diamond).execute(proposalId);
    }
}
