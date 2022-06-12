// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./ReservedCounter.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract IntelligibleIdentity is ERC721, ReservedCounter {
    constructor(string memory name, string memory symbol)
        public
        ERC721(name, symbol)
    {}

    function newIdentityFromReserved(
        address idAddress,
        string memory tokenURI,
        uint256 reservedId
    ) public {
        freeId(reservedId);
        _newToken(idAddress, tokenURI, reservedId);
    }

    function newIdentity(address idAddress, string memory tokenURI)
        public
        returns (uint256)
    {
        uint256 tokenId = _nextId();
        _newToken(idAddress, tokenURI, tokenId);

        return tokenId;
    }

    function _newToken(
        address idAddress,
        string memory tokenURI,
        uint256 tokenId
    ) private {
        _mint(idAddress, tokenId);
        _setTokenURI(tokenId, tokenURI);
    }
}
