// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AppStorage} from "./AppStorage.sol";
import {IERC20} from "../interfaces/IERC20.sol";

library LibERC20 {
    function mint(AppStorage storage s, address _to, uint256 _amount) internal {
        require(_to != address(0), "ERC20: mint to zero address");
        s.totalERC20Supply += _amount;
        s.erc20Balances[_to] += _amount;
        emit IERC20.Transfer(address(0), _to, _amount);
    }

    function burn(AppStorage storage s, address _from, uint256 _amount) internal {
        require(s.erc20Balances[_from] >= _amount, "ERC20: burn exceeds balance");
        unchecked {
            s.erc20Balances[_from] -= _amount;
        }
        s.totalERC20Supply -= _amount;
        emit IERC20.Transfer(_from, address(0), _amount);
    }

    function transfer(AppStorage storage s, address _from, address _to, uint256 _amount) internal {
        require(_from != address(0), "ERC20: from zero address");
        require(_to != address(0), "ERC20: to zero address");
        require(s.erc20Balances[_from] >= _amount, "ERC20: insufficient balance");
        unchecked {
            s.erc20Balances[_from] -= _amount;
        }
        s.erc20Balances[_to] += _amount;
        emit IERC20.Transfer(_from, _to, _amount);
    }
}
