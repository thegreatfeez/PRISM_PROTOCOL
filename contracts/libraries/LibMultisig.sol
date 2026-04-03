// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library LibMultisig {
    function enforceIsMultisig() internal view {
        require(msg.sender == address(this), "Multisig: not authorized");
    }
}
