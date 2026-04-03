// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import {DiamondUpgradeHelper} from "./DiamondUpgradeHelper.sol";
import {MultisigFacet} from "../../contracts/facets/MultisigFacet.sol";
import {SVGFacet} from "../../contracts/facets/SVGFacet.sol";

abstract contract TestHelpers is DiamondUpgradeHelper {
    // Helper: run a full multisig flow for a single calldata payload.
    function _multisigCall(address diamond, bytes memory _callData) internal {
        uint256 proposalId = MultisigFacet(diamond).propose(_callData);
        MultisigFacet(diamond).approve(proposalId);
        MultisigFacet(diamond).execute(proposalId);
    }

    // Helper: extract a substring for quick string prefix checks.
    function _substring(string memory str, uint256 start, uint256 end) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = strBytes[i];
        }
        return string(result);
    }

    // Helper: decode a tokenURI and write the embedded SVG to disk.
    function _writeSvgFromTokenURI(string memory tokenUri, string memory outPath) internal {
        string[] memory cmd = new string[](5);
        cmd[0] = "python3";
        cmd[1] = "-c";
        cmd[2] =
            "import sys,base64,json;u=sys.argv[1];o=sys.argv[2];p='data:application/json;base64,';"
            "assert u.startswith(p);j=base64.b64decode(u[len(p):]);d=json.loads(j);"
            "i=d['image'];ip='data:image/svg+xml;base64,';assert i.startswith(ip);"
            "svg=base64.b64decode(i[len(ip):]);open(o,'wb').write(svg)";
        cmd[3] = tokenUri;
        cmd[4] = outPath;
        vm.ffi(cmd);
    }

    // Helper: warp to current wall-clock time for non-deterministic SVG seeds.
    function _warpToWallClock() internal {
        string[] memory cmd = new string[](2);
        cmd[0] = "date";
        cmd[1] = "+%s";
        bytes memory res = vm.ffi(cmd);
        vm.warp(_parseUint(res));
    }

    // Helper: write token SVG to /tmp/prism-token-{id}.svg and log the path.
    function _writeTokenSvg(address diamond, uint256 tokenId) internal {
        string memory path = string(abi.encodePacked("/tmp/prism-token-", _toString(tokenId), ".svg"));
        string memory uri = SVGFacet(diamond).tokenURI(tokenId);
        _writeSvgFromTokenURI(uri, path);
        console.log("SVG written to %s", path);
    }

    function _parseUint(bytes memory b) internal pure returns (uint256) {
        uint256 result;
        for (uint256 i = 0; i < b.length; i++) {
            uint8 c = uint8(b[i]);
            if (c >= 48 && c <= 57) {
                result = result * 10 + (c - 48);
            }
        }
        return result;
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
