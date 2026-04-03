// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AppStorage, BorrowInfo, BorrowListing} from "../libraries/AppStorage.sol";
import {LibERC20} from "../libraries/LibERC20.sol";
import {LibMultisig} from "../libraries/LibMultisig.sol";

contract BorrowFacet {
    AppStorage internal s;

    event NFTBorrowed(uint256 indexed tokenId, address indexed borrower, uint256 deadline);
    event NFTReturned(uint256 indexed tokenId, address indexed borrower);
    event BorrowerLiquidated(uint256 indexed tokenId, address indexed lender);

    uint256 internal constant BORROW_FEE_BPS = 500;
    uint256 internal constant LIQUIDATION_BPS = 15000;

    function setERC20PerEth(uint256 _erc20PerEth) external {
        LibMultisig.enforceIsMultisig();
        require(_erc20PerEth > 0, "Borrow: invalid rate");
        s.erc20PerEth = _erc20PerEth;
    }

    function borrow(uint256 _tokenId, uint256 _duration) external payable {
        BorrowListing storage listing = s.borrowListings[_tokenId];
        require(listing.active, "Borrow: not listed for borrow");
        require(s.borrows[_tokenId].borrower == address(0), "Borrow: already borrowed");
        require(msg.sender != listing.owner, "Borrow: owner cannot borrow own token");
        require(_duration > 0, "Borrow: duration must be nonzero");

        bool isStaked = s.stakes[_tokenId].staker != address(0);
        require(isStaked, "Borrow: must be staked");
        uint256 maxDuration = listing.duration;
        uint256 expiry = s.stakes[_tokenId].stakeExpiry;
        require(block.timestamp < expiry, "Borrow: stake expired");
        maxDuration = expiry - block.timestamp;
        require(_duration <= maxDuration, "Borrow: exceeds allowed duration");

        require(s.erc20PerEth > 0, "Borrow: missing rate");
        uint256 requiredEth = _requiredCollateralEth(listing.price);
        require(msg.value >= requiredEth, "Borrow: insufficient ETH collateral");

        uint256 fee = _borrowFee(listing.price);
        require(s.erc20Balances[msg.sender] >= fee, "Borrow: insufficient balance");
        uint256 stakerShare = (fee * 8000) / 10000;
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
            collateralEth: requiredEth,
            deadline: block.timestamp + _duration
        });

        listing.active = false;

        if (msg.value > requiredEth) {
            (bool ok, ) = msg.sender.call{value: msg.value - requiredEth}("");
            require(ok, "Borrow: refund failed");
        }

        emit NFTBorrowed(_tokenId, msg.sender, block.timestamp + _duration);
    }

    function returnNFT(uint256 _tokenId) external {
        BorrowInfo storage info = s.borrows[_tokenId];
        require(info.borrower == msg.sender, "Borrow: not borrower");
        require(block.timestamp <= info.deadline, "Borrow: deadline passed");

        address lender = info.lender;
        uint256 collateral = info.collateralEth;

        bool isStaked = s.stakes[_tokenId].staker != address(0);
        address returnTo = isStaked ? address(this) : lender;

        s.addressToNFTBalance[msg.sender] -= 1;
        s.addressToNFTBalance[returnTo] += 1;
        s.tokenIdToOwner[_tokenId] = returnTo;
        s.tokenIdToApproved[_tokenId] = address(0);

        delete s.borrows[_tokenId];

        (bool ok, ) = msg.sender.call{value: collateral}("");
        require(ok, "Borrow: refund failed");

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

        uint256 collateral = info.collateralEth;

        uint256 minCollateral = _liquidationThreshold(s.borrowListings[_tokenId].price);
        require(block.timestamp > info.deadline || collateral < minCollateral, "Borrow: not liquidatable");

        delete s.borrows[_tokenId];

        uint256 stakerShare = (collateral * 8000) / 10000;
        uint256 protocolShare = collateral - stakerShare;
        (bool ok1, ) = msg.sender.call{value: stakerShare}("");
        require(ok1, "Borrow: payout failed");
        if (protocolShare > 0) {
            (bool ok2, ) = address(this).call{value: protocolShare}("");
            require(ok2, "Borrow: protocol payout failed");
        }

        delete s.listings[_tokenId];
        delete s.borrowListings[_tokenId];
        if (s.stakes[_tokenId].staker != address(0)) {
            delete s.stakes[_tokenId];
        }

        address currentOwner = s.tokenIdToOwner[_tokenId];
        if (currentOwner != address(0)) {
            s.addressToNFTBalance[currentOwner] -= 1;
            s.tokenIdToOwner[_tokenId] = address(0);
            s.tokenIdToApproved[_tokenId] = address(0);
            s.totalNFTBurned += 1;
        }

        emit BorrowerLiquidated(_tokenId, msg.sender);
    }

    function getBorrowListing(uint256 _tokenId) external view returns (
        address owner,
        uint256 price,
        uint256 duration,
        bool active
    ) {
        BorrowListing storage listing = s.borrowListings[_tokenId];
        owner              = listing.owner;
        price              = listing.price;
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
        uint256 collateralEth,
        uint256 deadline
    ) {
        BorrowInfo storage info = s.borrows[_tokenId];
        borrower   = info.borrower;
        lender     = info.lender;
        collateralEth = info.collateralEth;
        deadline   = info.deadline;
    }

    function getRequiredCollateralEth(uint256 _tokenId) external view returns (uint256) {
        BorrowListing storage listing = s.borrowListings[_tokenId];
        return _requiredCollateralEth(listing.price);
    }

    function _borrowFee(uint256 price) internal pure returns (uint256) {
        return (price * BORROW_FEE_BPS) / 10000;
    }

    function _requiredCollateralEth(uint256 price) internal view returns (uint256) {
        uint256 ethValue = (price * 1e18) / s.erc20PerEth;
        return ethValue * 2;
    }

    function _liquidationThreshold(uint256 price) internal view returns (uint256) {
        uint256 ethValue = (price * 1e18) / s.erc20PerEth;
        return (ethValue * LIQUIDATION_BPS) / 10000;
    }
}
