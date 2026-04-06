// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AppStorage, RequestStatus} from "../libraries/AppStorage.sol";
import {LibSVG} from "../libraries/LibSVG.sol";

contract SVGFacet {
    AppStorage internal s;

    function tokenURI(uint256 _tokenId) external view returns (string memory) {
        require(s.tokenIdToOwner[_tokenId] != address(0), "ERC721: token does not exist");

        uint256 requestId = s.nftTraits[_tokenId].requestId;
        require(requestId != 0, "VRF: request missing");

        RequestStatus storage status = s.requests[requestId];
        require(status.exists, "VRF: request missing");
        require(status.fulfilled, "VRF: request not fulfilled");
        require(status.randomWords.length > 0, "VRF: no random words");

        uint256 seed = status.randomWords[0];
        string memory traitLabel = _traitLabel(seed);

        string memory svg = LibSVG.buildSVG(seed, _tokenId, traitLabel);
        string memory svgEncoded = LibSVG.encode(bytes(svg));

        string memory json = string(
            abi.encodePacked(
                '{"name":"Diamond #',
                LibSVG.toString(_tokenId),
                '","description":"A fully on-chain Diamond NFT.",',
                '"image":"data:image/svg+xml;base64,',
                svgEncoded,
                '"}'
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", LibSVG.encode(bytes(json))));
    }

    function _traitLabel(uint256 rand0) internal pure returns (string memory) {
        uint256 bucket = rand0 % 100;
        if (bucket < 70) return "Attack";
        if (bucket < 97) return "Defense";
        return "Mage";
    }
}
