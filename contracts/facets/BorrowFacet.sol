// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AppStorage, BorrowInfo, BorrowListing} from "../libraries/AppStorage.sol";
import {LibERC20} from "../libraries/LibERC20.sol";
import {LibMultisig} from "../libraries/LibMultisig.sol";

contract BorrowFacet {
    AppStorage internal s;

    event BorrowListingCreated(uint256 indexed tokenId, address indexed owner, uint256 collateral, uint256 duration);
    event BorrowListingCancelled(uint256 indexed tokenId);
    event NFTBorrowed(uint256 indexed tokenId, address indexed borrower, uint256 deadline);
    event NFTReturned(uint256 indexed tokenId, address indexed borrower);
    event BorrowerLiquidated(uint256 indexed tokenId, address indexed lender);

    function setBorrowFeeRate(uint256 _rate) external {
        LibMultisig.enforceIsMultisig();
        require(_rate <= 10000, "Borrow: invalid fee");
        s.borrowFeeRate = _rate;
    }

    function listForBorrow(
        uint256 _tokenId,
        uint256 _requiredCollateral,
        uint256 _duration
    ) external {
        require(s.tokenIdToOwner[_tokenId] == msg.sender, "Borrow: not token owner");
        require(s.stakes[_tokenId].staker == address(0), "Borrow: token is staked");
        require(s.borrows[_tokenId].borrower == address(0), "Borrow: token is borrowed");
        require(!s.borrowListings[_tokenId].active, "Borrow: already listed");
        require(!s.listings[_tokenId].active, "Borrow: listed for sale");
        require(_requiredCollateral > 0, "Borrow: collateral must be nonzero");
        require(_duration > 0, "Borrow: duration must be nonzero");

        s.borrowListings[_tokenId] = BorrowListing({
            owner: msg.sender,
            requiredCollateral: _requiredCollateral,
            duration: _duration,
            active: true
        });

        emit BorrowListingCreated(_tokenId, msg.sender, _requiredCollateral, _duration);
    }

    function cancelBorrowListing(uint256 _tokenId) external {
        require(s.borrowListings[_tokenId].owner == msg.sender, "Borrow: not listing owner");
        require(s.borrowListings[_tokenId].active, "Borrow: not listed");
        require(s.stakes[_tokenId].staker == address(0), "Borrow: token is staked");
        require(s.borrows[_tokenId].borrower == address(0), "Borrow: currently borrowed");

        delete s.borrowListings[_tokenId];

        emit BorrowListingCancelled(_tokenId);
    }

    function borrow(uint256 _tokenId, uint256 _duration) external {
        BorrowListing storage listing = s.borrowListings[_tokenId];
        require(listing.active, "Borrow: not listed for borrow");
        require(s.borrows[_tokenId].borrower == address(0), "Borrow: already borrowed");
        require(msg.sender != listing.owner, "Borrow: owner cannot borrow own token");
        require(_duration > 0, "Borrow: duration must be nonzero");

        bool isStaked = s.stakes[_tokenId].staker != address(0);
        uint256 maxDuration = listing.duration;
        if (isStaked) {
            uint256 expiry = s.stakes[_tokenId].stakeExpiry;
            require(block.timestamp < expiry, "Borrow: stake expired");
            maxDuration = expiry - block.timestamp;
        }
        require(_duration <= maxDuration, "Borrow: exceeds allowed duration");

        uint256 fee = (listing.requiredCollateral * s.borrowFeeRate) / 10000;
        uint256 totalDeduction = listing.requiredCollateral + fee;
        require(s.erc20Balances[msg.sender] >= totalDeduction, "Borrow: insufficient balance");

        LibERC20.transfer(s, msg.sender, address(this), listing.requiredCollateral);

        uint256 rewardBps = isStaked ? s.stakes[_tokenId].rewardBps : s.stakerRewardBps;
        uint256 stakerShare = (fee * rewardBps) / 10000;
        uint256 treasuryShare = fee - stakerShare;

        if (stakerShare > 0) {
            LibERC20.transfer(s, msg.sender, listing.owner, stakerShare);
        }
        if (treasuryShare > 0) {
            LibERC20.transfer(s, msg.sender, address(this), treasuryShare);
        }

        address currentOwner = s.tokenIdToOwner[_tokenId];
        require(
            currentOwner == listing.owner || (isStaked && currentOwner == address(this)),
            "Borrow: invalid owner"
        );

        s.addressToNFTBalance[currentOwner] -= 1;
        s.addressToNFTBalance[msg.sender] += 1;
        s.tokenIdToOwner[_tokenId] = msg.sender;
        s.tokenIdToApproved[_tokenId] = address(0);

        s.borrows[_tokenId] = BorrowInfo({
            borrower: msg.sender,
            lender: listing.owner,
            collateral: listing.requiredCollateral,
            deadline: block.timestamp + _duration
        });

        listing.active = false;

        emit NFTBorrowed(_tokenId, msg.sender, block.timestamp + _duration);
    }

    function returnNFT(uint256 _tokenId) external {
        BorrowInfo storage info = s.borrows[_tokenId];
        require(info.borrower == msg.sender, "Borrow: not borrower");
        require(block.timestamp <= info.deadline, "Borrow: deadline passed");

        address lender = info.lender;
        uint256 collateral = info.collateral;

        bool isStaked = s.stakes[_tokenId].staker != address(0);
        address returnTo = isStaked ? address(this) : lender;

        s.addressToNFTBalance[msg.sender] -= 1;
        s.addressToNFTBalance[returnTo] += 1;
        s.tokenIdToOwner[_tokenId] = returnTo;
        s.tokenIdToApproved[_tokenId] = address(0);

        delete s.borrows[_tokenId];

        LibERC20.transfer(s, address(this), msg.sender, collateral);

        if (isStaked) {
            if (block.timestamp < s.stakes[_tokenId].stakeExpiry) {
                s.borrowListings[_tokenId].active = true;
            }
        } else {
            s.borrowListings[_tokenId].active = true;
        }

        emit NFTReturned(_tokenId, msg.sender);
    }

    function liquidate(uint256 _tokenId) external {
        BorrowInfo storage info = s.borrows[_tokenId];
        require(info.lender == msg.sender, "Borrow: not lender");
        require(block.timestamp > info.deadline, "Borrow: deadline not passed");

        uint256 collateral = info.collateral;

        delete s.borrows[_tokenId];

        LibERC20.transfer(s, address(this), msg.sender, collateral);

        delete s.borrowListings[_tokenId];
        if (s.stakes[_tokenId].staker != address(0)) {
            delete s.stakes[_tokenId];
        }

        emit BorrowerLiquidated(_tokenId, msg.sender);
    }

    function getBorrowListing(uint256 _tokenId) external view returns (
        address owner,
        uint256 requiredCollateral,
        uint256 duration,
        bool active
    ) {
        BorrowListing storage listing = s.borrowListings[_tokenId];
        owner              = listing.owner;
        requiredCollateral = listing.requiredCollateral;
        if (s.stakes[_tokenId].staker != address(0)) {
            uint256 expiry = s.stakes[_tokenId].stakeExpiry;
            duration = block.timestamp >= expiry ? 0 : expiry - block.timestamp;
        } else {
            duration = listing.duration;
        }
        active             = listing.active;
    }

    function getBorrowInfo(uint256 _tokenId) external view returns (
        address borrower,
        address lender,
        uint256 collateral,
        uint256 deadline
    ) {
        BorrowInfo storage info = s.borrows[_tokenId];
        borrower   = info.borrower;
        lender     = info.lender;
        collateral = info.collateral;
        deadline   = info.deadline;
    }
}
