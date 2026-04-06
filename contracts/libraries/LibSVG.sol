// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library LibSVG {
    // ─────────────────────────────────────────────────────────────
    //  Utilities
    // ─────────────────────────────────────────────────────────────

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

    // ─────────────────────────────────────────────────────────────
    //  Shape Router
    // ─────────────────────────────────────────────────────────────

    function buildShape(uint256 pattern, uint256 size, uint256 hue, uint256 rotation)
        internal
        pure
        returns (string memory)
    {
        if (pattern == 0) return buildSword(size, hue, rotation);
        if (pattern == 1) return buildGun(size, hue, rotation);
        if (pattern == 2) return buildBowAndArrow(size, hue, rotation);
        if (pattern == 3) return buildAxe(size, hue, rotation);
        if (pattern == 4) return buildSpear(size, hue, rotation);
        return buildArrow(size, hue, rotation);
    }

    // ─────────────────────────────────────────────────────────────
    //  Sword
    // ─────────────────────────────────────────────────────────────

    function _swordBlade(
        string memory color,
        string memory rotStr,
        uint256 bladeW,
        uint256 bladeLen,
        uint256 tipLen
    ) private pure returns (string memory) {
        return string(abi.encodePacked(
            '<g transform="rotate(', rotStr, ' 200 200)">',
            '<rect x="',  toString(200 - bladeW / 2),
            '" y="',      toString(200 - bladeLen / 2),
            '" width="',  toString(bladeW),
            '" height="', toString(bladeLen),
            '" fill="',   color, '"/>',
            '<polygon points="200,', toString(200 - bladeLen / 2 - tipLen),
            " ", toString(200 - bladeW / 2), ",", toString(200 - bladeLen / 2),
            " ", toString(200 + bladeW / 2), ",", toString(200 - bladeLen / 2),
            '" fill="', color, '"/>'
        ));
    }

    function _swordGuardAndHandle(
        string memory accent,
        uint256 bladeLen,
        uint256 guardW,
        uint256 guardH,
        uint256 handleW,
        uint256 handleLen
    ) private pure returns (string memory) {
        return string(abi.encodePacked(
            '<rect x="',  toString(200 - guardW / 2),
            '" y="',      toString(200 + bladeLen / 2 - guardH / 2),
            '" width="',  toString(guardW),
            '" height="', toString(guardH),
            '" fill="',   accent, '"/>',
            '<rect x="',  toString(200 - handleW / 2),
            '" y="',      toString(200 + bladeLen / 2 + guardH / 2),
            '" width="',  toString(handleW),
            '" height="', toString(handleLen),
            '" fill="',   accent, '"/>',
            '<circle cx="200" cy="',
            toString(200 + bladeLen / 2 + guardH / 2 + handleLen + 8),
            '" r="8" fill="', accent, '"/>',
            "</g>"
        ));
    }

    function buildSword(uint256 size, uint256 hue, uint256 rotation) internal pure returns (string memory) {
        string memory color  = buildHSL(hue, 80, 55);
        string memory accent = buildHSL((hue + 30) % 360, 70, 45);
        string memory rotStr = toString(rotation);

        uint256 bladeLen  = 140 + size;
        uint256 bladeW    = 18  + size / 4;
        uint256 tipLen    = 24  + size / 6;
        uint256 guardW    = 90  + size / 2;
        uint256 guardH    = 12  + size / 6;
        uint256 handleLen = 42  + size / 6;
        uint256 handleW   = 16  + size / 6;

        return string(abi.encodePacked(
            _swordBlade(color, rotStr, bladeW, bladeLen, tipLen),
            _swordGuardAndHandle(accent, bladeLen, guardW, guardH, handleW, handleLen)
        ));
    }

    // ─────────────────────────────────────────────────────────────
    //  Gun
    // ─────────────────────────────────────────────────────────────

    function _gunBody(
        string memory color,
        string memory rotStr,
        uint256 bodyW,
        uint256 bodyH
    ) private pure returns (string memory) {
        return string(abi.encodePacked(
            '<g transform="rotate(', rotStr, ' 200 200)">',
            '<rect x="',  toString(200 - bodyW / 2),
            '" y="',      toString(200 - bodyH / 2),
            '" width="',  toString(bodyW),
            '" height="', toString(bodyH),
            '" fill="',   color, '"/>'
        ));
    }

    function _gunDetails(
        string memory accent,
        uint256 bodyW,
        uint256 bodyH,
        uint256 barrelW,
        uint256 barrelH,
        uint256 gripW,
        uint256 gripH
    ) private pure returns (string memory) {
        return string(abi.encodePacked(
            '<rect x="',  toString(200 + bodyW / 2 - barrelW),
            '" y="',      toString(200 - bodyH / 2 - barrelH),
            '" width="',  toString(barrelW),
            '" height="', toString(barrelH),
            '" fill="',   accent, '"/>',
            '<rect x="',  toString(200 - bodyW / 6),
            '" y="',      toString(200 + bodyH / 2),
            '" width="',  toString(gripW),
            '" height="', toString(gripH),
            '" fill="',   accent, '"/>',
            '<rect x="',  toString(200 + bodyW / 6),
            '" y="',      toString(200 + bodyH / 2 - 6),
            '" width="20" height="14" fill="', accent, '"/>',
            "</g>"
        ));
    }

    function buildGun(uint256 size, uint256 hue, uint256 rotation) internal pure returns (string memory) {
        string memory color  = buildHSL(hue, 80, 55);
        string memory accent = buildHSL((hue + 30) % 360, 70, 45);
        string memory rotStr = toString(rotation);

        uint256 bodyW   = 170 + size;
        uint256 bodyH   = 40  + size / 6;
        uint256 barrelW = 70  + size / 3;
        uint256 barrelH = 18  + size / 8;
        uint256 gripW   = 40  + size / 6;
        uint256 gripH   = 60  + size / 4;

        return string(abi.encodePacked(
            _gunBody(color, rotStr, bodyW, bodyH),
            _gunDetails(accent, bodyW, bodyH, barrelW, barrelH, gripW, gripH)
        ));
    }

    // ─────────────────────────────────────────────────────────────
    //  Arrow
    // ─────────────────────────────────────────────────────────────

    function _arrowShaft(
        string memory color,
        string memory rotStr,
        uint256 shaftLen,
        uint256 shaftW
    ) private pure returns (string memory) {
        return string(abi.encodePacked(
            '<g transform="rotate(', rotStr, ' 200 200)">',
            '<rect x="',  toString(200 - shaftLen / 2),
            '" y="',      toString(200 - shaftW / 2),
            '" width="',  toString(shaftLen),
            '" height="', toString(shaftW),
            '" fill="',   color, '"/>'
        ));
    }

    function _arrowHeadAndFletch(
        string memory color,
        string memory accent,
        uint256 shaftLen,
        uint256 shaftW,
        uint256 headLen,
        uint256 fletchW,
        uint256 fletchH
    ) private pure returns (string memory) {
        return string(abi.encodePacked(
            '<polygon points="',
            toString(200 + shaftLen / 2 + headLen), ",200 ",
            toString(200 + shaftLen / 2), ",", toString(200 - shaftW / 2 - headLen / 2),
            " ", toString(200 + shaftLen / 2), ",", toString(200 + shaftW / 2 + headLen / 2),
            '" fill="', color, '"/>',
            '<polygon points="',
            toString(200 - shaftLen / 2 - fletchW), ",", toString(200 - fletchH / 2),
            " ", toString(200 - shaftLen / 2), ",200 ",
            toString(200 - shaftLen / 2 - fletchW), ",", toString(200 + fletchH / 2),
            '" fill="', accent, '"/>',
            "</g>"
        ));
    }

    function buildArrow(uint256 size, uint256 hue, uint256 rotation) internal pure returns (string memory) {
        string memory color  = buildHSL(hue, 80, 55);
        string memory accent = buildHSL((hue + 30) % 360, 70, 45);
        string memory rotStr = toString(rotation);

        uint256 shaftLen = 190 + size;
        uint256 shaftW   = 12  + size / 8;
        uint256 headLen  = 28  + size / 6;
        uint256 fletchW  = 28  + size / 6;
        uint256 fletchH  = 18  + size / 8;

        return string(abi.encodePacked(
            _arrowShaft(color, rotStr, shaftLen, shaftW),
            _arrowHeadAndFletch(color, accent, shaftLen, shaftW, headLen, fletchW, fletchH)
        ));
    }

    function _bowBody(
        string memory color,
        uint256 bowW,
        uint256 bowH,
        uint256 strokeW
    ) private pure returns (string memory) {
        return string(abi.encodePacked(
            '<path d="M ',
            toString(200 - bowW / 2), " ", toString(200 - bowH / 2),
            " Q ", toString(200 + bowW / 2), " 200 ",
            toString(200 - bowW / 2), " ", toString(200 + bowH / 2),
            '" stroke="', color,
            '" stroke-width="', toString(strokeW),
            '" fill="none"/>'
        ));
    }

    function _bowString(
        string memory accent,
        uint256 bowW,
        uint256 bowH
    ) private pure returns (string memory) {
        return string(abi.encodePacked(
            '<line x1="', toString(200 - bowW / 2),
            '" y1="', toString(200 - bowH / 2),
            '" x2="', toString(200 - bowW / 2),
            '" y2="', toString(200 + bowH / 2),
            '" stroke="', accent, '" stroke-width="4"/>'
        ));
    }

    function buildBowAndArrow(uint256 size, uint256 hue, uint256 rotation) internal pure returns (string memory) {
        string memory color  = buildHSL(hue, 80, 55);
        string memory accent = buildHSL((hue + 30) % 360, 70, 45);
        string memory rotStr = toString(rotation);

        uint256 bowH    = 170 + size;
        uint256 bowW    = 70  + size / 3;
        uint256 strokeW = 10  + size / 8;
        uint256 shaftLen = 140 + size;
        uint256 shaftW   = 10  + size / 8;
        uint256 headLen  = 22  + size / 6;
        uint256 headW    = 20  + size / 6;

        return string(abi.encodePacked(
            '<g transform="rotate(', rotStr, ' 200 200)">',
            _bowBody(color, bowW, bowH, strokeW),
            _bowString(accent, bowW, bowH),
            '<rect x="',  toString(200 - shaftLen / 2),
            '" y="',      toString(200 - shaftW / 2),
            '" width="',  toString(shaftLen),
            '" height="', toString(shaftW),
            '" fill="',   accent, '"/>',
            '<polygon points="',
            toString(200 + shaftLen / 2 + headLen), ",200 ",
            toString(200 + shaftLen / 2), ",", toString(200 - headW / 2),
            " ", toString(200 + shaftLen / 2), ",", toString(200 + headW / 2),
            '" fill="', accent, '"/>',
            "</g>"
        ));
    }

    // ─────────────────────────────────────────────────────────────
    //  Axe
    // ─────────────────────────────────────────────────────────────

    function _axeHandle(
        string memory accent,
        string memory rotStr,
        uint256 handleW,
        uint256 handleLen
    ) private pure returns (string memory) {
        return string(abi.encodePacked(
            '<g transform="rotate(', rotStr, ' 200 200)">',
            '<rect x="',  toString(200 - handleW / 2),
            '" y="',      toString(200 - handleLen / 2),
            '" width="',  toString(handleW),
            '" height="', toString(handleLen),
            '" fill="',   accent, '"/>'
        ));
    }

    function _axeHead(
        string memory color,
        uint256 handleW,
        uint256 headW,
        uint256 headH
    ) private pure returns (string memory) {
        return string(abi.encodePacked(
            '<polygon points="',
            toString(200 + handleW / 2), ",", toString(200 - headH / 2),
            " ", toString(200 + handleW / 2 + headW), ",", toString(200),
            " ", toString(200 + handleW / 2), ",", toString(200 + headH / 2),
            " ", toString(200 + handleW / 2 + headW / 3), ",", toString(200),
            '" fill="', color, '"/>',
            "</g>"
        ));
    }

    function buildAxe(uint256 size, uint256 hue, uint256 rotation) internal pure returns (string memory) {
        string memory color  = buildHSL(hue, 80, 55);
        string memory accent = buildHSL((hue + 30) % 360, 70, 45);
        string memory rotStr = toString(rotation);

        uint256 handleLen = 180 + size;
        uint256 handleW   = 18  + size / 6;
        uint256 headW     = 90  + size / 3;
        uint256 headH     = 70  + size / 3;

        return string(abi.encodePacked(
            _axeHandle(accent, rotStr, handleW, handleLen),
            _axeHead(color, handleW, headW, headH)
        ));
    }

    // ─────────────────────────────────────────────────────────────
    //  Spear
    // ─────────────────────────────────────────────────────────────

    function _spearShaft(
        string memory accent,
        string memory rotStr,
        uint256 shaftLen,
        uint256 shaftW
    ) private pure returns (string memory) {
        return string(abi.encodePacked(
            '<g transform="rotate(', rotStr, ' 200 200)">',
            '<rect x="',  toString(200 - shaftLen / 2),
            '" y="',      toString(200 - shaftW / 2),
            '" width="',  toString(shaftLen),
            '" height="', toString(shaftW),
            '" fill="',   accent, '"/>'
        ));
    }

    function _spearTip(
        string memory color,
        uint256 shaftLen,
        uint256 tipLen,
        uint256 tipW
    ) private pure returns (string memory) {
        return string(abi.encodePacked(
            '<polygon points="',
            toString(200 + shaftLen / 2 + tipLen), ",200 ",
            toString(200 + shaftLen / 2), ",", toString(200 - tipW / 2),
            " ", toString(200 + shaftLen / 2), ",", toString(200 + tipW / 2),
            '" fill="', color, '"/>',
            "</g>"
        ));
    }

    function buildSpear(uint256 size, uint256 hue, uint256 rotation) internal pure returns (string memory) {
        string memory color  = buildHSL(hue, 80, 55);
        string memory accent = buildHSL((hue + 30) % 360, 70, 45);
        string memory rotStr = toString(rotation);

        uint256 shaftLen = 200 + size;
        uint256 shaftW   = 12  + size / 8;
        uint256 tipLen   = 36  + size / 5;
        uint256 tipW     = 32  + size / 6;

        return string(abi.encodePacked(
            _spearShaft(accent, rotStr, shaftLen, shaftW),
            _spearTip(color, shaftLen, tipLen, tipW)
        ));
    }

    // ─────────────────────────────────────────────────────────────
    //  SVG Root Builder
    // ─────────────────────────────────────────────────────────────

    function weaponLabel(uint256 pattern) internal pure returns (string memory) {
        if (pattern == 0) return "Sword";
        if (pattern == 1) return "Gun";
        if (pattern == 2) return "Bow & Arrow";
        if (pattern == 3) return "Axe";
        if (pattern == 4) return "Spear";
        return "Arrow";
    }

    function buildSVG(uint256 seed, uint256 tokenId, string memory traitLabel) internal pure returns (string memory) {
        uint256 hue         = seed % 360;
        uint256 bgLightness = (seed >> 8)  % 100;
        uint256 shapeSize   = (seed >> 16) % 50;
        uint256 pattern     = (seed >> 24) % 6;
        uint256 rotation    = (seed >> 32) % 360;
        uint256 bgHue       = (hue + 180)  % 360;

        string memory bg    = buildHSL(bgHue, 40, bgLightness < 20 ? 20 : bgLightness);
        string memory inner = buildHSL(bgHue, 30, bgLightness < 25 ? 25 : bgLightness - 5);
        string memory shape = buildShape(pattern, shapeSize, hue, rotation);
        string memory idStr = toString(tokenId);
        string memory label = weaponLabel(pattern);

        string memory header = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
            '<rect width="400" height="400" fill="', bg, '"/>',
            '<circle cx="200" cy="200" r="160" fill="', inner, '"/>'
        ));

        string memory footer = string(abi.encodePacked(
            '<text x="200" y="356" text-anchor="middle" font-family="monospace" font-size="16" fill="white">',
            label,
            "</text>",
            '<text x="200" y="338" text-anchor="middle" font-family="monospace" font-size="12" fill="white">',
            "Traits: ", traitLabel,
            "</text>",
            '<text x="200" y="376" text-anchor="middle" font-family="monospace" font-size="12" fill="white">ID #',
            idStr,
            "</text></svg>"
        ));

        return string(abi.encodePacked(header, shape, footer));
    }

    // ─────────────────────────────────────────────────────────────
    //  Base64 Encoder
    // ─────────────────────────────────────────────────────────────

    function encode(bytes memory data) internal pure returns (string memory) {
        bytes memory TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        uint256 len = data.length;
        if (len == 0) return "";

        uint256 encodedLen = 4 * ((len + 2) / 3);
        bytes memory result = new bytes(encodedLen + 32);
        bytes memory table  = TABLE;

        assembly {
            let tablePtr  := add(table, 1)
            let resultPtr := add(result, 32)
            for { let i := 0 } lt(i, len) {} {
                i := add(i, 3)
                let input := and(mload(sub(add(data, i), 0)), 0xffffff)
                let out   := mload(add(tablePtr, and(shr(18, input), 0x3F)))
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
