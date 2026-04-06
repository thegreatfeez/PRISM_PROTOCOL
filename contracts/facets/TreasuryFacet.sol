// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AppStorage} from "../libraries/AppStorage.sol";
import {LibERC20} from "../libraries/LibERC20.sol";
import {LibMultisig} from "../libraries/LibMultisig.sol";

contract TreasuryFacet {
    AppStorage internal s;

    event TreasuryWithdrawERC20(address indexed to, uint256 amount);
    event TreasuryWithdrawETH(address indexed to, uint256 amount);

    function withdrawTreasuryERC20(address _to, uint256 _amount) external {
        LibMultisig.enforceIsMultisig();
        require(s.isMultisigOwner[_to], "Treasury: not multisig owner");
        require(_amount > 0, "Treasury: amount zero");
        LibERC20.transfer(s, address(this), _to, _amount);
        emit TreasuryWithdrawERC20(_to, _amount);
    }

    function withdrawTreasuryETH(address payable _to, uint256 _amount) external {
        LibMultisig.enforceIsMultisig();
        require(s.isMultisigOwner[_to], "Treasury: not multisig owner");
        uint256 amount = _amount == 0 ? address(this).balance : _amount;
        require(amount > 0, "Treasury: amount zero");
        (bool ok, ) = _to.call{value: amount}("");
        require(ok, "Treasury: ETH transfer failed");
        emit TreasuryWithdrawETH(_to, amount);
    }
}
