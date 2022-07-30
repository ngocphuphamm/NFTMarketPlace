// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Bin is ERC721,Ownable{
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCount;
    string private _baseTokenURI;
    constructor() ERC721("Bin","BN")
    {
        
    }

    function mint(address to) public onlyOwner returns(uint256)
    {
        _tokenIdCount.increment();
        uint tokenId = _tokenIdCount.current();
        _mint(to,tokenId);
        return tokenId ; 
    } 

    function _baseURI() internal view virtual override returns(string memory )
    {
        return _baseTokenURI;
    }

    function _updateBaseURI(string memory baseUpdateURI) public  onlyOwner
    {   
        _baseTokenURI = baseUpdateURI;
    }

    
}