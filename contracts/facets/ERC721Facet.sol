// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AppStorage, Traits, RequestStatus} from "../libraries/AppStorage.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";
import {IERC721} from "../interfaces/IERC721.sol";
import {LibMultisig} from "../libraries/LibMultisig.sol";

contract ERC721Facet is IERC721 {
    AppStorage internal s;

    function balanceOf(address _owner) external view override returns (uint256) {
        require(_owner != address(0), "ERC721: zero address");
        return s.addressToNFTBalance[_owner];
    }

    function ownerOf(uint256 _tokenId) external view override returns (address) {
        address owner = s.tokenIdToOwner[_tokenId];
        require(owner != address(0), "ERC721: token does not exist");
        return owner;
    }

    function getApproved(uint256 _tokenId) external view override returns (address) {
        require(s.tokenIdToOwner[_tokenId] != address(0), "ERC721: token does not exist");
        return s.tokenIdToApproved[_tokenId];
    }

    function isApprovedForAll(address _owner, address _operator) external view override returns (bool) {
        return s.isApprovedForAll[_owner][_operator];
    }

    function totalSupply() external view returns (uint256) {
        return s.totalNFTSupply - s.totalNFTBurned;
    }

    function name() external view returns (string memory) {
        return s.nftName;
    }

    function symbol() external view returns (string memory) {
        return s.nftSymbol;
    }

    function tokenURI(uint256 _tokenId) external view returns (string memory) {
        require(s.tokenIdToOwner[_tokenId] != address(0), "ERC721: token does not exist");
        return ISVGFacet(address(this)).buildTokenURI(_tokenId);
    }

    function getTokenData(uint256 _tokenId) public view returns (Traits memory) {
        require(s.tokenIdToOwner[_tokenId] != address(0), "ERC721: token does not exist");
        return resolveTraits(_tokenId);
    }

    function approve(address _to, uint256 _tokenId) external override {
        address owner = s.tokenIdToOwner[_tokenId];
        require(owner != address(0), "ERC721: token does not exist");
        require(
            msg.sender == owner || s.isApprovedForAll[owner][msg.sender],
            "ERC721: caller is not owner nor approved for all"
        );
        s.tokenIdToApproved[_tokenId] = _to;
        emit Approval(owner, _to, _tokenId);
    }

    function setApprovalForAll(address _operator, bool _approved) external override {
        require(_operator != msg.sender, "ERC721: approve to caller");
        s.isApprovedForAll[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    function transferFrom(address _from, address _to, uint256 _tokenId) external override {
        address owner = s.tokenIdToOwner[_tokenId];
        require(owner != address(0), "ERC721: token does not exist");
        require(owner == _from, "ERC721: transfer from incorrect owner");
        require(_to != address(0), "ERC721: transfer to zero address");
        require(
            msg.sender == owner ||
            s.tokenIdToApproved[_tokenId] == msg.sender ||
            s.isApprovedForAll[owner][msg.sender],
            "ERC721: caller is not owner nor approved"
        );

        s.addressToNFTBalance[_from] -= 1;
        s.addressToNFTBalance[_to] += 1;
        s.tokenIdToOwner[_tokenId] = _to;
        s.tokenIdToApproved[_tokenId] = address(0);

        emit Transfer(_from, _to, _tokenId);
    }

    function initialize(string memory _name, string memory _symbol) external {
        require(bytes(s.nftName).length == 0, "ERC721: already initialized");
        LibMultisig.enforceIsMultisig();
        
        s.nftName = _name;
        s.nftSymbol = _symbol;
    }

    function mint() external {
        LibMultisig.enforceIsMultisig();
        _mint(address(this));
    }

    function batchMint(uint256 _count) external {
        LibMultisig.enforceIsMultisig();
        require(_count > 0, "ERC721: count must be > 0");
        for (uint256 i; i < _count; i++) {
            _mint(address(this));
        }
    }

    function _mint(address _to) internal {
        require(_to != address(0), "ERC721: mint to zero address");
        s.totalNFTSupply += 1;
        uint256 tokenId = s.totalNFTSupply;
        s.tokenIdToOwner[tokenId] = _to;
        s.addressToNFTBalance[_to] += 1;
        // Keep minting available even if VRF config/coordinator is temporarily unavailable.
        // Traits remain unset until a valid randomness request can be made.
        (bool vrfOk, ) = address(this).call(abi.encodeWithSelector(IVRFFacet.getWords.selector, tokenId));
        vrfOk;
        emit Transfer(address(0), _to, tokenId);
    }

    function resolveTraits(uint256 _tokenId) internal view returns (Traits memory t) {
        uint256 requestId = s.nftTraits[_tokenId].requestId;
        t.requestId = requestId;
        if (requestId == 0) return t;

        RequestStatus storage status = s.requests[requestId];
        if (!status.fulfilled || status.randomWords.length < 2) return t;

        uint256 rand0 = status.randomWords[0];

        uint256 bucket = rand0 % 100;
        if (bucket < 70) {
            t.attack = uint16(rand0);
            t.defense = 0;
            t.mage = false;
        } else if (bucket < 97) {
            t.attack = 0;
            t.defense = 0xffff & uint16((rand0 >> 10));
            t.mage = false;
        } else {
            t.attack = 0;
            t.defense = 0;
            t.mage = true;
        }
    }
}

interface IVRFFacet {
    function getWords(uint256 _tokenId) external returns (uint256 requestId);
}

interface ISVGFacet {
    function buildTokenURI(uint256 _tokenId) external view returns (string memory);
}