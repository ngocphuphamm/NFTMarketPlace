//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// dung hoat dong cua contract 
// token khong su dung nua 
import "@openzeppelin/contracts/security/Pausable.sol";
// phan quyen su dung cac function 
import "@openzeppelin/contracts/access/AccessControl.sol";
contract PNP is ERC20,Pausable,AccessControl{
    bytes32 public constant PAUSER_ROLE =  keccak256("PAUSER_ROLE");
    mapping(address => bool) private _blackList;

    event BlackListAdded(address account);
    event BlackListRemove(address account);

    modifier notAcceptBlackList (address to , address from )
    {
        require(_blackList[to] == false , "Account was banned");
        require(_blackList[from] == false , "Account was banned");
        _;
    }

    constructor() ERC20("PHU","PNP")
    {
        _setupRole(DEFAULT_ADMIN_ROLE,msg.sender);
        _setupRole(PAUSER_ROLE,msg.sender);
        _mint(msg.sender,1000000*10**decimals());
    }

    function pause() public onlyRole(PAUSER_ROLE)
    {
        _pause();
    }
    
    function unpause() public onlyRole(PAUSER_ROLE)
    {
        _unpause();
    }
    

    // whenNotPaused : chi duoc goi khi contract khong paused
     function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused notAcceptBlackList(to,from) {
        super._beforeTokenTransfer(from,to,amount);
    }

    function addToBlackList(address _addressBlack) external onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(msg.sender != _addressBlack, "PNP: must not add sender to black list");
        //  Account chưa bị add vào blacklist trước đó

        require(_blackList[_addressBlack] == false , "PNP : ACCOUNT WAS ON BLACKLIST");
        _blackList[_addressBlack] = true;
         emit BlackListAdded(_addressBlack);
    }

    function removeBlackList(address _addressBlack) external onlyRole(DEFAULT_ADMIN_ROLE) returns(bool)
    {
      // Account phải nằm trong blacklist
     require(_blackList[_addressBlack] == true, "PNP : ACCOUNT WAS not ON BLACKLIST");
        _blackList[_addressBlack] = false;
        emit BlackListRemove(_addressBlack);
    }
}