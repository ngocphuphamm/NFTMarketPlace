// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract MarketPlace  is Ownable {
    using Counters for Counters.Counter;
    // thu vien nay nhu 1 kho chua du lieu 
    using EnumerableSet for EnumerableSet.AddressSet; 

    //// VARIABLE
    //  token daduoc ban de _buyer address 0 
    //  order cancel xoa struct Order khoi mapping  
    struct Order{
        address seller;
        address buyer;
        uint256 tokenId;
        address paymentToken;     
        uint256 price ; 
    }

    Counters.Counter private _orderIdCount;

    mapping(uint256 => Order) _orders;

    IERC721 public immutable _nftContract;    

    // phi giao dich 
    uint256 public _feeDecimal ;
    uint256 public _feeRate ;
    // dia chi vi nhan phi giao dich 
    address public _feeRecipient;

    // chap nhan thanh khoan nhieu loaij erc20 
    EnumerableSet.AddressSet private _supportedPaymentTokens;

    // EVENT
    event OrderAdded(
        uint256 indexed orderId ,
        address indexed seller ,
        uint256 indexed tokenId ,
        address paymentToken,
        uint256 price   
    );

    event OrderCancelled (
        uint256 indexed orderId 
    );
    // khi order tao ra co nguoi mua 
    event OrderMatched (
        uint256 indexed orderId,
        address indexed seller ,
        address indexed buyer ,
        uint256 tokenId,
        address paymentToken,
        uint256 price
    );
    
    event FeeRateUpdate(
        uint256 feeDecimal,
        uint256 feeRate
    );

    constructor(
        address nftAddress_,
        uint256 feeDecimal_,
        uint256 feeRate_,
        address feeRecipient_
    ) {
          require(nftAddress_ != address(0), "NFTMarketplace: nftAddress_ is zero address");
          require(feeRecipient_ != address(0), "NFTMarketplace: feeRecipientl_ is zero address");
          _nftContract = IERC721(nftAddress_);
          _updateFeeRecipient(feeRecipient_);
          _updateFeeRate(feeDecimal_, feeRate_);
          _orderIdCount.increment();
    }

    // MODIFIER
    modifier onlySupportPaymentToken(address paymentToken)
    {
        require(isPaymentTokenSupported(paymentToken),"NFTMarketplace: unsupport payment token");
        _;
    }


    // FUNCTION 
    function _updateFeeRecipient(address feeRecipient) internal {
          require(feeRecipient != address(0), "NFTMarketplace: feeRecipientl_ is zero address");
          _feeRecipient =  feeRecipient;        
    }

    function updateFeeRecipient(address feeRecipient) external onlyOwner {
        _updateFeeRecipient(feeRecipient);
    }

    function _updateFeeRate(uint256 feeDecimal , uint256 feeRate ) internal {
        require(
            feeRate <  10 ** (feeDecimal + 2),
            "NFTMarketplace: bad fee rate"
        );
        // nguyen nhan require 
        // phan tram fee  bat buoc <  100%
        // vd 
        // ap dung feeRate 10% , decimal : 0 
        // 10 < 100
        // ap dung feeRate: 0.1% => 1%, decimal : 1
        // 1 < 1000 => 0.1%
        // vi du feeRate lon 21.321 thi decimal cao hon 
        _feeRate = feeRate;
        emit FeeRateUpdate(feeDecimal, feeRate);
    }

    function updateFeeRate(uint256 feeDecimal,uint256 feeRate) external  onlyOwner {
        _updateFeeRate(feeDecimal, feeRate);
    }


    // caculate fee
    function _calculateFee(uint256 orderId) private view returns (uint256)
    {
       Order storage _order = _orders[orderId];
       if(_feeRate == 0 )
            return 0;
        return (_feeRate * _order.price) / 10 ** (_feeDecimal + 2 );
        // feeRate : 10 
        // _feeDecimal : 0 
        // price : 100 
        // ve chia = 10 ^2  = 100
        // (10 * (100 * 10**18))/ vechia 
        // => 0.1 => lay duoc 10% cua order nay 

    }

    // check orderId thuoc nguoi seller hay khong 
    function isSeller(uint256 orderId, address seller) public view returns (bool) {
        return _orders[orderId].seller == seller;
    }  

    // support supportPaymentToken 
    // add vao asset payment Token 
     function addPaymentToken (address paymentToken) external onlyOwner{
        require(paymentToken != address(0),"NFTMarketPlace : paymentToken is zero address");
        require(_supportedPaymentTokens.add(paymentToken),"NFTMarketplace: already supported");
     }

     // kiem tra da add vao paymenToken 
     function isPaymentTokenSupported(address paymentToken) public  view  returns(bool){
        return _supportedPaymentTokens.contains(paymentToken);
     }  


    // add nft vao market place
    function addOrder (uint256 tokenId, address paymentToken , uint256 price ) 
     public  onlySupportPaymentToken(paymentToken) 
    {
        require(_nftContract.ownerOf(tokenId) == msg.sender ,"NFTMarketplace: sender is not owner of token");
        require(_nftContract.getApproved(tokenId) == address(this) || 
                _nftContract.isApprovedForAll(_msgSender(), address(this))
                ,"NFTMarketplace: The contract is unauthorized to manage this token");
        require(price > 0, "NFTMarketplace: price must be greater than 0");
        uint256 orderId = _orderIdCount.current();
        _orders[orderId] = Order(_msgSender(),address(0),tokenId,paymentToken,price);
        _orderIdCount.increment();
        // transfer nft nguoi goi ham vao marketplace
        // nguoi msg.sender phai approve cho marketplace khong se bi loi transferFrom 
        _nftContract.transferFrom(_msgSender(),address(this),tokenId);
        emit OrderAdded(orderId,_msgSender(),tokenId,paymentToken,price);
    }

    // cancel order 
    function cancelOrder(uint256 orderId ) external {
        Order storage  order = _orders[orderId] ;
        require(order.buyer == address(0),"NFTMarketplace: buyer must be zero");
        require(order.seller == _msgSender(), "NFTMarketplace: must be owner");
        uint256 tokenId = order.tokenId;
        delete _orders[orderId];
        _nftContract.transferFrom(address(this),_msgSender(),tokenId);
        emit OrderCancelled(orderId);
    }

    function executeOrder(uint256 orderId) external {
        Order storage order = _orders[orderId];
        // kiem tra xem order cancel roi hoac khong to ntai 
        require(!isSeller(orderId,msg.sender), "NFTMarketplace: buyer must be different from seller" );
        require(order.price > 0 ,"NFTMarketplace: order has been canceled");
        require(order.buyer == address(0),"NFTMarketplace: buyer must be zero");
     
        // update 
        order.buyer = msg.sender;
        // tinh  fee
        uint256 feeAmount = _calculateFee(orderId);
        if(feeAmount > 0 )
        {
            // chuyen phi fee cho  tai khoan trung gian 
            IERC20(order.paymentToken).transferFrom(msg.sender,_feeRecipient,feeAmount);
        }
        // chuyen token tuong ung voi order price 
        IERC20(order.paymentToken).transferFrom(msg.sender,order.seller,order.price - feeAmount);
        _nftContract.transferFrom(address(this),msg.sender,order.tokenId);
        emit OrderMatched(orderId, order.seller,order.buyer,order.tokenId,order.paymentToken,order.price);
    }
}   
