// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library LibSVG {
    function toString(uint256 value) internal pure returns (string memory) {
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

    function buildHSL(uint256 h, uint256 s, uint256 l) internal pure returns (string memory) {
        return string(abi.encodePacked("hsl(", toString(h), ",", toString(s), "%,", toString(l), "%)"));
    }

    function buildShape(uint256 pattern, uint256 size, uint256 hue, uint256 rotation)
        internal
        pure
        returns (string memory)
    {
        string memory color = buildHSL(hue, 80, 55);
        string memory sizeStr = toString(100 + size);
        string memory rotStr = toString(rotation);
        string memory cx = "200";
        string memory cy = "200";

        if (pattern == 0) {
            return
                string(abi.encodePacked('<circle cx="', cx, '" cy="', cy, '" r="', sizeStr, '" fill="', color, '"/>'));
        } else if (pattern == 1) {
            return string(
                abi.encodePacked(
                    '<rect x="',
                    toString(200 - (50 + size / 2)),
                    '" y="',
                    toString(200 - (50 + size / 2)),
                    '" width="',
                    toString(100 + size),
                    '" height="',
                    toString(100 + size),
                    '" fill="',
                    color,
                    '" transform="rotate(',
                    rotStr,
                    ' 200 200)"/>'
                )
            );
        } else if (pattern == 2) {
            return string(
                abi.encodePacked(
                    '<polygon points="200,',
                    toString(200 - (80 + size / 2)),
                    " ",
                    toString(200 + (70 + size / 2)),
                    ",",
                    toString(200 + (50 + size / 2)),
                    " ",
                    toString(200 - (70 + size / 2)),
                    ",",
                    toString(200 + (50 + size / 2)),
                    '" fill="',
                    color,
                    '" transform="rotate(',
                    rotStr,
                    ' 200 200)"/>'
                )
            );
        } else if (pattern == 3) {
            return string(
                abi.encodePacked(
                    '<ellipse cx="',
                    cx,
                    '" cy="',
                    cy,
                    '" rx="',
                    toString(130 + size),
                    '" ry="',
                    toString(80 + size / 2),
                    '" fill="',
                    color,
                    '" transform="rotate(',
                    rotStr,
                    ' 200 200)"/>'
                )
            );
        } else {
            return string(
                abi.encodePacked(
                    '<polygon points="200,',
                    toString(200 - (90 + size / 2)),
                    " ",
                    toString(200 + (30 + size / 4)),
                    ",",
                    toString(200 - (20 + size / 4)),
                    " ",
                    toString(200 + (60 + size / 3)),
                    ",",
                    toString(200 + (70 + size / 3)),
                    " ",
                    toString(200 - (60 + size / 3)),
                    ",",
                    toString(200 + (70 + size / 3)),
                    " ",
                    toString(200 - (30 + size / 4)),
                    ",",
                    toString(200 - (20 + size / 4)),
                    '" fill="',
                    color,
                    '" transform="rotate(',
                    rotStr,
                    ' 200 200)"/>'
                )
            );
        }
    }

    function buildSVG(uint256 seed, uint256 tokenId) internal pure returns (string memory) {
        uint256 hue = seed % 360;
        uint256 bgLightness = (seed >> 8) % 100;
        uint256 shapeSize = (seed >> 16) % 50;
        uint256 pattern = (seed >> 24) % 5;
        uint256 rotation = (seed >> 32) % 360;
        uint256 bgHue = (hue + 180) % 360;

        string memory bg = buildHSL(bgHue, 40, bgLightness < 20 ? 20 : bgLightness);
        string memory shape = buildShape(pattern, shapeSize, hue, rotation);
        string memory idStr = toString(tokenId);

        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
                '<rect width="400" height="400" fill="',
                bg,
                '"/>',
                '<circle cx="200" cy="200" r="160" fill="',
                buildHSL(bgHue, 30, bgLightness < 25 ? 25 : bgLightness - 5),
                '"/>',
                shape,
                '<text x="200" y="370" text-anchor="middle" font-family="monospace" font-size="16" fill="white">Diamond #',
                idStr,
                "</text>",
                "</svg>"
            )
        );
    }

    function encode(bytes memory data) internal pure returns (string memory) {
        bytes memory TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        uint256 len = data.length;
        if (len == 0) return "";

        uint256 encodedLen = 4 * ((len + 2) / 3);
        bytes memory result = new bytes(encodedLen + 32);
        bytes memory table = TABLE;

        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)
            for { let i := 0 } lt(i, len) {} {
                i := add(i, 3)
                let input := and(mload(sub(add(data, i), 0)), 0xffffff)
                let out := mload(add(tablePtr, and(shr(18, input), 0x3F)))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(12, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(6, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(input, 0x3F))), 0xFF))
                mstore(resultPtr, shl(224, out))
                resultPtr := add(resultPtr, 4)
            }
            switch mod(len, 3)
            case 1 { mstore(sub(resultPtr, 2), shl(240, 0x3d3d)) }
            case 2 { mstore(sub(resultPtr, 1), shl(248, 0x3d)) }
            mstore(result, encodedLen)
        }
        return string(result);
    }
}
