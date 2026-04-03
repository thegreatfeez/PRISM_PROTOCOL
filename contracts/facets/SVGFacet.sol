// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AppStorage} from "../libraries/AppStorage.sol";
import {LibSVG} from "../libraries/LibSVG.sol";

contract SVGFacet {
    AppStorage internal s;

    function tokenURI(uint256 _tokenId) external view returns (string memory) {
        require(s.tokenIdToOwner[_tokenId] != address(0), "ERC721: token does not exist");

        uint256 seed = s.tokenSeed[_tokenId];

        string memory svg = LibSVG.buildSVG(seed, _tokenId);
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
}
