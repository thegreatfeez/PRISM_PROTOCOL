// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AppStorage} from "../libraries/AppStorage.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";
import {IERC721} from "../interfaces/IERC721.sol";

contract ERC721Facet is IERC721 {
    AppStorage internal s;

    function balanceOf(address _owner) external view override returns (uint256) {
        require(_owner != address(0), "ERC721: zero address");
        return s.addressToBalance[_owner];
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

        s.addressToBalance[_from] -= 1;
        s.addressToBalance[_to] += 1;
        s.tokenIdToOwner[_tokenId] = _to;
        s.tokenIdToApproved[_tokenId] = address(0);

        emit Transfer(_from, _to, _tokenId);
    }

    function tokenURI(uint256 _tokenId) external view returns (string memory) {
        require(s.tokenIdToOwner[_tokenId] != address(0), "ERC721: token does not exist");
        return s.baseURI;
    }

    function mint(address _to) external {
        LibDiamond.enforceIsContractOwner();
        require(_to != address(0), "ERC721: mint to zero address");
        s.totalSupply += 1;
        uint256 tokenId = s.totalSupply;
        s.tokenIdToOwner[tokenId] = _to;
        s.addressToBalance[_to] += 1;
        emit Transfer(address(0), _to, tokenId);
    }


    function initialize(string memory _name, string memory _symbol, string memory _baseURI) external {
        require(bytes(s.name).length == 0, "ERC721: already initialized");
        s.name = _name;
        s.symbol = _symbol;
        s.baseURI = _baseURI;
    }
}
