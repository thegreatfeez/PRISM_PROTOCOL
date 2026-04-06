// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import {IDiamondCut} from "../contracts/interfaces/IDiamondCut.sol";
import {IDiamondLoupe} from "../contracts/interfaces/IDiamondLoupe.sol";
import {Diamond} from "../contracts/Diamond.sol";
import {DiamondUpgradeHelper} from "../test/helpers/DiamondUpgradeHelper.sol";

import {DiamondCutFacet} from "../contracts/facets/DiamondCutFacet.sol";
import {DiamondLoupeFacet} from "../contracts/facets/DiamondLoupeFacet.sol";
import {OwnershipFacet} from "../contracts/facets/OwnershipFacet.sol";
import {ERC721Facet} from "../contracts/facets/ERC721Facet.sol";
import {ERC20Facet} from "../contracts/facets/ERC20Facet.sol";
import {BorrowFacet} from "../contracts/facets/BorrowFacet.sol";
import {MarketplaceFacet} from "../contracts/facets/MarketplaceFacet.sol";
import {StakingFacet} from "../contracts/facets/StakingFacet.sol";
import {MultisigFacet} from "../contracts/facets/MultisigFacet.sol";
import {TreasuryFacet} from "../contracts/facets/TreasuryFacet.sol";
import {SVGFacet} from "../contracts/facets/SVGFacet.sol";
import {VRFFacet} from "../contracts/facets/VRFFacet.sol";
import {ReqData} from "../contracts/libraries/AppStorage.sol";

contract DeployDiamond is Script, DiamondUpgradeHelper {
    function run() external {
        vm.startBroadcast();

        address deployer = msg.sender;

        DiamondCutFacet dCutFacet = new DiamondCutFacet();
        Diamond diamond = new Diamond(deployer, address(dCutFacet));

        DiamondLoupeFacet dLoupe = new DiamondLoupeFacet();
        OwnershipFacet ownerF = new OwnershipFacet();
        ERC721Facet erc721F = new ERC721Facet();
        ERC20Facet erc20F = new ERC20Facet();
        BorrowFacet borrowF = new BorrowFacet();
        MarketplaceFacet marketF = new MarketplaceFacet();
        StakingFacet stakingF = new StakingFacet();
        MultisigFacet multisigF = new MultisigFacet();
        TreasuryFacet treasuryF = new TreasuryFacet();
        VRFFacet vrfF = new VRFFacet();
        SVGFacet svgF = new SVGFacet();

        address[] memory baseFacetAddresses = new address[](4);
        string[] memory baseFacetNames = new string[](4);

        baseFacetAddresses[0] = address(dLoupe);
        baseFacetNames[0] = "DiamondLoupeFacet";
        baseFacetAddresses[1] = address(ownerF);
        baseFacetNames[1] = "OwnershipFacet";
        baseFacetAddresses[2] = address(erc721F);
        baseFacetNames[2] = "ERC721Facet";
        baseFacetAddresses[3] = address(multisigF);
        baseFacetNames[3] = "MultisigFacet";

        IDiamondCut.FacetCut[] memory baseCuts = buildAddCutsByNames(baseFacetAddresses, baseFacetNames);
        executeDiamondCut(IDiamondCut(address(diamond)), baseCuts, address(0), "");

        IDiamondLoupe loupe = IDiamondLoupe(address(diamond));
        IDiamondCut.FacetCut[] memory addCuts = new IDiamondCut.FacetCut[](5);
        addCuts[0] = buildAddMissingCutByName(loupe, address(erc20F), "ERC20Facet");
        addCuts[1] = buildAddCutByName(address(borrowF), "BorrowFacet");
        addCuts[2] = buildAddCutByName(address(marketF), "MarketplaceFacet");
        addCuts[3] = buildAddCutByName(address(stakingF), "StakingFacet");
        addCuts[4] = buildAddCutByName(address(treasuryF), "TreasuryFacet");
        executeDiamondCut(IDiamondCut(address(diamond)), addCuts, address(0), "");

        IDiamondCut.FacetCut[] memory vrfCut = new IDiamondCut.FacetCut[](1);
        vrfCut[0] = buildAddCutByName(address(vrfF), "VRFFacet");
        executeDiamondCut(IDiamondCut(address(diamond)), vrfCut, address(0), "");

        IDiamondCut.FacetCut memory svgCut =
            buildReplaceCutByName(IDiamondLoupe(address(diamond)), address(svgF), "SVGFacet");
        if (svgCut.functionSelectors.length > 0) {
            IDiamondCut.FacetCut[] memory svgCuts = new IDiamondCut.FacetCut[](1);
            svgCuts[0] = svgCut;
            executeDiamondCut(IDiamondCut(address(diamond)), svgCuts, address(0), "");
        }

        address[] memory owners = new address[](1);
        owners[0] = deployer;
        MultisigFacet(address(diamond)).initMultisig(owners, 1);

        string memory nftName = vm.envOr("NFT_NAME", string("Prism Armaments"));
        string memory nftSymbol = vm.envOr("NFT_SYMBOL", string("PARM"));
        _multisigCall(address(diamond), abi.encodeWithSelector(ERC721Facet.initialize.selector, nftName, nftSymbol));

        string memory erc20Name = vm.envOr("ERC20_NAME", string("Prism"));
        string memory erc20Symbol = vm.envOr("ERC20_SYMBOL", string("PRM"));
        uint8 erc20Decimals = uint8(vm.envOr("ERC20_DECIMALS", uint256(18)));
        _multisigCall(
            address(diamond),
            abi.encodeWithSelector(ERC20Facet.initERC20.selector, erc20Name, erc20Symbol, erc20Decimals)
        );

        address vrfCoordinator = vm.envOr("VRF_COORDINATOR", address(0));
        if (vrfCoordinator != address(0)) {
            uint256 subId = vm.envOr("VRF_SUB_ID", uint256(0));
            bytes32 keyHash = vm.envOr("VRF_KEY_HASH", bytes32(0));
            uint32 callbackGas = uint32(vm.envOr("VRF_CALLBACK_GAS", uint256(500000)));
            uint16 confirmations = uint16(vm.envOr("VRF_CONFIRMATIONS", uint256(3)));
            uint32 numWords = uint32(vm.envOr("VRF_NUM_WORDS", uint256(2)));

            VRFFacet(address(diamond)).setReqData(
                ReqData({
                    subscriptionId: subId,
                    keyHash: keyHash,
                    callbackGasLimit: callbackGas,
                    requestConfirmations: confirmations,
                    numWords: numWords,
                    vrfCoordinator: vrfCoordinator
                })
            );
        }

        vm.stopBroadcast();
    }

    function _multisigCall(address diamond, bytes memory callData) internal {
        uint256 proposalId = MultisigFacet(diamond).propose(callData);
        MultisigFacet(diamond).approve(proposalId);
        MultisigFacet(diamond).execute(proposalId);
    }
}
