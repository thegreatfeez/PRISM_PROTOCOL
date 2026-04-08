// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AppStorage} from "../libraries/AppStorage.sol";
import {LibMultisig} from "../libraries/LibMultisig.sol";
import {LibERC20} from "../libraries/LibERC20.sol";

contract FaucetFacet {
    AppStorage internal s;

    uint256 private constant DEFAULT_AMOUNT   = 100 * 10**18; // 100 tokens
    uint256 private constant DEFAULT_COOLDOWN = 12 hours;

    event FaucetClaimed(address indexed claimer, uint256 amount);
    event FaucetAmountSet(uint256 amount);
    event FaucetCooldownSet(uint256 cooldown);

    /// @notice Claim tokens from the faucet. Reverts if cooldown has not elapsed.
    function claimFaucet() external {
        uint256 cooldown = s.faucetCooldown == 0 ? DEFAULT_COOLDOWN : s.faucetCooldown;
        require(
            block.timestamp >= s.lastFaucetClaim[msg.sender] + cooldown,
            "Faucet: cooldown active"
        );

        uint256 amount = s.faucetAmount == 0 ? DEFAULT_AMOUNT : s.faucetAmount;
        require(s.erc20Balances[address(this)] >= amount, "Faucet: insufficient balance");

        s.lastFaucetClaim[msg.sender] = block.timestamp;
        LibERC20.transfer(s, address(this), msg.sender, amount);

        emit FaucetClaimed(msg.sender, amount);
    }

    /// @notice Update the per-claim token amount. Multisig only.
    function setFaucetAmount(uint256 _amount) external {
        LibMultisig.enforceIsMultisig();
        require(_amount > 0, "Faucet: amount must be nonzero");
        s.faucetAmount = _amount;
        emit FaucetAmountSet(_amount);
    }

    /// @notice Update the cooldown period in seconds. Multisig only.
    function setFaucetCooldown(uint256 _cooldown) external {
        LibMultisig.enforceIsMultisig();
        require(_cooldown > 0, "Faucet: cooldown must be nonzero");
        s.faucetCooldown = _cooldown;
        emit FaucetCooldownSet(_cooldown);
    }

    /// @notice Returns the current faucet configuration and contract balance.
    function getFaucetInfo()
        external
        view
        returns (uint256 amount, uint256 cooldown, uint256 balance)
    {
        amount   = s.faucetAmount   == 0 ? DEFAULT_AMOUNT   : s.faucetAmount;
        cooldown = s.faucetCooldown == 0 ? DEFAULT_COOLDOWN : s.faucetCooldown;
        balance  = s.erc20Balances[address(this)];
    }

    /// @notice Returns true if the user has no active cooldown.
    function canClaim(address _user) external view returns (bool) {
        uint256 cooldown = s.faucetCooldown == 0 ? DEFAULT_COOLDOWN : s.faucetCooldown;
        return block.timestamp >= s.lastFaucetClaim[_user] + cooldown;
    }

    /// @notice Returns the Unix timestamp when the user may next claim. 0 = can claim now.
    function getNextClaimTime(address _user) external view returns (uint256) {
        uint256 cooldown = s.faucetCooldown == 0 ? DEFAULT_COOLDOWN : s.faucetCooldown;
        uint256 next     = s.lastFaucetClaim[_user] + cooldown;
        return next > block.timestamp ? next : 0;
    }
}
