const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("marketplace", () => {
    let [admin, seller, buyer, feeRecipient, samplePaymentToken] = [];
    let contractNFT; // NFT
    let contractToken; // token
    let contractMP;
    let defaultFeeRate = 10;
    let defaultFeeDecimal = 0;
    let defaultPrice = ethers.utils.parseEther("100");
    let defaultBalance = ethers.utils.parseEther("10000");
    let address0 = "0x0000000000000000000000000000000000000000";
    beforeEach(async () => {
        [admin, seller, buyer, feeRecipient, samplePaymentToken] =
            await ethers.getSigners();
        let ContractNFT = await ethers.getContractFactory("Bin");
        contractNFT = await ContractNFT.deploy();
        await contractNFT.deployed();

        let ContractToken = await ethers.getContractFactory("PNP");
        contractToken = await ContractToken.deploy();
        await contractToken.deployed();

        let ContractMP = await ethers.getContractFactory("MarketPlace");
        contractMP = await ContractMP.deploy(
            contractNFT.address,
            defaultFeeDecimal,
            defaultFeeRate,
            feeRecipient.address
        );
        await contractMP.deployed();
        await contractMP.addPaymentToken(contractToken.address);
        await contractToken.transfer(seller.address, defaultBalance);
        await contractToken.transfer(buyer.address, defaultBalance);
    });

    describe("common", () => {
        it("feeDecimal should return correct value", async () => {
            expect(await contractMP._feeDecimal()).to.be.equal(defaultFeeDecimal);
        });
        it("feeRate should return correct value", async () => {
            expect(await contractMP._feeRate()).to.be.equal(defaultFeeRate);
        });
        it("feeRecipient should return correct value", async () => {
            expect(await contractMP._feeRecipient()).to.be.equal(
                feeRecipient.address
            );
        });
    });
    describe("update FeeRecipient", () => {
        it("should revert if feeRecipient is address 0 ", async () => {
            await expect(contractMP.updateFeeRecipient(address0)).to.be.revertedWith(
                "NFTMarketplace: feeRecipientl_ is zero address"
            );
        });
        it("should revert if sender isn't contract owner", async () => {
            await expect(
                contractMP.connect(buyer).updateFeeRecipient(address0)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("should update correctly", async () => {
            await contractMP.updateFeeRecipient(buyer.address);
            expect(await contractMP._feeRecipient()).to.be.equal(buyer.address);
        });
    });

    describe("updateFeeRate", async () => {
        it("should revert if fee rate >= 10^(feeDecimal+2)", async function () {
            await expect(contractMP.updateFeeRate(0, 100)).to.be.revertedWith(
                "NFTMarketplace: bad fee rate"
            );
        });
        it("should revert if sender isn't contract owner", async function () {
            await expect(
                contractMP.connect(buyer).updateFeeRate(0, 10)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("should update correctly", async function () {
            const updateFeeRateTx = await contractMP.updateFeeRate(0, 20);
            expect(await contractMP._feeDecimal()).to.be.equal(0);
            expect(await contractMP._feeRate()).to.be.equal(20);
            await expect(updateFeeRateTx)
                .to.be.emit(contractMP, "FeeRateUpdate")
                .withArgs(0, 20);
        });
    });
    describe("addPaymentToken", () => {
        it("should revert paymentToken is Address 0", async () => {
            await expect(contractMP.addPaymentToken(address0)).to.be.revertedWith(
                "NFTMarketPlace : paymentToken is zero address"
            );
        });
        it("should revert if address is already supported", async () => {
            await contractMP.addPaymentToken(samplePaymentToken.address);
            await expect(
                contractMP.addPaymentToken(samplePaymentToken.address)
            ).to.be.revertedWith("NFTMarketplace: already supported");
        });
        it("should revert if sender is not contract owner", async function () {
            await expect(
                contractMP.connect(buyer).addPaymentToken(samplePaymentToken.address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("should add payment token correctly", async function () {
            await contractMP.addPaymentToken(samplePaymentToken.address);
            expect(
                await contractMP.isPaymentTokenSupported(samplePaymentToken.address)
            ).to.be.equal(true);
        });
    });

    describe("addOrder",()=>{
        beforeEach(async ()=>{
            await contractNFT.mint(seller.address)
        })
        // loi 
        it("should revert if payment token not supported", async ()=>{
            await contractNFT.connect(seller).setApprovalForAll(contractMP.address, true)
            await expect(contractMP.connect(seller)
                                .addOrder(1, samplePaymentToken.address, defaultPrice))
                                .to
                                .be
                                .revertedWith("NFTMarketplace: unsupport payment token")
        })
        it("should revert if sender isn't nft owner ",async ()=>{
            await contractNFT.connect(seller).setApprovalForAll(contractMP.address,true);
            await expect(contractMP.connect(buyer).addOrder(1,contractToken.address,defaultPrice))
                                    .to.be.revertedWith("NFTMarketplace: sender is not owner of token");
        });
        
        it("should revert if nft hasn't been approve for marketplace contract", async function () {
            await expect(contractMP.connect(seller)
                .addOrder(1, contractToken.address, defaultPrice))
                .to
                .be
                .revertedWith("NFTMarketplace: The contract is unauthorized to manage this token")
        });
        it("should revert if price = 0", async function () {
            await contractNFT.connect(seller).setApprovalForAll(contractMP.address, true)
            await expect(contractMP.connect(seller)
                .addOrder(1, contractToken.address, 0))
                .to
                .be
                .revertedWith("NFTMarketplace: price must be greater than 0")
        });
        it("should add order correctly", async function () {
            await contractNFT.connect(seller).setApprovalForAll(contractMP.address, true)
            const addOrderTx = await contractMP.connect(seller)
                                               .addOrder(1, contractToken.address, defaultPrice)
            await expect(addOrderTx).to.be.emit(contractMP, "OrderAdded")
                                    .withArgs(1, seller.address, 1, contractToken.address, defaultPrice)
            expect(await contractNFT.ownerOf(1)).to.be.equal(contractMP.address)
            await contractNFT.mint(seller.address)
            const addOrderTx2 = await contractMP.connect(seller)
                .addOrder(2, contractToken.address, defaultPrice)
            await expect(addOrderTx2).to.be.emit(contractMP, "OrderAdded")
                .withArgs(2, seller.address, 2, contractToken.address, defaultPrice)
            expect(await contractNFT.ownerOf(2)).to.be.equal(contractMP.address)
        });
    })
    describe("cancelOrder",()=>{
        beforeEach(async ()=>{
            await contractNFT.mint(seller.address);
            await contractNFT.connect(seller).setApprovalForAll(contractMP.address,true);
            await contractMP.connect(seller).addOrder(1,contractToken.address,defaultPrice);
        })
        it("should revert if order has been sold ",async ()=>{
            await contractToken.connect(buyer)
                                .approve(contractMP.address,defaultPrice);
            await contractMP.connect(buyer).executeOrder(1);
            await expect(contractMP.connect(seller).cancelOrder(1))
                                    .to.be.revertedWith("NFTMarketplace: buyer must be zero")
        });
        it("should revert if sender isn't order owner",async ()=>{
            await expect(contractMP.connect(buyer).cancelOrder(1))
                                    .to.be.rejectedWith("NFTMarketplace: must be owne");
        })
        it("should cancel correctly",async ()=>{
            const cancelTx = await contractMP.connect(seller).cancelOrder(1);
            await  expect(cancelTx).to.be.emit(contractMP,"OrderCancelled").withArgs(1);
        })
    })
    describe("executeOrder",()=>{
        beforeEach(async ()=>{
            await contractNFT.mint(seller.address);
            await contractNFT.connect(seller).setApprovalForAll(contractMP.address,true);
            await contractMP.connect(seller).addOrder(1,contractToken.address,defaultPrice);
            await contractToken.connect(buyer).approve(contractMP.address,defaultPrice);
        })
        it("should revert if sender is seller",async ()=>{
            await expect(contractMP.connect(seller).executeOrder(1))
                                    .to.be.revertedWith("NFTMarketplace: buyer must be different from seller")
        })
        it("should revert if order has benn sold",async ()=>{
            await contractMP.connect(buyer).executeOrder(1)
            await expect(contractMP.connect(buyer).executeOrder(1))
                                  .to.be.revertedWith("NFTMarketplace: buyer must be zero")

        })
        it("should revert if order has been cancel",async ()=>{
            await contractMP.connect(seller).cancelOrder(1);
            await expect(contractMP.connect(buyer).executeOrder(1))
                                    .to.be.revertedWith("NFTMarketplace: order has been canceled")
        })
        it("should excute order correctly with default fee",async ()=>{
            const executeTx= await contractMP.connect(buyer).executeOrder(1);
            await expect(executeTx).to.be.emit(contractMP, "OrderMatched")
                                 .withArgs(1, seller.address, buyer.address, 1, contractToken.address, defaultPrice);
            expect(await contractNFT.ownerOf(1)).to.be.equal(buyer.address)
            // seller nhan duoc 90%
            expect(await contractToken.balanceOf(seller.address)).to.be.equal(defaultBalance.add(defaultPrice.mul(90).div(100)));
            expect(await contractToken.balanceOf(buyer.address)).to.be.equal(defaultBalance.sub(defaultPrice));
            // trung gian nhan duoc 10%
            expect(await contractToken.balanceOf(feeRecipient.address)).to.be.equal(defaultPrice.mul(10).div(100))
        })
        it("should excute order correctly with 0 fee", async ()=>{
            await contractMP.updateFeeRate(0,0);
            const executeTx = await contractMP.connect(buyer).executeOrder(1);
            await expect(executeTx).to.be.emit(contractMP,"OrderMatched")
                                    .withArgs(1, seller.address, buyer.address, 1, contractToken.address, defaultPrice)
            expect(await contractNFT.ownerOf(1)).to.be.equal(buyer.address);
            // nhan 100%
            expect(await contractToken.balanceOf(seller.address)).to.be.equal(defaultBalance.add(defaultPrice));
            expect(await contractToken.balanceOf(buyer.address)).to.be.equal*defaultBalance.sub(defaultPrice);
            expect(await contractToken.balanceOf(feeRecipient.address)).to.be.equal(0);
        })
        it("should execute order correctly with fee 1 = 99%", async function () {
            await contractMP.updateFeeRate(0, 99)
            const executeTx = await contractMP.connect(buyer).executeOrder(1)
            await expect(executeTx).to.be.emit(contractMP, "OrderMatched")
                .withArgs(1, seller.address, buyer.address, 1, contractToken.address, defaultPrice)
            expect(await contractNFT.ownerOf(1)).to.be.equal(buyer.address)
            // nhan duoc 1 %
            expect(await contractToken.balanceOf(seller.address)).to.be.equal(defaultBalance.add(defaultPrice.mul(1).div(100)))
            expect(await contractToken.balanceOf(buyer.address)).to.be.equal(defaultBalance.sub(defaultPrice))
            // nhan duoc 99 % 
            expect(await contractToken.balanceOf(feeRecipient.address)).to.be.equal(defaultPrice.mul(99).div(100))
        });
        it("should execute order correctly with fee 2 = 10.11111%", async function () {
            // gia tri dang sau dau phay la co 5 chu so 1 
            // nen decimal => 5
            await contractMP.updateFeeRate(5,1011111)
            const executeTx = await contractMP.connect(buyer).executeOrder(1)
            await expect(executeTx).to.be.emit(contractMP, "OrderMatched")
                .withArgs(1, seller.address, buyer.address, 1, contractToken.address, defaultPrice)
            expect(await contractNFT.ownerOf(1)).to.be.equal(buyer.address)
            // 10000000-1011111 = 8988889  => phan tram nhan duoc  
            //  co 7 so => 7 so 0 dang sau = > 10000000
            expect(await contractToken.balanceOf(seller.address)).to.be.equal(defaultBalance.add(defaultPrice.mul(8988889).div(10000000)))
            expect(await contractToken.balanceOf(buyer.address)).to.be.equal(defaultBalance.sub(defaultPrice))
            expect(await contractToken.balanceOf(feeRecipient.address)).to.be.equal(defaultPrice.mul(1011111).div(10000000))

        });
    })
});
