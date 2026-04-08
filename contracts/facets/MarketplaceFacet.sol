// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AppStorage, Listing} from "../libraries/AppStorage.sol";
import {LibERC20} from "../libraries/LibERC20.sol";
import {LibMultisig} from "../libraries/LibMultisig.sol";

contract MarketplaceFacet {
    AppStorage internal s;

    event Listed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event Sale(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event PriceUpdated(uint256 indexed tokenId, uint256 newPrice);

    function setPlatformFee(uint256 _feeBps) external {
        LibMultisig.enforceIsMultisig();
        require(_feeBps <= 1000, "Marketplace: fee cannot exceed 10%");
        s.platformFeeBps = _feeBps;
    }

    function listNFT(uint256 _tokenId, uint256 _price) external {
        require(s.tokenIdToOwner[_tokenId] == msg.sender, "Marketplace: not token owner");
        require(!s.listings[_tokenId].active, "Marketplace: already listed");
        require(s.stakes[_tokenId].staker == address(0), "Marketplace: token is staked");
        require(s.borrows[_tokenId].borrower == address(0), "Marketplace: token is borrowed");
        require(_price > 0, "Marketplace: price must be nonzero");

        s.listings[_tokenId] = Listing({
            seller: msg.sender,
            price: _price,
            active: true
        });

        emit Listed(_tokenId, msg.sender, _price);
    }

    function cancelListing(uint256 _tokenId) external {
        require(s.listings[_tokenId].seller == msg.sender, "Marketplace: not seller");
        require(s.listings[_tokenId].active, "Marketplace: not listed");

        delete s.listings[_tokenId];

        emit ListingCancelled(_tokenId, msg.sender);
    }

    function updatePrice(uint256 _tokenId, uint256 _newPrice) external {
        require(s.listings[_tokenId].seller == msg.sender, "Marketplace: not seller");
        require(s.listings[_tokenId].active, "Marketplace: not listed");
        require(_newPrice > 0, "Marketplace: price must be nonzero");

        s.listings[_tokenId].price = _newPrice;

        emit PriceUpdated(_tokenId, _newPrice);
    }

    function buyNFT(uint256 _tokenId) external {
        Listing storage listing = s.listings[_tokenId];
        require(listing.active, "Marketplace: not listed");
        require(msg.sender != listing.seller, "Marketplace: seller cannot buy own token");
        require(s.erc20Balances[msg.sender] >= listing.price, "Marketplace: insufficient balance");

        address seller = listing.seller;
        uint256 price  = listing.price;

        uint256 fee            = (price * s.platformFeeBps) / 10000;
        uint256 sellerProceeds = price - fee;

        delete s.listings[_tokenId];

        s.addressToNFTBalance[seller] -= 1;
        s.addressToNFTBalance[msg.sender] += 1;
        s.tokenIdToOwner[_tokenId] = msg.sender;
        s.tokenIdToApproved[_tokenId] = address(0);

        LibERC20.transfer(s, msg.sender, seller, sellerProceeds);

        if (fee > 0) {
            LibERC20.burn(s, msg.sender, fee);
        }

        emit Sale(_tokenId, seller, msg.sender, price);
    }

    function getListing(uint256 _tokenId) external view returns (
        address seller,
        uint256 price,
        bool active
    ) {
        Listing storage listing = s.listings[_tokenId];
        seller = listing.seller;
        price  = listing.price;
        active = listing.active;
    }

    function getActiveListings(uint256[] calldata _tokenIds) external view returns (
        uint256[] memory tokenIds,
        address[] memory sellers,
        uint256[] memory prices
    ) {
        uint256 count;
        for (uint256 i; i < _tokenIds.length; i++) {
            if (s.listings[_tokenIds[i]].active) count++;
        }

        tokenIds = new uint256[](count);
        sellers  = new address[](count);
        prices   = new uint256[](count);

        uint256 index;
        for (uint256 i; i < _tokenIds.length; i++) {
            if (s.listings[_tokenIds[i]].active) {
                tokenIds[index] = _tokenIds[i];
                sellers[index]  = s.listings[_tokenIds[i]].seller;
                prices[index]   = s.listings[_tokenIds[i]].price;
                index++;
            }
        }
    }

    function batchListNFT(uint256[] calldata _tokenIds, uint256 _price) external {
        require(_tokenIds.length > 0, "Marketplace: empty list");
        require(_price > 0, "Marketplace: price must be nonzero");
        for (uint256 i; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            require(s.tokenIdToOwner[tokenId] == msg.sender, "Marketplace: not token owner");
            require(!s.listings[tokenId].active, "Marketplace: already listed");
            require(s.stakes[tokenId].staker == address(0), "Marketplace: token is staked");
            require(s.borrows[tokenId].borrower == address(0), "Marketplace: token is borrowed");
            s.listings[tokenId] = Listing({ seller: msg.sender, price: _price, active: true });
            emit Listed(tokenId, msg.sender, _price);
        }
    }

    function getPlatformFee() external view returns (uint256) {
        return s.platformFeeBps;
    }
}