// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AppStorage, BorrowListing, StakeInfo} from "../libraries/AppStorage.sol";
import {LibMultisig} from "../libraries/LibMultisig.sol";

contract StakingFacet {
    AppStorage internal s;

    event Staked(address indexed staker, uint256 indexed tokenId);
    event Unstaked(address indexed staker, uint256 indexed tokenId);

    function setStakeDurations(uint256[] calldata _durations, uint256[] calldata _rewardBps) external {
        LibMultisig.enforceIsMultisig();
        require(_durations.length == _rewardBps.length, "Staking: length mismatch");
        require(_durations.length > 0, "Staking: empty");

        uint256 existing = s.stakeDurations.length;
        for (uint256 i; i < existing; i++) {
            delete s.stakeRewardBps[s.stakeDurations[i]];
        }
        delete s.stakeDurations;

        for (uint256 i; i < _durations.length; i++) {
            uint256 duration = _durations[i];
            uint256 rewardBps = _rewardBps[i];
            require(duration > 0, "Staking: invalid duration");
            require(rewardBps > 0 && rewardBps <= 10000, "Staking: invalid reward bps");
            require(s.stakeRewardBps[duration] == 0, "Staking: duplicate duration");

            s.stakeRewardBps[duration] = rewardBps;
            s.stakeDurations.push(duration);
        }
    }

    function setRewardSplit(uint256 _stakerBps) external {
        LibMultisig.enforceIsMultisig();
        require(_stakerBps <= 10000, "Staking: invalid reward bps");
        s.stakerRewardBps = _stakerBps;
    }

    function stake(uint256 _tokenId, uint256 _duration, uint256 _requiredCollateral) external {
        require(s.tokenIdToOwner[_tokenId] == msg.sender, "Staking: not token owner");
        require(s.stakes[_tokenId].staker == address(0), "Staking: already staked");
        require(s.borrows[_tokenId].borrower == address(0), "Staking: token is borrowed");
        require(!s.listings[_tokenId].active, "Staking: listed for sale");
        require(!s.borrowListings[_tokenId].active, "Staking: already listed");
        require(_requiredCollateral > 0, "Staking: collateral must be nonzero");

        uint256 rewardBps = s.stakeRewardBps[_duration];
        require(rewardBps > 0, "Staking: invalid duration");

        s.tokenIdToApproved[_tokenId] = address(0);
        s.addressToNFTBalance[msg.sender] -= 1;
        s.addressToNFTBalance[address(this)] += 1;
        s.tokenIdToOwner[_tokenId] = address(this);

        s.stakes[_tokenId] = StakeInfo({
            staker: msg.sender,
            stakeExpiry: block.timestamp + _duration,
            rewardBps: rewardBps
        });

        s.borrowListings[_tokenId] = BorrowListing({
            owner: msg.sender,
            requiredCollateral: _requiredCollateral,
            duration: _duration,
            active: true
        });

        emit Staked(msg.sender, _tokenId);
    }

    function unstake(uint256 _tokenId) external {
        StakeInfo storage info = s.stakes[_tokenId];
        require(info.staker == msg.sender, "Staking: not staker");
        require(block.timestamp >= info.stakeExpiry, "Staking: stake active");
        require(s.borrows[_tokenId].borrower == address(0), "Staking: token is borrowed");

        delete s.stakes[_tokenId];
        delete s.borrowListings[_tokenId];

        s.addressToNFTBalance[address(this)] -= 1;
        s.addressToNFTBalance[msg.sender] += 1;
        s.tokenIdToOwner[_tokenId] = msg.sender;

        emit Unstaked(msg.sender, _tokenId);
    }

    function getStakeInfo(uint256 _tokenId) external view returns (address staker, uint256 stakeExpiry, uint256 rewardBps) {
        staker = s.stakes[_tokenId].staker;
        stakeExpiry = s.stakes[_tokenId].stakeExpiry;
        rewardBps = s.stakes[_tokenId].rewardBps;
    }

    function getStakeDurations() external view returns (uint256[] memory durations, uint256[] memory rewardBps) {
        uint256 len = s.stakeDurations.length;
        durations = new uint256[](len);
        rewardBps = new uint256[](len);
        for (uint256 i; i < len; i++) {
            uint256 duration = s.stakeDurations[i];
            durations[i] = duration;
            rewardBps[i] = s.stakeRewardBps[duration];
        }
    }
}
