// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AppStorage} from "../libraries/AppStorage.sol";
import {LibERC20} from "../libraries/LibERC20.sol";
import {LibMultisig} from "../libraries/LibMultisig.sol";
import {IERC20} from "../interfaces/IERC20.sol";

contract ERC20Facet is IERC20 {
    AppStorage internal s;

    function initERC20(string memory _name, string memory _symbol, uint8 _decimals) external {
        require(s.erc20Decimals == 0, "ERC20: already initialized");
        LibMultisig.enforceIsMultisig();
        s.erc20Name = _name;
        s.erc20Symbol = _symbol;
        s.erc20Decimals = _decimals;
    }

    function name() external view returns (string memory) {
        return s.erc20Name;
    }

    function symbol() external view returns (string memory) {
        return s.erc20Symbol;
    }

    function decimals() external view returns (uint8) {
        return s.erc20Decimals;
    }

    function totalSupply() external view override returns (uint256) {
        return s.totalERC20Supply;
    }

    function balanceOf(address _account) external view override returns (uint256) {
        return s.erc20Balances[_account];
    }

    function allowance(address _owner, address _spender) external view override returns (uint256) {
        return s.erc20Allowances[_owner][_spender];
    }

    function transfer(address _to, uint256 _amount) external override returns (bool) {
        LibERC20.transfer(s, msg.sender, _to, _amount);
        return true;
    }

    function approve(address _spender, uint256 _amount) external override returns (bool) {
        require(_spender != address(0), "ERC20: approve to zero address");
        s.erc20Allowances[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _amount) external override returns (bool) {
        uint256 currentAllowance = s.erc20Allowances[_from][msg.sender];
        require(currentAllowance >= _amount, "ERC20: insufficient allowance");
        unchecked {
            s.erc20Allowances[_from][msg.sender] = currentAllowance - _amount;
        }
        LibERC20.transfer(s, _from, _to, _amount);
        return true;
    }

    function mintERC20(address _to, uint256 _amount) external {
        LibMultisig.enforceIsMultisig();
        LibERC20.mint(s, _to, _amount);
    }

    function burnERC20(uint256 _amount) external {
        LibERC20.burn(s, msg.sender, _amount);
    }
}
