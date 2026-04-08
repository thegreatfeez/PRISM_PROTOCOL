// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import {IDiamondCut} from "../contracts/interfaces/IDiamondCut.sol";
import {FaucetFacet} from "../contracts/facets/FaucetFacet.sol";
import {DiamondUpgradeHelper} from "../test/helpers/DiamondUpgradeHelper.sol";

/// @notice Deploy FaucetFacet and print calldata for a multisig proposal that calls `diamond.diamondCut(...)`.
/// @dev After multisig is initialized, only `MultisigFacet.execute` can invoke `diamondCut` (msg.sender must be the diamond).
///      Use the printed bytes as the proposal `callData` (target = diamond address).
contract PrepareFaucetDiamondCut is Script, DiamondUpgradeHelper {
    function run() external {
        vm.startBroadcast();
        FaucetFacet faucet = new FaucetFacet();
        vm.stopBroadcast();

        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);
        cuts[0] = buildAddCutByName(address(faucet), "FaucetFacet");

        bytes memory proposalCalldata =
            abi.encodeWithSelector(IDiamondCut.diamondCut.selector, cuts, address(0), "");

        console.log("FaucetFacet deployed at:", address(faucet));
        console.log("--- Proposal callData for MultisigFacet.propose (hex) ---");
        console.logBytes(proposalCalldata);
    }
}
